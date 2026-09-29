'use strict'

function delta (path, value, source = 'signalk-czone-circuits') {
  const sourceInfo = typeof source === 'string'
    ? { label: source, type: 'CZone' }
    : { ...source }
  return {
    context: 'vessels.self',
    updates: [{
      source: sourceInfo,
      timestamp: new Date().toISOString(),
      values: [{ path, value }]
    }]
  }
}

function circuitSource (circuit) {
  return circuit && circuit.source ? circuit.source : 'signalk-czone-circuits'
}

function circuitDelta (path, value, circuit, sourceOverride = null) {
  return delta(path, value, sourceOverride || circuitSource(circuit))
}

function statePath (circuit) {
  return `electrical.czone.${circuit.slug}.switch.state`
}

function brightnessPath (circuit) {
  return `electrical.czone.${circuit.slug}.switch.brightness`
}

function modeActivePath () {
  return 'electrical.czone.mode.active'
}

function nmea2000Source (src, pgn) {
  return {
    label: 'CZone-DC',
    type: 'NMEA2000',
    src: String(src),
    pgn: Number(pgn)
  }
}

module.exports = { delta, circuitDelta, circuitSource, nmea2000Source, statePath, brightnessPath, modeActivePath }
