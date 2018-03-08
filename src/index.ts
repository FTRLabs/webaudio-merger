import { Player } from './Player'
import { ArrayBufferService } from './ArrayBufferService'
import { Application } from './Application'

new Application(new Player(
  new ArrayBufferService(),
  new AudioContext()
)).start()
