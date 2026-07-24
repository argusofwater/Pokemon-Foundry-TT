import { registerCommanderDataModels } from "./data/register.js";
import { createCommanderController } from "./controller.js";
import { registerCommanderSettings } from "./settings.js";

function getCommanderSetting(key, fallback = false) {
  try {
    return game.settings.get("ptu", key);
  } catch (error) {
    console.warn(`Commander setting '${key}' was unavailable; using ${fallback}.`, error);
    return fallback;
  }
}

function ensureCommanderController() {
  game.commander ??= createCommanderController();
  return game.commander;
}

export const CommanderHooks = {
  listen() {
    Hooks.once("init", () => {
      registerCommanderSettings();
      ensureCommanderController();
      const enabled = getCommanderSetting("commanderEnabled", false);
      const confirmed = getCommanderSetting("commanderMigrationConfirmed", false);
      if (enabled && confirmed) registerCommanderDataModels();
    });

    Hooks.once("ready", () => {
      const commander = ensureCommanderController();
      if (game.user?.isGM && commander.enabled) {
        ui.notifications.info("Commander Build is active for this World.");
      }
    });
  }
};
