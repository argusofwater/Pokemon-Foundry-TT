import { sluggify } from '../../../util/misc.js';
import { PTUCondition, PTUItem } from '../index.js';

function coerceText(value, fallback = '') {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function coerceRangeList(range, commanderRange) {
    if (typeof range === 'string') return range.split(',').map(r => r.trim()).filter(Boolean);
    const source = range && typeof range === 'object' ? range : commanderRange;
    if (!source || typeof source !== 'object') return [];
    const value = Number(source.value ?? 0);
    const unit = coerceText(source.unit, '').trim();
    const shape = coerceText(source.shape, '').trim();
    const area = Number(source.area ?? 0);
    const parts = [];
    if (unit) parts.push(value ? `${value} ${unit}` : unit);
    if (shape && shape !== 'single') parts.push(shape);
    if (area) parts.push(String(area));
    return parts.length ? [parts.join(' ')] : [];
}

function coerceKeywords(keywords) {
    if (Array.isArray(keywords)) return keywords;
    if (typeof keywords === 'string') return keywords.split(',').map(k => k.trim()).filter(Boolean);
    return [];
}

class PTUMove extends PTUItem {
    get rollable() {
        return !(isNaN(Number(this.system.ac ?? undefined)) && isNaN(Number(this.system.damageBase ?? undefined)));
    }

    get usable() {
        return !this.rollable && this.system.frequency !== "Static";
    }

    /** @override */
    get rollOptions() {
        const options = super.rollOptions;
        if(this.isDamaging && this.damageBase.isStab) {
            options.all['move:is-stab'] = true;
            options.item['move:is-stab'] = true;
        }
        if (this.isDamaging && this.damageBase.isStab && !!options.all[`move:damage-base:${this.damageBase.preStab}`]) {
            delete this.flags.ptu.rollOptions.all[`move:damage-base:${this.damageBase.preStab}`];
            delete this.flags.ptu.rollOptions.item[`move:damage-base:${this.damageBase.preStab}`];

            this.flags.ptu.rollOptions.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            this.flags.ptu.rollOptions.item[`move:damage-base:${this.damageBase.postStab}`] = true;

            options.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            options.item[`move:damage-base:${this.damageBase.postStab}`] = true;
        }
        for(const keyword of coerceKeywords(this.system.keywords ?? this.system.tags)) {
            const slug = sluggify(coerceText(keyword));
            if (!slug) continue;
            options.all[`move:${slug}`] = true;
            options.item[`move:${slug}`] = true;
        }
        return options;
    }

    /** @override */
    get realId() {
        return this.system.isStruggle
            ? `struggle-${coerceText(this.system.type, 'normal').toLocaleLowerCase(game.i18n.lang)}-${coerceText(this.system.category, 'status').toLocaleLowerCase(game.i18n.lang)}${this.system.isRangedStruggle ? "-ranged" : ""}`
            : super.realId;
    }

    get isDamaging() {
        return !isNaN(Number(this.system.damageBase ?? undefined));
    }

    get isFiveStrike() {
        return (!!this.rollOptions.item["move:range:five-strike"]) || (!!this.rollOptions.item["move:five-strike"]);
    }

    get damageBase() {
        if (!this.isDamaging) return null;
        const result = {
            preStab: isNaN(Number(this.system.damageBase)) ? 0 : Number(this.system.damageBase),
            postStab: 0,
            isStab: false,
        }
        result.postStab = result.preStab + (!this.system.isStruggle && this.actor?.types.includes(this.system.type) ? 2 : 0);
        result.isStab = result.preStab !== result.postStab;
        return result;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        const typeSlug = sluggify(coerceText(this.system.type, 'normal'));
        const categorySlug = sluggify(coerceText(this.system.category, 'status'));
        const frequencySlug = sluggify(coerceText(this.system.frequency, 'at-will'));
        const rollOptions = {
            all: {
                [`move:type:${typeSlug}`]: true,
                [`move:category:${categorySlug}`]: true,
                [`move:frequency:${frequencySlug}`]: true,
            },
        }

        const ranges = coerceRangeList(this.system.range, this.system.commanderRange);
        for (const range of ranges) {
            const slug = sluggify(coerceText(range));
            if (slug) rollOptions.all[`move:range:${slug}`] = true;
        }

        if (this.isDamaging) {
            rollOptions.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            rollOptions.all[`move:damage-base:pre-stab:${this.damageBase.preStab}`] = true;
        }
        if (!isNaN(Number(this.system.ac))) rollOptions.all[`move:ac:${this.system.ac}`] = true;
        rollOptions.item = rollOptions.all;

        this.flags.ptu = foundry.utils.mergeObject(this.flags.ptu, {rollOptions});
        this.flags.ptu.rollOptions.attack = Object.keys(this.flags.ptu.rollOptions.all).reduce((obj, key) => {
            obj[key.replace("move:", "attack:").replace("item:", "attack:")] = true;
            return obj;
        }, {});
    }

    /** @override */
    async use(options = {}) {
        if (this.isDamaging || this.system.frequency === "Static") return;

        let didSomething = false;
        const conditions = new Set(this.actor.getFilteredRollOptions("condition"))
        if (conditions.has("condition:confused")) {
            await PTUCondition.HandleConfusion(this, this.actor);
            didSomething = true;
        }

        if (this.referenceEffect) {
            const results = [];
            const effect = await fromUuid(this.referenceEffect);
            if (this.range.includes("Self")) {
                const result = await effect.apply([this.actor], this.actor);
                if (result) results.push(...result);
            }
            else {
                const targets = options.targets || [...game.user.targets] || canvas.tokens.controlled;
                const result = await effect.apply(targets, this.actor);
                if (result) results.push(...result);
            }

            if (results.length > 0) {
                const statements = results.map((effect) =>
                    game.i18n.format("PTU.Broadcast.ApplyEffect", { actor: effect.actor.link, effect: effect.link, source: this.actor.link })
                );
                await ChatMessage.create({ content: statements.join("<br>") });
            }
        }
        return didSomething;
    }
}

export { PTUMove }