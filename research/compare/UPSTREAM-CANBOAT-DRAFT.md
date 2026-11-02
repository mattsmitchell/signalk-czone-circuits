# Upstream CANboat YAML contribution draft — NOT yet upstream-validated

Target: `canboat/canboat` `master`, `database/pgns/`. Verified against upstream YAML layout and CONTRIBUTING.md on 2026-11-02. This is a **proposal**, not a completed `keel check` or `make generated` run.

## Existing files — modify rather than duplicate
- `database/pgns/130822-bepMarineProprietaryPgn130822.yaml`
- `database/pgns/130825-bepMarineProprietaryPgn130825.yaml`
- `database/pgns/130817-bepMarineCzoneStatusExtended.yaml` — **hold for reconciliation**, see below.

All three already exist. Preserve the upstream proprietary preamble exactly: manufacturerCode (11-bit LOOKUP, match 295), reserved (2-bit RESERVED), industryCode (3-bit LOOKUP, match 4). The first two bytes `27 99` are that 16-bit preamble, **not** a separate signature field.

## Proposed replacement fields after the existing 16-bit manufacturer preamble

### PGN 130822 (28 bytes, 8 × 24-bit records)

After the manufacturer header, byte 2 identifies the module and byte 3 selects the page. Each 3-byte record represents one consecutive output channel: channel = page × 8 + slot (slot 0–7). The first byte is measured output current in 0.1 A/count; the following little-endian UINT16 is an **output level/state code**, not a physical measurement. The code is 1024 = OFF (0%), 1025–2023 = DIMMED ((code − 1024)/10 percent), 2024 = ON (100%), and 2025–2048 = ON (100%) in the current plugin's interpretation. Codes outside these ranges are unknown. This mapping should be described once here, rather than repeated verbatim for every slot.
```yaml
- id: module
  name: Module
  type: UINT8
- id: page
  name: Page
  type: UINT8
- id: current0
  name: Current 0
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode0
  name: Output Level Code 0
  type: UINT16
- id: current1
  name: Current 1
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode1
  name: Output Level Code 1
  type: UINT16
- id: current2
  name: Current 2
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode2
  name: Output Level Code 2
  type: UINT16
- id: current3
  name: Current 3
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode3
  name: Output Level Code 3
  type: UINT16
- id: current4
  name: Current 4
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode4
  name: Output Level Code 4
  type: UINT16
- id: current5
  name: Current 5
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode5
  name: Output Level Code 5
  type: UINT16
- id: current6
  name: Current 6
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode6
  name: Output Level Code 6
  type: UINT16
- id: current7
  name: Current 7
  type: UINT8
  resolution: 0.1
  unit: A
- id: outputLevelCode7
  name: Output Level Code 7
  type: UINT16
``
The 130822 level/state code is retained as a wire-level UINT16; its state and percentage mapping above is the active plugin's interpretation, rather than a calibrated physical unit. Current values are 0.1 A/count in the existing plugin and match the captured payload layout. Check `unit: A` spelling against keel's field-type/unit rules before submitting.

### PGN 130825 (27 bytes, 8 × 22-bit records)

The eight non-byte-aligned records each describe one physical output channel, ordered by slot (channel = page × 8 + slot). Each record has an 11-bit **output current** in 0.1 A/count followed by an 11-bit **output level code**. Zero level means OFF; 1000 is treated as full output (100%) by the Signal K application. The level is a wire code, not a current or voltage. In the active application, current is only published when the output level is nonzero. This description applies to every record; numbered field identifiers are necessary only to represent the eight fixed slots in the current proposed YAML.
```yaml
- id: module
  name: Module
  type: UINT8
- id: page
  name: Page
  type: UINT8
- id: reservedPayload
  name: Reserved
  type: RESERVED
  bits: 8
- id: outputCurrent0
  name: Output Current 0
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode0
  name: Output Level Code 0
  type: UINT16
  bits: 11
