import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  addReviewTags,
  convertAccuracy,
  convertMovePower,
  inferRange,
  inferRecharge,
  inferTargetDefense,
  normalizeConditionSlug
} from "./conversion-rules.mjs";
import { sluggify, unique, writeJsonFile } from "./utils.mjs";

const RAW_ROOT = path.resolve("temp/compendium-raw");
const OUTPUT_ROOT = path.resolve("temp/compendium-translated/moves");

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

function extractMoves(sourceText) {
  const source = ts.createSourceFile("moves.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "Moves") initializer = declaration.initializer;
    }
  });
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) throw new Error("Could not locate the Showdown Moves object.");
  return evaluate(initializer);
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function fractionPercent(value) {
  if (!Array.isArray(value) || value.length !== 2) return 0;
  const numerator = Number(value[0]);
  const denominator = Number(value[1]);
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function isMaxMove(key, move) {
  const name = String(move.name ?? key).toLowerCase();
  return Boolean(move.isMax) || /^max /.test(name) || /^g-max /.test(name) || key.startsWith("max") || key.startsWith("gmax");
}

function isCap(move) {
  return move.isNonstandard === "CAP";
}

function targetProfile(target) {
  const map = {
    self: { disposition: "self", count: 1, kind: "self" },
    allySide: { disposition: "ally", count: 0, kind: "field" },
    allyTeam: { disposition: "ally", count: 0, kind: "field" },
    all: { disposition: "any", count: 0, kind: "field" },
    allAdjacent: { disposition: "any", count: 0, kind: "area" },
    allAdjacentFoes: { disposition: "enemy", count: 0, kind: "area" },
    allAdjacentAllies: { disposition: "ally", count: 0, kind: "area" },
    adjacentAlly: { disposition: "ally", count: 1, kind: "ally" },
    adjacentAllyOrSelf: { disposition: "ally", count: 1, kind: "ally" },
    adjacentFoe: { disposition: "enemy", count: 1, kind: "enemy" },
    any: { disposition: "any", count: 1, kind: "enemy" },
    foeSide: { disposition: "enemy", count: 0, kind: "field" },
    normal: { disposition: "enemy", count: 1, kind: "enemy" },
    randomNormal: { disposition: "enemy", count: 1, kind: "enemy" },
    scripted: { disposition: "any", count: 1, kind: "special" }
  };
  return map[target] ?? { disposition: "enemy", count: 1, kind: "enemy" };
}

function moveTags(key, move) {
  const tags = new Set(Object.keys(move.flags ?? {}).map(sluggify));
  if (move.isZ) tags.add("z-move");
  if (move.isNonstandard) tags.add(`nonstandard-${sluggify(move.isNonstandard)}`);
  if (move.basePowerCallback || move.damageCallback) tags.add("variable-power");
  if (move.damage === "level" || Number.isFinite(move.damage)) tags.add("fixed-damage");
  if (move.ohko) tags.add("ohko");
  if (move.multihit) tags.add("multi-hit");
  if (move.priority > 0) tags.add("priority");
  if (move.priority < 0) tags.add("delayed");
  if (move.selfSwitch) tags.add("switching");
  if (move.forceSwitch) tags.add("forced-switch");
  if (move.weather) tags.add("weather");
  if (move.terrain) tags.add("terrain");
  if (move.sideCondition || move.pseudoWeather || move.slotCondition) tags.add("zone");
  if (move.recoil) tags.add("recoil");
  if (move.drain) tags.add("drain");
  if (move.heal) tags.add("healing");
  if (move.stallingMove) tags.add("protect-style");
  if (move.willCrit) tags.add("automatic-critical");
  if (move.target === "allAdjacentFoes" || move.target === "allAdjacent") tags.add("large-area");
  return [...tags];
}

function collectConditions(move) {
  const effects = [];
  const candidates = [];
  if (move.status) candidates.push({ status: move.status, chance: 100, recipient: "target" });
  if (move.secondary?.status) candidates.push({ status: move.secondary.status, chance: move.secondary.chance ?? 100, recipient: "target" });
  for (const secondary of move.secondaries ?? []) {
    if (secondary?.status) candidates.push({ status: secondary.status, chance: secondary.chance ?? 100, recipient: "target" });
  }
  if (move.self?.status) candidates.push({ status: move.self.status, chance: 100, recipient: "self" });
  for (const candidate of candidates) {
    effects.push({
      kind: "condition",
      conditionSlug: normalizeConditionSlug(candidate.status),
      chance: Number(candidate.chance),
      recipient: candidate.recipient
    });
  }
  return effects;
}

function collectBoosts(move) {
  const effects = [];
  const add = (boosts, recipient, chance = 100) => {
    if (!boosts || typeof boosts !== "object") return;
    for (const [stat, stages] of Object.entries(boosts)) {
      effects.push({ kind: "stage", stat, stages: Number(stages), chance: Number(chance), recipient });
    }
  };
  add(move.boosts, "target");
  add(move.secondary?.boosts, "target", move.secondary?.chance ?? 100);
  add(move.self?.boosts, "self");
  add(move.selfBoost?.boosts, "self");
  for (const secondary of move.secondaries ?? []) add(secondary?.boosts, "target", secondary?.chance ?? 100);
  return effects;
}

function collectStructuredEffects(move) {
  const effects = [...collectConditions(move), ...collectBoosts(move)];
  const drain = fractionPercent(move.drain);
  const recoil = fractionPercent(move.recoil);
  const healing = fractionPercent(move.heal);
  if (drain) effects.push({ kind: "drain", percent: drain });
  if (recoil) effects.push({ kind: "recoil", percent: recoil });
  if (healing) effects.push({ kind: "healing", percent: healing, recipient: "self" });
  if (move.weather) effects.push({ kind: "weather", slug: sluggify(move.weather) });
  if (move.terrain) effects.push({ kind: "terrain", slug: sluggify(move.terrain) });
  if (move.sideCondition) effects.push({ kind: "zone", slug: sluggify(move.sideCondition), recipient: "target-side" });
  if (move.pseudoWeather) effects.push({ kind: "zone", slug: sluggify(move.pseudoWeather), recipient: "scene" });
  return effects;
}

function needsEffectReview(move, effects) {
  return Boolean(
    move.onHit || move.onTry || move.onTryHit || move.onAfterHit || move.onModifyMove || move.condition ||
    move.basePowerCallback || move.damageCallback || move.onEffectiveness || move.onPrepareHit ||
    move.selfSwitch || move.forceSwitch || move.multihit || move.noMetronome ||
    (move.secondary && !effects.length)
  );
}

function convertMove(key, move) {
  const tags = moveTags(key, move);
  const fixed = tags.includes("fixed-damage");
  const variable = tags.includes("variable-power");
  const ohko = tags.includes("ohko");
  const power = convertMovePower(move.basePower ?? 0, { sourceField: "power", fixed, variable, ohko });
  const accuracy = convertAccuracy(move.accuracy === true ? null : move.accuracy, {
    alwaysHits: move.accuracy === true,
    special: Boolean(move.accuracyCallback)
  });
  const target = targetProfile(move.target);
  const category = String(move.category ?? "Status").toLowerCase();
  const text = cleanText(move.desc || move.shortDesc || move.name);
  const defense = inferTargetDefense({ category, target: target.kind, tags, text });
  const range = inferRange({ tags, target: target.kind === "self" ? "self" : target.kind === "field" ? "field" : "enemy", text });
  const effects = collectStructuredEffects(move);
  const healingPercent = fractionPercent(move.heal);
  const recharge = inferRecharge({
    power: power.power,
    tags,
    text,
    healingPercent,
    protect: Boolean(move.stallingMove),
    drawback: Boolean(move.recoil || move.hasCrashDamage || move.selfdestruct || move.mindBlownRecoil || move.flags?.charge)
  });

  const reviewFlags = [
    ...power.tags,
    ...accuracy.tags,
    ...recharge.tags,
    defense.review ? "review-defense" : null,
    range.review ? "review-range" : null,
    needsEffectReview(move, effects) ? "review-effects" : null,
    "review-automation"
  ];

  return {
    schemaVersion: 1,
    name: move.name ?? key,
    slug: sluggify(move.name ?? key),
    description: text,
    type: String(move.type ?? "Normal").toLowerCase(),
    category,
    power: power.power,
    accuracy: accuracy.accuracy,
    accuracyModifier: accuracy.modifier,
    accuracyHindered: accuracy.hindered,
    range: range.range,
    target: {
      defense: defense.defense,
      count: target.count,
      disposition: target.disposition,
      sourceTarget: move.target ?? "normal"
    },
    recharge: {
      category: recharge.category,
      rounds: recharge.rounds,
      remaining: 0
    },
    priority: Number(move.priority ?? 0),
    effects,
    contest: {
      category: move.contestType ? sluggify(move.contestType) : "",
      tags: [],
      appeal: 0
    },
    tags: addReviewTags(tags, ...reviewFlags),
    automation: {
      state: effects.length && !needsEffectReview(move, effects) ? "structured" : "manual",
      handler: "",
      notes: "Translated from frozen Pokémon Showdown move data; Commander timing, range, and effects remain reviewable."
    },
    source: {
      dataset: "pokemon-showdown-gen9-snapshot",
      sourceId: key,
      generation: null,
      cutoff: "gen9-sv-dlc-pre-za"
    },
    sourceMetadata: {
      number: move.num ?? null,
      pp: move.pp ?? null,
      nonstandard: move.isNonstandard ?? null,
      zCrystal: move.isZ ?? null,
      critRatio: move.critRatio ?? 1,
      sourceFlags: Object.keys(move.flags ?? {}),
      sourceAccuracy: move.accuracy ?? null,
      sourcePower: move.basePower ?? 0
    }
  };
}

async function main() {
  const sourceText = await fs.readFile(path.join(RAW_ROOT, "pokemon-showdown/data/moves.ts"), "utf8");
  const table = extractMoves(sourceText);
  const records = [];
  const excluded = [];

  for (const [key, move] of Object.entries(table)) {
    if (!move) continue;
    if (isMaxMove(key, move)) {
      excluded.push({ key, name: move.name ?? key, reason: "max-or-gmax" });
      continue;
    }
    if (isCap(move)) {
      excluded.push({ key, name: move.name ?? key, reason: "cap-content" });
      continue;
    }
    records.push(convertMove(key, move));
  }

  records.sort((a, b) => a.slug.localeCompare(b.slug));
  excluded.sort((a, b) => a.name.localeCompare(b.name));

  const byCategory = {};
  const byRecharge = {};
  const byAutomation = {};
  const byType = {};
  for (const record of records) {
    byCategory[record.category] = (byCategory[record.category] ?? 0) + 1;
    byRecharge[record.recharge.category] = (byRecharge[record.recharge.category] ?? 0) + 1;
    byAutomation[record.automation.state] = (byAutomation[record.automation.state] ?? 0) + 1;
    byType[record.type] = (byType[record.type] ?? 0) + 1;
  }

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJsonFile(path.join(OUTPUT_ROOT, "moves.json"), records);
  await writeJsonFile(path.join(OUTPUT_ROOT, "excluded-moves.json"), excluded);
  await writeJsonFile(path.join(OUTPUT_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    cutoff: "gen9-sv-dlc-pre-za",
    moveRecords: records.length,
    excludedRecords: excluded.length,
    byCategory,
    byRecharge,
    byAutomation,
    byType,
    structuredEffects: records.filter(record => record.effects.length).length,
    reviewRequired: records.filter(record => record.tags.some(tag => tag.startsWith("review-"))).length,
    retainedPastMoves: records.filter(record => record.tags.includes("nonstandard-past")).length,
    retainedZMoves: records.filter(record => record.tags.includes("z-move")).length,
    exclusions: Object.fromEntries([...new Set(excluded.map(record => record.reason))].map(reason => [reason, excluded.filter(record => record.reason === reason).length])),
    notes: [
      "Gen 9 Power, accuracy, category, type, and canonical source metadata are preserved.",
      "Max, G-Max, and CAP-only moves are excluded.",
      "Past and Z-Moves are retained as tagged archival content.",
      "Ranges, defenses, recharge, and complex effects remain reviewable Commander translations."
    ]
  });

  console.log(`Translated ${records.length} moves; excluded ${excluded.length}.`);
}

await main();
