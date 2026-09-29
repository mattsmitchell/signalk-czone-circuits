
### Alpha.34 webapp state synchronization

- Signal K WebSocket deltas are now the primary live state source for circuit `switch.state` and `switch.brightness`.
- Removed the 5-second `/circuits` polling loop.
- A WebSocket watchdog performs one REST `/circuits` reconciliation only after 120 seconds without a Signal K delta, then resets its timer.
- WebSocket reconnects trigger a recovery path without creating a high-frequency polling loop.
- Circuit commands update the UI optimistically and show a `Sending…` indicator until authoritative CZone state/brightness is observed.
- If the command is rejected or CZone reports a different value, the UI rolls back/reconciles to the observed value.
- The NMEA 2000/CZone command encoding is unchanged from Alpha.33.

### Alpha.33 outbound switch commands

- Non-dimmable ON/OFF commands now use the live-captured CZone PGN 65280 switch sequence (`F1`/`F2` with parameter `0x24`, followed by the `0x40` completion frame).
- Dimmable circuits now use the captured CZone ON/OFF sequences (`F5` + `43` for ON; `F5` + `95` + `42` for OFF).
- Moving a dimmer slider while the circuit is OFF first sends the CZone dimmer ON sequence, then the requested `FC` level command.
- Debug logging records all frames in a multi-frame command sequence.

# signalk-czone-circuits

Signal K control plugin for CZone circuits and Modes using a dynamically uploaded
CZone ZCF configuration.


### CZone command PGN

Outbound CZone circuit commands are emitted as raw NMEA 2000 PGN **65280 (0xFF00)**. Some tooling represents the same proprietary CZone family in the DP-numbered range (130816); the plugin accepts that alias when decoding input, but deliberately uses 65280 for outbound Actisense/NMEA 2000 frames because that is the on-wire PGN observed in CZone captures.

## Plugin boundary

This plugin is intentionally separate from the existing `signalk-czone` plugin:

- **signalk-czone**: read-only CZone telemetry/reporting, including current measurements.
- **signalk-czone-circuits**: active circuit/brightness/Mode control and NMEA 2000 output.

This plugin does **not** publish `electrical.czone.<circuit>.current`.

## Safety interlock

`Enable NMEA 2000 sending` defaults to **false**. No CZone control frame is emitted
unless the administrator explicitly enables sending and Signal K reports that NMEA 2000 output is available.

The plugin does **not** configure or claim an NMEA 2000 source address. It sends through Signal K's `nmea2000out` path and lets the active canboatjs NMEA 2000 connection own address claiming and source-address selection.
The ZCF can still be uploaded and inspected with sending disabled.


## ZCF model

The supplied live ZCF contains 106 structural circuit records. Each circuit retains:

- ZCF circuit/control ID
- module/device address
- channel/page/slot
- stable Signal K slug
- switch capability
- dimmer capability where the empirically identified `0F 01 00 00` control object is present
- protocol confidence (`capture` for sampled mappings, `zcf-derived` for provisional mappings)
- CZone runtime status mapping (`statusModule` + `statusBit`) decoded from the ZCF status/output table

The current live configuration identifies 13 dimmable circuits.

Mode records retain both identifiers:

- `id`: 16-bit ZCF configuration/object ID
- `runtimeId`: one-byte live `27 99` control ID
- `modeGroupId`: currently observed as `0x01`; semantic meaning is **provisional** pending a ZCF containing another Mode Group

The current live ZCF contains four Modes: Anchored, Day Crusing, Night Cruising and Sleep.

## Confirmed CZone control protocol

Individual control uses the empirically verified proprietary eight-byte payload:

```text
27 99 <control-id> 00 <percent> <parameter> <operation> 00
```

Confirmed operations:

- `F1` = ON
- `F2` = OFF
- `FC` = level

For tested level commands, `<percent>` is the literal decimal percentage byte.

Examples:

```text
27 99 65 00 00 08 F1 00
27 99 65 00 00 08 F2 00
27 99 65 00 32 08 FC 00
```

Yacht Devices CanView may display an `8` data-length field before the payload. That `8`
is **not** part of the CAN payload.

### Confirmed Mode activation

Mode activation is one CZone frame; the plugin does not replay the Mode action list:

```text
27 99 53 00 00 24 F1 00  # Day Crusing
27 99 4D 00 00 24 F1 00  # Night Cruising
27 99 4E 00 00 24 F1 00  # Anchored
27 99 56 00 00 24 F1 00  # Sleep
```

There is no Mode OFF command in the current model. A Mode is a persistent selection;
after system restart the plugin performs a short startup reconciliation using observed CZone circuit states. This is a fuzzy best-match fallback only; an authoritative Mode activation frame always takes precedence.

