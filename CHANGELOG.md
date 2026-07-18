# Changelog

## 1.0.0 — 2026-07-18

First stable public release.

- Read-only registry containing 6,027 entity, block and item identifiers from
  26 namespaces.
- English and Mexican Spanish fallback names.
- Source-pack localization remains preferred for every player language.
- 377 verified overrides for missing or unsuitable internal localization keys,
  including Modern Doors multipart doors, Medieval Furniture multipart blocks
  and the Wandering Trader capitalization correction.
- Optional Script Event protocol (`wati:lookup`, `wati:result`, `wati:ready`)
  with per-consumer caching and safe behavior when WATI is absent.
- Copy-in JavaScript SDK and TypeScript declarations for add-on creators.
- Compatible with Vibrant Visuals through the Resource Pack `pbr` capability.
- Public source package excludes the private Better On Bedrock/WAWLA overlay.
- Code and SDK licensed under MIT; original catalog translations under CC BY
  4.0; branding and promotional artwork reserved.
