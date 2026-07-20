# WATI Core v2.0.0

**What Are These IDs?** — Universal interoperability registry for Minecraft Bedrock add-ons.

WATI Core maps identifiers and namespaces to their real source projects and exposes normalized metadata to compatible consumers such as **WATI Codex** and **Netbound!**. It does not replace gameplay interfaces and does not include the referenced third-party add-ons.

## Catalog snapshot

- **6,037** registered identifiers
- **5,753** normalized recipes
- **23** registered sources
- **356** contents with acquisition metadata
- **603** normalized acquisition methods

## Installation

Import and activate both packs:

1. `WATI_Core_BP_v2.0.0.mcpack`
2. `WATI_Core_RP_v2.0.0.mcpack`

Keep WATI Core above consumers such as WATI Codex and Netbound! in the active pack list when practical.

## Compatibility

- Minecraft Bedrock compatible with `@minecraft/server` 2.8.0.
- `wati:lookup` / `wati:result` v1 remains available for Netbound! and existing consumers.
- WATI Codex Protocol v2 provides search, source browsing, entries, recipes, uses, related content, and acquisition methods.
- WATI Catalog Schema v1 is included for Catalog Builder and provider contributions.

## Documentation

- `CATALOG_POLICY.md`
- `THIRD_PARTY_SOURCES.md`
- `NOTICE.md`
- `WATI_LOOKUP_PROTOCOL_v1.md`
- `WATI_CODEX_PROTOCOL_v2.md`
- `WATI_CATALOG_SCHEMA_v1.md`
- `SCHEMA/`
- `CHANGELOG.md`

## Important scope note

WATI Core stores identifiers and normalized interoperability metadata. It does not redistribute third-party packs, source code, scripts, textures, models, UI files, audio, original recipe files, or original directory structures. See `CATALOG_POLICY.md` for the complete policy.
