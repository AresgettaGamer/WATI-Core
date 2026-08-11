import { BiomeTypes, BlockTypes, EntityTypes, ItemTypes } from "@minecraft/server";
import {
  VANILLA_ITEM_TEXTURE_KEYS,
  VANILLA_TERRAIN_TEXTURE_KEYS,
  VANILLA_ITEM_TEXTURE_PATHS,
  VANILLA_TERRAIN_TEXTURE_PATHS
} from "./vanilla_texture_data.js";
import { vanillaSpanishAliases } from "./vanilla_es_mx_search.js";

const VANILLA_NAMESPACE = "minecraft";
const KNOWN_VANILLA_BIOMES = new Set(["ocean","plains","desert","windswept_hills","extreme_hills","forest","taiga","swamp","swampland","river","nether_wastes","hell","the_end","frozen_ocean","legacy_frozen_ocean","frozen_river","snowy_plains","ice_plains","mushroom_fields","mushroom_island","mushroom_island_shore","beach","jungle","sparse_jungle","jungle_edge","jungle_hills","deep_ocean","stony_shore","stone_beach","snowy_beach","cold_beach","birch_forest","birch_forest_hills","dark_forest","roofed_forest","snowy_taiga","cold_taiga","cold_taiga_hills","old_growth_pine_taiga","mega_taiga","mega_taiga_hills","windswept_forest","extreme_hills_plus_trees","savanna","savanna_plateau","badlands","mesa","wooded_badlands","mesa_plateau_stone","mesa_plateau","small_end_islands","end_midlands","end_highlands","end_barrens","warm_ocean","deep_warm_ocean","lukewarm_ocean","deep_lukewarm_ocean","cold_ocean","deep_cold_ocean","deep_frozen_ocean","bamboo_jungle","bamboo_jungle_hills","sunflower_plains","windswept_gravelly_hills","flower_forest","ice_spikes","ice_plains_spikes","old_growth_birch_forest","old_growth_spruce_taiga","windswept_savanna","eroded_badlands","frozen_peaks","jagged_peaks","stony_peaks","meadow","grove","snowy_slopes","lush_caves","dripstone_caves","deep_dark","mangrove_swamp","cherry_grove","pale_garden","soul_sand_valley","soulsand_valley","crimson_forest","warped_forest","basalt_deltas","desert_hills","forest_hills","taiga_hills","extreme_hills_edge","ice_mountains","desert_mutated","extreme_hills_mutated","taiga_mutated","swampland_mutated","jungle_mutated","jungle_edge_mutated","birch_forest_mutated","birch_forest_hills_mutated","roofed_forest_mutated","cold_taiga_mutated","redwood_taiga_mutated","redwood_taiga_hills_mutated","extreme_hills_plus_trees_mutated","savanna_mutated","savanna_plateau_mutated","mesa_bryce","mesa_plateau_stone_mutated","mesa_plateau_mutated","sulfur_caves"]);
const KNOWN_VANILLA_STRUCTURES = Object.freeze({"minecraft:ancient_city":{"n":"wati.world.structure.minecraft.ancient_city","d":"Ancient City","dim":"minecraft:overworld"},"minecraft:bastion_remnant":{"n":"wati.world.structure.minecraft.bastion_remnant","d":"Bastion Remnant","dim":"minecraft:nether"},"minecraft:buried_treasure":{"n":"wati.world.structure.minecraft.buried_treasure","d":"Buried Treasure","dim":"minecraft:overworld"},"minecraft:end_city":{"n":"wati.world.structure.minecraft.end_city","d":"End City","dim":"minecraft:the_end"},"minecraft:fortress":{"n":"wati.world.structure.minecraft.fortress","d":"Nether Fortress","dim":"minecraft:nether"},"minecraft:mansion":{"n":"wati.world.structure.minecraft.mansion","d":"Woodland Mansion","dim":"minecraft:overworld"},"minecraft:mineshaft":{"n":"wati.world.structure.minecraft.mineshaft","d":"Mineshaft","dim":"minecraft:overworld"},"minecraft:monument":{"n":"wati.world.structure.minecraft.monument","d":"Ocean Monument","dim":"minecraft:overworld"},"minecraft:pillager_outpost":{"n":"wati.world.structure.minecraft.pillager_outpost","d":"Pillager Outpost","dim":"minecraft:overworld"},"minecraft:ruined_portal":{"n":"wati.world.structure.minecraft.ruined_portal","d":"Ruined Portal","dim":"minecraft:overworld"},"minecraft:ruins":{"n":"wati.world.structure.minecraft.ruins","d":"Ocean Ruins","dim":"minecraft:overworld"},"minecraft:shipwreck":{"n":"wati.world.structure.minecraft.shipwreck","d":"Shipwreck","dim":"minecraft:overworld"},"minecraft:stronghold":{"n":"wati.world.structure.minecraft.stronghold","d":"Stronghold","dim":"minecraft:overworld"},"minecraft:temple":{"n":"wati.world.structure.minecraft.temple","d":"Temple","dim":"minecraft:overworld"},"minecraft:trail_ruins":{"n":"wati.world.structure.minecraft.trail_ruins","d":"Trail Ruins","dim":"minecraft:overworld"},"minecraft:trial_chambers":{"n":"wati.world.structure.minecraft.trial_chambers","d":"Trial Chambers","dim":"minecraft:overworld"},"minecraft:village":{"n":"wati.world.structure.minecraft.village","d":"Village","dim":"minecraft:overworld"}});
const VANILLA_WORLD_ALIASES = Object.freeze({"minecraft:ocean":["Océano"],"minecraft:plains":["Planicies"],"minecraft:desert":["Desierto"],"minecraft:windswept_hills":["Colinas azotadas por el viento"],"minecraft:extreme_hills":["Colinas extremas"],"minecraft:forest":["Bosque"],"minecraft:taiga":["Taiga"],"minecraft:swamp":["Pantano"],"minecraft:swampland":["Pantano"],"minecraft:river":["Río"],"minecraft:nether_wastes":["Desiertos del Nether"],"minecraft:hell":["Desiertos del Nether"],"minecraft:the_end":["El End"],"minecraft:frozen_ocean":["Océano congelado"],"minecraft:legacy_frozen_ocean":["Océano congelado antiguo"],"minecraft:frozen_river":["Río congelado"],"minecraft:snowy_plains":["Planicies nevadas"],"minecraft:ice_plains":["Planicies nevadas"],"minecraft:mushroom_fields":["Campos de hongos"],"minecraft:mushroom_island":["Campos de hongos"],"minecraft:mushroom_island_shore":["Costa de campos de hongos"],"minecraft:beach":["Playa"],"minecraft:jungle":["Jungla"],"minecraft:sparse_jungle":["Jungla dispersa"],"minecraft:jungle_edge":["Borde de jungla"],"minecraft:jungle_hills":["Colinas de jungla"],"minecraft:deep_ocean":["Océano profundo"],"minecraft:stony_shore":["Costa rocosa"],"minecraft:stone_beach":["Costa rocosa"],"minecraft:snowy_beach":["Playa nevada"],"minecraft:cold_beach":["Playa nevada"],"minecraft:birch_forest":["Bosque de abedules"],"minecraft:birch_forest_hills":["Colinas de bosque de abedules"],"minecraft:dark_forest":["Bosque oscuro"],"minecraft:roofed_forest":["Bosque oscuro"],"minecraft:snowy_taiga":["Taiga nevada"],"minecraft:cold_taiga":["Taiga nevada"],"minecraft:cold_taiga_hills":["Colinas de taiga nevada"],"minecraft:old_growth_pine_taiga":["Taiga de pinos primigenios"],"minecraft:mega_taiga":["Taiga de árboles gigantes"],"minecraft:mega_taiga_hills":["Colinas de taiga de árboles gigantes"],"minecraft:windswept_forest":["Bosque azotado por el viento"],"minecraft:extreme_hills_plus_trees":["Colinas boscosas extremas"],"minecraft:savanna":["Sabana"],"minecraft:savanna_plateau":["Meseta de sabana"],"minecraft:badlands":["Tierras baldías"],"minecraft:mesa":["Tierras baldías"],"minecraft:wooded_badlands":["Tierras baldías boscosas"],"minecraft:mesa_plateau_stone":["Meseta boscosa de tierras baldías"],"minecraft:mesa_plateau":["Meseta de tierras baldías"],"minecraft:small_end_islands":["Islas pequeñas del End"],"minecraft:end_midlands":["Tierras medias del End"],"minecraft:end_highlands":["Tierras altas del End"],"minecraft:end_barrens":["Tierras estériles del End"],"minecraft:warm_ocean":["Océano cálido"],"minecraft:deep_warm_ocean":["Océano cálido profundo"],"minecraft:lukewarm_ocean":["Océano templado"],"minecraft:deep_lukewarm_ocean":["Océano templado profundo"],"minecraft:cold_ocean":["Océano frío"],"minecraft:deep_cold_ocean":["Océano frío profundo"],"minecraft:deep_frozen_ocean":["Océano congelado profundo"],"minecraft:bamboo_jungle":["Jungla de bambú"],"minecraft:bamboo_jungle_hills":["Colinas de jungla de bambú"],"minecraft:sunflower_plains":["Planicies de girasoles"],"minecraft:windswept_gravelly_hills":["Colinas de grava azotadas por el viento"],"minecraft:flower_forest":["Bosque de flores"],"minecraft:ice_spikes":["Picos de hielo"],"minecraft:ice_plains_spikes":["Picos de hielo"],"minecraft:old_growth_birch_forest":["Bosque de abedules primigenios"],"minecraft:old_growth_spruce_taiga":["Taiga de abetos primigenios"],"minecraft:windswept_savanna":["Sabana azotada por el viento"],"minecraft:eroded_badlands":["Tierras baldías erosionadas"],"minecraft:frozen_peaks":["Picos congelados"],"minecraft:jagged_peaks":["Picos escarpados"],"minecraft:stony_peaks":["Picos rocosos"],"minecraft:meadow":["Pradera"],"minecraft:grove":["Arboleda"],"minecraft:snowy_slopes":["Laderas nevadas"],"minecraft:lush_caves":["Cuevas frondosas"],"minecraft:dripstone_caves":["Cuevas de espeleotemas"],"minecraft:deep_dark":["Oscuridad profunda"],"minecraft:mangrove_swamp":["Manglar"],"minecraft:cherry_grove":["Arboleda de cerezos"],"minecraft:pale_garden":["Jardín pálido"],"minecraft:soul_sand_valley":["Valle de arena de almas"],"minecraft:soulsand_valley":["Valle de arena de almas"],"minecraft:crimson_forest":["Bosque carmesí"],"minecraft:warped_forest":["Bosque distorsionado"],"minecraft:basalt_deltas":["Deltas de basalto"],"minecraft:desert_hills":["Colinas del desierto"],"minecraft:forest_hills":["Colinas boscosas"],"minecraft:taiga_hills":["Colinas de taiga"],"minecraft:extreme_hills_edge":["Borde de colinas extremas"],"minecraft:ice_mountains":["Montañas nevadas"],"minecraft:desert_mutated":["Desierto con lagos"],"minecraft:extreme_hills_mutated":["Colinas de grava"],"minecraft:taiga_mutated":["Montañas de taiga"],"minecraft:swampland_mutated":["Colinas pantanosas"],"minecraft:jungle_mutated":["Jungla modificada"],"minecraft:jungle_edge_mutated":["Borde de jungla modificado"],"minecraft:birch_forest_mutated":["Bosque de abedules altos"],"minecraft:birch_forest_hills_mutated":["Colinas de abedules altos"],"minecraft:roofed_forest_mutated":["Colinas de bosque oscuro"],"minecraft:cold_taiga_mutated":["Montañas de taiga nevada"],"minecraft:redwood_taiga_mutated":["Taiga de abetos gigantes"],"minecraft:redwood_taiga_hills_mutated":["Colinas de taiga de abetos gigantes"],"minecraft:extreme_hills_plus_trees_mutated":["Colinas de grava boscosas"],"minecraft:savanna_mutated":["Sabana azotada por el viento"],"minecraft:savanna_plateau_mutated":["Meseta de sabana azotada por el viento"],"minecraft:mesa_bryce":["Tierras baldías erosionadas"],"minecraft:mesa_plateau_stone_mutated":["Meseta boscosa modificada de tierras baldías"],"minecraft:mesa_plateau_mutated":["Meseta modificada de tierras baldías"],"minecraft:sulfur_caves":["Cuevas de azufre"],"minecraft:ancient_city":["Ciudad antigua"],"minecraft:bastion_remnant":["Bastión en ruinas"],"minecraft:buried_treasure":["Tesoro enterrado"],"minecraft:end_city":["Ciudad del End"],"minecraft:fortress":["Fortaleza del Nether"],"minecraft:mansion":["Mansión del bosque"],"minecraft:mineshaft":["Mina abandonada"],"minecraft:monument":["Monumento oceánico"],"minecraft:pillager_outpost":["Puesto de saqueadores"],"minecraft:ruined_portal":["Portal en ruinas"],"minecraft:ruins":["Ruinas oceánicas"],"minecraft:shipwreck":["Naufragio"],"minecraft:stronghold":["Fortaleza"],"minecraft:temple":["Templo"],"minecraft:trail_ruins":["Ruinas de sendero"],"minecraft:trial_chambers":["Cámaras de pruebas"],"minecraft:village":["Aldea"]});
const ENTITY_TEXTURE_PREFIX = "spawn_egg_";
const SPECIAL_ITEM_KEYS = Object.freeze({
  golden_apple: "apple_golden",
  enchanted_golden_apple: "apple_golden",
  book: "book_normal",
  writable_book: "book_writable",
  written_book: "book_written",
  enchanted_book: "book_enchanted",
  dragon_breath: "dragon_breath",
  glistering_melon_slice: "melon_speckled",
  melon_slice: "melon",
  nether_brick: "netherbrick",
  quartz: "quartz",
  redstone: "redstone_dust",
  repeater: "repeater",
  comparator: "comparator",
  filled_map: "map_filled",
  map: "map_empty",
  end_crystal: "end_crystal",
  firework_rocket: "fireworks",
  firework_star: "fireworks_charge",
  turtle_helmet: "turtle_helmet",
  scute: "turtle_shell_piece",
  armadillo_scute: "armadillo_scute",
  experience_bottle: "experience_bottle",
  honey_bottle: "honey_bottle",
  glass_bottle: "potion_bottle_empty",
  potion: "potion_bottle_drinkable",
  splash_potion: "potion_bottle_splash",
  lingering_potion: "potion_bottle_lingering",
  milk_bucket: "bucket",
  water_bucket: "bucket",
  lava_bucket: "bucket",
  powder_snow_bucket: "bucket",
  cod_bucket: "bucket",
  salmon_bucket: "bucket",
  tropical_fish_bucket: "bucket",
  pufferfish_bucket: "bucket",
  axolotl_bucket: "bucket",
  tadpole_bucket: "bucket",
  sulfur_cube_bucket: "bucket",
  wooden_door: "wooden_door",
  oak_door: "wooden_door",
  iron_door: "iron_door",
  flower_pot: "flower_pot",
  item_frame: "frame",
  glow_item_frame: "glow_frame",
  sugar_cane: "reeds",
  nether_wart: "nether_wart",
  wheat_seeds: "seeds_wheat",
  pumpkin_seeds: "seeds_pumpkin",
  melon_seeds: "seeds_melon",
  beetroot_seeds: "seeds_beetroot",
  torchflower_seeds: "seeds_torchflower",
  pitcher_pod: "pitcher_pod",
  music_disc_13: "record_13",
  music_disc_cat: "record_cat",
  music_disc_blocks: "record_blocks",
  music_disc_chirp: "record_chirp",
  music_disc_far: "record_far",
  music_disc_mall: "record_mall",
  music_disc_mellohi: "record_mellohi",
  music_disc_stal: "record_stal",
  music_disc_strad: "record_strad",
  music_disc_ward: "record_ward",
  music_disc_11: "record_11",
  music_disc_wait: "record_wait",
  music_disc_pigstep: "record_pigstep",
  music_disc_otherside: "record_otherside",
  music_disc_5: "record_5",
  music_disc_relic: "record_relic",
  music_disc_creator: "record_creator",
  music_disc_creator_music_box: "record_creator_music_box",
  music_disc_precipice: "record_precipice"
});
const SPECIAL_BLOCK_KEYS = Object.freeze({
  grass_block: "grass_top",
  dirt_path: "grass_path_top",
  podzol: "dirt_podzol_top",
  mycelium: "mycelium_top",
  crafting_table: "crafting_table_top",
  chest: "chest_inventory_front",
  trapped_chest: "trapped_chest_inventory_front",
  ender_chest: "ender_chest_inventory_front",
  oak_log: "oak_log_side",
  spruce_log: "spruce_log_side",
  birch_log: "birch_log_side",
  jungle_log: "jungle_log_side",
  acacia_log: "acacia_log_side",
  dark_oak_log: "dark_oak_log_side",
  cherry_log: "cherry_log_side",
  mangrove_log: "mangrove_log_side",
  pale_oak_log: "pale_oak_log_side",
  furnace: "furnace_front_off",
  blast_furnace: "blast_furnace_front_off",
  smoker: "smoker_front_off",
  dispenser: "dispenser_front_horizontal",
  dropper: "dropper_front_horizontal",
  observer: "observer_front",
  piston: "piston_top_normal",
  sticky_piston: "piston_top_sticky",
  bee_nest: "bee_nest_front",
  beehive: "beehive_front",
  stonecutter_block: "stonecutter2_side",
  stonecutter: "stonecutter2_side"
});
const SPECIAL_ITEM_PATHS = Object.freeze({
  milk_bucket: "textures/items/bucket_milk",
  water_bucket: "textures/items/bucket_water",
  lava_bucket: "textures/items/bucket_lava",
  powder_snow_bucket: "textures/items/bucket_powder_snow",
  cod_bucket: "textures/items/bucket_cod",
  salmon_bucket: "textures/items/bucket_salmon",
  tropical_fish_bucket: "textures/items/bucket_tropical",
  pufferfish_bucket: "textures/items/bucket_pufferfish",
  axolotl_bucket: "textures/items/bucket_axolotl",
  tadpole_bucket: "textures/items/bucket_tadpole",
  sulfur_cube_bucket: "textures/items/bucket_sulfur_cube",
  oak_boat: "textures/items/boat_oak",
  spruce_boat: "textures/items/boat_spruce",
  birch_boat: "textures/items/boat_birch",
  jungle_boat: "textures/items/boat_jungle",
  acacia_boat: "textures/items/boat_acacia",
  dark_oak_boat: "textures/items/boat_darkoak",
  white_bed: "textures/items/bed_white",
  orange_bed: "textures/items/bed_orange",
  magenta_bed: "textures/items/bed_magenta",
  light_blue_bed: "textures/items/bed_light_blue",
  yellow_bed: "textures/items/bed_yellow",
  lime_bed: "textures/items/bed_lime",
  pink_bed: "textures/items/bed_pink",
  gray_bed: "textures/items/bed_gray",
  light_gray_bed: "textures/items/bed_silver",
  cyan_bed: "textures/items/bed_cyan",
  purple_bed: "textures/items/bed_purple",
  blue_bed: "textures/items/bed_blue",
  brown_bed: "textures/items/bed_brown",
  green_bed: "textures/items/bed_green",
  red_bed: "textures/items/bed_red",
  black_bed: "textures/items/bed_black"
});
const RAW_FOOD_TEXTURES = Object.freeze({
  beef: "beef_raw",
  chicken: "chicken_raw",
  porkchop: "porkchop_raw",
  mutton: "mutton_raw",
  rabbit: "rabbit_raw",
  cod: "fish_raw",
  salmon: "fish_salmon_raw",
  tropical_fish: "fish_clownfish_raw",
  pufferfish: "fish_pufferfish_raw"
});
const COOKED_FOOD_TEXTURES = Object.freeze({
  cooked_beef: "beef_cooked",
  cooked_chicken: "chicken_cooked",
  cooked_porkchop: "porkchop_cooked",
  cooked_mutton: "mutton_cooked",
  cooked_rabbit: "rabbit_cooked",
  cooked_cod: "fish_cooked",
  cooked_salmon: "fish_salmon_cooked"
});

