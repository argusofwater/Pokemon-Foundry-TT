import { CommanderActorSheetBase } from "./base-sheet.js";

export class CommanderTrainerSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-trainer-sheet"],
    position: { width: 980, height: 800 }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/trainer/overview.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const activeUuid = this.actor.system.team?.activePokemonUuid;
    const activeCompanion = activeUuid ? await fromUuid(activeUuid) : null;

    return {
      ...context,
      sheetType: "trainer",
      tabs: ["overview", "team", "skills", "talents", "inventory", "exploration", "social", "downtime", "effects", "biography"],
      activeCompanion
    };
  }

  async _onDropActor(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const dropped = await Actor.implementation.fromDropData(data);
    if (!dropped || dropped.type !== "pokemon") return ui.notifications.warn("Only companion actors can be added to a Trainer team.");

    const current = this.actor.system.team?.pokemonUuids ?? [];
    if (current.includes(dropped.uuid)) return ui.notifications.info(`${dropped.name} is already on this team.`);
    await this.actor.update({ "system.team.pokemonUuids": [...current, dropped.uuid] });
  }
}
