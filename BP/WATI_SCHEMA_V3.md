# WATI Schema 3 — contrato inicial

Introducido durante la línea de desarrollo v2.2.0 y estabilizado en **WATI Core v3.0.0**.

## Compatibilidad

- Lookup heredado: protocolo 1.
- Codex actual: protocolo 2, todavía aceptado.
- Nuevo protocolo Codex: protocolo 3.
- Catálogo actual generado: esquema 2, todavía aceptado.
- Futuro catálogo enriquecido: esquema 3.

Core no obliga todavía a regenerar los catálogos existentes. Los consumidores pueden consultar `wati:capabilities` o `wati:schema` para conocer las versiones activas y aceptadas.

## Responsabilidad de Core

Core conserva información universal y estática:

- fuentes y addons;
- objetos, bloques y entidades;
- recetas y estaciones;
- biomas, estructuras y ecosistemas registrados;
- relaciones, pistas y definiciones de descubrimiento aportadas por el generador o SDK.

## Responsabilidad de Codex y otros consumidores

Los datos dependientes del mundo o del jugador no pertenecen al catálogo de Core:

- perfil elegido;
- descubrimientos personales o comunitarios;
- expediciones y rutas;
- ubicaciones encontradas;
- política administrativa del servidor.

## Compatibilidad hacia atrás

Los mensajes de protocolo 2 reciben respuestas de protocolo 2. Los mensajes de protocolo 3 reciben respuestas de protocolo 3. El anuncio `wati:ready` conserva `cv: 2` para consumidores antiguos y añade `cvc: 3` y `cvs: [2, 3]` para consumidores nuevos. Esto permite desarrollar el nuevo Codex sin romper consumidores v1.1.0 existentes.

## Estaciones de fabricación

Las recetas pueden incluir un descriptor `station` enriquecido con:

- etiqueta original;
- identifier resuelto cuando exista;
- tipo de contenido;
- clave de traducción runtime o de WATI;
- nombre de respaldo;
- método y confianza de resolución.

El generador web podrá aportar una asociación explícita en el esquema 3. Mientras tanto, Core resuelve estaciones vanilla y casos inequívocos del catálogo actual, como `farmersdelight:cooking_pot`.

## Catálogo compilado desde v2.2.1

El catálogo runtime se genera con `WATI Core Catalog Compiler` y conserva una representación compacta para reducir el peso del script.

### Entradas compactas

Las posiciones admitidas son:

```text
0 catalogTranslationKey
1 fallbackName
2 internal
3 aliases separados por |
4 category
5 group
6 runtimeLocalizationKey
7 icon.textureKey
8 icon.texturePath
9 discoveryHints.suggestedTriggers separados por |
```

Los catálogos Schema 2 que solo usan las primeras seis posiciones siguen siendo válidos.

### Estaciones

`stations_data.js` contiene estaciones explícitas por fuente y etiqueta. Core las consulta antes de intentar la resolución heurística por namespace o sufijo. Las estaciones incluyen identifier, tipo, estado de resolución, confianza, clave runtime, clave de catálogo, nombre de respaldo y referencia al contenido asociado.

### Compilación

El generador web exporta contribuciones Schema 3. El compilador incluido en WATI Catalog Builder v1.1.1 fusiona esas contribuciones con el catálogo existente y genera un reporte reproducible en `CATALOG_BUILD_REPORT.json`.


## Diagnóstico de catálogo

Los consumidores con protocolo Codex 3 pueden solicitar `wati:diagnostics`.

Secciones disponibles:

- `summary`: salud del esquema, resumen runtime, conteos de incidencias y estado de cachés.
- `sources`: presencia no verificable y fuentes sin contenido detectable.
- `stations`: estaciones irresueltas, de baja confianza o con referencias rotas.
- `recipes`: identifiers duplicados dentro de una fuente y tipos de receta desconocidos.
- `integrity`: referencias de namespaces, estaciones o recetas hacia fuentes inexistentes.
- `caches`: estado de construcción y tamaños de los índices runtime.

Las secciones de listas aceptan `p` y `z` y responden de forma paginada. El diagnóstico es de solo lectura y se construye únicamente cuando un consumidor lo solicita.

