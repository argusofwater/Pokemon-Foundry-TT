import { registerCommanderSettings } from "./settings.js";
import { registerCommanderDataModels } from "./data/register.js";
import { collectCommanderMigrationReport, migrateCommanderActors } from "./migration/runner.js";

export const CommanderHooks = {
  listen() {
    Hooks.once("init", () => {
      registerCommanderSettings();
      const enabled = game.settings.get("ptu", "commanderEnabled");
      const confirmed = game.settings.get("ptu", "commanderMigrationConfirmed");
      if (enabled && confirmed) registerCommanderDataModels();
    });

    Hooks.once("ready", () => {
      game.commander = {
        ...(game.commander ?? {}),
        collectMigrationReport: collectCommanderMigrationReport,
        migrateActors: migrateCommanderActors
      };
    });
  }
};
