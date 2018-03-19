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
  duration: Observable<number>
  currentTimeSeconds: number | undefined

  constructor (
    readonly playerService: PlayerService
  ) {
  }

  async ngOnInit (): Promise<void> {

    // await this.playerService.load(DUMMY_RECORDING)
    await this.playerService.load(SPLIT_DUMMY_RECORDING)

    this.gainNodes = this.playerService.gainNodes
    this.duration = this.playerService.duration

    return this.playerService.play()
  }

  play(): Promise<void> {
    return this.playerService.play()
  }

  stop(): void {
    this.playerService.stop()
    this.currentTimeSeconds = 0
  }

  setGain (gainNode: GainNode, value: string): void {
    gainNode.gain.value = Number(value) / 10
  }

  changeTime (value: number): Promise<void> {
    return this.playerService.updateTime(value)
  }
}
