# CZone ZCF regression fixtures

These are the canonical real-world ZCF fixtures used by the structural parser tests. Keep this corpus aligned with the fixtures used by `signalk-czone`, because both plugins intentionally consume the same CZone configuration format and parser model.

The fixture files are binary `.zcf` files copied from the configurations used during parser reverse-engineering and field testing. Tests should reference them with repository-relative paths so they work on CI, developer machines, and installed source trees without `/mnt/data` dependencies.

Current corpus:

- `TestBench.zcf`
- `Compass-Rose-28.06.26.zcf`
- `Persevere-14.07.25.zcf`
- `Sel-Citron-02.04.25.zcf`
- `Meitaki-07.04.25.zcf`
- `SugarShack-20260927-01.zcf`

Controlled variants used for bit-level experiments may be added here with a short note describing exactly which bytes/fields were changed and why. Do not infer new proprietary fields from circuit names alone.
