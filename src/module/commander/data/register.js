import { CommanderTrainerData, CommanderPokemonData } from "./models.js";
import {
  CommanderMoveData,
  CommanderAbilityData,
  CommanderTalentData,
  CommanderEquipmentData,
  CommanderCapabilityData
} from "./item-models.js";
import { CommanderSpeciesData } from "./species-model.js";

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
  CONFIG.Item.dataModels.species = CommanderSpeciesData;
}
