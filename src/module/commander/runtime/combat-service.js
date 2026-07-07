import { CommanderActionTracker } from "./action-tracker.js";
import { CommanderFriendshipService } from "./friendship-service.js";

export class CommanderCombatService {
  static isCommanderActor(actor) {
    return Boolean(actor?.system?.actions && actor?.system?.health?.hp && actor?.system?.schema);
  }

  static getLevel(actor) {
    return Number(actor?.system?.identity?.level ?? actor?.system?.level?.current ?? 0);
  }

  static getSpeed(actor) {
    if (!actor) return 0;
    if (actor.type === "pokemon") return Number(actor.system.stats?.speed?.final ?? 0);
    return Number(actor.system.attributes?.agility?.final ?? actor.system.defenses?.reflex?.final ?? 0);
  }

  static getInitiativeModifier(actor) {
    if (!actor) return 0;
    if (actor.type === "pokemon") return this.getSpeed(actor);
    return Number(actor.system.attributes?.agility?.final ?? 0);
  }

  static async rollInitiative(combatant, { rollMode = null } = {}) {
    const actor = combatant?.actor;
    if (!this.isCommanderActor(actor)) return null;
    const modifier = this.getInitiativeModifier(actor);
    const roll = await new Roll("1d20 + @modifier", { modifier }).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${actor.name} rolls Commander Initiative`,
      rollMode: rollMode ?? game.settings.get("core", "rollMode")
    });
    return roll;
  }

  static compareCombatants(a, b) {
    const initiativeA = Number(a?.initiative ?? -Infinity);
    const initiativeB = Number(b?.initiative ?? -Infinity);
    if (initiativeA !== initiativeB) return initiativeB - initiativeA;

    const speedA = this.getSpeed(a?.actor);
    const speedB = this.getSpeed(b?.actor);
    if (speedA !== speedB) return speedB - speedA;

    const levelA = this.getLevel(a?.actor);
    const levelB = this.getLevel(b?.actor);
    if (levelA !== levelB) return levelB - levelA;

    return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
  }

  static async onTurnStart(combatant) {
    const actor = combatant?.actor;
    if (!this.isCommanderActor(actor)) return false;
    await CommanderActionTracker.reset(actor);
    await this.tickRecharge(actor);
    return true;
  }

  static async tickRecharge(actor) {
    const updates = [];
    for (const item of actor?.items ?? []) {
      const remaining = Number(item.system?.recharge?.remaining ?? 0);
      if (remaining > 0) updates.push({ _id: item.id, "system.recharge.remaining": Math.max(0, remaining - 1) });
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  }

  static getTrackerState(actor) {
    if (!this.isCommanderActor(actor)) return null;
    const actions = actor.system.actions ?? {};
    const friendship = actor.type === "pokemon" ? CommanderFriendshipService.getState(actor) : null;
    return {
      isCommander: true,
      mainRemaining: Number(actions.sharedMainRemaining ?? 0),
      moveRemaining: Number(actions.sharedMoveRemaining ?? 0),
      reactionReady: !actions.reactionUsed,
      friendship
    };
  }
}
