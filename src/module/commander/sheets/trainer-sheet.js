import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderFriendshipService } from "../runtime/friendship-service.js";
import { CommanderRollService } from "../runtime/roll-service.js";
import { COMMANDER_BACKGROUNDS, optionList, roleOptions, specialtyOptions } from "../config/trainer-options.js";

function resolveApplication(target, fallback) {
  return target?.closest?.(".application")?.application ?? fallback;
}

const genericTab = "systems/ptu/src/module/commander/templates/shared/generic-tab.hbs";
const MAX_TEAM_SIZE = 6;
const RANK_BONUSES = Object.freeze({ untrained: 0, novice: 2, adept: 4, expert: 6, master: 8 });
const ATTRIBUTE_LABELS = Object.freeze({ body: "Body", agility: "Agility", mind: "Mind", presence: "Presence" });
const TALENT_TYPES = new Set(["talent", "feat", "edge"]);

function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function talentSummary(item, pinnedUuids) {
  const system = item.system ?? {};
  const action = system.actionType ?? system.action?.type ?? system.activation?.type ?? "Passive";
  const frequency = system.recharge?.category ?? system.frequency ?? system.usage ?? "At-Will";
  const prerequisites = system.prerequisites ?? system.requirements ?? system.prerequisite ?? "";
  const description = system.description ?? system.effect ?? system.summary ?? "";
  return {
    item,
    action,
    frequency,
    prerequisites: Array.isArray(prerequisites) ? prerequisites.join(", ") : prerequisites,
    description,
    isPinned: pinnedUuids.includes(item.uuid)
  };
}

