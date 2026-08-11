# WATI Core — Historial de cambios

## Release v3.0.0 — Primera versión estable de Schema 3

- Promueve WATI Core a la línea estable v3 con Schema 3, Knowledge Schema 1 y Runtime Provider Protocol v1.
- Mantiene 6,254 IDs estáticos de add-ons, 5,981 recetas, 53 estaciones, 356 perfiles de obtención y 23 fuentes estáticas.
- Conserva el catálogo Vanilla runtime, búsqueda es_MX, contenido del mundo, fichas enriquecidas y compatibilidad con consumidores anteriores.
- Alex’s Mobs — Bedrock Rebuild deja de formar parte del catálogo estático: su catálogo público pertenece exclusivamente a su WATI Runtime Provider.
- Conserva solo redirecciones de presentación para IDs internos de Alex’s Mobs, sin exponerlos como entradas del catálogo.
- Estabiliza el contrato público (`status: stable`) y mantiene `@minecraft/server` 2.8.0 estable.
- Conserva UUID, Lookup Protocol v1 y datos persistentes.

## Beta v2.8.2 — Migración de Alex’s Mobs a Runtime Provider

- Elimina a Alex’s Mobs del catálogo, fuente y namespace compilados de WATI Core; su contenido público ahora pertenece exclusivamente a su WATI Runtime Provider.
- Retira las 12 entidades antiguas que WATI mantenía de forma estática, evitando duplicados y el conflicto de namespace que podía rechazar el Provider de Alex’s Mobs.
- Añade redirecciones de presentación no catalogadas para los 6 IDs internos del Release v1.0.0: partes de anaconda, proyectiles internos y estados físicos de huevos de tortuga de río.
- Las redirecciones solo sustituyen nombres técnicos en Lookup/WAWLA; no aparecen como contenido independiente en búsqueda, fuentes ni Codex.
- Conserva Runtime Provider Protocol v1, Schema 3, Knowledge Schema 1, UUID y datos persistentes.

## Beta v2.8.1 — Runtime Provider hotfix

- Corrige una condición de carrera del SDK que podía programar dos registros simultáneos al coincidir el arranque del proveedor con `wati:provider_discover`.
- El SDK bloquea el registro antes de crear el `runJob` y añade un token de transacción compatible con proveedores anteriores.
- Core ya no sobrescribe silenciosamente una transacción activa del mismo proveedor.
- Una entrada inválida aborta la transacción completa; ya no puede publicarse una fuente con cero entradas después de rechazar su contenido.
- Amplía cada `descriptionHint` de 160 a 320 caracteres, manteniendo el límite global de 7,000 caracteres por Script Event.
- Los rechazos `invalid_entry` ahora indican índice, identifier, campo, posición interna, motivo, longitud real y máximo aplicable cuando corresponde.
- El SDK muestra esos detalles en el Content Log para localizar errores sin revisar manualmente todo el proveedor.
- Añade pruebas de regresión para descripciones extensas, aborto transaccional, tokens y bloqueo de registros duplicados.
- Conserva Runtime Provider Protocol v1, Schema 3, Knowledge Schema 1, UUID y datos persistentes.

## Beta v2.8.0 — Knowledge Schema 1

- Añade perfiles estructurados de conocimiento para descripciones, usos, botín, hábitats, contenido de biomas, relaciones y construcciones especiales.
- Publica el endpoint `wati:knowledge` y anuncia Knowledge Schema 1 a consumidores compatibles.
- Genera descripciones funcionales para todo el catálogo a partir del tipo, categoría, recipes y métodos de obtención existentes.
- Invierte los datos de adquisición para identificar qué entidades sueltan un objeto y qué bloques lo producen, incluyendo contenido de addons ya compilados.
- Incorpora una primera biblioteca Vanilla curada de drops, hábitats, contenido notable de biomas y mecánicas como gólems, Wither, baliza, conducto y automatización.
- Prepara la importación futura de `knowledge.json` generado por WATI Catalog Builder sin exigir que todos los addons sean recompilados ahora.
- Corrige la localización externa `tile.farmersdelight:wild_onions.name` como **Cebollas silvestres**.
- Conserva Runtime Provider Protocol v1, Schema 3, búsqueda es_MX, UUID y datos persistentes.

## Beta v2.7.0 — Proveedores runtime

- Añade WATI Runtime Provider Protocol v1 para que un Behavior Pack instalado registre su propia fuente y contenido sin recompilar Core.
- Incorpora `SDK/wati_provider.js` y sus declaraciones TypeScript para integraciones de terceros.
- Publica objetos, bloques, entidades, biomas, ecosistemas y estructuras aportados por proveedores en búsqueda, fuentes, fichas, conteos y diagnósticos.
- Usa transacciones `begin` → `chunk` → `commit` para evitar catálogos parciales.
- Rechaza namespaces reservados o pertenecientes a otra fuente y limita proveedores, chunks, campos y entradas.
- Anuncia `wati:provider_discover` al iniciar para que los proveedores instalados se vuelvan a registrar sin depender del orden de carga.
- Mantiene recetas, estaciones y métodos de obtención externos fuera del protocolo v1 hasta definir esquemas runtime específicos.
- Conserva Lookup v1, Codex v2/v3, Schema 3 y la dependencia con el RP Beta v2.6.1, que no necesitó cambios.

## Beta v2.6.1 — Índices diferidos

- Evita construir el índice completo de recetas al consultar fichas de biomas, ecosistemas, estructuras o entidades.
- Conserva la construcción diferida del índice cuando se consulta por primera vez un objeto o bloque, que sí puede mostrar recetas y usos.
- Reduce el pico de trabajo que podía provocar el primer descubrimiento de exploración después de iniciar el servidor.
- Conserva UUID, protocolo, catálogos y compatibilidad con los datos existentes.

