'use strict'
// Native Canboat custom definitions for the documented 28-byte CZone current
// tables. Synthetic vectors test field layouts; they are NOT captured frames.
const assert = require('node:assert/strict')
const path = require('node:path')
const { FromPgn } = require(path.resolve(__dirname, '../../../comparison/node_modules/@canboat/canboatjs'))
function definition(pgn, ac) {
  const fields = []
  function add(id, offset, bits, resolution, match) {
    const f = {Order:fields.length+1,Id:id,Name:id,BitOffset:offset,BitStart:offset%8,BitLength:bits,Signed:false,FieldType:'NUMBER'}
    if (resolution !== undefined) f.Resolution = resolution
    if (match !== undefined) f.Match = match
    fields.push(f)
  }
  add('czoneSignature',0,16,undefined,0x9927)
  if (ac) { add('page',16,8);add('module',24,8) }
  else { add('module',16,8);add('page',24,8) }
  for (let i=0;i<8;i++) {
    add('current'+i,32+i*24,8,ac?0.2:0.1)
    // Secondary value is meaningful as a DC level. AC slot bytes 1-2
    // are deliberately left opaque pending validation.
    add(ac?'opaque'+i:'rawLevel'+i,40+i*24,16)
  }
  return {PGN:pgn,Id:'czone'+pgn+'Research',Description:'CZone '+pgn+' current (research)',Type:'Fast',Complete:true,Length:28,RepeatingFields:0,Fields:fields}
}
const definitions={PGNs:[definition(130822,false),definition(130817,true)]}
const parser=new FromPgn({returnNonMatches:true,includeRawData:true,onPropertyValues:(name,cb)=>{
  if(name==='canboat-custom-pgns')cb([{setter:'czone-current-research',value:definitions}])
}})
function parse(pgn,bytes) {
  const src=9, prio=7, dst=255
  const results=[]
  // Supply a complete reassembled payload directly; transport reassembly is
  // independently tested with captured Control X Plus CAN frames.
  parser.parsePgnData({pgn,src,prio,dst,timestamp:'2026-11-02T00:00:00.000Z'},bytes.length,bytes,true,(err,msg)=>{
    if(err)throw Error(String(err))
    if(msg)results.push(msg)
  })
  assert.equal(results.length,1,'one decoded PGN')
  const msg=results[0]
  assert.equal(msg.id,'czone'+pgn+'Research','native custom definition selected')
  assert.equal(Buffer.from(msg.rawData).toString('hex'),bytes.toString('hex'),'byte exact')
  return msg.fields
}
function packet(ac) {
  const b=Buffer.alloc(28)
  b[0]=0x27;b[1]=0x99
  b[2]=ac?3:0x28;b[3]=ac?0xf8:2
  return b
}
const dc=packet(false)
dc[4+3*2]=31 // 3.1 A
dc.writeUInt16LE(2024,5+3*2) // 100% per validated DC table
dc[4+3*4]=5 // 0.5 A
dc.writeUInt16LE(1024,5+3*4) // OFF
const dcFields=parse(130822,dc)
assert.equal(dcFields.module,0x28)
assert.equal(dcFields.page,2)
assert.equal(dcFields.current2,3.1)
assert.equal(dcFields.rawLevel2,2024)
assert.equal(dcFields.current4,0.5)
assert.equal(dcFields.rawLevel4,1024)
const ac=packet(true)
ac[4]=40 // 8 A at 0.2 A/count
ac[5]=0x12;ac[6]=0x34 // intentionally opaque
const acFields=parse(130817,ac)
assert.equal(acFields.module,0xf8)
assert.equal(acFields.page,3)
assert.equal(acFields.current0,8)
assert.equal(acFields.opaque0,0x3412)
console.log(JSON.stringify({kind:'synthetic native PGN definition vectors',dc:dcFields,ac:acFields}))
