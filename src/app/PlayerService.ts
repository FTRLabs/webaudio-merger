import { Recording } from './types/Recording'
import { Channel } from './types/Channel'
import { Trm } from './types/Trm'
import { TrmService } from './TrmService'
import { Injectable } from '@angular/core'

@Injectable()
export class PlayerService {

  gainNodes: GainNode[]

  private channels: Channel[] = []
  private trms: Trm[] = []

  constructor (
    private readonly trmService: TrmService,
    private readonly audioContext: AudioContext
  ) {
  }

  async load (recording: Recording): Promise<void> {
    this.channels = await Promise.all(
      indexes(recording.numberOfChannels).map(index => this.createChannel(index))
    )

    this.trms = recording.trms

    this.gainNodes = this.channels.map(c => c.gain)

    // TODO: don't do this all up-front
    await Promise.all(this.channels.map(channel => this.eagerLoadChannelContent(channel)))
  }

  play (): void {
    this.channels.forEach(c => c.source.start())
  }

  updateTime (value: number) {
    console.log(`--> Updating time to ${value}`)
  }

  private async eagerLoadChannelContent (channel: Channel): Promise<void> {
    const audioBuffers = await Promise.all(this.trms.map(async trm => this.downloadAudio(trm, channel.index)))
    const audioBuffer = this.concatenate(audioBuffers)
    channel.source.buffer = audioBuffer
  }

  private async downloadAudio (trm: Trm, index: number): Promise<AudioBuffer> {
    const arrayBuffer = await this.trmService.download(trm, index)
    return this.audioContext.decodeAudioData(arrayBuffer)
  }

  private async createChannel (index: number): Promise<Channel> {
    const source = this.audioContext.createBufferSource()

    const gain = this.audioContext.createGain()
    source.connect(gain)

    gain.connect(this.audioContext.destination)

    gain.gain.value = .5

    return {
      index,
      source,
      gain
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
