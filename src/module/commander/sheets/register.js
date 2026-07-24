import { CommanderTrainerSheet } from "./trainer-sheet.js";
import { CommanderPokemonSheet } from "./pokemon-sheet.js";

export function registerCommanderSheets() {
  const SheetConfig = foundry.applications.apps.DocumentSheetConfig;

  SheetConfig.registerSheet(CONFIG.Actor.documentClass, "ptu-commander", CommanderTrainerSheet, {
    types: ["character"],
    label: "Commander Trainer Sheet",
    makeDefault: true
  });

  SheetConfig.registerSheet(CONFIG.Actor.documentClass, "ptu-commander", CommanderPokemonSheet, {
    types: ["pokemon"],
    label: "Commander Creature Sheet",
    makeDefault: true
  });
}
