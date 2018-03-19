import { Recording } from './types/Recording'
import { Channel } from './Channel'
import { TrmSlice } from './types/Trm'
import { TrmService } from './TrmService'
import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Injectable } from '@angular/core'
import { Slice } from './Slice'
// import { AudioContext } from 'angular-audio-context'
import 'rxjs/add/observable/merge'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import { Subscription } from 'rxjs/Subscription'

interface SlicePosition {
  sliceIndex: number,
  sliceOffset: number
}

interface SliceEndedEvent extends Event {
  sliceIndex: number
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
  private sliceEndedSubscription: Subscription

  constructor (
    private readonly trmService: TrmService,
    private readonly audioContext: AudioContext
  ) {
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
      return new Slice(chunks, sliceIndex)
    }))

    const sliceEnded = Observable
      .merge(...this.slices.map((slice, sliceIndex) => slice.ended.map((event: Event) => ({ ...event, sliceIndex }))))

    // TODO LATER: unsubscribe on next load
    sliceEnded.subscribe(async (event: SliceEndedEvent) => {
        const nextSlice = this.slices[event.sliceIndex + 1]
        if (nextSlice) {
          console.log(`--> on slice ended: slice ${event.sliceIndex + 1}: auto-playing`)
          await nextSlice.start()
          console.log(`--> on slice ended: slice ${event.sliceIndex + 1}: auto-played`)
        }
      },
      error => {
        console.log(`--> on slice ended: could not auto-play slice`, error)
      })

    sliceEnded.subscribe(async (event: SliceEndedEvent) => {
        const sliceToLoad = this.slices[event.sliceIndex + 2]
        if (sliceToLoad) {
          console.log(`--> on slice ended: auto-loading slice ${event.sliceIndex + 2}`)
          await sliceToLoad.load()
          console.log(`--> on slice ended: auto-loaded slice ${event.sliceIndex + 2}`)
        }
      },
      error => {
        console.log(`--> on slice ended: could not auto-load slice`, error)
      })

    this.sliceRanges = calculateSliceRanges(recording.trmSlices)
    this.durationSecondsSubject.next(sum(recording.trmSlices, t => t.durationSeconds))
    this.gainNodeSubject.next(this.channels.map(c => c.gain))
  }

  async play (): Promise<void> {
    await this.start()
  }

  stop (): void {
    console.log(`--> on stop: stopping all slices`)
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
        console.log(`--> on start: slice ${sliceIndex}: play at offset ${slicePosition.sliceOffset}`)
        await slice.start(slicePosition.sliceOffset)
        console.log(`--> on start: slice ${sliceIndex}: playing at offset ${slicePosition.sliceOffset}`)
      } else if (sliceIndex === slicePosition.sliceIndex + 1) {
        console.log(`--> on start: slice ${sliceIndex}: load`)
        await slice.load()
        console.log(`--> on start: slice ${sliceIndex}: loaded`)
      } else {
        // Note: this ensures other slices and their chunks stop, and release their memory
        console.log(`--> on start: slice other: stop`)
        slice.stop()
      }
    }))
  }

  private findSlice (offset: number): SlicePosition {

    const sliceIndex = this.sliceRanges.findIndex(r => (offset || 0) >= r.start && (offset || 0) < r.end)

    if (sliceIndex < 0) {
      throw new RangeError(`--> on start: could not find slice corresponding to offset: ${offset}`)
    }
    console.log(`--> on start: slice ${sliceIndex} at ${offset} sec is seek target (${this.sliceRanges[sliceIndex].start} <= ${offset} < ${this.sliceRanges[sliceIndex].end})`)

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

