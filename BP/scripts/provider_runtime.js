// WATI Runtime Provider Protocol v1.
//
// This module deliberately has no @minecraft/server dependency so its
// validation and transactional registry can be tested outside the game.

export const PROVIDER_PROTOCOL_VERSION = 1;
export const PROVIDER_KINDS = Object.freeze([
  "item",
  "block",
  "entity",
  "biome",
  "ecosystem",
  "structure"
]);

const VALID_KINDS = new Set(PROVIDER_KINDS);
const RESERVED_NAMESPACES = new Set(["minecraft", "wati"]);
const TOKEN_PATTERN = /^[a-z0-9_.-]{1,64}$/i;
const NAMESPACE_PATTERN = /^[a-z0-9_.-]{1,64}$/;
const IDENTIFIER_PATTERN = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PROVIDERS = 64;
const MAX_OPEN_TRANSACTIONS = 32;
const MAX_ENTRIES_PER_PROVIDER = 1024;
const MAX_ENTRIES_PER_CHUNK = 32;
const MAX_DESCRIPTION_HINT_LENGTH = 320;

export const PROVIDER_SOURCES = Object.create(null);
export const PROVIDER_NAMESPACE_SOURCES = Object.create(null);
export const PROVIDER_CONTENT = Object.fromEntries(
  PROVIDER_KINDS.map(kind => [kind, Object.create(null)])
);

const transactions = new Map();
const providers = new Map();
let revision = 0;

function cleanString(value, maximum, required = false) {
  if (typeof value !== "string") return required ? undefined : "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  if ((required && !cleaned) || cleaned.length > maximum) return undefined;
  return cleaned;
}

function cleanStringList(value, maximumItems, maximumLength, pattern) {
  if (!Array.isArray(value) || value.length > maximumItems) return undefined;
  const result = [];
  const seen = new Set();
  for (const raw of value) {
    const cleaned = cleanString(raw, maximumLength, true);
    if (!cleaned || (pattern && !pattern.test(cleaned)) || seen.has(cleaned)) return undefined;
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}

function validateStringList(value, field, maximumItems, maximumLength, pattern) {
  if (!Array.isArray(value)) return { ok: false, field, reason: "not_array" };
  if (value.length > maximumItems) return { ok: false, field, reason: "too_many_items", maximum: maximumItems };
  const result = [];
  const seen = new Set();
  for (let index = 0; index < value.length; index++) {
    const raw = value[index];
    if (typeof raw !== "string") return { ok: false, field, fieldIndex: index, reason: "not_string" };
    const cleaned = raw.replace(/\s+/g, " ").trim();
    if (!cleaned) return { ok: false, field, fieldIndex: index, reason: "empty" };
    if (cleaned.length > maximumLength) {
      return { ok: false, field, fieldIndex: index, reason: "too_long", maximum: maximumLength, actual: cleaned.length };
    }
    if (pattern && !pattern.test(cleaned)) return { ok: false, field, fieldIndex: index, reason: "invalid_format" };
    if (seen.has(cleaned)) return { ok: false, field, fieldIndex: index, reason: "duplicate" };
    seen.add(cleaned);
    result.push(cleaned);
  }
  return { ok: true, value: result };
}

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.\/+\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[a-z]/g, letter => letter.toUpperCase());
}

function result(request, phase, ok, code, extra = {}) {
  return {
    v: PROVIDER_PROTOCOL_VERSION,
    c: request?.c,
    r: request?.r,
    t: request?.t,
    phase,
    ok,
    code,
    ...extra
  };
}

function validEnvelope(request) {
  return request?.v === PROVIDER_PROTOCOL_VERSION
    && typeof request.c === "string" && TOKEN_PATTERN.test(request.c)
    && typeof request.r === "string" && TOKEN_PATTERN.test(request.r)
    && (request.t === undefined || (typeof request.t === "string" && TOKEN_PATTERN.test(request.t)));
}

