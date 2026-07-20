# WATI Codex Protocol v2

WATI Core v2.0.0 preserves the legacy lookup protocol v1 and provides a paginated protocol for encyclopedia-style consumers.

All v2 requests include:

```json
{"v":2,"c":"consumer_id","r":"request_id"}
```

## Events

- `wati:capabilities` → `wati:capabilities_result`
- `wati:sources` → `wati:sources_result`
- `wati:search` → `wati:search_result`
- `wati:entry` → `wati:entry_result`
- `wati:recipes` → `wati:recipes_result`
- `wati:uses` → `wati:uses_result`
- `wati:acquisition` → `wati:acquisition_result`

## Search

```json
{"v":2,"c":"wati_codex","r":"1","q":"@better mochila","k":"content","p":0,"z":12,"x":true}
```

- `q`: text, identifier, namespace, or partial `@source` alias.
- `k`: `content` for items and blocks, or `item`, `block`, `entity`, or omitted for all.
- `p`: zero-based page.
- `z`: results per page; Core enforces a safe maximum.
- `x`: when `true`, filters known-missing items and blocks.

## Source browsing

```json
{"v":2,"c":"wati_codex","r":"2","q":"delight","p":0,"z":12,"x":true}
```

The response includes source names, aliases, namespaces, analyzed versions, content counts, recipe counts, and known installation presence.

## Content entry

```json
{"v":2,"c":"wati_codex","r":"3","k":"item","i":"netbound:net"}
```

The response includes name keys and fallbacks, source metadata, category, installation state, exact recipe/use counts, and other content kinds that share the same identifier.

Entity entries deliberately report no crafting recipe or item-use counts.

## Recipes and exact uses

```json
{"v":2,"c":"wati_codex","r":"4","i":"netbound:net","p":0,"z":3}
```

- `wati:recipes` lists recipes whose result matches the identifier.
- `wati:uses` lists recipes that use the identifier as an exact ingredient.
- Tag-based uses are returned inside recipe ingredients but are not expanded into every possible item.
- Legacy vanilla IDs and supported numeric `data` variants are normalized before indexing and presentation.

## Acquisition

```json
{"v":2,"c":"wati_codex","r":"5","i":"farmersdelight:tomato"}
```

The response contains normalized acquisition rows with a method, source type, source identifier or label, confidence level, and method-specific details. Consumers must distinguish confirmed direct relationships from probable contextual relationships.

## Capabilities

Consumers should query `wati:capabilities` and hide unsupported sections instead of assuming that every Core version provides every domain.
