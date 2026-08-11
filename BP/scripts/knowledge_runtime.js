import { ACQUISITION_DATA } from "./acquisition_data.js";
import { WORLD_CONTENT } from "./world_content_data.js";
import {
  CURATED_KNOWLEDGE,
  KNOWLEDGE_SCHEMA_VERSION,
  VANILLA_BIOME_CONTENTS,
  VANILLA_ENTITY_DROPS,
  VANILLA_ENTITY_HABITATS
} from "./knowledge_data.js";

const BLOCK_DROP_METHODS = new Set(["mining", "break_block", "harvest", "natural_harvest", "cultivation"]);
const WORLD_METHODS = new Set(["natural_generation", "mining", "harvest", "natural_harvest", "cultivation"]);
const TECHNICAL_BIOME_TOKENS = new Set(["overworld", "overworld_generation", "nether", "the_end", "end", "worldgen", "generation"]);

let reverseIndexes;

function splitIdentifier(typeId) {
  const value = String(typeId || "");
  const separator = value.indexOf(":");
  return separator > 0 ? [value.slice(0, separator), value.slice(separator + 1)] : ["unknown", value];
}

function cleanToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^minecraft:/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function quantityFromExtra(extra) {
  const value = extra?.count ?? extra?.quantity;
  if (Array.isArray(value)) return { min: Number(value[0]) || 0, max: Number(value[1]) || Number(value[0]) || 0 };
  if (Number.isFinite(value)) return { min: Number(value), max: Number(value) };
  if (value && typeof value === "object") {
    const min = Number(value.min ?? value.max);
    const max = Number(value.max ?? value.min);
    if (Number.isFinite(min) || Number.isFinite(max)) return { min: Number.isFinite(min) ? min : max, max: Number.isFinite(max) ? max : min };
  }
  return undefined;
}

function dynamicRarity(method, extra, confidence) {
  if (typeof extra?.chance === "number") {
    if (extra.chance >= 0.99) return "guaranteed";
    if (extra.chance >= 0.25) return "common";
    if (extra.chance >= 0.05) return "uncommon";
    return "rare";
  }
  if (extra?.condition) return confidence >= 2 ? "conditional" : "inferred";
  if (method === "entity_drop" || BLOCK_DROP_METHODS.has(method)) return confidence >= 2 ? "common" : "inferred";
  return "unknown";
}

function ensureReverseIndexes() {
  if (reverseIndexes) return reverseIndexes;
  const byEntity = new Map();
  const byBlock = new Map();
  const byBiomeToken = new Map();
  const methodCounts = new Map();
  for (const [targetId, rows] of Object.entries(ACQUISITION_DATA)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const [method, sourceKind, sourceId, confidence = 1, extra = {}] = row;
      methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
      const descriptor = Object.freeze({
        id: targetId,
        method,
        sourceKind,
        sourceId,
        confidence,
        quantity: quantityFromExtra(extra),
        rarity: dynamicRarity(method, extra, confidence),
        condition: typeof extra?.condition === "string" ? extra.condition : undefined,
        extra
      });
      if (method === "entity_drop" && sourceKind === "entity" && typeof sourceId === "string") {
        const list = byEntity.get(sourceId) || [];
        list.push(descriptor);
        byEntity.set(sourceId, list);
      }
      if (BLOCK_DROP_METHODS.has(method) && sourceKind === "block" && typeof sourceId === "string") {
        const list = byBlock.get(sourceId) || [];
        list.push(descriptor);
        byBlock.set(sourceId, list);
      }
      if (WORLD_METHODS.has(method) && Array.isArray(extra?.biomes)) {
        for (const rawBiome of extra.biomes) {
          const token = cleanToken(rawBiome);
          if (!token || TECHNICAL_BIOME_TOKENS.has(token)) continue;
          const list = byBiomeToken.get(token) || [];
          list.push(descriptor);
          byBiomeToken.set(token, list);
        }
      }
    }
  }
  reverseIndexes = Object.freeze({ byEntity, byBlock, byBiomeToken, methodCounts });
  return reverseIndexes;
}

