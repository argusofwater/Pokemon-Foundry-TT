import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { convertCaptureValue, convertSpeciesStats } from "./conversion-rules.mjs";
import { sluggify, writeJsonFile } from "./utils.mjs";

const RAW_ROOT = path.resolve("temp/compendium-raw");
const OUTPUT_ROOT = path.resolve("temp/compendium-translated/species");

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return String(node.text);
  if (ts.isComputedPropertyName(node)) return evaluate(node.expression);
  return null;
}

function evaluate(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node)) {
    if (node.text === "undefined") return undefined;
    return node.text;
  }
  if (ts.isPrefixUnaryExpression(node)) {
    const value = Number(evaluate(node.operand));
    if (node.operator === ts.SyntaxKind.MinusToken) return -value;
    if (node.operator === ts.SyntaxKind.PlusToken) return value;
    if (node.operator === ts.SyntaxKind.ExclamationToken) return !value;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        const key = propertyName(property.name);
        if (key != null) result[key] = evaluate(property.initializer);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        result[property.name.text] = property.name.text;
      }
    }
    return result;
  }
  return undefined;
}

function extractPokedex(sourceText) {
  const source = ts.createSourceFile("pokedex.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "Pokedex") initializer = declaration.initializer;
    }
  });
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error("Could not locate the Showdown Pokedex object.");
  return evaluate(initializer);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows.filter(row => row.some(Boolean)).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function normalizeStats(baseStats = {}) {
  return {
    hp: Number(baseStats.hp ?? 1),
    attack: Number(baseStats.atk ?? 1),
    defense: Number(baseStats.def ?? 1),
    specialAttack: Number(baseStats.spa ?? 1),
    specialDefense: Number(baseStats.spd ?? 1),
    speed: Number(baseStats.spe ?? 1)
  };
}

function normalizeAbilities(abilities = {}) {
  return Object.values(abilities).filter(value => typeof value === "string").map(sluggify);
}

function isGmax(entry) {
  return String(entry.forme ?? "").toLowerCase() === "gmax" || /-gmax$/i.test(entry.name ?? "");
}

function isMega(entry) {
  return /^mega/i.test(String(entry.forme ?? "")) || /-mega(?:-|$)/i.test(entry.name ?? "");
}

function isPrimal(entry) {
  return /^primal/i.test(String(entry.forme ?? "")) || /-primal$/i.test(entry.name ?? "");
}

function formKind(entry) {
  const forme = String(entry.forme ?? "").toLowerCase();
  if (["alola", "galar", "hisui", "paldea"].some(region => forme.includes(region))) return "regional";
  if (entry.baseSpecies && entry.changesFrom) return "temporary";
  if (entry.baseSpecies) return "permanent";
  return "base";
}

function sizeFromHeight(height) {
  if (height <= 0.3) return "tiny";
  if (height <= 1) return "small";
  if (height <= 2.5) return "medium";
  if (height <= 5) return "large";
  return "massive";
}

function weightClass(weight) {
  if (weight < 10) return 0;
  if (weight < 50) return 1;
  if (weight < 150) return 2;
  if (weight < 500) return 3;
  return 4;
}

function sourceMeta(key) {
  return {
    dataset: "pokemon-showdown-gen9-snapshot",
    sourceId: key,
    generation: 9,
    cutoff: "gen9-sv-dlc-pre-za"
  };
}

