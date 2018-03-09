import { Component, OnInit } from '@angular/core';
import { DUMMY_RECORDING } from '../DummyRecording'
import { PlayerService } from '../PlayerService'
import { Observable } from 'rxjs/Observable'

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

    await this.playerService.load(DUMMY_RECORDING)

    this.gainNodes = this.playerService.gainNodes
    this.durationSeconds = this.playerService.durationSeconds

    this.playerService.play()
  }

  play() {
    this.playerService.play()
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
