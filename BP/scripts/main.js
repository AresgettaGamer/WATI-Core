import { BiomeTypes, BlockTypes, EntityTypes, ItemTypes, system } from "@minecraft/server";
import { CATALOG } from "./catalog_data.js";
import { RECIPE_CATALOG } from "./recipe_data.js";
import { ACQUISITION_DATA } from "./acquisition_data.js";
import { buildKnowledgeProfile, knowledgeStats } from "./knowledge_runtime.js";
import { STATION_CATALOG } from "./stations_data.js";
import { buildVanillaRuntimeCatalog, isVanillaRuntimeEntry, vanillaRuntimeEntryFields } from "./vanilla_runtime_catalog.js";
import { WORLD_CONTENT } from "./world_content_data.js";
import { vanillaSpanishAliases } from "./vanilla_es_mx_search.js";
import { displayNameRedirect } from "./display_name_redirects.js";
import {
  PROVIDER_CONTENT,
  PROVIDER_NAMESPACE_SOURCES,
  PROVIDER_PROTOCOL_VERSION,
  PROVIDER_SOURCES,
  handleProviderRequest,
  isRuntimeProvider,
  runtimeProviderStats
} from "./provider_runtime.js";
import {
  CODEX_PROTOCOL_VERSION,
  CORE_BP_UUID,
  CORE_PACK_VERSION,
  LOOKUP_PROTOCOL_VERSION,
  SUPPORTED_CODEX_PROTOCOLS,
  WATI_SCHEMA,
  schemaIsAccepted,
  supportsCodexProtocol
} from "./schema_contract.js";

const PACK_VERSION = CORE_PACK_VERSION;
const VALID_KINDS = new Set(["entity", "block", "item", "biome", "ecosystem", "structure"]);
const REGISTRY_KINDS = new Set(["entity", "block", "item", "biome"]);
const RUNTIME_CATALOG_KINDS = new Set([...REGISTRY_KINDS, "structure"]);
const SOURCE_DETECTION_KINDS = new Set(["entity", "block", "item"]);
const ALL_SOURCES = Object.freeze({ ...CATALOG.sources, ...(WORLD_CONTENT.sources ?? {}) });
const ALL_NAMESPACE_SOURCES = Object.freeze({ ...CATALOG.namespaceSources, ...(WORLD_CONTENT.namespaceSources ?? {}) });
const RECIPE_TYPE_NAMES = Object.freeze({
  s: "shaped",
  l: "shapeless",
  f: "furnace",
  b: "brewing_mix",
  c: "brewing_container",
  t: "smithing_transform",
  r: "smithing_trim"
});
const CAPABILITIES = Object.freeze({
  lookup: LOOKUP_PROTOCOL_VERSION,
  codex: CODEX_PROTOCOL_VERSION,
  supportedCodexProtocols: SUPPORTED_CODEX_PROTOCOLS,
  schema: WATI_SCHEMA.version,
  search: 2,
  sources: 2,
  entry: 2,
  recipes: 2,
  uses: 2,
  acquisition: 1,
  knowledge: 2,
  knowledgeDescriptions: true,
  knowledgeDrops: true,
  knowledgeHabitats: true,
  knowledgeWorldContents: true,
  knowledgeRelations: true,
  knowledgeConstructionPatterns: true,
  knowledgeStaticFacts: 1,
  lensKnowledgeBridge: 1,
  progressiveKnowledge: true,
  relatedContent: 1,
  searchContentKind: true,
  exactItemUses: true,
  tagUses: false,
  installedItems: true,
  installedBlocks: true,
  installedEntities: true,
  installedSources: true,
  installedRecipes: true,
  installedCounts: true,
  dependencyDiagnostics: true,
  sourcePresenceDiagnostics: true,
  catalogDiagnostics: 2,
  diagnosticsPagination: true,
  runtimeSummaryCache: true,
  installedRecipeReferenceCache: true,
  sourceListCache: true,
  stationDescriptors: true,
  explicitStationCatalog: true,
  localizedStationKeys: true,
  catalogCompiler: 1,
  schemaDescriptor: true,
  forwardCompatibleKinds: true,
  runtimeVanillaCatalog: true,
  vanillaTexturePaths: true,
  vanillaEntitySpawnEggIcons: true,
  runtimeVanillaBiomes: true,
  runtimeVanillaStructures: true,
  generatedStructureDetection: true,
  worldContentCatalog: true,
  ecosystemSignatureDetection: true,
  structureCatalog: true,
  vanillaSpanishSearchAliases: true,
  multilingualSearchStopWords: true,
  runtimeProviders: PROVIDER_PROTOCOL_VERSION,
  runtimeProviderContent: true,
  runtimeProviderRecipes: false,
  runtimeProviderAcquisition: false,
  runtimeProviderKnowledge: false
});

let searchRows;
let searchRowsByKind;
let searchRowsBySource;
let recipeIndexes;
let installedRegistry;
let sourceContentIndex;
let sourcePresenceCache;
let installedContentCountsCache;
let stationSuffixIndex;
let schemaDiagnosticsCache;
let runtimeSummaryCache;
let sourceRowsCache;
let installedRecipeReferenceCache;
let catalogDiagnosticsCache;

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

const SEARCH_STOP_WORDS = new Set([
  "a", "al", "and", "con", "de", "del", "el", "en", "for", "la", "las", "los",
  "of", "para", "por", "the", "un", "una", "unos", "unas", "y"
]);

function splitIdentifier(typeId) {
  const separator = typeId.indexOf(":");
  if (separator < 1) return ["unknown", typeId];
  return [typeId.slice(0, separator), typeId.slice(separator + 1)];
}

function allSources() {
  return { ...ALL_SOURCES, ...PROVIDER_SOURCES };
}

function allNamespaceSources() {
  return { ...ALL_NAMESPACE_SOURCES, ...PROVIDER_NAMESPACE_SOURCES };
}

function sourceById(sourceId) {
  return PROVIDER_SOURCES[sourceId] ?? ALL_SOURCES[sourceId];
}

function combinedContentForKind(kind) {
  return {
    ...(CATALOG.content[kind] ?? {}),
    ...(WORLD_CONTENT.content?.[kind] ?? {}),
    ...(PROVIDER_CONTENT[kind] ?? {})
  };
}

function contentEntry(kind, typeId) {
  return PROVIDER_CONTENT[kind]?.[typeId]
    ?? WORLD_CONTENT.content?.[kind]?.[typeId]
    ?? CATALOG.content[kind]?.[typeId];
}