## Catálogo Vanilla runtime (desde Core v2.6.0)

La fuente `minecraft` se genera al primer uso a partir de los tipos que expone la Script API. Estas entradas no se escriben dentro de los catálogos compilados y no duplican archivos de textura. Core devuelve claves de localización y rutas de los recursos Vanilla ya cargados cuando puede resolverlas.

Campos adicionales de una entrada runtime:

- `vr: true`: entrada generada por Core durante la ejecución.
- `s`: clave de localización de Minecraft cuando está disponible.
- `itp`: ruta de textura Vanilla reutilizable por formularios compatibles.
- `dh`: sugerencias básicas de descubrimiento.

El método de detección de la fuente es `runtime`. Los consumidores siempre deben conservar un icono y nombre de respaldo, porque no todos los tipos internos tienen una textura de inventario independiente.

## Proveedores runtime (desde Core v2.7.0)

Un add-on instalado puede registrar su fuente y sus entradas mediante WATI
Runtime Provider Protocol v1. Los datos confirmados en `provider_commit` se
integran a las mismas búsquedas, fichas, fuentes y diagnósticos que el catálogo
compilado.

El registro runtime tiene precedencia sobre una entrada compilada de la misma
fuente y namespace, permitiendo que el propio creador publique metadatos más
actuales. No puede reclamar `minecraft`, `wati` ni el namespace de otra fuente.

El protocolo v1 acepta contenido, pero no recetas, estaciones ni adquisición.
La especificación completa y el SDK copiable están en
`WATI_PROVIDER_PROTOCOL_V1.md` y `SDK/wati_provider.js`.


## Búsqueda Vanilla es_MX (desde Core v2.6.0)

Core genera alias de búsqueda españoles a partir de identifiers y claves de localización Vanilla. Los alias son únicamente un índice: la ficha continúa usando la clave oficial de Minecraft para renderizar el nombre en el idioma del cliente. El buscador elimina palabras de enlace frecuentes, por lo que consultas como `cofre de cobre`, `gólem de hierro` o `ladrillos de piedra` no dependen del orden de las palabras.
## Knowledge Schema 2 (compatible con Schema 1)

Core puede entregar un perfil de conocimiento mediante `wati:knowledge` / `wati:knowledge_result`. El perfil no reemplaza las recetas ni `acquisition.json`; los relaciona para que un consumidor construya una ficha narrativa sin perder evidencia estructurada.

Campos principales:

- `summaryKey` o `summaryCode`: descripción localizada o resumen generado.
- `roles`: usos y funciones generales de la entrada.
- `drops`: resultados de entidades o bloques, con rareza, cantidad, condición y confianza.
- `habitats`: biomas, estructuras, dimensiones o contextos donde aparece una entidad.
- `contents`: criaturas, bloques, estructuras u objetos notables asociados a un bioma o ecosistema.
- `relations`: vínculos semánticos con otras entradas.
- `construction`: patrón multibloque o invocación especial.
- `generated`: distingue un perfil inferido de uno curado o compilado.

La primera implementación genera perfiles a partir del catálogo y de `ACQUISITION_DATA`, y admite una biblioteca curada. WATI Catalog Builder puede producir posteriormente `knowledge.json`; el compilador lo convertirá a módulos compactos sin cambiar el protocolo del consumidor.

En el modo Aventura, Codex es responsable de decidir qué campos se revelan según el progreso del jugador.



### WATI Lens Knowledge Bridge (Core v3.2.0)

`wati:knowledge` mantiene Codex Protocol 3 y añade de forma aditiva `factsSchema` y `facts`.
Los consumers antiguos pueden ignorar estos campos. Lens v1.0.0 los usa como conocimiento estático/fallback.

Ejemplo:
```json
{
  "schema": 2,
  "factsSchema": 1,
  "facts": {
    "equipment": { "slot": "chest", "material": "diamond", "armorPoints": 8 },
    "sources": { "equipment": "wati_core_curated" }
  }
}
```

Facts inferidos por identificador se marcan con confianza menor; los valores exactos deben venir de curación o del Catalog Builder/fuente del addon.
