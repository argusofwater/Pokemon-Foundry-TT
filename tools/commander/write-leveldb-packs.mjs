import fs from "node:fs/promises";
import path from "node:path";
import { ClassicLevel } from "classic-level";

const ROOT = process.cwd();
const BUILD_ROOT = path.join(ROOT, "build", "commander-compendiums");
const PACK_ROOT = path.join(ROOT, "packs");
const PACKS = ["species", "moves", "abilities", "items", "feats", "poke-edges"];
const REQUIRED_PACKS = new Set(["species", "moves", "abilities", "items"]);

async function readJsonLines(file) {
  const text = await fs.readFile(file, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

async function writePack(pack) {
  const source = path.join(BUILD_ROOT, `${pack}.jsonl`);
  const destination = path.join(PACK_ROOT, pack);

  try {
    await fs.access(source);
  } catch {
    if (REQUIRED_PACKS.has(pack)) throw new Error(`Required Commander pack source is missing: ${source}`);
    console.log(`Skipping optional pack ${pack}; no generated source exists yet.`);
    return 0;
  }

  const documents = await readJsonLines(source);
  if (REQUIRED_PACKS.has(pack) && documents.length === 0) {
    throw new Error(`Required Commander pack ${pack} generated zero documents.`);
  }

  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });

  const db = new ClassicLevel(destination, { keyEncoding: "utf8", valueEncoding: "json" });
  await db.open();
  try {
    const operations = documents.map(document => ({
      type: "put",
      key: `!items!${document._id}`,
      value: document
    }));
    if (operations.length) await db.batch(operations);
  } finally {
    await db.close();
  }

  console.log(`Wrote ${documents.length} documents to packs/${pack}`);
  return documents.length;
}

const counts = {};
for (const pack of PACKS) counts[pack] = await writePack(pack);
await fs.writeFile(path.join(BUILD_ROOT, "runtime-pack-counts.json"), `${JSON.stringify(counts, null, 2)}\n`, "utf8");
