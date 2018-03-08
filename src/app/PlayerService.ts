import { Recording } from './types/Recording'
import { Channel } from './types/Channel'
import { Trm } from './types/Trm'
import { TrmService } from './TrmService'
import { Injectable } from '@angular/core'

@Injectable()
export class PlayerService {

  gainNodes: GainNode[] = []
  durationSeconds: number | undefined

  // TODO: no events from AudioBufferSourceNode?
  currentTimeSeconds: number | undefined

  private numberOfChannels: number | undefined
  private trms: Trm[] = []
  private channels: Channel[] = []

  /**
   * Stored outside channels because seeking requires destroying each channel's source node, but we reuse the buffer
   */
  private channelBuffers: AudioBuffer[] = []

  constructor (
    private readonly trmService: TrmService,
    private readonly audioContext: AudioContext
  ) {
  }

  async load (recording: Recording): Promise<void> {
    this.numberOfChannels = recording.numberOfChannels
    this.trms = recording.trms

    this.createChannels()

    // TODO: don't do this all up-front
    this.channelBuffers = await Promise.all(this.channels.map(channel => this.downloadAudioBuffers(channel)))
    this.setChannelBuffers()

    // Assume all channels have the same duration
    this.durationSeconds = this.channels[0].duration
  }

  play (): void {
    this.channels.forEach(c => c.source.start())
  }

  updateTime (seconds: number) {
    this.channels.forEach(c => c.stop())
    this.createChannels()
    this.setChannelBuffers()
    this.channels.forEach(c => c.start(0, seconds))
  }

  private createChannels () {
    this.channels = indexes(this.numberOfChannels).map(index => this.createChannel(index))
    this.gainNodes = this.channels.map(c => c.gain)
  }

  private setChannelBuffers () {
    this.channels.forEach((channel, index) => channel.setBuffer(this.channelBuffers[index] || null))
  }

  private async downloadAudioBuffers (channel: Channel): Promise<AudioBuffer> {
    const audioBuffers = await Promise.all(this.trms.map(async trm => this.downloadAudio(trm, channel.index)))
    const audioBuffer = this.concatenate(audioBuffers)
    return audioBuffer
  }

  private async downloadAudio (trm: Trm, index: number): Promise<AudioBuffer> {
    const arrayBuffer = await this.trmService.download(trm, index)
    return this.audioContext.decodeAudioData(arrayBuffer)
  }

  private createChannel (index: number): Channel {
    const source = this.audioContext.createBufferSource()

    const gain = this.audioContext.createGain()
    source.connect(gain)

    gain.connect(this.audioContext.destination)

    gain.gain.value = .5

    return new Channel(
      index,
      source,
      gain
    )
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
