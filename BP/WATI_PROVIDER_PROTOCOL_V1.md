# WATI Runtime Provider Protocol v1

WATI Core v3.0.0+ permite que un Behavior Pack instalado registre su
propia fuente y sus entradas sin recompilar el catálogo de Core.

## Alcance de v1

- Fuentes instaladas.
- Objetos, bloques, entidades, biomas, ecosistemas y estructuras.
- Nombre de respaldo, clave de localización, aliases, categoría, grupo e
  información opcional de textura.
- Reemplazo transaccional del registro anterior del mismo proveedor.

La primera versión no acepta recetas, métodos de obtención ni estaciones
externas. Esos dominios permanecen bajo el catálogo compilado hasta que exista
un esquema runtime específico.

## Flujo

1. `wati:provider_begin` abre una transacción y declara la fuente.
2. `wati:provider_chunk` entrega hasta 32 entradas por mensaje.
3. `wati:provider_commit` publica atómicamente la fuente y sus entradas.
4. Core responde a cada fase mediante `wati:provider_result`.
5. Core emite `wati:provider_discover` al iniciar. El SDK vuelve a anunciar el
   proveedor automáticamente cuando lo recibe.

Todos los mensajes usan `v: 1`, `c` como identificador del proveedor y `r`
como identificador de solicitud. El SDK v1 actualizado durante la línea 2.8.1 añade `t` como token
opcional de transacción; Core mantiene compatibilidad con proveedores v1 que no
lo envían.

## Ejemplo recomendado

Copiar `SDK/wati_provider.js` al Behavior Pack del creador:

```js
import { createWatiProvider } from "./wati_provider.js";

createWatiProvider({
  id: "example_addon",
  source: {
    name: "Example Add-On",
    version: "1.0.0",
    namespaces: ["example"],
    aliases: ["example"],
    packUuid: "00000000-0000-4000-8000-000000000000",
    minEngineVersion: [1, 21, 130]
  },
  entries: [
    {
      kind: "item",
      id: "example:sample_item",
      fallbackName: "Sample Item",
      localizationKey: "item.example:sample_item.name",
      category: "Example"
    }
  ]
});
```

El add-on proveedor necesita un módulo de script y una dependencia compatible
con `@minecraft/server`. WATI sigue siendo opcional: si Core no está instalado,
los eventos no reciben respuesta y el add-on proveedor continúa funcionando.

## Límites y confianza

- 64 proveedores runtime.
- 1,024 entradas por proveedor.
- 32 entradas por chunk.
- 16 pistas descriptivas por entrada y hasta 320 caracteres por pista.
- 7,000 caracteres por mensaje enviado por el SDK.
- 8 namespaces por proveedor.
- `minecraft` y `wati` están reservados.
- Un proveedor no puede reclamar un namespace perteneciente a otra fuente.

El protocolo registra metadatos de visualización; no ejecuta código recibido,
no modifica entidades y no concede permisos. Como los Script Events también
pueden originarse mediante comandos, Core valida y limita todos los campos,
pero los metadatos runtime deben considerarse datos aportados por el paquete
instalado.

## Diagnóstico y atomicidad

Cuando una entrada es inválida, `wati:provider_result` puede incluir `entryIndex`,
`entryId`, `field`, `fieldIndex`, `reason`, `actual` y `maximum`. La transacción
queda abortada y `commit` no publica una fuente parcial ni sustituye el registro
anterior.
