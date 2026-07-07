import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { inferAbilityTier, inferAbilityType } from "./conversion-rules.mjs";
import { sluggify, writeJsonFile } from "./utils.mjs";

const RAW_ROOT = path.resolve("temp/compendium-raw");
const OUTPUT_ROOT = path.resolve("temp/compendium-translated/abilities");

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
      }
    }
    return result;
  }
  return undefined;
}

function extractTable(sourceText, exportName) {
  const source = ts.createSourceFile(`${exportName}.ts`, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === exportName) initializer = declaration.initializer;
    }
  });
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error(`Could not locate the ${exportName} object.`);
  return evaluate(initializer);
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function inferTags(entry, text) {
  const tags = new Set(["review-automation"]);
  const lower = text.toLowerCase();
  if (/weather|sun|rain|sandstorm|snow/.test(lower)) tags.add("weather");
  if (/terrain/.test(lower)) tags.add("terrain");
  if (/immune|immunity|no effect/.test(lower)) tags.add("immunity");
  if (/form|transform|changes into/.test(lower)) tags.add("form-change");
  if (/entry|switches in|upon entering/.test(lower)) tags.add("entry-trigger");
  if (/cannot be copied|cannot be suppressed/.test(lower)) tags.add("innate");
  if (entry.isNonstandard) tags.add(`nonstandard-${sluggify(entry.isNonstandard)}`);
  return [...tags];
}

function automationState(entry) {
  const text = `${entry.shortDesc ?? ""} ${entry.desc ?? ""}`.toLowerCase();
  if (!text) return "unsupported";
  if (/changes form|transform|cannot be copied|cannot be suppressed|replaces/.test(text)) return "manual";
  if (/when |after |upon |whenever |switches in|enters battle/.test(text)) return "prompted";
  return "manual";
}

async function main() {
  const abilitiesText = await fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/abilities.ts"), "utf8");
  const table = extractTable(abilitiesText, "Abilities");
  const records = [];
  const excluded = [];

  for (const [key, entry] of Object.entries(table)) {
    if (!entry || entry.isNonstandard === "CAP") {
      excluded.push({ key, name: entry?.name ?? key, reason: "cap-content" });
      continue;
    }

    const effect = cleanText(entry.desc || entry.shortDesc);
    const tags = inferTags(entry, effect);
    const abilityType = inferAbilityType(effect);
    const powerTier = inferAbilityTier(effect, tags);

    records.push({
      schemaVersion: 1,
      name: entry.name ?? key,
      slug: sluggify(entry.name ?? key),
      description: cleanText(entry.shortDesc || entry.desc),
      effect,
      abilityType,
      trigger: abilityType === "passive" ? "" : cleanText(entry.shortDesc),
      recharge: { category: "at-will", rounds: 0, remaining: 0 },
      powerTier,
      innate: tags.includes("innate"),
      entryLimit: tags.includes("entry-trigger") ? 1 : 0,
      tags,
      rulesProfile: "commander",
      automation: {
        state: automationState(entry),
        handler: "",
        notes: "Imported from frozen Pokémon Showdown ability data; Commander behavior requires review."
      },
      source: {
        dataset: "pokemon-showdown-gen9-snapshot",
        sourceId: key,
        generation: Number(entry.num ?? 0) > 0 ? null : null,
        cutoff: "gen9-sv-dlc-pre-za"
      },
      sourceMetadata: {
        rating: entry.rating ?? null,
        nonstandard: entry.isNonstandard ?? null,
        sourceNumber: entry.num ?? null
      }
    });
  }

  records.sort((a, b) => a.slug.localeCompare(b.slug));
  excluded.sort((a, b) => a.name.localeCompare(b.name));

  const countsByType = {};
  const countsByTier = {};
  const countsByAutomation = {};
  for (const record of records) {
    countsByType[record.abilityType] = (countsByType[record.abilityType] ?? 0) + 1;
    countsByTier[record.powerTier] = (countsByTier[record.powerTier] ?? 0) + 1;
    countsByAutomation[record.automation.state] = (countsByAutomation[record.automation.state] ?? 0) + 1;
  }

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJsonFile(path.join(OUTPUT_ROOT, "abilities.json"), records);
  await writeJsonFile(path.join(OUTPUT_ROOT, "excluded-abilities.json"), excluded);
  await writeJsonFile(path.join(OUTPUT_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    cutoff: "gen9-sv-dlc-pre-za",
    abilityRecords: records.length,
    excludedRecords: excluded.length,
    countsByType,
    countsByTier,
    countsByAutomation,
    reviewRequired: records.filter(record => record.tags.includes("review-automation")).length,
    notes: [
      "Canonical descriptions are preserved from the frozen Gen 9 Showdown snapshot.",
      "Ability type, tier, and automation state are inferred and remain reviewable.",
      "CAP-only content is excluded. Nonstandard canonical abilities are retained and tagged."
    ]
  });

  console.log(`Translated ${records.length} abilities; excluded ${excluded.length}.`);
}

await main();
