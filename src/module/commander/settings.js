import { COMMANDER_SCHEMA_VERSION } from "./migration/runner.js";

export function registerCommanderSettings() {
  game.settings.register("ptu", "commanderEnabled", {
    name: "Commander Build Rules",
    hint: "Enable Commander Build data models and sheets after backing up the World and reviewing a migration preview.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register("ptu", "commanderSchemaVersion", {
    name: "Commander Build Schema Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  game.settings.register("ptu", "commanderMigrationConfirmed", {
    name: "Commander Migration Confirmed",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register("ptu", "commanderTargetSchemaVersion", {
    name: "Commander Target Schema Version",
    scope: "world",
    config: false,
    type: Number,
    default: COMMANDER_SCHEMA_VERSION
  });
}
