'use strict'

// Compare CANboatjs beta's *actual* raw CAN-frame output with the reference
// payloads recorded by raw-replay.cjs. Unknown PGNs and transport failures
// are distinct outcomes; never report unknown fields as matching.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { FromPgn } = require(path.resolve(__dirname, '../../comparison/node_modules/@canboat/canboatjs'))

const resultsDir = path.resolve(__dirname, '../../comparison-results')
const reference = JSON.parse(fs.readFileSync(path.join(resultsDir, 'raw-replay.json'), 'utf8'))
const cases = [
  ['1DFF0902 40 1B 27 99 02 00 00 00','1DFF0902 41 40 1F 00 D0 17 00 00','1DFF0902 42 00 00 00 05 40 5F 00','1DFF0902 43 D0 07 00 00 00 00 00'],
  ['1DFF0900 20 1B 27 99 01 00 00 00','1DFF0900 21 00 00 00 00 F0 01 F4','1DFF0900 22 01 00 7D 00 00 00 00','1DFF0900 23 00 00 00 00 00 00 00']
]
assert.equal(reference.length, cases.length)
const report = []
for (let i = 0; i < cases.length; i++) {
  const parser = new FromPgn({ returnNonMatches: true, includeRawData: true, includeInputData: true })
  const messages = []
  const errors = []
  parser.on('error', (_pgn, error) => errors.push(String(error)))
  parser.on('warning', (_pgn, warning) => errors.push(String(warning)))
  for (const line of cases[i]) {
    const [canId, ...bytes] = line.split(' ')
    // candump2 is explicitly classified as a raw frame in canboatjs beta.5.
    const input = 'can0  ' + canId + '  [' + bytes.length + ']  ' + bytes.join(' ')
    parser.parseString(input, (err, pgn) => {
      if (err) errors.push(String(err))
      if (pgn) messages.push(pgn)
    })
  }
  const expected = reference[i]
  const matchingPgn = messages.filter(msg => msg.pgn === expected.pgn)
  const decoded = matchingPgn.map(msg => ({
    description: msg.description || msg.descriptionId || null,
    fields: msg.fields || null,
    rawData: msg.rawData || msg.data || null,
    input: msg.input || null
  }))
  const result = {
    name: expected.name, pgn: expected.pgn,
    referencePayloadHex: expected.payloadHex,
    canboatMessageCount: matchingPgn.length,
    canboatTransport: matchingPgn.length === 1 ? 'message-emitted' : 'no-single-message',
    canboatDecoded: decoded,
    errors,
    note: 'A message emitted does not prove payload-byte equality. Inspect rawData/input and fields.'
  }
  report.push(result)
  console.log(JSON.stringify(result))
}
fs.writeFileSync(path.join(resultsDir, 'canboatjs-beta5.json'), JSON.stringify(report, null, 2) + '\n')
