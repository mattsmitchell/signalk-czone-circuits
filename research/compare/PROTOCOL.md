# CZone proprietary current PGNs — research notes

Source of truth: [signalk-czone README](https://github.com/mattsmitchell/signalk-czone/blob/main/README.md), [current decoder](https://github.com/mattsmitchell/signalk-czone/blob/main/lib/nmea2000.js), and captured [Control X Plus tests](https://github.com/mattsmitchell/signalk-czone/blob/main/test/control-x-plus.test.js). This is research documentation, not an official CZone specification. Keep distinct PGN layouts and confidence levels separate.

## PGN 130822 — DC/COI current and level (validated)

The active plugin documents 3-byte records:
- Record byte 0: current in **0.1 A/count**.
- Record bytes 1–2: unsigned little-endian secondary value `value_raw = byte1 | (byte2 << 8)`.

| Secondary raw value | Meaning | Percent |
| --- | --- | --- |
| `0x0400` (1024) | OFF | 0% |
| `0x0401`–`0x07E7` (1025–2023) | DIMMED | `(value_raw - 1024) / 10` |
| `0x07E8` (2024) | ON | 100% |
| `0x07E9`–`0x0800` (2025–2048) | ON | 100% |
| Other | UNKNOWN | not established |

The README states the dimmed encoding was checked at 60%, 75%, 80%, 90%, and 100%. Do not confuse the 16-bit secondary value with current.

## PGN 130817 — AC/ACOI current (partially validated)

28-byte payload: signature `27 99`, page byte 2, module byte 3, then eight 3-byte slots. For the validated Water Heater Port slot, slot byte 0 is **0.2 A/count** (0x28 = 40 = 8.0 A). Other two bytes per slot remain opaque.

## PGN 130825 — Control X Plus current (captured and decoded)

27-byte fast-packet payload with signature `27 99`; byte 2 module, byte 3 page. Eight slots begin at bit offset 40, each consisting of an **11-bit unsigned raw current** followed by an **11-bit unsigned raw level**, least-significant-bit-first. Channel is `page * 8 + slotIndex`. The current decoder uses `current_A = rawCurrent / 10` when `rawLevel != 0`, otherwise reports 0 A and OFF.

Captured examples (Compass Rose):
- Module 2, page 0, channel 4: rawCurrent 5, **0.5 A**, rawLevel **1000**.
- Module 1, page 0, channel 2: rawCurrent 31, **3.1 A**; the replay also reports rawLevel **1000**.

**Important:** `rawLevel = 1000` is a wire value, **not 1000%**. The documented 130822 offset encoding (`1024` OFF, `2024` 100%) is **not interchangeable** with 130825's 11-bit field. For 130825, OFF at 0 is established by the decoder/tests; any percentage conversion or full-scale interpretation requires separate validation. Expose `rawLevel` without asserting percent until validated.

## Canboat integration boundary

The research workflow demonstrated canboatjs 4.0.0-beta.5 reassembling both captured 130825 packets and exposing manufacturer `BEP Marine` plus opaque proprietary bytes. Our CZone decoder supplies module, page, channel, current, and raw level. Proposed upstream work is a reusable field definition or extension, **not** Signal K-specific circuit naming, ZCF mapping, or UI behavior. Tests should assert exact reassembled bytes and scaled currents, while keeping unknown fields explicit.
