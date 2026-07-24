import { CommanderDamageService } from "./damage-service.js";
import { CommanderActionTracker } from "./action-tracker.js";

export class CommanderSheetAutomation {
  static async resolveTarget(app, targetKey = "self", explicitUuid = "") {
    if (explicitUuid) return fromUuid(explicitUuid);
    if (targetKey === "self") return app.actor;
    if (targetKey === "activePokemon" && app.actor.type === "character") {
      const uuid = app.actor.system.team?.activePokemonUuid;
      return uuid ? fromUuid(uuid) : null;
    }
    if (targetKey === "trainer" && app.actor.type === "pokemon") {
      const uuid = app.actor.system.identity?.trainerUuid;
      return uuid ? fromUuid(uuid) : null;
    }
    return null;
  }

  static readAmount(app, target) {
    const selector = target.dataset.amountSelector ?? "[data-commander-adjustment]";
    const input = app.element?.querySelector?.(selector);
    return Math.max(0, Number(input?.value ?? 0) || 0);
  }

  static async adjustHp(app, target, mode) {
    const actor = await this.resolveTarget(app, target.dataset.targetActor ?? "self", target.dataset.actorUuid ?? "");
    if (!actor) return ui.notifications.warn("The linked actor could not be resolved.");
    const amount = this.readAmount(app, target);
    if (amount <= 0) return ui.notifications.warn("Enter an amount greater than zero.");
    if (mode === "damage") await CommanderDamageService.applyDamage(actor, amount);
    else await CommanderDamageService.applyHealing(actor, amount);
    return app.render();
  }

  static async setHp(app, target, mode) {
    const actor = await this.resolveTarget(app, target.dataset.targetActor ?? "self", target.dataset.actorUuid ?? "");
    if (!actor) return ui.notifications.warn("The linked actor could not be resolved.");
    const hp = actor.system.health?.hp;
    if (!hp) return ui.notifications.warn(`${actor.name} has no Commander HP resource.`);
    const value = mode === "full" ? Number(hp.max ?? 0) : 0;
    await actor.update({ "system.health.hp.value": value });
    return app.render();
  }

  static async changeAction(app, target, mode) {
    const actor = await this.resolveTarget(app, target.dataset.targetActor ?? "self", target.dataset.actorUuid ?? "");
    if (!actor) return ui.notifications.warn("The linked actor could not be resolved.");
    const type = target.dataset.actionType;
    if (mode === "spend") await CommanderActionTracker.spend(actor, type);
    else if (mode === "restore") await CommanderActionTracker.restore(actor, type);
    else await CommanderActionTracker.reset(actor);
    return app.render();
  }
}
