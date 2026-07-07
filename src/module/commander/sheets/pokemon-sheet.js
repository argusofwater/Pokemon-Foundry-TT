import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderActionTracker } from "../runtime/action-tracker.js";
import { CommanderRollService } from "../runtime/roll-service.js";

export class CommanderPokemonSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-pokemon-sheet"],
    position: { width: 980, height: 800 },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      rollMove: CommanderPokemonSheet.rollMove,
      spendMoveAction: CommanderPokemonSheet.spendMoveAction
    }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/pokemon/overview.hbs" },
    moves: { template: "systems/ptu/src/module/commander/templates/pokemon/moves.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const labels = {
      hp: "HP",
      attack: "Attack",
      defense: "Defense",
      specialAttack: "Special Attack",
      specialDefense: "Special Defense",
      speed: "Speed"
    };

    const statList = Object.entries(this.actor.system.stats ?? {}).map(([key, stat]) => ({
      key,
      label: labels[key] ?? key,
      ...stat
    }));

    const equippedMoves = await this.#resolveMoveSlots(this.actor.system.loadout?.equippedMoveUuids ?? [], 4);
    const reserveMoves = await this.#resolveMoveSlots(this.actor.system.loadout?.reserveMoveUuids ?? [], 2);
    const embeddedMoves = this.actor.items.filter(item => item.type === "move");

    return {
      ...context,
      sheetType: "pokemon",
      tabs: ["overview", "moves", "abilities", "talents", "growth", "equipment", "bond", "exploration", "effects", "biography"],
      statList,
      equippedMoves,
      reserveMoves,
      embeddedMoves
    };
  }

  async #resolveMoveSlots(uuids, size) {
    const resolved = [];
    for (const uuid of uuids) resolved.push(uuid ? await fromUuid(uuid) : null);
    while (resolved.length < size) resolved.push(null);
    return resolved.slice(0, size);
  }

  static async rollMove(event, target) {
    const app = this.getApplication(target, this);
    const item = await fromUuid(target.dataset.itemUuid);
    if (!item) return ui.notifications.warn("Move could not be resolved.");
    return CommanderRollService.rollMove({ actor: app.actor, item });
  }

  static async spendMoveAction(event, target) {
    const app = this.getApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    return CommanderActionTracker.spend(app.actor, "main");
  }
}
