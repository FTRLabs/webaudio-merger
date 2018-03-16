import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

export interface SliceEvent {
}

export class SliceStartedEvent implements SliceEvent {
  constructor (
    readonly ctxStartedAtTime: number,
    readonly offset: number
  ) {
  }
}

/**
 * A temporal slice of a recording. Each slice may contain several chunks, one per channel.
 */
export class Slice {

  // TODO LATER: extend to progress events?
  events: Observable<SliceEvent>

  eventsSubject: Subject<SliceEvent> = new Subject<SliceEvent>()

  constructor (
    private chunks: Chunk[],
    private audioContext: AudioContext
  ) {
    this.events = this.eventsSubject.asObservable()
  }

  async start (when: number, offset: number = 0): Promise<void> {
    await this.load()
    this.chunks.forEach(chunk => chunk.start(when, offset))

    const ctxCurrentTime = this.audioContext.currentTime

    // It either just started, or will start at `when` (whichever is later)
    const ctxStartedAtTime = ctxCurrentTime > when
      ? ctxCurrentTime
      : when

    // TODO: this will cascade to load all subsequent slices at once!
    // TODO: so, need to call start not on SliceStartedEvent, but on _actually playing_ event, or time progress, etc...
    this.eventsSubject.next(new SliceStartedEvent(ctxStartedAtTime, offset))
  }

  stop () {
    this.chunks.forEach(c => c.stop())
  }

  private load (): Promise<void[]> {
    return Promise.all(this.chunks.map(chunk => chunk.load()))
  }
}
