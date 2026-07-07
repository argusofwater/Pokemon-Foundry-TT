export class CommanderRollService {
  static async rollCheck({ actor, label, modifier = 0, target = null, favored = false, hindered = false, notes = "" } = {}) {
    if (!actor) throw new Error("Commander roll requires an actor.");
    const dice = favored === hindered ? "1d20" : favored ? "2d20kh" : "2d20kl";
    const roll = await new Roll(`${dice} + @modifier`, { modifier: Number(modifier) || 0 }).evaluate();
    const total = roll.total;
    const success = Number.isFinite(Number(target)) ? total >= Number(target) : null;

    const content = await renderTemplate("systems/ptu/src/module/commander/templates/chat/check-card.hbs", {
      actor,
      label,
      modifier: Number(modifier) || 0,
      target,
      total,
      success,
      favored,
      hindered,
      notes
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll]
    });
  }

  static async rollMove({ actor, item, targetDefense = null, modifier = 0 } = {}) {
    if (!actor || !item) throw new Error("Commander move roll requires an actor and move item.");
    const system = item.system ?? {};
    const category = String(system.category ?? "status").toLowerCase();
    const attackStat = category === "physical" ? actor.system.stats?.attack?.final : actor.system.stats?.specialAttack?.final;
    const baseModifier = Number(attackStat ?? 0) + Number(modifier || 0);
    const accuracyModifier = Number(system.accuracyModifier ?? 0);
    const hindered = Boolean(system.accuracyHindered);
    const roll = await new Roll(`${hindered ? "2d20kl" : "1d20"} + @modifier + @accuracy`, {
      modifier: baseModifier,
      accuracy: accuracyModifier
    }).evaluate();
    const total = roll.total;
    const defense = targetDefense ?? system.target?.defense ?? "none";

    const content = await renderTemplate("systems/ptu/src/module/commander/templates/chat/move-card.hbs", {
      actor,
      item,
      system,
      total,
      defense,
      power: Number(system.power ?? 0),
      recharge: system.recharge?.category ?? "at-will"
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      rolls: [roll],
      flags: {
        ptu: {
          commanderMove: {
            actorUuid: actor.uuid,
            itemUuid: item.uuid,
            defense,
            power: Number(system.power ?? 0)
          }
        }
      }
    });
  }
}
