/**
 * Lazily decodes audio, to save memory. Can connect to a subsequent chunk for autoplay.
 */
export class Chunk {

  private audioBuffer: AudioBuffer | undefined
  private source: AudioBufferSourceNode | undefined
  private nextChunk: Chunk | undefined
  private destination: AudioNode | undefined

  constructor (
    // TODO: not sure if this is the right spot
    readonly durationSeconds: number,
    private readonly arrayBuffer: ArrayBuffer,
    private audioContext: AudioContext
  ) {
  }

  async start (when?: number, offset?: number): Promise<void> {

    // Always create a new AudioBufferSourceNode, as they can only be `start`ed once each
    const source = this.audioContext.createBufferSource()

    source.buffer = await this.getAudioBuffer()

    source.connect(this.destination)

    // TODO: when does this fire?
    source.onended = async event => {
      console.log(`--> chunk ended`, event)
      source.stop()
      if (this.nextChunk) {
        console.log(`--> Starting nextChunk:`, this.nextChunk)

        // TODO: is decoding fast enough to prevent a gap in playback between chunks?
        // TODO: will this be sufficiently synchronized across channels?
        this.nextChunk.connect(this.destination)
        await this.nextChunk.start()
      }
    }

    // TODO: synchronize this across channels somehow; maybe rename this method to "load", then separately call start
    source.start(when, offset)
    console.log(`--> started chunk at ${this.audioContext.currentTime}`)

    this.source = source
  }

  connect (node: AudioNode) {
    this.destination = node
  }

  onEnd (nextChunk: Chunk | null): void {
    this.nextChunk = nextChunk
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
