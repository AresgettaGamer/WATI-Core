# WATI Provider SDK v1 — Core v3.0.0

Runtime Provider SDK for Minecraft Bedrock add-ons that want to own and publish their WATI catalog at runtime.

## Integration

1. Copy `wati_provider.js` into the provider Behavior Pack's `scripts` folder.
2. Import `createWatiProvider` from that local file.
3. Register one source and its item/block/entity/biome/ecosystem/structure entries.
4. Keep WATI Core optional. If it is not installed, the provider remains dormant and the add-on continues working normally.

## Provider v1 guarantees

- Transactional `begin → chunk → commit` registration.
- Synchronous duplicate-registration guard.
- Optional transaction token compatible with older Provider v1 implementations.
- Detailed diagnostics for rejected entries.
- Automatic re-registration after `wati:provider_discover`.
- Limits and validation enforced by Core.

Do not ship a static Catalog Builder contribution for the same authoritative namespace when the add-on already contains a Runtime Provider.

See `WATI_PROVIDER_PROTOCOL_V1.md` for the complete contract.
