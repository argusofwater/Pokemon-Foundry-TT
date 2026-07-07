import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_ROOT, SCHEMA_VERSION } from "./compendium-config.mjs";
import { loadAndValidateSources } from "./validate-source.mjs";
import { asArray, ensureDirectory, stableId, writeJsonFile } from "./utils.mjs";

function sourceMeta(record) {
  return {
    profile: record.rulesProfile ?? "commander",
    book: record.source?.dataset ?? "",
    page: record.source?.sourceId ?? ""
  };
}

function baseItemDocument(record, type) {
  return {
    _id: stableId(type, record.slug),
    name: record.name,
    type,
    img: record.artwork?.portrait ?? record.img ?? "icons/svg/item-bag.svg",
    system: {
      schema: { version: SCHEMA_VERSION, lastMigration: "" },
      slug: record.slug,
      description: record.description ?? "",
      tags: asArray(record.tags),
      automation: record.automation ?? { state: "manual", handler: "", notes: "" },
      source: sourceMeta(record)
    },
    flags: {
      ptu: {
        commanderSource: {
          schemaVersion: record.schemaVersion ?? SCHEMA_VERSION,
          sourceId: record.source?.sourceId ?? record.slug
        }
      }
    }
  };
}

function buildMove(record) {
  const document = baseItemDocument(record, "move");
  Object.assign(document.system, {
    type: record.type,
    category: record.category,
    power: record.power,
    accuracy: record.accuracy ?? null,
    range: record.range ?? { value: 1, unit: "melee", shape: "single", area: 0 },
    target: record.target ?? { defense: record.category === "physical" ? "physical" : record.category === "special" ? "special" : "none", count: 1, disposition: "enemy" },
    recharge: record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 },
    effects: asArray(record.effects),
    contest: record.contest ?? { tags: [], category: "", appeal: 0 },
    tutorModification: { active: false, name: "", description: "" }
  });
  return document;
}

function buildAbility(record) {
  const document = baseItemDocument(record, "ability");
  Object.assign(document.system, {
    abilityType: record.abilityType ?? "passive",
    trigger: record.trigger ?? "",
    effect: record.effect ?? record.description ?? "",
    recharge: record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 },
    powerTier: record.powerTier ?? "standard",
    innate: Boolean(record.innate),
    entryLimit: record.entryLimit ?? 1
  });
  return document;
}

function buildItem(record) {
  const documentType = record.category === "pokeball" ? "pokeball" : "item";
  const document = baseItemDocument(record, documentType);
  Object.assign(document.system, {
    category: record.category,
    quantity: record.quantity ?? 1,
    bulk: record.bulk ?? 1,
    rarity: record.rarity ?? "common",
    location: "carried",
    slot: record.slot ?? "",
    assignedActorUuid: "",
    consumedOnUse: Boolean(record.consumedOnUse),
    suppressed: false,
    compatibility: asArray(record.compatibility)
  });
  return document;
}

function buildTalent(record) {
  const document = baseItemDocument(record, record.ownerType === "pokemon" ? "pokeedge" : "feat");
  Object.assign(document.system, {
    ownerType: record.ownerType ?? "either",
    talentType: record.talentType ?? "general",
    role: record.role ?? "",
    specialty: record.specialty ?? "",
    requirement: record.requirement ?? "",
    action: record.action ?? "passive",
    trigger: record.trigger ?? "",
    recharge: record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 },
    upgradeOf: record.upgradeOf ?? ""
  });
  return document;
}

function normalizeForm(record) {
  return {
    slug: record.slug,
    name: record.name,
    family: record.family,
    temporary: record.temporary ?? true,
    types: asArray(record.types),
    stats: record.stats,
    abilitySlugs: asArray(record.abilitySlugs),
    movement: record.movement ?? { overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 },
    size: record.size ?? "",
    portrait: record.artwork?.portrait ?? "",
    token: record.artwork?.token ?? "",
    tokenWidth: record.tokenWidth ?? 1,
    tokenHeight: record.tokenHeight ?? 1,
    requirements: record.requirements ?? { itemSlug: "", trainerTalentSlug: "", trainerItemSlug: "", baseSpeciesSlugs: [record.baseSpeciesSlug], campaignFlag: "" },
    replacesMoveSlugs: asArray(record.replacesMoveSlugs),
    addsMoveSlugs: asArray(record.addsMoveSlugs),
    tags: asArray(record.tags)
  };
}

