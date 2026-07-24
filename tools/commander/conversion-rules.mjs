import { sluggify, unique } from "./utils.mjs";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

export function detectStatScale(stats, explicit = "auto") {
  if (["tabletop", "main-series"].includes(explicit)) return explicit;
  const values = STAT_KEYS.map(key => Number(stats?.[key] ?? 0)).filter(Number.isFinite);
  const max = Math.max(...values, 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  return max <= 30 && total <= 150 ? "tabletop" : "main-series";
}

export function convertSpeciesStats(stats, { scale = "auto" } = {}) {
  const sourceScale = detectStatScale(stats, scale);
  const converted = {};
  for (const key of STAT_KEYS) {
    const value = Math.max(1, Number(stats?.[key] ?? 1));
    converted[key] = sourceScale === "tabletop" ? Math.round(value) : Math.max(1, Math.round(value / 10));
  }
  return { stats: converted, sourceScale };
}

export function convertCaptureValue(value, { explicitDifficulty = false, restricted = false } = {}) {
  if (restricted) return { captureDifficulty: 10, rarity: "restricted" };
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { captureDifficulty: 0, rarity: "common", review: true };
  if (explicitDifficulty && [0, 2, 4, 6, 10].includes(numeric)) {
    const rarity = { 0: "common", 2: "uncommon", 4: "rare", 6: "exceptional", 10: "legendary" }[numeric];
    return { captureDifficulty: numeric, rarity };
  }
  if (numeric <= 0) return { captureDifficulty: 10, rarity: "restricted" };
  if (numeric <= 2) return { captureDifficulty: 10, rarity: "legendary" };
  if (numeric <= 44) return { captureDifficulty: 6, rarity: "exceptional" };
  if (numeric <= 99) return { captureDifficulty: 4, rarity: "rare" };
  if (numeric <= 199) return { captureDifficulty: 2, rarity: "uncommon" };
  return { captureDifficulty: 0, rarity: "common" };
}

export function convertMovePower(value, { sourceField = "power", variable = false, fixed = false, ohko = false } = {}) {
  const tags = [];
  if (variable) tags.push("variable-power", "review-power");
  if (fixed) tags.push("fixed-damage", "special-resolution");
  if (ohko) tags.push("ohko", "special-resolution");
  if (fixed || ohko) return { power: 0, tags };
  const numeric = Math.max(0, Number(value ?? 0));
  const field = String(sourceField).toLowerCase();
  const isDamageBase = ["db", "damagebase", "damage-base"].includes(field);
  return { power: isDamageBase ? Math.round(numeric * 10) : Math.round(numeric), tags };
}

export function convertAccuracy(value, { alwaysHits = false, special = false } = {}) {
  const tags = special ? ["accuracy-special", "review-accuracy"] : [];
  if (alwaysHits || value == null) return { accuracy: value == null ? null : Number(value), modifier: 0, hindered: false, tags };
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { accuracy: null, modifier: 0, hindered: false, tags: [...tags, "review-accuracy"] };
  if (numeric >= 90) return { accuracy: numeric, modifier: 0, hindered: false, tags };
  if (numeric >= 80) return { accuracy: numeric, modifier: -2, hindered: false, tags };
  if (numeric >= 70) return { accuracy: numeric, modifier: -4, hindered: false, tags };
  return { accuracy: numeric, modifier: -4, hindered: true, tags };
}

export function inferTargetDefense({ category, target = "enemy", tags = [], text = "" } = {}) {
  const set = new Set(tags.map(sluggify));
  const prose = String(text).toLowerCase();
  if (["self", "field", "weather", "terrain"].includes(target)) return { defense: "none", review: false };
  if (category === "physical") return { defense: "physical", review: false };
  if (category === "special") return { defense: "special", review: false };
  if (["projectile", "beam", "trap", "area", "line", "cone"].some(tag => set.has(tag))) return { defense: "reflex", review: false };
  if (/(mind|emotion|fear|charm|hypnot|telepath|will)/.test(prose)) return { defense: "special", review: false };
  return { defense: "none", review: true };
}

export function inferRange({ tags = [], target = "enemy", text = "", explicit = null } = {}) {
  if (explicit) return { range: explicit, review: false };
  const set = new Set(tags.map(sluggify));
  if (target === "self") return { range: { value: 0, unit: "self", shape: "single", area: 0 }, review: false };
  if (["weather", "terrain", "field"].some(tag => set.has(tag))) return { range: { value: 0, unit: "scene", shape: "zone", area: 0 }, review: false };
  if (set.has("contact") || set.has("melee")) return { range: { value: 1, unit: "melee", shape: "single", area: 0 }, review: false };
  if (set.has("long-range")) return { range: { value: 10, unit: "squares", shape: "single", area: 0 }, review: false };
  if (/(beam|projectile|shot|pulse|ray|wave)/i.test(text)) return { range: { value: 6, unit: "squares", shape: "single", area: 0 }, review: false };
  return { range: { value: 6, unit: "squares", shape: "single", area: 0 }, review: true };
}

function raise(category) {
  return ({ "at-will": "cooldown", cooldown: "encounter", encounter: "expedition", expedition: "expedition" })[category] ?? category;
}

function lower(category) {
  return ({ expedition: "encounter", encounter: "cooldown", cooldown: "at-will", "at-will": "at-will" })[category] ?? category;
}

export function inferRecharge({ power = 0, tags = [], text = "", healingPercent = 0, protect = false, drawback = false } = {}) {
  let category = power <= 80 ? "at-will" : power <= 110 ? "cooldown" : power <= 150 ? "encounter" : "expedition";
  const set = new Set(tags.map(sluggify));
  const prose = String(text).toLowerCase();

  if (protect || /negate.*attack|protects? the user/.test(prose)) category = "cooldown";
  if (healingPercent >= 50) category = "expedition";
  else if (healingPercent >= 20) category = "encounter";

  if (["large-area", "major-control", "action-denial", "team-wide", "automatic-critical"].some(tag => set.has(tag))) category = raise(category);
  if (drawback || ["recoil", "charge-turn", "user-lock", "severe-accuracy", "conditional"].some(tag => set.has(tag))) category = lower(category);

  return { category, rounds: category === "cooldown" ? 1 : 0, remaining: 0, tags: ["inferred-recharge", "review-recharge"] };
}

export function inferAbilityType(text = "") {
  const prose = String(text).toLowerCase();
  if (/(transform|changes form|replaces|legendary|cannot be suppressed)/.test(prose)) return "special";
  if (/(as a reaction|in response to|when targeted|when(?: the user| this pokemon| it)? is hit|when hit)/.test(prose)) return "reaction";
  if (/(may activate|as an action|the user may use)/.test(prose)) return "activated";
  if (/(when |after |upon |whenever )/.test(prose)) return "triggered";
  return "passive";
}

export function inferAbilityTier(text = "", tags = []) {
  const prose = String(text).toLowerCase();
  const set = new Set(tags.map(sluggify));
  if (set.has("legendary") || /(changes form|rule replacement|cannot be copied)/.test(prose)) return "signature";
  if (["weather", "terrain", "immunity", "extra-action", "major-damage"].some(tag => set.has(tag))) return "major";
  if (set.has("ribbon") || set.has("narrow")) return "minor";
  return "standard";
}

export function normalizeConditionSlug(value) {
  const slug = sluggify(value);
  const aliases = {
    burn: "burned",
    burned: "burned",
    poison: "poisoned",
    poisoned: "poisoned",
    "badly-poisoned": "badly-poisoned",
    paralysis: "paralyzed",
    paralyzed: "paralyzed",
    freeze: "frozen",
    frozen: "frozen",
    sleep: "asleep",
    asleep: "asleep",
    confusion: "confused",
    confused: "confused",
    flinch: "flinched",
    flinched: "flinched"
  };
  return aliases[slug] ?? slug;
}

export function addReviewTags(tags, ...flags) {
  return unique([...tags, ...flags.filter(Boolean)]);
}
