import { registerCommanderDataModels } from "./data/register.js";
import { createCommanderController } from "./controller.js";
import { registerCommanderSettings } from "./settings.js";

function getCommanderSetting(key, fallback = true) {
  try {
    return game.settings.get("ptu", key);
  } catch (error) {
    console.warn(`Commander setting '${key}' was unavailable; using ${fallback}.`, error);
    return fallback;
  }
}

export const CommanderHooks = {
  listen() {
    Hooks.once("init", () => {
      registerCommanderSettings();
      const enabled = getCommanderSetting("commanderEnabled", true);
      const confirmed = getCommanderSetting("commanderMigrationConfirmed", true);
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
