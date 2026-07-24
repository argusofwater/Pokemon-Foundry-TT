import { createCommanderActorUpdate, diffCommanderMigration } from "./legacy-adapter.js";

export const COMMANDER_SCHEMA_VERSION = 1;

function isGameMaster() {
  return Boolean(game.user?.isGM);
}

function actorNeedsMigration(actor) {
  if (!actor || !["character", "pokemon"].includes(actor.type)) return false;
  const version = Number(actor.system?.schema?.version ?? 0);
  return version < COMMANDER_SCHEMA_VERSION;
}

export function collectCommanderMigrationReport() {
  const actors = game.actors?.contents ?? [];
  const report = [];

  for (const actor of actors) {
    if (!actorNeedsMigration(actor)) continue;
    const source = actor.toObject(false);
    report.push({
      actorId: actor.id,
      actorName: actor.name,
      actorType: actor.type,
      currentSchemaVersion: Number(actor.system?.schema?.version ?? 0),
      targetSchemaVersion: COMMANDER_SCHEMA_VERSION,
      diff: diffCommanderMigration(source)
    });
  }

  return report;
}

export async function migrateCommanderActors({ dryRun = true } = {}) {
  if (!isGameMaster()) throw new Error("Only a GM can run Commander Build migrations.");

  const actors = (game.actors?.contents ?? []).filter(actorNeedsMigration);
  const report = actors.map(actor => ({
    actorId: actor.id,
    actorName: actor.name,
    actorType: actor.type,
    update: createCommanderActorUpdate(actor.toObject(false))
  }));

  if (dryRun) {
    console.group("Commander Build | Actor migration dry run");
    console.table(report.map(entry => ({
      id: entry.actorId,
      name: entry.actorName,
      type: entry.actorType,
      targetVersion: COMMANDER_SCHEMA_VERSION
    })));
    console.groupEnd();
    return { dryRun: true, migrated: 0, candidates: report.length, report };
  }

  if (!report.length) return { dryRun: false, migrated: 0, candidates: 0, report: [] };

  ui.notifications.warn(
    "Commander Build migration is modifying actor data. Confirm that this World has been backed up before continuing."
  );

  const updates = report.map(entry => entry.update).filter(Boolean);
  const migrated = await Actor.updateDocuments(updates, { diff: false, recursive: false });

  await game.settings.set("ptu", "commanderSchemaVersion", COMMANDER_SCHEMA_VERSION);
  console.info(`Commander Build | Migrated ${migrated.length} actor(s) to schema ${COMMANDER_SCHEMA_VERSION}.`);

  return {
    dryRun: false,
    migrated: migrated.length,
    candidates: report.length,
    report
  };
}

export async function restoreLegacyActorSystem(actor) {
  if (!isGameMaster()) throw new Error("Only a GM can restore a Commander Build legacy backup.");
  const backup = actor.getFlag("ptu", "commanderLegacyBackup");
  if (!backup) throw new Error(`Actor ${actor.name} has no Commander Build legacy backup.`);

  await actor.update({ system: foundry.utils.deepClone(backup) }, { diff: false, recursive: false });
  return actor;
}
