import { Component, OnInit } from '@angular/core';
import { DUMMY_RECORDING } from './DummyRecording'
import { ChannelControl } from './ChannelControls'
import { PlayerService } from './PlayerService'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
}
