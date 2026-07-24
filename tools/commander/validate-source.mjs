import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_TYPES, EXCLUDED_FAMILIES, EXCLUDED_TAGS, SCHEMA_VERSION, SOURCE_ROOT } from "./compendium-config.mjs";
import { asArray, readJsonFile, sluggify, unique, walkJsonFiles } from "./utils.mjs";

const TYPE_VALUES = new Set(["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"]);
const MOVE_CATEGORIES = new Set(["physical", "special", "status"]);
const FORM_FAMILIES = new Set(["mega", "primal", "battle", "stance", "weather", "item", "ability", "story"]);
const ITEM_CATEGORIES = new Set(["held", "outfit", "accessory", "tool", "weapon", "pack", "consumable", "pokeball", "tm", "tr", "evolution", "material", "quest"]);

function error(list, file, message) {
  list.push(`${path.relative(process.cwd(), file)}: ${message}`);
}

function requireString(record, key, errors, file) {
  if (typeof record[key] !== "string" || !record[key].trim()) error(errors, file, `missing non-empty string '${key}'`);
}

function requireArray(record, key, errors, file) {
  if (!Array.isArray(record[key])) error(errors, file, `missing array '${key}'`);
}

function validateCommon(record, errors, file) {
  requireString(record, "name", errors, file);
  requireString(record, "slug", errors, file);
  if (record.slug !== sluggify(record.slug)) error(errors, file, `slug '${record.slug}' is not normalized`);
  if ((record.schemaVersion ?? SCHEMA_VERSION) !== SCHEMA_VERSION) error(errors, file, `unsupported schemaVersion '${record.schemaVersion}'`);
  if (record.tags && !Array.isArray(record.tags)) error(errors, file, "tags must be an array");
}

function validateSpecies(record, errors, file) {
  validateCommon(record, errors, file);
  requireArray(record, "types", errors, file);
  for (const type of asArray(record.types)) if (!TYPE_VALUES.has(type)) error(errors, file, `unknown type '${type}'`);
  if (!record.stats || typeof record.stats !== "object") error(errors, file, "missing stats object");
  else for (const stat of ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]) {
    if (!Number.isFinite(record.stats[stat]) || record.stats[stat] < 1) error(errors, file, `invalid stat '${stat}'`);
  }
}

function validateMove(record, errors, file) {
  validateCommon(record, errors, file);
  if (!TYPE_VALUES.has(record.type)) error(errors, file, `unknown type '${record.type}'`);
  if (!MOVE_CATEGORIES.has(record.category)) error(errors, file, `unknown move category '${record.category}'`);
  if (!Number.isFinite(record.power) || record.power < 0) error(errors, file, "power must be a non-negative number");
}

function validateAbility(record, errors, file) {
  validateCommon(record, errors, file);
  requireString(record, "effect", errors, file);
}

function validateItem(record, errors, file) {
  validateCommon(record, errors, file);
  if (!ITEM_CATEGORIES.has(record.category)) error(errors, file, `unknown item category '${record.category}'`);
}

function validateForm(record, errors, file) {
  validateCommon(record, errors, file);
  requireString(record, "baseSpeciesSlug", errors, file);
  if (!FORM_FAMILIES.has(record.family)) error(errors, file, `unknown form family '${record.family}'`);
  if (EXCLUDED_FAMILIES.has(record.family)) error(errors, file, `excluded form family '${record.family}'`);
}

function validateByType(type, record, errors, file) {
  if (type === "species") validateSpecies(record, errors, file);
  else if (type === "moves") validateMove(record, errors, file);
  else if (type === "abilities") validateAbility(record, errors, file);
  else if (type === "items") validateItem(record, errors, file);
  else if (type === "forms") validateForm(record, errors, file);
  else validateCommon(record, errors, file);
}

function exclusionReason(record) {
  const tags = new Set(asArray(record.tags));
  for (const tag of tags) if (EXCLUDED_TAGS.has(tag)) return `excluded tag '${tag}'`;
  if (record.family && EXCLUDED_FAMILIES.has(record.family)) return `excluded family '${record.family}'`;
  return null;
}

export async function loadAndValidateSources() {
  const errors = [];
  const warnings = [];
  const records = [];
  const excluded = [];
  const seen = new Map();

  for (const [type, config] of Object.entries(CONTENT_TYPES)) {
    const root = new URL(`${config.directory}/`, SOURCE_ROOT);
    for (const file of await walkJsonFiles(root)) {
      const parsed = await readJsonFile(file);
      const fileRecords = Array.isArray(parsed) ? parsed : [parsed];
      for (const record of fileRecords) {
        const reason = exclusionReason(record);
        if (reason) {
          excluded.push({ type, slug: record.slug ?? "unknown", file, reason });
          continue;
        }

        validateByType(type, record, errors, file);
        const key = `${type}:${record.slug}`;
        if (seen.has(key)) error(errors, file, `duplicate slug '${record.slug}', first seen in ${path.relative(process.cwd(), seen.get(key))}`);
        else seen.set(key, file);
        records.push({ type, config, file, record });
      }
    }
  }

  const indexes = Object.fromEntries(Object.keys(CONTENT_TYPES).map(type => [type, new Set(records.filter(entry => entry.type === type).map(entry => entry.record.slug))]));

  for (const entry of records) {
    const { type, record, file } = entry;
    if (type === "species") {
      for (const slug of asArray(record.abilitySlugs)) if (!indexes.abilities.has(slug)) error(errors, file, `unknown ability reference '${slug}'`);
      for (const learn of asArray(record.learnset)) if (!indexes.moves.has(learn.moveSlug)) error(errors, file, `unknown move reference '${learn.moveSlug}'`);
      for (const evolution of asArray(record.evolutions)) if (!indexes.species.has(evolution.targetSpeciesSlug)) warnings.push(`${path.relative(process.cwd(), file)}: unresolved evolution target '${evolution.targetSpeciesSlug}'`);
    }
    if (type === "forms" && !indexes.species.has(record.baseSpeciesSlug)) error(errors, file, `unknown base species '${record.baseSpeciesSlug}'`);
  }

  return {
    records,
    errors: unique(errors),
    warnings: unique(warnings),
    excluded
  };
}

async function main() {
  const result = await loadAndValidateSources();
  const summary = {
    records: result.records.length,
    errors: result.errors.length,
    warnings: result.warnings.length,
    excluded: result.excluded.length
  };
  console.log(JSON.stringify(summary, null, 2));
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  for (const err of result.errors) console.error(`ERROR ${err}`);
  if (result.errors.length) process.exitCode = 1;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) await main();
