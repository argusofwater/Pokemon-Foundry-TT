import { CommanderActionTracker } from "../runtime/action-tracker.js";
import { CommanderRollService } from "../runtime/roll-service.js";
import { CommanderConditionService } from "../runtime/condition-service.js";

function resolveApplication(target, fallback) {
  return target?.closest?.(".application")?.application ?? fallback;
}

export class CommanderActorSheetBase extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["ptu", "commander-sheet"],
    position: { width: 900, height: 760 },
    form: { closeOnSubmit: false, submitOnChange: true },
    actions: {
      toggleMode: CommanderActorSheetBase.toggleMode,
      changeTab: CommanderActorSheetBase.changeTab,
      spendAction: CommanderActorSheetBase.spendAction,
      restoreAction: CommanderActorSheetBase.restoreAction,
      resetActions: CommanderActorSheetBase.resetActions,
      rollCheck: CommanderActorSheetBase.rollCheck,
      openDocument: CommanderActorSheetBase.openDocument,
      deleteEmbedded: CommanderActorSheetBase.deleteEmbedded,
      toggleCondition: CommanderActorSheetBase.toggleCondition,
      removeEffect: CommanderActorSheetBase.removeEffect
    }
  };

  _commanderActiveTab = null;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;
    return {
      ...context,
      actor: this.actor,
      system,
      editable: this.isEditable,
      mode: system.ui?.mode ?? "play",
      activeTab: this._commanderActiveTab ?? system.ui?.activeTab ?? "overview",
      effects: this.actor.effects?.contents ?? [],
      commanderConditions: CommanderConditionService.getSheetContext(this.actor),
      actions: system.actions ?? {},
      isGM: Boolean(game.user?.isGM)
    };
  }

  static async toggleMode(event, target) {
    const app = resolveApplication(target, this);
    const current = app.actor.system.ui?.mode ?? "play";
    await app.actor.update({ "system.ui.mode": current === "play" ? "edit" : "play" });
  }

  static async changeTab(event, target) {
    const app = resolveApplication(target, this);
    const tab = target.dataset.tab;
    if (!tab) return;
    const parts = app.constructor.PARTS ?? {};
    if (!parts[tab]) return ui.notifications.info(`${target.textContent?.trim() || tab} is not implemented yet.`);
    app._commanderActiveTab = tab;
    return app.render({ parts: ["navigation", tab] });
  }

  static async spendAction(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    return CommanderActionTracker.spend(app.actor, target.dataset.actionType);
  }

  static async restoreAction(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    return CommanderActionTracker.restore(app.actor, target.dataset.actionType);
  }

  static async resetActions(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    return CommanderActionTracker.reset(app.actor);
  }

  static async rollCheck(event, target) {
    const app = resolveApplication(target, this);
    const modifier = Number(target.dataset.modifier ?? 0);
    const targetNumber = target.dataset.target ? Number(target.dataset.target) : null;
    return CommanderRollService.rollCheck({
      actor: app.actor,
      label: target.dataset.label ?? "Commander Check",
      modifier,
      target: targetNumber,
      favored: target.dataset.favored === "true",
      hindered: target.dataset.hindered === "true"
    });
  }

  static async openDocument(event, target) {
    const app = resolveApplication(target, this);
    const document = target.dataset.uuid
      ? await fromUuid(target.dataset.uuid)
      : app.actor.items.get(target.dataset.itemId);
    return document?.sheet?.render(true);
  }

  static async deleteEmbedded(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Delete ${item.name}?` },
      content: `<p>Remove <strong>${item.name}</strong> from ${app.actor.name}?</p>`
    });
    if (confirmed) return item.delete();
  }

  static async toggleCondition(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    await CommanderConditionService.toggle(app.actor, target.dataset.conditionId);
    return app.render({ parts: ["effects"] });
  }

  static async removeEffect(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    const effect = app.actor.effects.get(target.dataset.effectId);
    if (effect) await effect.delete();
    return app.render({ parts: ["effects"] });
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
