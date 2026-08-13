// WATI Knowledge Schema 2 — curated facts and future Builder-compatible data.
// Facts are deliberately structured so consumers can reveal them progressively.

const rel = (kind, id, relation = "related", confidence = 3) => Object.freeze({ kind, id, relation, confidence });
const part = (kind, id, count = 1, group = undefined) => Object.freeze({ kind, id, count, group });
const drop = (id, rarity = "common", quantity = undefined, condition = undefined, confidence = 3) => Object.freeze({
  kind: "item", id, rarity, quantity, condition, confidence
});
const content = (kind, id, relation = "notable", confidence = 2) => Object.freeze({ kind, id, relation, confidence });
const habitat = (biome, dimension = "minecraft:overworld", relation = "spawns", confidence = 2) => Object.freeze({
  biome, dimension, relation, confidence
});

export const KNOWLEDGE_SCHEMA_VERSION = 2;

export const CURATED_KNOWLEDGE = Object.freeze({
  "minecraft:chest": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.chest",
    roles: ["storage", "container"],
    relations: [rel("block", "minecraft:trapped_chest", "variant"), rel("block", "minecraft:copper_chest", "specialized_storage")]
  }),
  "minecraft:trapped_chest": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.trapped_chest",
    roles: ["storage", "redstone", "container"],
    relations: [rel("block", "minecraft:chest", "base")]
  }),
  "minecraft:copper_chest": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.copper_chest",
    roles: ["storage", "container", "oxidizable"],
    relations: [
      rel("entity", "minecraft:copper_golem", "automation"),
      rel("block", "minecraft:chest", "base"),
      rel("item", "minecraft:copper_ingot", "crafting_material")
    ]
  }),
  "minecraft:copper_golem": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.copper_golem",
    roles: ["utility_mob", "sorting", "constructible", "oxidizable"],
    relations: [
      rel("block", "minecraft:copper_chest", "takes_items_from"),
      rel("block", "minecraft:chest", "sorts_items_into"),
      rel("block", "minecraft:copper_golem_statue", "oxidizes_into"),
      rel("entity", "minecraft:iron_golem", "golem_family"),
      rel("block", "minecraft:carved_pumpkin", "construction_part"),
      rel("block", "minecraft:copper_block", "construction_part")
    ],
    construction: Object.freeze({
      id: "minecraft:copper_golem_construction",
      result: rel("entity", "minecraft:copper_golem", "result"),
      parts: [part("block", "minecraft:copper_block", 1), part("block", "minecraft:carved_pumpkin", 1, "pumpkin"), part("block", "minecraft:lit_pumpkin", 1, "pumpkin")],
      summaryKey: "wati.knowledge.construction.minecraft.copper_golem"
    })
  }),
  "minecraft:copper_golem_statue": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.copper_golem_statue",
    roles: ["decorative", "redstone", "oxidizable"],
    relations: [rel("entity", "minecraft:copper_golem", "origin")]
  }),
  "minecraft:wither": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.wither",
    roles: ["boss", "summoned", "hostile"],
    relations: [
      rel("item", "minecraft:nether_star", "unique_drop"),
      rel("block", "minecraft:beacon", "progression"),
      rel("block", "minecraft:soul_sand", "construction_part"),
      rel("block", "minecraft:soul_soil", "construction_part"),
      rel("item", "minecraft:wither_skeleton_skull", "construction_part")
    ],
    construction: Object.freeze({
      id: "minecraft:wither_summoning",
      result: rel("entity", "minecraft:wither", "result"),
      parts: [
        part("block", "minecraft:soul_sand", 4, "soul_base"),
        part("block", "minecraft:soul_soil", 4, "soul_base"),
        part("item", "minecraft:wither_skeleton_skull", 3)
      ],
      summaryKey: "wati.knowledge.construction.minecraft.wither"
    })
  }),
  "minecraft:wither_skeleton_skull": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.wither_skeleton_skull",
    roles: ["rare_drop", "construction_part", "decorative"],
    relations: [rel("entity", "minecraft:wither_skeleton", "dropped_by"), rel("entity", "minecraft:wither", "summons")]
  }),
  "minecraft:soul_sand": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.soul_sand",
    roles: ["building", "special_mechanic", "construction_part"],
    relations: [rel("entity", "minecraft:wither", "summoning"), rel("block", "minecraft:soul_campfire", "crafting_material")]
  }),
  "minecraft:soul_soil": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.soul_soil",
    roles: ["building", "special_mechanic", "construction_part"],
    relations: [rel("entity", "minecraft:wither", "summoning"), rel("block", "minecraft:soul_campfire", "crafting_material")]
  }),
  "minecraft:carved_pumpkin": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.carved_pumpkin",
    roles: ["wearable", "construction_part", "decorative"],
    relations: [
      rel("entity", "minecraft:iron_golem", "summoning"),
      rel("entity", "minecraft:snow_golem", "summoning"),
      rel("entity", "minecraft:copper_golem", "summoning")
    ]
  }),
  "minecraft:iron_golem": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.iron_golem",
    roles: ["utility_mob", "defender", "constructible"],
    construction: Object.freeze({
      id: "minecraft:iron_golem_construction",
      result: rel("entity", "minecraft:iron_golem", "result"),
      parts: [part("block", "minecraft:iron_block", 4), part("block", "minecraft:carved_pumpkin", 1, "pumpkin"), part("block", "minecraft:lit_pumpkin", 1, "pumpkin")],
      summaryKey: "wati.knowledge.construction.minecraft.iron_golem"
    })
  }),
  "minecraft:snow_golem": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.snow_golem",
    roles: ["utility_mob", "constructible"],
    construction: Object.freeze({
      id: "minecraft:snow_golem_construction",
      result: rel("entity", "minecraft:snow_golem", "result"),
      parts: [part("block", "minecraft:snow", 2), part("block", "minecraft:carved_pumpkin", 1, "pumpkin"), part("block", "minecraft:lit_pumpkin", 1, "pumpkin")],
      summaryKey: "wati.knowledge.construction.minecraft.snow_golem"
    })
  }),
  "minecraft:beacon": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.beacon",
    roles: ["utility_block", "area_effect", "progression"],
    relations: [rel("item", "minecraft:nether_star", "crafting_material"), rel("entity", "minecraft:wither", "progression")]
  }),
  "minecraft:conduit": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.conduit",
    roles: ["utility_block", "underwater", "area_effect"],
    relations: [rel("item", "minecraft:heart_of_the_sea", "crafting_material"), rel("item", "minecraft:nautilus_shell", "crafting_material")]
  }),
  "minecraft:respawn_anchor": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.respawn_anchor",
    roles: ["utility_block", "nether", "respawn"],
    relations: [rel("item", "minecraft:glowstone", "charges_with")]
  }),
  "minecraft:enchanting_table": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.enchanting_table",
    roles: ["crafting_station", "enchanting"],
    relations: [rel("block", "minecraft:bookshelf", "power_source"), rel("item", "minecraft:lapis_lazuli", "fuel")]
  }),
  "minecraft:hopper": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.hopper",
    roles: ["redstone", "automation", "container"]
  }),
  "minecraft:crafting_table": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.crafting_table",
    roles: ["crafting_station"]
  }),
  "minecraft:furnace": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.furnace",
    roles: ["crafting_station", "smelting"]
  }),
  "minecraft:composter": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.composter",
    roles: ["utility_block", "farming", "villager_job"]
  }),
  "minecraft:ender_chest": Object.freeze({
    summaryKey: "wati.knowledge.summary.minecraft.ender_chest",
    roles: ["storage", "personal_storage", "container"]
  })
});

