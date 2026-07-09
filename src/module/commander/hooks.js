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

function ensureCommanderController() {
  game.commander ??= createCommanderController();
  return game.commander;
}

export const CommanderHooks = {
  listen() {
    Hooks.once("init", () => {
      registerCommanderSettings();
      ensureCommanderController();
      const enabled = getCommanderSetting("commanderEnabled", true);
      const confirmed = getCommanderSetting("commanderMigrationConfirmed", true);
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