export class CommanderTrainerSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-trainer-sheet"],
    position: { width: 980, height: 800 },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      setActivePokemon: CommanderTrainerSheet.setActivePokemon,
      removePokemon: CommanderTrainerSheet.removePokemon,
      openPokemon: CommanderTrainerSheet.openPokemon,
      rollSkill: CommanderTrainerSheet.rollSkill,
      togglePinnedTalent: CommanderTrainerSheet.togglePinnedTalent,
      postTalent: CommanderTrainerSheet.postTalent
    }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/trainer/overview.hbs" },
    team: { template: "systems/ptu/src/module/commander/templates/trainer/team.hbs" },
    skills: { template: "systems/ptu/src/module/commander/templates/trainer/skills.hbs" },
    talents: { template: "systems/ptu/src/module/commander/templates/trainer/talents.hbs" },
    inventory: { template: genericTab },
    exploration: { template: genericTab },
    social: { template: genericTab },
    downtime: { template: genericTab },
    effects: { template: "systems/ptu/src/module/commander/templates/shared/effects.hbs" },
    biography: { template: genericTab }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const activeUuid = this.actor.system.team?.activePokemonUuid;
    const activeCompanion = activeUuid ? await fromUuid(activeUuid) : null;
    const team = [];
    const attributes = this.actor.system.attributes ?? {};
    const attributeOptions = Object.entries(ATTRIBUTE_LABELS).map(([value, label]) => ({ value, label }));
    const skillList = Object.entries(this.actor.system.skills ?? {}).map(([key, skill]) => {
      const attributeValue = Number(attributes[skill.attribute]?.final ?? 0);
      const rankBonus = RANK_BONUSES[String(skill.rank ?? "untrained").toLowerCase()] ?? 0;
      const misc = Number(skill.misc ?? 0);
      const total = attributeValue + rankBonus + misc;
      return {
        key,
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()),
        ...skill,
        attributeLabel: ATTRIBUTE_LABELS[skill.attribute] ?? skill.attribute,
        attributeValue,
        attributeSigned: signed(attributeValue),
        rankBonus,
        rankSigned: signed(rankBonus),
        misc,
        miscSigned: signed(misc),
        total,
        totalSigned: signed(total),
        attributeOptions: attributeOptions.map(option => ({ ...option, selected: option.value === skill.attribute }))
      };
    });

    for (const uuid of this.actor.system.team?.pokemonUuids ?? []) {
      const pokemon = await fromUuid(uuid);
      if (!pokemon) continue;
      const friendship = CommanderFriendshipService.getState(pokemon);
      const hp = pokemon.system.health?.hp ?? {};
      const types = pokemon.system.identity?.types ?? [];
      team.push({
        actor: pokemon,
        isActive: pokemon.uuid === activeUuid,
        friendship,
        types,
        hpPercent: Number(hp.max ?? 0) > 0 ? Math.round((Number(hp.value ?? 0) / Number(hp.max)) * 100) : 0,
        isFainted: Number(hp.value ?? 0) <= 0 || pokemon.system.identity?.lifecycle === "fainted",
        conditionCount: pokemon.effects?.contents?.length ?? 0,
        actionState: pokemon.system.actions ?? {}
      });
    }

    const identity = this.actor.system.identity ?? {};
    const pinnedUuids = this.actor.system.ui?.pinnedTalentUuids ?? [];
    const talents = this.actor.items.filter(item => TALENT_TYPES.has(item.type)).map(item => talentSummary(item, pinnedUuids));
    talents.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.item.name.localeCompare(b.item.name));

    return {
      ...context,
      sheetType: "trainer",
      tabs: ["overview", "team", "skills", "talents", "inventory", "exploration", "social", "downtime", "effects", "biography"],
      activeCompanion,
      team,
      teamCount: team.length,
      maxTeamSize: MAX_TEAM_SIZE,
      teamFull: team.length >= MAX_TEAM_SIZE,
      skillList,
      talents,
      pinnedTalentCount: talents.filter(talent => talent.isPinned).length,
      backgroundOptions: optionList(COMMANDER_BACKGROUNDS, identity.background),
      roleOptions: roleOptions(identity.role),
      specialtyOptions: specialtyOptions(identity.role, identity.specialty)
    };
  }

  static async rollSkill(event, target) {
    const app = resolveApplication(target, this);
    return CommanderRollService.rollSkill({ actor: app.actor, skillKey: target.dataset.skillKey });
  }

  static async togglePinnedTalent(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That Talent could not be resolved.");
    const current = [...(app.actor.system.ui?.pinnedTalentUuids ?? [])];
    const next = current.includes(item.uuid) ? current.filter(uuid => uuid !== item.uuid) : [...current, item.uuid];
    await app.actor.update({ "system.ui.pinnedTalentUuids": next });
    return app.render();
  }

  static async postTalent(event, target) {
    const app = resolveApplication(target, this);
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That Talent could not be resolved.");
    const system = item.system ?? {};
    const description = system.description ?? system.effect ?? system.summary ?? "No rules text available.";
    const content = `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(item.name)}</h3><p>${description}</p></section>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content });
  }

  async _onDropActor(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const dropped = await Actor.implementation.fromDropData(data);
    if (!dropped || dropped.type !== "pokemon") return ui.notifications.warn("Only Pokémon actors can be added to a Trainer team.");
    const current = this.actor.system.team?.pokemonUuids ?? [];
    if (current.includes(dropped.uuid)) return ui.notifications.info(`${dropped.name} is already on this team.`);
    if (current.length >= MAX_TEAM_SIZE) return ui.notifications.warn(`A Trainer team can hold no more than ${MAX_TEAM_SIZE} Pokémon.`);
    await this.actor.update({ "system.team.pokemonUuids": [...current, dropped.uuid] });
    await dropped.update({ "system.identity.trainerUuid": this.actor.uuid, "system.identity.lifecycle": current.length ? "party" : "active" });
    if (!this.actor.system.team?.activePokemonUuid) await this.actor.update({ "system.team.activePokemonUuid": dropped.uuid });
    return this.render();
  }

  async _onDropItem(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    const activeTab = this._commanderActiveTab ?? this.actor.system.ui?.activeTab;
    if (activeTab === "talents" && !TALENT_TYPES.has(item.type)) return ui.notifications.warn("Only Talent, Feat, or Edge items can be dropped onto the Talents tab.");
    return Item.create(item.toObject(), { parent: this.actor });
  }

  static async setActivePokemon(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const uuid = target.dataset.uuid;
    const next = uuid ? await fromUuid(uuid) : null;
    if (!next || next.type !== "pokemon") return ui.notifications.warn("That Pokémon could not be resolved.");
    if (Number(next.system.health?.hp?.value ?? 0) <= 0) return ui.notifications.warn(`${next.name} is fainted and cannot become active.`);
    const previousUuid = app.actor.system.team?.activePokemonUuid;
    const previous = previousUuid && previousUuid !== uuid ? await fromUuid(previousUuid) : null;
    const updates = [app.actor.update({ "system.team.activePokemonUuid": uuid }), next.update({ "system.identity.trainerUuid": app.actor.uuid, "system.identity.lifecycle": "active" })];
    if (previous?.type === "pokemon") updates.push(previous.update({ "system.identity.lifecycle": "party" }));
    await Promise.all(updates);
    ui.notifications.info(`${next.name} is now ${app.actor.name}'s active Pokémon.`);
    return app.render();
  }

  static async removePokemon(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const uuid = target.dataset.uuid;
    const pokemon = uuid ? await fromUuid(uuid) : null;
    const current = app.actor.system.team?.pokemonUuids ?? [];
    const remaining = current.filter(entry => entry !== uuid);
    const wasActive = app.actor.system.team?.activePokemonUuid === uuid;
    const replacementUuid = wasActive ? (remaining[0] ?? "") : app.actor.system.team?.activePokemonUuid;
    await app.actor.update({ "system.team.pokemonUuids": remaining, "system.team.activePokemonUuid": replacementUuid });
    if (pokemon?.type === "pokemon" && pokemon.system.identity?.trainerUuid === app.actor.uuid) await pokemon.update({ "system.identity.trainerUuid": "", "system.identity.lifecycle": "reserve" });
    if (wasActive && replacementUuid) {
      const replacement = await fromUuid(replacementUuid);
      if (replacement?.type === "pokemon") await replacement.update({ "system.identity.lifecycle": Number(replacement.system.health?.hp?.value ?? 0) > 0 ? "active" : "fainted" });
    }
    return app.render();
  }

  static async openPokemon(event, target) {
    const uuid = target.dataset.uuid;
    const pokemon = uuid ? await fromUuid(uuid) : null;
    return pokemon?.sheet?.render(true);
  }
}
