import fs from "node:fs/promises";
import path from "node:path";
import { ClassicLevel } from "classic-level";

const ROOT = process.cwd();
const BUILD_ROOT = path.join(ROOT, "build", "commander-compendiums");
const PACK_ROOT = path.join(ROOT, "packs");
const PACKS = ["species", "moves", "abilities", "items", "feats", "poke-edges"];

async function readJsonLines(file) {
  const text = await fs.readFile(file, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

async function writePack(pack) {
  const source = path.join(BUILD_ROOT, `${pack}.jsonl`);
  const destination = path.join(PACK_ROOT, pack);
  const documents = await readJsonLines(source);

  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });

  const db = new ClassicLevel(destination, { keyEncoding: "utf8", valueEncoding: "json" });
  await db.open();
  try {
    const operations = documents.map(document => ({ type: "put", key: document._id, value: document }));
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
