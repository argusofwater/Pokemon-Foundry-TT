export const SOURCE_ROOT = new URL("../../data-src/", import.meta.url);
export const BUILD_ROOT = new URL("../../build/commander-compendiums/", import.meta.url);

export const CONTENT_TYPES = Object.freeze({
  species: { directory: "species", documentType: "species", pack: "species" },
  forms: { directory: "forms", documentType: "form", pack: "species" },
  moves: { directory: "moves", documentType: "move", pack: "moves" },
  abilities: { directory: "abilities", documentType: "ability", pack: "abilities" },
  items: { directory: "items", documentType: "item", pack: "items" },
  talents: { directory: "talents", documentType: "talent", pack: "talents" },
  evolutions: { directory: "evolutions", documentType: "evolution", pack: null },
  compatibility: { directory: "compatibility", documentType: "compatibility", pack: null }
});

export const EXCLUDED_TAGS = new Set([
  "dynamax",
  "gigantamax",
  "max-move",
  "gmax-move",
  "dynamax-only",
  "gigantamax-only"
]);

export const EXCLUDED_FAMILIES = new Set(["dynamax", "gigantamax"]);

export const SCHEMA_VERSION = 1;
