import { Component, OnInit } from '@angular/core';
import { DUMMY_RECORDING } from '../DummyRecording'
import { PlayerService } from '../PlayerService'

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {

  gainNodes: GainNode[]

  constructor(
    readonly playerService: PlayerService
  ) { }

  async ngOnInit() {

    await this.playerService.load(DUMMY_RECORDING)

    this.gainNodes = this.playerService.gainNodes

    this.playerService.play()
  }

  setGain(gainNode: GainNode, value: string) {
    gainNode.gain.value = Number(value) / 10
  }

  changeTime(value: number) {
    this.playerService.updateTime(value)
  }
}
