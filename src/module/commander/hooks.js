import { registerCommanderDataModels } from "./data/register.js";
import { createCommanderController } from "./controller.js";

function registerCommanderSettings() {
  const definitions = {
    commanderEnabled: {
      name: "Commander Build Enabled",
      hint: "Activates Commander Build data models, sheets, and private automation for this world.",
      default: true
    },
    commanderMigrationConfirmed: {
      name: "Commander Migration Confirmed",
      hint: "Records that this private world is allowed to use Commander Build data models.",
      default: true
    }
  };

  for (const [key, definition] of Object.entries(definitions)) {
    try {
      game.settings.register("ptu", key, {
        ...definition,
        scope: "world",
        config: false,
        type: Boolean
      });
    } catch (error) {
      const message = String(error?.message ?? error ?? "");
      if (!message.includes("already registered")) throw error;
    }
  }
}

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
