import { STATIC_FACT_OVERRIDES } from "./static_fact_overrides.js";
import { bobEntityEnchantmentFacts } from "./bob_entity_enchantment_facts.js";

// WATI Lens Knowledge Facts v1 — compact static facts reusable by Lens and other consumers.
// Exact values should come from source definitions/curation. Identifier-derived values are
// explicitly marked inferred so consumers can decide whether to display or trust them.

export const LENS_FACTS_SCHEMA_VERSION = 1;

// Vanilla wearable protection values already used by the proven WAILA-compatible Lens path.
// Copper/body armor is deliberately not assigned a protection value here unless a source
// definition provides one in a future catalog build; classification can still be inferred.
export const EXACT_ARMOR_PROTECTION = Object.freeze({
  "minecraft:turtle_helmet": 2,
  "minecraft:leather_helmet": 1,
  "minecraft:leather_chestplate": 3,
  "minecraft:leather_leggings": 2,
  "minecraft:leather_boots": 1,
  "minecraft:golden_helmet": 2,
  "minecraft:golden_chestplate": 5,
  "minecraft:golden_leggings": 3,
  "minecraft:golden_boots": 1,
  "minecraft:chainmail_helmet": 2,
  "minecraft:chainmail_chestplate": 5,
  "minecraft:chainmail_leggings": 4,
  "minecraft:chainmail_boots": 1,
  "minecraft:iron_helmet": 2,
  "minecraft:iron_chestplate": 6,
  "minecraft:iron_leggings": 5,
  "minecraft:iron_boots": 2,
  "minecraft:diamond_helmet": 3,
  "minecraft:diamond_chestplate": 8,
  "minecraft:diamond_leggings": 6,
  "minecraft:diamond_boots": 3,
  "minecraft:netherite_helmet": 3,
  "minecraft:netherite_chestplate": 8,
  "minecraft:netherite_leggings": 6,
  "minecraft:netherite_boots": 3
});

const MATERIALS = Object.freeze([
  ["netherite", "netherite"], ["diamond", "diamond"], ["iron", "iron"],
  ["chainmail", "chainmail"], ["copper", "copper"], ["golden", "gold"],
  ["gold", "gold"], ["stone", "stone"], ["wooden", "wood"], ["wood", "wood"],
  ["leather", "leather"]
]);

function identifier(typeId) {
  const raw = String(typeId || "");
  const separator = raw.indexOf(":");
  return separator >= 0 ? raw.slice(separator + 1) : raw;
}

function inferMaterial(id) {
  for (const [token, material] of MATERIALS) {
    if (id === token || id.startsWith(`${token}_`) || id.includes(`_${token}_`)) return material;
  }
  return undefined;
}

function inferEquipmentSlot(id) {
  if (id.endsWith("_helmet") || id === "turtle_helmet") return "head";
  if (id.endsWith("_chestplate")) return "chest";
  if (id.endsWith("_leggings")) return "legs";
  if (id.endsWith("_boots")) return "feet";
  if (id.endsWith("_horse_armor") || id.endsWith("_nautilus_armor") || id === "wolf_armor" || id === "wolf_armor_dyed") return "body";
  return undefined;
}

function inferTool(id) {
  const suffixes = [
    ["_pickaxe", "pickaxe"], ["_shovel", "shovel"], ["_hoe", "hoe"],
    ["_sword", "sword"], ["_spear", "spear"], ["_axe", "axe"]
  ];
  if (id === "shears") return { kind: "shears" };
  for (const [suffix, kind] of suffixes) if (id.endsWith(suffix)) return { kind };
  return undefined;
}

function toolTier(material) {
  if (!material) return undefined;
  if (material === "netherite") return { tier: "netherite", harvestTier: "diamond", level: 3 };
  if (material === "diamond") return { tier: "diamond", harvestTier: "diamond", level: 3 };
  if (material === "iron") return { tier: "iron", harvestTier: "iron", level: 2 };
  if (material === "copper") return { tier: "copper", harvestTier: "stone", level: 1 };
  if (material === "stone") return { tier: "stone", harvestTier: "stone", level: 1 };
  if (material === "gold") return { tier: "gold", harvestTier: "wood", level: 0 };
  if (material === "wood") return { tier: "wood", harvestTier: "wood", level: 0 };
  return undefined;
}

function freezeDeepish(value) {
  if (!value || typeof value !== "object") return value;
  for (const child of Object.values(value)) if (child && typeof child === "object") Object.freeze(child);
  return Object.freeze(value);
}

export function buildStaticFacts(kind, typeId, entry = undefined) {
  const id = identifier(typeId);
  const material = inferMaterial(id);
  const facts = {};
  const sources = {};
  let confidence = 0;

  if (kind === "item" || kind === "block") {
    const slot = inferEquipmentSlot(id);
    const exactProtection = EXACT_ARMOR_PROTECTION[typeId];
    if (slot || typeof exactProtection === "number") {
      facts.equipment = {
        ...(slot ? { slot } : {}),
        ...(material ? { material } : {}),
        ...(typeof exactProtection === "number" ? { armorPoints: exactProtection } : {})
      };
      sources.equipment = typeof exactProtection === "number" ? "wati_core_curated" : "identifier_inference";
      confidence = Math.max(confidence, typeof exactProtection === "number" ? 3 : 1);
    }

    const inferredTool = inferTool(id);
    if (inferredTool) {
      const tier = toolTier(material);
      facts.tool = { ...inferredTool, ...(material ? { material } : {}), ...(tier || {}) };
      sources.tool = "identifier_inference";
      confidence = Math.max(confidence, 1);
    }
  }

  // Preserve useful catalog classification without inventing exact numeric properties.
  if (entry?.cat || entry?.grp) {
    facts.catalog = { ...(entry.cat ? { category: entry.cat } : {}), ...(entry.grp ? { group: entry.grp } : {}) };
    sources.catalog = "wati_catalog";
    confidence = Math.max(confidence, 2);
  }

  const bobEntityEnchantments = bobEntityEnchantmentFacts(kind, typeId);
  if (bobEntityEnchantments) {
    facts.entityEnchantments = bobEntityEnchantments;
    sources.entityEnchantments = "better_on_bedrock_world_definition";
    confidence = Math.max(confidence, 3);
  }

  const exact = STATIC_FACT_OVERRIDES[typeId];
  if (exact) {
    for (const key of ["equipment", "tool", "food", "entityEnchantments"]) {
      if (!exact[key]) continue;
      facts[key] = { ...(facts[key] || {}), ...exact[key] };
    }
    Object.assign(sources, exact.sources || {});
    confidence = Math.max(confidence, Number(exact.confidence) || 3);
  }

  if (Object.keys(facts).length === 0) return undefined;
  return freezeDeepish({ schema: LENS_FACTS_SCHEMA_VERSION, confidence, sources: Object.freeze(sources), ...facts });
}
