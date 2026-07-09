import { COMMANDER_SCHEMA_VERSION } from "./migration/runner.js";

function registerSettingOnce(key, data) {
  try {
    game.settings.register("ptu", key, data);
  } catch (error) {
    const message = String(error?.message ?? error ?? "");
    if (!message.includes("already registered")) throw error;
  }
}

export function registerCommanderSettings() {
  registerSettingOnce("commanderEnabled", {
    name: "Commander Build Rules",
    hint: "Enable Commander Build data models and sheets after backing up the World and reviewing a migration preview.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true
  });

  registerSettingOnce("commanderSchemaVersion", {
    name: "Commander Build Schema Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  registerSettingOnce("commanderMigrationConfirmed", {
    name: "Commander Migration Confirmed",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  registerSettingOnce("commanderTargetSchemaVersion", {
    name: "Commander Target Schema Version",
    scope: "world",
    config: false,
    type: Number,
    default: COMMANDER_SCHEMA_VERSION
  });
}
