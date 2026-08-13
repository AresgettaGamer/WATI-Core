import assert from "node:assert/strict";
import { buildKnowledgeProfile, knowledgeStats } from "../scripts/knowledge_runtime.js";

const resolveKind = typeId => typeId.includes("wild_onions") ? "block" : "item";

const zombie = buildKnowledgeProfile("entity", "minecraft:zombie", { entry: {}, relatedKinds: [], resolveKind });
assert.equal(zombie.schema, 2);
assert.ok(zombie.drops.some(row => row.id === "minecraft:rotten_flesh"));
assert.ok(zombie.drops.some(row => row.id === "minecraft:iron_ingot" && row.rarity === "rare"));
assert.ok(!zombie.drops.some(row => row.id === "minecraft:copper_ingot"));

const drowned = buildKnowledgeProfile("entity", "minecraft:drowned", { entry: {}, relatedKinds: [], resolveKind });
assert.ok(drowned.drops.some(row => row.id === "minecraft:copper_ingot"));

const onionPlant = buildKnowledgeProfile("block", "farmersdelight:wild_onions", { entry: {}, relatedKinds: [], resolveKind });
assert.ok(onionPlant.drops.some(row => row.id === "farmersdelight:onion"));

const copperGolem = buildKnowledgeProfile("entity", "minecraft:copper_golem", { entry: {}, relatedKinds: [], resolveKind });
assert.equal(copperGolem.summaryKey, "wati.knowledge.summary.minecraft.copper_golem");
assert.equal(copperGolem.construction.result.id, "minecraft:copper_golem");
assert.ok(copperGolem.relations.some(row => row.id === "minecraft:copper_chest"));
assert.deepEqual(copperGolem.drops.find(row => row.id === "minecraft:copper_ingot")?.quantity, { min: 1, max: 3 });

const plains = buildKnowledgeProfile("biome", "minecraft:plains", { entry: {}, relatedKinds: [], resolveKind });
assert.ok(plains.contents.some(row => row.id === "minecraft:village"));
assert.ok(plains.contents.some(row => row.id === "better_on_bedrock:wild_carrot"));

const generic = buildKnowledgeProfile("item", "example:magic_axe", { entry: { cat: "Equipment", grp: "Tools" }, relatedKinds: [], resolveKind });
assert.ok(generic.roles.includes("tool"));
assert.equal(generic.generated, true);


const diamondChest = buildKnowledgeProfile("item", "minecraft:diamond_chestplate", { entry: { cat: "Equipment", grp: "Armor" }, relatedKinds: [], resolveKind });
assert.equal(diamondChest.factsSchema, 1);
assert.equal(diamondChest.facts.equipment.slot, "chest");
assert.equal(diamondChest.facts.equipment.armorPoints, 8);
assert.equal(diamondChest.facts.equipment.material, "diamond");

const inferredPickaxe = buildKnowledgeProfile("item", "example:mythril_pickaxe", { entry: { cat: "Equipment", grp: "Tools" }, relatedKinds: [], resolveKind });
assert.equal(inferredPickaxe.facts.tool.kind, "pickaxe");

const copperHelmet = buildKnowledgeProfile("item", "minecraft:copper_helmet", { entry: { cat: "Equipment", grp: "Armor" }, relatedKinds: [], resolveKind });
assert.equal(copperHelmet.facts.equipment.slot, "head");
assert.equal(copperHelmet.facts.equipment.material, "copper");
assert.equal(copperHelmet.facts.equipment.armorPoints, undefined);

const stats = knowledgeStats();
assert.equal(stats.schema, 2);
assert.equal(stats.factsSchema, 1);
assert.ok(stats.curatedProfiles >= 20);
assert.ok(stats.indexedDropEntities > 0);

console.log("WATI Knowledge Schema 2 runtime: tests passed");
