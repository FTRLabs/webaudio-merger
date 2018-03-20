import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import { DUMMY_RECORDING } from '../DummyRecording'
import { PlayerService } from '../PlayerService'
import { Observable } from 'rxjs/Observable'

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  @ViewChild('audio1') audio: ElementRef
  @ViewChild('audio2') audio2: ElementRef

  gainNodes: Observable<GainNode[]>
  durationSeconds: Observable<number>
  currentTimeSeconds: number | undefined

  constructor (
    readonly playerService: PlayerService
  ) {
  }

  async ngOnInit () {
    this.playerService.setAudio(this.audio.nativeElement)
    // this.playerService.setOtherAudio(this.audio2.nativeElement)
    await this.playerService.load(DUMMY_RECORDING)

    this.durationSeconds = this.playerService.durationSeconds
    this.playerService.time.subscribe(time => this.currentTimeSeconds = time)

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