function sourceIdForNamespace(namespace) {
  return PROVIDER_NAMESPACE_SOURCES[namespace] ?? ALL_NAMESPACE_SOURCES[namespace] ?? namespace;
}

function sourceForTypeId(typeId) {
  const [namespace] = splitIdentifier(typeId);
  const sourceId = sourceIdForNamespace(namespace);
  const source = sourceById(sourceId);
  return {
    sourceId,
    source,
    addonName: (source?.name ?? CATALOG.addons[namespace] ?? titleCase(namespace)) || "Unknown Add-on",
    addonKey: CATALOG.addons[namespace] ? `wati.addon.${namespace}` : undefined,
    sourceKey: source && !isRuntimeProvider(sourceId) ? `wati.source.${sourceId}` : undefined
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
  const entry = contentEntry(kind, typeId);
  const sourceInfo = sourceForTypeId(typeId);
  if (!entry) {
    const vanilla = vanillaRuntimeEntryFields(kind, typeId, ensureInstalledRegistry());
    if (vanilla) {
      return {
        ...vanilla,
        a: sourceInfo.addonName,
        ak: sourceInfo.addonKey,
        sid: sourceInfo.sourceId,
        sk: sourceInfo.sourceKey,
        vr: true
      };
    }
  }
  if (entry && !Array.isArray(entry)) {
    return {
      f: true,
      n: typeof entry.n === "string" ? entry.n : undefined,
      d: entry.d ?? titleCase(identifier),
      x: cleanDisplay(entry.d ?? titleCase(identifier)),
      o: entry.o === true,
      al: Array.isArray(entry.al) ? entry.al : undefined,
      cat: entry.cat,
      grp: entry.grp,
      a: sourceInfo.addonName,
      ak: sourceInfo.addonKey,
      sid: sourceInfo.sourceId,
      sk: sourceInfo.sourceKey,
      s: entry.s,
      itk: entry.itk,
      itp: entry.itp,
      dh: Array.isArray(entry.dh) ? entry.dh : undefined,
      dim: entry.dim,
      base: Array.isArray(entry.base) ? entry.base : undefined,
      det: entry.det,
      confidence: entry.confidence,
      signatures: Array.isArray(entry.sg) ? entry.sg : undefined,
      step: entry.step,
      pool: entry.pool,
      depth: entry.depth,
      sn: entry.sn,
      summary: entry.summary
    };
  }
  const embeddedRuntimeKey = typeof entry?.[6] === "string" ? entry[6] : undefined;
  const redirect = entry ? undefined : displayNameRedirect(kind, typeId);
  const redirectedKey = typeof redirect?.[0] === "string" ? redirect[0] : undefined;
  const redirectedName = typeof redirect?.[1] === "string" ? redirect[1] : undefined;
  const displayName = (entry?.[1] ?? redirectedName ?? titleCase(identifier)) || "Unknown Content";
  return {
    f: Boolean(entry),
    n: typeof entry?.[0] === "string" ? entry[0] : redirectedKey,
    d: displayName,
    x: cleanDisplay(displayName),
    o: entry?.[2] === true,
    al: typeof entry?.[3] === "string" ? entry[3].split("|") : undefined,
    cat: typeof entry?.[4] === "string" ? entry[4] : undefined,
    grp: typeof entry?.[5] === "string" ? entry[5] : undefined,
    a: sourceInfo.addonName,
    ak: sourceInfo.addonKey,
    sid: sourceInfo.sourceId,
    sk: sourceInfo.sourceKey,
    s: runtimeLocalizationKey(kind, typeId) ?? embeddedRuntimeKey,
    itk: typeof entry?.[7] === "string" ? entry[7] : undefined,
    itp: typeof entry?.[8] === "string" ? entry[8] : undefined,
    dh: typeof entry?.[9] === "string" ? entry[9].split("|") : undefined
  };
}

function catalogEntryExists(kind, typeId) {
  if (Boolean(contentEntry(kind, typeId))) return true;
  return Boolean(vanillaRuntimeEntryFields(kind, typeId, ensureInstalledRegistry()));
}

function bestKindForTypeId(typeId) {
  for (const kind of ["item", "block", "entity", "biome", "ecosystem", "structure"]) {
    if (catalogEntryExists(kind, typeId)) return kind;
  }
  return "item";
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
  return supportsCodexProtocol(request?.v) && validToken(request.c) && validToken(request.r);
}

function clampInteger(value, minimum, maximum, fallback) {
  if (!Number.isInteger(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, value));
}

function paginate(items, page, pageSize) {
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    page,
    pageSize,
    total: items.length,
    more: start + pageItems.length < items.length,
    items: pageItems
  };
}

function sendCodexResult(id, request, payload) {
  send(id, {
    v: request.v,
    c: request.c,
    r: request.r,
    ...payload
  });
}

function ensureInstalledRegistry() {
  if (installedRegistry) return installedRegistry;
  const items = new Set();
  const blocks = new Set();
  const entities = new Set();
  const biomes = new Set();
  const errors = [];
  try {
    for (const type of ItemTypes.getAll()) items.add(type.id);
  } catch (error) {
    errors.push("items");
    console.warn(`[WATI Core] No se pudo enumerar objetos instalados: ${error}`);
  }
  try {
    for (const type of BlockTypes.getAll()) blocks.add(type.id);
  } catch (error) {
    errors.push("blocks");
    console.warn(`[WATI Core] No se pudo enumerar bloques instalados: ${error}`);
  }
  try {
    for (const type of EntityTypes.getAll()) entities.add(type.id);
  } catch (error) {
    errors.push("entities");
    console.warn(`[WATI Core] No se pudo enumerar entidades instaladas: ${error}`);
  }
  try {
    for (const type of BiomeTypes.getAll()) biomes.add(type.id);
  } catch (error) {
    errors.push("biomes");
    console.warn(`[WATI Core] No se pudo enumerar biomas instalados: ${error}`);
  }
  const namespaces = new Set();
  for (const collection of [items, blocks, entities, biomes]) {
    for (const typeId of collection) namespaces.add(splitIdentifier(typeId)[0]);
  }
  installedRegistry = Object.freeze({ items, blocks, entities, biomes, namespaces, errors: Object.freeze(errors) });
  return installedRegistry;
}