export const VANILLA_ENTITY_DROPS = Object.freeze({
  "minecraft:zombie": Object.freeze([
    drop("minecraft:rotten_flesh", "common"),
    drop("minecraft:iron_ingot", "rare"),
    drop("minecraft:carrot", "rare"),
    drop("minecraft:potato", "rare"),
    drop("minecraft:equipment", "conditional", undefined, "carried_equipment", 2)
  ]),
  "minecraft:husk": Object.freeze([drop("minecraft:rotten_flesh", "common"), drop("minecraft:iron_ingot", "rare"), drop("minecraft:carrot", "rare"), drop("minecraft:potato", "rare")]),
  "minecraft:drowned": Object.freeze([drop("minecraft:rotten_flesh", "common"), drop("minecraft:copper_ingot", "uncommon"), drop("minecraft:trident", "rare", undefined, "holding_item"), drop("minecraft:nautilus_shell", "conditional", undefined, "holding_item")]),
  "minecraft:skeleton": Object.freeze([drop("minecraft:bone", "common"), drop("minecraft:arrow", "common"), drop("minecraft:bow", "conditional", undefined, "equipment")]),
  "minecraft:stray": Object.freeze([drop("minecraft:bone", "common"), drop("minecraft:arrow", "common"), drop("minecraft:arrow", "conditional", undefined, "slowness_arrow")]),
  "minecraft:wither_skeleton": Object.freeze([drop("minecraft:coal", "common"), drop("minecraft:bone", "common"), drop("minecraft:stone_sword", "conditional", undefined, "equipment"), drop("minecraft:wither_skeleton_skull", "rare")]),
  "minecraft:creeper": Object.freeze([drop("minecraft:gunpowder", "common"), drop("minecraft:music_disc", "conditional", undefined, "killed_by_skeleton")]),
  "minecraft:spider": Object.freeze([drop("minecraft:string", "common"), drop("minecraft:spider_eye", "conditional", undefined, "killed_by_player")]),
  "minecraft:cave_spider": Object.freeze([drop("minecraft:string", "common"), drop("minecraft:spider_eye", "conditional", undefined, "killed_by_player")]),
  "minecraft:enderman": Object.freeze([drop("minecraft:ender_pearl", "common")]),
  "minecraft:blaze": Object.freeze([drop("minecraft:blaze_rod", "conditional", undefined, "killed_by_player")]),
  "minecraft:ghast": Object.freeze([drop("minecraft:gunpowder", "common"), drop("minecraft:ghast_tear", "common")]),
  "minecraft:magma_cube": Object.freeze([drop("minecraft:magma_cream", "conditional", undefined, "size_and_looting")]),
  "minecraft:slime": Object.freeze([drop("minecraft:slime_ball", "conditional", undefined, "small_slime")]),
  "minecraft:witch": Object.freeze([drop("minecraft:glass_bottle", "random"), drop("minecraft:glowstone_dust", "random"), drop("minecraft:gunpowder", "random"), drop("minecraft:redstone", "random"), drop("minecraft:spider_eye", "random"), drop("minecraft:stick", "random"), drop("minecraft:sugar", "random"), drop("minecraft:potion", "conditional", undefined, "drinking")]),
  "minecraft:guardian": Object.freeze([drop("minecraft:prismarine_shard", "common"), drop("minecraft:raw_cod", "random"), drop("minecraft:prismarine_crystals", "rare")]),
  "minecraft:elder_guardian": Object.freeze([drop("minecraft:prismarine_shard", "common"), drop("minecraft:wet_sponge", "guaranteed"), drop("minecraft:tide_armor_trim_smithing_template", "conditional")]),
  "minecraft:cow": Object.freeze([drop("minecraft:leather", "common"), drop("minecraft:beef", "common")]),
  "minecraft:mooshroom": Object.freeze([drop("minecraft:leather", "common"), drop("minecraft:beef", "common")]),
  "minecraft:pig": Object.freeze([drop("minecraft:porkchop", "common"), drop("minecraft:saddle", "conditional", undefined, "equipped")]),
  "minecraft:chicken": Object.freeze([drop("minecraft:feather", "common"), drop("minecraft:chicken", "common")]),
  "minecraft:sheep": Object.freeze([drop("minecraft:wool", "common"), drop("minecraft:mutton", "common")]),
  "minecraft:rabbit": Object.freeze([drop("minecraft:rabbit", "common"), drop("minecraft:rabbit_hide", "common"), drop("minecraft:rabbit_foot", "rare")]),
  "minecraft:iron_golem": Object.freeze([drop("minecraft:iron_ingot", "common"), drop("minecraft:poppy", "common")]),
  "minecraft:snow_golem": Object.freeze([drop("minecraft:snowball", "common")]),
  "minecraft:copper_golem": Object.freeze([drop("minecraft:copper_ingot", "guaranteed", { min: 1, max: 3 })]),
  "minecraft:wither": Object.freeze([drop("minecraft:nether_star", "guaranteed", { min: 1, max: 1 })]),
  "minecraft:ender_dragon": Object.freeze([drop("minecraft:experience", "boss")]),
  "minecraft:warden": Object.freeze([drop("minecraft:sculk_catalyst", "guaranteed")]),
  "minecraft:breeze": Object.freeze([drop("minecraft:breeze_rod", "common")]),
  "minecraft:bogged": Object.freeze([drop("minecraft:bone", "common"), drop("minecraft:arrow", "common")])
});

