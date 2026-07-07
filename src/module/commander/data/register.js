import { CommanderTrainerData, CommanderPokemonData } from "./models.js";
import {
  CommanderMoveData,
  CommanderAbilityData,
  CommanderTalentData,
  CommanderEquipmentData,
  CommanderCapabilityData
} from "./item-models.js";
import { CommanderSpeciesData } from "./species-model.js";
import { PTUActor } from "../../actor/base.js";
import { PTUTrainerActor } from "../../actor/character/document.js";
import { PTUPokemonActor } from "../../actor/pokemon/document.js";

let preparationGuardsInstalled = false;

function installCommanderPreparationGuards() {
  if (preparationGuardsInstalled) return;
  preparationGuardsInstalled = true;

  for (const ActorClass of [PTUTrainerActor, PTUPokemonActor]) {
    const legacyPrepareBaseData = ActorClass.prototype.prepareBaseData;
    const legacyPrepareDerivedData = ActorClass.prototype.prepareDerivedData;

    ActorClass.prototype.prepareBaseData = function() {
      if (this.system?.schema) return PTUActor.prototype.prepareBaseData.call(this);
      return legacyPrepareBaseData.call(this);
    };

    ActorClass.prototype.prepareDerivedData = function() {
      if (this.system?.schema) return PTUActor.prototype.prepareDerivedData.call(this);
      return legacyPrepareDerivedData.call(this);
    };
  }
}

export function registerCommanderDataModels() {
  installCommanderPreparationGuards();

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
