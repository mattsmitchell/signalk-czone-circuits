'use strict'

// Replay captured Control X Plus frames against the current beta's fast-packet
// reassembler. This is a transport-level reference; CANboat decoding is a
// separate comparison stage and must not be inferred from this result.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const nmea = require(path.resolve(__dirname, '../../../czone/lib/nmea2000.js'))

const cases = [
  {
    name: 'Compass Rose Control X Plus module 2 page 0 ON',
    lines: [
      '1DFF0902 40 1B 27 99 02 00 00 00',
      '1DFF0902 41 40 1F 00 D0 17 00 00',
      '1DFF0902 42 00 00 00 05 40 5F 00',
      '1DFF0902 43 D0 07 00 00 00 00 00'
    ],
    expected: { pgn: 130825, module: 2, page: 0, channel: 4, current: 0.5, level: 1000 }
  },
  {
    name: 'Compass Rose Control X Plus module 1 page 0 Freezer',
    lines: [
      '1DFF0900 20 1B 27 99 01 00 00 00',
      '1DFF0900 21 00 00 00 00 F0 01 F4',
      '1DFF0900 22 01 00 7D 00 00 00 00',
      '1DFF0900 23 00 00 00 00 00 00 00'
    ],
    expected: { pgn: 130825, module: 1, page: 0, channel: 2, current: 3.1 }
  }
]

const results = []
for (const testCase of cases) {
  const packets = []
  const reassembler = nmea.createFastPacketReassembler(packet => packets.push(packet))
  for (const line of testCase.lines) {
    const frame = nmea.parseRawLine('2026-10-03T00:00:00.000Z R ' + line)
    assert(frame, testCase.name + ': raw frame parse')
    assert.equal(frame.pgn, testCase.expected.pgn, testCase.name + ': CAN ID PGN')
    reassembler.accept(frame)
  }
  assert.equal(packets.length, 1, testCase.name + ': one reassembled packet')
  const packet = packets[0]
  const decoded = nmea.decodeControlXPlusCurrentPacket(packet.payload)
  assert(decoded, testCase.name + ': decode')
  assert.equal(decoded.module, testCase.expected.module)
  assert.equal(decoded.page, testCase.expected.page)
  const slot = decoded.slots.find(slot => slot.channel === testCase.expected.channel)
  assert(slot, testCase.name + ': channel')
  assert.equal(slot.current, testCase.expected.current)
  if (testCase.expected.level != null) assert.equal(slot.level, testCase.expected.level)
  results.push({
    name: testCase.name,
    source: 'signalk-czone/test/control-x-plus.test.js',
    pgn: packet.pgn,
    sourceAddress: packet.source,
    payloadHex: packet.payload.toString('hex'),
    payloadLength: packet.payload.length,
    decoded: { module: decoded.module, page: decoded.page, slot },
    referenceTransport: 'pass',
    canboatjsTransport: 'not-yet-tested',
    canboatjsFields: 'not-yet-tested'
  })
}

const out = path.resolve(__dirname, '../../../comparison-results')
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'raw-replay.json'), JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify(results, null, 2))