let itemPathSet;
let terrainPathSet;
let runtimeCache;

function splitIdentifier(typeId) {
  const index = String(typeId).indexOf(":");
  return index > 0 ? [typeId.slice(0, index), typeId.slice(index + 1)] : ["unknown", String(typeId)];
}

function titleCase(value) {
  return String(value ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.\/+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function ensurePathSets() {
  if (!itemPathSet) itemPathSet = new Set(VANILLA_ITEM_TEXTURE_PATHS);
  if (!terrainPathSet) terrainPathSet = new Set(VANILLA_TERRAIN_TEXTURE_PATHS);
}

function firstExistingPath(candidates, set) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && set.has(candidate)) return candidate;
  }
  return undefined;
}

function itemTextureCandidates(id) {
  const candidates = [];
  const push = value => {
    if (typeof value === "string" && value && !candidates.includes(value)) candidates.push(value);
  };
  push(`textures/items/${id}`);
  push(`textures/items/${id.replace(/^wooden_/, "wood_")}`);
  push(`textures/items/${id.replace(/^golden_/, "gold_")}`);
  push(`textures/items/${id.replace(/^cooked_(.+)$/, "$1_cooked")}`);
  push(`textures/items/${id.replace(/^raw_(.+)$/, "$1_raw")}`);
  if (id.endsWith("_spawn_egg")) {
    const entity = id.slice(0, -"_spawn_egg".length);
    push(`textures/items/spawn_eggs/spawn_egg_${entity}`);
  }
  if (id.endsWith("_dye")) {
    const color = id.slice(0, -4);
    const legacy = color === "light_gray" ? "silver" : color;
    push(`textures/items/dye_powder_${legacy}_new`);
    push(`textures/items/dye_powder_${legacy}`);
  }
  if (RAW_FOOD_TEXTURES[id]) push(`textures/items/${RAW_FOOD_TEXTURES[id]}`);
  if (COOKED_FOOD_TEXTURES[id]) push(`textures/items/${COOKED_FOOD_TEXTURES[id]}`);
  return candidates;
}

