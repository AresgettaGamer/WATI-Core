import assert from "node:assert/strict";
import {
  PROVIDER_CONTENT,
  PROVIDER_NAMESPACE_SOURCES,
  PROVIDER_SOURCES,
  handleProviderRequest,
  isRuntimeProvider,
  resetRuntimeProvidersForTests,
  runtimeProviderStats
} from "../scripts/provider_runtime.js";

resetRuntimeProvidersForTests();

const envelope = { v: 1, c: "personalized_sounds", r: "1" };
const source = {
  name: "Personalized Sounds!",
  version: "0.1.1",
  namespaces: ["personalized_sounds"],
  aliases: ["psounds"],
  packUuid: "b1addb9f-0160-491a-b0a4-73a05ab9a36d",
  minEngineVersion: [1, 26, 30]
};

let response = handleProviderRequest("wati:provider_begin", { ...envelope, source });
assert.equal(response.ok, true);

response = handleProviderRequest("wati:provider_chunk", {
  ...envelope,
  r: "2",
  entries: [
    {
      kind: "item",
      id: "personalized_sounds:test_record",
      fallbackName: "Test Record",
      localizationKey: "item.personalized_sounds:test_record.name",
      category: "Music Disc"
    }
  ]
});
assert.equal(response.ok, true);
assert.equal(response.total, 1);

response = handleProviderRequest("wati:provider_commit", { ...envelope, r: "3" });
assert.equal(response.ok, true);
assert.equal(response.entries, 1);
assert.equal(isRuntimeProvider("personalized_sounds"), true);
assert.equal(PROVIDER_SOURCES.personalized_sounds.name, "Personalized Sounds!");
assert.equal(PROVIDER_NAMESPACE_SOURCES.personalized_sounds, "personalized_sounds");
assert.equal(PROVIDER_CONTENT.item["personalized_sounds:test_record"].d, "Test Record");
assert.deepEqual(runtimeProviderStats(), {
  protocol: 1,
  providers: 1,
  entries: 1,
  openTransactions: 0,
  revision: 1
});

response = handleProviderRequest(
  "wati:provider_begin",
  {
    v: 1,
    c: "intruder",
    r: "4",
    source: { ...source, name: "Intruder", namespaces: ["personalized_sounds"] }
  }
);
assert.equal(response.ok, false);
assert.equal(response.code, "namespace_conflict");

response = handleProviderRequest("wati:provider_begin", {
  v: 1,
  c: "reserved",
  r: "5",
  source: { ...source, name: "Reserved", namespaces: ["minecraft"] }
});
assert.equal(response.ok, false);
assert.equal(response.code, "invalid_source");

// Long provider hints used by Critters are valid since v2.8.1.
resetRuntimeProvidersForTests();
const crittersEnvelope = { v: 1, c: "critters_companions", r: "cb", t: "tx1" };
response = handleProviderRequest("wati:provider_begin", {
  ...crittersEnvelope,
  source: {
    name: "Critters and Companions",
    version: "0.4.2",
    namespaces: ["critters_companions"],
    aliases: ["critters"],
    packUuid: "acddae64-00f4-42fe-95d9-38ecaa4b44cf",
    minEngineVersion: [1, 26, 30]
  }
});
assert.equal(response.ok, true);
response = handleProviderRequest("wati:provider_chunk", {
  ...crittersEnvelope,
  r: "cd",
  entries: [{
    kind: "entity",
    id: "critters_companions:ferret",
    fallbackName: "Hurón",
    descriptionHints: ["x".repeat(241)]
  }]
});
assert.equal(response.ok, true);
response = handleProviderRequest("wati:provider_commit", { ...crittersEnvelope, r: "cc" });
assert.equal(response.ok, true);
assert.equal(response.entries, 1);

// Invalid entries expose the exact field and abort the whole transaction.
resetRuntimeProvidersForTests();
response = handleProviderRequest("wati:provider_begin", { ...envelope, r: "ab", t: "tx2", source });
assert.equal(response.ok, true);
response = handleProviderRequest("wati:provider_chunk", {
  ...envelope,
  r: "ad",
  t: "tx2",
  entries: [{
    kind: "item",
    id: "personalized_sounds:bad",
    descriptionHints: ["x".repeat(321)]
  }]
});
assert.equal(response.ok, false);
assert.equal(response.code, "invalid_entry");
assert.equal(response.entryId, "personalized_sounds:bad");
assert.equal(response.field, "descriptionHints");
assert.equal(response.fieldIndex, 0);
assert.equal(response.reason, "too_long");
assert.equal(response.maximum, 320);
response = handleProviderRequest("wati:provider_commit", { ...envelope, r: "ac", t: "tx2" });
assert.equal(response.ok, false);
assert.equal(response.code, "transaction_aborted");
assert.equal(isRuntimeProvider("personalized_sounds"), false);

// A second transaction cannot overwrite the first one.
resetRuntimeProvidersForTests();
response = handleProviderRequest("wati:provider_begin", { ...envelope, r: "db1", t: "one", source });
assert.equal(response.ok, true);
response = handleProviderRequest("wati:provider_begin", { ...envelope, r: "db2", t: "two", source });
assert.equal(response.ok, false);
assert.equal(response.code, "transaction_in_progress");
response = handleProviderRequest("wati:provider_chunk", { ...envelope, r: "dd", t: "two", entries: [{ kind: "item", id: "personalized_sounds:test" }] });
assert.equal(response.ok, false);
assert.equal(response.code, "transaction_mismatch");

console.log("WATI Runtime Provider Protocol v1: tests passed");