function inferRoles(kind, typeId, entry) {
  const id = cleanToken(splitIdentifier(typeId)[1]);
  const category = cleanToken(`${entry?.cat || ""}_${entry?.grp || ""}`);
  const roles = new Set();
  if (kind === "item") roles.add("item");
  if (kind === "block") roles.add("placeable_block");
  if (kind === "entity") roles.add("entity");
  if (kind === "biome") roles.add("biome");
  if (kind === "ecosystem") roles.add("ecosystem");
  if (kind === "structure") roles.add("structure");
  if (/(sword|mace|bow|crossbow|trident|spear)/.test(id)) roles.add("weapon");
  if (/(pickaxe|axe|shovel|hoe|shears|fishing_rod|brush)/.test(id)) roles.add("tool");
  if (/(helmet|chestplate|leggings|boots|horse_armor)/.test(id)) roles.add("armor");
  if (/(food|meal|dish|soup|stew|pie|cake|bread|cookie|apple|berry|berries|meat|beef|pork|chicken|mutton|rabbit|fish|salmon|cod|carrot|potato|onion|cabbage|tomato|rice|drink|juice|tea|coffee)/.test(`${id}_${category}`)) roles.add("food");
  if (/(seed|seeds|sapling|crop|bush|plant|flower)/.test(id)) roles.add("cultivation");
  if (/(chest|barrel|crate|cabinet|drawer|shulker_box|backpack)/.test(id)) roles.add("storage");
  if (/(furnace|table|station|pot|stove|cutter|anvil|brewing|crafter)/.test(id)) roles.add("crafting_station");
  if (/(button|lever|repeater|comparator|observer|piston|redstone|sensor|bulb)/.test(id)) roles.add("redstone");
  if (/(ore|ingot|nugget|gem|crystal|dust|scrap|shard|fragment|hide|leather|fiber)/.test(id)) roles.add("material");
  if (/(door|trapdoor|fence|wall|stairs|slab|brick|planks|log|wood|stone|glass|pane|tile|roof|frame)/.test(id)) roles.add("building");
  if (/(boat|minecart|saddle|glider)/.test(id)) roles.add("transport");
  if (/(spawn_egg)/.test(id)) roles.add("spawn_item");
  if (/(boss)/.test(category)) roles.add("boss");
  return [...roles].slice(0, 12);
}

