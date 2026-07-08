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

function normalizeRecords(sourceRelative, records) {
  if (sourceRelative === "abilities/abilities.json") {
    let repaired = 0;
    const normalized = records.map(record => {
      if (typeof record.effect === "string" && record.effect.trim()) return record;
      repaired += 1;
      const fallback = typeof record.description === "string" && record.description.trim()
        ? record.description.trim()
        : "No rules text was available in the imported source; GM adjudication required.";
      return {
        ...record,
        effect: fallback,
        automation: {
          ...(record.automation ?? {}),
          state: record.automation?.state ?? "manual",
          notes: [record.automation?.notes, "Blank imported effect repaired during normalization."].filter(Boolean).join(" ")
        }
      };
    });
    if (repaired) console.warn(`Repaired ${repaired} translated ability record(s) with blank effect text.`);
    return normalized;
  }
  return records;
}

async function copyJson(sourceRelative, destinationRelative) {
  const source = path.join(TRANSLATED, sourceRelative);
  const destination = path.join(DATA_SRC, destinationRelative);
  const text = await fs.readFile(source, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${sourceRelative} did not contain a non-empty record array.`);
  }
  const normalized = normalizeRecords(sourceRelative, parsed);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  console.log(`Normalized ${normalized.length} records: ${sourceRelative} -> ${destinationRelative}`);
}

await fs.rm(DATA_SRC, { recursive: true, force: true });
for (const [source, destination] of mappings) await copyJson(source, destination);
