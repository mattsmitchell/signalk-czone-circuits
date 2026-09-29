'use strict'
const assert = require('assert')
const nmea = require('../lib/nmea2000')
const czone = require('../lib/czone')

// Captured CZone circuit-status frame: CAN ID 1C FF 04 06 is exposed as PGN 65284.
assert.strictEqual(nmea.getPgnFromCanId(0x1CFF0406), 65284)

const line = nmea.czoneLine({ src: 200, data: czone.on(0x65) })
const fields = line.split(',')
assert.strictEqual(fields[1], '7')
assert.strictEqual(fields[2], '65280')
assert.strictEqual(fields[3], '200')
assert.strictEqual(fields[4], '255')
assert.strictEqual(fields[5], '8')
assert.deepStrictEqual(fields.slice(6), ['27','99','65','00','00','08','f1','00'])
console.log(line)
console.log('NMEA output test passed')

const modeLine = nmea.czoneLine({ src: 0x29, data: czone.modeActivate(0x4D) })
const modeFields = modeLine.split(',')
assert.strictEqual(modeFields[1], '7')
assert.strictEqual(modeFields[2], '65280')
assert.strictEqual(modeFields[3], '41')
assert.strictEqual(modeFields[4], '255')
assert.strictEqual(modeFields[5], '8')
assert.deepStrictEqual(modeFields.slice(6), ['27','99','4d','00','00','24','f1','00'])

assert.deepStrictEqual([...czone.modeActivate(0x53)], [0x27,0x99,0x53,0x00,0x00,0x24,0xF1,0x00])
assert.deepStrictEqual([...czone.modeActivate(0x4D)], [0x27,0x99,0x4D,0x00,0x00,0x24,0xF1,0x00])
assert.deepStrictEqual([...czone.modeActivate(0x4E)], [0x27,0x99,0x4E,0x00,0x00,0x24,0xF1,0x00])
assert.deepStrictEqual([...czone.modeActivate(0x56)], [0x27,0x99,0x56,0x00,0x00,0x24,0xF1,0x00])

console.log('NMEA output and Mode command tests passed')

assert.deepStrictEqual([...czone.configReadRequest()], [0x27,0x99,0x00,0x00,0x00,0x00,0xC0,0xFF])
assert.deepStrictEqual([...czone.configDataBlockAck(0xF8, 5, 0)], [0x27,0x99,0xF8,0x00,0x05,0x00,0xFF,0x03])
assert.deepStrictEqual([...czone.configDataBlockAck(0xF8, 0x1234, 1)], [0x27,0x99,0xF8,0x01,0x34,0x12,0xFF,0x03])
console.log('CZone network configuration command tests passed')
