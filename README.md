# WATI Core v3.0.0

**What Are These IDs?** — universal interoperability registry for Minecraft Bedrock add-ons.

WATI Core is the data layer of the WATI ecosystem. It identifies content from installed add-ons, normalizes recipes, stations and acquisition metadata, exposes enriched knowledge to compatible consumers, and accepts Runtime Providers shipped by third-party add-ons. It does not replace gameplay interfaces and does not redistribute the referenced add-ons.

## Release snapshot

- **6,254 compiled content IDs**: 5,153 blocks, 891 items and 210 entities.
- **5,981 normalized recipes**.
- **53 normalized stations**.
- **356 entries with acquisition metadata**.
- **23 compiled sources**, augmented at runtime by Minecraft data and compatible Runtime Providers.
- **Schema 3** and **Knowledge Schema 1**.
- **Runtime Provider Protocol v1**.
- Runtime Vanilla catalog for items, blocks and entities, including es_MX search aliases and safe texture-path hints when available.

**Alex's Mobs — Bedrock Rebuild is no longer embedded in WATI Core.** Its public catalog is owned by the WATI Runtime Provider shipped by that add-on. Core only keeps presentation redirects for a few internal Alex's Mobs IDs so consumers such as WAWLA do not show technical names.

## Installation

Import and activate both WATI Core packs. Keep Core above consumers such as WATI Codex and Netbound! when practical.

WATI Core v3.0.0 uses stable `@minecraft/server` **2.8.0**.

## Runtime Provider SDK v1

Add-on creators can own their WATI metadata without making Core a hard dependency. The provider SDK performs transactional registration, validation, diagnostics and automatic re-registration after Core starts.

See:

- `SDK/wati_provider.js`
- `SDK/wati_provider.d.ts`
- `SDK/WATI_PROVIDER_PROTOCOL_V1.md`
- `SDK/README.md`

Do not publish both a static Catalog Builder contribution and a Runtime Provider for the same authoritative namespace.

## Player interface

Install **WATI Codex** for the encyclopedia, progressive adventure record, exploration journal, enriched knowledge and locations interface.

## Compatibility contracts

- Lookup Protocol v1 (`wati:lookup` / `wati:result`).
- Codex Protocol v2/v3.
- WATI Catalog Schema 3.
- WATI Knowledge Schema 1.
- WATI Runtime Provider Protocol v1.

## Important scope note

WATI stores identifiers and normalized interoperability metadata. It does **not** redistribute third-party packs, scripts, textures, models, audio, UI files or original directory structures. A catalog entry does not imply affiliation, endorsement or official support by the referenced project.

## Official links

- [WATI Core on CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/wati-core)
- [WATI Codex](https://github.com/AresgettaGamer/WATI-Codex)
- [WATI Catalog Builder](https://aresgettagamer.github.io/WATI-Catalog-Builder/)
- [Community Discord](https://discord.gg/U8WUnGCA97)
