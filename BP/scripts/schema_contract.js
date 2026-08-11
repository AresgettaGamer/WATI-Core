// WATI 3 stable contract. Introduced during the v2.2.0 development line.
// This file describes the public protocol and the schemas accepted by Core.

export const CORE_PACK_VERSION = "3.0.0";
export const CORE_BP_UUID = "fd4723b8-a9f9-4433-86f3-1ce65c33a9d1";
export const LOOKUP_PROTOCOL_VERSION = 1;
export const CODEX_PROTOCOL_VERSION = 3;
export const SUPPORTED_CODEX_PROTOCOLS = Object.freeze([2, 3]);

export const WATI_SCHEMA = Object.freeze({
  version: 3,
  status: "stable",
  catalog: Object.freeze({
    current: 3,
    accepted: Object.freeze([2, 3]),
    entryKinds: Object.freeze(["item", "block", "entity", "biome", "structure", "ecosystem", "station"])
  }),
  recipes: Object.freeze({
    current: 3,
    accepted: Object.freeze([2, 3])
  }),
  acquisition: Object.freeze({
    current: 2,
    accepted: Object.freeze([1, 2])
  }),
  knowledge: Object.freeze({
    current: 1,
    accepted: Object.freeze([1])
  }),
  protocol: Object.freeze({
    lookup: LOOKUP_PROTOCOL_VERSION,
    codex: Object.freeze({
      current: CODEX_PROTOCOL_VERSION,
      supported: SUPPORTED_CODEX_PROTOCOLS
    }),
    provider: 1
  }),
  ownership: Object.freeze({
    core: Object.freeze([
      "sources",
      "content",
      "recipes",
      "stations",
      "biomes",
      "structures",
      "ecosystems",
      "discoveryDefinitions",
      "knowledgeProfiles",
      "lootProfiles",
      "habitats",
      "worldContents",
      "constructionPatterns"
    ]),
    consumer: Object.freeze([
      "playerProfiles",
      "discoveries",
      "expeditions",
      "routes",
      "locations",
      "worldKnowledge",
      "serverPolicy"
    ])
  }),
  sourceDetectionModes: Object.freeze(["content", "namespace", "pack", "core", "manual", "runtime", "provider"]),
  localizationFallbackOrder: Object.freeze([
    "runtimeLocalizationKey",
    "catalogTranslationKey",
    "localizedFallback",
    "sourceFallback",
    "generatedIdentifierName"
  ])
});

export function supportsCodexProtocol(version) {
  return SUPPORTED_CODEX_PROTOCOLS.includes(version);
}

export function schemaIsAccepted(kind, version) {
  const descriptor = WATI_SCHEMA[kind];
  return Boolean(descriptor && descriptor.accepted.includes(version));
}
