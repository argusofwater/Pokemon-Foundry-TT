export class CommanderActionTracker {
  static async getLinkedActors(actor) {
    let trainer = actor.type === "character" ? actor : null;
    let pokemon = actor.type === "pokemon" ? actor : null;

    if (actor.type === "pokemon" && actor.system.identity?.trainerUuid) trainer = await fromUuid(actor.system.identity.trainerUuid);
    if (actor.type === "character" && actor.system.team?.activePokemonUuid) pokemon = await fromUuid(actor.system.team.activePokemonUuid);

    return { trainer, pokemon };
  }

  static async updateLinked(actor, actorUpdates, sharedUpdates = {}) {
    const { trainer, pokemon } = await this.getLinkedActors(actor);
    const operations = [actor.update({ ...actorUpdates, ...sharedUpdates })];
    if (trainer && trainer !== actor) operations.push(trainer.update(sharedUpdates));
    if (pokemon && pokemon !== actor) operations.push(pokemon.update(sharedUpdates));
    return Promise.all(operations);
  }

  static async reset(actor) {
    const reset = {
      "system.actions.mainUsed": false,
      "system.actions.moveUsed": false,
      "system.actions.reactionUsed": false,
      "system.actions.sharedMainRemaining": 2,
      "system.actions.sharedMoveRemaining": 2
    };
    const { trainer, pokemon } = await this.getLinkedActors(actor);
    const targets = [...new Set([actor, trainer, pokemon].filter(Boolean))];
    return Promise.all(targets.map(target => target.update(reset)));
  }

  static async spend(actor, type) {
    const actions = actor.system.actions ?? {};
    const actorUpdates = {};
    const sharedUpdates = {};

    if (type === "main") {
      if (actions.mainUsed || actions.sharedMainRemaining <= 0) return ui.notifications.warn("No Main Action remains for this actor.");
      actorUpdates["system.actions.mainUsed"] = true;
      sharedUpdates["system.actions.sharedMainRemaining"] = Math.max(0, Number(actions.sharedMainRemaining ?? 0) - 1);
    } else if (type === "move") {
      if (actions.moveUsed || actions.sharedMoveRemaining <= 0) return ui.notifications.warn("No Move Action remains for this actor.");
      actorUpdates["system.actions.moveUsed"] = true;
      sharedUpdates["system.actions.sharedMoveRemaining"] = Math.max(0, Number(actions.sharedMoveRemaining ?? 0) - 1);
    } else if (type === "reaction") {
      if (actions.reactionUsed) return ui.notifications.warn("This actor's Reaction has already been used.");
      actorUpdates["system.actions.reactionUsed"] = true;
    } else return;

    return this.updateLinked(actor, actorUpdates, sharedUpdates);
  }

  static async restore(actor, type) {
    const actions = actor.system.actions ?? {};
    const actorUpdates = {};
    const sharedUpdates = {};

    if (type === "main") {
      actorUpdates["system.actions.mainUsed"] = false;
      sharedUpdates["system.actions.sharedMainRemaining"] = Math.min(2, Number(actions.sharedMainRemaining ?? 0) + 1);
    } else if (type === "move") {
      actorUpdates["system.actions.moveUsed"] = false;
      sharedUpdates["system.actions.sharedMoveRemaining"] = Math.min(2, Number(actions.sharedMoveRemaining ?? 0) + 1);
    } else if (type === "reaction") actorUpdates["system.actions.reactionUsed"] = false;
    else return;

    return this.updateLinked(actor, actorUpdates, sharedUpdates);
  }
}
