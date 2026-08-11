// Presentation-only aliases for implementation IDs that must never become catalog entries.
// A redirect changes only the name returned by lookup/entry; ownership and content
// still come from the runtime provider (when one is registered).
export const DISPLAY_NAME_REDIRECTS = Object.freeze({
  entity: Object.freeze({
    "alexs_mobs:anaconda_part": Object.freeze(["wati.redirect.entity.alexs_mobs.anaconda_part", "Anaconda"]),
    "alexs_mobs:capuchin_tossed_item": Object.freeze(["wati.redirect.entity.alexs_mobs.capuchin_tossed_item", "Capuchin Monkey"]),
    "alexs_mobs:cockroach_egg": Object.freeze(["wati.redirect.entity.alexs_mobs.cockroach_egg", "Cockroach Ootheca"])
  }),
  block: Object.freeze({
    "alexs_mobs:terrapin_egg_block_2": Object.freeze(["wati.redirect.block.alexs_mobs.terrapin_egg_block", "Terrapin Eggs"]),
    "alexs_mobs:terrapin_egg_block_3": Object.freeze(["wati.redirect.block.alexs_mobs.terrapin_egg_block", "Terrapin Eggs"]),
    "alexs_mobs:terrapin_egg_block_4": Object.freeze(["wati.redirect.block.alexs_mobs.terrapin_egg_block", "Terrapin Eggs"])
  })
});

export function displayNameRedirect(kind, typeId) {
  return DISPLAY_NAME_REDIRECTS[kind]?.[typeId];
}
