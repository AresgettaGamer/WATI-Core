# WATI Core v1.0.0

**WATI** significa **What Are These IDs?**. Es un registro universal de solo
lectura para que addons de Minecraft Bedrock puedan mostrar nombres correctos
de entidades, bloques, objetos y del addon al que pertenecen.

Esta versión contiene **6,027 IDs** de **26 namespaces**, reunidos de los packs
del servidor de AresgettaYT. No agrega bloques, objetos ni entidades al mundo.
Si uno de los addons catalogados no está instalado, WATI simplemente conserva
sus datos sin intentar acceder a ese contenido.

## Instalación

1. Importa `WATI_Core_v1.0.0.mcaddon`.
2. Activa **WATI Core BP** y **WATI Core RP** en el mundo.
3. Activa Netbound! v0.5.0 o instala el overlay privado de WAWLA si deseas que
   lo usen.

En la lista de packs del mundo se recomienda este orden, de arriba hacia abajo:

1. **WATI Core**.
2. **Netbound!**.
3. **Better On Bedrock** y los demás addons consumidores.

El orden da prioridad ante archivos con el mismo nombre; no controla el orden
de inicio de los scripts. WATI y Netbound usan rutas y claves propias, por lo
que su integración también funciona si Bedrock reorganiza packs vinculados.

El Resource Pack declara la capacidad `pbr`, por lo que no desactiva Visuales
Vibrantes. El Behavior Pack usa `@minecraft/server` 2.8.0 y plataforma de
contenido `1.21.130` (Bedrock 26.30+).

WATI no es una dependencia obligatoria de sus consumidores. Netbound! y el
overlay de WAWLA siguen cargando si WATI falta; en ese caso usan la clave de
traducción original del contenido o un identifier convertido en texto legible.

## Cómo funciona

Bedrock aísla los módulos JavaScript de cada Behavior Pack, así que un pack no
puede importar una “variable global” directamente desde otro. WATI ofrece un
protocolo pequeño mediante Script Events estables:

- el consumidor solicita un `entity`, `block` o `item` por su identifier;
- WATI responde con clave traducible, nombre de respaldo y addon de origen;
- el cliente guarda el resultado en memoria;
- solo se consultan los IDs que realmente aparecen, en vez de transmitir todo
  el catálogo al iniciar el mundo.

El protocolo actual es `v1` y usa `wati:lookup`, `wati:result` y `wati:ready`.

## Uso desde otro addon

Copia `SDK/wati_client.js` dentro de los scripts de tu Behavior Pack e impórtalo:

```js
import { createWatiClient } from "./wati_client.js";

const wati = createWatiClient("mi_addon");
const creature = wati.resolve("entity", entity.typeId);

player.onScreenDisplay.setActionBar({
  rawtext: [
    wati.nameMessage("entity", entity.typeId, entity.localizationKey),
    { text: "\n" },
    wati.addonMessage("entity", entity.typeId)
  ]
});
```

`resolve()` devuelve inmediatamente un descriptor legible y dispara la consulta
en segundo plano. Al siguiente tick normalmente ya estará disponible el dato de
WATI. `nameMessage()` acepta una clave propia del addon como fallback, y
`addonMessage()` devuelve un `RawMessage` listo para interfaz o chat.

Un consumidor que quiera respetar primero el idioma del resource pack original
puede usar `nameMessage(kind, id, clave, { preferSource: true })`. Netbound! y
WAWLA usan este modo: si el addon trae `es_MX`, se muestra su traducción; WATI
conserva un nombre curado como respaldo para consumidores sin clave propia.
Una entrada mantenida manualmente puede usar `"overrideSource": true` solo si
se confirma que la clave del addon está rota.

No agregues una dependencia UUID de WATI al manifest si quieres mantener el
fallback opcional. El consumidor sí necesita una dependencia normal de
`@minecraft/server` compatible con `system.sendScriptEvent`.

## Editar el catálogo

El archivo central editable es `registry/catalog.json`:

```json
{
  "addons": {
    "mi_namespace": "Mi Addon"
  },
  "content": {
    "entity": {
      "mi_namespace:criatura": {
        "key": "wati.content.entity.mi_namespace.criatura",
        "en": "Creature",
        "es": "Criatura"
      }
    }
  }
}
```

