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

  start (when?: number, offset?: number): void {
    if (!this.audioBuffer) {
      throw new Error('Cannot start chunk before loaded')
    }

    // Ensure that audio is stopped if this chunk is already playing
    if (this.source) {
      this.source.stop()
    }

    // Always create a new AudioBufferSourceNode, as they can only be `start`ed once each
    const source = this.audioContext.createBufferSource()
    source.buffer = this.audioBuffer
    source.connect(this.destination)
    source.onended = async event => {
      console.log(`--> chunk ${this.sliceIndex}/ch${this.channelIndex} ended (${this.trmName})`, event)
      this.unload()
      this.endedSubject.next(event)
    }

    this.source = source

    console.log(`--> starting chunk ${this.sliceIndex}/ch${this.channelIndex} at ${when}, from ${offset} (${this.trmName})`)

    this.source.start(when, offset)
  }

  stop (): void {
    if (this.source) {
      this.source.stop()
    }
    this.unload()
  }

  private async doLoad (): Promise<void> {
    this.audioBuffer = await this.decode()
  }

  private async decode (): Promise<AudioBuffer> {
    // Array buffers can only be decoded once (https://github.com/WebAudio/web-audio-api/issues/1175#issuecomment-320496770).
    // Copy the buffer before decoding to ensure nothing breaks if we later stop and re-start this chunk.
    const copiedArrayBuffer = this.arrayBuffer.slice(0)

    console.log(`--> decoding chunk ${this.sliceIndex}/ch${this.channelIndex} (${this.trmName})`)
    return await this.audioContext.decodeAudioData(copiedArrayBuffer)
  }

  /**
   * Inspired by https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L1965
   */
  private unload (): void {

    this.loading = undefined

    console.log(`--> cleared buffer for chunk ${this.sliceIndex}/ch${this.channelIndex} (${this.trmName})`)
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
