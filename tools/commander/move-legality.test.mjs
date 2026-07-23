import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  availableCanonicalMoves,
  checkActorMove,
  checkCanonicalMove,
  normalizeLearnset,
  starterMoveSlugs
} from "../../src/module/commander/runtime/move-legality.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const translatedSpecies = JSON.parse(
  fs.readFileSync(path.join(root, "temp/compendium-translated/learnsets/species-with-learnsets.json"), "utf8")
);
const translatedMoves = JSON.parse(
  fs.readFileSync(path.join(root, "temp/compendium-translated/moves/moves.json"), "utf8")
);
const eevee = translatedSpecies.find(species => species.slug === "eevee");
const caterpie = translatedSpecies.find(species => species.slug === "caterpie");

test("the canonical source includes Eevee's Gen 9 learnset", () => {
  assert.ok(eevee);
  assert.ok(normalizeLearnset(eevee).length > 20);
});

test("species absent from Gen 9 receive their newest canonical learnset", () => {
  assert.ok(caterpie);
  assert.ok(normalizeLearnset(caterpie).some(entry => entry.moveSlug === "tackle" && entry.level === 1));
});

test("every canonical learnset move resolves to the Move compendium source", () => {
  const moveSlugs = new Set(translatedMoves.map(move => move.slug));
  const unresolved = new Set();
  for (const species of translatedSpecies) {
    for (const entry of species.learnset ?? []) {
      if (!moveSlugs.has(entry.moveSlug)) unresolved.add(entry.moveSlug);
    }
  }
  assert.deepEqual([...unresolved], []);
});

test("Eevee accepts canonical moves and rejects Oblivion Wing", () => {
  assert.equal(checkCanonicalMove(eevee, { name: "Tackle", system: { slug: "tackle" } }).legal, true);
  assert.equal(checkCanonicalMove(eevee, { name: "Shadow Ball", system: { slug: "shadow-ball" } }).legal, true);
  const illegal = checkCanonicalMove(eevee, { name: "Oblivion Wing", system: { slug: "oblivion-wing" } });
  assert.equal(illegal.legal, false);
  assert.match(illegal.reason, /not in this species/i);
});

test("new Eevee receives only level-appropriate canonical starting moves", () => {
  assert.deepEqual(
    starterMoveSlugs(eevee, 1),
    ["covet", "growl", "helping-hand", "tackle", "tail-whip"]
  );
  const known = new Set(normalizeLearnset(eevee).map(entry => entry.moveSlug));
  for (const slug of starterMoveSlugs(eevee, 20)) assert.ok(known.has(slug));
});

test("actor legality uses the embedded Species record", () => {
  const actor = {
    system: { identity: { level: 1 } },
    itemTypes: {
      species: [{ type: "species", system: eevee }],
      move: [{ name: "Tackle", system: { slug: "tackle" } }]
    }
  };
  assert.equal(checkActorMove(actor, { name: "Growl", system: { slug: "growl" } }).legal, true);
  assert.equal(checkActorMove(actor, { name: "Oblivion Wing", system: { slug: "oblivion-wing" } }).legal, false);
  assert.ok(availableCanonicalMoves(actor).some(entry => entry.moveSlug === "shadow-ball" && entry.available));
});

test("Struggle remains a universal emergency move", () => {
  assert.equal(checkCanonicalMove({ learnset: [] }, { name: "Struggle", system: { slug: "struggle" } }).legal, true);
});
