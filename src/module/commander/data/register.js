import { CommanderTrainerData, CommanderPokemonData } from "./models.js";
import {
  CommanderMoveData,
  CommanderAbilityData,
  CommanderTalentData,
  CommanderEquipmentData,
  CommanderCapabilityData
} from "./item-models.js";

/**
 * Register Commander Build TypeDataModels with Foundry V14.
 *
 * This function is intentionally not wired into the live init hook yet.
 * The legacy PTR actor and item documents still depend on template.json and
 * older proxy classes. Registration will be enabled only after the migration
 * adapter and test-world backup path are in place.
 */
export function registerCommanderDataModels() {
  CONFIG.Actor.dataModels.character = CommanderTrainerData;
  CONFIG.Actor.dataModels.pokemon = CommanderPokemonData;

  CONFIG.Item.dataModels.move = CommanderMoveData;
  CONFIG.Item.dataModels.ability = CommanderAbilityData;
  CONFIG.Item.dataModels.feat = CommanderTalentData;
  CONFIG.Item.dataModels.edge = CommanderTalentData;
  CONFIG.Item.dataModels.pokeedge = CommanderTalentData;
  CONFIG.Item.dataModels.item = CommanderEquipmentData;
  CONFIG.Item.dataModels.pokeball = CommanderEquipmentData;
  CONFIG.Item.dataModels.capability = CommanderCapabilityData;
}
