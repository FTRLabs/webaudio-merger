import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PlayerService } from './PlayerService'
import { TrmService } from './TrmService'
import { FileService } from './FileService';
import { PlayerComponent } from './player/player.component'
import { MatSliderModule } from '@angular/material'
import { AUDIO_CONTEXT_PROVIDER } from './AudioContextProvider'
// import { AudioContextModule } from 'angular-audio-context'


@NgModule({
  imports: [
    BrowserModule,
    MatSliderModule
    // AudioContextModule.forRoot()
  ],
  declarations: [
    AppComponent,
    PlayerComponent
  ],
  providers: [
    AUDIO_CONTEXT_PROVIDER,
    PlayerService,
    TrmService,
    FileService,
    // AudioContext
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
