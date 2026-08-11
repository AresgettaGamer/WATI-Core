import assert from "node:assert/strict";
import { emitScriptEvent, flushJobs, queuedJobCount, sentEvents, setDeferredJobs } from "./minecraft-server-stub.mjs";

await import("../scripts/main.js");
const { createWatiProvider } = await import("../SDK/wati_provider.js");

const provider = createWatiProvider({
  id: "sdk_example",
  source: {
    name: "SDK Example",
    version: "1.0.0",
    namespaces: ["sdk_example"],
    aliases: ["sdk"]
  },
  entries: [
    {
      kind: "item",
      id: "sdk_example:sample",
      fallbackName: "SDK Sample",
      aliases: ["ejemplo"]
    }
  ]
});

assert.equal(provider.isAccepted(), true);
assert.equal(provider.lastResult()?.code, "registered");

emitScriptEvent("wati:search", JSON.stringify({
  v: 3,
  c: "sdk_test",
  r: "search",
  q: "@sdk ejemplo",
  p: 0,
  z: 12
}));

const resultEvent = [...sentEvents].reverse().find(event => {
  if (event.id !== "wati:search_result") return false;
  return JSON.parse(event.message).r === "search";
});
assert.ok(resultEvent);
const result = JSON.parse(resultEvent.message);
assert.equal(result.total, 1);
assert.equal(result.items[0].i, "sdk_example:sample");


setDeferredJobs(true);
const duplicateSafe = createWatiProvider({
  id: "sdk_duplicate_safe",
  source: {
    name: "SDK Duplicate Safe",
    version: "1.0.0",
    namespaces: ["sdk_duplicate_safe"],
    aliases: ["duplicate"]
  },
  entries: [{ kind: "item", id: "sdk_duplicate_safe:sample" }]
});
assert.equal(duplicateSafe.isRegistering(), true);
const queuedBeforeDuplicate = queuedJobCount();
assert.equal(duplicateSafe.register(), false);
assert.equal(queuedJobCount(), queuedBeforeDuplicate);
flushJobs();
setDeferredJobs(false);
assert.equal(duplicateSafe.isRegistering(), false);
assert.equal(duplicateSafe.isAccepted(), true);

console.log("WATI copy-in provider SDK: integration tests passed");
