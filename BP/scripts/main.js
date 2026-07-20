import { BlockTypes, ItemTypes, system } from "@minecraft/server";
import { CATALOG } from "./catalog_data.js";
import { RECIPE_CATALOG } from "./recipe_data.js";
import { ACQUISITION_DATA } from "./acquisition_data.js";

const LOOKUP_PROTOCOL_VERSION = 1;
const CODEX_PROTOCOL_VERSION = 2;
const PACK_VERSION = "2.0.0";
const VALID_KINDS = new Set(["entity", "block", "item"]);
const RECIPE_TYPE_NAMES = Object.freeze({
  s: "shaped",
  l: "shapeless",
  f: "furnace",
  b: "brewing_mix",
  t: "smithing_transform",
  r: "smithing_trim"
});
const CAPABILITIES = Object.freeze({
  lookup: LOOKUP_PROTOCOL_VERSION,
  codex: CODEX_PROTOCOL_VERSION,
  search: 1,
  sources: 1,
  entry: 1,
  recipes: 1,
  uses: 1,
  acquisition: 1,
  relatedContent: 1,
  searchContentKind: true,
  exactItemUses: true,
  tagUses: false,
  installedItems: true,
  installedBlocks: true,
  installedEntities: false
});

let searchRows;
let recipeIndexes;
let installedRegistry;

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.\/+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function cleanDisplay(value) {
  return String(value ?? "")
    .replace(/\\n/g, "\n")
    .replace(/§./g, "")
    .split(/\r?\n/, 1)[0]
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanDisplay(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@:_+.!'&-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIdentifier(typeId) {
  const separator = typeId.indexOf(":");
  if (separator < 1) return ["unknown", typeId];
  return [typeId.slice(0, separator), typeId.slice(separator + 1)];
}

function sourceIdForNamespace(namespace) {
  return CATALOG.namespaceSources[namespace] ?? namespace;
}

function sourceForTypeId(typeId) {
  const [namespace] = splitIdentifier(typeId);
  const sourceId = sourceIdForNamespace(namespace);
  const source = CATALOG.sources[sourceId];
  return {
    sourceId,
    source,
    addonName: (source?.name ?? CATALOG.addons[namespace] ?? titleCase(namespace)) || "Unknown Add-on",
    addonKey: CATALOG.addons[namespace] ? `wati.addon.${namespace}` : undefined,
    sourceKey: source ? `wati.source.${sourceId}` : undefined
  };
}

function runtimeLocalizationKey(kind, typeId) {
  try {
    if (kind === "item") return ItemTypes.get(typeId)?.localizationKey;
    if (kind === "block") return BlockTypes.get(typeId)?.localizationKey;
  } catch {
    // A missing or malformed third-party type must not break WATI.
  }
  return undefined;
}

function entryFields(kind, typeId) {
  const [, identifier] = splitIdentifier(typeId);
  const entry = CATALOG.content[kind]?.[typeId];
  const sourceInfo = sourceForTypeId(typeId);
  return {
    f: Boolean(entry),
    n: typeof entry?.[0] === "string" ? entry[0] : undefined,
    d: (entry?.[1] ?? titleCase(identifier)) || "Unknown Content",
    x: cleanDisplay((entry?.[1] ?? titleCase(identifier)) || "Unknown Content"),
    o: entry?.[2] === true,
    al: typeof entry?.[3] === "string" ? entry[3].split("|") : undefined,
    cat: typeof entry?.[4] === "string" ? entry[4] : undefined,
    grp: typeof entry?.[5] === "string" ? entry[5] : undefined,
    a: sourceInfo.addonName,
    ak: sourceInfo.addonKey,
    sid: sourceInfo.sourceId,
    sk: sourceInfo.sourceKey,
    s: runtimeLocalizationKey(kind, typeId)
  };
}

function responseFor(kind, typeId) {
  return entryFields(kind, typeId);
}

function send(id, payload) {
  try {
    system.sendScriptEvent(id, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn(`[WATI Core] No se pudo enviar ${id}: ${error}`);
    return false;
  }
}

function validToken(value) {
  return typeof value === "string" && /^[a-z0-9_.-]{1,64}$/i.test(value);
}

function parseMessage(message) {
  try {
    return JSON.parse(message);
  } catch {
    return undefined;
  }
}

function validCodexRequest(request) {
  return request?.v === CODEX_PROTOCOL_VERSION && validToken(request.c) && validToken(request.r);
}

function clampInteger(value, minimum, maximum, fallback) {
  if (!Number.isInteger(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, value));
}

function sendCodexResult(id, request, payload) {
  send(id, {
    v: CODEX_PROTOCOL_VERSION,
    c: request.c,
    r: request.r,
    ...payload
  });
}

function ensureInstalledRegistry() {
  if (installedRegistry) return installedRegistry;
  const items = new Set();
  const blocks = new Set();
  try {
    for (const type of ItemTypes.getAll()) items.add(type.id);
  } catch (error) {
    console.warn(`[WATI Core] No se pudo enumerar objetos instalados: ${error}`);
  }
  try {
    for (const type of BlockTypes.getAll()) blocks.add(type.id);
  } catch (error) {
    console.warn(`[WATI Core] No se pudo enumerar bloques instalados: ${error}`);
  }
  const namespaces = new Set();
  for (const typeId of items) namespaces.add(splitIdentifier(typeId)[0]);
  for (const typeId of blocks) namespaces.add(splitIdentifier(typeId)[0]);
  installedRegistry = Object.freeze({ items, blocks, namespaces });
  return installedRegistry;
}

function installedState(kind, typeId) {
  const registry = ensureInstalledRegistry();
  if (kind === "item") return registry.items.has(typeId);
  if (kind === "block") return registry.blocks.has(typeId);
  const sourceInfo = sourceForTypeId(typeId);
  if (!sourceInfo.source) return undefined;
  if (sourceInfo.source.namespaces.some(namespace => registry.namespaces.has(namespace))) return true;
  return undefined;
}

function ensureSearchRows() {
  if (searchRows) return searchRows;
  const rows = [];
  for (const kind of VALID_KINDS) {
    for (const [typeId, entry] of Object.entries(CATALOG.content[kind] ?? {})) {
      const sourceInfo = sourceForTypeId(typeId);
      const source = sourceInfo.source;
      const aliases = typeof entry[3] === "string" ? entry[3] : "";
      const sourceText = source
        ? [sourceInfo.sourceId, source.name, ...(source.aliases ?? []), ...(source.namespaces ?? [])].join(" ")
        : sourceInfo.addonName;
      rows.push(Object.freeze({
        kind,
        typeId,
        entry,
        sourceId: sourceInfo.sourceId,
        search: normalizeText(`${typeId} ${entry[1] ?? ""} ${aliases} ${sourceText}`),
        display: normalizeText(cleanDisplay(entry[1] ?? splitIdentifier(typeId)[1])),
        identifier: normalizeText(splitIdentifier(typeId)[1])
      }));
    }
  }
  searchRows = Object.freeze(rows);
  return searchRows;
}

function matchSourceTerm(term) {
  const normalized = normalizeText(term.replace(/^@/, ""));
  const matches = new Set();
  if (!normalized) return matches;
  for (const [sourceId, source] of Object.entries(CATALOG.sources)) {
    const candidates = [sourceId, source.name, ...(source.aliases ?? []), ...(source.namespaces ?? [])]
      .map(normalizeText);
    if (candidates.some(candidate => candidate.startsWith(normalized))) matches.add(sourceId);
  }
  return matches;
}

function parseSearchQuery(query) {
  const tokens = String(query ?? "").trim().split(/\s+/).filter(Boolean);
  const sourceTokens = tokens.filter(token => token.startsWith("@"));
  const textTokens = tokens.filter(token => !token.startsWith("@")).map(normalizeText).filter(Boolean);
  let sourceIds;
  for (const token of sourceTokens) {
    const matches = matchSourceTerm(token);
    if (sourceIds === undefined) {
      sourceIds = matches;
    } else {
      sourceIds = new Set([...sourceIds].filter(sourceId => matches.has(sourceId)));
    }
  }
  return { sourceIds, textTokens };
}

function searchScore(row, textTokens) {
  if (!textTokens.length) return 10;
  if (!textTokens.every(token => row.search.includes(token))) return -1;
  const joined = textTokens.join(" ");
  const normalizedTypeId = normalizeText(row.typeId);
  if (normalizedTypeId === joined) return 120;
  if (row.identifier === joined) return 110;
  if (row.display === joined) return 100;
  if (row.display.startsWith(joined)) return 90;
  if (row.identifier.startsWith(joined)) return 80;
  if (normalizedTypeId.includes(joined)) return 70;
  return 60;
}

function handleSearch(request) {
  const query = typeof request.q === "string" ? request.q.slice(0, 128) : "";
  const kind = VALID_KINDS.has(request.k) || request.k === "content" ? request.k : undefined;
  const page = clampInteger(request.p, 0, 100000, 0);
  const pageSize = clampInteger(request.z, 1, 20, 12);
  const installedOnly = request.x === true;
  const parsed = parseSearchQuery(query);
  if (parsed.sourceIds && parsed.sourceIds.size === 0) {
    sendCodexResult("wati:search_result", request, { q: query, p: page, z: pageSize, total: 0, items: [] });
    return;
  }

  const matches = [];
  for (const row of ensureSearchRows()) {
    if (kind === "content" && row.kind === "entity") continue;
    if (kind && kind !== "content" && row.kind !== kind) continue;
    if (parsed.sourceIds && !parsed.sourceIds.has(row.sourceId)) continue;
    const installed = installedState(row.kind, row.typeId);
    if (installedOnly && (row.kind === "item" || row.kind === "block") && installed !== true) continue;
    const score = searchScore(row, parsed.textTokens);
    if (score < 0) continue;
    matches.push({ row, score, installed });
  }
  matches.sort((left, right) => right.score - left.score || left.row.display.localeCompare(right.row.display) || left.row.typeId.localeCompare(right.row.typeId));
  const start = page * pageSize;
  const items = matches.slice(start, start + pageSize).map(({ row, installed }) => ({
    k: row.kind,
    i: row.typeId,
    installed,
    ...entryFields(row.kind, row.typeId)
  }));
  sendCodexResult("wati:search_result", request, {
    q: query,
    p: page,
    z: pageSize,
    total: matches.length,
    more: start + items.length < matches.length,
    items
  });
}


const LEGACY_COLORS = Object.freeze(["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"]);
const LEGACY_WOODS = Object.freeze(["oak","spruce","birch","jungle","acacia","dark_oak"]);
const LEGACY_BARE_VANILLA_IDS = new Set(["carpet","concrete","stained_glass","stained_glass_pane","wool","planks","log","log2","wooden_slab","stone","stonebrick","bucket","fish","cooked_fish","sapling","sand","sandstone","red_sandstone","stained_hardened_clay"]);

function normalizeLegacyItemReference(typeId, data) {
  const originalId = String(typeId ?? "");
  const originalData = data;
  let id = originalId;
  if (!id.includes(":") && LEGACY_BARE_VANILLA_IDS.has(id)) id = `minecraft:${id}`;
  if (!id.startsWith("minecraft:") || !Number.isInteger(data)) return { id, data, legacyId: originalId !== id ? originalId : undefined, legacyData: originalData };
  const base = id.slice("minecraft:".length);
  const colorSuffix = { carpet:"carpet", concrete:"concrete", stained_glass:"stained_glass", stained_glass_pane:"stained_glass_pane", wool:"wool", stained_hardened_clay:"terracotta" }[base];
  if (colorSuffix && data >= 0 && data < LEGACY_COLORS.length) return { id:`minecraft:${LEGACY_COLORS[data]}_${colorSuffix}`, legacyId:originalId, legacyData:data };
  if (base === "planks" && data >= 0 && data < LEGACY_WOODS.length) return { id:`minecraft:${LEGACY_WOODS[data]}_planks`, legacyId:originalId, legacyData:data };
  if (base === "wooden_slab" && data >= 0 && data < LEGACY_WOODS.length) return { id:`minecraft:${LEGACY_WOODS[data]}_slab`, legacyId:originalId, legacyData:data };
  if (base === "log" && data >= 0 && data < 4) return { id:`minecraft:${LEGACY_WOODS[data]}_log`, legacyId:originalId, legacyData:data };
  if (base === "log2" && data >= 0 && data < 2) return { id:`minecraft:${LEGACY_WOODS[data+4]}_log`, legacyId:originalId, legacyData:data };
  const fixed = {
    stone:["stone","granite","polished_granite","diorite","polished_diorite","andesite","polished_andesite"],
    stonebrick:["stone_bricks","mossy_stone_bricks","cracked_stone_bricks","chiseled_stone_bricks"],
    sapling:["oak_sapling","spruce_sapling","birch_sapling","jungle_sapling","acacia_sapling","dark_oak_sapling"],
    fish:["cod","salmon","tropical_fish","pufferfish"],
    cooked_fish:["cooked_cod","cooked_salmon"],
    sand:["sand","red_sand"],
    sandstone:["sandstone","chiseled_sandstone","cut_sandstone","smooth_sandstone"],
    red_sandstone:["red_sandstone","chiseled_red_sandstone","cut_red_sandstone","smooth_red_sandstone"]
  }[base];
  if (fixed?.[data]) return { id:`minecraft:${fixed[data]}`, legacyId:originalId, legacyData:data };
  if (base === "bucket" && data === 1) return { id:"minecraft:milk_bucket", legacyId:originalId, legacyData:data };
  return { id, data, legacyId: originalId !== id ? originalId : undefined, legacyData: originalData };
}

function decodeIngredient(value) {
  if (!Array.isArray(value)) return { type: "unknown" };
  if (value[0] === 0) {
    const normalized = normalizeLegacyItemReference(value[1], value.length > 3 ? value[3] : undefined);
    return {
      type: "item",
      id: normalized.id,
      count: typeof value[2] === "number" ? value[2] : 1,
      data: normalized.data,
      legacyId: normalized.legacyId,
      legacyData: normalized.legacyData
    };
  }
  if (value[0] === 1) {
    return {
      type: "tag",
      tag: value[1],
      count: typeof value[2] === "number" ? value[2] : 1
    };
  }
  return { type: "unknown", raw: value[1] };
}

function decodeResult(value) {
  if (!Array.isArray(value)) return undefined;
  const normalized = normalizeLegacyItemReference(value[0], value.length > 2 ? value[2] : undefined);
  return {
    id: normalized.id,
    count: typeof value[1] === "number" ? value[1] : 1,
    data: normalized.data,
    legacyId: normalized.legacyId,
    legacyData: normalized.legacyData
  };
}

function decodeUnlock(value) {
  if (!Array.isArray(value)) return undefined;
  if (value[0] === "c") return { type: "context", context: value[1] };
  if (value[0] === "i") return { type: "ingredients", ingredients: (value[1] ?? []).map(decodeIngredient) };
  return { type: "raw", value: value[1] };
}

function recipeResults(row) {
  const code = row[1];
  const payload = row[3];
  if (code === "s") return payload[2] ?? [];
  if (code === "l" || code === "f") return payload[1] ?? [];
  if (code === "b") return payload[2] ?? [];
  if (code === "t") return payload[3] ?? [];
  return [];
}

function recipeIngredients(row) {
  const code = row[1];
  const payload = row[3];
  if (code === "s") return (payload[1] ?? []).map(pair => pair[1]);
  if (code === "l") return payload[0] ?? [];
  if (code === "f") return [payload[0]];
  if (code === "b") return [payload[0], payload[1]];
  if (code === "t" || code === "r") return [payload[0], payload[1], payload[2]];
  return [];
}

function ensureRecipeIndexes() {
  if (recipeIndexes) return recipeIndexes;
  const byResult = new Map();
  const byIngredient = new Map();
  for (const [sourceId, rows] of Object.entries(RECIPE_CATALOG.sources)) {
    rows.forEach((row, index) => {
      const reference = Object.freeze([sourceId, index]);
      for (const result of recipeResults(row)) {
        const normalized = normalizeLegacyItemReference(result?.[0], result?.length > 2 ? result[2] : undefined);
        const itemId = normalized.id;
        if (typeof itemId !== "string") continue;
        const references = byResult.get(itemId) ?? [];
        references.push(reference);
        byResult.set(itemId, references);
      }
      const exactItems = new Set();
      for (const ingredient of recipeIngredients(row)) {
        if (Array.isArray(ingredient) && ingredient[0] === 0 && typeof ingredient[1] === "string") {
          exactItems.add(normalizeLegacyItemReference(ingredient[1], ingredient.length > 3 ? ingredient[3] : undefined).id);
        }
      }
      for (const itemId of exactItems) {
        const references = byIngredient.get(itemId) ?? [];
        references.push(reference);
        byIngredient.set(itemId, references);
      }
    });
  }
  recipeIndexes = Object.freeze({ byResult, byIngredient });
  return recipeIndexes;
}

function recipeObject(reference) {
  const [sourceId, index] = reference;
  const row = RECIPE_CATALOG.sources[sourceId]?.[index];
  if (!row) return undefined;
  const [id, code, tags, payload, metadata] = row;
  const source = CATALOG.sources[sourceId];
  const result = {
    id,
    sourceId,
    sourceKey: source ? `wati.source.${sourceId}` : undefined,
    sourceName: source?.name ?? titleCase(sourceId),
    type: RECIPE_TYPE_NAMES[code] ?? code,
    tags,
    group: metadata?.g,
    priority: metadata?.p,
    unlock: metadata?.u ? decodeUnlock(metadata.u) : undefined
  };
  if (code === "s") {
    result.pattern = payload[0] ?? [];
    result.key = Object.fromEntries((payload[1] ?? []).map(([symbol, ingredient]) => [symbol, decodeIngredient(ingredient)]));
    result.results = (payload[2] ?? []).map(decodeResult).filter(Boolean);
    if (payload.length > 3) result.assumeSymmetry = payload[3] === true;
  } else if (code === "l") {
    result.ingredients = (payload[0] ?? []).map(decodeIngredient);
    result.results = (payload[1] ?? []).map(decodeResult).filter(Boolean);
  } else if (code === "f") {
    result.input = decodeIngredient(payload[0]);
    result.results = (payload[1] ?? []).map(decodeResult).filter(Boolean);
  } else if (code === "b") {
    result.input = decodeIngredient(payload[0]);
    result.reagent = decodeIngredient(payload[1]);
    result.results = (payload[2] ?? []).map(decodeResult).filter(Boolean);
  } else if (code === "t") {
    result.template = decodeIngredient(payload[0]);
    result.base = decodeIngredient(payload[1]);
    result.addition = decodeIngredient(payload[2]);
    result.results = (payload[3] ?? []).map(decodeResult).filter(Boolean);
  } else if (code === "r") {
    result.template = decodeIngredient(payload[0]);
    result.base = decodeIngredient(payload[1]);
    result.addition = decodeIngredient(payload[2]);
    result.dynamicResult = true;
  }
  return result;
}

function handleRecipeList(eventId, request, indexName) {
  if (typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const page = clampInteger(request.p, 0, 100000, 0);
  const pageSize = clampInteger(request.z, 1, 5, 3);
  const indexes = ensureRecipeIndexes();
  const references = indexes[indexName].get(request.i) ?? [];
  const start = page * pageSize;
  const items = references.slice(start, start + pageSize).map(recipeObject).filter(Boolean);
  sendCodexResult(eventId, request, {
    i: request.i,
    p: page,
    z: pageSize,
    total: references.length,
    more: start + items.length < references.length,
    tagUsesExcluded: indexName === "byIngredient",
    items
  });
}

function sourcePresence(source) {
  const namespaces = ensureInstalledRegistry().namespaces;
  if (source.namespaces.some(namespace => namespaces.has(namespace))) return true;
  if (source.contentCounts.item + source.contentCounts.block > 0) return false;
  return undefined;
}

function handleSources(request) {
  const query = normalizeText(typeof request.q === "string" ? request.q.slice(0, 64) : "");
  const page = clampInteger(request.p, 0, 100000, 0);
  const pageSize = clampInteger(request.z, 1, 25, 12);
  const installedOnly = request.x === true;
  const matches = [];
  for (const [sourceId, source] of Object.entries(CATALOG.sources)) {
    const present = sourcePresence(source);
    if (installedOnly && present === false) continue;
    const searchable = normalizeText(`${sourceId} ${source.name} ${(source.aliases ?? []).join(" ")} ${(source.namespaces ?? []).join(" ")}`);
    if (query && !searchable.includes(query)) continue;
    matches.push({
      id: sourceId,
      key: `wati.source.${sourceId}`,
      name: source.name,
      aliases: source.aliases,
      namespaces: source.namespaces,
      version: source.version,
      packUuid: source.packUuid,
      minEngineVersion: source.minEngineVersion,
      localizationPolicy: source.localizationPolicy,
      contentCounts: source.contentCounts,
      recipeCount: source.recipeCount,
      present
    });
  }
  matches.sort((left, right) => left.name.localeCompare(right.name));
  const start = page * pageSize;
  const items = matches.slice(start, start + pageSize);
  sendCodexResult("wati:sources_result", request, {
    q: query,
    p: page,
    z: pageSize,
    total: matches.length,
    more: start + items.length < matches.length,
    items
  });
}

function handleEntry(request) {
  if (!VALID_KINDS.has(request.k) || typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const indexes = ensureRecipeIndexes();
  const result = entryFields(request.k, request.i);
  const relatedKinds = [...VALID_KINDS].filter(kind => kind !== request.k && Boolean(CATALOG.content[kind]?.[request.i]));
  const recipeCount = request.k === "entity" ? 0 : (indexes.byResult.get(request.i)?.length ?? 0);
  const useCount = request.k === "entity" ? 0 : (indexes.byIngredient.get(request.i)?.length ?? 0);
  sendCodexResult("wati:entry_result", request, {
    k: request.k,
    i: request.i,
    installed: installedState(request.k, request.i),
    recipeCount,
    useCount,
    relatedKinds,
    tagUsesExcluded: request.k !== "entity",
    ...result
  });
}


function handleAcquisition(request) {
  if (typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const rows = Array.isArray(ACQUISITION_DATA[request.i]) ? ACQUISITION_DATA[request.i] : [];
  sendCodexResult("wati:acquisition_result", request, { i: request.i, total: rows.length, items: rows });
}

function handleCapabilities(request) {
  const contentCounts = Object.fromEntries(Object.entries(CATALOG.content).map(([kind, entries]) => [kind, Object.keys(entries).length]));
  const recipeCount = Object.values(RECIPE_CATALOG.sources).reduce((total, rows) => total + rows.length, 0);
  sendCodexResult("wati:capabilities_result", request, {
    pack: PACK_VERSION,
    catalogSchema: CATALOG.schema,
    recipeSchema: RECIPE_CATALOG.schema,
    capabilities: CAPABILITIES,
    sourceCount: Object.keys(CATALOG.sources).length,
    namespaceCount: Object.keys(CATALOG.addons).length,
    contentCounts,
    recipeCount,
    acquisitionEntryCount: Object.keys(ACQUISITION_DATA).length,
    acquisitionMethodCount: Object.values(ACQUISITION_DATA).reduce((total, rows) => total + (Array.isArray(rows) ? rows.length : 0), 0)
  });
}

function handleLegacyLookup(event) {
  const request = parseMessage(event.message);
  if (
    request?.v !== LOOKUP_PROTOCOL_VERSION ||
    !validToken(request.c) || !validToken(request.r) ||
    !VALID_KINDS.has(request.k) ||
    typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256
  ) return;
  send("wati:result", {
    v: LOOKUP_PROTOCOL_VERSION,
    c: request.c,
    r: request.r,
    k: request.k,
    i: request.i,
    ...responseFor(request.k, request.i)
  });
}

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id === "wati:lookup") {
    handleLegacyLookup(event);
    return;
  }
  const request = parseMessage(event.message);
  if (!validCodexRequest(request)) return;
  if (event.id === "wati:capabilities") handleCapabilities(request);
  else if (event.id === "wati:sources") handleSources(request);
  else if (event.id === "wati:search") handleSearch(request);
  else if (event.id === "wati:entry") handleEntry(request);
  else if (event.id === "wati:recipes") handleRecipeList("wati:recipes_result", request, "byResult");
  else if (event.id === "wati:uses") handleRecipeList("wati:uses_result", request, "byIngredient");
  else if (event.id === "wati:acquisition") handleAcquisition(request);
}, { namespaces: ["wati"] });

system.run(() => {
  const contentCounts = Object.values(CATALOG.content).map(entries => Object.keys(entries).length);
  const recipeCount = Object.values(RECIPE_CATALOG.sources).reduce((total, rows) => total + rows.length, 0);
  send("wati:ready", {
    v: LOOKUP_PROTOCOL_VERSION,
    p: PACK_VERSION,
    cv: CODEX_PROTOCOL_VERSION,
    capabilities: CAPABILITIES
  });
  console.info(`[WATI Core] Registro activo: ${contentCounts.reduce((a, b) => a + b, 0)} IDs, ${recipeCount} recetas normalizadas y ${Object.keys(CATALOG.sources).length} fuentes.`);
});
