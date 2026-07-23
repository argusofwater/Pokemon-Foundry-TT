import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];
const notes = [];

const exists = async (target) => {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const relative = (target) => path.relative(root, target).replaceAll(path.sep, "/");

async function parseJson(target, label = relative(target)) {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    errors.push(`${label}: invalid JSON (${error.message})`);
    return null;
  }
}

async function readText(target, label = relative(target)) {
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    errors.push(`${label}: unable to read (${error.message})`);
    return "";
  }
}

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "lost"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(target));
    else results.push(target);
  }
  return results;
}

function manifestAssetPaths(manifest) {
  const assets = [];
  for (const entry of manifest.esmodules ?? []) assets.push(["ES module", entry]);
  for (const entry of manifest.scripts ?? []) assets.push(["script", entry]);
  for (const entry of manifest.styles ?? []) assets.push(["stylesheet", entry]);
  for (const entry of manifest.languages ?? []) assets.push([`language ${entry.lang}`, entry.path]);
  if (manifest.background) assets.push(["background", manifest.background.replace(/^systems\/[^/]+\//, "")]);
  return assets;
}

function packCandidates(pack) {
  const candidates = [];
  if (pack.path) {
    candidates.push(pack.path);
    if (pack.path.endsWith(".db")) candidates.push(pack.path.slice(0, -3));
  }
  candidates.push(`packs/${pack.name}`);
  return [...new Set(candidates)];
}

async function validatePack(pack) {
  const candidates = packCandidates(pack);
  let selected = null;
  for (const candidate of candidates) {
    const target = path.join(root, candidate);
    if (await exists(target)) {
      selected = target;
      break;
    }
  }

  if (!pack.system) warnings.push(`Pack '${pack.name}' omits system id; Foundry usually tolerates this, but Commander packaging expects 'ptu'.`);

  if (!selected) {
    warnings.push(`Pack '${pack.name}' has no local source yet: ${candidates.join(", ")}. This is allowed before generated LevelDB packs are built.`);
    return;
  }

  const info = await stat(selected);
  if (!info.isDirectory()) {
    warnings.push(`Pack '${pack.name}' resolves to a file (${relative(selected)}); expected a LevelDB directory for Foundry V13.`);
    return;
  }

  const entries = await readdir(selected);
  const levelDbMarkers = entries.some((name) => name === "CURRENT" || name.startsWith("MANIFEST-") || name.endsWith(".ldb"));
  if (!levelDbMarkers) warnings.push(`Pack '${pack.name}' directory has no recognizable LevelDB markers: ${relative(selected)}`);

  if (!pack.path) {
    warnings.push(`Pack '${pack.name}' omits 'path'; local source resolves to ${relative(selected)}.`);
  } else if (pack.path.endsWith(".db") && relative(selected) !== pack.path) {
    warnings.push(`Pack '${pack.name}' declares legacy path '${pack.path}' but source is '${relative(selected)}'.`);
  }
}

async function validateCommanderBootstrap() {
  const ptrPath = path.join(root, "src/ptr.js");
  const initPath = path.join(root, "src/scripts/hooks/init.js");
  const sheetsPath = path.join(root, "src/scripts/sheets.js");
  const settingsPath = path.join(root, "src/module/commander/settings.js");
  const dataRegisterPath = path.join(root, "src/module/commander/data/register.js");

  const [ptr, init, sheets, settings, dataRegister] = await Promise.all([
    readText(ptrPath), readText(initPath), readText(sheetsPath), readText(settingsPath), readText(dataRegisterPath)
  ]);

  if (ptr.includes("CommanderHooks")) errors.push("src/ptr.js must not register CommanderHooks separately; PTU init is the single Commander bootstrap source.");
  if (!ptr.includes("PtuHooks.listen()")) errors.push("src/ptr.js does not call PtuHooks.listen().");

  const requiredSnippets = [
    "createCommanderController",
    "registerCommanderDataModels",
    "initializeCommanderBuild();",
    "registerSheets();",
    "GamePTU.onInit();"
  ];
  for (const snippet of requiredSnippets) if (!init.includes(snippet)) errors.push(`src/scripts/hooks/init.js missing Commander/PTU bootstrap snippet: ${snippet}`);
  if (init.indexOf("initializeCommanderBuild();") > init.indexOf("registerSheets();")) errors.push("Commander must initialize before registerSheets() so Commander sheets become available.");
  if (init.indexOf("registerSheets();") > init.indexOf("GamePTU.onInit();")) errors.push("Sheets should register before GamePTU.onInit() completes the PTU namespace setup.");

  if (!sheets.includes("registerCommanderSheets")) errors.push("src/scripts/sheets.js no longer registers Commander sheets.");
  if (!sheets.includes("commanderEnabled") || !sheets.includes("commanderMigrationConfirmed")) errors.push("src/scripts/sheets.js must gate Commander sheets on Commander settings.");

  if (!settings.includes("registerSettingOnce")) errors.push("Commander settings must be idempotent; missing registerSettingOnce().");
  if (!settings.match(/commanderEnabled[\s\S]*?default:\s*false/) ||
      !settings.match(/commanderMigrationConfirmed[\s\S]*?default:\s*false/)) {
    errors.push("Commander models and migration confirmation must default off to protect legacy actors.");
  }

  if (!dataRegister.includes("CONFIG.Actor.dataModels.character") || !dataRegister.includes("CONFIG.Actor.dataModels.pokemon")) errors.push("Commander data model registration is missing actor data model assignment.");
  if (!dataRegister.includes("installCommanderPreparationGuards")) warnings.push("Commander preparation guards are missing; legacy PTU actor prep may collide with Commander actor data.");

  notes.push("Audited Commander bootstrap order and duplicate-hook traps.");
}

async function validateCommanderTrainerSheet() {
  const sheetPath = path.join(root, "src/module/commander/sheets/trainer-sheet.js");
  const optionsPath = path.join(root, "src/module/commander/config/trainer-options.js");
  const overviewPath = path.join(root, "src/module/commander/templates/trainer/overview.hbs");
  const [sheet, options, overview] = await Promise.all([
    readText(sheetPath), readText(optionsPath), readText(overviewPath)
  ]);

  const requiredTabs = ["overview", "team", "skills", "talents", "inventory", "exploration", "social", "downtime", "effects", "biography"];
  for (const tab of requiredTabs) {
    if (!options.includes(`"${tab}"`)) errors.push(`Commander trainer tab list is missing '${tab}'.`);
    if (!sheet.match(new RegExp(`\\b${tab}:\\s*\\{\\s*template:`))) errors.push(`Commander trainer sheet is missing the '${tab}' part.`);

    const templatePath = tab === "effects"
      ? path.join(root, "src/module/commander/templates/shared/effects.hbs")
      : path.join(root, `src/module/commander/templates/trainer/${tab}.hbs`);
    const template = await readText(templatePath);
    if (!template.includes(`data-tab="${tab}"`)) errors.push(`Commander trainer '${tab}' template has no matching data-tab.`);
    if (!template.includes(`activeTab '${tab}'`)) errors.push(`Commander trainer '${tab}' template does not hide when inactive.`);
  }

  for (const field of ["background", "role", "specialty", "level"]) {
    if (!overview.includes(`name="system.identity.${field}"`)) errors.push(`Commander trainer Overview is missing identity field '${field}'.`);
  }

  for (const role of ["Ace", "Field Expert", "Tactician", "Vanguard", "Mystic", "Performer"]) {
    if (!options.includes(`"${role}"`)) errors.push(`Commander trainer roles are missing '${role}'.`);
  }

  notes.push("Audited Commander Trainer tabs, identity fields, and locked Roles.");
}

async function validateCommanderPokemonSheet() {
  const sheetPath = path.join(root, "src/module/commander/sheets/pokemon-sheet.js");
  const modelPath = path.join(root, "src/module/commander/data/models.js");
  const speciesModelPath = path.join(root, "src/module/commander/data/species-model.js");
  const speciesServicePath = path.join(root, "src/module/commander/runtime/species-service.js");
  const legalityPath = path.join(root, "src/module/commander/runtime/move-legality.js");
  const runtimeHooksPath = path.join(root, "src/module/commander/runtime/hooks.js");
  const translatorPath = path.join(root, "tools/commander/translate-learnsets.mjs");
  const learnsetReportPath = path.join(root, "temp/compendium-translated/learnsets/translation-report.json");
  const [sheet, model, speciesModel, speciesService, legality, runtimeHooks, translator] = await Promise.all([
    readText(sheetPath),
    readText(modelPath),
    readText(speciesModelPath),
    readText(speciesServicePath),
    readText(legalityPath),
    readText(runtimeHooksPath),
    readText(translatorPath)
  ]);

  const requiredTabs = ["overview", "moves", "abilities", "talents", "growth", "equipment", "bond", "exploration", "effects", "biography"];
  for (const tab of requiredTabs) {
    if (!sheet.match(new RegExp(`\\b${tab}:\\s*\\{\\s*template:`))) errors.push(`Commander Pokémon sheet is missing the '${tab}' part.`);
    const templatePath = tab === "effects"
      ? path.join(root, "src/module/commander/templates/shared/effects.hbs")
      : path.join(root, `src/module/commander/templates/pokemon/${tab}.hbs`);
    const template = await readText(templatePath);
    if (!template.includes(`data-tab="${tab}"`)) errors.push(`Commander Pokémon '${tab}' template has no matching data-tab.`);
    if (!template.includes(`activeTab '${tab}'`)) errors.push(`Commander Pokémon '${tab}' template does not hide when inactive.`);
  }

  for (const field of ["speciesUuid", "speciesName", "level", "evolutionStage", "types", "nature", "trainingPath", "lifecycle", "trainerUuid"]) {
    if (!model.includes(`${field}:`)) errors.push(`Commander Pokémon schema is missing identity field '${field}'.`);
  }

  if (!speciesService.includes("starterMoveSlugs(learnsetSpecies, resolvedLevel)")) errors.push("Generated Pokémon do not receive canonical starting moves.");
  if (!speciesService.match(/progression:\s*\{\s*mode:\s*"xp"/)) errors.push("Generated Pokémon must default to XP progression.");
  if (!sheet.includes("checkActorMove(this.actor, dropped)")) errors.push("Pokémon move-slot drops do not enforce the canonical learnset.");
  if (!runtimeHooks.includes('Hooks.on("preCreateItem"') || !runtimeHooks.includes("checkActorMove(actor, item)")) errors.push("Direct embedded Move creation is not protected by canonical legality validation.");
  if (!legality.includes("UNIVERSAL_MOVE_SLUGS") || !legality.includes("not in this species' canonical learnset")) errors.push("Canonical move-legality service is incomplete.");
  if (!speciesModel.includes('"machine"')) errors.push("Species learnset schema does not accept normalized machine moves.");
  if (!translator.includes("latestGeneration") || !translator.includes("newest available canonical generation")) errors.push("Learnset translation does not fall back for species absent from Gen 9.");

  const learnsetReport = await parseJson(learnsetReportPath);
  if (learnsetReport) {
    if (learnsetReport.speciesWithoutCanonicalLearnsets !== 0) {
      errors.push(`Canonical learnset translation left ${learnsetReport.speciesWithoutCanonicalLearnsets} Species record(s) without moves.`);
    }
    if (learnsetReport.speciesWithCanonicalLearnsets !== learnsetReport.speciesRecords) {
      errors.push("Canonical learnset coverage does not match the translated Species count.");
    }
    if (learnsetReport.unresolvedMoveSlugs?.length) {
      errors.push(`Canonical learnsets contain unresolved moves: ${learnsetReport.unresolvedMoveSlugs.join(", ")}`);
    }
  }

  notes.push("Audited Commander Pokémon tabs, identity data, starting moves, and canonical move enforcement.");
}

const manifestPath = path.join(root, "system.json");
const manifest = await parseJson(manifestPath, "system.json");
if (!manifest) process.exitCode = 1;
else {
  for (const field of ["id", "title", "version", "compatibility", "esmodules", "packs"]) {
    if (manifest[field] == null) errors.push(`system.json: missing required field '${field}'`);
  }

  for (const [kind, asset] of manifestAssetPaths(manifest)) {
    if (!await exists(path.join(root, asset))) errors.push(`Missing ${kind}: ${asset}`);
  }

  const packNames = new Set();
  for (const pack of manifest.packs ?? []) {
    if (packNames.has(pack.name)) errors.push(`Duplicate pack name '${pack.name}'`);
    packNames.add(pack.name);
    await validatePack(pack);
  }

  const packRoot = path.join(root, "packs");
  if (await exists(packRoot)) {
    for (const entry of await readdir(packRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && !packNames.has(entry.name)) {
        notes.push(`Unregistered pack directory: packs/${entry.name}`);
      }
    }
  }
}

for (const language of ["static/lang/en.json", "static/lang/es.json"]) {
  const target = path.join(root, language);
  if (await exists(target)) await parseJson(target, language);
}

const jsFiles = (await walk(path.join(root, "src"))).filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));
let checkedJs = 0;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  checkedJs += 1;
  if (result.status !== 0) errors.push(`${relative(file)}: JavaScript syntax error\n${result.stderr.trim()}`);
}
notes.push(`Checked ${checkedJs} JavaScript modules.`);

await validateCommanderBootstrap();
await validateCommanderTrainerSheet();
await validateCommanderPokemonSheet();

console.log("PTR system validation\n=====================");
for (const note of notes) console.log(`NOTE  ${note}`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`ERROR ${error}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length || (strict && warnings.length)) process.exitCode = 1;
