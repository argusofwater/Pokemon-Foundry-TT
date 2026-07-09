const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

function clampLevel(level) {
  return Math.max(1, Math.min(100, Number(level) || 1));
}

function speciesStats(system = {}) {
  const stats = system.commanderStats ?? system.stats ?? {};
  return {
    hp: Number(stats.hp ?? 1),
    attack: Number(stats.attack ?? stats.atk ?? 1),
    defense: Number(stats.defense ?? stats.def ?? 1),
    specialAttack: Number(stats.specialAttack ?? stats.spatk ?? stats.spa ?? 1),
    specialDefense: Number(stats.specialDefense ?? stats.spdef ?? 1),
    speed: Number(stats.speed ?? stats.spd ?? 1)
  };
}

function sizeClass(system = {}) {
  const size = system.size;
  if (typeof size === "string") return size;
  return size?.sizeClass ?? "medium";
}

function lowerTypes(types = []) {
  return [...types].map(type => String(type).toLowerCase()).filter(type => type && type !== "untyped");
}

function allocateLevelStats(baseStats, level, randomness = 0) {
  const points = Math.max(0, clampLevel(level) + 10);
  const randomShare = Math.clamp(Number(randomness) > 1 ? Number(randomness) / 100 : Number(randomness) || 0, 0, 1);
  const randomPoints = Math.round(points * randomShare);
  const weightedPoints = points - randomPoints;
  const result = Object.fromEntries(STAT_KEYS.map(key => [key, 0]));

  const weightedBag = [];
  for (const key of STAT_KEYS) {
    const weight = Math.max(1, Number(baseStats?.[key] ?? 1));
    for (let index = 0; index < weight; index += 1) weightedBag.push(key);
  }

  for (let index = 0; index < weightedPoints; index += 1) {
    const key = weightedBag[Math.floor(Math.random() * weightedBag.length)] ?? STAT_KEYS[0];
    result[key] += 1;
  }
  for (let index = 0; index < randomPoints; index += 1) {
    result[STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]] += 1;
  }
  return result;
}

function actorStat(value, levelValue = 0) {
  const species = Math.max(1, Number(value ?? 1));
  const level = Math.max(0, Number(levelValue ?? 0));
  return { species, level, path: 0, nature: 0, bonus: 0, stage: 0, final: species + level };
}

function legacyStat(value, levelUp = 0) {
  return {
    value: Math.max(1, Number(value ?? 1)),
    levelUp: Math.max(0, Number(levelUp ?? 0)),
    mod: { value: 0, mod: 0 },
    stage: { value: 0, mod: 0, total: 0 },
    total: Math.max(1, Number(value ?? 1)) + Math.max(0, Number(levelUp ?? 0))
  };
}

function legacyStats(baseStats, levelStats) {
  return {
    hp: legacyStat(baseStats.hp, levelStats.hp),
    atk: legacyStat(baseStats.attack, levelStats.attack),
    def: legacyStat(baseStats.defense, levelStats.defense),
    spatk: legacyStat(baseStats.specialAttack, levelStats.specialAttack),
    spdef: legacyStat(baseStats.specialDefense, levelStats.specialDefense),
    spd: legacyStat(baseStats.speed, levelStats.speed)
  };
}

function safePortrait(species) {
  const portrait = species.system.artwork?.portrait || species.img;
  if (portrait && portrait !== "icons/svg/mystery-man.svg" && portrait !== "icons/svg/item-bag.svg") return portrait;
  return "icons/svg/pawprint.svg";
}

async function documentsBySlug(packId, slugs) {
  const wanted = new Set((slugs ?? []).filter(Boolean));
  if (!wanted.size) return [];
  const pack = game.packs.get(packId);
  if (!pack) return [];
  const index = await pack.getIndex({ fields: ["system.slug"] });
  const ids = index.filter(entry => wanted.has(entry.system?.slug)).map(entry => entry._id);
  const documents = [];
  for (const id of ids) {
    const document = await pack.getDocument(id);
    if (document) documents.push(document);
  }
  return documents;
}

function starterMoveSlugs(species, level = 1) {
  const entries = (species.system.learnset ?? [])
    .filter(entry => entry.method === "level" && Number(entry.level ?? 1) <= level)
    .sort((a, b) => Number(a.level ?? 1) - Number(b.level ?? 1));
  const unique = [];
  for (const entry of entries) if (entry.moveSlug && !unique.includes(entry.moveSlug)) unique.push(entry.moveSlug);
  return unique.slice(-6);
}

function tokenSize(size) {
  if (size === "tiny") return 0.5;
  if (size === "large") return 2;
  if (size === "massive") return 3;
  return 1;
}

function embeddedItemData(documents) {
  return documents.filter(Boolean).map(document => {
    const data = document.toObject();
    delete data._id;
    return data;
  });
}

function loadoutFromActor(actor) {
  const abilities = actor.itemTypes?.ability ?? [];
  const moves = (actor.itemTypes?.move ?? []).filter(item => !item.system?.isStruggle);
  const equipped = moves.slice(0, 4).map(item => item.uuid);
  const reserve = moves.slice(4, 6).map(item => item.uuid);
  while (equipped.length < 4) equipped.push("");
  while (reserve.length < 2) reserve.push("");
  return { abilities, equipped, reserve };
}

