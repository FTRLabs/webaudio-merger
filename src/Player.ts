import { Recording } from './Recording'
import { ArrayBufferService } from './ArrayBufferService'
import { Channel } from './Channel'

export class Player {

  gainNodes: GainNode[]

  private channels: Channel[] = []

  constructor (
    private readonly audioDataService: ArrayBufferService,
    private readonly audioContext: AudioContext
  ) {
  }

  async load (recording: Recording): Promise<void> {
    this.channels = await Promise.all(
      indexes(recording.numberOfChannels).map(index => this.createChannel(recording, index))
    )

    this.gainNodes = this.channels.map(c => c.gain)

    await Promise.all(this.channels.map(this.eagerLoadChannelContent.bind(this)))
  }

  play (): void {
    this.channels.forEach(c => c.source.start())
  }

  private async eagerLoadChannelContent (channel: Channel): Promise<void> {
    const audioBuffers = await Promise.all(channel.paths.map(async path => this.loadAudioBuffer(path)))
    const audioBuffer = this.concatenate(audioBuffers)
    channel.source.buffer = audioBuffer
  }

  private async loadAudioBuffer (path: string): Promise<AudioBuffer> {
    const arrayBuffer = await this.audioDataService.getArrayBuffer(path)
    return this.audioContext.decodeAudioData(arrayBuffer)
  }

  private async createChannel (recording: Recording, index: number): Promise<Channel> {
    const source = this.audioContext.createBufferSource()

    const gain = this.audioContext.createGain()
    source.connect(gain)

    gain.connect(this.audioContext.destination)

    gain.gain.value = .5

    return {
      index,
      source,
      gain,
      paths: recording.trms.map(t => t.channels[index].path)
    }
  }


  // Note: Assumes each input buffer has only 1 channel
  private concatenate (buffers: AudioBuffer[]) {

    if (buffers.some(b => b.numberOfChannels > 1)) {
      throw new RangeError(`Unexpected number of channels in channel data`)
    }

    const totalBufferLength = buffers.reduce((acc, b) => acc + b.length, 0)
    const channelBuffer = this.audioContext.createBuffer(
      1,
      totalBufferLength,
      buffers[0].sampleRate
    )

    const channelData = channelBuffer.getChannelData(0)
    let bufferOffset = 0
    const bufferOffsets = buffers
      .map(b => {
        const thisBufferOffset = bufferOffset
        bufferOffset = bufferOffset + b.length
        return thisBufferOffset
      })

    buffers.forEach((buffer, index) => {
      channelData.set(buffer.getChannelData(0), bufferOffsets[index])
    })
    return channelBuffer
  }
}

function indexes (length: number): number[] {
  return Array(length)
    .fill(0)
    .map((_, index) => index)
}
