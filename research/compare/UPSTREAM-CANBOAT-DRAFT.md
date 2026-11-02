# Upstream CANboat YAML contribution draft — NOT yet upstream-validated

Target: `canboat/canboat` `master`, `database/pgns/`. Verified against upstream YAML layout and CONTRIBUTING.md on 2026-11-02. This is a **proposal**, not a completed `keel check` or `make generated` run.

## Existing files — modify rather than duplicate
- `database/pgns/130822-bepMarineProprietaryPgn130822.yaml`
- `database/pgns/130825-bepMarineProprietaryPgn130825.yaml`
- `database/pgns/130817-bepMarineCzoneStatusExtended.yaml` — **hold for reconciliation**, see below.

All three already exist. Preserve the upstream proprietary preamble exactly: manufacturerCode (11-bit LOOKUP, match 295), reserved (2-bit RESERVED), industryCode (3-bit LOOKUP, match 4). The first two bytes `27 99` are that 16-bit preamble, **not** a separate signature field.

## Proposed replacement fields after the existing 16-bit manufacturer preamble

### PGN 130822 (28 bytes, 8 × 24-bit records)
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
- id: rawLevel0
  name: Raw Level 0
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current1
  name: Current 1
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel1
  name: Raw Level 1
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current2
  name: Current 2
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel2
  name: Raw Level 2
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current3
  name: Current 3
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel3
  name: Raw Level 3
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current4
  name: Current 4
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel4
  name: Raw Level 4
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current5
  name: Current 5
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel5
  name: Raw Level 5
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current6
  name: Current 6
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel6
  name: Raw Level 6
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
- id: current7
  name: Current 7
  type: UINT8
  resolution: 0.1
  unit: A
- id: rawLevel7
  name: Raw Level 7
  type: UINT16
  description: Raw secondary word; 1024 OFF, 2024 ON, 1025..2023 dimmed in observed DC traffic
``
The 130822 secondary word is retained raw; level conversion is an application-level interpretation, not an independently calibrated physical unit. Current values are 0.1 A/count in the existing plugin and match the captured payload layout. Check `unit: A` spelling against keel's field-type/unit rules before submitting.

### PGN 130825 (27 bytes, 8 × 22-bit records)
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
- id: currentRaw0
  name: Raw Current 0
  type: UINT16
  bits: 11
- id: levelRaw0
  name: Raw Level 0
  type: UINT16
  bits: 11
- id: currentRaw1
  name: Raw Current 1
  type: UINT16
  bits: 11
- id: levelRaw1
  name: Raw Level 1
  type: UINT16
  bits: 11
- id: currentRaw2
  name: Raw Current 2
  type: UINT16
  bits: 11
- id: levelRaw2
  name: Raw Level 2
  type: UINT16
  bits: 11
- id: currentRaw3
  name: Raw Current 3
  type: UINT16
  bits: 11
- id: levelRaw3
  name: Raw Level 3
  type: UINT16
  bits: 11
- id: currentRaw4
  name: Raw Current 4
  type: UINT16
  bits: 11
- id: levelRaw4
  name: Raw Level 4
  type: UINT16
  bits: 11
- id: currentRaw5
  name: Raw Current 5
  type: UINT16
  bits: 11
- id: levelRaw5
  name: Raw Level 5
  type: UINT16
  bits: 11
- id: currentRaw6
  name: Raw Current 6
  type: UINT16
  bits: 11
- id: levelRaw6
  name: Raw Level 6
  type: UINT16
  bits: 11
- id: currentRaw7
  name: Raw Current 7
  type: UINT16
  bits: 11
- id: levelRaw7
  name: Raw Level 7
  type: UINT16
  bits: 11
``
For 130825, current = rawCurrent × 0.1 A in the active plugin when rawLevel is nonzero. Observed rawLevel 1000 maps to 100% **in the application**, but preserve wire raw values upstream. Verify keel accepts non-byte-aligned `UINT16` with `bits: 11`; adjust using a supported numeric field type if needed. Confirm whether byte 4 is consistently reserved from additional captures.

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
