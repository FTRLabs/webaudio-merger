import { ChannelFile } from './ChannelFile'

export interface Trm {
  // Assumes all channels have same length and sample rate
  channels: ChannelFile[]
}
