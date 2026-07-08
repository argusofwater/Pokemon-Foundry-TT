const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

function actorStat(value) {
  const species = Math.max(1, Number(value ?? 1));
  return { species, level: 0, path: 0, nature: 0, bonus: 0, stage: 0, final: species };
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

export class CommanderSpeciesService {
  static async createPokemonFromSpecies(species, { trainer = null, level = 1, name = "" } = {}) {
    if (!species || species.type !== "species") throw new Error("A Commander Species item is required.");

    const stats = Object.fromEntries(STAT_KEYS.map(key => [key, actorStat(species.system.stats?.[key])]));
    const actor = await Actor.create({
      name: name || species.name,
      type: "pokemon",
      img: species.system.artwork?.portrait || species.img,
      system: {
        schema: { version: 1, lastMigration: "species-import" },
        identity: {
          speciesUuid: species.uuid,
          speciesName: species.name,
          level: Math.max(1, Math.min(100, Number(level) || 1)),
          evolutionStage: species.system.formKind ?? "base",
          types: [...(species.system.types ?? [])],
          nature: "",
          trainingPath: "balanced",
          lifecycle: trainer ? "party" : "reserve",
          trainerUuid: trainer?.uuid ?? ""
        },
        health: {
          hp: { value: stats.hp.species, max: stats.hp.species },
          temporaryHp: 0,
          wounds: 0,
          fatigue: "fresh"
        },
        stats,
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
          commanderSpeciesSnapshot: {
            slug: species.system.slug,
            nationalDex: species.system.nationalDex,
            canonicalStats: foundry.utils.deepClone(species.system.canonicalStats ?? {}),
            source: foundry.utils.deepClone(species.system.source ?? {})
          }
        }
      }
    });

    if (!actor) return null;

    const abilityDocuments = await documentsBySlug("ptu.abilities", species.system.abilitySlugs ?? []);
    const moveDocuments = await documentsBySlug("ptu.moves", starterMoveSlugs(species, actor.system.identity.level));
    const embedded = await actor.createEmbeddedDocuments("Item", [...abilityDocuments, ...moveDocuments].map(document => document.toObject()));
    const abilities = embedded.filter(item => item.type === "ability");
    const moves = embedded.filter(item => item.type === "move");
    const equipped = moves.slice(0, 4).map(item => item.uuid);
    const reserve = moves.slice(4, 6).map(item => item.uuid);
    while (equipped.length < 4) equipped.push("");
    while (reserve.length < 2) reserve.push("");
    await actor.update({
      "system.loadout.equippedMoveUuids": equipped,
      "system.loadout.reserveMoveUuids": reserve,
      "system.loadout.activeAbilityUuids": abilities.map(item => item.uuid)
    });

    if (trainer) await this.addPokemonToTrainer(actor, trainer);
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
