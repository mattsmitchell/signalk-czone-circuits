'use strict'

// Canboat's native custom-PGN field decoder: no signalk-czone decoder invoked.
// Field offsets are grounded in the Control X Plus reference decoder.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { FromPgn } = require(path.resolve(__dirname, '../../../comparison/node_modules/@canboat/canboatjs'))
const dir = path.resolve(__dirname, '../../../comparison-results')
const reference = JSON.parse(fs.readFileSync(path.join(dir, 'raw-replay.json'), 'utf8'))
const frames = [
  ['1DFF0902 40 1B 27 99 02 00 00 00','1DFF0902 41 40 1F 00 D0 17 00 00','1DFF0902 42 00 00 00 05 40 5F 00','1DFF0902 43 D0 07 00 00 00 00 00'],
  ['1DFF0900 20 1B 27 99 01 00 00 00','1DFF0900 21 00 00 00 00 F0 01 F4','1DFF0900 22 01 00 7D 00 00 00 00','1DFF0900 23 00 00 00 00 00 00 00']
]
const fields = []
function field(id, name, offset, width, resolution) {
  const result = { Order: fields.length + 1, Id: id, Name: name, BitOffset: offset, BitStart: offset % 8, BitLength: width, Signed: false, FieldType: 'NUMBER' }
  if (resolution !== undefined) result.Resolution = resolution
  fields.push(result)
}
field('manufacturerCodeRaw', 'Manufacturer Code Raw', 0, 16)
// Compete with the built-in BEP proprietary definition using a signature match.
fields[0].Match = 0x9927
field('module', 'Module', 16, 8)
field('page', 'Page', 24, 8)
field('reserved', 'Reserved', 32, 8)
for (let i = 0; i < 8; i++) {
  field('current'+i, 'Current '+i, 40 + i * 22, 11, 0.1)
  field('rawLevel'+i, 'Raw Level '+i, 51 + i * 22, 11)
}
const definitions = { PGNs: [{
  PGN: 130825, Id: 'czoneControlXPlusCurrentResearch',
  Description: 'CZone Control X Plus current (research)',
  Type: 'Fast', Complete: true, Length: 27, RepeatingFields: 0,
  Fields: fields
}] }
const parser = new FromPgn({
  returnNonMatches: true, includeRawData: true,
  onPropertyValues: (name, callback) => {
    if (name === 'canboat-custom-pgns') callback([{setter:'czone-research',value:definitions}])
  }
})
const report = []
for (let i = 0; i < frames.length; i++) {
  const messages = []
  for (const line of frames[i]) {
    const [canId,...bytes] = line.split(' ')
    parser.parseString('can0  '+canId+'  ['+bytes.length+']  '+bytes.join(' '), (err,pgn) => {
      if (err) throw new Error(String(err))
      if (pgn) messages.push(pgn)
    })
  }
  const matches = messages.filter(x => x.pgn === 130825)
  assert.equal(matches.length,1,reference[i].name+': one native message')
  const msg = matches[0]
  assert.equal(Buffer.from(msg.rawData).toString('hex'),reference[i].payloadHex,'exact bytes')
  const values = msg.fields
  console.log('NATIVE_DIAGNOSTIC', JSON.stringify({description:msg.description,id:msg.id,fields:values,errors:msg.errors}))
  assert(values,'native fields')
  const get = (id,name) => values[id] ?? values[name]
  assert.equal(get('module','Module'),reference[i].decoded.module,'module')
  assert.equal(get('page','Page'),reference[i].decoded.page,'page')
  const slot = reference[i].decoded.slot
  const raw = get('current'+slot.channel,'Current '+slot.channel)
  const level = get('rawLevel'+slot.channel,'Raw Level '+slot.channel)
  assert.equal(level,slot.level,'raw level')
  // Native resolution is 0.1 A/count; if decoder emits raw counts instead,
  // this assertion deliberately fails so we can inspect its actual behavior.
  assert.equal(raw,slot.current,'scaled amps')
  report.push({name:reference[i].name,description:msg.description,fields:values,expected:slot,byteExact:true})
  console.log(JSON.stringify(report[report.length-1]))
}
fs.writeFileSync(path.join(dir,'canboat-native-130825.json'),JSON.stringify(report,null,2)+'\n')
