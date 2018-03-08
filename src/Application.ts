import { Player } from './Player'
import { DUMMY_RECORDING } from './DummyRecording'
import { ChannelControl } from './ChannelControls'

export class Application {

  constructor (
    private readonly player: Player
  ) {
  }

  async start (): Promise<void> {
    await this.player.load(DUMMY_RECORDING)

    this.player.gainNodes.map((gainNode, index) => new ChannelControl().render(gainNode, index))

    this.player.play()
  }
}
