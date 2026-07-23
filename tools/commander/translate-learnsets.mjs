import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { sluggify, writeJsonFile } from "./utils.mjs";

const RAW_ROOT = path.resolve("temp/compendium-raw");
const TRANSLATED_ROOT = path.resolve("temp/compendium-translated");
const OUTPUT_ROOT = path.resolve("temp/compendium-translated/learnsets");

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
  if (ts.isIdentifier(node)) return node.text === "undefined" ? undefined : node.text;
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

function extractTable(sourceText, exportName, filename) {
  const source = ts.createSourceFile(filename, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === exportName) initializer = declaration.initializer;
    }
  });
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error(`Could not locate the ${exportName} object in ${filename}.`);
  return evaluate(initializer);
}

function parseLearnMethod(code) {
  const match = String(code).match(/^(\d+)([A-Z])(.+)?$/);
  if (!match) return null;
  const generation = Number(match[1]);
  const marker = match[2];
  const detail = match[3] ?? "";
  const methods = {
    L: "level",
    M: "machine",
    T: "tutor",
    E: "egg",
    S: "event",
    R: "restricted",
    D: "dream-world",
    V: "virtual-console"
  };
  return {
    generation,
    method: methods[marker] ?? `source-${marker.toLowerCase()}`,
    level: marker === "L" && /^\d+$/.test(detail) ? Number(detail) : null,
    eventIndex: marker === "S" && /^\d+$/.test(detail) ? Number(detail) : null,
    sourceCode: String(code)
  };
}

function latestGeneration(entry, table, seen = new Set()) {
  if (!entry || seen.has(entry)) return 0;
  seen.add(entry);
  const record = table[entry];
  const own = Object.values(record?.learnset ?? {})
    .flatMap(codes => (Array.isArray(codes) ? codes : [codes]))
    .map(parseLearnMethod)
    .filter(Boolean)
    .reduce((maximum, source) => Math.max(maximum, source.generation), 0);
  const parent = typeof record?.inherit === "string"
    ? latestGeneration(record.inherit, table, seen)
    : 0;
  return Math.max(own, parent);
}

function choosePreferredSource(codes, generation) {
  const parsed = codes.map(parseLearnMethod).filter(Boolean).filter(entry => entry.generation === generation);
  if (!parsed.length) return null;
  const priority = { level: 0, egg: 1, machine: 2, tutor: 3, event: 4, restricted: 5, "dream-world": 6, "virtual-console": 7 };
  parsed.sort((a, b) => (priority[a.method] ?? 99) - (priority[b.method] ?? 99) || (a.level ?? 999) - (b.level ?? 999));
  const preferred = parsed[0];
  return {
    method: preferred.method,
    level: preferred.level,
    eventIndex: preferred.eventIndex,
    source: `showdown-gen${generation}`,
    sourceCodes: parsed.map(entry => entry.sourceCode)
  };
}

function buildMoveIdMap(moves) {
  return new Map(Object.entries(moves).map(([key, move]) => [key, sluggify(move?.name ?? key)]));
}

function directLearnset(entry, moveIdMap, generation) {
  const output = [];
  for (const [moveId, codes] of Object.entries(entry?.learnset ?? {})) {
    const source = choosePreferredSource(Array.isArray(codes) ? codes : [codes], generation);
    if (!source) continue;
    output.push({
      moveSlug: moveIdMap.get(moveId) ?? sluggify(moveId),
      ...source
    });
  }
  output.sort((a, b) => {
    const methodOrder = { level: 0, egg: 1, machine: 2, tutor: 3, event: 4, restricted: 5 };
    return (methodOrder[a.method] ?? 99) - (methodOrder[b.method] ?? 99) || (a.level ?? 999) - (b.level ?? 999) || a.moveSlug.localeCompare(b.moveSlug);
  });
  return output;
}

function resolveLearnset(key, table, moveIdMap, seen = new Set(), generation = null) {
  if (!key || seen.has(key)) return [];
  seen.add(key);
  const entry = table[key];
  const resolvedGeneration = generation ?? latestGeneration(key, table);
  const own = directLearnset(entry, moveIdMap, resolvedGeneration);
  if (!entry?.inherit) return own;
  const parentKey = typeof entry.inherit === "string" ? entry.inherit : null;
  if (!parentKey) return own;
  const inherited = resolveLearnset(parentKey, table, moveIdMap, seen, resolvedGeneration);
  const merged = new Map(inherited.map(move => [move.moveSlug, move]));
  for (const move of own) merged.set(move.moveSlug, move);
  return [...merged.values()];
}

function clone(value) {
  return structuredClone(value);
}

