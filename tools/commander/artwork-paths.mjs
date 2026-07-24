import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const FALLBACK_SPECIES = "icons/svg/pawprint.svg";
const FALLBACK_ITEM = "icons/svg/item-bag.svg";

const DEFAULT_ICONS = Object.freeze({
  ability: "systems/ptu/css/images/icons/ability_icon.png",
  capability: "systems/ptu/css/images/icons/capability_icon.png",
  edge: "systems/ptu/css/images/icons/edge_icon.png",
  feat: "systems/ptu/css/images/icons/feat_icon.png",
  item: "systems/ptu/css/images/icons/item_icon.png",
  movePhysical: "systems/ptu/css/images/categories/Physical.png",
  moveSpecial: "systems/ptu/css/images/categories/Special.png",
  moveStatus: "systems/ptu/css/images/categories/Status.png",
  pokeball: "systems/ptu/css/images/icons/item_icon.png",
  pokeedge: "systems/ptu/css/images/icons/poke_edge_icon.png",
  reference: "icons/svg/book.svg",
  spirit: "icons/svg/aura.svg"
});

function existsSystemPath(systemPath) {
  if (!systemPath || !systemPath.startsWith("systems/ptu/")) return false;
  const relative = systemPath.slice("systems/ptu/".length);
  return fs.existsSync(path.join(REPO_ROOT, relative));
}

function hasUsableImage(value) {
  const text = String(value ?? "").trim();
  return Boolean(text) && ![FALLBACK_ITEM, "icons/svg/mystery-man.svg"].includes(text);
}

function padDex(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return "";
  return String(number).padStart(3, "0");
}

function normalizeFormSegment(value) {
  return String(value ?? "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function candidateFormSegments(record = {}) {
  const raw = [record.formSlug, record.formKind, record.slug]
    .filter(Boolean)
    .map(normalizeFormSegment)
    .filter(Boolean);
  const candidates = new Set();

  for (const segment of raw) {
    if (!segment || segment === "base") continue;
    candidates.add(segment);
    candidates.add(segment.replace(/-/g, "_"));

    if (segment.includes("alola")) candidates.add("alolan");
    if (segment.includes("galar")) candidates.add("galarian");
    if (segment.includes("hisui")) candidates.add("hisuian");
    if (segment.includes("paldea")) candidates.add("paldean");
    if (segment.includes("gmax") || segment.includes("gigantamax")) candidates.add("gmax");
    if (segment.includes("primal")) candidates.add("primal");

    if (segment.includes("mega")) {
      candidates.add("MEGA");
      if (segment.endsWith("x") || segment.includes("mega-x")) candidates.add("MEGA_X");
      if (segment.endsWith("y") || segment.includes("mega-y")) candidates.add("MEGA_Y");
    }
  }

  return [...candidates];
}

function spriteCandidates(record = {}) {
  const dex = padDex(record.nationalDex ?? record.number);
  if (!dex) return [];

  const candidates = [`${dex}.webp`];
  for (const form of candidateFormSegments(record)) {
    candidates.push(`${dex}_${form}.webp`);
    candidates.push(`${dex}_${String(form).toLowerCase()}.webp`);
    candidates.push(`${dex}_${String(form).toUpperCase()}.webp`);
  }
  return [...new Set(candidates)];
}

function firstExistingSystemPath(paths) {
  for (const systemPath of paths) if (existsSystemPath(systemPath)) return systemPath;
  return "";
}

export function resolveSpeciesArtwork(record = {}) {
  const explicitPortrait = record.artwork?.portrait ?? record.img;
  const explicitToken = record.artwork?.token ?? explicitPortrait;
  if (hasUsableImage(explicitPortrait)) {
    return {
      img: explicitPortrait,
      portrait: explicitPortrait,
      token: hasUsableImage(explicitToken) ? explicitToken : explicitPortrait,
      source: "record"
    };
  }

  const candidatePaths = spriteCandidates(record).map(file => `systems/ptu/images/sprites/${file}`);
  const sprite = firstExistingSystemPath(candidatePaths);
  if (sprite) return { img: sprite, portrait: sprite, token: sprite, source: "sprites" };
  return { img: FALLBACK_SPECIES, portrait: FALLBACK_SPECIES, token: FALLBACK_SPECIES, source: "fallback" };
}

export function defaultItemImage(type, record = {}) {
  if (hasUsableImage(record.artwork?.portrait ?? record.img)) return record.artwork?.portrait ?? record.img;

  if (type === "move") {
    const category = String(record.category ?? record.commanderCategory ?? "status").toLowerCase();
    if (category === "physical") return DEFAULT_ICONS.movePhysical;
    if (category === "special") return DEFAULT_ICONS.moveSpecial;
    return DEFAULT_ICONS.moveStatus;
  }

  if (type === "ability") return DEFAULT_ICONS.ability;
  if (type === "capability") return DEFAULT_ICONS.capability;
  if (type === "edge") return DEFAULT_ICONS.edge;
  if (type === "feat") return DEFAULT_ICONS.feat;
  if (type === "pokeedge") return DEFAULT_ICONS.pokeedge;
  if (type === "pokeball") return DEFAULT_ICONS.pokeball;
  if (type === "reference") return DEFAULT_ICONS.reference;
  if (type === "spirit-action") return DEFAULT_ICONS.spirit;
  return DEFAULT_ICONS.item ?? FALLBACK_ITEM;
}
