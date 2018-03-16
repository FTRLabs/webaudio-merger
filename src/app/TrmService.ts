import { FileService } from './FileService'
import { Trm } from './types/Trm'
import { Injectable } from '@angular/core'
import { durationSeconds } from './SplitDummyRecording.60'

@Injectable()
export class TrmService {
  constructor (
    readonly fileService: FileService
  ) {
  }

  download (trm: Trm, index: number): Promise<ArrayBuffer> {
    return this.fileService.download(
      // `./assets/audio/${trm.name}_ch${index + 1}.aac`
      `./assets/split-audio-${durationSeconds}/${trm.name}_ch${index + 1}.aac`
    )
  }
}