function blockTextureCandidates(id) {
  const candidates = [];
  const push = value => {
    if (typeof value === "string" && value && !candidates.includes(value)) candidates.push(value);
  };
  push(`textures/blocks/${id}`);
  push(`textures/blocks/${id.replace(/_block$/, "")}`);
  push(`textures/blocks/${id.replace(/^waxed_/, "")}`);
  push(`textures/blocks/${id.replace(/^smooth_/, "")}`);
  push(`textures/blocks/${id.replace(/_planks$/, "_planks")}`);
  return candidates;
}

export function resolveVanillaTexture(kind, typeId) {
  const [namespace, id] = splitIdentifier(typeId);
  if (namespace !== VANILLA_NAMESPACE) return undefined;
  ensurePathSets();

  if (kind === "entity") {
    const key = `${ENTITY_TEXTURE_PREFIX}${id}`;
    return VANILLA_ITEM_TEXTURE_KEYS[key] || firstExistingPath([
      `textures/items/spawn_eggs/${key}`,
      `textures/items/${key}`
    ], itemPathSet);
  }

  if (kind === "item") {
    const explicit = SPECIAL_ITEM_PATHS[id];
    if (explicit && itemPathSet.has(explicit)) return explicit;
    if (id.endsWith("_chest_boat")) {
      const wood = id.slice(0, -"_chest_boat".length);
      const chestBoat = `textures/items/${wood}_chest_boat`;
      if (itemPathSet.has(chestBoat)) return chestBoat;
    }
    const direct = firstExistingPath(itemTextureCandidates(id), itemPathSet);
    if (direct) return direct;
    const specialKey = SPECIAL_ITEM_KEYS[id];
    if (specialKey && VANILLA_ITEM_TEXTURE_KEYS[specialKey]) return VANILLA_ITEM_TEXTURE_KEYS[specialKey];
    if (VANILLA_ITEM_TEXTURE_KEYS[id]) return VANILLA_ITEM_TEXTURE_KEYS[id];
    try {
      if (BlockTypes.get(typeId)) return resolveVanillaTexture("block", typeId);
    } catch {
      // Some internal item identifiers cannot be queried as blocks.
    }
    return undefined;
  }

  if (kind === "block") {
    const direct = firstExistingPath(blockTextureCandidates(id), terrainPathSet);
    if (direct) return direct;
    const specialKey = SPECIAL_BLOCK_KEYS[id];
    if (specialKey && VANILLA_TERRAIN_TEXTURE_KEYS[specialKey]) return VANILLA_TERRAIN_TEXTURE_KEYS[specialKey];
    if (VANILLA_TERRAIN_TEXTURE_KEYS[id]) return VANILLA_TERRAIN_TEXTURE_KEYS[id];
    const suffixCandidates = [
      `${id}_top`, `${id}_side`, `${id}_front`, `${id}_front_off`, `${id}_inventory_front`
    ];
    for (const key of suffixCandidates) {
      if (VANILLA_TERRAIN_TEXTURE_KEYS[key]) return VANILLA_TERRAIN_TEXTURE_KEYS[key];
    }
  }
  return undefined;
}

