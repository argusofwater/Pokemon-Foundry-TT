import { registerCommanderSheets } from "../module/commander/sheets/register.js";

function registerSheets() {
    const SheetConfig = foundry.applications.apps.DocumentSheetConfig;

    // Foundry V14 routes all dynamic sheet registration through
    // DocumentSheetConfig rather than the removed collection helpers.
    SheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
    SheetConfig.registerSheet(CONFIG.Actor.documentClass, "ptu", CONFIG.PTU.Actor.sheetClasses.character, { types: ["character"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Actor.documentClass, "ptu", CONFIG.PTU.Actor.sheetClasses.pokemon, { types: ["pokemon"], makeDefault: true });

    SheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.item, { types: ["item", "ability", "capability", "pokeedge", "dexentry", "condition", "reference", "spiritaction"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.move, { types: ["move"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.contestmove, { types: ["contestmove"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.edge, { types: ["edge"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.feat, { types: ["feat"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.effect, { types: ["effect"], makeDefault: true });
    SheetConfig.registerSheet(CONFIG.Item.documentClass, "ptu", CONFIG.PTU.Item.sheetClasses.species, { types: ["species"], makeDefault: true });

    SheetConfig.registerSheet(JournalEntry, "ptu", CONFIG.PTU.Journal.Rulebook.journalClass, {
        types: ["base"],
        label: "PTU.RulebookJournalSheetName",
        makeDefault: false
    });

    SheetConfig.registerSheet(CONFIG.PTU.Token.documentClass, "ptu", CONFIG.PTU.Token.sheetClass, { makeDefault: true });

    const commanderEnabled = game.settings.get("ptu", "commanderEnabled");
    const migrationConfirmed = game.settings.get("ptu", "commanderMigrationConfirmed");
    if (commanderEnabled && migrationConfirmed) registerCommanderSheets();
}

export { registerSheets };
