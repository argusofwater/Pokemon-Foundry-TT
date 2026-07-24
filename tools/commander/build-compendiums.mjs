import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_ROOT, SCHEMA_VERSION } from "./compendium-config.mjs";
import { loadAndValidateSources } from "./validate-source.mjs";
import { asArray, ensureDirectory, stableId, writeJsonFile } from "./utils.mjs";
import { defaultItemImage, resolveSpeciesArtwork } from "./artwork-paths.mjs";

function sourceMeta(record) {
  return { profile: record.rulesProfile ?? "commander", book: record.source?.dataset ?? "", page: record.source?.sourceId ?? "" };
}

function titleCase(value) {
  const text = String(value ?? "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";
}

function legacyRange(range) {
  if (typeof range === "string") return range;
  if (!range) return "";
  if (range.unit === "self") return "Self";
  if (range.unit === "scene") return "Scene";
  const value = Number(range.value ?? 0);
  const shape = range.shape && range.shape !== "single" ? ` ${titleCase(range.shape)}` : "";
  const area = Number(range.area ?? 0) ? ` ${range.area}` : "";
  return `${value || 1} ${range.unit ?? "melee"}${shape}${area}`.trim();
}

function legacyFrequency(recharge) {
  const category = recharge?.category ?? "at-will";
  if (category === "cooldown") return `Cooldown ${Number(recharge.rounds ?? 1) || 1}`;
  if (category === "encounter") return "Scene";
  if (category === "expedition") return "Expedition";
  return "At-Will";
}

function baseItemDocument(record, type) {
  const description = record.description ?? record.effect ?? "";
  const tags = asArray(record.tags);
  return {
    _id: stableId(type, record.slug),
    name: record.name,
    type,
    img: defaultItemImage(type, record),
    system: {
      schema: { version: SCHEMA_VERSION, lastMigration: "" },
      slug: record.slug,
      description,
      effect: description,
      snippet: description,
      origin: record.source?.dataset ?? "Commander Compendium",
      keywords: tags,
      tags,
      automation: record.automation ?? { state: "manual", handler: "", notes: "" },
      source: sourceMeta(record),
      commander: { profile: "commander" }
    },
    flags: { ptu: { commanderSource: { schemaVersion: record.schemaVersion ?? SCHEMA_VERSION, sourceId: record.source?.sourceId ?? record.slug } } }
  };
}

function buildMove(record) {
  const document = baseItemDocument(record, "move");
  const category = titleCase(record.category || "status");
  const type = titleCase(record.type || "normal");
  const recharge = record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 };
  Object.assign(document.system, {
    type,
    commanderType: String(record.type ?? "normal").toLowerCase(),
    category,
    commanderCategory: String(record.category ?? "status").toLowerCase(),
    power: record.power,
    damageBase: record.power,
    damageBonus: 0,
    accuracy: record.accuracy ?? null,
    ac: record.accuracy ?? "",
    accuracyModifier: record.accuracyModifier ?? 0,
    accuracyHindered: Boolean(record.accuracyHindered),
    priority: record.priority ?? 0,
    range: legacyRange(record.range),
    commanderRange: record.range ?? { value: 1, unit: "melee", shape: "single", area: 0 },
    target: record.target ?? { defense: String(record.category ?? "status").toLowerCase() === "physical" ? "physical" : String(record.category ?? "status").toLowerCase() === "special" ? "special" : "none", count: 1, disposition: "enemy", sourceTarget: "normal" },
    recharge,
    frequency: legacyFrequency(recharge),
    effects: asArray(record.effects),
    contest: record.contest ?? { tags: [], category: "", appeal: 0 },
    contestType: titleCase(record.contest?.category ?? ""),
    tutorModification: { active: false, name: "", description: "" },
    sourceMetadata: record.sourceMetadata ?? {}
  });
  return document;
}

function buildAbility(record) {
  const document = baseItemDocument(record, "ability");
  const recharge = record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 };
  Object.assign(document.system, {
    abilityType: record.abilityType ?? "passive",
    trigger: record.trigger ?? "",
    effect: record.effect ?? record.description ?? "",
    description: record.description ?? record.effect ?? "",
    snippet: record.effect ?? record.description ?? "",
    recharge,
    frequency: legacyFrequency(recharge),
    powerTier: record.powerTier ?? "standard",
    tier: titleCase(record.powerTier ?? "standard"),
    innate: Boolean(record.innate),
    entryLimit: record.entryLimit ?? 1,
    sourceMetadata: record.sourceMetadata ?? {}
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
    cost: record.cost ?? 0,
    consumable: Boolean(record.consumedOnUse) ? 1 : 0,
    consumedOnUse: Boolean(record.consumedOnUse),
    location: "carried",
    slot: record.slot ?? "",
    subtype: record.category === "pokeball" ? "pokeball" : record.category ?? "",
    container: false,
    assignedActorUuid: "",
    suppressed: false,
    compatibility: asArray(record.compatibility),
    effects: asArray(record.effects),
    sourceMetadata: record.sourceMetadata ?? {}
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
    prerequisites: record.requirement ? [record.requirement] : [],
    notes: record.description ?? "",
    action: record.action ?? "passive",
    frequency: titleCase(record.action ?? "passive"),
    trigger: record.trigger ?? "",
    recharge: record.recharge ?? { category: "at-will", rounds: 0, remaining: 0 },
    upgradeOf: record.upgradeOf ?? "",
    cost: record.cost ?? 0,
    free: false,
    class: record.role ?? ""
  });
  return document;
}

