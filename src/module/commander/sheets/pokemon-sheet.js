import { CommanderActorSheetBase } from "./base-sheet.js";

export class CommanderPokemonSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-pokemon-sheet"],
    position: { width: 980, height: 800 }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/pokemon/overview.hbs" }
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

    const equippedMoves = [];
    for (const uuid of this.actor.system.loadout?.equippedMoveUuids ?? []) {
      equippedMoves.push(uuid ? await fromUuid(uuid) : null);
    }
    while (equippedMoves.length < 4) equippedMoves.push(null);

    return {
      ...context,
      sheetType: "pokemon",
      tabs: ["overview", "moves", "abilities", "talents", "growth", "equipment", "bond", "exploration", "effects", "biography"],
      statList,
      equippedMoves
    };
  }
}
