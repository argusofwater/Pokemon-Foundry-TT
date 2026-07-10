import { PTUCONFIG } from "../config/index.js"
import { GamePTU } from "../game-ptu.js"
import { registerSettings } from "../../module/system/index.js"
import { registerCommanderSettings } from "../../module/commander/settings.js"
import { createCommanderController } from "../../module/commander/controller.js"
import { registerCommanderDataModels } from "../../module/commander/data/register.js"
import { registerHandlebarsHelpers } from "../handlebars.js"
import { registerSheets } from "../sheets.js"
import { registerTemplates } from "../templates.js"
import { insurgenceData, sageData, uraniumData } from "../config/data/fangame-species-data.js"
import { measureDistances } from "../../module/canvas/helpers.js"
import { registerCommanderRuntimeHooks } from "../../module/commander/runtime/hooks.js"

function commanderSetting(key, fallback = true) {
    try {
        return game.settings.get("ptu", key);
    } catch (error) {
        console.warn(`Commander setting '${key}' was unavailable during PTU init; using ${fallback}.`, error);
        return fallback;
    }
}

function initializeCommanderBuild() {
    registerCommanderSettings();
    game.commander ??= createCommanderController();
    if (commanderSetting("commanderEnabled", true) && commanderSetting("commanderMigrationConfirmed", true)) {
        registerCommanderDataModels();
    }
}

export const Init = {
    listen() {
        Hooks.on("init", () => {
            console.log("PTU System | Initializing Pokemon Tabletop Reunited System")

            window.actor = function () {
                return canvas.tokens.controlled[0].actor;
            }

            CONFIG.PTU = PTUCONFIG
            CONFIG.PTU.STATS_FACTOR = 0.5;
            CONFIG.PTU.STATS_SIGMA = 3.5;

            CONFIG.User.documentClass = PTUCONFIG.User.documentClass;

            CONFIG.Combat.initiative = PTUCONFIG.combat.initiative;
            CONFIG.Combat.documentClass = PTUCONFIG.combat.documentClass;
            CONFIG.Combat.defeatedStatusId = PTUCONFIG.combat.defeatedStatusId;
            CONFIG.Combatant.documentClass = PTUCONFIG.combatant.documentClass;
            CONFIG.ui.combat = PTUCONFIG.combat.uiClass;

            PTUCONFIG.combat.sheetClass.registerHooks();

            CONFIG.Actor.documentClass = PTUCONFIG.Actor.proxy;
            CONFIG.Item.documentClass = PTUCONFIG.Item.proxy;

            CONFIG.ActiveEffect.documentClass = PTUCONFIG.ActiveEffect.documentClass

            CONFIG.statusEffects = PTUCONFIG.statusEffects;

            CONFIG.Token.objectClass = PTUCONFIG.Token.objectClass;
            CONFIG.Token.documentClass = PTUCONFIG.Token.documentClass;

            CONFIG.Dice.rolls ??= []
            CONFIG.Dice.rolls.push(...PTUCONFIG.Dice.rolls);

            CONFIG.ui.chat = PTUCONFIG.ui.chatlog.documentClass;
            CONFIG.ChatMessage.documentClass = PTUCONFIG.ChatMessage.documentClass;

            CONFIG.ui.hotbar = PTUCONFIG.ui.hotbar.documentClass;

            if (document.querySelector("#ui-right") !== null) {
                const uiRight = document.querySelector("#ui-right");
                const template = document.createElement("template");
                template.setAttribute("id", "ptu-token-panel");
                uiRight?.insertAdjacentElement("afterbegin", template);
            }

            registerSettings();
            initializeCommanderBuild();
            registerSheets();
            registerCommanderRuntimeHooks();
            registerHandlebarsHelpers();
            registerTemplates();

            if(game.settings.get("ptu", "devMode")) CONFIG.ui.items.prototype._onDragStart = _onDragStart;

            GamePTU.onInit();
        })
        Hooks.on("canvasInit", function () {
            foundry.grid.SquareGrid.prototype.measureDistances = measureDistances;
        });
    }
}

/** @override */
function _onDragStart(event) {
    if ( ui.context ) ui.context.close({animate: false});
    const li = event.currentTarget.closest(".directory-item");
    const item = game.items.get(li.dataset.entryId);
    if ( !item ) return;
    const dragData = {
        type: item.documentName,
        data: item.toObject()
    }
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
}