async function main() {
  const pokedexText = await fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/pokedex.ts"), "utf8");
  const speciesCsv = await fs.readFile(path.join(RAW_ROOT, "pokeapi/data/v2/csv/pokemon_species.csv"), "utf8");
  const pokedex = extractPokedex(pokedexText);
  const speciesMetadata = new Map(parseCsv(speciesCsv).map(row => [Number(row.id), row]));

  const species = [];
  const megaForms = [];
  const primalForms = [];
  const excluded = [];

  for (const [key, entry] of Object.entries(pokedex)) {
    if (!entry || Number(entry.num ?? 0) <= 0) continue;
    if (isGmax(entry)) {
      excluded.push({ key, name: entry.name, reason: "gigantamax" });
      continue;
    }

    const canonicalStats = normalizeStats(entry.baseStats);
    const stats = convertSpeciesStats(canonicalStats, { scale: "main-series" }).stats;
    const metadata = speciesMetadata.get(Number(entry.num));
    const capture = convertCaptureValue(metadata?.capture_rate ?? null, {
      restricted: metadata?.is_legendary === "1" || metadata?.is_mythical === "1"
    });
    const types = (entry.types ?? ["Normal"]).map(type => String(type).toLowerCase());
    const abilities = normalizeAbilities(entry.abilities);
    const baseSlug = sluggify(entry.baseSpecies ?? entry.name);
    const common = {
      schemaVersion: 1,
      name: entry.name,
      slug: sluggify(entry.name),
      nationalDex: Number(entry.num),
      types,
      canonicalStats,
      stats,
      abilitySlugs: abilities,
      heightMeters: Number(entry.heightm ?? 0),
      weightKg: Number(entry.weightkg ?? 0),
      size: sizeFromHeight(Number(entry.heightm ?? 0)),
      weightClass: weightClass(Number(entry.weightkg ?? 0)),
      eggGroups: (entry.eggGroups ?? []).map(sluggify),
      captureDifficulty: capture.captureDifficulty,
      rarity: capture.rarity,
      source: sourceMeta(key),
      tags: []
    };

    if (isMega(entry) || isPrimal(entry)) {
      const profile = {
        ...common,
        baseSpeciesSlug: baseSlug,
        family: isPrimal(entry) ? "primal" : "mega",
        temporary: true,
        requirements: {
          itemSlug: sluggify(entry.requiredItem ?? ""),
          trainerTalentSlug: "",
          trainerItemSlug: "key-stone",
          baseSpeciesSlugs: [baseSlug],
          campaignFlag: "mega-evolution-enabled"
        }
      };
      if (isPrimal(entry)) primalForms.push(profile);
      else megaForms.push(profile);
      continue;
    }

    species.push({
      ...common,
      formSlug: entry.forme ? sluggify(entry.forme) : "",
      formKind: formKind(entry),
      baseSpeciesSlug: entry.baseSpecies ? baseSlug : "",
      evolutions: (entry.evos ?? []).map(target => ({
        targetSpeciesSlug: sluggify(target),
        method: entry.evoType ?? (entry.evoLevel ? "level" : "special"),
        level: entry.evoLevel ?? null,
        itemSlug: sluggify(entry.evoItem ?? ""),
        condition: entry.evoCondition ?? ""
      })),
      learnset: [],
      capabilitySlugs: [],
      talentSlugs: [],
      habitatTags: [],
      temperamentTags: [],
      movement: { overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 },
      artwork: { portrait: "", token: "" }
    });
  }

  species.sort((a, b) => a.nationalDex - b.nationalDex || a.slug.localeCompare(b.slug));
  megaForms.sort((a, b) => a.nationalDex - b.nationalDex || a.slug.localeCompare(b.slug));
  primalForms.sort((a, b) => a.nationalDex - b.nationalDex || a.slug.localeCompare(b.slug));

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJsonFile(path.join(OUTPUT_ROOT, "species.json"), species);
  await writeJsonFile(path.join(OUTPUT_ROOT, "mega-forms.json"), megaForms);
  await writeJsonFile(path.join(OUTPUT_ROOT, "primal-forms.json"), primalForms);
  await writeJsonFile(path.join(OUTPUT_ROOT, "excluded-forms.json"), excluded);
  await writeJsonFile(path.join(OUTPUT_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    cutoff: "gen9-sv-dlc-pre-za",
    speciesRecords: species.length,
    uniqueNationalDexSpecies: new Set(species.map(entry => entry.nationalDex)).size,
    megaProfiles: megaForms.length,
    primalProfiles: primalForms.length,
    excludedGigantamax: excluded.length,
    notes: [
      "Canonical main-series base stats are preserved alongside Commander-scale species stats.",
      "Movement and tabletop capabilities remain placeholders until legacy PTR data is merged.",
      "Learnsets are merged during compendium normalization.",
      "Mega profiles include records present in the frozen raw source, including newer Mega forms."
    ]
  });

  console.log(`Translated ${species.length} species/form records and ${megaForms.length} Mega profiles.`);
}

await main();
