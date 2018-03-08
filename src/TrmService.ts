import { FileService } from './FileService'
import { Trm } from './Trm'

export class TrmService {
  constructor (
    readonly fileService: FileService
  ) {
  }

  download (trm: Trm, index: number): Promise<ArrayBuffer> {
    return this.fileService.download(
      `./audio/${trm.name}_ch${index + 1}.aac`
    )
  }
}
