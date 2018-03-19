import { Recording } from './types/Recording'
import { DUMMY_TRM_NAMES } from './DummyRecording'

// each TRM is just over a minute, so was split into 5 1-min chunks each
const numChunksPerTrm = 5

const trmChunkNames = DUMMY_TRM_NAMES.map(
  trmName => new Array(numChunksPerTrm).fill(undefined  )
    .map((_, chunkIndex) => `${trmName}_00${chunkIndex}`)
)

const flattenedTrmChunkNames = [].concat(...trmChunkNames)

export const durationSeconds = 60

export const SPLIT_DUMMY_RECORDING: Recording = {
  numberOfChannels: 8,
  trmSlices: flattenedTrmChunkNames.map(dummyTrm => ({
    name: dummyTrm,
    // TODO LATER: get this from the server
    durationSeconds
  }))
}