export class CommanderSpeciesService {
  static async buildPokemonData(species, {
    trainer = null,
    level = 1,
    name = "",
    nature = "",
    trainingPath = "balanced",
    statRandomness = 0,
    shiny = false,
    folder = null
  } = {}) {
    if (!species || species.type !== "species") throw new Error("A Commander Species item is required.");

    const resolvedLevel = clampLevel(level);
    const baseStats = speciesStats(species.system);
    const levelStats = allocateLevelStats(baseStats, resolvedLevel, statRandomness);
    const commanderStats = Object.fromEntries(STAT_KEYS.map(key => [key, actorStat(baseStats[key], levelStats[key])]));
    const portrait = safePortrait(species);
    const size = tokenSize(sizeClass(species.system));
    const abilityDocuments = await documentsBySlug("ptu.abilities", species.system.abilitySlugs ?? []);
    const moveDocuments = await documentsBySlug("ptu.moves", starterMoveSlugs(species, resolvedLevel));
    const speciesItem = species.toObject();
    delete speciesItem._id;

    const actorData = {
      name: name || species.name,
      type: "pokemon",
      img: portrait,
      folder: typeof folder === "string" ? folder : folder?.id ?? null,
      items: [speciesItem, ...embeddedItemData(abilityDocuments), ...embeddedItemData(moveDocuments)],
      prototypeToken: {
        actorLink: true,
        width: size,
        height: size,
        texture: { src: species.system.artwork?.token || portrait }
      },
      system: {
        schema: { version: 1, lastMigration: "species-import" },
        identity: {
          speciesUuid: species.uuid,
          speciesName: species.name,
          level: resolvedLevel,
          evolutionStage: species.system.formKind ?? "base",
          types: lowerTypes(species.system.types ?? []),
          nature: nature || "",
          trainingPath,
          lifecycle: trainer ? "party" : "reserve",
          trainerUuid: trainer?.uuid ?? ""
        },
        health: {
          hp: { value: commanderStats.hp.final, max: commanderStats.hp.final },
          value: commanderStats.hp.final,
          max: commanderStats.hp.final,
          injuries: 0,
          temporaryHp: 0,
          wounds: 0,
          fatigue: "fresh"
        },
        tempHp: 0,
        commanderStats,
        stats: legacyStats(baseStats, levelStats),
        defenses: {
          physical: { base: 10, bonus: 0, final: 10 },
          special: { base: 10, bonus: 0, final: 10 },
          reflex: { base: 10, bonus: 0, final: 10 }
        },
        bond: { level: "wary", progress: 0, caregiverUuid: trainer?.uuid ?? "", notes: "" },
        actions: { mainUsed: false, moveUsed: false, reactionUsed: false, sharedMainRemaining: 2, sharedMoveRemaining: 2, lastCombatRound: null, lastCombatTurn: null },
        loadout: { equippedMoveUuids: ["", "", "", ""], reserveMoveUuids: ["", ""], heldItemUuid: "", activeAbilityUuids: [] },
        progression: { mode: "milestone", experience: 0, milestone: 0, evolutionEligible: false },
        exploration: {
          capabilities: [...(species.system.capabilitySlugs ?? [])],
          mountCapable: (species.system.capabilitySlugs ?? []).includes("mount"),
          incubation: { value: 0, max: 0 },
          development: { value: 0, max: 0 }
        },
        ui: { mode: "play", activeTab: "overview" }
      },
      flags: {
        ptu: {
          commanderShiny: Boolean(shiny),
          commanderSpeciesSnapshot: {
            slug: species.system.slug,
            nationalDex: species.system.nationalDex ?? species.system.number,
            canonicalStats: foundry.utils.deepClone(species.system.canonicalStats ?? {}),
            source: foundry.utils.deepClone(species.system.source ?? {})
          }
        }
      }
    };

    return { actorData, abilityDocuments, moveDocuments, speciesDocument: species };
  }

  static async createPokemonFromSpecies(species, options = {}) {
    const { actorData } = await this.buildPokemonData(species, options);
    const actor = await Actor.create(actorData);
    if (!actor) return null;

    const { abilities, equipped, reserve } = loadoutFromActor(actor);
    await actor.update({
      "system.loadout.equippedMoveUuids": equipped,
      "system.loadout.reserveMoveUuids": reserve,
      "system.loadout.activeAbilityUuids": abilities.map(item => item.uuid)
    });

    if (options.trainer) await this.addPokemonToTrainer(actor, options.trainer);
    return actor;
  }

  static async addPokemonToTrainer(pokemon, trainer) {
    const team = [...(trainer.system.team?.pokemonUuids ?? [])];
    if (team.includes(pokemon.uuid)) return;
    if (team.length >= 6) throw new Error("A Trainer team can hold no more than 6 Pokémon.");
    team.push(pokemon.uuid);
    const activeUuid = trainer.system.team?.activePokemonUuid || pokemon.uuid;
    await Promise.all([
      trainer.update({ "system.team.pokemonUuids": team, "system.team.activePokemonUuid": activeUuid }),
      pokemon.update({
        "system.identity.trainerUuid": trainer.uuid,
        "system.identity.lifecycle": activeUuid === pokemon.uuid ? "active" : "party",
        "system.bond.caregiverUuid": trainer.uuid
      })
    ]);
  }
}
