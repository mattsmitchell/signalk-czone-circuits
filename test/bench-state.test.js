'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const path = require('path')
const pluginFactory = require('../index')

const zcfSource = path.join(__dirname, 'fixtures', 'TestBench.zcf')
if (!fs.existsSync(zcfSource)) {
  console.log('TestBench state tests skipped: TestBench.zcf not present')
  process.exit(0)
}

const configPath = fs.mkdtempSync(path.join(os.tmpdir(), 'signalk-czone-bench-state-'))
const rawListeners = new Map()
const deltas = []
const app = {
  config: { configPath },
  isNmea2000OutAvailable: true,
  on: (event, fn) => rawListeners.set(event, fn),
  removeListener: event => rawListeners.delete(event),
  emit: () => {},
  debug: () => {},
  registerPutHandler: () => {},
  handleMessage: (_id, delta) => deltas.push(delta),
  setPluginStatus: () => {}
}

const plugin = pluginFactory(app)
const installationDir = path.join(configPath, 'plugin-config-data', 'signalk-czone-circuits')
fs.mkdirSync(installationDir, { recursive: true })
fs.copyFileSync(zcfSource, path.join(installationDir, 'installation.zcf'))
plugin.start({})

const raw = data => rawListeners.get('canboatjs:rawoutput')(
  `2026-09-30T08:00:00.000Z R 1CFF0400 ${data}`
)

raw('27 99 01 0F 00 00 00 00')
raw('27 99 01 0F 30 00 00 00')

const light5Path = 'electrical.czone.Light_5.switch.state'
const light5Deltas = deltas.filter(d => d.updates[0].values.some(v => v.path === light5Path))
assert.strictEqual(light5Deltas.at(-1).updates[0].values.find(v => v.path === light5Path).value, true)

// The observed 0x30 bitmap contains both Light 5 (0x10) and Buzzer (0x20).
// The logical Light 5 circuit must follow its own 0x10 load mask.
raw('27 99 01 0F 20 00 00 00')
assert.strictEqual(
  deltas.at(-1).updates[0].values.find(v => v.path === light5Path).value,
  false
)

plugin.stop()
console.log('TestBench 65284 load-mask state tests passed')
