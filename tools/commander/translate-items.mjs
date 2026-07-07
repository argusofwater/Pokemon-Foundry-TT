import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { sluggify, writeJsonFile } from "./utils.mjs";

const RAW_ROOT = path.resolve("temp/compendium-raw");
const OUTPUT_ROOT = path.resolve("temp/compendium-translated/items");

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
      } else if (ts.isShorthandPropertyAssignment(property)) result[property.name.text] = property.name.text;
    }
    return result;
  }
  return undefined;
}

function extractItems(sourceText) {
  const source = ts.createSourceFile("items.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "Items") initializer = declaration.initializer;
    }
  });
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error("Could not locate the Showdown Items object.");
  return evaluate(initializer);
}

function categoryFor(key, item) {
  const name = String(item.name ?? key).toLowerCase();
  if (item.megaStone) return "evolution";
  if (item.onPlate || item.zMove || item.zMoveType || item.zMoveFrom) return "held";
  if (item.isBerry || name.endsWith(" berry")) return "consumable";
  if (/ball$/.test(name) || name.includes(" ball")) return "pokeball";
  if (/^tm\d+/i.test(name) || /^tm\d+/i.test(key)) return "tm";
  if (/^tr\d+/i.test(name) || /^tr\d+/i.test(key)) return "tr";
  if (item.forcedForme || item.itemUser || item.onBasePower || item.onModifyAtk || item.onModifySpA || item.onModifyDef || item.onModifySpD || item.onModifySpe) return "held";
  return "tool";
}

function inferTags(key, item, category) {
  const tags = new Set([category, "review-automation"]);
  const name = String(item.name ?? key).toLowerCase();
  if (item.megaStone) tags.add("mega-stone");
  if (item.forcedForme) tags.add("form-change");
  if (item.isBerry || name.endsWith(" berry")) tags.add("berry");
  if (item.zMove || item.zMoveType || item.zMoveFrom) tags.add("z-crystal");
  if (item.onPlate) tags.add("type-boost");
  if (item.naturalGift) tags.add("natural-gift");
  if (item.fling) tags.add("fling-compatible");
  if (item.isNonstandard) tags.add(`nonstandard-${sluggify(item.isNonstandard)}`);
  if (item.gen) tags.add(`generation-${item.gen}`);
  return [...tags];
}

function automationState(item) {
  if (item.megaStone || item.forcedForme) return "structured";
  if (item.boosts || item.heal || item.onEat || item.onUse || item.onTakeItem) return "manual";
  return "manual";
}

function descriptionFor(item) {
  return String(item.desc ?? item.shortDesc ?? "").replace(/\s+/g, " ").trim();
}

function convertItem(key, item) {
  const category = categoryFor(key, item);
  const tags = inferTags(key, item, category);
  const compatibility = [];
  for (const user of item.itemUser ?? []) compatibility.push(sluggify(user));
  if (item.megaEvolves) compatibility.push(sluggify(item.megaEvolves));

  const effects = [];
  if (item.boosts) effects.push({ kind: "stage", boosts: item.boosts });
  if (item.heal) effects.push({ kind: "healing", fraction: item.heal });
  if (item.forcedForme) effects.push({ kind: "form-change", formSlug: sluggify(item.forcedForme) });
  if (item.megaStone) effects.push({ kind: "mega-evolution", formSlug: sluggify(item.megaStone), speciesSlug: sluggify(item.megaEvolves) });
  if (item.onPlate) effects.push({ kind: "type-boost", type: sluggify(item.onPlate), flatDamage: 2 });

  return {
    schemaVersion: 1,
    name: item.name ?? key,
    slug: sluggify(item.name ?? key),
    description: descriptionFor(item),
    category,
    quantity: 1,
    bulk: category === "held" || category === "evolution" ? 0 : 1,
    rarity: item.megaStone || item.zMove ? "rare" : "common",
    slot: category === "held" || category === "evolution" ? "held" : "",
    consumedOnUse: Boolean(item.isBerry || item.onEat || item.onUse),
    compatibility: [...new Set(compatibility)],
    effects,
    tags,
    automation: {
      state: automationState(item),
      handler: item.megaStone ? "commander.mega.activate" : "",
      notes: "Translated from frozen Pokémon Showdown item data; complex hooks remain manual until reviewed."
    },
    source: {
      dataset: "pokemon-showdown-gen9-snapshot",
      sourceId: key,
      generation: item.gen ?? null,
      cutoff: "gen9-sv-dlc-pre-za"
    },
    sourceMetadata: {
      number: item.num ?? null,
      spriteNumber: item.spritenum ?? null,
      nonstandard: item.isNonstandard ?? null,
      flingPower: item.fling?.basePower ?? null,
      naturalGift: item.naturalGift ?? null,
      megaStone: item.megaStone ?? null,
      megaEvolves: item.megaEvolves ?? null,
      forcedForme: item.forcedForme ?? null,
      zMove: item.zMove ?? null,
      zMoveType: item.zMoveType ?? null
    }
  };
}

async function main() {
  const sourceText = await fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/items.ts"), "utf8");
  const table = extractItems(sourceText);
  const records = [];
  const excluded = [];

  for (const [key, item] of Object.entries(table)) {
    if (!item) continue;
    if (item.isNonstandard === "CAP") {
      excluded.push({ key, name: item.name ?? key, reason: "cap-content" });
      continue;
    }
    records.push(convertItem(key, item));
  }

  records.sort((a, b) => a.slug.localeCompare(b.slug));
  excluded.sort((a, b) => a.name.localeCompare(b.name));

  const byCategory = {};
  const byAutomation = {};
  for (const record of records) {
    byCategory[record.category] = (byCategory[record.category] ?? 0) + 1;
    byAutomation[record.automation.state] = (byAutomation[record.automation.state] ?? 0) + 1;
  }

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJsonFile(path.join(OUTPUT_ROOT, "items.json"), records);
  await writeJsonFile(path.join(OUTPUT_ROOT, "excluded-items.json"), excluded);
  await writeJsonFile(path.join(OUTPUT_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    cutoff: "gen9-sv-dlc-pre-za",
    itemRecords: records.length,
    excludedRecords: excluded.length,
    byCategory,
    byAutomation,
    megaStones: records.filter(record => record.tags.includes("mega-stone")).length,
    berries: records.filter(record => record.tags.includes("berry")).length,
    zCrystals: records.filter(record => record.tags.includes("z-crystal")).length,
    formChangeItems: records.filter(record => record.tags.includes("form-change")).length,
    reviewRequired: records.filter(record => record.tags.includes("review-automation")).length,
    notes: [
      "Mega Stones are retained and wired to the Commander Mega activation handler name.",
      "Type boosters use the locked Commander +2 flat damage rule.",
      "Complex item hooks remain preserved in source metadata and flagged for review.",
      "CAP-only items are excluded; canonical nonstandard items are retained and tagged."
    ]
  });

  console.log(`Translated ${records.length} items; excluded ${excluded.length}.`);
}

await main();
