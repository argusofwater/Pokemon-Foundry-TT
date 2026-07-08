import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderFriendshipService } from "../runtime/friendship-service.js";
import { CommanderRollService } from "../runtime/roll-service.js";

function resolveApplication(target, fallback) {
  return target?.closest?.(".application")?.application ?? fallback;
}

const genericTab = "systems/ptu/src/module/commander/templates/shared/generic-tab.hbs";

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
    const skillList = Object.entries(this.actor.system.skills ?? {}).map(([key, skill]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()),
      ...skill
    }));

    for (const uuid of this.actor.system.team?.pokemonUuids ?? []) {
      const pokemon = await fromUuid(uuid);
      if (!pokemon) continue;
      const friendship = CommanderFriendshipService.getState(pokemon);
      team.push({ actor: pokemon, isActive: pokemon.uuid === activeUuid, friendship, hpPercent: pokemon.system.health?.hp?.max ? Math.round((Number(pokemon.system.health.hp.value ?? 0) / Number(pokemon.system.health.hp.max)) * 100) : 0 });
    }

    return {
      ...context,
      sheetType: "trainer",
      tabs: ["overview", "team", "skills", "talents", "inventory", "exploration", "social", "downtime", "effects", "biography"],
      activeCompanion,
      team,
      skillList
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
      if (replacement?.type === "pokemon") await replacement.update({ "system.identity.lifecycle": "active" });
    }
    return app.render();
  }

  static async openPokemon(event, target) {
    const uuid = target.dataset.uuid;
    const pokemon = uuid ? await fromUuid(uuid) : null;
    return pokemon?.sheet?.render(true);
  }
}