## Beta v2.6.0 — Consolidación para servidor

- Añade alias de búsqueda es_MX para objetos, bloques y entidades Vanilla sin reemplazar las traducciones que renderiza el cliente.
- Ignora palabras de enlace como `de`, `del`, `la` o `the` para que el orden natural en español no impida una coincidencia.
- Entrega los alias Vanilla a consumidores Schema 3 y mejora también las búsquedas del modo Aventura.
- Mantiene biomas, ecosistemas, estructuras, recetas, adquisición y detección instalada de v2.5.x.
- Elimina la dependencia inversa RP → BP; el BP sigue enlazando su RP y se evita una dependencia circular.
- Conserva `@minecraft/server` estable 2.8.0.

# WATI Core — Changelog

## Beta v2.5.2 — Limpieza de localización

- Elimina comentarios no válidos de los archivos `.lang`.
- No cambia el catálogo ni el protocolo Schema 3.


## Beta v2.5.1 — Localización y estructuras Vanilla

- Amplía el catálogo runtime con 113 identifiers modernos y heredados de biomas Bedrock.
- Añade 17 categorías Vanilla de estructuras generadas al catálogo de Minecraft.
- Expone resúmenes localizados para biomas, ecosistemas y estructuras.
- Sustituye los nombres generados de las 107 estructuras auditadas por nombres legibles en es_MX y en_US.
- Prepara la detección de estructuras en la ubicación actual del jugador mediante consumidores compatibles.
- Mantiene intactos los 6,266 registros compilados, las 5,981 recetas, los 13 ecosistemas y las 107 estructuras de add-ons.

## Beta v2.5.0 — Catálogo del mundo

- Enumera biomas Vanilla registrados en tiempo de ejecución y conserva nombres localizados para los biomas conocidos.
- Añade las categorías Schema 3 `biome`, `ecosystem` y `structure` al protocolo, búsqueda, fichas, fuentes y diagnósticos.
- Registra 13 ecosistemas artificiales detectables de Better On Bedrock y Beyond The Underground mediante bloques característicos.
- Registra 107 estructuras jigsaw principales: 45 de Better On Bedrock, 1 de Beyond The Underground y 61 de Abandoned & Ruin Structures.
- Añade Abandoned & Ruin Structures como la fuente número 25 del catálogo.
- Separa explícitamente los biomas reales, los ecosistemas creados con worldgen y las estructuras que requieren un registro manual de ubicación.
- No copia texturas ni estructuras de los addons auditados; conserva únicamente metadatos compactos de identificación y generación.
- Mantiene los 6,266 registros compilados anteriores, las 5,981 recetas y compatibilidad con el protocolo 3.

## Beta v2.3.0 — Índices, cachés y diagnóstico del catálogo

- Crea índices de búsqueda por tipo y fuente para reducir el conjunto recorrido cuando existen filtros.
- Cachea el resumen runtime utilizado por capacidades: fuentes, contenido instalado, recetas, obtención y estaciones.
- Cachea las referencias de recetas y usos filtradas por fuentes instaladas para evitar repetir filtros en cada ficha.
- Cachea las filas enriquecidas de fuentes y reutiliza sus conteos y diagnósticos de presencia.
- Añade el endpoint paginado `wati:diagnostics` para consumidores de protocolo 3.
- Diagnostica fuentes no verificables, estaciones irresueltas o de baja confianza, referencias inválidas, tipos de receta desconocidos y recetas duplicadas dentro de una fuente.
- Expone el estado y tamaño de los índices/cachés para futuras herramientas administrativas.
- Mantiene intacta la compatibilidad con Codex protocolo 2 y no inicializa los registros runtime hasta que un consumidor los solicita.

## Beta v2.2.1 — Compilador Schema 3 y estaciones explícitas

- Integra catálogos compilados con WATI Catalog Schema 3 sin romper consumidores de protocolo 2.
- Añade un catálogo explícito de estaciones de fabricación y conserva la resolución heurística como respaldo.
- Expone claves localizadas, referencias de iconos y sugerencias de descubrimiento cuando existen en las contribuciones.
- Admite listas enriquecidas de condiciones de desbloqueo y recetas `brewing_container`.
- Incorpora metadatos de compilación, capacidades y configuración de detección por fuente.
- Elimina el comentario inválido que producía la advertencia de localización de Frame & Pane.

# WATI Core — Beta v2.2.0

- Inicia formalmente el desarrollo del contrato WATI 3 rumbo a la versión estable v3.0.0.
- Añade `schema_contract.js` y la especificación `WATI_SCHEMA_V3.md`.
- Introduce el protocolo Codex v3 sin romper consumidores del protocolo v2.
- Mantiene el anuncio heredado `cv: 2` y añade `cvc: 3`, `cvs: [2, 3]` y `sv: 3`.
- Añade el endpoint `wati:schema` y diagnósticos del esquema activo.
- Corrige la detección de WATI Core: ya no se marca a sí mismo como fuente ausente.
- Conserva oculto cualquier catálogo realmente no instalado.
- Añade diagnóstico de presencia por fuente con método, motivo y contenido coincidente.
- Cachea presencia de fuentes y conteos instalados para evitar recorridos repetidos.
- Enriquece las recetas con un descriptor de estación localizado y retrocompatible.
- Resuelve estaciones vanilla y estaciones personalizadas inequívocas del catálogo, incluyendo `farmersdelight:cooking_pot`.
- Mantiene intactos los catálogos de esquema 2 mientras Core prepara compatibilidad con el esquema 3.
- Continúa como beta interna; no está destinada todavía a publicación pública.
