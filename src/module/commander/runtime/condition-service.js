export class CommanderConditionService {
  static CONDITIONS = [
    { id: "burned", label: "Burned", icon: "icons/svg/fire.svg" },
    { id: "frozen", label: "Frozen", icon: "icons/svg/frozen.svg" },
    { id: "paralyzed", label: "Paralyzed", icon: "icons/svg/lightning.svg" },
    { id: "poisoned", label: "Poisoned", icon: "icons/svg/poison.svg" },
    { id: "asleep", label: "Asleep", icon: "icons/svg/sleep.svg" },
    { id: "confused", label: "Confused", icon: "icons/svg/daze.svg" },
    { id: "restrained", label: "Restrained", icon: "icons/svg/net.svg" },
    { id: "vulnerable", label: "Vulnerable", icon: "icons/svg/downgrade.svg" },
    { id: "fainted", label: "Fainted", icon: "icons/svg/unconscious.svg" }
  ];

  static getDefinition(id) {
    return this.CONDITIONS.find(condition => condition.id === id) ?? null;
  }

  static getConditionEffect(actor, id) {
    return actor?.effects?.find(effect => effect.getFlag("ptu", "commanderCondition") === id) ?? null;
  }

  static hasCondition(actor, id) {
    return Boolean(this.getConditionEffect(actor, id));
  }

  static async add(actor, id) {
    if (!actor?.isOwner && !game.user?.isGM) return ui.notifications.warn("You do not have permission to change conditions.");
    const definition = this.getDefinition(id);
    if (!definition || this.hasCondition(actor, id)) return null;
    const created = await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: definition.label,
      img: definition.icon,
      disabled: false,
      flags: { ptu: { commanderCondition: id } }
    }]);
    return created[0] ?? null;
  }

  static async remove(actor, id) {
    if (!actor?.isOwner && !game.user?.isGM) return ui.notifications.warn("You do not have permission to change conditions.");
    const effect = this.getConditionEffect(actor, id);
    return effect?.delete();
  }

  static async toggle(actor, id) {
    return this.hasCondition(actor, id) ? this.remove(actor, id) : this.add(actor, id);
  }

  static getSheetContext(actor) {
    return this.CONDITIONS.map(definition => ({ ...definition, active: this.hasCondition(actor, definition.id) }));
  }
}
