# WATI Core — Auditoría de contenido del mundo

## Auditoría iniciada en v2.6.0

Esta versión distingue tres tipos de contenido:

- `biome`: biomas reales enumerados por `BiomeTypes`.
- `ecosystem`: regiones artificiales producidas sobre biomas existentes y reconocibles mediante bloques característicos.
- `structure`: estructuras jigsaw registradas por un add-on.

## Add-ons auditados

### Better On Bedrock 1.2.5

- 5 ecosistemas artificiales del End.
- 45 estructuras jigsaw principales.
- Los ecosistemas se detectan mediante bloques propios de superficie y vegetación.

### Beyond The Underground 1.7.3

- 8 ecosistemas artificiales de cuevas y Nether.
- 1 estructura jigsaw principal (`honkit26113:ice_fort`).
- Los ecosistemas se detectan mediante familias de bloques propios.

### Abandoned & Ruin Structures 1.15.1

- 61 estructuras jigsaw principales.
- Muchas decoraciones y ruinas menores basadas en templates no se registran todavía como entradas independientes.
- La ubicación de sus estructuras no se deduce automáticamente en esta etapa.

## Límites

WATI no copia texturas, modelos ni archivos `.mcstructure` de estos add-ons. Solo conserva metadatos compactos necesarios para identificar el contenido y presentarlo en consumidores compatibles.


### Consolidación v2.6.0

No se añadieron nuevas fuentes de worldgen. La versión consolida búsqueda es_MX y estabilidad de empaquetado; las 13 firmas de ecosistemas y 107 estructuras auditadas permanecen sin cambios.
