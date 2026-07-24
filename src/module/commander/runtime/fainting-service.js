import { CommanderConditionService } from "./condition-service.js";

export class CommanderFaintingService {
  static async sync(actor, options = {}) {
    if (!actor?.system?.health?.hp || !game.user?.isGM || options.commanderFaintingSync) return;
    const fainted = Number(actor.system.health.hp.value ?? 0) <= 0;

    if (fainted && !CommanderConditionService.hasCondition(actor, "fainted")) {
      await CommanderConditionService.add(actor, "fainted");
    } else if (!fainted && CommanderConditionService.hasCondition(actor, "fainted")) {
      await CommanderConditionService.remove(actor, "fainted");
    }

    if (actor.type === "pokemon") {
      const current = actor.system.identity?.lifecycle;
      if (fainted && current !== "fainted") {
        await actor.update({ "system.identity.lifecycle": "fainted" }, { commanderFaintingSync: true });
      } else if (!fainted && current === "fainted") {
        const trainer = actor.system.identity?.trainerUuid ? await fromUuid(actor.system.identity.trainerUuid) : null;
        const lifecycle = trainer?.system?.team?.activePokemonUuid === actor.uuid ? "active" : "party";
        await actor.update({ "system.identity.lifecycle": lifecycle }, { commanderFaintingSync: true });
      }
    }

    for (const combat of game.combats ?? []) {
      const combatant = combat.combatants.find(entry => entry.actor?.uuid === actor.uuid);
      if (combatant && Boolean(combatant.defeated) !== fainted) await combatant.update({ defeated: fainted });
    }
  }
}