function installedState(kind, typeId) {
  const registry = ensureInstalledRegistry();
  const errorKey = kind === "entity" ? "entities" : `${kind}s`;
  if (REGISTRY_KINDS.has(kind) && registry.errors.includes(errorKey)) return undefined;
  if (kind === "item") return registry.items.has(typeId);
  if (kind === "block") return registry.blocks.has(typeId);
  if (kind === "entity") return registry.entities.has(typeId);
  if (kind === "biome") return registry.biomes.has(typeId);
  if (kind === "structure" && isVanillaRuntimeEntry(kind, typeId, registry)) return true;
  if (kind === "ecosystem" || kind === "structure") return sourcePresenceById(sourceForTypeId(typeId).sourceId);
  return undefined;
}

function emptyKindLists() {
  return Object.fromEntries([...VALID_KINDS].map(kind => [kind, []]));
}

function invalidateProviderDerivedCaches() {
  searchRows = undefined;
  searchRowsByKind = undefined;
  searchRowsBySource = undefined;
  sourceContentIndex = undefined;
  sourcePresenceCache = undefined;
  installedContentCountsCache = undefined;
  stationSuffixIndex = undefined;
  runtimeSummaryCache = undefined;
  sourceRowsCache = undefined;
  installedRecipeReferenceCache = undefined;
  catalogDiagnosticsCache = undefined;
}

function ensureSourceContentIndex() {
  if (sourceContentIndex) return sourceContentIndex;
  const index = new Map();
  for (const sourceId of Object.keys(allSources())) index.set(sourceId, emptyKindLists());
  for (const kind of VALID_KINDS) {
    const combined = combinedContentForKind(kind);
    for (const typeId of Object.keys(combined)) {
      const sourceId = sourceForTypeId(typeId).sourceId;
      const row = index.get(sourceId) ?? emptyKindLists();
      row[kind].push(typeId);
      index.set(sourceId, row);
    }
  }
  const vanilla = buildVanillaRuntimeCatalog(ensureInstalledRegistry());
  const minecraft = index.get("minecraft") ?? emptyKindLists();
  for (const kind of RUNTIME_CATALOG_KINDS) {
    const known = new Set(minecraft[kind]);
    for (const typeId of vanilla[kind] ?? []) if (!known.has(typeId)) minecraft[kind].push(typeId);
  }
  index.set("minecraft", minecraft);
  sourceContentIndex = index;
  return sourceContentIndex;
}

function sourceDetectionDescriptor(sourceId, source) {
  const configured = source?.detection;
  if (configured && typeof configured === "object") {
    return {
      mode: typeof configured.mode === "string" ? configured.mode : "content",
      namespaces: Array.isArray(configured.namespaces) ? configured.namespaces : (source?.namespaces ?? []),
      probes: Array.isArray(configured.probes) ? configured.probes : [],
      hiddenByDefault: configured.hiddenByDefault === true
    };
  }
  return {
    mode: sourceId === "wati" ? "core" : "content",
    namespaces: source?.namespaces ?? [],
    probes: [],
    hiddenByDefault: false
  };
}

function sourcePresenceDetailsById(sourceId) {
  if (!sourcePresenceCache) sourcePresenceCache = new Map();
  if (sourcePresenceCache.has(sourceId)) return sourcePresenceCache.get(sourceId);

  const source = sourceById(sourceId);
  if (!source) {
    const missing = Object.freeze({ present: false, mode: "content", reason: "unknown_source", detectable: 0 });
    sourcePresenceCache.set(sourceId, missing);
    return missing;
  }

  const detection = sourceDetectionDescriptor(sourceId, source);
  if (sourceId === "minecraft") {
    const vanilla = Object.freeze({
      present: true,
      mode: "runtime",
      reason: "vanilla_runtime_catalog",
      detectable: 0,
      hiddenByDefault: false,
      matchedNamespace: "minecraft"
    });
    sourcePresenceCache.set(sourceId, vanilla);
    return vanilla;
  }
  if (sourceId === "wati" || source.packUuid === CORE_BP_UUID || detection.mode === "core") {
    const self = Object.freeze({
      present: true,
      mode: "core",
      reason: "core_pack",
      detectable: 0,
      hiddenByDefault: detection.hiddenByDefault,
      matchedPackUuid: CORE_BP_UUID
    });
    sourcePresenceCache.set(sourceId, self);
    return self;
  }
  if (isRuntimeProvider(sourceId)) {
    const provider = Object.freeze({
      present: true,
      mode: "provider",
      reason: "runtime_provider_registered",
      detectable: 0,
      hiddenByDefault: false,
      providerProtocol: PROVIDER_PROTOCOL_VERSION
    });
    sourcePresenceCache.set(sourceId, provider);
    return provider;
  }

  const registered = ensureSourceContentIndex().get(sourceId) ?? emptyKindLists();
  const probes = detection.probes.filter(probe => SOURCE_DETECTION_KINDS.has(probe?.kind) && typeof probe?.id === "string");
  if (probes.length) {
    let unverifiable = false;
    for (const probe of probes) {
      const state = installedState(probe.kind, probe.id);
      if (state === true) {
        const exact = Object.freeze({
          present: true,
          mode: detection.mode,
          reason: "configured_probe_found",
          detectable: probes.length,
          hiddenByDefault: detection.hiddenByDefault,
          matchedKind: probe.kind,
          matchedTypeId: probe.id
        });
        sourcePresenceCache.set(sourceId, exact);
        return exact;
      }
      if (state === undefined) unverifiable = true;
    }
    if (detection.mode === "content" && !unverifiable) {
      const absent = Object.freeze({
        present: false,
        mode: "content",
        reason: "configured_probes_absent",
        detectable: probes.length,
        hiddenByDefault: detection.hiddenByDefault
      });
      sourcePresenceCache.set(sourceId, absent);
      return absent;
    }
  }
  let detectable = 0;
  let unverifiable = false;
  for (const kind of SOURCE_DETECTION_KINDS) {
    for (const typeId of registered[kind]) {
      detectable++;
      const state = installedState(kind, typeId);
      if (state === true) {
        const exact = Object.freeze({
          present: true,
          mode: "content",
          reason: "registered_content_found",
          detectable,
          matchedKind: kind,
          matchedTypeId: typeId
        });
        sourcePresenceCache.set(sourceId, exact);
        return exact;
      }
      if (state === undefined) unverifiable = true;
    }
  }

  if (detectable > 0) {
    const contentResult = Object.freeze({
      present: unverifiable ? undefined : false,
      mode: "content",
      reason: unverifiable ? "registry_unavailable" : "registered_content_absent",
      detectable,
      hiddenByDefault: detection.hiddenByDefault
    });
    sourcePresenceCache.set(sourceId, contentResult);
    return contentResult;
  }

  const registry = ensureInstalledRegistry();
  const namespaces = detection.namespaces;
  const matchedNamespace = namespaces.find(namespace => registry.namespaces.has(namespace));
  const namespaceResult = Object.freeze({
    present: matchedNamespace ? true : (registry.errors.length ? undefined : false),
    mode: "namespace",
    reason: matchedNamespace ? "namespace_found" : (registry.errors.length ? "registry_unavailable" : "namespace_absent"),
    detectable: 0,
    hiddenByDefault: detection.hiddenByDefault,
    matchedNamespace
  });
  sourcePresenceCache.set(sourceId, namespaceResult);
  return namespaceResult;
}

