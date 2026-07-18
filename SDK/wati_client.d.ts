import type { RawMessage } from "@minecraft/server";

export type WatiKind = "entity" | "block" | "item";

export interface WatiDescriptor {
  readonly found: boolean;
  readonly kind: WatiKind;
  readonly typeId: string;
  readonly nameKey?: string;
  readonly fallbackName: string;
  readonly preferWati: boolean;
  readonly addonKey?: string;
  readonly addonName: string;
}

export interface WatiClient {
  resolve(kind: WatiKind, typeId: string): WatiDescriptor;
  warm(kind: WatiKind, typeId: string): WatiDescriptor;
  nameMessage(
    kind: WatiKind,
    typeId: string,
    legacyKey?: string,
    options?: { readonly preferSource?: boolean }
  ): RawMessage;
  addonMessage(kind: WatiKind, typeId: string): RawMessage;
  isReady(): boolean;
  clearCache(): void;
}

export function createWatiClient(consumerId: string): WatiClient;
