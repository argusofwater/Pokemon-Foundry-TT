import { RuleElements } from "../rules/index.js";
import { processGrantDeletions } from "../rules/rule-element/grant-item/helper.js";
import { sluggify } from "../../util/misc.js"
import { GrantItemRuleElement } from "../rules/rule-element/grant-item/rule-element.js";

function coerceRangeList(range) {
    if (typeof range === "string") return range.split(",").map(r => r.trim()).filter(Boolean);
    if (!range || typeof range !== "object") return [];
    const value = Number(range.value ?? 0);
    const unit = String(range.unit ?? "").trim();
    const shape = String(range.shape ?? "").trim();
    const area = Number(range.area ?? 0);
    const parts = [];
    if (unit) parts.push(value ? `${value} ${unit}` : unit);
    if (shape && shape !== "single") parts.push(shape);
    if (area) parts.push(String(area));
    return parts.length ? [parts.join(" ")] : [];
}

class PTUItem extends Item {

    get sourceId() {
        return this.flags?.core?.sourceId ?? undefined;
    }

    get schemaVersion() {
        return Number(this.system.schema?.version) || null;
    }

    get slug() {
        return this.system.slug || sluggify(this.name);
    }

    get grantedBy() {
      const id = this.flags.ptu.grantedBy?.id ?? "";
      return ((id === this.id) ? null : (this.actor?.items.get(id) ?? null));
    }

    get grantedBySameType() {
        return this.grantedBy?.type === this.type;
    }

    get isGranted() {
        return this.flags.ptu.grantedBy ? this.flags.ptu.grantedBy.onDelete != "detach" : false;
    }

    get hasAutomation() {
        return this.rules.length > 0 && this.rules.some((rule) => !rule.ignored);
    }

    get realId() {
        return this.id;
    }

    get rollOptions() {
        return this.flags.ptu?.rollOptions;
    }

    get rollable() {
        return false;
    }

    get usable() {
        return false;
    }

    get range() {
        return coerceRangeList(this.system.range ?? this.system.commanderRange);
    }

    get referenceEffect() {
        return this.system.referenceEffect ?? null;
    }

    get schemaVersion() {
        return Number(this.system.schema?.version) || null;
    }

    get isClass() {
        return this.img.includes("class");
    }

    get enabled() {
        return !!(this.system.enabled ?? true)
    }

    async toggleEnableState(newState = !this.enabled) {
        await this.update({ "system.enabled": newState })
        for (const rule of this.rules) {
            if (rule.ignored || !(rule instanceof GrantItemRuleElement)) continue;
            return this.actor.update({ "system.timestamp": Date.now() })
        }
    }

    /** @override */
    prepareBaseData() {
        this.flags.ptu = foundry.utils.mergeObject({ rulesSelections: {} }, this.flags.ptu ?? {});

        this.flags.ptu = foundry.utils.mergeObject(this.flags.ptu ?? {}, {
            rollOptions: {
                all: {
                    [`item:id:${this._id}`]: true,
                    [`item:slug:${this.slug}`]: true,
                    [`item:type:${this.type}`]: true,
                    [`${this.type}:${this.slug}`]: true
                },
                item: {
                    [`item:id:${this._id}`]: true,
                    [`item:slug:${this.slug}`]: true,
                    [`item:type:${this.type}`]: true,
                    [`${this.type}:${this.slug}`]: true,
                }
            }
        });

        if (this.enabled) {
            this.flags.ptu.rollOptions.all[`item:enabled`] = true;
            this.flags.ptu.rollOptions.item[`item:enabled`] = true;
        }
    }

    /** @override */
    _initialize() {
        this.rules = [];
        super._initialize();
    }

    /** @override */
    async delete(context) {
        if (this.actor) {
            await this.actor.deleteEmbeddedDocuments("Item", [this._id], context);
            return this;
        }
        return super.delete(context);
    }

    /** @override */
    async _buildEmbedHTML(config, options = {}) {
        options = { ...options, _embedDepth: options._embedDepth + 1, relativeTo: this };
        if (!this.system?.effect) return document.createElement("div");
        const {
            secrets = options.secrets,
            documents = options.documents,
            links = options.links,
            rolls = options.rolls,
            embeds = options.embeds
        } = config;
        foundry.utils.mergeObject(options, { secrets, documents, links, rolls, embeds });
        const enrichedPage = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.system.effect, options);
        const container = document.createElement("div");
        container.innerHTML = enrichedPage;
        return container;
    }

    /**
     * Retrieve all roll option from the requested domains. Micro-optimized in an excessively verbose for-loop.
     * @param domains The domains of discourse from which to pull options. Always includes the "all" domain.
     */
    getRollOptions(domains = []) {
        if (!Array.isArray(domains)) domains = [domains];
        const withAll = Array.from(new Set(["all", ...domains]));
        const { rollOptions } = this;
        const toReturn = new Set();

        for (const domain of withAll) {
            for (const [option, value] of Object.entries(rollOptions[domain] ?? {})) {
                if (value) toReturn.add(option);
            }
        }

        return Array.from(toReturn).sort();
    }

    /** @override */
    getRollData() {
        return { actor: this.actor, item: this };
    }

    _updateIcon({ source, update } = { source: undefined, update: false }) {
        source ??= foundry.utils.duplicate(this);

        let required = false;
        source.img ||= `/systems/ptu/static/css/images/icons/${source.type}_icon.png`
        if (source.img == "icons/svg/item-bag.svg" || source.img == "icons/svg/mystery-man.svg") {
            if (source.type == "move") {
                source.img = CONFIG.PTU.data.typeEffectiveness[source.system.type.titleCase()].images.icon;
            }
            else if (source.type == "contestmove") {
                source.img = `/systems/ptu/static/css/images/types2/${source.system.type}IC_Icon.png`;
            }
            else {
                source.img = `/systems/ptu/static/css/images/icons/${source.type}_icon.png`;
            }
            required = true;
        }
        if (update && required) return this.update(source);
        else return source;
    }
}

export { PTUItem }