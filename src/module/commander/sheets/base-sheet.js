export class CommanderActorSheetBase extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["ptu", "commander-sheet"],
    position: { width: 900, height: 760 },
    form: { closeOnSubmit: false, submitOnChange: true },
    actions: {
      toggleMode: CommanderActorSheetBase.toggleMode,
      changeTab: CommanderActorSheetBase.changeTab
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;
    return {
      ...context,
      actor: this.actor,
      system,
      editable: this.isEditable,
      mode: system.ui?.mode ?? "play",
      activeTab: system.ui?.activeTab ?? "overview",
      effects: this.actor.effects?.contents ?? []
    };
  }

  static async toggleMode(event, target) {
    const app = target.closest(".application")?.application ?? this;
    const current = app.actor.system.ui?.mode ?? "play";
    await app.actor.update({ "system.ui.mode": current === "play" ? "edit" : "play" });
  }

  static async changeTab(event, target) {
    const app = target.closest(".application")?.application ?? this;
    const tab = target.dataset.tab;
    if (!tab) return;
    await app.actor.update({ "system.ui.activeTab": tab });
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (!data?.type) return super._onDrop(event);

    if (data.type === "Item") return this._onDropItem(event, data);
    if (data.type === "Actor") return this._onDropActor(event, data);
    return super._onDrop(event);
  }

  async _onDropItem(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    return Item.create(item.toObject(), { parent: this.actor });
  }

  async _onDropActor(event, data) {
    return super._onDrop(event);
  }
}