function normalizeForm(record) {
  const artwork = resolveSpeciesArtwork(record);
  return {
    slug: record.slug, name: record.name, family: record.family, temporary: record.temporary ?? true,
    types: asArray(record.types).map(titleCase), canonicalStats: record.canonicalStats ?? {}, stats: legacyStats(record.stats ?? {}), commanderStats: record.stats,
    abilitySlugs: asArray(record.abilitySlugs), movement: record.movement ?? { overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 },
    size: record.size ?? "", portrait: artwork.portrait, token: artwork.token,
    tokenWidth: record.tokenWidth ?? 1, tokenHeight: record.tokenHeight ?? 1,
    requirements: record.requirements ?? { itemSlug: "", trainerTalentSlug: "", trainerItemSlug: "", baseSpeciesSlugs: [record.baseSpeciesSlug], campaignFlag: "" },
    replacesMoveSlugs: asArray(record.replacesMoveSlugs), addsMoveSlugs: asArray(record.addsMoveSlugs), tags: asArray(record.tags)
  };
}

function legacyStats(stats = {}) {
  return {
    hp: Number(stats.hp ?? 1),
    atk: Number(stats.attack ?? stats.atk ?? 1),
    def: Number(stats.defense ?? stats.def ?? 1),
    spatk: Number(stats.specialAttack ?? stats.spatk ?? stats.spa ?? 1),
    spdef: Number(stats.specialDefense ?? stats.spdef ?? stats.spd ?? 1),
    spd: Number(stats.speed ?? stats.spd ?? 1),
    attack: Number(stats.attack ?? stats.atk ?? 1),
    defense: Number(stats.defense ?? stats.def ?? 1),
    specialAttack: Number(stats.specialAttack ?? stats.spatk ?? stats.spa ?? 1),
    specialDefense: Number(stats.specialDefense ?? stats.spdef ?? 1),
    speed: Number(stats.speed ?? stats.spd ?? 1)
  };
}

function defaultSkills() {
  const body = ["acrobatics", "athletics", "combat", "intimidate", "stealth", "survival"];
  const mind = ["generalEd", "medicineEd", "occultEd", "pokemonEd", "techEd", "guile", "perception"];
  const spirit = ["charm", "command", "focus", "intuition"];
  return Object.fromEntries([...body, ...mind, ...spirit].map(key => [key, { value: mind.includes(key) ? 1 : 2, modifier: 0, type: body.includes(key) ? "body" : mind.includes(key) ? "mind" : "spirit" }]));
}

function legacyMoves(learnset = []) {
  const moves = { level: [], machine: [], egg: [], tutor: [] };
  for (const entry of asArray(learnset)) {
    const method = entry.method === "tm" || entry.method === "tr" ? "machine" : ["egg", "tutor"].includes(entry.method) ? entry.method : "level";
    moves[method].push({ slug: entry.moveSlug, uuid: "", level: method === "level" ? (entry.level ?? 1) : undefined });
  }
  moves.level.sort((a, b) => Number(a.level ?? 1) - Number(b.level ?? 1));
  return moves;
}

function legacyAbilities(slugs = []) {
  const unique = asArray(slugs).map(slug => ({ slug, uuid: "" }));
  return { basic: unique.slice(0, 2), advanced: unique.slice(2, 3), high: unique.slice(3) };
}

function legacyCapabilities(movement = {}, capabilitySlugs = []) {
  return {
    overland: Number(movement.overland ?? 5),
    sky: Number(movement.fly ?? 0),
    swim: Number(movement.swim ?? 0),
    levitate: asArray(capabilitySlugs).includes("levitate") ? Number(movement.fly ?? 4) || 4 : 0,
    burrow: Number(movement.burrow ?? 0),
    highJump: 1,
    longJump: 1,
    power: 1,
    naturewalk: [],
    other: asArray(capabilitySlugs).map(slug => ({ slug, uuid: "" }))
  };
}

