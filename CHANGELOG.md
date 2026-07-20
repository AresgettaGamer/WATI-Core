# WATI Core — Changelog

WATI uses major public releases. Versions between public majors are documented development snapshots and release candidates.

## v2.0.0 — Official release

- Promotes the tested v1.2.1 release-candidate code to the second official public generation of WATI Core.
- Registers **6,037 identifiers**, **5,753 normalized recipes**, and **23 sources**.
- Adds the Codex Protocol v2 domains for paginated search, sources, content entries, recipes, uses, related content, and acquisition methods.
- Centralizes **356 acquisition entries** with **603 normalized acquisition methods**.
- Separates entity metadata from craftable item and block metadata so consumers do not associate recipes with environmental or internal entities.
- Normalizes common legacy vanilla references that use numeric `data` values, including colored carpet, wool, concrete, stained glass, panes, planks, logs, slabs, stone variants, fish, sand, and milk buckets.
- Updates the analyzed Delight-family content and recipe corrections used by the public catalog.
- Includes WATI Catalog Schema v1 and its JSON Schemas for Catalog Builder contributions.
- Preserves `wati:lookup` / `wati:result` protocol v1 for Netbound! and existing consumers.
- Removes the invalid standalone localization header found during the final release-candidate test.

## v1.2.1 — Development release candidate

- Removed the invalid standalone `.lang` header from the Core resource pack.
- Added the first documented WATI Catalog Schema v1 files to the release-candidate source.
- Kept the tested catalog and runtime behavior unchanged.

## v1.2.0 — Development release candidate

- Updated the catalog to **6,037 IDs**, **5,753 recipes**, and **23 sources** after the Delight-family updates.
- Moved acquisition data from Codex into WATI Core through `wati:acquisition`.
- Added object-and-block-only search and related-content metadata.
- Prevented entity entries from inheriting item or block recipes with the same identifier.
- Added normalization for legacy vanilla identifiers and numeric variants.

## v1.1.1 — Development snapshot

- Added `CATALOG_POLICY.md`, `THIRD_PARTY_SOURCES.md`, `NOTICE.md`, and expanded protocol documentation.
- Documented the use of normalized interoperability metadata and the treatment of third-party identifiers and projects.
- Preserved the v1.1.0 runtime catalog and Netbound! compatibility.

## v1.1.0 — Development snapshot

- Expanded WATI from a source/identifier registry into the first Codex-ready catalog.
- Registered **6,028 IDs**, **5,746 normalized recipes**, and **23 sources**.
- Added paginated capabilities, source browsing, search, entry, recipe, and exact-use events.
- Added aliases such as `@better`, `@btu`, `@honkit`, and other source-oriented searches.
- Preserved the original lookup protocol used by Netbound!.

## v1.0.0 — Official release

- First public release of WATI Core.
- Introduced the shared identifier-to-source registry and localized fallback-name service.
- Added the copy-in consumer SDK used by Netbound! and other compatible add-ons.
- Established WATI Core as an optional interoperability layer without bundling referenced add-ons.
