import { CommanderFriendshipService } from "./friendship-service.js";

export class CommanderDamageService {
  static getTargetActors() {
    return [...(game.user?.targets ?? [])].map(token => token.actor).filter(Boolean);
  }

  static defenseValue(actor, defense) {
    if (!actor || defense === "none") return 0;
    return Number(actor.system.defenses?.[defense]?.final ?? 0);
  }

  static estimateDamage({ attacker, target, move, rollTotal = null } = {}) {
    const system = move?.system ?? {};
    const category = String(system.category ?? "status").toLowerCase();
    const attack = category === "physical"
      ? Number(attacker?.system.stats?.attack?.final ?? 0)
      : Number(attacker?.system.stats?.specialAttack?.final ?? 0);
    const defenseKey = system.target?.defense ?? (category === "physical" ? "physical" : "special");
    const defense = this.defenseValue(target, defenseKey);
    const power = Number(system.power ?? 0);
    const dice = Math.max(0, Math.min(8, Math.ceil(power / 20)));
    const flat = Math.max(0, attack - defense);
    return { dice, flat, defenseKey, hit: rollTotal == null || defenseKey === "none" || Number(rollTotal) >= defense };
  }

  static async rollDamage({ attacker, target, move, rollTotal = null } = {}) {
    const preview = this.estimateDamage({ attacker, target, move, rollTotal });
    if (!preview.hit) return { ...preview, total: 0 };
    if (preview.dice <= 0) return { ...preview, total: preview.flat };
    const roll = await new Roll(`${preview.dice}d6 + @flat`, { flat: preview.flat }).evaluate();
    return { ...preview, total: roll.total, roll };
  }

  static async applyDamage(actor, amount) {
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
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<section class="commander-chat-card commander-friendship-card"><strong>${actor.name}</strong><p>It held on because it doesn&#39;t want you to worry.</p></section>`
        });
      }
    }

    return actor.update({
      "system.health.temporaryHp": temporary - absorbed,
      "system.health.hp.value": nextHp
    });
  }

  static async applyHealing(actor, amount) {
    if (!actor?.isOwner && !game.user?.isGM) return ui.notifications.warn(`You cannot modify ${actor?.name ?? "that actor"}.`);
    const hp = actor.system.health?.hp;
    if (!hp) return ui.notifications.warn(`${actor.name} has no Commander HP resource.`);
    return actor.update({ "system.health.hp.value": Math.min(Number(hp.max ?? 0), Number(hp.value ?? 0) + Math.max(0, Number(amount) || 0)) });
  }
}
