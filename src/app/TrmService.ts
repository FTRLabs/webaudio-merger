import { FileService } from './FileService'
import { Trm } from './types/Trm'
import { Injectable } from '@angular/core'

@Injectable()
export class TrmService {
  constructor (
    readonly fileService: FileService
  ) {
  }

  download (trm: Trm, index: number): Promise<ArrayBuffer> {
    return this.fileService.download(
      `./assets/mp4/${trm.name}.mp4`
    )
  }
}
