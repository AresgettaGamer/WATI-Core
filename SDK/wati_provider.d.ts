export type WatiProviderKind =
  | "item"
  | "block"
  | "entity"
  | "biome"
  | "ecosystem"
  | "structure";

export interface WatiProviderSource {
  name: string;
  version: string;
  namespaces: string[];
  aliases?: string[];
  packUuid?: string;
  minEngineVersion?: [number, number, number];
  capabilities?: string[];
  homepage?: string;
  author?: string;
}

export interface WatiProviderEntry {
  kind: WatiProviderKind;
  id: string;
  fallbackName?: string;
  localizationKey?: string;
  aliases?: string[];
  category?: string;
  group?: string;
  preferWati?: boolean;
  textureKey?: string;
  texturePath?: string;
  descriptionHints?: string[];
  dimension?: string;
  summary?: string;
  summaryKey?: string;
}

export interface WatiProviderDefinition {
  id: string;
  source: WatiProviderSource;
  entries: WatiProviderEntry[];
}

export interface WatiProvider {
  register(): boolean;
  isAccepted(): boolean;
  isRegistering(): boolean;
  lastResult(): Readonly<Record<string, unknown>> | undefined;
  readonly protocolVersion: 1;
}

export function createWatiProvider(definition: WatiProviderDefinition): WatiProvider;
