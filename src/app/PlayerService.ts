import { Recording } from './types/Recording'
import { Channel } from './types/Channel'
import { Trm } from './types/Trm'
import { TrmService } from './TrmService'
import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Injectable } from '@angular/core'

/**
 * To ensure channels are synchronized (even in the context of variable processing delay per channel),
 * always request that channels _start_ playing after this specified lag
 */
const MAX_EXPECTED_DECODE_DELAY_SEC = 2

@Injectable()
export class PlayerService {
  audio: HTMLAudioElement
  otherAudio: HTMLAudioElement
  durationSeconds: Observable<number>
  time: Observable<number>

  private durationSecondsSubject: Subject<number> = new ReplaySubject<number>()
  private timeSubject: Subject<number> = new ReplaySubject<number>()
  private numberOfChannels: number | undefined
  private trms: Trm[] = []
  private buffers: ArrayBuffer[]
  private index = 0
  private offset = 0

  /**
   * Indexed by channel, then sequence
   */
  private chunks: Chunk[][]

  constructor (
    private readonly trmService: TrmService
  ) {
    console.log(`--> Created playerservice`)
    this.durationSeconds = this.durationSecondsSubject.asObservable()
    this.time = this.timeSubject.asObservable()
  }

  async load (recording: Recording): Promise<void> {
    this.numberOfChannels = recording.numberOfChannels
    this.trms = recording.trms
    this.buffers = await Promise.all(this.createBuffers())

    const duration = this.trms.reduce((previous, trm) => {
      return previous + trm.durationSeconds
    }, 0)
    this.durationSecondsSubject.next(duration)
    this.loadSegment(this.index)
    this.loadOtherSegment(this.index + 1)
  }

  loadOtherSegment (index: number): void {
    this.otherAudio.src = URL.createObjectURL(new Blob([this.buffers[index]], {type: 'audio/mp4'}))
    this.otherAudio.load()
  }

  loadSegment (index: number): void {
    let offset = 0
    let i = 0
    while (i < index) {
      offset += this.trms[i].durationSeconds
      i++
    }
    console.log(`offset: ${offset}`)
    this.offset = offset
    this.audio.src = URL.createObjectURL(new Blob([this.buffers[index]], {type: 'audio/mp4'}))
  }

  setAudio (audio: HTMLAudioElement): void {
    this.audio = audio
    this.audio.ontimeupdate = this.handleTimeEvent.bind(this)
    this.audio.onended = this.onEnded.bind(this)
  }

  setOtherAudio (audio: HTMLAudioElement): void {
    this.otherAudio = audio
    this.otherAudio.ontimeupdate = this.handleTimeEvent.bind(this)
  }

  onEnded (): void {
    this.index++
    this.loadSegment(this.index)
    this.play(0)
  }

  handleTimeEvent (): void {
    this.timeSubject.next(this.audio.currentTime + this.offset)
  }

  play (time?: number): void {
    console.log(`--> Will play`)
    this.audio.play()
    console.log(`play`)
    if (time) {
      console.log(`time ${time}`)
      if (this.audio.readyState === 0) {
        this.audio.addEventListener('loadedmetadata', function() {
          this.audio.currentTime = time
        }.bind(this), false)
      } else {
        this.audio.currentTime = time
      }
    }
  }

  stop (): void {
    console.log(`--> Stop`)
    this.audio.pause()
    this.index = 0
    this.loadSegment(0)
  }

  updateTime (seconds: number) {
    console.log(`--> Will start at ${seconds}`)
    let offset = 0
    let index = 0
    let trm = this.trms[index]
    while (seconds > offset + trm.durationSeconds) {
      offset += trm.durationSeconds
      index++
      trm = this.trms[index]
      console.log(`index ${index}`)
      console.log(`offset ${offset}`)
    }
    if (index !== this.index) {
      this.index = index
      this.loadSegment(index)
    }

    this.play(seconds - offset)
  }

  private createBuffers (): Promise<ArrayBuffer>[] {
    return this.trms.map(async (trm, index) => {
      return await this.trmService.download(trm, 0)
    })
  }
}

function indexes (length: number): number[] {
  return Array(length)
    .fill(0)
    .map((_, index) => index)
}
