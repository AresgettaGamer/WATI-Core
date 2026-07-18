import { system } from "@minecraft/server";
import { CATALOG } from "./catalog_data.js";

const PROTOCOL_VERSION = 1;
const PACK_VERSION = "1.0.0";
const VALID_KINDS = new Set(["entity", "block", "item"]);

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.\/+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function splitIdentifier(typeId) {
  const separator = typeId.indexOf(":");
  if (separator < 1) return ["unknown", typeId];
  return [typeId.slice(0, separator), typeId.slice(separator + 1)];
}

function responseFor(kind, typeId) {
  const [namespace, identifier] = splitIdentifier(typeId);
  const entry = CATALOG.content[kind]?.[typeId];
  const addonName = CATALOG.addons[namespace] ?? titleCase(namespace) ?? "Unknown Add-on";
  return {
    f: Boolean(entry),
    n: entry?.[0],
    d: entry?.[1] ?? titleCase(identifier) ?? "Unknown Content",
    o: entry?.[2] === true,
    a: addonName,
    ak: CATALOG.addons[namespace] ? `wati.addon.${namespace}` : undefined
  };
}

function send(id, payload) {
  try {
    system.sendScriptEvent(id, JSON.stringify(payload));
  } catch (error) {
    console.warn(`[WATI Core] No se pudo enviar ${id}: ${error}`);
  }
}

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== "wati:lookup") return;

  let request;
  try {
    request = JSON.parse(event.message);
  } catch {
    return;
  }

  if (
    request?.v !== PROTOCOL_VERSION ||
    typeof request.c !== "string" || request.c.length < 1 || request.c.length > 64 ||
    typeof request.r !== "string" || request.r.length < 1 || request.r.length > 64 ||
    !VALID_KINDS.has(request.k) ||
    typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256
  ) return;

  const result = responseFor(request.k, request.i);
  send("wati:result", {
    v: PROTOCOL_VERSION,
    c: request.c,
    r: request.r,
    k: request.k,
    i: request.i,
    ...result
  });
}, { namespaces: ["wati"] });

system.run(() => {
  const counts = Object.values(CATALOG.content).map(entries => Object.keys(entries).length);
  send("wati:ready", { v: PROTOCOL_VERSION, p: PACK_VERSION });
  console.info(`[WATI Core] Registro activo: ${counts.reduce((a, b) => a + b, 0)} IDs de ${Object.keys(CATALOG.addons).length} namespaces.`);
});
