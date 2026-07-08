import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TRANSLATED = path.join(ROOT, "temp", "compendium-translated");
const DATA_SRC = path.join(ROOT, "data-src");

const mappings = [
  ["learnsets/species-with-learnsets.json", "species/species.json"],
  ["learnsets/form-profiles-with-learnsets.json", "forms/forms.json"],
  ["moves/moves.json", "moves/moves.json"],
  ["abilities/abilities.json", "abilities/abilities.json"],
  ["items/items.json", "items/items.json"]
];

async function copyJson(sourceRelative, destinationRelative) {
  const source = path.join(TRANSLATED, sourceRelative);
  const destination = path.join(DATA_SRC, destinationRelative);
  const text = await fs.readFile(source, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${sourceRelative} did not contain a non-empty record array.`);
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`Normalized ${parsed.length} records: ${sourceRelative} -> ${destinationRelative}`);
}

await fs.rm(DATA_SRC, { recursive: true, force: true });
for (const [source, destination] of mappings) await copyJson(source, destination);
