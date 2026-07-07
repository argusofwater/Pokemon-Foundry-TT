const get = foundry.utils.getProperty;
const set = foundry.utils.setProperty;

const RANK_MAP = new Map([
  [0, "untrained"],
  [1, "untrained"],
  [2, "novice"],
  [3, "adept"],
  [4, "expert"],
  [5, "master"],
  [6, "master"]
]);

const LEGACY_SKILL_MAP = {
  acrobatics: "acrobatics",
  athletics: "athletics",
  focus: "focus",
  perception: "perception",
  stealth: "stealth",
  survival: "survival",
  medicineEd: "medicine",
  techEd: "technology",
  pokemonEd: "pokemonLore",
  generalEd: "investigation",
  charm: "influence",
  guile: "deception",
  command: "influence",
  intuition: "perception",
  combat: "athletics",
  intimidate: "influence",
  occultEd: "pokemonLore"
};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function string(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function legacyStat(system, key, fallback = 0) {
  return number(get(system, `stats.${key}.value`), fallback);
}

function legacyStage(system, key) {
  return Math.clamp(number(get(system, `stats.${key}.stage.value`), 0), -4, 4);
}

function mapSkillRank(value) {
  if (typeof value === "string") return value;
  return RANK_MAP.get(number(value, 0)) ?? "untrained";
}

function baseTrainerData() {
  return {
    schema: { version: 1, lastMigration: "legacy-adapter-v1" },
    identity: {
      level: 1,
      background: "",
      role: "",
      specialty: "",
      progressionMode: "milestone",
      experience: 0
    },
    health: {
      hp: { value: 20, max: 20 },
      temporaryHp: 0,
      wounds: 0,
      fatigue: "fresh"
    },
    attributes: {
      body: { base: 0, bonus: 0, final: 0 },
      agility: { base: 0, bonus: 0, final: 0 },
      mind: { base: 0, bonus: 0, final: 0 },
      presence: { base: 0, bonus: 0, final: 0 }
    },
    defenses: {
      physical: { base: 10, bonus: 0, final: 10 },
      special: { base: 10, bonus: 0, final: 10 },
      reflex: { base: 10, bonus: 0, final: 10 }
    },
    skills: {},
    actions: {
      mainUsed: false,
      moveUsed: false,
      reactionUsed: false,
      sharedMainRemaining: 2,
      sharedMoveRemaining: 2,
      lastCombatRound: null,
      lastCombatTurn: null
    },
    team: { activePokemonUuid: "", pokemonUuids: [] },
    inventory: { bulkCapacityBonus: 0, supplyUnits: 0, medicalSupplies: 0 },
    campaign: { expeditionRole: "", downtimeActions: 0, notes: "" },
    ui: { mode: "play", activeTab: "overview", pinnedTalentUuids: [] }
  };
}

function basePokemonData() {
  return {
    schema: { version: 1, lastMigration: "legacy-adapter-v1" },
    identity: {
      speciesUuid: "",
      speciesName: "",
      level: 1,
      evolutionStage: "",
      types: [],
      nature: "",
      trainingPath: "balanced",
      lifecycle: "party",
      trainerUuid: ""
    },
    health: {
      hp: { value: 10, max: 10 },
      temporaryHp: 0,
      wounds: 0,
      fatigue: "fresh"
    },
    stats: {
      hp: { species: 10, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 10 },
      attack: { species: 5, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 5 },
      defense: { species: 5, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 5 },
      specialAttack: { species: 5, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 5 },
      specialDefense: { species: 5, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 5 },
      speed: { species: 5, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: 5 }
    },
    defenses: {
      physical: { base: 10, bonus: 0, final: 10 },
      special: { base: 10, bonus: 0, final: 10 },
      reflex: { base: 10, bonus: 0, final: 10 }
    },
    bond: { level: "wary", progress: 0, caregiverUuid: "", notes: "" },
    actions: {
      mainUsed: false,
      moveUsed: false,
      reactionUsed: false,
      sharedMainRemaining: 2,
      sharedMoveRemaining: 2,
      lastCombatRound: null,
      lastCombatTurn: null
    },
    loadout: {
      equippedMoveUuids: ["", "", "", ""],
      reserveMoveUuids: ["", ""],
      heldItemUuid: "",
      activeAbilityUuids: []
    },
    progression: { mode: "milestone", experience: 0, milestone: 0, evolutionEligible: false },
    exploration: { capabilities: [], mountCapable: false, incubation: { value: 0, max: 0 }, development: { value: 0, max: 0 } },
    ui: { mode: "play", activeTab: "overview" }
  };
}

export function adaptLegacyTrainerSource(actorSource) {
  const legacy = actorSource.system ?? {};
  const next = baseTrainerData();

  next.identity.level = Math.clamp(number(legacy.level?.current ?? legacy.level ?? 1, 1), 1, 20);
  next.identity.experience = Math.max(0, number(legacy.level?.exp ?? legacy.exp ?? 0));
  next.identity.background = string(legacy.background?.name ?? legacy.background);
  next.identity.role = string(legacy.class?.name ?? legacy.role);
  next.identity.specialty = string(legacy.specialty?.name ?? legacy.specialty);

  const hpValue = number(legacy.health?.value ?? legacy.hp?.value ?? legacyStat(legacy, "hp", 20), 20);
  const hpMax = number(legacy.health?.max ?? legacy.hp?.max ?? hpValue, hpValue);
  next.health.hp = { value: Math.max(0, hpValue), max: Math.max(1, hpMax) };
  next.health.temporaryHp = Math.max(0, number(legacy.tempHp?.value, 0));
  next.health.wounds = Math.clamp(number(legacy.injuries?.value ?? legacy.wounds, 0), 0, 5);

  next.attributes.body.base = number(legacy.attributes?.body?.value ?? legacy.body?.value, 0);
  next.attributes.agility.base = number(legacy.attributes?.agility?.value ?? legacy.agility?.value, 0);
  next.attributes.mind.base = number(legacy.attributes?.mind?.value ?? legacy.mind?.value, 0);
  next.attributes.presence.base = number(legacy.attributes?.spirit?.value ?? legacy.presence?.value, 0);

  next.defenses.physical.base = number(legacy.evasion?.physical?.value ?? legacy.modifiers?.evasion?.physical?.value, 10);
  next.defenses.special.base = number(legacy.evasion?.special?.value ?? legacy.modifiers?.evasion?.special?.value, 10);
  next.defenses.reflex.base = number(legacy.evasion?.speed?.value ?? legacy.modifiers?.evasion?.speed?.value, 10);

  for (const [legacyKey, commanderKey] of Object.entries(LEGACY_SKILL_MAP)) {
    const source = legacy.skills?.[legacyKey];
    if (!source || next.skills[commanderKey]) continue;
    next.skills[commanderKey] = {
      attribute: ["acrobatics", "stealth"].includes(commanderKey) ? "agility" :
        ["influence", "deception", "performance", "focus"].includes(commanderKey) ? "presence" :
        ["athletics", "endurance"].includes(commanderKey) ? "body" : "mind",
      rank: mapSkillRank(source.value?.value ?? source.value),
      misc: number(source.modifier?.value ?? source.modifier, 0),
      favorite: false
    };
  }

  next.campaign.notes = string(legacy.notes);
  next.team.activePokemonUuid = string(legacy.activePokemonUuid ?? legacy.activePokemon);
  if (Array.isArray(legacy.pokemonUuids)) next.team.pokemonUuids = legacy.pokemonUuids.filter(Boolean);

  return next;
}

export function adaptLegacyPokemonSource(actorSource) {
  const legacy = actorSource.system ?? {};
  const next = basePokemonData();

  next.identity.level = Math.clamp(number(legacy.level?.current ?? legacy.level ?? 1, 1), 1, 100);
  next.identity.speciesName = string(legacy.species?.name ?? legacy.species);
  next.identity.speciesUuid = string(legacy.species?.uuid ?? legacy.speciesUuid);
  next.identity.nature = string(legacy.nature?.name ?? legacy.nature);
  next.identity.trainerUuid = string(legacy.ownerUuid ?? legacy.trainerUuid ?? legacy.owner);
  next.identity.types = [legacy.typing?.one, legacy.typing?.two, ...(legacy.types ?? [])].filter((value, index, array) => value && array.indexOf(value) === index);

  const mapping = {
    hp: "hp",
    attack: "atk",
    defense: "def",
    specialAttack: "spatk",
    specialDefense: "spdef",
    speed: "spd"
  };
  for (const [commanderKey, legacyKey] of Object.entries(mapping)) {
    const value = legacyStat(legacy, legacyKey, commanderKey === "hp" ? 10 : 5);
    next.stats[commanderKey].species = value;
    next.stats[commanderKey].final = value;
    next.stats[commanderKey].stage = legacyStage(legacy, legacyKey);
  }

  const hpValue = number(legacy.health?.value ?? legacy.hp?.value ?? next.stats.hp.final, next.stats.hp.final);
  const hpMax = number(legacy.health?.max ?? legacy.hp?.max ?? next.stats.hp.final, next.stats.hp.final);
  next.health.hp = { value: Math.max(0, hpValue), max: Math.max(1, hpMax) };
  next.health.temporaryHp = Math.max(0, number(legacy.tempHp?.value, 0));
  next.health.wounds = Math.clamp(number(legacy.injuries?.value ?? legacy.wounds, 0), 0, 5);

  const physicalEvasion = number(legacy.evasion?.physical?.value ?? legacy.modifiers?.evasion?.physical?.value, 10);
  const specialEvasion = number(legacy.evasion?.special?.value ?? legacy.modifiers?.evasion?.special?.value, 10);
  const speedEvasion = number(legacy.evasion?.speed?.value ?? legacy.modifiers?.evasion?.speed?.value, 10);
  next.defenses.physical.base = physicalEvasion;
  next.defenses.special.base = specialEvasion;
  next.defenses.reflex.base = speedEvasion;

  const loyalty = number(legacy.loyalty?.value ?? legacy.loyalty, 0);
  next.bond.level = loyalty >= 5 ? "devoted" : loyalty >= 3 ? "bonded" : loyalty >= 1 ? "trusting" : "wary";
  next.bond.notes = string(legacy.notes);

  const moves = Array.isArray(actorSource.items)
    ? actorSource.items.filter(item => item.type === "move").map(item => item.uuid ?? item._id).filter(Boolean)
    : [];
  next.loadout.equippedMoveUuids = [...moves.slice(0, 4), "", "", "", ""].slice(0, 4);
  next.loadout.reserveMoveUuids = [...moves.slice(4, 6), "", ""].slice(0, 2);

  return next;
}

export function createCommanderActorUpdate(actorSource) {
  if (!actorSource || !["character", "pokemon"].includes(actorSource.type)) return null;
  const commander = actorSource.type === "character"
    ? adaptLegacyTrainerSource(actorSource)
    : adaptLegacyPokemonSource(actorSource);

  return {
    _id: actorSource._id,
    "flags.ptu.commanderLegacyBackup": foundry.utils.deepClone(actorSource.system ?? {}),
    system: commander
  };
}

export function diffCommanderMigration(actorSource) {
  const update = createCommanderActorUpdate(actorSource);
  if (!update) return null;
  return foundry.utils.diffObject(actorSource.system ?? {}, update.system);
}
