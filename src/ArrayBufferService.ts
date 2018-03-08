export class ArrayBufferService {

  getArrayBuffer (path: string): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>(resolve => {
      const request = new XMLHttpRequest()
      request.open('GET', path, true)
      request.responseType = 'arraybuffer'

      request.onload = function () {
        const arrayBuffer: ArrayBuffer = request.response
        resolve(arrayBuffer)
      }

      request.send()
    })
  }
}