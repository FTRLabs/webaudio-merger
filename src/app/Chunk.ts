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
  private destination: AudioNode | undefined

  constructor (
    // TODO: not sure if this is the right spot
    readonly durationSeconds: number,
    private readonly arrayBuffer: ArrayBuffer,
    private audioContext: AudioContext,

    // TODO: these are just for debugging
    private readonly trmName: string,
    private readonly index: number
  ) {
    this.ended = this.endedSubject.asObservable()
  }

  async start (when?: number, offset?: number): Promise<void> {

    // Always create a new AudioBufferSourceNode, as they can only be `start`ed once each
    const source = this.audioContext.createBufferSource()

    source.buffer = await this.getAudioBuffer()

    source.connect(this.destination)

    source.onended = async event => {
      console.log(`--> chunk ${this.index} ended (${this.trmName})`, event)
      this.cleanBuffer()
      this.endedSubject.next(event)
    }

    console.log(`--> starting chunk ${this.index} at ${when}, from ${offset} (${this.trmName})`)
    source.start(when, offset)

    this.source = source
  }

  connect (node: AudioNode) {
    this.destination = node
  }

  stop (): void {
    if (this.source) {
      this.source.stop()
      this.cleanBuffer()
    }
  }

  /**
   * Lazily decode the audio
   */
  private async getAudioBuffer (): Promise<AudioBuffer> {

    // Array buffers can only be decoded once (https://github.com/WebAudio/web-audio-api/issues/1175#issuecomment-320496770).
    // Copy the buffer before decoding to ensure nothing breaks if we later stop and re-start this chunk.
    const copiedArrayBuffer = this.arrayBuffer.slice(0)

    this.audioBuffer = this.audioBuffer || (
      console.log(`--> decoding chunk ${this.index} (${this.trmName})`) || await this.audioContext.decodeAudioData(copiedArrayBuffer)
    )
    return this.audioBuffer
  }

  /**
   * Inspired by https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L1965
   */
  private cleanBuffer () {
    console.log(`--> cleared buffer for chunk ${this.index} (${this.trmName})`)
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
