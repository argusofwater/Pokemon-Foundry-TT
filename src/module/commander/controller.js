import { collectCommanderMigrationReport, migrateCommanderActors } from "./migration/runner.js";

function requireGm() {
  if (!game.user?.isGM) throw new Error("Commander Build controls require a GM user.");
}

function getCommanderSetting(key, fallback = false) {
  try {
    return game.settings.get("ptu", key);
  } catch (error) {
    console.warn(`Commander setting '${key}' was unavailable; using ${fallback}.`, error);
    return fallback;
  }
}

export function createCommanderController() {
  return {
    get enabled() {
      return getCommanderSetting("commanderEnabled", false);
    },

    get confirmed() {
      return getCommanderSetting("commanderMigrationConfirmed", false);
    },

    preview() {
      requireGm();
      const report = collectCommanderMigrationReport();
      console.group("Commander Build migration preview");
      console.table(report.map(entry => ({
        actor: entry.actorName,
        type: entry.actorType,
        from: entry.currentSchemaVersion,
        to: entry.targetSchemaVersion
      })));
      console.groupEnd();
      ui.notifications.info(`Commander Build migration preview found ${report.length} actor(s).`);
      return report;
    },

    async confirm() {
      requireGm();
      await game.settings.set("ptu", "commanderMigrationConfirmed", true);
      ui.notifications.info("Commander Build migration confirmation recorded.");
      return true;
    },

    async migrate() {
      requireGm();
      if (!this.confirmed) throw new Error("Run game.commander.confirm() before applying migration.");
      return migrateCommanderActors({ dryRun: false });
    },

    async enable() {
      requireGm();
      if (!this.confirmed) throw new Error("Migration confirmation is required before enabling Commander Build.");
      const pending = collectCommanderMigrationReport();
      if (pending.length) throw new Error(`Migrate all ${pending.length} pending actor(s) before enabling Commander Build.`);
      await game.settings.set("ptu", "commanderEnabled", true);
      ui.notifications.info("Commander Build enabled. Reload the World to activate Commander models and sheets.");
      return true;
    },

    async disable() {
      requireGm();
      await game.settings.set("ptu", "commanderEnabled", false);
      ui.notifications.info("Commander Build disabled. Reload the World to return to legacy sheets.");
      return true;
    }
  };
}
