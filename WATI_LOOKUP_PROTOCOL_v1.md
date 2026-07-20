# WATI Lookup Protocol v1

The legacy lookup protocol is retained by WATI Core v2.0.0 for Netbound! and existing consumers.

## Request

Script event: `wati:lookup`

```json
{"v":1,"c":"consumer_id","r":"request_id","k":"entity","i":"namespace:identifier"}
```

- `v`: protocol version, currently `1`.
- `c`: consumer identifier.
- `r`: request identifier used to match the response.
- `k`: `entity`, `block`, or `item`.
- `i`: full Minecraft identifier.

## Response

Script event: `wati:result`

The response repeats `v`, `c`, `r`, `k`, and `i`, then supplies available WATI metadata such as localized-name keys, fallback names, source identifiers, and source names.

Unknown identifiers return safe fallback metadata instead of throwing an error.
