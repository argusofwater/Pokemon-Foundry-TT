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

console.log("PTR system validation\n=====================");
for (const note of notes) console.log(`NOTE  ${note}`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`ERROR ${error}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length || (strict && warnings.length)) process.exitCode = 1;
