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
    const requested = ids
      .map(id => this.combatants.get(id))
      .filter(Boolean);
    const commanderCombatants = requested.filter(combatant => CommanderCombatService.isCommanderActor(combatant?.actor));
    const rollMode = options.messageOptions?.rollMode ?? options.rollMode ?? game.settings.get("core", "rollMode");
    const processed = new Set();
    const initiatives = [];

    for (const combatant of commanderCombatants) {
      if (processed.has(combatant.id)) continue;
      const group = await CommanderCombatService.getInitiativeGroup(this, combatant);
      const leaderActor = group.trainer ?? group.leader?.actor ?? combatant.actor;
      const roll = await CommanderCombatService.rollInitiative(group.leader ?? combatant, {
        rollMode,
        actorOverride: leaderActor
      });
      if (!roll) continue;

      for (const member of group.members) {
        initiatives.push({ id: member.id, value: roll.total });
        processed.add(member.id);
      }
    }

    if (initiatives.length) await this.setMultipleInitiatives(initiatives);

    const remaining = ids.filter(id => !processed.has(id) && !commanderCombatants.some(combatant => combatant.id === id));
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
