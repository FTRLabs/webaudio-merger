import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../PlayerService'
import { Observable } from 'rxjs/Observable'
import { SPLIT_DUMMY_RECORDING } from '../SplitDummyRecording.60'

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {

  gainNodes: Observable<GainNode[]>
  durationSeconds: Observable<number>
  currentTimeSeconds: number | undefined

  constructor (
    readonly playerService: PlayerService
  ) {
  }

  async ngOnInit () {

    // await this.playerService.load(DUMMY_RECORDING)
    await this.playerService.load(SPLIT_DUMMY_RECORDING)

    this.gainNodes = this.playerService.gainNodes
    this.durationSeconds = this.playerService.durationSeconds

    await this.playerService.play()
  }

  async play(): Promise<void> {
    await this.playerService.play()
  }

  stop() {
    this.playerService.stop()
    this.currentTimeSeconds = 0
  }

  setGain (gainNode: GainNode, value: string) {
    gainNode.gain.value = Number(value) / 10
  }

  changeTime (value: number) {
    this.playerService.updateTime(value)
  }
}
