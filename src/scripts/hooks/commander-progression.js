const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];
const processingPokemon = new Set();
const processingTrainers = new Set();

function xpThreshold(level) {
    return Math.max(10, Math.min(100, Number(level) || 1) * 10);
}

function growthStat(path, level, stats = {}) {
    const normalized = String(path ?? "balanced").toLowerCase();
    if (normalized === "striker") return "attack";
    if (normalized === "specialist") return "specialAttack";
    if (normalized === "swift") return "speed";
    if (normalized === "bulwark") return Number(level) % 2 === 0 ? "defense" : "specialDefense";
    if (normalized === "custom") {
        return [...STAT_KEYS].sort((a, b) => Number(stats[a]?.final ?? 0) - Number(stats[b]?.final ?? 0))[0] ?? "hp";
    }
    return STAT_KEYS[Math.max(0, (Number(level) || 1) - 1) % STAT_KEYS.length];
}

function evolutionEligible(actor, level) {
    const species = actor.itemTypes?.species?.[0];
    const evolutions = species?.system?.evolutions ?? [];
    return evolutions.some(evolution => {
        const requiredLevel = Number(evolution.level ?? 0);
        return requiredLevel > 0 && requiredLevel <= level;
    });
}

async function applyPokemonProgression(actor) {
    if (!actor || actor.type !== "pokemon" || !actor.system?.schema) return;
    if (processingPokemon.has(actor.uuid)) return;

    processingPokemon.add(actor.uuid);
    try {
        let level = Math.max(1, Number(actor.system.identity?.level ?? 1));
        let experience = Math.max(0, Number(actor.system.progression?.experience ?? 0));
        const statGrowth = Object.fromEntries(STAT_KEYS.map(key => [key, 0]));
        let levelsGained = 0;

        while (level < 100 && experience >= xpThreshold(level)) {
            experience -= xpThreshold(level);
            level += 1;
            levelsGained += 1;
            const statKey = growthStat(actor.system.identity?.trainingPath, level, actor.system.stats);
            statGrowth[statKey] += 1;
        }

        if (!levelsGained) return;

        const updates = {
            "system.identity.level": level,
            "system.progression.experience": experience,
            "system.progression.evolutionEligible": evolutionEligible(actor, level)
        };

        let hpGrowth = 0;
        for (const [key, amount] of Object.entries(statGrowth)) {
            if (!amount) continue;
            updates[`system.stats.${key}.level`] = Number(actor.system.stats?.[key]?.level ?? 0) + amount;
            if (key === "hp") hpGrowth += amount;
        }
        if (hpGrowth) updates["system.health.hp.value"] = Number(actor.system.health?.hp?.value ?? 0) + hpGrowth;

        await actor.update(updates, { commanderProgression: true });
        ui.notifications.info(`${actor.name} reached Level ${level}!`);
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(actor.name)} grew stronger!</h3><p>Reached Level ${level} and gained ${levelsGained} level${levelsGained === 1 ? "" : "s"}.</p></section>`
        });
    } finally {
        processingPokemon.delete(actor.uuid);
    }
}

async function awardTrainingExperience(trainer) {
    if (!trainer || trainer.type !== "character" || !trainer.system?.schema) return;
    if (processingTrainers.has(trainer.uuid)) return;

    const downtime = trainer.getFlag("ptu", "commanderDowntime") ?? {};
    if (downtime.category !== "training") return;

    const progress = Math.max(0, Number(downtime.progress ?? 0));
    const processed = Math.max(0, Number(trainer.getFlag("ptu", "commanderTrainingAwardProgress") ?? 0));

    processingTrainers.add(trainer.uuid);
    try {
        if (progress < processed) {
            await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);
            return;
        }

        const gainedProgress = progress - processed;
        if (gainedProgress <= 0) return;

        const activeUuid = trainer.system.team?.activePokemonUuid;
        const pokemon = activeUuid ? await fromUuid(activeUuid) : null;
        if (!pokemon || pokemon.type !== "pokemon") {
            ui.notifications.warn("Training succeeded, but this Trainer has no active Pokémon to receive experience.");
            await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);
            return;
        }

        const experienceGained = gainedProgress * 10;
        const currentExperience = Math.max(0, Number(pokemon.system.progression?.experience ?? 0));
        await pokemon.update({ "system.progression.experience": currentExperience + experienceGained }, { commanderTraining: true });
        await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);

        ui.notifications.info(`${pokemon.name} gained ${experienceGained} XP from training.`);
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: trainer }),
            content: `<section class="commander-chat-card"><h3>Training Complete</h3><p>${foundry.utils.escapeHTML(pokemon.name)} gained <strong>${experienceGained} XP</strong>.</p></section>`
        });
    } finally {
        processingTrainers.delete(trainer.uuid);
    }
}

export const CommanderProgression = {
    listen() {
        Hooks.on("updateActor", async (actor, changed, options) => {
            if (options?.commanderProgression) return;

            if (actor.type === "pokemon" && actor.system?.schema) {
                const xpChanged = foundry.utils.hasProperty(changed, "system.progression.experience");
                if (xpChanged || options?.commanderTraining) await applyPokemonProgression(actor);
                return;
            }

            if (actor.type === "character" && actor.system?.schema) {
                const downtimeChanged = foundry.utils.hasProperty(changed, "flags.ptu.commanderDowntime");
                if (downtimeChanged) await awardTrainingExperience(actor);
            }
        });
    },
    xpThreshold,
    applyPokemonProgression
};
