import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateLevelGain,
  combatXpForLevel,
  trainingXpForTrainerLevel,
  xpThreshold
} from "../../src/scripts/hooks/commander-progression.js";

test("XP thresholds use the Commander baseline", () => {
  assert.equal(xpThreshold(1), 12);
  assert.equal(xpThreshold(50), 110);
  assert.equal(xpThreshold(100), 210);
});

test("combat XP is twice the defeated Pokémon level", () => {
  assert.equal(combatXpForLevel(1), 2);
  assert.equal(combatXpForLevel(37), 74);
});

test("training XP uses trainer level with a minimum of five", () => {
  assert.equal(trainingXpForTrainerLevel(1), 5);
  assert.equal(trainingXpForTrainerLevel(5), 5);
  assert.equal(trainingXpForTrainerLevel(12), 12);
});

test("one award can grant multiple levels and preserves remainder", () => {
  assert.deepEqual(calculateLevelGain(1, 0, 42), {
    level: 4,
    experience: 0,
    levelsGained: 3
  });
});

test("level 100 is capped and cannot bank additional XP", () => {
  assert.deepEqual(calculateLevelGain(99, 0, 1000), {
    level: 100,
    experience: 0,
    levelsGained: 1
  });
});

test("existing stored XP is processed without duplicating it", () => {
  assert.deepEqual(calculateLevelGain(5, 21, 0), {
    level: 6,
    experience: 1,
    levelsGained: 1
  });
});
