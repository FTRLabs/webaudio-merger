import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { PlayerService } from './PlayerService'
import { TrmService } from './TrmService'
import { FileService } from './FileService';
import { PlayerComponent } from './player/player.component'


@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent
  ],
  imports: [
    BrowserModule
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
