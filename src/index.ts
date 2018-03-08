import { Player } from './Player'
import { FileService } from './FileService'
import { Application } from './Application'
import { TrmService } from './TrmService'

new Application(new Player(
  new TrmService(new FileService()),
  new AudioContext(),
)).start()