function sourcePresenceById(sourceId) {
  return sourcePresenceDetailsById(sourceId).present;
}

function installedContentCountsForSource(sourceId) {
  if (!installedContentCountsCache) installedContentCountsCache = new Map();
  if (installedContentCountsCache.has(sourceId)) return installedContentCountsCache.get(sourceId);
  const registered = ensureSourceContentIndex().get(sourceId) ?? emptyKindLists();
  const counts = Object.freeze(Object.fromEntries([...VALID_KINDS].map(kind => [
    kind,
    registered[kind].reduce((total, typeId) => total + (installedState(kind, typeId) === true ? 1 : 0), 0)
  ])));
  installedContentCountsCache.set(sourceId, counts);
  return counts;
}

function recipeReferenceInstalled(reference) {
  return sourcePresenceById(reference[0]) === true;
}

function ensureSearchRows() {
  if (searchRows) return searchRows;
  const rows = [];
  const byKind = new Map([...VALID_KINDS].map(kind => [kind, []]));
  const bySource = new Map();

  function addRow(kind, typeId, entry) {
    const sourceInfo = sourceForTypeId(typeId);
    const source = sourceInfo.source;
    const aliases = typeof entry?.[3] === "string" ? entry[3] : Array.isArray(entry?.al) ? entry.al.join(" ") : "";
    const displayName = Array.isArray(entry) ? entry[1] : entry?.x ?? entry?.d;
    const localizationKey = Array.isArray(entry)
      ? (typeof entry?.[6] === "string" ? entry[6] : runtimeLocalizationKey(kind, typeId))
      : (entry?.s ?? runtimeLocalizationKey(kind, typeId));
    const spanishAliases = sourceInfo.sourceId === "minecraft"
      ? vanillaSpanishAliases(kind, typeId, localizationKey).join(" ")
      : "";
    const sourceText = source
      ? [sourceInfo.sourceId, source.name, ...(source.aliases ?? []), ...(source.namespaces ?? [])].join(" ")
      : sourceInfo.addonName;
    const row = Object.freeze({
      kind,
      typeId,
      entry,
      sourceId: sourceInfo.sourceId,
      search: normalizeText(`${typeId} ${displayName ?? ""} ${aliases} ${spanishAliases} ${sourceText}`),
      display: normalizeText(cleanDisplay(displayName ?? splitIdentifier(typeId)[1])),
      identifier: normalizeText(splitIdentifier(typeId)[1])
    });
    rows.push(row);
    byKind.get(kind).push(row);
    const sourceList = bySource.get(sourceInfo.sourceId) ?? [];
    sourceList.push(row);
    bySource.set(sourceInfo.sourceId, sourceList);
  }

  for (const kind of VALID_KINDS) {
    const combined = combinedContentForKind(kind);
    for (const [typeId, entry] of Object.entries(combined)) addRow(kind, typeId, entry);
  }
  const vanilla = buildVanillaRuntimeCatalog(ensureInstalledRegistry());
  for (const kind of VALID_KINDS) {
    for (const typeId of vanilla[kind] ?? []) {
      if (contentEntry(kind, typeId)) continue;
      addRow(kind, typeId, vanillaRuntimeEntryFields(kind, typeId, ensureInstalledRegistry()));
    }
  }
  for (const [kind, kindRows] of byKind) byKind.set(kind, Object.freeze(kindRows));
  for (const [sourceId, sourceRows] of bySource) bySource.set(sourceId, Object.freeze(sourceRows));
  searchRows = Object.freeze(rows);
  searchRowsByKind = byKind;
  searchRowsBySource = bySource;
  return searchRows;
}

function searchCandidates(kind, sourceIds) {
  const allRows = ensureSearchRows();
  if (sourceIds) {
    const candidates = [];
    for (const sourceId of sourceIds) candidates.push(...(searchRowsBySource.get(sourceId) ?? []));
    if (!kind) return candidates;
    if (kind === "content") return candidates.filter(row => row.kind !== "entity");
    return candidates.filter(row => row.kind === kind);
  }
  if (!kind) return allRows;
  if (kind === "content") return [...(searchRowsByKind.get("item") ?? []), ...(searchRowsByKind.get("block") ?? [])];
  return searchRowsByKind.get(kind) ?? [];
}

function matchSourceTerm(term) {
  const normalized = normalizeText(term.replace(/^@/, ""));
  const matches = new Set();
  if (!normalized) return matches;
  for (const [sourceId, source] of Object.entries(allSources())) {
    const candidates = [sourceId, source.name, ...(source.aliases ?? []), ...(source.namespaces ?? [])]
      .map(normalizeText);
    if (candidates.some(candidate => candidate.startsWith(normalized))) matches.add(sourceId);
  }
  return matches;
}

