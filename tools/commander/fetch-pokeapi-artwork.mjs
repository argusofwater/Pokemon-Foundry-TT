import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseCsv, sluggify, writeJsonFile } from "./utils.mjs";

const REPO = "PokeAPI/sprites";
const OUTPUT_ASSET_ROOT = path.resolve("static/assets/commander");
const OUTPUT_DATA_ROOT = path.resolve("temp/compendium-translated/artwork");
const RAW_POKEAPI_ROOT = path.resolve("temp/compendium-raw/pokeapi/data/v2/csv");
const TRANSLATED_ROOT = path.resolve("temp/compendium-translated");
const token = process.env.GITHUB_TOKEN ?? "";

const headers = {
  "User-Agent": "Commander-Build-Artwork-Importer",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

async function request(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

async function resolveCommit() {
  const data = await request(`https://api.github.com/repos/${REPO}/commits?per_page=1`).then(response => response.json());
  if (!Array.isArray(data) || !data[0]?.sha) throw new Error(`Could not resolve ${REPO} commit.`);
  return {
    sha: data[0].sha,
    date: data[0].commit?.committer?.date ?? data[0].commit?.author?.date ?? null,
    url: data[0].html_url
  };
}

function normalizeIdentifier(value) {
  return sluggify(value)
    .replace(/-gmax$/, "")
    .replace(/-totem$/, "")
    .replace(/-starter$/, "");
}

function candidateIdentifiers(record) {
  const values = new Set();
  values.add(normalizeIdentifier(record.slug));
  if (record.source?.sourceId) values.add(normalizeIdentifier(record.source.sourceId));
  if (record.baseSpeciesSlug && record.formSlug) values.add(normalizeIdentifier(`${record.baseSpeciesSlug}-${record.formSlug}`));
  if (record.baseSpeciesSlug) values.add(normalizeIdentifier(record.baseSpeciesSlug));
  return [...values].filter(Boolean);
}

function pokemonIdMaps(rows) {
  const byIdentifier = new Map();
  const bySpecies = new Map();
  for (const row of rows) {
    const id = Number(row.id);
    const speciesId = Number(row.species_id);
    if (!Number.isFinite(id)) continue;
    const identifier = normalizeIdentifier(row.identifier);
    byIdentifier.set(identifier, id);
    if (!bySpecies.has(speciesId) || row.is_default === "1") bySpecies.set(speciesId, id);
  }
  return { byIdentifier, bySpecies };
}

function resolvePokemonId(record, maps) {
  for (const candidate of candidateIdentifiers(record)) {
    if (maps.byIdentifier.has(candidate)) return { id: maps.byIdentifier.get(candidate), matchedBy: candidate };
  }
  if (maps.bySpecies.has(Number(record.nationalDex))) {
    return { id: maps.bySpecies.get(Number(record.nationalDex)), matchedBy: `national-dex:${record.nationalDex}` };
  }
  return null;
}

async function download(url, destination) {
  try {
    const response = await request(url);
    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes);
    return {
      bytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex")
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function importPokemon(records, commit, maps, folder) {
  const manifest = [];
  const enriched = [];
  for (const sourceRecord of records) {
    const record = structuredClone(sourceRecord);
    const match = resolvePokemonId(record, maps);
    if (!match) {
      manifest.push({ slug: record.slug, status: "missing-id", candidates: candidateIdentifiers(record) });
      enriched.push(record);
      continue;
    }

    const relativePath = `assets/commander/${folder}/${record.slug}.png`;
    const destination = path.join("static", relativePath);
    const sourceUrl = `https://raw.githubusercontent.com/${REPO}/${commit.sha}/sprites/pokemon/${match.id}.png`;
    const result = await download(sourceUrl, destination);
    if (result.error) {
      manifest.push({ slug: record.slug, pokemonId: match.id, matchedBy: match.matchedBy, status: "missing-sprite", sourceUrl, error: result.error });
      enriched.push(record);
      continue;
    }

    record.artwork = {
      ...(record.artwork ?? {}),
      portrait: `systems/ptu/${relativePath}`,
      token: `systems/ptu/${relativePath}`,
      source: "pokeapi-sprites",
      sourceId: String(match.id)
    };
    manifest.push({ slug: record.slug, pokemonId: match.id, matchedBy: match.matchedBy, status: "downloaded", path: relativePath, sourceUrl, ...result });
    enriched.push(record);
  }
  return { manifest, enriched };
}

async function importItems(records, commit) {
  const manifest = [];
  const enriched = [];
  for (const sourceRecord of records) {
    const record = structuredClone(sourceRecord);
    const sourceId = normalizeIdentifier(record.source?.sourceId ?? record.slug);
    const relativePath = `assets/commander/items/${record.slug}.png`;
    const destination = path.join("static", relativePath);
    const sourceUrl = `https://raw.githubusercontent.com/${REPO}/${commit.sha}/sprites/items/${sourceId}.png`;
    const result = await download(sourceUrl, destination);
    if (result.error) {
      manifest.push({ slug: record.slug, sourceId, status: "missing-sprite", sourceUrl, error: result.error });
      enriched.push(record);
      continue;
    }

    record.img = `systems/ptu/${relativePath}`;
    record.artwork = { source: "pokeapi-sprites", sourceId };
    manifest.push({ slug: record.slug, sourceId, status: "downloaded", path: relativePath, sourceUrl, ...result });
    enriched.push(record);
  }
  return { manifest, enriched };
}

async function main() {
  const commit = await resolveCommit();
  const pokemonRows = parseCsv(await fs.readFile(path.join(RAW_POKEAPI_ROOT, "pokemon.csv"), "utf8"));
  const maps = pokemonIdMaps(pokemonRows);

  const [species, megaForms, primalForms, items] = await Promise.all([
    fs.readFile(path.join(TRANSLATED_ROOT, "learnsets/species-with-learnsets.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(TRANSLATED_ROOT, "species/mega-forms.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(TRANSLATED_ROOT, "species/primal-forms.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(TRANSLATED_ROOT, "items/items.json"), "utf8").then(JSON.parse)
  ]);

  await fs.rm(OUTPUT_ASSET_ROOT, { recursive: true, force: true });
  await fs.rm(OUTPUT_DATA_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DATA_ROOT, { recursive: true });

  const speciesResult = await importPokemon(species, commit, maps, "pokemon");
  const megaResult = await importPokemon(megaForms, commit, maps, "forms");
  const primalResult = await importPokemon(primalForms, commit, maps, "forms");
  const itemResult = await importItems(items, commit);

  const allManifest = {
    generatedAt: new Date().toISOString(),
    source: {
      repository: REPO,
      commit: commit.sha,
      commitDate: commit.date,
      commitUrl: commit.url,
      notice: "Pokémon sprite imagery is owned by its respective rights holders and is used in this private, noncommercial fan project."
    },
    species: speciesResult.manifest,
    megaForms: megaResult.manifest,
    primalForms: primalResult.manifest,
    items: itemResult.manifest
  };

  const downloaded = list => list.filter(entry => entry.status === "downloaded").length;
  const missing = list => list.length - downloaded(list);

  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "artwork-manifest.json"), allManifest);
  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "species-with-artwork.json"), speciesResult.enriched);
  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "mega-forms-with-artwork.json"), megaResult.enriched);
  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "primal-forms-with-artwork.json"), primalResult.enriched);
  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "items-with-artwork.json"), itemResult.enriched);
  await writeJsonFile(path.join(OUTPUT_DATA_ROOT, "translation-report.json"), {
    generatedAt: new Date().toISOString(),
    sourceRepository: REPO,
    sourceCommit: commit.sha,
    species: { total: speciesResult.manifest.length, downloaded: downloaded(speciesResult.manifest), missing: missing(speciesResult.manifest) },
    megaForms: { total: megaResult.manifest.length, downloaded: downloaded(megaResult.manifest), missing: missing(megaResult.manifest) },
    primalForms: { total: primalResult.manifest.length, downloaded: downloaded(primalResult.manifest), missing: missing(primalResult.manifest) },
    items: { total: itemResult.manifest.length, downloaded: downloaded(itemResult.manifest), missing: missing(itemResult.manifest) },
    assetRoot: "static/assets/commander",
    foundryPathPrefix: "systems/ptu/assets/commander"
  });

  console.log(`Downloaded ${downloaded(speciesResult.manifest)} species, ${downloaded(megaResult.manifest) + downloaded(primalResult.manifest)} form, and ${downloaded(itemResult.manifest)} item sprites.`);
}

await main();
