// WATI Core v3.1.0: presentation-only aliases owned by add-ons were migrated out of Core.
// Alex's Mobs and Colourful Portals should register these through WATI Lens Provider v1.
// Core keeps this module/API so existing lookup code remains source-compatible.
export const DISPLAY_NAME_REDIRECTS = Object.freeze({
  entity: Object.freeze({}),
  block: Object.freeze({})
});

export function displayNameRedirect(kind, typeId) {
  return DISPLAY_NAME_REDIRECTS[kind]?.[typeId];
}