function buildSpecies(record, forms) {
  const document = baseItemDocument(record, "species");
  const movement = record.movement ?? { overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 };
  const description = record.description ?? "";
  const artwork = resolveSpeciesArtwork(record);
  document.img = artwork.img;
  document.system = {
    schema: { version: SCHEMA_VERSION, lastMigration: "" },
    slug: record.slug,
    description,
    effect: description,
    snippet: description,
    dexentry: description,
    number: record.nationalDex ?? -1,
    nationalDex: record.nationalDex ?? null,
    form: record.formSlug ?? "",
    formSlug: record.formSlug ?? "",
    formKind: record.formKind ?? "base",
    baseSpeciesSlug: record.baseSpeciesSlug ?? "",
    types: asArray(record.types).map(titleCase),
    canonicalStats: record.canonicalStats ?? {},
    commanderStats: record.stats,
    stats: legacyStats(record.stats ?? {}),
    movement,
    size: {
      height: record.heightMeters ?? 0,
      weight: record.weightKg ?? 0,
      sizeClass: record.size ?? "medium",
      weightClass: record.weightClass ?? 1
    },
    heightMeters: record.heightMeters ?? 0,
    weightKg: record.weightKg ?? 0,
    weightClass: record.weightClass ?? 1,
    captureDifficulty: record.captureDifficulty ?? 0,
    rarity: record.rarity ?? "common",
    breeding: { genderRatio: 0, eggGroups: asArray(record.eggGroups), hatchRate: 0 },
    eggGroups: asArray(record.eggGroups),
    habitats: asArray(record.habitatTags),
    diet: [],
    habitatTags: asArray(record.habitatTags),
    temperamentTags: asArray(record.temperamentTags),
    capabilities: legacyCapabilities(movement, record.capabilitySlugs),
    capabilitySlugs: asArray(record.capabilitySlugs),
    abilities: legacyAbilities(record.abilitySlugs),
    abilitySlugs: asArray(record.abilitySlugs),
    talentSlugs: asArray(record.talentSlugs),
    learnset: asArray(record.learnset),
    moves: legacyMoves(record.learnset),
    evolutions: asArray(record.evolutions).map(evolution => ({
      slug: evolution.targetSpeciesSlug,
      targetSpeciesSlug: evolution.targetSpeciesSlug,
      uuid: "",
      method: evolution.method ?? "special",
      level: evolution.level ?? 1,
      itemSlug: evolution.itemSlug ?? "",
      condition: evolution.condition ?? "",
      other: { restrictions: evolution.condition ? [evolution.condition] : [], evolutionItem: evolution.itemSlug ? { slug: evolution.itemSlug, uuid: "" } : undefined }
    })),
    forms: forms.map(normalizeForm),
    skills: defaultSkills(),
    keywords: asArray(record.tags),
    artwork: { ...(record.artwork ?? {}), portrait: artwork.portrait, token: artwork.token, source: artwork.source },
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

function isPlaceholderArtwork(document) {
  return !document.img || document.img === "icons/svg/item-bag.svg" || document.img === "icons/svg/mystery-man.svg" || document.img === "icons/svg/pawprint.svg";
}

function auditDocuments(packs) {
  const empty = {};
  for (const [pack, documents] of Object.entries(packs)) {
    empty[pack] = {
      missingDescription: documents.filter(document => !String(document.system?.description ?? document.system?.effect ?? "").trim()).map(document => document.system?.slug),
      missingArtwork: documents.filter(isPlaceholderArtwork).map(document => document.system?.slug),
      missingAutomationHandler: documents.filter(document => document.system?.automation?.state === "automatic" && !document.system?.automation?.handler).map(document => document.system?.slug)
    };
    if (pack === "species") {
      empty[pack].missingLearnset = documents.filter(document => !(document.system?.learnset?.length)).map(document => document.system?.slug);
      empty[pack].missingAbilities = documents.filter(document => !(document.system?.abilitySlugs?.length)).map(document => document.system?.slug);
      empty[pack].missingCapabilities = documents.filter(document => !(document.system?.capabilitySlugs?.length)).map(document => document.system?.slug);
      empty[pack].placeholderMovement = documents.filter(document => JSON.stringify(document.system?.movement) === JSON.stringify({ overland: 5, swim: 0, fly: 0, burrow: 0, climb: 0 })).map(document => document.system?.slug);
    }
  }
  return empty;
}

function makeReport(validation, packs) {
  const recordsByType = {};
  for (const entry of validation.records) recordsByType[entry.type] = (recordsByType[entry.type] ?? 0) + 1;
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    sourceRecords: recordsByType,
    documentsByPack: Object.fromEntries(Object.entries(packs).map(([pack, documents]) => [pack, documents.length])),
    excluded: validation.excluded.map(entry => ({ type: entry.type, slug: entry.slug, reason: entry.reason })),
    warnings: validation.warnings,
    contentAudit: auditDocuments(packs),
    unsupportedAutomation: validation.records.filter(entry => entry.record.automation?.state === "unsupported").map(entry => `${entry.type}:${entry.record.slug}`)
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
    await writeJsonFile(path.join(fileURLToPath(BUILD_ROOT), `${pack}.json`), documents);
    const jsonl = documents.map(document => JSON.stringify(document)).join("\n");
    await fs.writeFile(path.join(fileURLToPath(BUILD_ROOT), `${pack}.jsonl`), `${jsonl}${jsonl ? "\n" : ""}`, "utf8");
  }

  const report = makeReport(validation, packs);
  await writeJsonFile(path.join(fileURLToPath(BUILD_ROOT), "coverage-report.json"), report);
  console.log(JSON.stringify(report, null, 2));
  return { packs, report };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) await buildCompendiums();
