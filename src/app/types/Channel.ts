import { Chunk } from '../Chunk'

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

  constructor (
    readonly gain: GainNode
  ) {
  }

  get duration () {
    return this.chunkRanges[this.chunkRanges.length - 1].end
  }

  load (chunks: Chunk[]) {
    this.chunks = chunks

    // TODO: modifying param is dirty
    chunks.forEach((chunk, index) => {
      if (chunk[index + 1]) {
        chunk.onEnd(chunk[index + 1])
      }
      chunk.connect(this.gain)
    })

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
    console.log(`--> playing chunk ${chunkIndex}`)

    const withinChunkOffset = offset - this.chunkRanges[chunkIndex].start

    // Stop everything! Then play the appropriate chunk; TODO: make this less clunky
    this.chunks.forEach(c => c.stop())

    await this.chunks[chunkIndex].start(when, withinChunkOffset)
  }

  stop () {
    this.chunks.forEach(c => c.stop())
  }
}
