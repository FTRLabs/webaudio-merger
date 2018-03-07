const audioCtx = new AudioContext()

const recording: Recording = {
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

interface Recording {
  numberOfChannels: number
  trms: Trm[]
}

interface Trm {
  // Assumes all channels have same length and sample rate
  channels: ChannelFile[]
}

interface ChannelFile {
  path: string
}

interface LoadedBuffer {
  buffer: AudioBuffer
  path: string
}
function getAudioBuffer (path): Promise<LoadedBuffer> {
  return new Promise<LoadedBuffer>(resolve => {
    const request = new XMLHttpRequest()
    request.open('GET', path, true)
    request.responseType = 'arraybuffer'

    request.onload = function () {
      const audioData = request.response

      audioCtx.decodeAudioData(audioData, function (buffer) {
        const loadedBuffer: LoadedBuffer = {
          buffer,
          path
        }
        resolve(loadedBuffer)
      })
    }

    request.send()
  })
}

// Note: Assumes each input buffer has only 1 channel
function concatenateBuffers (buffers: LoadedBuffer[]) {

  if (buffers.some(b => b.buffer.numberOfChannels > 1)) {
    throw new RangeError(`Unexpected number of channels in channel data`)
  }

  const totalBufferLength = buffers.reduce((acc, b) => acc + b.buffer.length, 0)
  const channelBuffer = audioCtx.createBuffer(
    1,
    totalBufferLength,
    buffers[0].buffer.sampleRate
  )

  const channel = channelBuffer.getChannelData(0);
  let bufferOffset = 0
  const bufferOffsets = buffers
    .map(b => {
      const thisBufferOffset = bufferOffset
      bufferOffset = bufferOffset + b.buffer.length
      return thisBufferOffset
    })

  buffers.forEach((buffer, index) => {
    channel.set(buffer.buffer.getChannelData(0), bufferOffsets[index]);
  })
  return channelBuffer;
}


async function addChannel (recording: Recording, channelIndex: number): Promise<AudioBufferSourceNode> {
  const channelBuffers = await Promise.all(recording.trms.map(trm => getAudioBuffer(trm.channels[channelIndex].path)))

  const channelSrc = audioCtx.createBufferSource()

  const channelBuffer = concatenateBuffers(channelBuffers)
  channelSrc.buffer = channelBuffer
  const gain = audioCtx.createGain()
  channelSrc.connect(gain)

  gain.connect(audioCtx.destination)

  const input = document.createElement('input')
  input.id = ''
  input.type = 'range'
  input.min = '0'
  input.max = '10'
  input.value = '5'

  gain.gain.value = .5

  input.addEventListener('change', () => {
    gain.gain.value = Number(input.value) / 10
  })

  const label = document.createElement('label')
  label.textContent = channelIndex.toString()
  const container = document.createElement('div')
  container.appendChild(label)
  container.appendChild(input)
  document.body.appendChild(container)

  return channelSrc
}

Promise
  .all(
    Array(recording.numberOfChannels)
      .fill(0)
      .map((_, channelIndex) => addChannel(recording, channelIndex))
  )
  .then(channelSrcs => channelSrcs.forEach(channelSrc => channelSrc.start()))