'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const zcf = require('../lib/zcf')
const czone = require('../lib/czone')
const signalk = require('../lib/signalk')

assert.deepStrictEqual([...czone.on(0x65)], [0x27,0x99,0x65,0x00,0x00,0x08,0xF1,0x08])
assert.deepStrictEqual([...czone.off(0x65)], [0x27,0x99,0x65,0x00,0x00,0x08,0xF2,0x08])
assert.deepStrictEqual([...czone.dimmerOn(0x45, 0x24)[0]], [0x27,0x99,0x45,0x00,0x00,0x24,0xF5,0x08])
assert.deepStrictEqual([...czone.dimmerOn(0x45, 0x24)[1]], [0x27,0x99,0x45,0x00,0x00,0x24,0x95,0x08])
assert.deepStrictEqual([...czone.dimmerOn(0x45, 0x24)[2]], [0x27,0x99,0x45,0x00,0x00,0x24,0x43,0x08])
assert.deepStrictEqual([...czone.dimmerOff(0x45, 0x24)[0]], [0x27,0x99,0x45,0x00,0x00,0x24,0xF5,0x08])
assert.deepStrictEqual([...czone.dimmerOff(0x45, 0x24)[1]], [0x27,0x99,0x45,0x00,0x00,0x24,0x95,0x08])
assert.deepStrictEqual([...czone.dimmerOff(0x45, 0x24)[2]], [0x27,0x99,0x45,0x00,0x00,0x24,0x42,0x08])
assert.deepStrictEqual([...czone.switchComplete(0x2e, 0x24)], [0x27,0x99,0x2e,0x00,0x00,0x24,0x40,0x08])
assert.deepStrictEqual([...czone.level(0x65, 50)], [0x27,0x99,0x65,0x00,0x32,0x08,0xFC,0x08])
assert.deepStrictEqual([...czone.level(0x45, 75, 0x24)], [0x27,0x99,0x45,0x00,0x4B,0x24,0xFC,0x08])
const currentZcfPath = path.join(__dirname, 'fixtures', 'SugarShack-20260927-01.zcf')
if (fs.existsSync(currentZcfPath)) {
  const current = zcf.load(currentZcfPath)
  const currentStatusMappingCount = current.circuits.filter(c => Number.isInteger(c.statusModule) && Number.isInteger(c.statusBit)).length
  assert.strictEqual(currentStatusMappingCount, 100)
  assert.deepStrictEqual(
    current.modes.map(m => [m.id, m.runtimeId, m.modeGroupId, m.name, m.actionCount, m.parsedActionCount, m.truncated]),
    [
      [1004, 0x4E, 0x01, 'Anchored', 18, 18, false],
      [1002, 0x53, 0x01, 'Day Crusing', 19, 19, false],
      [1003, 0x4D, 0x01, 'Night Cruising', 16, 16, false],
      [1007, 0x56, 0x01, 'Sleep', 26, 26, false]
    ]
  )
  assert.deepStrictEqual(
    current.modes.map(m => m.actions.map(a => a.value)),
    [
      [1000,1000,0,0,0,0,0,500,0,0,0,0,0,1000,0,0,0,0],
      [1000,0,1000,900,1000,1000,1000,1000,1000,0,1000,0,0,1000,1000,0,0,1000,1000],
      [1000,0,700,200,1000,1000,1000,100,1000,1000,1000,200,1000,1000,1000,1000],
      [0,300,0,0,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
  )
}

console.log('CZone circuit skeleton tests passed')
