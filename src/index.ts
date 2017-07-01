const audioCtx = new AudioContext()
const rangeInput = document.getElementById('range') as HTMLInputElement

const audios: Audio[] = [
  {
    name: 'Besound',
    path: 'bensound-energy.aac'
  },
  {
    name: 'Going higher',
    path: 'bensound-goinghigher.aac'
  }
]
  
interface Audio {
  name: string
  path: string
}

function getAudioData(path): Promise<AudioBuffer> {
  return new Promise<AudioBuffer> (resolve => {
    const request = new XMLHttpRequest()

    request.open('GET', path, true)
    request.responseType = 'arraybuffer'

    request.onload = function() {
      const audioData = request.response

      audioCtx.decodeAudioData(audioData, function(buffer) {
          resolve(buffer)
        })
    }

    request.send()
  })
}

async function addAudio(audio: Audio): Promise<AudioBufferSourceNode> {
  const data = await getAudioData(audio.path)

  const src = audioCtx.createBufferSource()
  src.buffer = data
  const gain = audioCtx.createGain()
  src.connect(gain)

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
  label.textContent = audio.name
  const container = document.createElement('div')
  container.appendChild(label)
  container.appendChild(input)
  document.body.appendChild(container)

  return src
}

Promise.all(audios.map(addAudio))
.then(buffers => buffers.forEach(buffer => buffer.start()))