export const VANILLA_ENTITY_HABITATS = Object.freeze({
  "minecraft:zombie": Object.freeze([habitat("minecraft:overworld", "minecraft:overworld", "dark_overworld", 1)]),
  "minecraft:husk": Object.freeze([habitat("minecraft:desert"), habitat("minecraft:badlands")]),
  "minecraft:drowned": Object.freeze([habitat("minecraft:ocean"), habitat("minecraft:river")]),
  "minecraft:stray": Object.freeze([habitat("minecraft:snowy_plains"), habitat("minecraft:ice_spikes"), habitat("minecraft:frozen_river")]),
  "minecraft:wither_skeleton": Object.freeze([habitat("minecraft:nether_fortress", "minecraft:nether", "structure", 3)]),
  "minecraft:blaze": Object.freeze([habitat("minecraft:nether_fortress", "minecraft:nether", "structure", 3)]),
  "minecraft:ghast": Object.freeze([habitat("minecraft:nether_wastes", "minecraft:nether"), habitat("minecraft:soul_sand_valley", "minecraft:nether")]),
  "minecraft:enderman": Object.freeze([habitat("minecraft:the_end", "minecraft:the_end"), habitat("minecraft:warped_forest", "minecraft:nether")]),
  "minecraft:slime": Object.freeze([habitat("minecraft:swamp"), habitat("minecraft:mangrove_swamp"), habitat("minecraft:slime_chunk", "minecraft:overworld", "underground_region", 1)]),
  "minecraft:magma_cube": Object.freeze([habitat("minecraft:basalt_deltas", "minecraft:nether"), habitat("minecraft:nether_fortress", "minecraft:nether", "structure", 3)]),
  "minecraft:guardian": Object.freeze([habitat("minecraft:ocean_monument", "minecraft:overworld", "structure", 3)]),
  "minecraft:elder_guardian": Object.freeze([habitat("minecraft:ocean_monument", "minecraft:overworld", "structure", 3)]),
  "minecraft:axolotl": Object.freeze([habitat("minecraft:lush_caves")]),
  "minecraft:warden": Object.freeze([habitat("minecraft:deep_dark")]),
  "minecraft:frog": Object.freeze([habitat("minecraft:swamp"), habitat("minecraft:mangrove_swamp")]),
  "minecraft:camel": Object.freeze([habitat("minecraft:village", "minecraft:overworld", "desert_village", 2)]),
  "minecraft:armadillo": Object.freeze([habitat("minecraft:savanna"), habitat("minecraft:badlands")]),
  "minecraft:wolf": Object.freeze([habitat("minecraft:taiga"), habitat("minecraft:forest"), habitat("minecraft:grove")]),
  "minecraft:fox": Object.freeze([habitat("minecraft:taiga"), habitat("minecraft:snowy_taiga")]),
  "minecraft:mooshroom": Object.freeze([habitat("minecraft:mushroom_fields")]),
  "minecraft:creaking": Object.freeze([habitat("minecraft:pale_garden")]),
  "minecraft:breeze": Object.freeze([habitat("minecraft:trial_chambers", "minecraft:overworld", "structure", 3)]),
  "minecraft:bogged": Object.freeze([habitat("minecraft:swamp"), habitat("minecraft:mangrove_swamp"), habitat("minecraft:trial_chambers", "minecraft:overworld", "structure", 2)]),
  "minecraft:copper_golem": Object.freeze([habitat("minecraft:player_construction", "minecraft:overworld", "constructed", 3)]),
  "minecraft:iron_golem": Object.freeze([habitat("minecraft:village", "minecraft:overworld", "village_or_constructed", 2)]),
  "minecraft:snow_golem": Object.freeze([habitat("minecraft:player_construction", "minecraft:overworld", "constructed", 3)]),
  "minecraft:wither": Object.freeze([habitat("minecraft:player_summoning", "minecraft:overworld", "summoned", 3)])
});