- id: outputCurrent1
  name: Output Current 1
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode1
  name: Output Level Code 1
  type: UINT16
  bits: 11
- id: outputCurrent2
  name: Output Current 2
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode2
  name: Output Level Code 2
  type: UINT16
  bits: 11
- id: outputCurrent3
  name: Output Current 3
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode3
  name: Output Level Code 3
  type: UINT16
  bits: 11
- id: outputCurrent4
  name: Output Current 4
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode4
  name: Output Level Code 4
  type: UINT16
  bits: 11
- id: outputCurrent5
  name: Output Current 5
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode5
  name: Output Level Code 5
  type: UINT16
  bits: 11
- id: outputCurrent6
  name: Output Current 6
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode6
  name: Output Level Code 6
  type: UINT16
  bits: 11
- id: outputCurrent7
  name: Output Current 7
  type: UINT16
  bits: 11
  resolution: 0.1
  unit: A
- id: outputLevelCode7
  name: Output Level Code 7
  type: UINT16
  bits: 11
``
For 130825, outputCurrent is the wire current count scaled by 0.1 A/count; the active plugin suppresses current when outputLevelCode is zero. Observed rawLevel 1000 maps to 100% **in the application**, but preserve wire raw values upstream. Verify keel accepts non-byte-aligned `UINT16` with `bits: 11`; adjust using a supported numeric field type if needed. Confirm whether byte 4 is consistently reserved from additional captures.

## PGN 130817 — do not replace existing semantics yet

Upstream `130817-bepMarineCzoneStatusExtended.yaml` already describes per-circuit records as circuit ID + packed 10-bit signed magnitude and cites https://github.com/dirkwa/czone-spec/blob/main/spec/pgn-130817.md. Our SugarShack frame (`279900f800000400000400000400000400000400000400e80700e80f`) is compatible with an eight-slot 3-byte layout and zero current bytes, **but does not distinguish** the upstream interpretation from an AC current table. Our 0.2 A/count claim is not validated by these all-zero captures. Avoid overwriting that upstream variant or introducing an indistinguishable competing variant. Ask maintainer to reconcile with existing public evidence; retain the secondary 16 bits as opaque until differentiated.

## Evidence and build procedure

- Research fixtures: `research/compare/sugarshack-captured-current.json` (source-labeled 130822 and 130817 payloads).
- Captured Control X Plus frames and assertions: `research/compare/canboat-native-130825.cjs`.
- Synthetic plus captured native tests: `research/compare/canboat-native-130822-130817.cjs`.
- Reference: https://github.com/mattsmitchell/signalk-czone-circuits/pull/4
- For upstream, attach original raw fast-packet frames or provenance-backed samples under `samples/`, not just synthetic data.
- In a CANboat checkout run `keel/keel check`, `make generated`, `make pr`. Commit all generated artifacts in lockstep; this research checkout has **not** run those commands.
- Suggested draft PR title: `feat(bep): decode CZone DC and Control X Plus current tables`.


## Repeating field support — verified against upstream YAML

CANboat's current YAML supports an inline `- repeat:` entry containing
`fields:`, with an optional `countField:` for count-driven repetition.
See `database/pgns/129540-gnssSatsInView.yaml` and
`database/pgns/130074-routeAndWpServiceWpListWpNamePosition.yaml`.
The generated database also supports up to two repeating sets. These
examples establish count-driven repetition, **not** that a fixed eightfold
repetition without a count field is accepted by `keel check`. Since
neither CZone payload carries a record-count byte, do not fabricate one.
A candidate compact layout (needs keel validation) is:

```yaml
# After the three proprietary manufacturer preamble fields:
- id: module
  name: Module
  type: UINT8
- id: page
  name: Page
  type: UINT8
- repeat:
    fields:
    - id: outputCurrent
      name: Output Current
      type: UINT8
      resolution: 0.1
      unit: A
    - id: outputLevelCode
      name: Output Level Code
      type: UINT16
```

