/**
 * Lazily decodes audio, to save memory. Can connect to a subsequent chunk for autoplay.
 */
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

export class Chunk {

  ended: Observable<MediaStreamErrorEvent>

  private endedSubject: Subject<MediaStreamErrorEvent> = new Subject<MediaStreamErrorEvent>()
  private audioBuffer: AudioBuffer | undefined
  private source: AudioBufferSourceNode | undefined
  private destination: AudioNode | undefined

  constructor (
    // TODO: not sure if this is the right spot
    readonly durationSeconds: number,
    private readonly arrayBuffer: ArrayBuffer,
    private audioContext: AudioContext
  ) {
    this.ended = this.endedSubject.asObservable()
  }

  async start (when?: number, offset?: number): Promise<void> {

    // Always create a new AudioBufferSourceNode, as they can only be `start`ed once each
    const source = this.audioContext.createBufferSource()

    source.buffer = await this.getAudioBuffer()

    source.connect(this.destination)

    source.onended = async event => {
      console.log(`--> chunk ended`, event)
      this.cleanBuffer()
      this.endedSubject.next(event)
    }

    console.log(`--> starting chunk at ${when}, from ${offset}`)
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
    this.audioBuffer = this.audioBuffer || await this.audioContext.decodeAudioData(this.arrayBuffer)
    return this.audioBuffer
  }

  /**
   * Inspired by https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L1965
   */
  private cleanBuffer () {
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
