export class ChannelControl {

  render (gainNode: GainNode, index: number) {
    const input = document.createElement('input')
    input.id = ''
    input.type = 'range'
    input.min = '0'
    input.max = '10'
    input.value = '5'

    input.addEventListener('change', () => {
      gainNode.gain.value = Number(input.value) / 10
    })

    const label = document.createElement('label')
    label.textContent = index.toString()
    const container = document.createElement('div')
    container.appendChild(label)
    container.appendChild(input)
    document.body.appendChild(container)
  }
}