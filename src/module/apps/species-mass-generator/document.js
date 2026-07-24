import { findItemInCompendium, querySpeciesCompendium } from "../../../util/misc.js"

export class SpeciesGeneratorData {
    constructor() {
        this.speciesTab = "species";
        this.amount = 20;
        this.species = undefined;
        this.speciesField = {
            value: "",
            updated: false
        };
        this.table = undefined;
        this.tableSelect = {
            value: "",
            updated: false,
            options: game.tables.map(t => ({ label: t.name, uuid: t.uuid }))
        }
        this.folder = undefined;
        this.folderField = {
            value: "",
            updated: false,
        }
        this.level = {
            min: game.settings.get("ptu", "generation.defaultDexDragInLevelMin") ?? 0,
            max: game.settings.get("ptu", "generation.defaultDexDragInLevelMax") ?? 0
        }
        this.helpText = {
            species: undefined,
            table: undefined,
            folder: undefined
        }
    }

    async refresh() {
        if (this.speciesField.updated) {
            if (this.speciesField.value?.includes?.("Item.")) {
                this.species = await fromUuid(this.speciesField.value);
            }
            else if (!isNaN(Number(this.speciesField.value)) && String(this.speciesField.value).trim() !== "") {
                this.species = (await querySpeciesCompendium((species) => Number(species.system.number ?? species.system.nationalDex) == Number(this.speciesField.value))).find(s => !s.system.form && !s.system.formSlug);
            }
            else if (String(this.speciesField.value ?? "").trim()) {
                this.species = await (async () => {
                    const compendiums = Object.entries(game.settings.get("ptu", "compendiumBrowserPacks")?.species ?? { "ptu.species": { load: true } }).filter(([k, v]) => v.load).map(([k, v]) => k);
                    for (const compendium of compendiums) {
                        const result = await findItemInCompendium({ type: "species", name: this.speciesField.value, compendium });
                        if (result) return result;
                    }
                })()
            }
            else this.species = undefined;
            this.speciesField.updated = false;
        }
        if (this.tableSelect.updated) {
            if (!this.tableSelect.value) this.table = undefined;
            else if (!isNaN(Number(this.tableSelect.value))) {
                this.table = game.tables.get(this.tableSelect.value);
            }
            else if (this.tableSelect.value.includes("RollTable.")) {
                this.table = await fromUuid(this.tableSelect.value);
            }
            this.tableSelect.updated = false;
        }
        if (this.folderField.updated) {
            if (this.folderField.value?.includes?.("Folder.")) {
                const result = await fromUuid(this.folderField.value);
                this.folder = result ? result.type == "Actor" ? result : "invalid" : undefined;
            }
            else if (!isNaN(Number(this.folderField.value)) && String(this.folderField.value).trim() !== "") {
                const result = game.folders.get(this.folderField.value);
                this.folder = result ? result.type == "Actor" ? result : "invalid" : undefined;
            }
            else if (String(this.folderField.value ?? "").trim()) {
                this.folder = game.folders.find(f => f.name == this.folderField.value && f.type == "Actor");
            }
            else this.folder = undefined;
            this.folderField.updated = false;
        }

        this.tableSelect.options = game.tables.map(t => ({ label: t.name, uuid: t.uuid }));

        this.helpText.species = undefined;
        this.helpText.table = undefined;
        this.helpText.folder = undefined;

        if (this.species) {
            this.helpText.species = `<span>${game.i18n.localize("PTU.MassGenerator.FoundSpecies")} <span class="linked-item">@UUID[${this.species.uuid}]</span></span>`
        }
        else if (this.speciesField.value) {
            this.helpText.species = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindSpecies", { species: this.speciesField.value })}</span>`
        }

        if (this.table) {
            this.helpText.table = `<span>${game.i18n.localize("PTU.MassGenerator.FoundTable")} <span class="linked-item">@UUID[${this.table.uuid}]</span></span>`
        }
        else if (this.speciesTab == "table" && this.tableSelect.value) {
            this.helpText.table = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindTable", { table: this.tableSelect.value })}</span>`
        }
        else if (this.speciesTab == "table" && !this.tableSelect.options?.length) {
            this.helpText.table = `<span>No roll tables are currently loaded. Create or import a roll table, or use the Species tab.</span>`
        }

        if (this.folder == "invalid") {
            this.helpText.folder = `<span>${game.i18n.localize("PTU.MassGenerator.InvalidFolder")}</span>`
        }
        else if (this.folder) {
            this.helpText.folder = `<span>${game.i18n.localize("PTU.MassGenerator.FoundFolder")} <span class="linked-item">@UUID[${this.folder.uuid}]</span></span>`
        }
        else if (this.folderField.value) {
            this.helpText.folder = `<span>${game.i18n.format("PTU.MassGenerator.CouldNotFindFolder", { folder: this.folderField.value })}</span>`
        }
    }

    async finalize() {
        const data = {
            folder: this.folder ?? this.folderField.value,
            level: this.level,
            amount: this.amount,
        }

        if (this.speciesTab == "species") {
            data.species = this.species;
        }
        else {
            data.table = this.table;
        }

        return data;
    }
}