function inferItemCategory(id, alsoBlock) {
  if (id.endsWith("_spawn_egg")) return "Spawn Eggs";
  if (/(apple|bread|stew|soup|beef|chicken|porkchop|mutton|rabbit|cod|salmon|fish|berry|carrot|potato|beetroot|melon|cookie|cake|honey_bottle|kelp|chorus_fruit|pumpkin_pie)/.test(id)) return "Food";
  if (/(sword|bow|crossbow|mace|trident|arrow|shield)/.test(id)) return "Combat";
  if (/(pickaxe|shovel|hoe|axe|shears|fishing_rod|flint_and_steel|brush|spyglass|compass|clock)/.test(id)) return "Tools";
  if (/(helmet|chestplate|leggings|boots|horse_armor|elytra|wolf_armor)/.test(id)) return "Armor";
  if (/(potion|bottle|brewing|blaze_powder|nether_wart|fermented_spider_eye|ghast_tear|magma_cream)/.test(id)) return "Brewing";
  if (/(boat|raft|minecart|saddle|carrot_on_a_stick|warped_fungus_on_a_stick)/.test(id)) return "Transportation";
  if (/(music_disc|record_)/.test(id)) return "Music";
  if (alsoBlock) return "Blocks";
  return "Items";
}

function inferBlockCategory(id) {
  if (/(ore|raw_.*_block)/.test(id)) return "Ores";
  if (/(log|wood|planks|leaves|sapling|stem|hyphae)/.test(id)) return "Wood";
  if (/(flower|grass|fern|mushroom|vine|roots|azalea|crop|wheat|carrots|potatoes|beetroot)/.test(id)) return "Nature";
  if (/(furnace|crafting_table|stonecutter|anvil|smithing_table|loom|cartography_table|grindstone|brewing_stand|smoker|blast_furnace)/.test(id)) return "Stations";
  if (/(door|trapdoor|fence|gate|wall|slab|stairs|button|pressure_plate)/.test(id)) return "Building";
  if (/(redstone|repeater|comparator|piston|observer|dispenser|dropper|hopper|lever|tripwire|target)/.test(id)) return "Redstone";
  return "Blocks";
}