async function main() {
  const [learnsetsText, movesText, speciesText, megaText, primalText] = await Promise.all([
    fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/learnsets.ts"), "utf8"),
    fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/moves.ts"), "utf8"),
    fs.readFile(path.join(TRANSLATED_ROOT, "species/species.json"), "utf8"),
    fs.readFile(path.join(TRANSLATED_ROOT, "species/mega-forms.json"), "utf8"),
    fs.readFile(path.join(TRANSLATED_ROOT, "species/primal-forms.json"), "utf8")
  ]);

  const learnsets = extractTable(learnsetsText, "Learnsets", "learnsets.ts");
  const moves = extractTable(movesText, "Moves", "moves.ts");
  const moveIdMap = buildMoveIdMap(moves);
  const species = JSON.parse(speciesText);
  const megaForms = JSON.parse(megaText);
  const primalForms = JSON.parse(primalText);

  const speciesBySlug = new Map(species.map(record => [record.slug, record]));
  const sourceIdBySlug = new Map(species.map(record => [record.slug, record.source?.sourceId ?? record.slug]));
  const translated = [];
  const orphanedSpecies = [];
  const unresolvedMoves = new Set();
  const generationCounts = {};

  for (const sourceRecord of species) {
    const record = clone(sourceRecord);
    const sourceId = record.source?.sourceId ?? record.slug;
    let resolved = resolveLearnset(sourceId, learnsets, moveIdMap);

    if (!resolved.length && record.baseSpeciesSlug) {
      const baseSourceId = sourceIdBySlug.get(record.baseSpeciesSlug) ?? record.baseSpeciesSlug.replace(/-/g, "");
      resolved = resolveLearnset(baseSourceId, learnsets, moveIdMap);
    }

    if (!resolved.length) orphanedSpecies.push({ slug: record.slug, sourceId, baseSpeciesSlug: record.baseSpeciesSlug ?? "" });
    record.learnset = resolved;
    const generation = resolved[0]?.source?.match?.(/gen(\d+)$/)?.[1] ?? "none";
    generationCounts[generation] = (generationCounts[generation] ?? 0) + 1;
    translated.push(record);
  }

  const formProfiles = [...megaForms, ...primalForms].map(sourceRecord => {
    const record = clone(sourceRecord);
    const baseSourceId = sourceIdBySlug.get(record.baseSpeciesSlug) ?? record.baseSpeciesSlug.replace(/-/g, "");
    record.learnset = resolveLearnset(baseSourceId, learnsets, moveIdMap);
    return record;
  });

  for (const record of translated) {
    for (const move of record.learnset) {
      if (![...moveIdMap.values()].includes(move.moveSlug)) unresolvedMoves.add(move.moveSlug);
    }
  }

  const allLearnsets = Object.fromEntries(translated.map(record => [record.slug, record.learnset]));
  const methodCounts = {};
  let totalEntries = 0;
  for (const record of translated) {
    totalEntries += record.learnset.length;
    for (const move of record.learnset) methodCounts[move.method] = (methodCounts[move.method] ?? 0) + 1;
  }

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJsonFile(path.join(OUTPUT_ROOT, "learnsets.json"), allLearnsets);
  await writeJsonFile(path.join(OUTPUT_ROOT, "species-with-learnsets.json"), translated);
  await writeJsonFile(path.join(OUTPUT_ROOT, "form-profiles-with-learnsets.json"), formProfiles);
  await writeJsonFile(path.join(OUTPUT_ROOT, "orphaned-species.json"), orphanedSpecies);
  await writeJsonFile(path.join(OUTPUT_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    cutoff: "gen9-sv-dlc-pre-za",
    speciesRecords: translated.length,
    speciesWithCanonicalLearnsets: translated.filter(record => record.learnset.length).length,
    speciesWithoutCanonicalLearnsets: orphanedSpecies.length,
    sourceGenerationCounts: generationCounts,
    formProfiles: formProfiles.length,
    totalLearnsetEntries: totalEntries,
    uniqueMoveSlugs: new Set(translated.flatMap(record => record.learnset.map(move => move.moveSlug))).size,
    methodCounts,
    unresolvedMoveSlugs: [...unresolvedMoves].sort(),
    notes: [
      "Generation 9 learnsets are used when available; species absent from Gen 9 use their newest available canonical generation.",
      "Level, Egg, Machine, Tutor, Event, and restricted sources are preserved separately.",
      "Forms without direct learnsets inherit from their translated base species when possible.",
      "Mega and Primal profiles inherit the base species learnset rather than creating Z-A-specific movesets."
    ]
  });

  console.log(`Attached canonical learnsets to ${translated.filter(record => record.learnset.length).length} of ${translated.length} species/form records.`);
}

await main();