function normalizeSource(providerId, raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const name = cleanString(raw.name, 96, true);
  const version = cleanString(raw.version, 32, true);
  const namespaces = cleanStringList(raw.namespaces, 8, 64, NAMESPACE_PATTERN);
  const aliases = cleanStringList(raw.aliases ?? [], 16, 64);
  const capabilities = cleanStringList(raw.capabilities ?? ["content"], 16, 64, TOKEN_PATTERN);
  if (!name || !version || !namespaces?.length || !aliases || !capabilities) return undefined;
  if (namespaces.some(namespace => RESERVED_NAMESPACES.has(namespace))) return undefined;
  if (raw.packUuid !== undefined && (typeof raw.packUuid !== "string" || !UUID_PATTERN.test(raw.packUuid))) return undefined;
  if (
    raw.minEngineVersion !== undefined
    && (!Array.isArray(raw.minEngineVersion)
      || raw.minEngineVersion.length !== 3
      || raw.minEngineVersion.some(part => !Number.isInteger(part) || part < 0))
  ) return undefined;
  return Object.freeze({
    name,
    aliases: Object.freeze(aliases),
    namespaces: Object.freeze(namespaces),
    version,
    packUuid: raw.packUuid,
    minEngineVersion: raw.minEngineVersion ? Object.freeze([...raw.minEngineVersion]) : undefined,
    capabilities: Object.freeze(capabilities),
    homepage: cleanString(raw.homepage, 256) || undefined,
    author: cleanString(raw.author, 96) || undefined,
    runtimeProvider: true,
    providerProtocol: PROVIDER_PROTOCOL_VERSION,
    detection: Object.freeze({
      mode: "provider",
      namespaces: Object.freeze(namespaces),
      probes: Object.freeze([]),
      hiddenByDefault: false
    }),
    providerId
  });
}

function normalizeEntry(raw, allowedNamespaces) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, field: "entry", reason: "not_object" };
  }
  const kind = raw.kind ?? raw.k;
  const typeId = raw.id ?? raw.i;
  if (!VALID_KINDS.has(kind)) return { ok: false, field: "kind", reason: "unsupported_kind" };
  if (typeof typeId !== "string") return { ok: false, field: "id", reason: "not_string" };
  if (typeId.length > 256) return { ok: false, field: "id", reason: "too_long", maximum: 256, actual: typeId.length };
  if (!IDENTIFIER_PATTERN.test(typeId)) return { ok: false, field: "id", reason: "invalid_identifier", entryId: typeId };

  const namespace = typeId.slice(0, typeId.indexOf(":"));
  if (!allowedNamespaces.has(namespace)) {
    return { ok: false, field: "id", reason: "namespace_not_declared", entryId: typeId, namespace };
  }

  const fallbackName = cleanString(raw.fallbackName ?? raw.d, 160)
    || titleCase(typeId.slice(typeId.indexOf(":") + 1))
    || "Unknown Content";
  const localizationKey = cleanString(raw.localizationKey ?? raw.s, 192) || undefined;

  const aliases = validateStringList(raw.aliases ?? raw.al ?? [], "aliases", 24, 96);
  if (!aliases.ok) return { ...aliases, entryId: typeId };
  const descriptionHints = validateStringList(
    raw.descriptionHints ?? raw.dh ?? [],
    "descriptionHints",
    16,
    MAX_DESCRIPTION_HINT_LENGTH
  );
  if (!descriptionHints.ok) return { ...descriptionHints, entryId: typeId };

  const entry = Object.freeze({
    d: fallbackName,
    x: fallbackName,
    s: localizationKey,
    o: raw.preferWati === true || raw.o === true,
    al: aliases.value.length ? Object.freeze(aliases.value) : undefined,
    cat: cleanString(raw.category ?? raw.cat, 96) || undefined,
    grp: cleanString(raw.group ?? raw.grp, 96) || undefined,
    itk: cleanString(raw.textureKey ?? raw.itk, 160) || undefined,
    itp: cleanString(raw.texturePath ?? raw.itp, 256) || undefined,
    dh: descriptionHints.value.length ? Object.freeze(descriptionHints.value) : undefined,
    dim: cleanString(raw.dimension ?? raw.dim, 128) || undefined,
    summary: cleanString(raw.summary, 320) || undefined,
    sn: cleanString(raw.summaryKey ?? raw.sn, 192) || undefined,
    provider: true
  });
  return { ok: true, value: Object.freeze({ kind, typeId, entry }) };
}