function runtimeLocalizationKey(kind, typeId) {
  try {
    if (kind === "item") return ItemTypes.get(typeId)?.localizationKey;
    if (kind === "block") return BlockTypes.get(typeId)?.localizationKey;
  } catch {
    return undefined;
  }
  if (kind === "entity") return `entity.${splitIdentifier(typeId)[1]}.name`;
  return undefined;
}

export function buildVanillaRuntimeCatalog(installedRegistry) {
  if (runtimeCache) return runtimeCache;
  const items = [...installedRegistry.items].filter(id => id.startsWith("minecraft:")).sort();
  const blocks = [...installedRegistry.blocks].filter(id => id.startsWith("minecraft:")).sort();
  const entities = [...installedRegistry.entities].filter(id => id.startsWith("minecraft:")).sort();
  const biomes = [...installedRegistry.biomes].filter(id => id.startsWith("minecraft:")).sort();
  const structures = Object.keys(KNOWN_VANILLA_STRUCTURES).sort();
  runtimeCache = Object.freeze({
    item: Object.freeze(items),
    block: Object.freeze(blocks),
    entity: Object.freeze(entities),
    biome: Object.freeze(biomes),
    structure: Object.freeze(structures),
    sets: Object.freeze({
      item: new Set(items),
      block: new Set(blocks),
      entity: new Set(entities),
      biome: new Set(biomes),
      structure: new Set(structures)
    })
  });
  return runtimeCache;
}

