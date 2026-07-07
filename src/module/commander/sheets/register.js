import { CommanderTrainerSheet } from "./trainer-sheet.js";
import { CommanderPokemonSheet } from "./pokemon-sheet.js";

export function registerCommanderSheets() {
  foundry.documents.collections.Actors.registerSheet("ptu-commander", CommanderTrainerSheet, {
    types: ["character"],
    label: "Commander Trainer Sheet",
    makeDefault: true
  });

  foundry.documents.collections.Actors.registerSheet("ptu-commander", CommanderPokemonSheet, {
    types: ["pokemon"],
    label: "Commander Creature Sheet",
    makeDefault: true
  });
}
