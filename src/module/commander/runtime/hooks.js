import { CommanderDamageService } from "./damage-service.js";
import { CommanderCombatService } from "./combat-service.js";
import { CommanderFaintingService } from "./fainting-service.js";
import { registerCommanderCombatIntegration } from "./combat-integration.js";
import { checkActorMove } from "./move-legality.js";

function bindCommanderChatControls(html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.dataset.commanderControlsBound === "true") return;
  root.dataset.commanderControlsBound = "true";

  root.querySelectorAll("[data-commander-apply-damage]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const actor = await fromUuid(button.dataset.actorUuid);
      const amount = Number(button.dataset.amount ?? 0);
      if (!actor) return ui.notifications.warn("The target actor could not be resolved.");
      await CommanderDamageService.applyDamage(actor, amount, { damageType: button.dataset.damageType ?? "" });
      ui.notifications.info("Applied " + amount + " damage to " + actor.name + ".");
    });
  });

  root.querySelectorAll("[data-commander-apply-healing]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const actor = await fromUuid(button.dataset.actorUuid);
      const amount = Number(button.dataset.amount ?? 0);
      if (!actor) return ui.notifications.warn("The target actor could not be resolved.");
      await CommanderDamageService.applyHealing(actor, amount);
      ui.notifications.info("Restored " + amount + " HP to " + actor.name + ".");
    });
  });
}

export function registerCommanderRuntimeHooks() {
  registerCommanderCombatIntegration();
  Hooks.on("preCreateItem", (item) => {
    const actor = item.parent;
    if (actor?.type !== "pokemon" || !actor.id || item.type !== "move") return;
    const legality = checkActorMove(actor, item);
    if (legality.legal) return;
    ui.notifications.error(`Move rejected for ${actor.name}: ${legality.reason}`);
    return false;
  });
  Hooks.on("renderChatMessageHTML", (message, html) => bindCommanderChatControls(html));
  Hooks.on("renderChatMessage", (message, html) => bindCommanderChatControls(html));
  Hooks.on("updateActor", async (actor, changed, options) => {
    if (!CommanderCombatService.isCommanderActor(actor)) return;
    const systemChange = changed.system || {};
    if (systemChange.health?.hp?.value !== undefined) await CommanderFaintingService.sync(actor, options);
    if (!game.combat) return;
    if (!systemChange.actions && !systemChange.health && !systemChange.team && !systemChange.identity) return;
    if (ui.combat && ui.combat.render) ui.combat.render({ parts: ["tracker"] });
  });
}
