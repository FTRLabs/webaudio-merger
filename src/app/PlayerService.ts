import { Recording } from './types/Recording'
import { Channel } from './Channel'
import { TrmSlice } from './types/Trm'
import { TrmService } from './TrmService'
import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Injectable } from '@angular/core'
import { Slice, SliceEvent, SliceStartedEvent } from './Slice'
// import { AudioContext } from 'angular-audio-context'
import 'rxjs/add/observable/merge'
import 'rxjs/add/operator/map'
import { Subscription } from 'rxjs/Subscription'

interface SlicePosition {
  sliceIndex: number,
  sliceOffset: number
}

@Injectable()
export class PlayerService {

  gainNodes: Observable<GainNode[]>
  durationSeconds: Observable<number>

  // TODO LATER: calculate current time (e.g. this.audioContext.currentTime - this.playStart); keep track of pause, seek, etc
  currentTimeSeconds: number | undefined

  private gainNodeSubject: Subject<GainNode[]> = new ReplaySubject<GainNode[]>()
  private durationSecondsSubject: Subject<number> = new ReplaySubject<number>()
  private channels: Channel[] = []
  private slices: Slice[] = []
  private sliceRanges: SliceRange[] = []
  private sliceEventsSubscription: Subscription

  constructor (
    private readonly trmService: TrmService,
    private readonly audioContext: AudioContext
  ) {
    console.log(`--> Created playerservice with audiocontext:`, audioContext)
    this.gainNodes = this.gainNodeSubject.asObservable()
    this.durationSeconds = this.durationSecondsSubject.asObservable()
  }

  async load (recording: Recording): Promise<void> {

    this.channels = indexes(recording.numberOfChannels)
      .map(() => this.createChannel())

    // Download all chunks across all slices and channels (but don't decode yet)
    // TODO LATER: lazy download
    this.slices = await Promise.all(recording.trmSlices.map(async (trmSlice, sliceIndex) => {
      const chunks = await Promise.all(indexes(recording.numberOfChannels).map(async (_, channelIndex) => {
        const arrayBuffer = await this.trmService.download(trmSlice, channelIndex)
        return new Chunk(arrayBuffer, this.audioContext, this.channels[channelIndex].gain, trmSlice.name, sliceIndex, channelIndex)
      }))
      return new Slice(chunks, this.audioContext)
    }))

    this.sliceEventsSubscription = Observable
      .merge(...this.slices.map((slice, sliceIndex) => slice.events.map(event => ({ ...event, sliceIndex }))))
      .subscribe(async event => {
          console.log(`--> Got slice event:`, event)
          if (event instanceof SliceStartedEvent) {
            const nextSlice = this.slices[event.sliceIndex + 1]
            if (nextSlice) {
              // When a slice has started playing, queue next slice to play (with offset)
              const startedSliceDuration = recording.trmSlices[event.sliceIndex].durationSeconds
              const startNextSliceAt = event.ctxStartedAtTime + startedSliceDuration - event.offset
              console.log(`--> Enqueuing next slice`, nextSlice, startNextSliceAt)
              await nextSlice.start(startNextSliceAt)
            }
          }
        },
        error => {
          console.log(`--> Could not enqueue next slice:`, error)
        })

    this.sliceRanges = calculateSliceRanges(recording.trmSlices)
    this.durationSecondsSubject.next(sum(recording.trmSlices, t => t.durationSeconds))
    this.gainNodeSubject.next(this.channels.map(c => c.gain))
  }

  async play (): Promise<void> {
    await this.start()
  }

  stop (): void {
    this.slices.forEach(c => c.stop())
  }

  // TODO LATER: maybe map this, play and stop through Rx with switchmap or something, to debounce/abort/etc
  updateTime (seconds: number): Promise<void> {
    return this.start(seconds)
  }

  async start (offset: number = 0): Promise<void> {
    const slicePosition = this.findSlice(offset)
    await Promise.all(this.slices.map(async (slice, sliceIndex) => {
      if (sliceIndex === slicePosition.sliceIndex) {
        await slice.start(0, slicePosition.sliceOffset)
      } else {
        // Note: this ensures other slices and their chunks stop, and release their memory
        slice.stop()
      }
    }))
  }

  private findSlice (offset: number): SlicePosition {

    const sliceIndex = this.sliceRanges.findIndex(r => (offset || 0) >= r.start && (offset || 0) < r.end)

    if (sliceIndex < 0) {
      throw new RangeError(`Could not find slice corresponding to offset: ${offset}`)
    }
    console.log(`--> playing chunk ${sliceIndex} (because ${offset} is between ${this.sliceRanges[sliceIndex].start} and ${this.sliceRanges[sliceIndex].end})`)

    const withinSliceOffset = offset - this.sliceRanges[sliceIndex].start

    return {
      sliceIndex,
      sliceOffset: withinSliceOffset
    }
  }

  private createChannel (): Channel {
    const channel = new Channel(this.audioContext.createGain())
    channel.gain.connect(this.audioContext.destination)
    channel.gain.gain.value = .5
    return channel
  }
}

function indexes (length: number): number[] {
  return Array(length)
    .fill(0)
    .map((_, index) => index)
}

function calculateSliceRanges (trmSlices: TrmSlice[]): SliceRange[] {
  let cumulativeOffset = 0
  return trmSlices.map(t => {
    const start = cumulativeOffset
    cumulativeOffset = cumulativeOffset + t.durationSeconds
    return { start, end: cumulativeOffset }
  })
}

function sum<T> (elements: T[], accessor: (element: T) => number) {
  return elements.reduce((acc, element) => acc + accessor(element), 0)
}

