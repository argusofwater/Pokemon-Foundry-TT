export class CommanderFriendshipService {
  static FLAG_SCOPE = "ptu";
  static FLAG_KEY = "commanderFriendship";

  static getState(actor) {
    const stored = actor?.getFlag?.(this.FLAG_SCOPE, this.FLAG_KEY) ?? {};
    const value = Math.max(0, Math.min(255, Number(stored.value ?? 0)));
    return {
      value,
      heldOnUsed: Boolean(stored.heldOnUsed),
      tier: this.getTier(value),
      canUseResolve: value >= 180 && !stored.heldOnUsed,
      percent: Math.round((value / 255) * 100)
    };
  }

  static getTier(value) {
    if (value >= 220) return "Inseparable";
    if (value >= 180) return "Devoted";
    if (value >= 150) return "Bonded";
    if (value >= 100) return "Trusting";
    if (value >= 50) return "Familiar";
    return "Distant";
  }

  static async setValue(actor, value) {
    if (!game.user?.isGM) return ui.notifications.warn("Only the GM can change Friendship.");
    const current = this.getState(actor);
    return actor.setFlag(this.FLAG_SCOPE, this.FLAG_KEY, {
      value: Math.max(0, Math.min(255, Number(value) || 0)),
      heldOnUsed: current.heldOnUsed
    });
  }

  static async resetResolve(actor) {
    if (!game.user?.isGM) return ui.notifications.warn("Only the GM can reset Friendship effects.");
    const current = this.getState(actor);
    return actor.setFlag(this.FLAG_SCOPE, this.FLAG_KEY, { value: current.value, heldOnUsed: false });
  }

  static async useResolve(actor) {
    if (!game.user?.isGM) return false;
    const current = this.getState(actor);
    await actor.setFlag(this.FLAG_SCOPE, this.FLAG_KEY, { value: current.value, heldOnUsed: true });
    return true;
  }

  static async confirmResolve(actor) {
    if (!game.user?.isGM) return false;
    const state = this.getState(actor);
    if (!state.canUseResolve) return false;
    return foundry.applications.api.DialogV2.confirm({
      window: { title: `${actor.name} may endure` },
      content: `<p><strong>${actor.name}</strong> has ${state.value} Friendship (${state.tier}). Let it remain at 1 HP?</p>`
    });
  }
}
