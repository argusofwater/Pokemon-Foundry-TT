import {
  addReviewTags,
  convertAccuracy,
  convertCaptureValue,
  convertMovePower,
  convertSpeciesStats,
  inferAbilityTier,
  inferAbilityType,
  inferRange,
  inferRecharge,
  inferTargetDefense
} from "./conversion-rules.mjs";
import { asArray } from "./utils.mjs";

function clone(value) {
  return structuredClone(value);
}

function transformSpecies(record) {
  const next = clone(record);
  const converted = convertSpeciesStats(next.stats ?? {}, { scale: next.sourceScale ?? "auto" });
  next.stats = converted.stats;
  next.sourceScale = converted.sourceScale;

  const capture = convertCaptureValue(next.captureDifficulty ?? next.captureRate, {
    explicitDifficulty: next.captureDifficulty != null,
    restricted: next.rarity === "restricted"
  });
  next.captureDifficulty = capture.captureDifficulty;
  next.rarity = next.rarity ?? capture.rarity;
  if (capture.review) next.tags = addReviewTags(asArray(next.tags), "review-required");
  return next;
}

function transformMove(record) {
  const next = clone(record);
  const sourceField = next.powerSource ?? (next.damageBase != null ? "damage-base" : "power");
  const powerInput = next.damageBase ?? next.power ?? 0;
  const power = convertMovePower(powerInput, {
    sourceField,
    variable: Boolean(next.variablePower),
    fixed: Boolean(next.fixedDamage),
    ohko: Boolean(next.ohko)
  });
  next.power = power.power;

  const accuracy = convertAccuracy(next.accuracy, {
    alwaysHits: Boolean(next.alwaysHits),
    special: Boolean(next.accuracySpecial)
  });
  next.accuracy = accuracy.accuracy;
  next.accuracyModifier = accuracy.modifier;
  next.accuracyHindered = accuracy.hindered;

  const defense = inferTargetDefense({
    category: next.category,
    target: next.target?.disposition === "self" ? "self" : next.targetKind ?? "enemy",
    tags: asArray(next.tags),
    text: next.description
  });
  next.target ??= { count: 1, disposition: "enemy" };
  next.target.defense = next.target.defense ?? defense.defense;

  const range = inferRange({
    tags: asArray(next.tags),
    target: next.target.disposition === "self" ? "self" : "enemy",
    text: next.description,
    explicit: next.range ?? null
  });
  next.range = range.range;

  const recharge = next.recharge ?? inferRecharge({
    power: next.power,
    tags: asArray(next.tags),
    text: next.description,
    healingPercent: Number(next.healingPercent ?? 0),
    protect: Boolean(next.protect),
    drawback: Boolean(next.drawback)
  });
  next.recharge = recharge;

  next.tags = addReviewTags(
    asArray(next.tags),
    ...power.tags,
    ...accuracy.tags,
    defense.review ? "review-defense" : null,
    range.review ? "review-range" : null,
    ...(recharge.tags ?? [])
  );
  return next;
}

function transformAbility(record) {
  const next = clone(record);
  const inferredType = inferAbilityType(next.effect ?? next.description ?? "");
  const inferredTier = inferAbilityTier(next.effect ?? next.description ?? "", asArray(next.tags));
  if (!next.abilityType) {
    next.abilityType = inferredType;
    next.tags = addReviewTags(asArray(next.tags), "review-automation");
  }
  if (!next.powerTier) next.powerTier = inferredTier;
  next.recharge ??= { category: "at-will", rounds: 0, remaining: 0 };
  return next;
}

function transformForm(record) {
  const next = clone(record);
  const converted = convertSpeciesStats(next.stats ?? {}, { scale: next.sourceScale ?? "auto" });
  next.stats = converted.stats;
  next.sourceScale = converted.sourceScale;
  return next;
}

export function transformRecord(type, record) {
  if (type === "species") return transformSpecies(record);
  if (type === "moves") return transformMove(record);
  if (type === "abilities") return transformAbility(record);
  if (type === "forms") return transformForm(record);
  return clone(record);
}

export function transformEntries(entries) {
  return entries.map(entry => ({ ...entry, record: transformRecord(entry.type, entry.record) }));
}