For 130825 the same two repeated fields would be 11-bit unsigned each,
after the extra byte at payload offset 4. **Do not submit this compact
form until keel's fixed-count behavior is tested**; explicit eightfold
enumeration remains the safe fallback. Repetition changes generated
field names, so downstream compatibility also needs checking.

## Observed device and evidence attribution

- **130825 — BEP/CZone Control X Plus:** Captured from Compass Rose
  Control X Plus modules 1 and 2; module 1 page 0 channel 2 (Freezer)
  measured raw current 31 (3.1 A) and level code 1000; module 2 page 0
  channel 4 measured raw current 5 (0.5 A) and level code 1000.
  These are actual captures.
- **130822 — CZone DC/COI current-reporting modules:** Observed in
  SugarShack CAN recordings (source addresses 5 and 6; module numbers
  24 and 26, page 1 in retained fixtures). The available payloads do
  **not** independently establish the physical product model from
  source address alone. Describe as CZone DC/COI family unless device
  identification/NAME records prove the exact model.
- **130817 — CZone AC/ACOI candidate:** Observed in SugarShack recording
  from source address 11, module 248, page 0, with zero current bytes.
  This does **not** establish a specific AC hardware model or prove
  nonzero-current resolution.

## 130817 investigation / upstream conflict

The existing CANboat variant `130817-bepMarineCzoneStatusExtended.yaml`
describes byte 0 of each 3-byte record as **circuit ID**, and the
following bytes as a packed 10-bit magnitude with sign and flags,
possibly current in 0.1 A. Our existing AC decoder instead treats
byte 0 as current at 0.2 A/count, with the following 16 bits opaque.
These are materially different interpretations of the same bytes.
Our all-zero SugarShack current bytes and repeating `0x0400` secondary
words cannot decide between them.

Before changing this upstream variant: identify the physical transmitter
from address-claim/device information, correlate a known energized AC
circuit with a **nonzero** first record byte, compare the proposed
0.2 A/count against independently measured current, and check whether
the purported circuit ID varies by record position or device. Also
test whether module/page or other fields discriminate two legitimate
130817 variants. Until then, retain the existing upstream interpretation
and mark our AC current scaling provisional.


## 130817 DIP-switch clarification (device identity)

CZone modules have a **binary DIP-switch setting assigned to each sending
device on the CZone network**. This is a device identifier, not a circuit
identifier, circuit current, or channel number. The upstream 130817 variant
already labels the fourth payload byte `dipswitch` (after the 16-bit
manufacturer preamble and `page` byte); our AC/ACOI candidate labels the
same byte `module`. These are compatible descriptions of the header's
role, not competing evidence that the byte is a measurement.

For the SugarShack 130817 payload `27 99 00 f8 ...`, the header is
manufacturer/BEP, page 0, DIP-switch value 0xF8 (248 as an unsigned byte).
**Do not infer physical DIP-switch positions or device model** from that
numeric byte without an independent device mapping. In the upstream
contribution, prefer `dipswitch` or `deviceDipSwitch` for this field
rather than generic `module`, and state that it identifies the sender's
configured CZone network identity.

The disagreement with the current upstream PGN 130817 definition is **only
about the repeated three-byte records**, not the page or DIP-switch header.
Both interpretations remain provisional pending nonzero/current-correlated
capture evidence. Existing upstream `missing: [Fields, FieldLengths,
Resolution]` already signals incomplete decoding.


## SugarShack ZCF / CAN / wiring-diagram identity cross-check

Verified directly against the **existing read-only active repository fixture**
`test/fixtures/SugarShack-20260927-01.zcf`, the 130822 module IDs
present in SugarShack CAN captures, and the user's one-page
`Sugar Shack cZone circuits.pdf`. The binary ZCF's device table
places the following module bytes immediately before the device names:

