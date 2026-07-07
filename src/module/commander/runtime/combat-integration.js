import { PTUCombat } from "../../combat/document.js";
import { PTUCombatant } from "../../combat/combatant.js";
import { PTUCombatTracker } from "../../combat/tracker.js";
import { CommanderCombatService } from "./combat-service.js";

let registered = false;

export function registerCommanderCombatIntegration() {
  if (registered) return;
  registered = true;

  const originalSort = PTUCombat.prototype._sortCombatants;
  PTUCombat.prototype._sortCombatants = function(a, b) {
    if (CommanderCombatService.isCommanderActor(a?.actor) && CommanderCombatService.isCommanderActor(b?.actor)) {
      return CommanderCombatService.compareCombatants(a, b);
    }
    return originalSort.call(this, a, b);
  };

  const originalRollInitiative = PTUCombat.prototype.rollInitiative;
  PTUCombat.prototype.rollInitiative = async function(ids, options = {}) {
    const commanderCombatants = ids
      .map(id => this.combatants.get(id))
      .filter(combatant => CommanderCombatService.isCommanderActor(combatant?.actor));

    const rollMode = options.messageOptions?.rollMode ?? options.rollMode ?? game.settings.get("core", "rollMode");
    const initiatives = [];
    for (const combatant of commanderCombatants) {
      const roll = await CommanderCombatService.rollInitiative(combatant, { rollMode });
      if (roll) initiatives.push({ id: combatant.id, value: roll.total });
    }
    if (initiatives.length) await this.setMultipleInitiatives(initiatives);

    const remaining = ids.filter(id => !commanderCombatants.some(combatant => combatant.id === id));
    if (remaining.length) return originalRollInitiative.call(this, remaining, options);
    return this;
  };

  const originalStartTurn = PTUCombatant.prototype.startTurn;
  PTUCombatant.prototype.startTurn = async function() {
    if (!CommanderCombatService.isCommanderActor(this.actor)) return originalStartTurn.call(this);
    const { actor, encounter } = this;
    if (!encounter || !actor) return;
    await CommanderCombatService.onTurnStart(this);
    await this.update({ "flags.ptu.roundOfLastTurn": encounter.round });
    Hooks.callAll("ptu.startTurn", this, encounter, game.user.id);
    Hooks.callAll("commander.startTurn", this, encounter, game.user.id);
  };

  const originalPrepareTurn = PTUCombatTracker.prototype._prepareTurnContext;
  PTUCombatTracker.prototype._prepareTurnContext = async function(combat, combatant, index) {
    const turn = await originalPrepareTurn.call(this, combat, combatant, index);
    turn.commander = CommanderCombatService.getTrackerState(combatant?.actor);
    return turn;
  };
}
