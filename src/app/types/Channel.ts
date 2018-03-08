export class Channel {

  constructor (
    readonly index: number,
    readonly source: AudioBufferSourceNode,
    readonly gain: GainNode
  ) {
  }

  stop () {
    this.source.stop()
  }

  start (when: number, offset: number) {
    this.source.start(0, offset)
  }

  setBuffer (audioBuffer: AudioBuffer | null) {
    this.source.buffer = audioBuffer
  }

  get duration() {
    return this.source.buffer.duration
  }
}