function parseSearchQuery(query) {
  const tokens = String(query ?? "").trim().split(/\s+/).filter(Boolean);
  const sourceTokens = tokens.filter(token => token.startsWith("@"));
  const textTokens = tokens
    .filter(token => !token.startsWith("@"))
    .map(normalizeText)
    .filter(token => token && !SEARCH_STOP_WORDS.has(token));
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
  for (const row of searchCandidates(kind, parsed.sourceIds)) {
    const installed = installedState(row.kind, row.typeId);
    if (installedOnly && installed !== true) continue;
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

function decodeUnlockList(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map(row => {
    if (!Array.isArray(row)) return { type: "raw", value: row };
    if (row[0] === "i") return { type: "item", value: row[1], count: typeof row[2] === "number" ? row[2] : 1 };
    if (row[0] === "t") return { type: "tag", value: row[1], count: typeof row[2] === "number" ? row[2] : 1 };
    if (row[0] === "c") return { type: "context", value: row[1] };
    return { type: "raw", value: row[1] };
  });
}

function recipeResults(row) {
  const code = row[1];
  const payload = row[3];
  if (code === "s") return payload[2] ?? [];
  if (code === "l" || code === "f") return payload[1] ?? [];
  if (code === "b" || code === "c") return payload[2] ?? [];
  if (code === "t") return payload[3] ?? [];
  return [];
}

function recipeIngredients(row) {
  const code = row[1];
  const payload = row[3];
  if (code === "s") return (payload[1] ?? []).map(pair => pair[1]);
  if (code === "l") return payload[0] ?? [];
  if (code === "f") return [payload[0]];
  if (code === "b" || code === "c") return [payload[0], payload[1]];
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

function recipeReferences(indexName, typeId, installedOnly) {
  const references = ensureRecipeIndexes()[indexName].get(typeId) ?? [];
  if (!installedOnly) return references;
  if (!installedRecipeReferenceCache) installedRecipeReferenceCache = new Map();
  const key = `${indexName}\u0000${typeId}`;
  if (installedRecipeReferenceCache.has(key)) return installedRecipeReferenceCache.get(key);
  const installed = Object.freeze(references.filter(recipeReferenceInstalled));
  installedRecipeReferenceCache.set(key, installed);
  return installed;
}

const VANILLA_STATION_IDS = Object.freeze({
  crafting_table: "minecraft:crafting_table",
  workbench: "minecraft:crafting_table",
  furnace: "minecraft:furnace",
  smoker: "minecraft:smoker",
  blast_furnace: "minecraft:blast_furnace",
  stonecutter: "minecraft:stonecutter",
  smithing_table: "minecraft:smithing_table",
  brewing_stand: "minecraft:brewing_stand",
  campfire: "minecraft:campfire",
  soul_campfire: "minecraft:soul_campfire"
});

function ensureStationSuffixIndex() {
  if (stationSuffixIndex) return stationSuffixIndex;
  const index = new Map();
  for (const kind of ["block", "item"]) {
    for (const typeId of Object.keys(combinedContentForKind(kind))) {
      const [, identifier] = splitIdentifier(typeId);
      const rows = index.get(identifier) ?? [];
      rows.push(Object.freeze({ kind, typeId }));
      index.set(identifier, rows);
    }
  }
  stationSuffixIndex = index;
  return stationSuffixIndex;
}

function explicitStationDescriptor(sourceId, tag) {
  const row = STATION_CATALOG.sources?.[sourceId]?.[tag];
  if (!Array.isArray(row)) return undefined;
  const [id, kindCode, resolved, resolvedBy, confidence, runtimeKey, catalogKey, fallbackName, contentKind, contentId] = row;
  const kind = kindCode === "b" ? "block" : kindCode === "i" ? "item" : "virtual";
  const source = sourceById(sourceId);
  return {
    tag,
    id,
    kind,
    resolved: resolved === true,
    resolvedBy: resolvedBy ?? "explicit_catalog",
    confidence: Number.isInteger(confidence) ? confidence : 0,
    n: typeof catalogKey === "string" ? catalogKey : undefined,
    d: fallbackName ?? titleCase(tag),
    x: cleanDisplay(fallbackName ?? titleCase(tag)),
    s: typeof runtimeKey === "string" ? runtimeKey : (contentKind && contentId ? runtimeLocalizationKey(contentKind, contentId) : undefined),
    sid: sourceId,
    sk: source ? `wati.source.${sourceId}` : undefined,
    a: source?.name ?? titleCase(sourceId),
    contentRef: contentKind && contentId ? { kind: contentKind, id: contentId } : undefined
  };
}

function stationEntryDescriptor(kind, typeId, tag, resolvedBy, confidence) {
  const fields = entryFields(kind, typeId);
  return {
    tag,
    id: typeId,
    kind,
    resolved: true,
    resolvedBy,
    confidence,
    n: fields.n,
    d: fields.d,
    x: fields.x,
    s: fields.s,
    sid: fields.sid,
    sk: fields.sk,
    a: fields.a
  };
}

function stationDescriptor(sourceId, tags, recipeType) {
  const source = sourceById(sourceId);
  const sourceTags = Array.isArray(tags) ? tags.filter(tag => typeof tag === "string" && tag.length) : [];
  const fallbackTag = recipeType === "f" ? "furnace"
    : (recipeType === "b" || recipeType === "c") ? "brewing_stand"
      : (recipeType === "t" || recipeType === "r") ? "smithing_table"
        : undefined;
  const tag = sourceTags.find(value => value !== "nothing") ?? fallbackTag;
  if (!tag) return { resolved: false, tag: undefined, resolvedBy: "missing", confidence: 0 };

  const explicit = explicitStationDescriptor(sourceId, tag);
  if (explicit) return explicit;

  const vanillaId = VANILLA_STATION_IDS[tag];
  if (vanillaId) return stationEntryDescriptor("block", vanillaId, tag, "vanilla_tag", 3);

  if (tag.includes(":")) {
    for (const kind of ["block", "item"]) {
      if (contentEntry(kind, tag)) return stationEntryDescriptor(kind, tag, tag, "explicit_identifier", 3);
    }
  }

  for (const namespace of source?.namespaces ?? []) {
    const candidate = `${namespace}:${tag}`;
    for (const kind of ["block", "item"]) {
      if (contentEntry(kind, candidate)) return stationEntryDescriptor(kind, candidate, tag, "source_namespace", 3);
    }
  }

  const suffixMatches = ensureStationSuffixIndex().get(tag) ?? [];
  if (suffixMatches.length === 1) {
    const match = suffixMatches[0];
    return stationEntryDescriptor(match.kind, match.typeId, tag, "unique_catalog_suffix", 2);
  }

  return {
    tag,
    resolved: false,
    resolvedBy: suffixMatches.length > 1 ? "ambiguous_catalog_suffix" : "unregistered_tag",
    confidence: 0,
    d: titleCase(tag)
  };
}

function recipeObject(reference) {
  const [sourceId, index] = reference;
  const row = RECIPE_CATALOG.sources[sourceId]?.[index];
  if (!row) return undefined;
  const [id, code, tags, payload, metadata] = row;
  const source = sourceById(sourceId);
  const result = {
    id,
    sourceId,
    sourceKey: source ? `wati.source.${sourceId}` : undefined,
    sourceName: source?.name ?? titleCase(sourceId),
    sourcePresent: sourcePresenceById(sourceId),
    type: RECIPE_TYPE_NAMES[code] ?? code,
    tags,
    group: metadata?.g,
    priority: metadata?.p,
    unlock: metadata?.ul ? decodeUnlockList(metadata.ul) : (metadata?.u ? decodeUnlock(metadata.u) : undefined),
    station: stationDescriptor(sourceId, metadata?.st ? [metadata.st, ...(tags ?? [])] : tags, code)
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
  } else if (code === "b" || code === "c") {
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
  const references = recipeReferences(indexName, request.i, request.x === true);
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

function sourcePresence(sourceId) {
  return sourcePresenceById(sourceId);
}

function ensureSourceRows() {
  if (sourceRowsCache) return sourceRowsCache;
  const rows = Object.entries(allSources()).map(([sourceId, source]) => {
    const present = sourcePresence(sourceId);
    const registered = ensureSourceContentIndex().get(sourceId) ?? emptyKindLists();
    const runtimeContentCounts = Object.freeze(Object.fromEntries([...VALID_KINDS].map(kind => [kind, registered[kind].length])));
    const row = Object.freeze({
      id: sourceId,
      key: isRuntimeProvider(sourceId) ? undefined : `wati.source.${sourceId}`,
      name: source.name,
      aliases: source.aliases,
      namespaces: source.namespaces,
      version: sourceId === "wati" ? PACK_VERSION : source.version,
      packUuid: source.packUuid,
      minEngineVersion: source.minEngineVersion,
      localizationPolicy: source.localizationPolicy,
      primaryLocale: source.primaryLocale,
      exportedLocales: source.exportedLocales,
      sourceCapabilities: source.capabilities,
      detectionConfig: sourceId === "minecraft" ? { ...sourceDetectionDescriptor(sourceId, source), mode: "runtime" } : sourceDetectionDescriptor(sourceId, source),
      contentCounts: runtimeContentCounts,
      runtimeGenerated: sourceId === "minecraft",
      installedContentCounts: installedContentCountsForSource(sourceId),
      recipeCount: source.recipeCount,
      installedRecipeCount: present === true ? (RECIPE_CATALOG.sources[sourceId]?.length ?? 0) : 0,
      present,
      detection: sourcePresenceDetailsById(sourceId),
      searchable: normalizeText(`${sourceId} ${source.name} ${(source.aliases ?? []).join(" ")} ${(source.namespaces ?? []).join(" ")}`)
    });
    return row;
  });
  rows.sort((left, right) => left.name.localeCompare(right.name));
  sourceRowsCache = Object.freeze(rows);
  return sourceRowsCache;
}

function handleSources(request) {
  const query = normalizeText(typeof request.q === "string" ? request.q.slice(0, 64) : "");
  const page = clampInteger(request.p, 0, 100000, 0);
  const pageSize = clampInteger(request.z, 1, 25, 12);
  const installedOnly = request.x === true;
  const matches = ensureSourceRows().filter(row => {
    if (installedOnly && row.present !== true) return false;
    return !query || row.searchable.includes(query);
  });
  const result = paginate(matches, page, pageSize);
  sendCodexResult("wati:sources_result", request, {
    q: query,
    p: result.page,
    z: result.pageSize,
    total: result.total,
    more: result.more,
    items: result.items.map(({ searchable, ...row }) => row)
  });
}

function handleEntry(request) {
  if (!VALID_KINDS.has(request.k) || typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const result = entryFields(request.k, request.i);
  const relatedKinds = [...VALID_KINDS].filter(kind => kind !== request.k && catalogEntryExists(kind, request.i));
  const recipeEligible = request.k === "item" || request.k === "block";
  const indexes = recipeEligible ? ensureRecipeIndexes() : undefined;
  const allRecipeReferences = recipeEligible ? (indexes.byResult.get(request.i) ?? []) : [];
  const allUseReferences = recipeEligible ? (indexes.byIngredient.get(request.i) ?? []) : [];
  const recipeCount = recipeEligible ? recipeReferences("byResult", request.i, true).length : 0;
  const useCount = recipeEligible ? recipeReferences("byIngredient", request.i, true).length : 0;
  sendCodexResult("wati:entry_result", request, {
    k: request.k,
    i: request.i,
    installed: installedState(request.k, request.i),
    recipeCount,
    useCount,
    catalogRecipeCount: allRecipeReferences.length,
    catalogUseCount: allUseReferences.length,
    relatedKinds,
    tagUsesExcluded: recipeEligible,
    ...result
  });
}


function handleAcquisition(request) {
  if (typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const rows = Array.isArray(ACQUISITION_DATA[request.i]) ? ACQUISITION_DATA[request.i] : [];
  sendCodexResult("wati:acquisition_result", request, { i: request.i, total: rows.length, items: rows });
}

function handleKnowledge(request) {
  if (!VALID_KINDS.has(request.k) || typeof request.i !== "string" || request.i.length < 3 || request.i.length > 256) return;
  const entry = entryFields(request.k, request.i);
  const relatedKinds = [...VALID_KINDS].filter(kind => kind !== request.k && catalogEntryExists(kind, request.i));
  const profile = buildKnowledgeProfile(request.k, request.i, {
    entry,
    relatedKinds,
    resolveKind: bestKindForTypeId
  });
  sendCodexResult("wati:knowledge_result", request, profile);
}

function ensureSchemaDiagnostics() {
  if (schemaDiagnosticsCache) return schemaDiagnosticsCache;
  const issues = [];
  if (!schemaIsAccepted("catalog", CATALOG.schema)) issues.push({ code: "unsupported_catalog_schema", value: CATALOG.schema });
  if (!schemaIsAccepted("recipes", RECIPE_CATALOG.schema)) issues.push({ code: "unsupported_recipe_schema", value: RECIPE_CATALOG.schema });
  if (STATION_CATALOG.schema !== 3) issues.push({ code: "unsupported_station_schema", value: STATION_CATALOG.schema });
  if (!CATALOG.sources || typeof CATALOG.sources !== "object") issues.push({ code: "missing_sources" });
  if (!CATALOG.content || typeof CATALOG.content !== "object") issues.push({ code: "missing_content" });
  if (WORLD_CONTENT.schema !== 1) issues.push({ code: "unsupported_world_content_schema", value: WORLD_CONTENT.schema });
  schemaDiagnosticsCache = Object.freeze({
    ok: issues.length === 0,
    issues: Object.freeze(issues),
    active: Object.freeze({
      catalog: CATALOG.schema,
      recipes: RECIPE_CATALOG.schema,
      acquisition: 1,
      knowledge: 2,
      stations: STATION_CATALOG.schema
    }),
    accepted: Object.freeze({
      catalog: WATI_SCHEMA.catalog.accepted,
      recipes: WATI_SCHEMA.recipes.accepted,
      acquisition: WATI_SCHEMA.acquisition.accepted,
      knowledge: WATI_SCHEMA.knowledge.accepted
    })
  });
  return schemaDiagnosticsCache;
}

function handleSchema(request) {
  sendCodexResult("wati:schema_result", request, {
    pack: PACK_VERSION,
    schema: WATI_SCHEMA,
    diagnostics: ensureSchemaDiagnostics()
  });
}

function ensureRuntimeSummary() {
  if (runtimeSummaryCache) return runtimeSummaryCache;
  const sourceRows = ensureSourceRows();
  const contentCounts = Object.fromEntries([...VALID_KINDS].map(kind => [kind, searchRowsByKind?.get(kind)?.length ?? ensureSearchRows().filter(row => row.kind === kind).length]));
  const installedContentCounts = Object.fromEntries([...VALID_KINDS].map(kind => [
    kind,
    sourceRows.reduce((total, source) => total + (source.installedContentCounts?.[kind] ?? 0), 0)
  ]));
  const recipeCount = Object.values(RECIPE_CATALOG.sources).reduce((total, rows) => total + rows.length, 0);
  const installedRecipeCount = sourceRows.reduce((total, source) => total + source.installedRecipeCount, 0);
  runtimeSummaryCache = Object.freeze({
    sourceCount: sourceRows.length,
    installedSourceCount: sourceRows.reduce((total, source) => total + (source.present === true ? 1 : 0), 0),
    unknownSourceCount: sourceRows.reduce((total, source) => total + (source.present === undefined ? 1 : 0), 0),
    namespaceCount: new Set([...Object.keys(CATALOG.addons), ...Object.keys(allNamespaceSources())]).size,
    contentCounts: Object.freeze(contentCounts),
    installedContentCounts: Object.freeze(installedContentCounts),
    recipeCount,
    installedRecipeCount,
    acquisitionEntryCount: Object.keys(ACQUISITION_DATA).length,
    knowledge: knowledgeStats(),
    acquisitionMethodCount: Object.values(ACQUISITION_DATA).reduce((total, rows) => total + (Array.isArray(rows) ? rows.length : 0), 0),
    stationCount: Object.values(STATION_CATALOG.sources ?? {}).reduce((total, rows) => total + Object.keys(rows).length, 0)
  });
  return runtimeSummaryCache;
}

function ensureCatalogDiagnostics() {
  if (catalogDiagnosticsCache) return catalogDiagnosticsCache;
  const sourceIssues = [];
  const stationIssues = [];
  const recipeIssues = [];
  const integrityIssues = [];
  const sourceIds = new Set(Object.keys(allSources()));

  for (const [namespace, sourceId] of Object.entries(allNamespaceSources())) {
    if (!sourceIds.has(sourceId)) integrityIssues.push({ code: "namespace_unknown_source", namespace, sourceId });
  }

  for (const source of ensureSourceRows()) {
    const registeredTotal = [...VALID_KINDS].reduce((total, kind) => total + (source.contentCounts?.[kind] ?? 0), 0);
    if (registeredTotal === 0 && source.id !== "wati") {
      sourceIssues.push({ sourceId: source.id, severity: "info", code: "source_without_detectable_content", detection: source.detection });
    }
    if (source.present === undefined) {
      sourceIssues.push({ sourceId: source.id, severity: "warning", code: "source_presence_unverifiable", detection: source.detection });
    }
  }

  for (const [sourceId, stations] of Object.entries(STATION_CATALOG.sources ?? {})) {
    if (!sourceIds.has(sourceId)) integrityIssues.push({ code: "station_unknown_source", sourceId });
    for (const [tag, row] of Object.entries(stations ?? {})) {
      if (!Array.isArray(row)) {
        stationIssues.push({ sourceId, tag, severity: "error", code: "invalid_station_row" });
        continue;
      }
      const [id, kindCode, resolved, resolvedBy, confidence, runtimeKey, catalogKey, fallbackName, contentKind, contentId] = row;
      if (resolved !== true) {
        stationIssues.push({ sourceId, tag, id, severity: "warning", code: "unresolved_station", resolvedBy, confidence, fallbackName });
      } else if ((confidence ?? 0) < 3) {
        stationIssues.push({ sourceId, tag, id, severity: "info", code: "low_confidence_station", resolvedBy, confidence, fallbackName });
      }
      if (contentKind && contentId && !contentId.startsWith("minecraft:") && !contentEntry(contentKind, contentId)) {
        stationIssues.push({ sourceId, tag, id, severity: "warning", code: "station_content_reference_missing", contentKind, contentId, runtimeKey, catalogKey });
      }
      if (!["b", "i", "v"].includes(kindCode)) {
        stationIssues.push({ sourceId, tag, id, severity: "error", code: "invalid_station_kind", kindCode });
      }
    }
  }

  for (const [sourceId, rows] of Object.entries(RECIPE_CATALOG.sources ?? {})) {
    if (!sourceIds.has(sourceId)) integrityIssues.push({ code: "recipes_unknown_source", sourceId });
    const ids = new Set();
    for (const row of rows) {
      const recipeId = row?.[0];
      if (typeof recipeId !== "string") {
        recipeIssues.push({ sourceId, severity: "error", code: "recipe_without_identifier" });
      } else if (ids.has(recipeId)) {
        recipeIssues.push({ sourceId, recipeId, severity: "warning", code: "duplicate_recipe_identifier" });
      } else {
        ids.add(recipeId);
      }
      if (!RECIPE_TYPE_NAMES[row?.[1]]) recipeIssues.push({ sourceId, recipeId, severity: "error", code: "unknown_recipe_type", value: row?.[1] });
    }
  }

  const severityOrder = Object.freeze({ error: 0, warning: 1, info: 2 });
  const sortIssues = issues => issues.sort((left, right) =>
    (severityOrder[left.severity] ?? 0) - (severityOrder[right.severity] ?? 0) ||
    String(left.sourceId ?? "").localeCompare(String(right.sourceId ?? "")) ||
    String(left.code ?? "").localeCompare(String(right.code ?? ""))
  );
  sortIssues(sourceIssues);
  sortIssues(stationIssues);
  sortIssues(recipeIssues);
  sortIssues(integrityIssues);
  catalogDiagnosticsCache = Object.freeze({
    ok: ![...sourceIssues, ...stationIssues, ...recipeIssues, ...integrityIssues].some(issue => issue.severity === "error" || (!issue.severity && issue.code)),
    counts: Object.freeze({
      sources: sourceIssues.length,
      stations: stationIssues.length,
      recipes: recipeIssues.length,
      integrity: integrityIssues.length
    }),
    sources: Object.freeze(sourceIssues),
    stations: Object.freeze(stationIssues),
    recipes: Object.freeze(recipeIssues),
    integrity: Object.freeze(integrityIssues)
  });
  return catalogDiagnosticsCache;
}

function cacheDiagnostics() {
  return {
    installedRegistry: installedRegistry ? {
      items: installedRegistry.items.size,
      blocks: installedRegistry.blocks.size,
      entities: installedRegistry.entities.size,
      biomes: installedRegistry.biomes.size,
      namespaces: installedRegistry.namespaces.size
    } : false,
    searchRows: searchRows?.length ?? 0,
    searchKinds: searchRowsByKind?.size ?? 0,
    searchSources: searchRowsBySource?.size ?? 0,
    recipeIndexes: recipeIndexes ? {
      results: recipeIndexes.byResult.size,
      ingredients: recipeIndexes.byIngredient.size
    } : false,
    installedRecipeReferences: installedRecipeReferenceCache?.size ?? 0,
    sourceContentIndex: sourceContentIndex?.size ?? 0,
    sourcePresence: sourcePresenceCache?.size ?? 0,
    installedContentCounts: installedContentCountsCache?.size ?? 0,
    sourceRows: sourceRowsCache?.length ?? 0,
    stationSuffixes: stationSuffixIndex?.size ?? 0,
    runtimeSummary: Boolean(runtimeSummaryCache),
    schemaDiagnostics: Boolean(schemaDiagnosticsCache),
    catalogDiagnostics: Boolean(catalogDiagnosticsCache),
    runtimeProviders: runtimeProviderStats()
  };
}

function handleDiagnostics(request) {
  const section = ["summary", "sources", "stations", "recipes", "integrity", "caches"].includes(request.s) ? request.s : "summary";
  const diagnostics = ensureCatalogDiagnostics();
  if (section === "summary") {
    sendCodexResult("wati:diagnostics_result", request, {
      section,
      ok: diagnostics.ok && ensureSchemaDiagnostics().ok,
      schema: ensureSchemaDiagnostics(),
      catalog: { ok: diagnostics.ok, counts: diagnostics.counts },
      runtime: ensureRuntimeSummary(),
      caches: cacheDiagnostics()
    });
    return;
  }
  if (section === "caches") {
    sendCodexResult("wati:diagnostics_result", request, { section, caches: cacheDiagnostics() });
    return;
  }
  const page = clampInteger(request.p, 0, 100000, 0);
  const pageSize = clampInteger(request.z, 1, 25, 12);
  const result = paginate(diagnostics[section] ?? [], page, pageSize);
  sendCodexResult("wati:diagnostics_result", request, {
    section,
    p: result.page,
    z: result.pageSize,
    total: result.total,
    more: result.more,
    items: result.items
  });
}

function handleCapabilities(request) {
  const registry = ensureInstalledRegistry();
  const summary = ensureRuntimeSummary();
  sendCodexResult("wati:capabilities_result", request, {
    pack: PACK_VERSION,
    schemaVersion: WATI_SCHEMA.version,
    supportedCodexProtocols: SUPPORTED_CODEX_PROTOCOLS,
    schemaDiagnostics: ensureSchemaDiagnostics(),
    catalogDiagnostics: { available: true, version: CAPABILITIES.catalogDiagnostics },
    catalogSchema: CATALOG.schema,
    recipeSchema: RECIPE_CATALOG.schema,
    capabilities: CAPABILITIES,
    ...summary,
    detectionErrors: registry.errors,
    compiler: CATALOG.compiler
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
  if (
    event.id === "wati:provider_begin"
    || event.id === "wati:provider_chunk"
    || event.id === "wati:provider_commit"
  ) {
    if (typeof event.message !== "string" || event.message.length > 8192) return;
    const providerRequest = parseMessage(event.message);
    const providerResult = handleProviderRequest(event.id, providerRequest, ALL_NAMESPACE_SOURCES);
    send("wati:provider_result", providerResult);
    if (providerResult.ok === true && providerResult.phase === "commit") {
      invalidateProviderDerivedCaches();
      console.info(`[WATI Core] Proveedor runtime ${providerResult.source} registrado con ${providerResult.entries} entradas.`);
    }
    return;
  }
  const request = parseMessage(event.message);
  if (!validCodexRequest(request)) return;
  if (event.id === "wati:schema") handleSchema(request);
  else if (event.id === "wati:capabilities") handleCapabilities(request);
  else if (event.id === "wati:sources") handleSources(request);
  else if (event.id === "wati:search") handleSearch(request);
  else if (event.id === "wati:entry") handleEntry(request);
  else if (event.id === "wati:recipes") handleRecipeList("wati:recipes_result", request, "byResult");
  else if (event.id === "wati:uses") handleRecipeList("wati:uses_result", request, "byIngredient");
  else if (event.id === "wati:acquisition") handleAcquisition(request);
  else if (event.id === "wati:knowledge") handleKnowledge(request);
  else if (event.id === "wati:diagnostics" && request.v >= 3) handleDiagnostics(request);
}, { namespaces: ["wati"] });

system.run(() => {
  const staticContentCounts = Object.values(CATALOG.content).map(entries => Object.keys(entries).length);
  const recipeCount = Object.values(RECIPE_CATALOG.sources).reduce((total, rows) => total + rows.length, 0);
  send("wati:ready", {
    v: LOOKUP_PROTOCOL_VERSION,
    p: PACK_VERSION,
    cv: 2,
    cvc: CODEX_PROTOCOL_VERSION,
    cvs: SUPPORTED_CODEX_PROTOCOLS,
    sv: WATI_SCHEMA.version,
    capabilities: CAPABILITIES
  });
  send("wati:provider_discover", {
    v: PROVIDER_PROTOCOL_VERSION,
    core: PACK_VERSION
  });
  const schemaDiagnostics = ensureSchemaDiagnostics();
  if (!schemaDiagnostics.ok) console.warn(`[WATI Core] Se detectaron ${schemaDiagnostics.issues.length} problemas de esquema.`);
  const kStats = knowledgeStats();
  console.info(`[WATI Core] v${PACK_VERSION} (Schema ${WATI_SCHEMA.version}) activa: ${staticContentCounts.reduce((a, b) => a + b, 0)} IDs de add-ons, ${recipeCount} recetas, ${Object.keys(ACQUISITION_DATA).length} perfiles de obtención y Knowledge Schema ${kStats.schema}.`);
});
