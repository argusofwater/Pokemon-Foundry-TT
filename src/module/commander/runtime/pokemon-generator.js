import { natureData } from "../../../scripts/config/data/nature.js";
import { PokemonGenerator as LegacyPokemonGenerator } from "../../actor/pokemon/generator.js";
import { CommanderSpeciesService } from "./species-service.js";

function randomBetween(min, max) {
  const low = Math.max(1, Math.min(100, Number(min) || 1));
  const high = Math.max(low, Math.min(100, Number(max) || low));
  return low === high ? low : Math.floor(Math.random() * (high - low + 1)) + low;
}

function shinyFromChance(chance) {
  let value = Number(chance) || 0;
  if (value >= 1) value /= 100;
  return value > 0 && Math.random() < value;
}

async function resolveCommanderSpecies(species) {
  if (species?.type === "species" && species.system?.schema && species.system?.stats) return species;
  const slug = species?.system?.slug ?? species?.slug ?? species?.name?.toLowerCase?.().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return null;
  const pack = game.packs.get("ptu.species");
  if (!pack) return null;
  const index = await pack.getIndex({ fields: ["system.slug"] });
  const match = index.find(entry => entry.system?.slug === slug);
  return match ? pack.getDocument(match._id) : null;
}

async function resolveFolder(folder) {
  if (!folder) return null;
  if (typeof folder !== "string") return folder;
  const existing = game.folders.get(folder) || game.folders.getName(folder);
  if (existing) return existing;
  ui.notifications.notify(game.i18n.format("PTU.FolderNotFound", { folder }));
  return Folder.create({ name: folder, type: "Actor", parent: null });
}

export class CommanderPokemonGenerator {
  constructor(species, { x, y } = {}) {
    this.sourceSpecies = species;
    this.x = x;
    this.y = y;
    this.prepared = false;
    this.legacy = null;
  }

  async prepare(options = {}) {
    const species = await resolveCommanderSpecies(this.sourceSpecies);
    if (!species) {
      this.legacy = new LegacyPokemonGenerator(this.sourceSpecies, { x: this.x, y: this.y });
      await this.legacy.prepare(options);
      this.prepared = true;
      return this;
    }

    this.species = species;
    const defaults = {
      minLevel: Number(game.settings.get("ptu", "generation.defaultDexDragInLevelMin")),
      maxLevel: Number(game.settings.get("ptu", "generation.defaultDexDragInLevelMax")),
      shinyChance: Number(game.settings.get("ptu", "generation.defaultDexDragInShinyChance")),
      statRandomness: Number(game.settings.get("ptu", "generation.defaultDexDragInStatRandomness")),
      preventEvolution: game.settings.get("ptu", "generation.defaultDexDragInPreventEvolution"),
      saveDefault: false
    };
    const settings = { ...defaults, ...options };
    this.level = this.level ?? randomBetween(settings.minLevel, settings.maxLevel);
    this.nature = this.nature ?? Object.keys(natureData)[Math.floor(Math.random() * Object.keys(natureData).length)];
    this.shiny = this.shiny ?? shinyFromChance(settings.shinyChance);
    this.statRandomness = settings.statRandomness;
    this.trainingPath = options.trainingPath ?? "balanced";
    this.preventEvolution = Boolean(settings.preventEvolution);
    this.prepared = true;
    return this;
  }

  async create({ folder, generate = true, trainer = null } = {}) {
    if (!this.prepared) await this.prepare();
    if (this.legacy) return this.legacy.create({ folder, generate });

    const resolvedFolder = await resolveFolder(folder ?? canvas.scene?.name ?? null);
    const options = {
      trainer,
      level: this.level,
      nature: this.nature,
      trainingPath: this.trainingPath,
      statRandomness: this.statRandomness,
      shiny: this.shiny,
      folder: resolvedFolder
    };

    if (!generate) {
      const { actorData } = await CommanderSpeciesService.buildPokemonData(this.species, options);
      return {
        actor: actorData,
        items: actorData.items ?? []
      };
    }

    const actor = await CommanderSpeciesService.createPokemonFromSpecies(this.species, options);
    if (!actor) return { actor: null, token: null };

    if (!(Number.isFinite(this.x) && Number.isFinite(this.y)) || !canvas.scene) return { actor, token: null };
    const grid = canvas.scene.grid.size;
    const x = Math.floor(this.x / grid) * grid;
    const y = Math.floor(this.y / grid) * grid;
    const tokenData = await actor.getTokenDocument({ x, y });
    const [token] = await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
    return { actor, token };
  }
}
