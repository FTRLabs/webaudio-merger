import { Recording } from './types/Recording'
import { DUMMY_TRM_NAMES } from './DummyRecording'

// each TRM is just over a minute, so was split into 5 1-min chunks each
const numChunksPerTrm = 5

const trmChunkNames = DUMMY_TRM_NAMES.map(
  trmName => new Array(numChunksPerTrm).fill(undefined  )
    .map((_, chunkIndex) => `${trmName}_00${chunkIndex}`)
)

const flattenedTrmChunkNames = [].concat(...trmChunkNames)
console.log(`--> Num 1 min chunks: ${flattenedTrmChunkNames.length}`)

export const durationSeconds = 60

export const SPLIT_DUMMY_RECORDING: Recording = {
  numberOfChannels: 8,
  trms: flattenedTrmChunkNames.slice(0, 50).map(dummyTrm => ({
    name: dummyTrm,
    // TODO: assume this is available from the server; this is approximate here, which will just make seeking a bit inaccurate
    durationSeconds
  }))
}
