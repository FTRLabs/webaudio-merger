/**
 * Lazily decodes audio, to save memory. Can connect to a subsequent chunk for autoplay.
 */
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

// import { AudioContext } from 'angular-audio-context'

export class Chunk {

  ended: Observable<Event>

  private endedSubject: Subject<Event> = new Subject<Event>()
  private audioBuffer: AudioBuffer | undefined
  private source: AudioBufferSourceNode | undefined

  private loading: Promise<void> | undefined

  constructor (
    private readonly arrayBuffer: ArrayBuffer,
    private audioContext: AudioContext,
    private readonly destination: AudioNode,
    private readonly trmName: string,
    // TODO LATER: remove this, they're just for debugging
    private readonly sliceIndex: number,
    private readonly channelIndex: number
  ) {
    this.ended = this.endedSubject.asObservable()
  }

  // TODO LATER: lazy download of arrayBuffer
  async load (): Promise<void> {
    if (this.loading) {
      return this.loading
    } else {
      this.loading = this.doLoad()
      return this.loading
    }
  }

  start (offset?: number): void {
    if (!this.audioBuffer) {
      throw new Error('Cannot start chunk before loaded')
    }

    // Ensure that audio is stopped if this chunk is already playing
    if (this.source) {
      const oldSource = this.source
      console.log(`--> on chunk start: stopping playing chunk in slice ${this.sliceIndex} at ${offset}`)
      // Suppress onended event, because with this call to stop(), the chunk hasn't ended, we're just seeking within it
      oldSource.onended = () => {
        oldSource.disconnect();
      }
      oldSource.stop()
    }

    // Always create a new AudioBufferSourceNode, as they can only be `start`ed once each
    const source = this.audioContext.createBufferSource()
    source.buffer = this.audioBuffer
    source.connect(this.destination)
    source.onended = async event => {
      // console.log(`--> chunk in slice ${this.sliceIndex} ended (${this.trmName}); clearing buffer`, event)
      console.log(`--> chunk in slice ${this.sliceIndex} ended; clearing buffer`)
      this.unload()
      this.endedSubject.next(event)
    }

    // console.log(`--> starting chunk in slice ${this.sliceIndex}, from ${offset} (${this.trmName})`)

    console.log(`--> on chunk start: starting playing chunk in slice ${this.sliceIndex} at ${offset}`)
    source.start(0, offset)
    this.source = source
  }

  stop (): void {
    if (this.source) {
      // console.log(`--> on stop: chunk has source ******`)
      this.source.stop()
    } else {
      // console.log(`--> on stop: chunk has no source`)
    }
    this.unload()
  }

  private async doLoad (): Promise<void> {
    // TODO LATER: remove simulated slow decoding
    return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        this.audioBuffer = await this.decode()
        resolve()
      }, 3000)
    })
  }

  private async decode (): Promise<AudioBuffer> {
    // Array buffers can only be decoded once (https://github.com/WebAudio/web-audio-api/issues/1175#issuecomment-320496770).
    // Copy the buffer before decoding to ensure nothing breaks if we later stop and re-start this chunk.
    const copiedArrayBuffer = this.arrayBuffer.slice(0)

    // console.log(`--> decoding chunk in slice ${this.sliceIndex} (${this.trmName})`)
    return await this.audioContext.decodeAudioData(copiedArrayBuffer)
  }

  /**
   * Inspired by https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L1965
   */
  private unload (): void {

    this.loading = undefined

    this.audioBuffer = undefined
    if (this.source) {
      const scratchBuffer = this.audioContext.createBuffer(1, 1, 22050);
      this.source.onended = null;
      this.source.disconnect();
      try {
        this.source.buffer = scratchBuffer;
      } catch (e) {
      }
      this.source = undefined;
    }
  }
}
