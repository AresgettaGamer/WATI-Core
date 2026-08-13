import assert from "node:assert/strict";
import { emitScriptEvent, sentEvents } from "./minecraft-server-stub.mjs";

await import("../scripts/main.js");

function emit(id, payload) {
  emitScriptEvent(id, JSON.stringify(payload));
}

function latest(id, requestId) {
  const event = [...sentEvents].reverse().find(candidate => {
    if (candidate.id !== id) return false;
    const message = JSON.parse(candidate.message);
    return requestId === undefined || message.r === requestId;
  });
  return event ? JSON.parse(event.message) : undefined;
}

const source = {
  name: "Personalized Sounds!",
  version: "0.1.1",
  namespaces: ["personalized_sounds"],
  aliases: ["psounds"],
  packUuid: "b1addb9f-0160-491a-b0a4-73a05ab9a36d",
  minEngineVersion: [1, 26, 30]
};

emit("wati:provider_begin", { v: 1, c: "personalized_sounds", r: "b1", source });
emit("wati:provider_chunk", {
  v: 1,
  c: "personalized_sounds",
  r: "d1",
  entries: [
    {
      kind: "item",
      id: "personalized_sounds:test_record",
      fallbackName: "Test Record",
      localizationKey: "item.personalized_sounds:test_record.name",
      aliases: ["record", "disco"],
      category: "Music Disc"
    }
  ]
});
emit("wati:provider_commit", { v: 1, c: "personalized_sounds", r: "c1" });

const commit = latest("wati:provider_result", "c1");
assert.equal(commit.ok, true);
assert.equal(commit.entries, 1);

emit("wati:entry", {
  v: 3,
  c: "integration_test",
  r: "entry1",
  k: "item",
  i: "personalized_sounds:test_record"
});
const entry = latest("wati:entry_result", "entry1");
assert.equal(entry.f, true);
assert.equal(entry.d, "Test Record");
assert.equal(entry.s, "item.personalized_sounds:test_record.name");
assert.equal(entry.sid, "personalized_sounds");
assert.equal(entry.a, "Personalized Sounds!");

emit("wati:sources", {
  v: 3,
  c: "integration_test",
  r: "sources1",
  q: "personalized",
  p: 0,
  z: 12
});
const sources = latest("wati:sources_result", "sources1");
assert.equal(sources.total, 1);
assert.equal(sources.items[0].id, "personalized_sounds");
assert.equal(sources.items[0].present, true);
assert.equal(sources.items[0].detection.mode, "provider");

emit("wati:search", {
  v: 3,
  c: "integration_test",
  r: "search1",
  q: "disco",
  p: 0,
  z: 12
});
const search = latest("wati:search_result", "search1");
assert.equal(search.total, 1);
assert.equal(search.items[0].i, "personalized_sounds:test_record");

emit("wati:knowledge", { v: 3, c: "integration_test", r: "knowledge_armor", k: "item", i: "minecraft:diamond_chestplate" });
const armorKnowledge = latest("wati:knowledge_result", "knowledge_armor");
assert.equal(armorKnowledge.schema, 2);
assert.equal(armorKnowledge.factsSchema, 1);
assert.equal(armorKnowledge.facts.equipment.slot, "chest");
assert.equal(armorKnowledge.facts.equipment.armorPoints, 8);


// Alex's Mobs is no longer a static WATI source. Its Runtime Provider can own
// alexs_mobs. Presentation-only aliases moved to the add-on's Lens Provider in Core v3.1.0.
const alexSource = {
  name: "Alex's Mobs — Bedrock Rebuild",
  version: "1.0.0",
  namespaces: ["alexs_mobs"],
  aliases: ["alexsmobs"],
  packUuid: "5dd6eb4e-8bb5-4580-b719-f4c65c14a12c",
  minEngineVersion: [1, 26, 30]
};
emit("wati:provider_begin", { v: 1, c: "alexs_mobs_bedrock", r: "ab1", t: "atx", source: alexSource });
emit("wati:provider_chunk", {
  v: 1, c: "alexs_mobs_bedrock", r: "ad1", t: "atx",
  entries: [{ kind: "entity", id: "alexs_mobs:anaconda", fallbackName: "Anaconda", localizationKey: "entity.alexs_mobs:anaconda.name" }]
});
emit("wati:provider_commit", { v: 1, c: "alexs_mobs_bedrock", r: "ac1", t: "atx" });
const alexCommit = latest("wati:provider_result", "ac1");
assert.equal(alexCommit.ok, true);

emit("wati:lookup", { v: 1, c: "integration_test", r: "hidden_anaconda", k: "entity", i: "alexs_mobs:anaconda_part" });
const hiddenAnaconda = latest("wati:result", "hidden_anaconda");
assert.equal(hiddenAnaconda.f, false);
assert.equal(hiddenAnaconda.n, undefined);
assert.equal(hiddenAnaconda.d, "Anaconda Part");
assert.equal(hiddenAnaconda.sid, "alexs_mobs_bedrock");
assert.equal(hiddenAnaconda.a, "Alex's Mobs — Bedrock Rebuild");

emit("wati:lookup", { v: 1, c: "integration_test", r: "hidden_egg", k: "block", i: "alexs_mobs:terrapin_egg_block_4" });
const hiddenEgg = latest("wati:result", "hidden_egg");
assert.equal(hiddenEgg.f, false);
assert.equal(hiddenEgg.n, undefined);
assert.equal(hiddenEgg.d, "Terrapin Egg Block 4");

emit("wati:search", { v: 3, c: "integration_test", r: "hidden_search", q: "anaconda part", p: 0, z: 12 });
const hiddenSearch = latest("wati:search_result", "hidden_search");
assert.equal(hiddenSearch.total, 0);

console.log("WATI Core main/provider integration: tests passed");