export function isVanillaRuntimeEntry(kind, typeId, installedRegistry) {
  return Boolean(buildVanillaRuntimeCatalog(installedRegistry).sets[kind]?.has(typeId));
}

export function vanillaRuntimeEntryFields(kind, typeId, installedRegistry) {
  if (!isVanillaRuntimeEntry(kind, typeId, installedRegistry)) return undefined;
  const [, id] = splitIdentifier(typeId);
  const alsoBlock = kind === "item" && buildVanillaRuntimeCatalog(installedRegistry).sets.block.has(typeId);
  const structure = kind === "structure" ? KNOWN_VANILLA_STRUCTURES[typeId] : undefined;
  const category = kind === "item"
    ? inferItemCategory(id, alsoBlock)
    : kind === "block"
      ? inferBlockCategory(id)
      : kind === "biome"
        ? "Biomes"
        : kind === "structure"
          ? "Structures"
          : "Entities";
  const dimension = kind === "biome"
    ? (/(nether|hell|crimson|warped|basalt|soul.?sand)/.test(id)
        ? "minecraft:nether"
        : /(^the_end$|end_|small_end_islands|midlands|highlands|barrens)/.test(id)
          ? "minecraft:the_end"
          : "minecraft:overworld")
    : structure?.dim;
  const localizationKey = runtimeLocalizationKey(kind, typeId);
  const aliases = [
    ...(VANILLA_WORLD_ALIASES[typeId] || []),
    ...vanillaSpanishAliases(kind, typeId, localizationKey)
  ];
  return Object.freeze({
    f: true,
    n: kind === "biome" && KNOWN_VANILLA_BIOMES.has(id)
      ? `wati.world.biome.minecraft.${id}`
      : structure?.n,
    d: structure?.d ?? titleCase(id),
    x: structure?.d ?? titleCase(id),
    o: false,
    al: aliases.length ? [...new Set(aliases)] : undefined,
    cat: category,
    grp: kind === "biome" || kind === "structure" ? "World Generation" : "Minecraft Vanilla",
    s: localizationKey,
    itk: undefined,
    itp: resolveVanillaTexture(kind, typeId),
    dh: kind === "item"
      ? ["inventory"]
      : kind === "block"
        ? ["observe", "break", "obtain"]
        : kind === "biome"
          ? ["visit"]
          : kind === "structure"
            ? ["visit"]
            : ["observe", "interact"],
    dim: dimension,
    det: kind === "biome" ? "runtime_biome" : kind === "structure" ? "generated_structure" : undefined,
    sn: kind === "biome"
      ? "wati.world.summary.biome"
      : kind === "structure"
        ? "wati.world.summary.structure.vanilla"
        : undefined,
    summary: undefined
  });
}

export function vanillaRuntimeCounts(installedRegistry) {
  const catalog = buildVanillaRuntimeCatalog(installedRegistry);
  return Object.freeze({ item: catalog.item.length, block: catalog.block.length, entity: catalog.entity.length, biome: catalog.biome.length, structure: catalog.structure.length });
}
