# WATI Knowledge Schema 2

Schema 2 extends Schema 1 additively. Existing fields (`roles`, `drops`, `habitats`, `relations`, etc.) remain unchanged.

New fields:
- `factsSchema`: currently 1.
- `facts`: static metadata suitable for reusable consumers such as WATI Lens.

Initial facts:
- `equipment.slot`, `equipment.material`, `equipment.armorPoints` when known exactly.
- `tool.kind`, `tool.material`, `tool.tier`, `tool.harvestTier`, `tool.level` when inferable.
- `catalog.category/group` when supplied by the catalog.

Static Core facts never claim live state. Core can know that a diamond chestplate has 8 armor points; it cannot know which chestplate a particular zombie is wearing unless runtime observation or a Lens Provider identifies it.
