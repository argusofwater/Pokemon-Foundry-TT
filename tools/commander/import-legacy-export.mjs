import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { sluggify, writeJsonFile } from "./utils.mjs";

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSource(document) {
  return {
    dataset: "legacy-ptr-compendium",
    sourceId: document._id ?? document.system?.slug ?? sluggify(document.name),
    generation: null
  };
}

function normalizeAutomation() {
  return { state: "manual", handler: "", notes: "Imported from legacy PTR content and awaiting Commander automation review." };
}

function common(document) {
  const slug = sluggify(document.system?.slug ?? document.slug ?? document.name);
  return {
    schemaVersion: 1,
    name: document.name,
    slug,
    description: text(document.system?.description ?? document.system?.effect ?? document.system?.text),
    tags: array(document.system?.tags).map(tag => typeof tag === "string" ? sluggify(tag) : sluggify(tag?.value ?? tag?.name)).filter(Boolean),
    rulesProfile: "baseline",
    source: normalizeSource(document),
    automation: normalizeAutomation(),
    artwork: document.img ? { portrait: document.img, token: "" } : undefined
  };
}

function mapMove(document) {
  const system = document.system ?? {};
  const category = text(system.category ?? system.damageClass, "status").toLowerCase();
  return {
    ...common(document),
    type: text(system.type ?? system.moveType, "normal").toLowerCase(),
    category: ["physical", "special", "status"].includes(category) ? category : "status",
    power: Math.max(0, number(system.power ?? system.damageBase ?? system.db, 0)),
    accuracy: system.accuracy == null ? null : Math.max(0, number(system.accuracy)),
    range: {
      value: Math.max(0, number(system.range?.value ?? system.range, 1)),
      unit: system.range?.unit ?? "melee",
      shape: system.range?.shape ?? "single",
      area: Math.max(0, number(system.range?.area ?? system.aoe, 0))
    },
    target: {
      defense: category === "physical" ? "physical" : category === "special" ? "special" : "none",
      count: Math.max(0, number(system.target?.count, 1)),
      disposition: system.target?.disposition ?? "enemy"
    },
    recharge: { category: "at-will", rounds: 0, remaining: 0 },
    effects: [],
    contest: { tags: [], category: "", appeal: 0 }
  };
}

function mapAbility(document) {
  const system = document.system ?? {};
  return {
    ...common(document),
    abilityType: system.abilityType ?? "passive",
    trigger: text(system.trigger),
    effect: text(system.effect ?? system.description),
    recharge: { category: "at-will", rounds: 0, remaining: 0 },
    powerTier: "standard",
    innate: false,
    entryLimit: 1
  };
}

function mapItem(document) {
  const system = document.system ?? {};
  const legacyCategory = text(system.category ?? system.itemType ?? document.type, "tool").toLowerCase();
  const categoryMap = {
    berry: "consumable",
    healing: "consumable",
    medicine: "consumable",
    held: "held",
    pokeball: "pokeball",
    tm: "tm",
    tr: "tr",
    evolution: "evolution",
    weapon: "weapon",
    armor: "outfit",
    accessory: "accessory",
    tool: "tool"
  };
  return {
    ...common(document),
    category: categoryMap[legacyCategory] ?? "tool",
    quantity: 1,
    bulk: Math.max(0, number(system.bulk ?? system.weight, 1)),
    rarity: text(system.rarity, "common").toLowerCase(),
    slot: text(system.slot),
    consumedOnUse: Boolean(system.consumedOnUse ?? system.consumable),
    compatibility: array(system.compatibility)
  };
}

function legacyStats(system) {
  const stats = system.baseStats ?? system.stats ?? {};
  const getStat = (modern, legacy, fallback) => number(stats[modern]?.value ?? stats[modern] ?? stats[legacy]?.value ?? stats[legacy], fallback);
  return {
    hp: getStat("hp", "hp", 10),
    attack: getStat("attack", "atk", 5),
    defense: getStat("defense", "def", 5),
    specialAttack: getStat("specialAttack", "spatk", 5),
    specialDefense: getStat("specialDefense", "spdef", 5),
    speed: getStat("speed", "spd", 5)
  };
}

