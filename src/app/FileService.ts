import { Injectable } from '@angular/core'

@Injectable()
export class FileService {

  download (path: string): Promise<ArrayBuffer> {
    console.log(path)
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
