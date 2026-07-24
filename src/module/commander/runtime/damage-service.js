import { CommanderFriendshipService } from "./friendship-service.js";
import { CommanderConditionService } from "./condition-service.js";
import { CommanderRulesEngine } from "./rules-engine.js";

export class CommanderDamageService {
  static getTargetActors() {
    return [...(game.user?.targets ?? [])].map(token => token.actor).filter(Boolean);
  }

  static defenseValue(actor, defense) {
    if (!actor || defense === "none") return 0;
    const key = String(defense).toLowerCase();
    let value = Number(actor.system.defenses?.[defense]?.final ?? actor.system.defenses?.[key]?.final ?? 0);
    if (CommanderConditionService.hasCondition(actor, "vulnerable") && ["physical", "special", "reflex"].includes(key)) value -= 2;
    if (CommanderConditionService.hasCondition(actor, "restrained") && key === "reflex") value -= 2;
    return Math.max(0, value);
  }

  static estimateDamage({ attacker, target, move, rollTotal = null, critical = false } = {}) {
    const system = move?.system ?? {};
    const category = String(system.category ?? "status").toLowerCase();
    const defenseKey = system.target?.defense ?? (category === "physical" ? "physical" : category === "special" ? "special" : "none");
    const defense = this.defenseValue(target, defenseKey);
    const profile = CommanderRulesEngine.damageProfile({ attacker, target, move, critical });
    const hit = rollTotal == null || defenseKey === "none" || Number(rollTotal) >= defense;
    return { ...profile, dice: profile.finalDice, defenseKey, defense, hit };
  }

  static async rollDamage({ attacker, target, move, rollTotal = null, critical = false } = {}) {
    const preview = this.estimateDamage({ attacker, target, move, rollTotal, critical });
    if (!preview.hit || preview.typing.immune) return { ...preview, total: 0 };
    if (preview.dice <= 0) return { ...preview, total: preview.flat };
    const formula = critical
      ? `${Math.max(0, preview.dice - 1)}d6 + 6 + @flat`
      : `${preview.dice}d6 + @flat`;
    const roll = await new Roll(formula, { flat: preview.flat }).evaluate();
    return { ...preview, total: roll.total, roll };
  }

  static async applyDamage(actor, amount, { damageType = "", sourceType = "attack", conditionId = "" } = {}) {
    if (!actor?.isOwner && !game.user?.isGM) return ui.notifications.warn(`You cannot modify ${actor?.name ?? "that actor"}.`);
    const hp = actor.system.health?.hp;
    if (!hp) return ui.notifications.warn(`${actor.name} has no Commander HP resource.`);

    let remaining = Math.max(0, Number(amount) || 0);
    const temporary = Number(actor.system.health?.temporaryHp ?? 0);
    const absorbed = Math.min(temporary, remaining);
    remaining -= absorbed;
    let nextHp = Math.max(0, Number(hp.value ?? 0) - remaining);

    if (actor.type === "pokemon" && nextHp === 0 && Number(hp.value ?? 0) > 0 && game.user?.isGM) {
      const useFriendship = await CommanderFriendshipService.confirmResolve(actor);
      if (useFriendship) {
        nextHp = 1;
        await CommanderFriendshipService.useResolve(actor);
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<section class="commander-chat-card commander-friendship-card"><strong>${actor.name}</strong><p>It held on because it doesn&#39;t want you to worry.</p></section>` });
      }
    }

    const result = await actor.update({ "system.health.temporaryHp": temporary - absorbed, "system.health.hp.value": nextHp });
    if (remaining > 0 && sourceType !== "condition") {
      const { CommanderConditionMechanics } = await import("./condition-mechanics.js");
      await CommanderConditionMechanics.onDamageTaken(actor, { damageType, amount: remaining, conditionId });
    }
    return result;
  }

  static async applyHealing(actor, amount) {
    if (!actor?.isOwner && !game.user?.isGM) return ui.notifications.warn(`You cannot modify ${actor?.name ?? "that actor"}.`);
    const hp = actor.system.health?.hp;
    if (!hp) return ui.notifications.warn(`${actor.name} has no Commander HP resource.`);
    return actor.update({ "system.health.hp.value": Math.min(Number(hp.max ?? 0), Number(hp.value ?? 0) + Math.max(0, Number(amount) || 0)) });
  }
}
