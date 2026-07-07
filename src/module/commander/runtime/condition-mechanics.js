import { CommanderActionTracker } from "./action-tracker.js";
import { CommanderConditionService } from "./condition-service.js";
import { CommanderDamageService } from "./damage-service.js";

export class CommanderConditionMechanics {
  static has(actor, id) {
    return CommanderConditionService.hasCondition(actor, id);
  }

  static async post(actor, title, body, rolls = []) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<section class="commander-chat-card commander-condition-card"><strong>${title}</strong><p>${body}</p></section>`,
      rolls: rolls.filter(Boolean)
    });
  }

  static async rollD20(actor, label, { favored = false } = {}) {
    const formula = favored ? "2d20kh" : "1d20";
    const roll = await new Roll(formula).evaluate();
    await this.post(actor, label, `Rolled <strong>${roll.total}</strong>.`, [roll]);
    return roll.total;
  }

  static async applyConditionDamage(actor, dice, label) {
    const roll = await new Roll(`${dice}d6`).evaluate();
    await CommanderDamageService.applyDamage(actor, roll.total, { sourceType: "condition", conditionId: label.toLowerCase() });
    await this.post(actor, label, `${actor.name} takes <strong>${roll.total}</strong> damage.`, [roll]);
    return roll.total;
  }

  static async onTurnStart(actor) {
    if (!actor || this.has(actor, "fainted")) {
      if (actor) await this.lockActions(actor, { main: true, move: true, reaction: true });
      return;
    }

    if (this.has(actor, "frozen")) await this.lockActions(actor, { main: true });
    if (this.has(actor, "asleep")) await this.lockActions(actor, { main: true, reaction: true });

    if (this.has(actor, "paralyzed")) {
      const total = await this.rollD20(actor, "Paralysis Check");
      if (total <= 5) {
        await this.lockActions(actor, { main: true });
        await this.post(actor, "Paralyzed", `${actor.name} cannot take an individual Main Action this turn.`);
      }
    }
  }

  static async onTurnEnd(actor) {
    if (!actor || this.has(actor, "fainted")) return;

    if (this.has(actor, "burned")) await this.applyConditionDamage(actor, 1, "Burned");

    if (this.has(actor, "poisoned")) {
      const effect = CommanderConditionService.getConditionEffect(actor, "poisoned");
      const stage = Math.max(1, Math.min(3, Number(effect?.getFlag("ptu", "commanderPoisonStage") ?? 1)));
      await this.applyConditionDamage(actor, stage, "Poisoned");
      if (effect && stage < 3) await effect.setFlag("ptu", "commanderPoisonStage", stage + 1);
    }

    if (this.has(actor, "frozen")) {
      const total = await this.rollD20(actor, "Frozen Recovery");
      if (total >= 11) {
        await CommanderConditionService.remove(actor, "frozen");
        await this.post(actor, "Thawed", `${actor.name} is no longer Frozen.`);
      }
    }

    if (this.has(actor, "asleep")) {
      const total = await this.rollD20(actor, "Sleep Recovery");
      if (total >= 11) {
        await CommanderConditionService.remove(actor, "asleep");
        await this.post(actor, "Awake", `${actor.name} woke up.`);
      }
    }
  }

  static async beforeMainAction(actor) {
    if (!actor) return { allowed: false };
    if (this.has(actor, "fainted") || this.has(actor, "frozen") || this.has(actor, "asleep")) return { allowed: false };
    if (!this.has(actor, "confused")) return { allowed: true };

    const focus = Number(actor.system.skills?.focus?.rank ?? actor.system.skills?.focus?.modifier ?? 0);
    const roll = await new Roll("1d20 + @focus", { focus }).evaluate();
    const success = roll.total >= 10;
    await this.post(actor, "Confusion Check", `${actor.name} rolled <strong>${roll.total}</strong> against 10.`, [roll]);

    const effect = CommanderConditionService.getConditionEffect(actor, "confused");
    if (success) {
      const successes = Number(effect?.getFlag("ptu", "commanderConfusionSuccesses") ?? 0) + 1;
      if (effect) await effect.setFlag("ptu", "commanderConfusionSuccesses", successes);
      if (successes >= 3) {
        await CommanderConditionService.remove(actor, "confused");
        await this.post(actor, "Confusion Cleared", `${actor.name} shook off the confusion.`);
      }
      return { allowed: true };
    }

    await CommanderActionTracker.spend(actor, "main");
    await this.applyConditionDamage(actor, 1, "Confused");
    return { allowed: false };
  }

  static async onDamageTaken(actor, { damageType = "", amount = 0 } = {}) {
    if (!actor || Number(amount) <= 0) return;

    if (this.has(actor, "frozen") && String(damageType).toLowerCase() === "fire") {
      await CommanderConditionService.remove(actor, "frozen");
      await this.post(actor, "Thawed", `${actor.name} thawed after taking Fire damage.`);
    }

    if (this.has(actor, "asleep")) {
      const total = await this.rollD20(actor, "Wake Check", { favored: true });
      if (total >= 11) {
        await CommanderConditionService.remove(actor, "asleep");
        await this.post(actor, "Awake", `${actor.name} woke after taking damage.`);
      }
    }
  }

  static getRollAdjustments(actor, { category = "", defense = "" } = {}) {
    const physicalBurn = this.has(actor, "burned") && String(category).toLowerCase() === "physical";
    const reflexParalysis = this.has(actor, "paralyzed") && String(defense).toLowerCase() === "reflex";
    return { hindered: physicalBurn || reflexParalysis };
  }

  static getDefensePenalty(actor, defense) {
    let penalty = 0;
    const key = String(defense).toLowerCase();
    if (this.has(actor, "vulnerable") && ["physical", "special", "reflex"].includes(key)) penalty -= 2;
    if (this.has(actor, "restrained") && key === "reflex") penalty -= 2;
    return penalty;
  }

  static getSpeedMultiplier(actor) {
    return this.has(actor, "paralyzed") ? 0.5 : 1;
  }

  static getMovementMultiplier(actor) {
    return this.has(actor, "restrained") ? 0 : 1;
  }

  static async lockActions(actor, { main = false, move = false, reaction = false } = {}) {
    const updates = {};
    if (main) updates["system.actions.mainUsed"] = true;
    if (move) updates["system.actions.moveUsed"] = true;
    if (reaction) updates["system.actions.reactionUsed"] = true;
    if (Object.keys(updates).length) await actor.update(updates);
  }
}
