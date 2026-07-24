import { CommanderDamageService } from "./damage-service.js";
import { CommanderConditionMechanics } from "./condition-mechanics.js";
import { CommanderRulesEngine } from "./rules-engine.js";

export class CommanderRollService {
  static async rollCheck({ actor, label, modifier = 0, target = null, favored = false, hindered = false, notes = "", defense = "", rank = null, attribute = null, misc = 0 } = {}) {
    if (!actor) throw new Error("Commander roll requires an actor.");
    const adjusted = CommanderConditionMechanics.getRollAdjustments(actor, { defense });
    const finalHindered = Boolean(hindered || adjusted.hindered);
    const profile = rank == null
      ? { dice: favored === finalHindered ? "1d20" : favored ? "2d20kh" : "2d20kl", bonus: Number(modifier) || 0 }
      : CommanderRulesEngine.checkFormula({ rank, attribute, misc, situational: modifier, favored, hindered: finalHindered });
    const roll = await new Roll(`${profile.dice} + @bonus`, { bonus: profile.bonus }).evaluate();
    const total = roll.total;
    const success = Number.isFinite(Number(target)) ? total >= Number(target) : null;
    const content = await renderTemplate("systems/ptu/src/module/commander/templates/chat/check-card.hbs", { actor, label, modifier: profile.bonus, target, total, success, favored, hindered: finalHindered, notes });
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content, rolls: [roll] });
  }

  static async rollSkill({ actor, skillKey, situational = 0, target = null } = {}) {
    const skill = actor?.system?.skills?.[skillKey];
    if (!skill) return ui.notifications.warn("That Commander skill could not be resolved.");
    const attribute = actor.system.attributes?.[skill.attribute]?.final ?? 0;
    return this.rollCheck({
      actor,
      label: skillKey.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()),
      rank: skill.rank,
      attribute,
      misc: skill.misc,
      modifier: situational,
      favored: Boolean(skill.favorite),
      target
    });
  }

  static async rollMove({ actor, item, targetDefense = null, modifier = 0 } = {}) {
    if (!actor || !item) throw new Error("Commander move roll requires an actor and move item.");
    const actionCheck = await CommanderConditionMechanics.beforeMainAction(actor);
    if (!actionCheck.allowed) return null;

    const system = item.system ?? {};
    const category = String(system.category ?? "status").toLowerCase();
    const accuracyModifier = Number(system.accuracyModifier ?? 0) + Number(modifier || 0);
    const adjusted = CommanderConditionMechanics.getRollAdjustments(actor, { category });
    const hindered = Boolean(system.accuracyHindered || adjusted.hindered);
    const roll = await new Roll(`${hindered ? "2d20kl" : "1d20"} + @accuracy`, { accuracy: accuracyModifier }).evaluate();
    const total = roll.total;
    const defense = targetDefense ?? system.target?.defense ?? "none";
    const targets = CommanderDamageService.getTargetActors();
    const previews = [];
    for (const target of targets) {
      const damage = await CommanderDamageService.rollDamage({ attacker: actor, target, move: item, rollTotal: total, critical: roll.dice?.[0]?.total === 20 });
      previews.push({ target, ...damage, half: Math.floor(Number(damage.total ?? 0) / 2) });
    }

    const content = await renderTemplate("systems/ptu/src/module/commander/templates/chat/move-card.hbs", { actor, item, system, total, defense, power: Number(system.power ?? 0), recharge: system.recharge?.category ?? "at-will", targets: previews });
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content, rolls: [roll, ...previews.map(preview => preview.roll).filter(Boolean)], flags: { ptu: { commanderMove: { actorUuid: actor.uuid, itemUuid: item.uuid, defense, power: Number(system.power ?? 0), targets: previews.map(preview => ({ actorUuid: preview.target.uuid, total: preview.total, hit: preview.hit })) } } } });
  }
}
