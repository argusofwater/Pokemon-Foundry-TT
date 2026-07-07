import assert from "node:assert/strict";
import {
  convertAccuracy,
  convertCaptureValue,
  convertMovePower,
  convertSpeciesStats,
  inferAbilityType,
  inferRecharge,
  inferTargetDefense
} from "./conversion-rules.mjs";

{
  const result = convertSpeciesStats({ hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 });
  assert.equal(result.sourceScale, "main-series");
  assert.deepEqual(result.stats, { hp: 5, attack: 5, defense: 5, specialAttack: 7, specialDefense: 7, speed: 5 });
}

{
  const result = convertSpeciesStats({ hp: 8, attack: 10, defense: 7, specialAttack: 4, specialDefense: 6, speed: 9 });
  assert.equal(result.sourceScale, "tabletop");
  assert.equal(result.stats.attack, 10);
}

assert.deepEqual(convertCaptureValue(255), { captureDifficulty: 0, rarity: "common" });
assert.deepEqual(convertCaptureValue(45), { captureDifficulty: 4, rarity: "rare" });
assert.deepEqual(convertCaptureValue(3), { captureDifficulty: 6, rarity: "exceptional" });
assert.deepEqual(convertCaptureValue(1), { captureDifficulty: 10, rarity: "legendary" });

assert.equal(convertMovePower(7, { sourceField: "db" }).power, 70);
assert.equal(convertMovePower(90, { sourceField: "power" }).power, 90);
assert.equal(convertMovePower(100, { fixed: true }).power, 0);

assert.equal(convertAccuracy(85).modifier, -2);
assert.equal(convertAccuracy(65).hindered, true);

assert.equal(inferTargetDefense({ category: "physical" }).defense, "physical");
assert.equal(inferTargetDefense({ category: "status", tags: ["beam"] }).defense, "reflex");

assert.equal(inferRecharge({ power: 70 }).category, "at-will");
assert.equal(inferRecharge({ power: 100 }).category, "cooldown");
assert.equal(inferRecharge({ power: 130 }).category, "encounter");
assert.equal(inferRecharge({ power: 70, healingPercent: 50 }).category, "expedition");

assert.equal(inferAbilityType("When the user is hit, reduce the damage."), "reaction");
assert.equal(inferAbilityType("The user may activate this effect as an action."), "activated");

console.log("Commander conversion rule tests passed.");
