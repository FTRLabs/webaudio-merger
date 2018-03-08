import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PlayerService } from './PlayerService'
import { TrmService } from './TrmService'
import { FileService } from './FileService';
import { PlayerComponent } from './player/player.component'
import { MatSliderModule } from '@angular/material'


@NgModule({
  imports: [
    BrowserModule,
    MatSliderModule
  ],
  declarations: [
    AppComponent,
    PlayerComponent
  ],
  providers: [
    PlayerService,
    TrmService,
    FileService,
    AudioContext
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