function mergeByKey(primary, secondary, keyBuilder) {
  const result = [];
  const seen = new Set();
  for (const value of [...(primary || []), ...(secondary || [])]) {
    const key = keyBuilder(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function dynamicDropRows(kind, typeId, resolveKind) {
  const indexes = ensureReverseIndexes();
  const rows = kind === "entity" ? indexes.byEntity.get(typeId) : kind === "block" ? indexes.byBlock.get(typeId) : undefined;
  if (!rows) return [];
  return rows.map(row => ({
    kind: resolveKind?.(row.id) || "item",
    id: row.id,
    method: row.method,
    rarity: row.rarity,
    quantity: row.quantity,
    condition: row.condition,
    confidence: row.confidence,
    source: "catalog_acquisition"
  }));
}

function biomeContents(typeId, resolveKind) {
  const explicit = VANILLA_BIOME_CONTENTS[typeId] || [];
  const [, identifier] = splitIdentifier(typeId);
  const token = cleanToken(identifier);
  const indexes = ensureReverseIndexes();
  const dynamic = [];
  const candidateTokens = new Set([token]);
  for (const part of token.split("_")) if (part.length > 3) candidateTokens.add(part);
  for (const candidate of candidateTokens) {
    for (const row of indexes.byBiomeToken.get(candidate) || []) {
      dynamic.push({
        kind: resolveKind?.(row.id) || "item",
        id: row.id,
        relation: row.method === "mining" ? "mineable" : row.method === "natural_generation" ? "naturally_generated" : "obtainable",
        confidence: Math.min(2, row.confidence || 1),
        source: "catalog_acquisition"
      });
    }
  }
  return mergeByKey(explicit, dynamic, value => `${value.kind}:${value.id}:${value.relation}`).slice(0, 32);
}

function ecosystemContents(typeId, resolveKind) {
  const entry = WORLD_CONTENT.content?.ecosystem?.[typeId];
  if (!entry || !Array.isArray(entry.sg)) return [];
  return entry.sg.slice(0, 24).map(signature => ({
    kind: resolveKind?.(signature) || "block",
    id: signature,
    relation: "signature",
    confidence: entry.confidence || 2,
    source: "ecosystem_signature"
  }));
}

function relatedSameIdentifier(typeId, relatedKinds) {
  return (relatedKinds || []).map(kind => ({ kind, id: typeId, relation: "same_identifier", confidence: 3 }));
}

function genericSummaryCode(kind, roles, acquisitionCount, dropCount, contentCount) {
  if (kind === "entity") return dropCount ? "entity_with_drops" : "entity";
  if (kind === "biome") return contentCount ? "biome_with_contents" : "biome";
  if (kind === "ecosystem") return contentCount ? "ecosystem_with_contents" : "ecosystem";
  if (kind === "structure") return "structure";
  if (roles.includes("food")) return "food";
  if (roles.includes("storage")) return "storage";
  if (roles.includes("weapon")) return "weapon";
  if (roles.includes("tool")) return "tool";
  if (roles.includes("armor")) return "armor";
  if (roles.includes("crafting_station")) return "crafting_station";
  if (roles.includes("material")) return acquisitionCount ? "material_with_sources" : "material";
  if (kind === "block") return "block";
  return acquisitionCount ? "item_with_sources" : "item";
}

export function buildKnowledgeProfile(kind, typeId, options = {}) {
  const curated = CURATED_KNOWLEDGE[typeId] || {};
  const roles = mergeByKey(curated.roles, inferRoles(kind, typeId, options.entry), value => value);
  const acquisition = Array.isArray(ACQUISITION_DATA[typeId]) ? ACQUISITION_DATA[typeId].slice(0, 24) : [];
  const dynamicDrops = dynamicDropRows(kind, typeId, options.resolveKind);
  const explicitDrops = kind === "entity" ? (VANILLA_ENTITY_DROPS[typeId] || []) : [];
  const drops = mergeByKey(explicitDrops, dynamicDrops, value => `${value.kind || "item"}:${value.id}:${value.condition || ""}`).slice(0, 32);
  const habitats = mergeByKey(curated.habitats, kind === "entity" ? (VANILLA_ENTITY_HABITATS[typeId] || []) : [], value => `${value.biome}:${value.relation || ""}`).slice(0, 24);
  const contents = kind === "biome"
    ? biomeContents(typeId, options.resolveKind)
    : kind === "ecosystem"
      ? ecosystemContents(typeId, options.resolveKind)
      : Array.isArray(curated.contents) ? curated.contents : [];
  const relations = mergeByKey(curated.relations, relatedSameIdentifier(typeId, options.relatedKinds), value => `${value.kind}:${value.id}:${value.relation}`).slice(0, 24);
  const summaryCode = genericSummaryCode(kind, roles, acquisition.length, drops.length, contents.length);
  return Object.freeze({
    schema: KNOWLEDGE_SCHEMA_VERSION,
    kind,
    id: typeId,
    summaryKey: curated.summaryKey,
    summaryCode,
    roles,
    acquisitionCount: Array.isArray(ACQUISITION_DATA[typeId]) ? ACQUISITION_DATA[typeId].length : 0,
    drops,
    habitats,
    contents,
    relations,
    construction: curated.construction,
    confidence: curated.summaryKey ? 3 : (acquisition.length || drops.length || contents.length ? 2 : 1),
    generated: !curated.summaryKey
  });
}

export function knowledgeStats() {
  const indexes = ensureReverseIndexes();
  return Object.freeze({
    schema: KNOWLEDGE_SCHEMA_VERSION,
    curatedProfiles: Object.keys(CURATED_KNOWLEDGE).length,
    vanillaEntityDropProfiles: Object.keys(VANILLA_ENTITY_DROPS).length,
    vanillaEntityHabitatProfiles: Object.keys(VANILLA_ENTITY_HABITATS).length,
    vanillaBiomeProfiles: Object.keys(VANILLA_BIOME_CONTENTS).length,
    acquisitionTargets: Object.keys(ACQUISITION_DATA).length,
    indexedDropEntities: indexes.byEntity.size,
    indexedDropBlocks: indexes.byBlock.size,
    indexedBiomeTokens: indexes.byBiomeToken.size
  });
}