## Signal K control paths

Circuit state:

```text
electrical.czone.<circuit>.switch.state
```

Dimmable circuit brightness:

```text
electrical.czone.<circuit>.switch.brightness
```

Mode selection:

```text
electrical.czone.mode.active
```

Mode writes accept a Mode slug or ZCF display name. A false/off value is not valid.

Writes are treated as requests. Circuit ON/OFF state is published from CZone PGN 65284
status bitmaps. PGN 130822 is used for DC level/brightness telemetry only and is not used
to infer switch state from load current or brightness. A received Mode activation frame is authoritative during normal operation. After plugin startup, the plugin may publish a fuzzy best-match Mode once enough circuit-status observations have arrived. Startup inference is performed only once and does not re-evaluate the Mode when individual circuits are manually overridden.

## ZCF upload

The Signal K configuration panel provides a dedicated `.zcf` upload control similar to
the existing `signalk-czone` plugin. The uploaded file is parsed and validated before it
replaces the installed ZCF. A successful upload persists the configuration and restarts
the plugin so that Signal K PUT handlers are rebuilt against the new ZCF.

The installed ZCF is stored under the plugin data directory as `installation.zcf`.

## Development status

The implementation is an alpha-stage reverse-engineering project. Unknown proprietary
fields are retained rather than guessed. The generic ZCF-derived circuit control mapping
is provisional for circuits that have not yet been individually exercised on the live bus.
Further captures can promote mappings from `zcf-derived` to empirically verified profiles.


### Alpha.24

The ZCF parser now decodes the separate runtime status/output table. Each logical circuit
can therefore carry its CZone runtime `statusModule` and `statusBit`; these are the identities
used to decode PGN 65284. This replaces the previous assumption that the primary ZCF
module/channel (or a fixed module offset) maps directly to the 65284 bitmap.

PGN 65284 is authoritative for `switch.state`. PGN 130822 supplies level/brightness
telemetry and no longer synthesizes `switch.state` from current or level.

### Alpha.21

Observed ON/OFF state is sourced from CZone PGN 65284 circuit-status bitmaps. The ZCF module/slot identifies the circuit; the NMEA-2000 source address identifies the reporting CZone module. PGN 130822 remains the source for DC current/level telemetry.

### Mode observation (Alpha.42)

CZone mode changes are treated as authoritative from the proprietary CZone mode transaction on PGN 65280: `27 99 <mode runtime ID> 00 00 24 F1 00`. Individual circuit state changes do not invalidate the active mode, because circuits can be overridden while a mode remains active. The following `0x40` CZone transaction-complete frame is logged when observed but is not treated as a separate mode identity.

### Startup Mode reconciliation (Alpha.42)

CZone does not appear to periodically broadcast the selected Mode on the observed NMEA 2000 traffic. After a Signal K/plugin restart, Alpha.42 therefore collects the repeating PGN 65284 circuit-status observations and performs a **fuzzy best-match** against the Mode action targets decoded from the ZCF. Expected-ON actions are weighted more heavily than expected-OFF actions because OFF-heavy Mode definitions are otherwise ambiguous. The plugin requires a clear score margin before publishing the inferred Mode.

This reconciliation is deliberately startup-only. Once a Mode has been inferred, or once an authoritative `F1` Mode activation is observed, individual circuit changes never invalidate the active Mode. This allows a user to turn a circuit on/off manually while remaining in the selected CZone Mode.


### Alpha.44 network configuration read

The plugin can explicitly request the complete CZone configuration from the network. This is **not** performed during Signal K startup. The webapp action **Read From Network and Save** sends the observed CZone configuration-read request on PGN 65290, receives/reassembles the CZone DataBlock transfer on PGN 130816, acknowledges each DataBlock on PGN 65291, validates the reconstructed configuration with the existing ZCF parser, and saves the resulting raw configuration bytes using a `.czone.net` extension.

The saved filename is based on the vessel name embedded in the received configuration when available, then Signal K's `vessels.self.name`, then the generic `CZone Network` name. A JSON sidecar records acquisition metadata. The network read is exposed in the **Signal K Plugin Config** panel, not as a normal runtime webapp action. After a successful read, the resulting `.czone.net` file appears in the Plugin Config source selector and can be explicitly selected for future startup. Switching back to **Use installed/uploaded ZCF** is also available there. This keeps Signal K startup on the fast local-file path and avoids a multi-second CZone configuration transfer on every restart.

`.czone.net` is intentionally used instead of `.zcf`: the plugin has reconstructed the CZone configuration byte stream from the network, but does not claim to produce an officially sanctioned CZone configuration file.
