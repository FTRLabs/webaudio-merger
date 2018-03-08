import { Component, OnInit } from '@angular/core';
import { DUMMY_RECORDING } from '../DummyRecording'
import { ChannelControl } from '../ChannelControls'
import { PlayerService } from '../PlayerService'

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {

  constructor(
    readonly playerService: PlayerService
  ) { }

  async ngOnInit() {

    await this.playerService.load(DUMMY_RECORDING)

    this.playerService.gainNodes.map((gainNode, index) => new ChannelControl().render(gainNode, index))

    this.playerService.play()
  }

}
