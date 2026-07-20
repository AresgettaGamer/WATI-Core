# WATI Catalog Schema v1

## Objetivo

Formato de intercambio estable entre WATI Catalog Builder, contribuidores y las herramientas de compilación de WATI Core.

## Archivos

### `source.json`

Identidad pública, autor, versión analizada, namespaces, aliases, licencia y página oficial.

### `content.json`

Listas separadas de `items`, `blocks` y `entities`. Cada entrada contiene `id`, `type`, `fallbackName`, `localizationKey`, `category`, `internal` y `sourcePath`.

### `recipes.json`

Recetas normalizadas. Conserva el tipo, tags/estación, patrón, clave, ingredientes, resultado, archivo de procedencia y advertencias. Las variantes vanilla con metadata antigua se traducen al identifier moderno cuando la equivalencia es inequívoca.

### `acquisition.json`

Métodos de obtención con `target`, `method`, `sourceType`, `source`, `certainty` y `details`. Catalog Builder v1.0.0 automatically covers direct block/entity loot and exports unresolved systems for manual review; additional acquisition domains may be expanded in later Builder releases.

### `localization.json`

Mapas de localización encontrados, separados por locale. Estos datos se destinan a revisión y vinculación; su posible incorporación pública debe respetar la licencia del proyecto de origen.

### `report.json`

Resumen, packs detectados y lista de errores/advertencias.

## Reglas

- `schemaVersion` es un entero y vale `1` en esta revisión.
- Los identifiers deben incluir namespace.
- Una contribución no debe contener texturas, modelos, scripts ni archivos originales de terceros.
- `sourcePath` es informativo para revisión y no necesita integrarse en el paquete público final.
- `certainty` usa `confirmed`, `probable` o `manual`.
- El compilador de WATI Core puede ignorar campos desconocidos para mantener compatibilidad hacia adelante.