export const VANILLA_BIOME_CONTENTS = Object.freeze({
  "minecraft:plains": Object.freeze([content("entity", "minecraft:cow"), content("entity", "minecraft:sheep"), content("entity", "minecraft:pig"), content("structure", "minecraft:village"), content("block", "minecraft:short_grass")]),
  "minecraft:sunflower_plains": Object.freeze([content("block", "minecraft:sunflower"), content("entity", "minecraft:bee"), content("structure", "minecraft:village")]),
  "minecraft:desert": Object.freeze([content("block", "minecraft:cactus"), content("entity", "minecraft:husk"), content("entity", "minecraft:rabbit"), content("structure", "minecraft:temple"), content("structure", "minecraft:village")]),
  "minecraft:savanna": Object.freeze([content("block", "minecraft:acacia_log"), content("entity", "minecraft:armadillo"), content("structure", "minecraft:village")]),
  "minecraft:taiga": Object.freeze([content("block", "minecraft:spruce_log"), content("block", "minecraft:sweet_berry_bush"), content("entity", "minecraft:fox"), content("entity", "minecraft:wolf"), content("structure", "minecraft:village")]),
  "minecraft:snowy_plains": Object.freeze([content("entity", "minecraft:stray"), content("entity", "minecraft:polar_bear"), content("structure", "minecraft:village"), content("structure", "minecraft:temple", "igloo", 2)]),
  "minecraft:swamp": Object.freeze([content("entity", "minecraft:frog"), content("entity", "minecraft:slime"), content("block", "minecraft:blue_orchid"), content("structure", "minecraft:temple", "witch_hut", 2)]),
  "minecraft:mangrove_swamp": Object.freeze([content("block", "minecraft:mangrove_log"), content("entity", "minecraft:frog"), content("entity", "minecraft:slime")]),
  "minecraft:cherry_grove": Object.freeze([content("block", "minecraft:cherry_log"), content("block", "minecraft:pink_petals"), content("entity", "minecraft:bee")]),
  "minecraft:pale_garden": Object.freeze([content("block", "minecraft:pale_oak_log"), content("block", "minecraft:creaking_heart"), content("entity", "minecraft:creaking")]),
  "minecraft:deep_dark": Object.freeze([content("block", "minecraft:sculk"), content("block", "minecraft:sculk_shrieker"), content("entity", "minecraft:warden"), content("structure", "minecraft:ancient_city")]),
  "minecraft:lush_caves": Object.freeze([content("entity", "minecraft:axolotl"), content("block", "minecraft:glow_berries"), content("block", "minecraft:spore_blossom"), content("block", "minecraft:clay")]),
  "minecraft:dripstone_caves": Object.freeze([content("block", "minecraft:pointed_dripstone"), content("block", "minecraft:dripstone_block"), content("block", "minecraft:copper_ore")]),
  "minecraft:sulfur_caves": Object.freeze([content("block", "minecraft:sulfur"), content("entity", "minecraft:sulfur_cube")]),
  "minecraft:mushroom_fields": Object.freeze([content("entity", "minecraft:mooshroom"), content("block", "minecraft:mycelium"), content("block", "minecraft:red_mushroom_block"), content("block", "minecraft:brown_mushroom_block")]),
  "minecraft:warm_ocean": Object.freeze([content("block", "minecraft:coral_block"), content("entity", "minecraft:tropicalfish"), content("entity", "minecraft:dolphin"), content("structure", "minecraft:ruins")]),
  "minecraft:ocean": Object.freeze([content("entity", "minecraft:cod"), content("entity", "minecraft:dolphin"), content("structure", "minecraft:shipwreck"), content("structure", "minecraft:ruins")]),
  "minecraft:frozen_ocean": Object.freeze([content("entity", "minecraft:polar_bear"), content("entity", "minecraft:stray"), content("block", "minecraft:packed_ice"), content("structure", "minecraft:shipwreck")]),
  "minecraft:nether_wastes": Object.freeze([content("block", "minecraft:netherrack"), content("entity", "minecraft:zombified_piglin"), content("entity", "minecraft:ghast"), content("structure", "minecraft:fortress")]),
  "minecraft:crimson_forest": Object.freeze([content("block", "minecraft:crimson_nylium"), content("entity", "minecraft:piglin"), content("entity", "minecraft:hoglin")]),
  "minecraft:warped_forest": Object.freeze([content("block", "minecraft:warped_nylium"), content("entity", "minecraft:enderman"), content("entity", "minecraft:strider")]),
  "minecraft:soul_sand_valley": Object.freeze([content("block", "minecraft:soul_sand"), content("block", "minecraft:bone_block"), content("entity", "minecraft:ghast"), content("entity", "minecraft:skeleton")]),
  "minecraft:basalt_deltas": Object.freeze([content("block", "minecraft:basalt"), content("block", "minecraft:blackstone"), content("entity", "minecraft:magma_cube")]),
  "minecraft:the_end": Object.freeze([content("block", "minecraft:end_stone"), content("entity", "minecraft:enderman"), content("entity", "minecraft:ender_dragon")]),
  "minecraft:end_highlands": Object.freeze([content("block", "minecraft:chorus_plant"), content("structure", "minecraft:end_city"), content("entity", "minecraft:shulker")])
});

export const KNOWLEDGE_DATA = Object.freeze({
  schema: KNOWLEDGE_SCHEMA_VERSION,
  profiles: CURATED_KNOWLEDGE,
  entityDrops: VANILLA_ENTITY_DROPS,
  entityHabitats: VANILLA_ENTITY_HABITATS,
  biomeContents: VANILLA_BIOME_CONTENTS
});
