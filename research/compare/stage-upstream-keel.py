#!/usr/bin/env python3
"""Stage evidence-backed CZone PGN variants in a disposable CANboat checkout."""
from pathlib import Path
import sys

root = Path(sys.argv[1])
base = root / "database/pgns"
header = """- id: manufacturerCode
  name: Manufacturer Code
  type: LOOKUP
  bits: 11
  description: BEP Marine
  match: 295
  lookup: MANUFACTURER_CODE
- id: reserved
  name: Reserved
  type: RESERVED
  bits: 2
- id: industryCode
  name: Industry Code
  type: LOOKUP
  bits: 3
  description: Marine Industry
  match: 4
  lookup: INDUSTRY_CODE
"""
for pgn, filename, desc, order in [
    (130817, "130817-bepMarineCzoneStatusExtended.yaml", "CZone AC Output Interface status", 5),
    (130822, "130822-bepMarineProprietaryPgn130822.yaml", "CZone DC Output Interface status", 10),
    (130825, "130825-bepMarineProprietaryPgn130825.yaml", "CZone Control X Plus output status", 3),
]:
    lines = [
        f"pgn: {pgn}", f"id: bepMarineCzoneOutputStatus{pgn}",
        f"description: 'BEP Marine: {desc}'", "type: Fast",
        f"variantOrder: {order}",
        "notes: 'Observed in real SugarShack or Compass Rose captures; module ID is the ZCF ID, not the physical DIP bitmask. Output channel is page times eight plus record index (zero-based).'",
        "fields:", header.rstrip(),
    ]
    if pgn == 130817:
        lines += [
            "- id: page", "  name: Output Page", "  type: UINT8",
            "- id: moduleId", "  name: ZCF Module ID", "  type: UINT8",
        ]
    else:
        lines += [
            "- id: moduleId", "  name: ZCF Module ID", "  type: UINT8",
            "- id: page", "  name: Output Page", "  type: UINT8",
        ]
    if pgn == 130825:
        lines += ["- id: reservedPrefix", "  name: Unidentified Header Byte", "  type: BINARY", "  bits: 8"]
        for i in range(8):
            lines += [
                f"- id: outputCurrentRaw{i}", f"  name: Output {i} Current Raw",
                "  type: UNSIGNED_INTEGER", "  bits: 11",
                f"- id: outputLevelRaw{i}", f"  name: Output {i} Level Raw",
                "  type: UNSIGNED_INTEGER", "  bits: 11",
            ]
        # 27 bytes = 216 bits; header 40, eight 22-bit slots = 216
    else:
        for i in range(8):
            lines += [
                f"- id: outputCurrent{i}", f"  name: Output {i} Current",
                "  type: UINT8",
                "  resolution: 0.2" if pgn == 130817 else "  resolution: 0.1",
                f"- id: outputStateCode{i}", f"  name: Output {i} State and Level Code",
                "  type: UINT16",
            ]
    captures = {
        130817: ("279900f800000400000400000400000400000400000400e80700e80f", 11, ["page: 0", "moduleId: 248", "outputCurrent0: 0"]),
        130822: ("2799180101e8070000040000040000040000040000049be807000004", 5, ["moduleId: 24", "page: 1", "outputCurrent0: 0.1", "outputStateCode0: 2024", "outputCurrent6: 15.5"]),
        130825: ("279902000000401f00d017000000000005405f00d0070000000000", 2, ["moduleId: 2", "page: 0"]),
    }
    payload, source, expected = captures[pgn]
    assert len(bytes.fromhex(payload)) == (27 if pgn == 130825 else 28)
    raw = "2026-11-02-00:00:00.000,6," + str(pgn) + "," + str(source) + ",255," + str(len(payload)//2) + "," + ",".join(payload[i:i+2] for i in range(0,len(payload),2))
    lines += ["samples:", '- raw: "' + raw + '"', "  expects:"]
    lines += ["    " + value for value in expected]
    (base / filename).write_text("\n".join(lines) + "\n")
    print(f"Staged PGN {pgn} definition: {filename}")