| 130822 / ZCF module | ZCF device name | PDF location | PDF DIP SW |
| --- | --- | --- | --- |
| 0x12 (18) | COI 04 Under Nav. Station | Nav Station | 00010000 |
| 0x14 (20) | COI 02 Port Aft Under Freezer | Port Aft | 01100000 |
| 0x16 (22) | COI 06 Stbd Engine Room | Stbd Engine Room | 01010000 |
| 0x18 (24) | COI 01 Port Engine Room | Port Engine Room | 10100000 |
| 0x1A (26) | COI 05 Stbd Aft Under Fridge | Stbd Aft | 10010000 |
| 0x1C (28) | COI 03 Mast Foot | Mast Foot | 11100000 |

The ZCF's COI ordinal numbering is **not** the same as the PDF's
COI ordinal numbering. Location-based matching is therefore essential.
The CAN byte is the ZCF module ID, **not** a direct physical DIP
bitmask or a simple transformation of the printed DIP bits.

The ZCF also lists `ACOI 01 Stbd Aft` with preceding device identifier
`0xF8`, matching the PGN 130817 captured header `27 99 00 F8`.
The PDF labels the AC Output Interface as Stbd Aft with DIP
`10000000`. This resolves the **device identity** of the 130817
transmitter as the SugarShack ACOI, but does not establish the scaling
or semantics of its per-channel records. Upstream PGN 130817's
`dipswitch` field is therefore likely misnamed if it represents
this byte; suggest `moduleId` (or `deviceId`) with a compatibility
note, subject to broader cross-device confirmation.

Evidence is from the ZCF's binary device-name table and the wiring
drawing; no inference of the physical DIP-to-module-ID algorithm
is warranted from these six pairs alone.


## New AC load capture — 2026-11-02 (nonzero 130817)

User supplied `SugarShack-20261102-01-AcCurrent.CAN` after
switching a water heater and a salon receptacle load. Binary YDVR v05
capture independently reassembled: 29 complete PGN 130817 fast packets
from source 11; all are 28 bytes with manufacturer header `27 99`,
page 0, ZCF module ID `0xF8` (ACOI 01 Stbd Aft).

Slot 1 (zero-based) first record byte: 0 (13 frames), 40 (1),
41 (15). The associated 16-bit little-endian state code is 1024
(OFF, 8 frames) or 2024 (ON, 21 frames). Slot 6 first byte: 0
(25 frames), 7 (2), 8 (2); its secondary state code is 2024
(ON, all 29 frames). Every other slot first byte is zero. Under
the existing plugin's 0.2 A/count interpretation these are
8.0–8.2 A and 1.4–1.6 A respectively.

Crucially, these bytes **vary with applied AC load**, rather than
remaining fixed circuit identifiers. This is strong evidence against
the existing upstream 130817 explanation that the first byte of each
record is a `circuit_id`. Also, the secondary UINT16 matches the
DC 130822 OFF/ON codes 1024 and 2024 in the same capture.
The file-order timeline has slot 1 ON code 2024 even during its
initial zero-current interval; its state later changes to OFF 1024
when current returns to zero. Slot 6 state remains ON 2024 even
while measured current is zero. Thus **output enabled** and
**nonzero load current** are distinct properties.

The capture establishes current-byte correlation and shared state
encoding, but **does not independently calibrate 0.2 A/count**
without an external measurement or known electrical load wattage.
Exact slot-to-load labels should be confirmed against switching
timestamps or circuit mapping; do not infer from current magnitude
alone. This new evidence supersedes the earlier all-zero-capture
reason for treating AC record semantics as unresolved.

Example reassembled AC payloads:
- `279900f800000429e80700000400000400000400000400e80700e80f`
  (slot 1 current raw 41, state ON)
- `279900f800000400000400000400000400000400000400e80700e80f`
  (slot 1 current raw 0, state OFF)
- `279900f800000429e80700000400000400000400000407e80700e80f`
  (slot 1 raw 41; slot 6 raw 7)

The raw CAN file is supplied in conversation and **not committed**
to either GitHub repository. Add a provenance-backed upstream
sample only after confirming permission and desired fixture format.
