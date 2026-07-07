import { CommanderDamageService } from "./damage-service.js";

export function registerCommanderRuntimeHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    root.querySelectorAll("[data-commander-apply-damage]").forEach(button => {
      button.addEventListener("click", async event => {
        event.preventDefault();
        const actor = await fromUuid(button.dataset.actorUuid);
        const amount = Number(button.dataset.amount ?? 0);
        await CommanderDamageService.applyDamage(actor, amount);
        ui.notifications.info(`Applied ${amount} damage to ${actor?.name ?? "target"}.`);
      });
    });

    root.querySelectorAll("[data-commander-apply-healing]").forEach(button => {
      button.addEventListener("click", async event => {
        event.preventDefault();
        const actor = await fromUuid(button.dataset.actorUuid);
        const amount = Number(button.dataset.amount ?? 0);
        await CommanderDamageService.applyHealing(actor, amount);
        ui.notifications.info(`Restored ${amount} HP to ${actor?.name ?? "target"}.`);
      });
    });
  });
}
