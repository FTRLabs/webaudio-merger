import { Recording } from './types/Recording'
import { Channel } from './types/Channel'
import { Trm } from './types/Trm'
import { TrmService } from './TrmService'
import { Injectable } from '@angular/core'
import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'

@Injectable()
export class PlayerService {

  gainNodes: Observable<GainNode[]>
  durationSeconds: Observable<number>

  // TODO: calculate current time (e.g. this.audioContext.currentTime - this.playStart); keep track of pause, seek, etc
  currentTimeSeconds: number | undefined

  private gainNodeSubject: Subject<GainNode[]> = new ReplaySubject<GainNode[]>()
  private durationSecondsSubject: Subject<number> = new ReplaySubject<number>()
  private numberOfChannels: number | undefined
  private trms: Trm[] = []
  private channels: Channel[] = []

  /**
   * Indexed by channel, then sequence
   */
  private chunks: Chunk[][]

  constructor (
    private readonly trmService: TrmService,
    private readonly audioContext: AudioContext
  ) {
    this.gainNodes = this.gainNodeSubject.asObservable()
    this.durationSeconds = this.durationSecondsSubject.asObservable()
  }

  async load (recording: Recording): Promise<void> {
    this.numberOfChannels = recording.numberOfChannels
    this.trms = recording.trms

    // Download all chunks across all channels (but don't decode yet); TODO: lazy download
    this.channels = await Promise.all(
      indexes(this.numberOfChannels)
        .map(() => this.createChannel())
        .map(async (channel, channelIndex) => {
          const chunks = await Promise.all(this.createChunks(channelIndex))
          channel.load(chunks)
          return channel
        }))

    // Assumes all channels have the same duration
    this.durationSecondsSubject.next(this.channels[0].duration)
    this.gainNodeSubject.next(this.channels.map(c => c.gain))
  }

  play (): void {
    this.channels.forEach(c => c.start())
  }

  updateTime (seconds: number) {
    this.channels.forEach(c => c.start(0, seconds))
  }

  private createChannel (): Channel {
    const channel = new Channel(this.audioContext.createGain())
    channel.gain.connect(this.audioContext.destination)
    channel.gain.gain.value = .5
    return channel
  }

  private createChunks (channelIndex: number): Promise<Chunk>[] {
    return this.trms.map(async trm => {
      const arrayBuffer = await this.trmService.download(trm, channelIndex)
      return new Chunk(trm.durationSeconds, arrayBuffer, this.audioContext)
    })
  }
}

function indexes (length: number): number[] {
  return Array(length)
    .fill(0)
    .map((_, index) => index)
}
