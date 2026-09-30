'use strict'

const assert = require('assert')
const path = require('path')
const zcf = require('../lib/zcf')

const fixture = path.join(__dirname, 'fixtures', 'SugarShack-20260927-01.zcf')
const mapping = zcf.load(fixture)

assert.deepStrictEqual(mapping.statusTable && mapping.statusTable.format, 'status-table-bit-record')
assert.strictEqual(mapping.statusTable.recordCount, 102)

const fridge100 = mapping.circuits.find(c => c.name === '100L Fridge')
const fridge200 = mapping.circuits.find(c => c.name === '200L Fridge')
const fridge200Light = mapping.circuits.find(c => c.name === '200L Fridge Light')

assert(fridge100)
assert(fridge200)
assert(fridge200Light)

assert.deepStrictEqual(
  [fridge100.statusModule, fridge100.statusBit, fridge100.statusMask],
  [0x14, 13, 1 << 13]
)
assert.deepStrictEqual(
  [fridge200.statusModule, fridge200.statusBit, fridge200.statusMask],
  [0x1A, 13, 1 << 13]
)
assert.deepStrictEqual(
  [fridge200Light.statusModule, fridge200Light.statusBit, fridge200Light.statusMask],
  [0x1A, 1, 1 << 1]
)

// The structural status parser must not depend on a file-wide name search.
const zcfSource = require('fs').readFileSync(path.join(__dirname, '..', 'lib', 'zcf.js'), 'utf8')
assert.strictEqual(zcfSource.includes('buf.indexOf(needle'), false)

console.log('Structural ZCF status-table mapping tests passed')
