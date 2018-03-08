import { Recording } from '../Recording'

export const DUMMY_RECORDING: Recording = {
  numberOfChannels: 2,
  trms: [
    {
      channels: [
        { path: 'audio/dummy_channel_1_000.aac' },
        { path: 'audio/dummy_channel_2_000.aac' }
      ]
    },
    {
      channels: [
        { path: 'audio/dummy_channel_1_001.aac' },
        { path: 'audio/dummy_channel_2_001.aac' }
      ]
    },
    {
      channels: [
        { path: 'audio/dummy_channel_1_002.aac' },
        { path: 'audio/dummy_channel_2_002.aac' }
      ]
    }
  ]
}