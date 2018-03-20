import { Recording } from './types/Recording'

const dummyTrms = [
  'bensound-summer',
  'bensound-ukulele',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1411_01d20e91ea75a130',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1416_01d20e929d56a100',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1426_01d20e9403103c30',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1421_01d20e935033d040',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1431_01d20e94b5f00380',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1436_01d20e9568d06710',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1441_01d20e961bb166e0',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1446_01d20e96ce9266b0',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1451_01d20e978172ca40',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1456_01d20e983453ca10',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1501_01d20e98e734c9e0',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1511_01d20e9a4cf62d40',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1516_01d20e9affd72d10',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1521_01d20e9bb2b790a0',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1526_01d20e9c65986960',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1531_01d20e9d1874fc60',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1536_01d20e9dcb555ff0',
  // 'MA-BAR-BAR-CH2-C1-R1--SUPE_20160914-1541_01d20e9e7e3686d0'
]

export const DUMMY_RECORDING: Recording = {
  numberOfChannels: 1,
  trms: dummyTrms.map(dummyTrm => ({
    name: dummyTrm,

    // TODO: assume we can get this from server.
    // Manually worked out this time, using these two commands:
    // $ ffmpeg -i <in>.aac <out>.wav
    // $ ffprobe -loglevel fatal -print_format json -show_format <out>.wav
    durationSeconds: 200
  }))
}
