import { Recording } from './types/Recording'
import { Channel } from './types/Channel'
import { Trm } from './types/Trm'
import { TrmService } from './TrmService'
import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Injectable } from '@angular/core'
// import { AudioContext } from 'angular-audio-context'

/**
 * To ensure channels are synchronized (even in the context of variable processing delay per channel),
 * always request that channels _start_ playing after this specified lag
 */
const MAX_EXPECTED_DECODE_DELAY_SEC = 2

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
    console.log(`--> Created playerservice with audiocontext:`, audioContext)
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
    const syncStart = this.audioContext.currentTime + MAX_EXPECTED_DECODE_DELAY_SEC
    console.log(`--> Will start all channels at ${syncStart}`)
    this.channels.forEach(c => c.start(syncStart))
  }

  stop (): void {
    this.channels.forEach(c => c.stop())
  }

  updateTime (seconds: number) {
    const syncStart = this.audioContext.currentTime + MAX_EXPECTED_DECODE_DELAY_SEC
    console.log(`--> Will start all channels at ${syncStart}`)
    this.channels.forEach(c => c.start(syncStart, seconds))
  }

  private createChannel (): Channel {
    const channel = new Channel(this.audioContext.createGain())
    channel.gain.connect(this.audioContext.destination)
    channel.gain.gain.value = .5
    return channel
  }

  private createChunks (channelIndex: number): Promise<Chunk>[] {
    return this.trms.map(async (trm, index) => {
      const arrayBuffer = await this.trmService.download(trm, channelIndex)
      return new Chunk(trm.durationSeconds, arrayBuffer, this.audioContext, trm.name, index)
    })
  }
}

function indexes (length: number): number[] {
  return Array(length)
    .fill(0)
    .map((_, index) => index)
}