function buildSpecies(record, forms) {
  const document = baseItemDocument(record, "species");
  document.img = record.artwork?.portrait ?? "icons/svg/mystery-man.svg";
  document.system = {
    schema: { version: SCHEMA_VERSION, lastMigration: "" },
    slug: record.slug,
    nationalDex: record.nationalDex ?? null,
    formSlug: record.formSlug ?? "",
    formKind: record.formKind ?? "base",
    baseSpeciesSlug: record.baseSpeciesSlug ?? "",
    types: asArray(record.types),
    stats: record.stats,
    movement: record.movement ?? { overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 },
    size: record.size ?? "medium",
    weightClass: record.weightClass ?? 1,
    captureDifficulty: record.captureDifficulty ?? 0,
    rarity: record.rarity ?? "common",
    eggGroups: asArray(record.eggGroups),
    habitatTags: asArray(record.habitatTags),
    temperamentTags: asArray(record.temperamentTags),
    capabilitySlugs: asArray(record.capabilitySlugs),
    abilitySlugs: asArray(record.abilitySlugs),
    talentSlugs: asArray(record.talentSlugs),
    learnset: asArray(record.learnset),
    evolutions: asArray(record.evolutions),
    forms: forms.map(normalizeForm),
    artwork: record.artwork ?? { portrait: "", token: "" },
    source: record.source ?? { dataset: "", sourceId: record.slug, generation: null }
  };
  return document;
}

function buildDocument(entry, formIndex) {
  const { type, record } = entry;
  if (type === "moves") return buildMove(record);
  if (type === "abilities") return buildAbility(record);
  if (type === "items") return buildItem(record);
  if (type === "talents") return buildTalent(record);
  if (type === "species") return buildSpecies(record, formIndex.get(record.slug) ?? []);
  return null;
}

function runtimePack(entry, document) {
  if (entry.type === "talents") return document.type === "pokeedge" ? "poke-edges" : "feats";
  return entry.config.pack;
}

function makeReport(validation, packs) {
  const recordsByType = {};
  for (const entry of validation.records) recordsByType[entry.type] = (recordsByType[entry.type] ?? 0) + 1;
  const documentsByPack = Object.fromEntries(Object.entries(packs).map(([pack, documents]) => [pack, documents.length]));
  const missingArtwork = validation.records.filter(entry => ["species", "forms", "items"].includes(entry.type) && !entry.record.artwork?.portrait && !entry.record.img).map(entry => `${entry.type}:${entry.record.slug}`);
  const unsupportedAutomation = validation.records.filter(entry => entry.record.automation?.state === "unsupported").map(entry => `${entry.type}:${entry.record.slug}`);

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    sourceRecords: recordsByType,
    documentsByPack,
    excluded: validation.excluded.map(entry => ({ type: entry.type, slug: entry.slug, reason: entry.reason })),
    warnings: validation.warnings,
    missingArtwork,
    unsupportedAutomation
  };
}

export async function buildCompendiums() {
  const validation = await loadAndValidateSources();
  if (validation.errors.length) {
    for (const error of validation.errors) console.error(`ERROR ${error}`);
    throw new Error(`Compendium source validation failed with ${validation.errors.length} error(s).`);
  }

  await fs.rm(fileURLToPath(BUILD_ROOT), { recursive: true, force: true });
  await ensureDirectory(BUILD_ROOT);

  const formIndex = new Map();
  for (const entry of validation.records.filter(entry => entry.type === "forms")) {
    const list = formIndex.get(entry.record.baseSpeciesSlug) ?? [];
    list.push(entry.record);
    formIndex.set(entry.record.baseSpeciesSlug, list);
  }

  const packs = {};
  for (const entry of validation.records) {
    if (["forms", "evolutions", "compatibility"].includes(entry.type)) continue;
    const document = buildDocument(entry, formIndex);
    if (!document) continue;
    const pack = runtimePack(entry, document);
    if (!pack) continue;
    packs[pack] ??= [];
    packs[pack].push(document);
  }

  for (const documents of Object.values(packs)) documents.sort((a, b) => a.system.slug.localeCompare(b.system.slug));

  for (const [pack, documents] of Object.entries(packs)) {
    const packPath = path.join(fileURLToPath(BUILD_ROOT), `${pack}.json`);
    await writeJsonFile(packPath, documents);
    const jsonl = documents.map(document => JSON.stringify(document)).join("\n");
    await fs.writeFile(path.join(fileURLToPath(BUILD_ROOT), `${pack}.jsonl`), `${jsonl}${jsonl ? "\n" : ""}`, "utf8");
  }

  const report = makeReport(validation, packs);
  await writeJsonFile(path.join(fileURLToPath(BUILD_ROOT), "coverage-report.json"), report);
  console.log(JSON.stringify(report, null, 2));
  return { packs, report };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) await buildCompendiums();
