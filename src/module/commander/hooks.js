import { registerCommanderSettings } from "./settings.js";
import { registerCommanderDataModels } from "./data/register.js";
import { createCommanderController } from "./controller.js";

export const CommanderHooks = {
  listen() {
    Hooks.once("init", () => {
      registerCommanderSettings();
      const enabled = game.settings.get("ptu", "commanderEnabled");
      const confirmed = game.settings.get("ptu", "commanderMigrationConfirmed");
      if (enabled && confirmed) registerCommanderDataModels();
    });

    Hooks.once("ready", () => {
      game.commander = createCommanderController();
      if (game.user?.isGM && game.commander.enabled) {
        ui.notifications.info("Commander Build is active for this World.");
      }
    });
  }
};
