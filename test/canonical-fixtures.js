'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const BASE_URL = 'https://raw.githubusercontent.com/mattsmitchell/signalk-czone-zcf/main/test/fixtures'
const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signalk-czone-circuits-zcf-'))
const cache = new Map()

async function fixturePath(filename) {
  if (cache.has(filename)) return cache.get(filename)

  const response = await fetch(`${BASE_URL}/${encodeURIComponent(filename)}`)
  if (!response.ok) throw new Error(`Failed to download canonical ZCF fixture ${filename}: HTTP ${response.status}`)

  const filePath = path.join(cacheDir, filename)
  fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()))
  cache.set(filename, filePath)
  return filePath
}

module.exports = { fixturePath }
