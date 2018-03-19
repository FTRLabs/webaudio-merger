import { Chunk } from './Chunk'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/take'

/**
 * A temporal slice of a recording. Each slice may contain several chunks, one per channel.
 */
export class Slice {

  // TODO LATER: extend to progress events?
  ended: Observable<Event>
  private readonly startedSubject: Subject<void> = new Subject<void>()

  constructor (
    private chunks: Chunk[],
    // TODO LATER: for debugging only; remove:
    private readonly index: number
  ) {
    // Slice ends at the same time as the first chunk to end after the slice was started
    this.ended = this.startedSubject.switchMap(() => Observable
      .merge(...this.chunks.map(c => c.ended))
      .take(1)
    )
  }

  async start (offset: number = 0): Promise<void> {
    await this.load()
    this.chunks.forEach(chunk => chunk.start(offset))
    this.startedSubject.next()
  }

  stop () {
    this.chunks.forEach(c => c.stop())
  }

  async load (): Promise<void[]> {
    return Promise.all(this.chunks.map(chunk => chunk.load()))
  }
}
