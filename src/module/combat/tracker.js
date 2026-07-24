import { PTUCombatant } from "./combatant.js";
import { CommanderActionTracker } from "../commander/runtime/action-tracker.js";
import { CommanderCombatService } from "../commander/runtime/combat-service.js";

class PTUCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            toggleActed: PTUCombatTracker.#onCombatantControl,
            spendCommanderAction: PTUCombatTracker.#onCombatantControl,
            restoreCommanderAction: PTUCombatTracker.#onCombatantControl,
            resetCommanderActions: PTUCombatTracker.#onCombatantControl,
        }
    };

    /** @override */
    static PARTS = {
        header: {
            template: "systems/ptu/static/templates/sidebar/combat-tracker/header.hbs",
        },
        tracker: {
            template: "systems/ptu/static/templates/sidebar/combat-tracker/tracker.hbs",
        },
        footer: super.PARTS.footer,
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch ( partId ) {
        case "header": await this._prepareHeaderContext(context, options); break;
        }
        return context;
    }

    /**
     * Prepares the context for the header part of the combat tracker.
     * @param {*} context
     * @param {*} options
     * @returns
     */
    async _prepareHeaderContext(context, options) {
        context.expBudget = context.combat?.expBudget;
        return context;
    }

    /** @override */
    async _prepareTurnContext(combat, combatant, index) {
        const turn = await super._prepareTurnContext(combat, combatant, index);
        turn.hasActed = combatant?.hasActed ?? false;
        return turn;
    }

    static #onCombatantControl(...args) {
        return this._onCombatantControl(...args);
    }

    async _onCombatantControl(event, target) {
        const { combatantId } = target.closest("[data-combatant-id]")?.dataset ?? {};
        const combat = this.viewed;
        const combatant = combat?.combatants.get(combatantId);
        if ( !combatant ) return;

        switch (target.dataset.action) {
            case "toggleHidden": return combatant.toggleVisibility();
            case "toggleDefeated": return this._onToggleDefeatedStatus(combatant);
            case "rollInitiative": return combat.rollInitiative([combatant.id]);
            case "pingCombatant": return this._onPingCombatant(combatant);
            case "toggleActed": return combatant.toggleActed({multi: event.shiftKey});
            case "spendCommanderAction": return this._changeCommanderAction(combatant, target.dataset.actionType, "spend");
            case "restoreCommanderAction": return this._changeCommanderAction(combatant, target.dataset.actionType, "restore");
            case "resetCommanderActions": return this._resetCommanderActions(combatant);
        }
    }

    async _changeCommanderAction(combatant, type, mode) {
        const actor = combatant.actor;
        if (!CommanderCombatService.isCommanderActor(actor)) return;
        if (!actor.isOwner && !game.user.isGM) return ui.notifications.warn("You do not have permission to change this combatant's actions.");

        if (mode === "spend") await CommanderActionTracker.spend(actor, type);
        else await CommanderActionTracker.restore(actor, type);

        return this.render({ parts: ["tracker"] });
    }

    async _resetCommanderActions(combatant) {
        const actor = combatant.actor;
        if (!CommanderCombatService.isCommanderActor(actor)) return;
        if (!actor.isOwner && !game.user.isGM) return ui.notifications.warn("You do not have permission to reset this combatant's actions.");
        await CommanderActionTracker.reset(actor);
        return this.render({ parts: ["tracker"] });
    }

    /** @override */
    async _onToggleDefeatedStatus(combatant) {
        return combatant.toggleDefeated();
    }
}
export { PTUCombatTracker }
