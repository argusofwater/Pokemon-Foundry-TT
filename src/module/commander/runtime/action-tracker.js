export class CommanderActionTracker {
  static async reset(actor) {
    return actor.update({
      "system.actions.mainUsed": false,
      "system.actions.moveUsed": false,
      "system.actions.reactionUsed": false,
      "system.actions.sharedMainRemaining": 2,
      "system.actions.sharedMoveRemaining": 2
    });
  }

  static async spend(actor, type) {
    const actions = actor.system.actions ?? {};
    const updates = {};

    if (type === "main") {
      if (actions.mainUsed || actions.sharedMainRemaining <= 0) return ui.notifications.warn("No Main Action remains for this actor.");
      updates["system.actions.mainUsed"] = true;
      updates["system.actions.sharedMainRemaining"] = Math.max(0, Number(actions.sharedMainRemaining ?? 0) - 1);
    } else if (type === "move") {
      if (actions.moveUsed || actions.sharedMoveRemaining <= 0) return ui.notifications.warn("No Move Action remains for this actor.");
      updates["system.actions.moveUsed"] = true;
      updates["system.actions.sharedMoveRemaining"] = Math.max(0, Number(actions.sharedMoveRemaining ?? 0) - 1);
    } else if (type === "reaction") {
      if (actions.reactionUsed) return ui.notifications.warn("This actor's Reaction has already been used.");
      updates["system.actions.reactionUsed"] = true;
    } else return;

    return actor.update(updates);
  }

  static async restore(actor, type) {
    const actions = actor.system.actions ?? {};
    const updates = {};

    if (type === "main") {
      updates["system.actions.mainUsed"] = false;
      updates["system.actions.sharedMainRemaining"] = Math.min(2, Number(actions.sharedMainRemaining ?? 0) + 1);
    } else if (type === "move") {
      updates["system.actions.moveUsed"] = false;
      updates["system.actions.sharedMoveRemaining"] = Math.min(2, Number(actions.sharedMoveRemaining ?? 0) + 1);
    } else if (type === "reaction") updates["system.actions.reactionUsed"] = false;
    else return;

    return actor.update(updates);
  }
}
