import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderFriendshipService } from "../runtime/friendship-service.js";
import { CommanderRollService } from "../runtime/roll-service.js";
import { COMMANDER_BACKGROUNDS, optionList, roleOptions, specialtyOptions } from "../config/trainer-options.js";

function resolveApplication(target, fallback) {
  return target?.closest?.".application"?.application ?? fallback;
}

const genericTab = "systems/ptu/src/module/commander/templates/shared/generic-tab.hbs";
const MAX_TEAM_SIZE = 6;
const RANK_BONUSES = Object.freeze({ untrained: 0, novice: 2, adept: 4, expert: 6, master: 8 });
const ATTRIBUTE_LABELS = Object.freeze({ body: "Body", agility: "Agility", mind: "Mind", presence: "Presence" });

function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
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
      rollSkill: CommanderTrainerSheet.rollSkill
    }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/trainer/overview.hbs" },
    team: { template: "systems/ptu/src/module/commander/templates/trainer/team.hbs" },
    skills: { template: "systems/ptu/src/module/commander/templates/trainer/skills.hbs" },
    talents: { template: genericTab },
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
      backgroundOptions: optionList(COMMANDER_BACKGROUNDS, identity.background),
      roleOptions: roleOptions(identity.role),
      specialtyOptions: specialtyOptions(identity.role, identity.specialty)
    };
  }

  static async rollSkill(event, target) {
    const app = resolveApplication(target, this);
    return CommanderRollService.rollSkill({ actor: app.actor, skillKey: target.dataset.skillKey });
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