function namespaceConflict(providerId, namespaces, staticNamespaceSources) {
  for (const namespace of namespaces) {
    const runtimeOwner = PROVIDER_NAMESPACE_SOURCES[namespace];
    if (runtimeOwner && runtimeOwner !== providerId) return { namespace, owner: runtimeOwner };
    const staticOwner = staticNamespaceSources?.[namespace];
    if (staticOwner && staticOwner !== providerId) return { namespace, owner: staticOwner };
  }
  return undefined;
}

function transactionMatches(request, transaction) {
  if (!transaction) return false;
  if (transaction.token === undefined || request.t === undefined) return true;
  return transaction.token === request.t;
}

function abortTransaction(transaction, code, details = {}) {
  transaction.failure = Object.freeze({
    code,
    details: Object.freeze({ ...details })
  });
}

function begin(request, staticNamespaceSources) {
  if (!validEnvelope(request)) return result(request, "begin", false, "invalid_envelope");
  const existing = transactions.get(request.c);
  if (existing) {
    if (transactionMatches(request, existing) && request.t !== undefined) {
      return result(request, "begin", true, "accepted", { resumed: true, namespaces: existing.source.namespaces });
    }
    return result(request, "begin", false, "transaction_in_progress");
  }
  if (transactions.size >= MAX_OPEN_TRANSACTIONS) return result(request, "begin", false, "too_many_open_transactions");
  if (providers.size >= MAX_PROVIDERS && !providers.has(request.c)) {
    return result(request, "begin", false, "provider_limit_reached");
  }
  const source = normalizeSource(request.c, request.source);
  if (!source) return result(request, "begin", false, "invalid_source");
  const conflict = namespaceConflict(request.c, source.namespaces, staticNamespaceSources);
  if (conflict) return result(request, "begin", false, "namespace_conflict", conflict);
  transactions.set(request.c, {
    source,
    token: request.t,
    entries: new Map(),
    startedAt: Date.now(),
    failure: undefined
  });
  return result(request, "begin", true, "accepted", { namespaces: source.namespaces });
}

function chunk(request) {
  if (!validEnvelope(request)) return result(request, "chunk", false, "invalid_envelope");
  const transaction = transactions.get(request.c);
  if (!transaction) return result(request, "chunk", false, "transaction_not_found");
  if (!transactionMatches(request, transaction)) return result(request, "chunk", false, "transaction_mismatch");
  if (transaction.failure) {
    return result(request, "chunk", false, "transaction_aborted", {
      causeCode: transaction.failure.code,
      ...transaction.failure.details
    });
  }
  if (!Array.isArray(request.entries) || request.entries.length < 1 || request.entries.length > MAX_ENTRIES_PER_CHUNK) {
    abortTransaction(transaction, "invalid_chunk_size", { maximum: MAX_ENTRIES_PER_CHUNK });
    return result(request, "chunk", false, "invalid_chunk_size", { maximum: MAX_ENTRIES_PER_CHUNK });
  }
  const allowedNamespaces = new Set(transaction.source.namespaces);
  const normalized = [];
  for (let entryIndex = 0; entryIndex < request.entries.length; entryIndex++) {
    const validation = normalizeEntry(request.entries[entryIndex], allowedNamespaces);
    if (!validation.ok) {
      const details = {
        entryIndex,
        entryId: validation.entryId,
        field: validation.field,
        fieldIndex: validation.fieldIndex,
        reason: validation.reason,
        maximum: validation.maximum,
        actual: validation.actual,
        namespace: validation.namespace
      };
      abortTransaction(transaction, "invalid_entry", details);
      return result(request, "chunk", false, "invalid_entry", details);
    }
    normalized.push(validation.value);
  }
  const projected = new Set(transaction.entries.keys());
  for (const entry of normalized) projected.add(`${entry.kind} ${entry.typeId}`);
  if (projected.size > MAX_ENTRIES_PER_PROVIDER) {
    abortTransaction(transaction, "entry_limit_reached", { maximum: MAX_ENTRIES_PER_PROVIDER });
    return result(request, "chunk", false, "entry_limit_reached", { maximum: MAX_ENTRIES_PER_PROVIDER });
  }
  for (const entry of normalized) transaction.entries.set(`${entry.kind} ${entry.typeId}`, entry);
  return result(request, "chunk", true, "accepted", {
    accepted: normalized.length,
    total: transaction.entries.size
  });
}