Después de editarlo, desde la carpeta de código fuente ejecuta:

```sh
node tools/build_from_catalog.mjs .
```

Esto reconstruye el catálogo de runtime y los archivos `en_US.lang` y
`es_MX.lang`. Para volver a importar una colección grande de JSON de behaviors,
`tools/generate_registry.mjs` documenta el formato usado en esta primera carga.
Para importar nombres desde una colección autorizada de archivos de idioma:

```sh
node tools/import_translations.mjs /ruta/a/traducciones .
node tools/build_from_catalog.mjs .
```

## Archivos para integraciones

- `SDK/wati_client.js`: cliente JavaScript copiable.
- `SDK/wati_client.d.ts`: tipos opcionales para TypeScript/checkJs.
- `WAWLA_Overlay/`: prueba privada separada para el WAWLA incluido en Better On
  Bedrock. No forma parte del ZIP de fuentes destinado a publicación y no debe
  redistribuirse sin autorización escrita de su autor.
- `registry/report.json`: conteo verificable del catálogo generado.
- `registry/translation_import_report.json`: procedencia, exclusiones y
  cobertura verificable de la importación española.

## Cambios de v0.2.0

- Se incorporaron 2,767 nombres españoles al catálogo de respaldo a partir de
  los archivos aportados por AresgettaYT.
- Netbound! y WAWLA priorizan siempre la clave del resource pack original; esto
  respeta `es_MX` y cualquier otro idioma activo.
- Better On Bedrock y SplitBlocks son `source-only`: WATI registra sus IDs y
  nombres de addon, pero no copia sus traducciones.
- El descriptor del SDK añade `preferWati` para excepciones confirmadas sin
  romper el protocolo v1 ni los consumidores anteriores.
- Se añadieron licencias separadas: SDK/código MIT, catálogo propio CC BY 4.0 y
  branding reservado.
- UUIDs, protocolo y los 6,026 IDs permanecen estables respecto de v0.1.x.

## Cambios de v0.2.1

- Las 338 mitades internas `upper`/`lower` de Modern Doors muestran el mismo
  nombre localizado que su puerta creativa `preview`, incluyendo el prefijo
  `MD:`.
- Las 38 partes superiores de muebles multipartes de Medieval Furniture que
  poseen un bloque principal traducido reutilizan ese nombre; esto incluye las
  21 variantes de armarios altos.
- `minecraft:wandering_trader` muestra **Wandering Trader** o **Comerciante
  errante** con mayúscula inicial.
- Estas 377 correcciones usan `overrideSource` porque las claves originales de
  esas entidades internas son inexistentes o inadecuadas. El resto continúa
  priorizando el idioma del resource pack original.
- No cambia el protocolo v1 ni requiere actualizar Netbound! v0.5.0 o el
  overlay privado ya instalado.

## Cambios de v1.0.0

- Primera versión pública estable, promovida desde la compilación v0.2.1
  aprobada en un mundo servidor con addons reales.
- Sin cambios en catálogo, protocolo, UUIDs o comportamiento respecto de la
  versión aprobada; únicamente se estabiliza la versión del pack y su
  documentación pública.
- Incluye 6,027 IDs, 26 namespaces, 2,767 nombres españoles importados como
  respaldo y 377 excepciones verificadas para claves internas defectuosas.
- Incluye licencias, créditos de traducción, SDK, tipos, generadores, informes
  de cobertura y pruebas reproducibles.

## Licencias

El código, protocolo, herramientas y SDK usan MIT. El catálogo y las
traducciones propias de AresgettaYT usan CC BY 4.0. El nombre, iconos y arte de
WATI están reservados. Consulta `LICENSE.md` y `TRANSLATION_CREDITS.md` antes de
redistribuir o crear un catálogo derivado.

## Límites

- WATI conoce nombres e identifiers; no confirma que el contenido esté cargado
  ni modifica las reglas de captura de Netbound!.
- Los nombres sin traducción aportada conservan su nombre inglés humanizado en
  `es_MX`, para no inventar traducciones distintas a las oficiales del addon.
- Un addon puede cambiar identifiers en una actualización; basta corregir WATI,
  pero las referencias persistentes del propio addon siguen dependiendo de su
  compatibilidad interna.