function mapSpecies(document) {
  const system = document.system ?? {};
  const typing = [system.typing?.one, system.typing?.two, ...array(system.types)].filter(Boolean).map(type => String(type).toLowerCase());
  const abilities = array(system.abilities).map(entry => sluggify(entry?.slug ?? entry?.name ?? entry)).filter(Boolean);
  const moves = array(system.moves ?? system.learnset).map(entry => ({
    moveSlug: sluggify(entry?.slug ?? entry?.name ?? entry?.move ?? entry),
    method: entry?.method ?? "level",
    level: entry?.level == null ? null : number(entry.level, 1),
    source: "legacy-ptr"
  })).filter(entry => entry.moveSlug);

  return {
    ...common(document),
    nationalDex: system.number == null ? null : number(system.number),
    formSlug: text(system.form),
    formKind: system.regional ? "regional" : "base",
    baseSpeciesSlug: text(system.baseSpeciesSlug),
    types: typing.length ? typing : ["normal"],
    stats: legacyStats(system),
    movement: {
      overland: Math.max(0, number(system.capabilities?.overland ?? system.movement?.overland, 5)),
      swim: Math.max(0, number(system.capabilities?.swim ?? system.movement?.swim, 0)),
      fly: Math.max(0, number(system.capabilities?.sky ?? system.movement?.fly, 0)),
      burrow: Math.max(0, number(system.capabilities?.burrow ?? system.movement?.burrow, 0)),
      climb: Math.max(0, number(system.capabilities?.climb ?? system.movement?.climb, 0))
    },
    size: text(system.size, "medium").toLowerCase(),
    weightClass: Math.max(0, number(system.weightClass, 1)),
    captureDifficulty: Math.max(0, number(system.captureDifficulty ?? system.captureRate, 0)),
    rarity: "common",
    eggGroups: array(system.eggGroups).map(sluggify),
    habitatTags: array(system.habitats ?? system.habitat).map(sluggify),
    temperamentTags: [],
    capabilitySlugs: array(system.capabilities?.other ?? system.capabilitySlugs).map(entry => sluggify(entry?.name ?? entry)),
    abilitySlugs: abilities,
    talentSlugs: [],
    learnset: moves,
    evolutions: array(system.evolutions).map(entry => ({
      targetSpeciesSlug: sluggify(entry?.target ?? entry?.species ?? entry?.name),
      method: text(entry?.method, "special"),
      level: entry?.level == null ? null : number(entry.level),
      itemSlug: sluggify(entry?.item ?? ""),
      condition: text(entry?.condition)
    })).filter(entry => entry.targetSpeciesSlug),
    artwork: { portrait: document.img ?? "", token: system.token ?? "" }
  };
}

function mapDocument(document) {
  if (document.type === "move") return { directory: "moves", record: mapMove(document) };
  if (document.type === "ability") return { directory: "abilities", record: mapAbility(document) };
  if (document.type === "species") return { directory: "species", record: mapSpecies(document) };
  if (["item", "pokeball"].includes(document.type)) return { directory: "items", record: mapItem(document) };
  return null;
}

async function main() {
  const [input, outputRoot = "data-src"] = process.argv.slice(2);
  if (!input) throw new Error("Usage: node tools/commander/import-legacy-export.mjs <export.json> [output-directory]");

  const raw = JSON.parse(await fs.readFile(input, "utf8"));
  const documents = Array.isArray(raw) ? raw : Array.isArray(raw.documents) ? raw.documents : [raw];
  const grouped = new Map();
  const skipped = [];

  for (const document of documents) {
    const mapped = mapDocument(document);
    if (!mapped) {
      skipped.push({ name: document.name, type: document.type });
      continue;
    }
    const records = grouped.get(mapped.directory) ?? [];
    records.push(mapped.record);
    grouped.set(mapped.directory, records);
  }

  for (const [directory, records] of grouped) {
    records.sort((a, b) => a.slug.localeCompare(b.slug));
    await writeJsonFile(path.join(outputRoot, directory, `legacy-import-${directory}.json`), records);
  }

  const report = {
    input,
    imported: Object.fromEntries([...grouped].map(([directory, records]) => [directory, records.length])),
    skipped
  };
  await writeJsonFile(path.join(outputRoot, "legacy-import-report.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

await main();