function removeProviderContent(providerId) {
  const previous = providers.get(providerId);
  if (!previous) return;
  for (const { kind, typeId } of previous.entries) delete PROVIDER_CONTENT[kind][typeId];
  for (const namespace of previous.source.namespaces) {
    if (PROVIDER_NAMESPACE_SOURCES[namespace] === providerId) delete PROVIDER_NAMESPACE_SOURCES[namespace];
  }
}

function commit(request, staticNamespaceSources) {
  if (!validEnvelope(request)) return result(request, "commit", false, "invalid_envelope");
  const transaction = transactions.get(request.c);
  if (!transaction) return result(request, "commit", false, "transaction_not_found");
  if (!transactionMatches(request, transaction)) return result(request, "commit", false, "transaction_mismatch");
  if (transaction.failure) {
    transactions.delete(request.c);
    return result(request, "commit", false, "transaction_aborted", {
      causeCode: transaction.failure.code,
      ...(transaction.failure.details ?? {})
    });
  }
  const conflict = namespaceConflict(request.c, transaction.source.namespaces, staticNamespaceSources);
  if (conflict) {
    transactions.delete(request.c);
    return result(request, "commit", false, "namespace_conflict", conflict);
  }

  removeProviderContent(request.c);
  const entries = Object.freeze([...transaction.entries.values()]);
  PROVIDER_SOURCES[request.c] = transaction.source;
  for (const namespace of transaction.source.namespaces) PROVIDER_NAMESPACE_SOURCES[namespace] = request.c;
  for (const { kind, typeId, entry } of entries) PROVIDER_CONTENT[kind][typeId] = entry;
  providers.set(request.c, Object.freeze({ source: transaction.source, entries }));
  transactions.delete(request.c);
  revision++;
  return result(request, "commit", true, "registered", {
    source: request.c,
    entries: entries.length,
    revision
  });
}

export function handleProviderRequest(eventId, request, staticNamespaceSources = {}) {
  if (eventId === "wati:provider_begin") return begin(request, staticNamespaceSources);
  if (eventId === "wati:provider_chunk") return chunk(request);
  if (eventId === "wati:provider_commit") return commit(request, staticNamespaceSources);
  return result(request, "unknown", false, "unknown_event");
}

export function isRuntimeProvider(sourceId) {
  return providers.has(sourceId);
}

export function runtimeProviderStats() {
  let entryCount = 0;
  for (const provider of providers.values()) entryCount += provider.entries.length;
  return Object.freeze({
    protocol: PROVIDER_PROTOCOL_VERSION,
    providers: providers.size,
    entries: entryCount,
    openTransactions: transactions.size,
    revision
  });
}

export function resetRuntimeProvidersForTests() {
  for (const kind of PROVIDER_KINDS) {
    for (const key of Object.keys(PROVIDER_CONTENT[kind])) delete PROVIDER_CONTENT[kind][key];
  }
  for (const key of Object.keys(PROVIDER_SOURCES)) delete PROVIDER_SOURCES[key];
  for (const key of Object.keys(PROVIDER_NAMESPACE_SOURCES)) delete PROVIDER_NAMESPACE_SOURCES[key];
  transactions.clear();
  providers.clear();
  revision = 0;
}
