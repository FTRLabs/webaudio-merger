import { Chunk } from '../Chunk'
import { Observable } from 'rxjs/Observable'
import { Subscription } from 'rxjs/Subscription'

/**
 * Time that each chunk starts/ends (seconds)
 */
interface ChunkRange {
  start: number
  end: number
}

export class Channel {

  private chunks: Chunk[] = []
  private chunkRanges: ChunkRange[] = []
  private chunkEndedSubscription: Subscription | undefined

  constructor (
    readonly gain: GainNode
  ) {
  }

  get duration () {
    return this.chunkRanges[this.chunkRanges.length - 1].end
  }

  load (chunks: Chunk[]) {
    this.chunks = chunks

    chunks.forEach(chunk => chunk.connect(this.gain))

    let cumulativeOffset = 0
    this.chunkRanges = chunks
      .map(c => {
        const start = cumulativeOffset
        cumulativeOffset = cumulativeOffset + c.durationSeconds
        return { start, end: cumulativeOffset }
      })
  }

  async start (when?: number, offset: number = 0) {
    const chunkIndex = this.chunkRanges.findIndex(r => (offset || 0) >= r.start && (offset || 0) < r.end)

    if (chunkIndex < 0) {
      throw new RangeError(`Could not find chunk corresponding to channel offset: ${offset}`)
    }
    console.log(`--> playing chunk ${chunkIndex} (because ${offset} is between ${this.chunkRanges[chunkIndex].start} and ${this.chunkRanges[chunkIndex].end})`)

    const withinChunkOffset = offset - this.chunkRanges[chunkIndex].start

    // Stop everything! Then play the appropriate chunk; TODO: make this less clunky
    this.chunks.forEach(c => c.stop())

    const chunk = this.chunks[chunkIndex]
    this.playNextChunkOnEnd(chunkIndex)
    await chunk.start(when, withinChunkOffset)
  }

  stop () {
    this.clearChunkEndedSubscription()
    this.chunks.forEach(c => c.stop())
  }

  private playNextChunkOnEnd (chunkIndex: number) {
    this.clearChunkEndedSubscription()

    const chunk = this.chunks[chunkIndex]
    const nextChunk = this.chunks[chunkIndex + 1]

    if (nextChunk) {
      this.chunkEndedSubscription = chunk.ended.subscribe(e => {
          // TODO: synchronize with other channels! Only possible if we're willing to have a pessimistic gap at TRM boundaries?
          console.log(`--> Attempt start chunk ${chunkIndex + 1}`, e)
          nextChunk.start(0, 0)
        }, error => {
          console.log(`--> Failed to start chunk ${chunkIndex + 1}:`, error)
        }
      )
    }
  }

  private clearChunkEndedSubscription () {
    if (this.chunkEndedSubscription) {
      this.chunkEndedSubscription.unsubscribe()
      this.chunkEndedSubscription = undefined
    }
  }
}
