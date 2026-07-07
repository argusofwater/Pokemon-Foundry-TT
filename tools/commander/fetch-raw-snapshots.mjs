import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CUTOFF = "2025-10-15T23:59:59Z";
const OUTPUT_ROOT = path.resolve("temp/compendium-raw");
const token = process.env.GITHUB_TOKEN ?? "";

const headers = {
  "User-Agent": "Commander-Build-Compendium-Snapshot",
  Accept: "application/vnd.github+json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

const SOURCES = [
  {
    key: "pokemon-showdown",
    owner: "smogon",
    repo: "pokemon-showdown",
    files: [
      "LICENSE",
      "data/pokedex.ts",
      "data/moves.ts",
      "data/abilities.ts",
      "data/items.ts",
      "data/learnsets.ts",
      "data/formats-data.ts",
      "data/typechart.ts",
      "data/natures.ts"
    ]
  },
  {
    key: "pokeapi",
    owner: "PokeAPI",
    repo: "pokeapi",
    files: [
      "LICENSE.md",
      "data/v2/csv/abilities.csv",
      "data/v2/csv/ability_names.csv",
      "data/v2/csv/egg_groups.csv",
      "data/v2/csv/evolution_chains.csv",
      "data/v2/csv/items.csv",
      "data/v2/csv/item_names.csv",
      "data/v2/csv/moves.csv",
      "data/v2/csv/move_damage_classes.csv",
      "data/v2/csv/move_names.csv",
      "data/v2/csv/pokemon.csv",
      "data/v2/csv/pokemon_abilities.csv",
      "data/v2/csv/pokemon_egg_groups.csv",
      "data/v2/csv/pokemon_evolution.csv",
      "data/v2/csv/pokemon_forms.csv",
      "data/v2/csv/pokemon_moves.csv",
      "data/v2/csv/pokemon_species.csv",
      "data/v2/csv/pokemon_stats.csv",
      "data/v2/csv/pokemon_types.csv",
      "data/v2/csv/stats.csv",
      "data/v2/csv/types.csv",
      "data/v2/csv/version_groups.csv",
      "data/v2/csv/versions.csv"
    ]
  }
];

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

async function resolveCommit(source) {
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/commits?until=${encodeURIComponent(CUTOFF)}&per_page=1`;
  const commits = await request(url).then(response => response.json());
  if (!Array.isArray(commits) || !commits[0]?.sha) throw new Error(`Could not resolve cutoff commit for ${source.owner}/${source.repo}`);
  return commits[0];
}

async function fetchFile(source, sha, file) {
  const url = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${sha}/${file}`;
  const response = await request(url, { headers: { Accept: "application/octet-stream" } });
  const buffer = Buffer.from(await response.arrayBuffer());
  const destination = path.join(OUTPUT_ROOT, source.key, file);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer);
  return {
    path: file,
    bytes: buffer.length,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    sourceUrl: url
  };
}

async function main() {
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  const manifest = {
    cutoff: CUTOFF,
    cutoffLabel: "gen9-sv-dlc-pre-za",
    generatedAt: new Date().toISOString(),
    untouchedRawSnapshots: true,
    sources: []
  };

  for (const source of SOURCES) {
    const commit = await resolveCommit(source);
    const sourceRecord = {
      key: source.key,
      repository: `${source.owner}/${source.repo}`,
      commit: commit.sha,
      commitDate: commit.commit?.committer?.date ?? commit.commit?.author?.date ?? null,
      commitUrl: commit.html_url,
      files: []
    };

    for (const file of source.files) {
      try {
        sourceRecord.files.push(await fetchFile(source, commit.sha, file));
      } catch (error) {
        sourceRecord.files.push({ path: file, error: error.message });
      }
    }

    manifest.sources.push(sourceRecord);
  }

  await fs.writeFile(path.join(OUTPUT_ROOT, "snapshot-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(OUTPUT_ROOT, "README.md"), `# Temporary Compendium Raw Snapshots\n\nThese files are untouched upstream snapshots resolved to the final repository commits before ${CUTOFF}.\n\nCutoff label: \`gen9-sv-dlc-pre-za\`\n\nNothing in this directory is translated into Commander Build rules yet. Organize and normalize it piece by piece into \`data-src/\`.\n`, "utf8");

  console.log(JSON.stringify(manifest, null, 2));
}

await main();
