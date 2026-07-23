const processingPokemon = new Set();
const processingTrainers = new Set();

export function xpThreshold(level) {
    return 10 + (Math.max(1, Number(level) || 1) * 2);
}

export function combatXpForLevel(level) {
    return Math.max(1, Number(level) || 1) * 2;
}

export function trainingXpForTrainerLevel(level) {
    return Math.max(5, Math.max(1, Number(level) || 1));
}

export function calculateLevelGain(startLevel, storedExperience, awardedExperience = 0) {
    let level = Math.clamp ? Math.clamp(Number(startLevel) || 1, 1, 100) : Math.min(100, Math.max(1, Number(startLevel) || 1));
    let experience = Math.max(0, Number(storedExperience) || 0) + Math.max(0, Number(awardedExperience) || 0);
    let levelsGained = 0;

    while (level < 100 && experience >= xpThreshold(level)) {
        experience -= xpThreshold(level);
        level += 1;
        levelsGained += 1;
    }
    if (level >= 100) experience = 0;
    return { level, experience, levelsGained };
}

function evolutionEligible(actor, level) {
    const species = actor.itemTypes?.species?.[0];
    const evolutions = species?.system?.evolutions ?? [];
    return evolutions.some(evolution => {
        const requiredLevel = Number(evolution.level ?? 0);
        return requiredLevel > 0 && requiredLevel <= level;
    });
}

async function applyPokemonExperience(actor, amount, { source = "experience", createMessage = true } = {}) {
    if (!actor || actor.type !== "pokemon" || !actor.system?.schema) return null;
    if (actor.system.progression?.mode === "milestone") return null;
    if (processingPokemon.has(actor.uuid)) return null;

    const award = Math.max(0, Math.floor(Number(amount) || 0));
    processingPokemon.add(actor.uuid);
    try {
        const startLevel = Math.max(1, Number(actor.system.identity?.level ?? 1));
        const result = calculateLevelGain(startLevel, actor.system.progression?.experience, award);
        const updates = {
            "system.identity.level": result.level,
            "system.progression.experience": result.experience,
            "system.progression.evolutionEligible": evolutionEligible(actor, result.level)
        };
        if (result.levelsGained) {
            updates["system.progression.pendingAdvancements"] =
                Math.max(0, Number(actor.system.progression?.pendingAdvancements ?? 0)) + result.levelsGained;
        }

        await actor.update(updates, { commanderProgression: true });
        if (result.levelsGained) {
            ui.notifications.info(`${actor.name} reached Level ${result.level}! Advancement choices are pending.`);
        }
        if (!award && !result.levelsGained) return null;
        if (createMessage && award) {
            const levelText = result.levelsGained
                ? `<p>Reached Level ${result.level}; ${result.levelsGained} advancement choice${result.levelsGained === 1 ? " is" : "s are"} pending.</p>`
                : "";
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(actor.name)} gained experience</h3><p><strong>${award} XP</strong> from ${foundry.utils.escapeHTML(source)}.</p>${levelText}</section>`
            });
        }
        return { ...result, awarded: award };
    } finally {
        processingPokemon.delete(actor.uuid);
    }
}

export async function awardPokemonExperience(actor, amount, options = {}) {
    const award = Math.max(0, Math.floor(Number(amount) || 0));
    if (!award) return null;
    return applyPokemonExperience(actor, award, options);
}

async function processStoredPokemonExperience(actor) {
    return applyPokemonExperience(actor, 0, { source: "manual adjustment", createMessage: false });
}

function getTrainingCap(trainer) {
    const cap = Number(trainer.system.attributes?.level?.cap?.training ?? trainer.attributes?.level?.cap?.training);
    return Number.isFinite(cap) && cap > 0 ? cap : Infinity;
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
        const successfulActions = progress - processed;
        if (successfulActions <= 0) return;

        const activeUuid = trainer.system.team?.activePokemonUuid;
        const pokemon = activeUuid ? await fromUuid(activeUuid) : null;
        if (!pokemon || pokemon.type !== "pokemon") {
            ui.notifications.warn("Training succeeded, but this Trainer has no active Pokémon to receive experience.");
            await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);
            return;
        }
        if (Number(pokemon.system.identity?.level ?? 1) > getTrainingCap(trainer)) {
            ui.notifications.warn(`${pokemon.name} is above this Trainer's training level cap.`);
            await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);
            return;
        }

        const trainerLevel = Number(trainer.system.identity?.level ?? trainer.system.level?.current ?? 1);
        const experienceGained = successfulActions * trainingXpForTrainerLevel(trainerLevel);
        await awardPokemonExperience(pokemon, experienceGained, { source: "training" });
        await trainer.setFlag("ptu", "commanderTrainingAwardProgress", progress);
    } finally {
        processingTrainers.delete(trainer.uuid);
    }
}

export function buildCombatXpPreview(combat) {
    const combatants = Array.from(combat?.combatants ?? []);
    const defeated = combatants.filter(entry =>
        entry.actor?.type === "pokemon" &&
        entry.defeated &&
        entry.actor.system?.schema &&
        Number(entry.token?.disposition ?? entry.token?.document?.disposition ?? 0) === -1
    );
    const participants = combatants.filter(entry =>
        entry.actor?.type === "pokemon" &&
        !entry.defeated &&
        entry.actor.system?.schema &&
        entry.actor.system.progression?.mode !== "milestone" &&
        Number(entry.token?.disposition ?? entry.token?.document?.disposition ?? 0) !== -1
    );
    const pool = defeated.reduce((sum, entry) => sum + combatXpForLevel(entry.actor.system.identity?.level), 0);
    return { defeated, participants, pool };
}

async function confirmCombatAward(combat, preview) {
    const names = preview.participants.map(entry => foundry.utils.escapeHTML(entry.actor.name)).join(", ") || "None";
    const content = `<form><p>Eligible Pokémon: ${names}</p><div class="form-group"><label>Total XP pool</label><input name="xpPool" type="number" min="0" step="1" value="${preview.pool}"></div><p>The pool is split evenly among eligible, non-fainted participating Pokémon.</p></form>`;
    return foundry.applications.api.DialogV2.prompt({
        window: { title: `Award Pokémon XP: ${combat.name}` },
        content,
        ok: {
            label: "Award XP",
            callback: (_event, button) => Math.max(0, Math.floor(Number(button.form.elements.xpPool.value) || 0))
        },
        rejectClose: false
    });
}

export async function awardCombatExperience(combat, { pool = null, confirm = true } = {}) {
    if (!game.user?.isGM || !combat?.id) return null;
    const ledger = foundry.utils.deepClone(game.settings.get("ptu", "commanderCombatXpLedger") ?? {});
    if (ledger[combat.id]) return null;

    const preview = buildCombatXpPreview(combat);
    let approvedPool = pool === null ? preview.pool : Math.max(0, Math.floor(Number(pool) || 0));
    if (confirm) approvedPool = await confirmCombatAward(combat, { ...preview, pool: approvedPool });
    if (approvedPool === null || approvedPool === undefined || !preview.participants.length) return null;

    const each = Math.floor(approvedPool / preview.participants.length);
    const remainder = approvedPool - (each * preview.participants.length);
    const awards = [];
    for (const [index, participant] of preview.participants.entries()) {
        const amount = each + (index < remainder ? 1 : 0);
        if (amount) awards.push(await awardPokemonExperience(participant.actor, amount, { source: combat.name, createMessage: false }));
    }

    ledger[combat.id] = { awardedAt: Date.now(), pool: approvedPool, actorUuids: preview.participants.map(entry => entry.actor.uuid) };
    await game.settings.set("ptu", "commanderCombatXpLedger", ledger);
    await ChatMessage.create({
        content: `<section class="commander-chat-card"><h3>Combat Experience Awarded</h3><p>${approvedPool} XP split among ${preview.participants.length} participating Pokémon.</p></section>`
    });
    return { pool: approvedPool, awards };
}

export const CommanderProgression = {
    listen() {
        Hooks.on("updateActor", async (actor, changed, options) => {
            if (options?.commanderProgression) return;
            if (actor.type === "pokemon" && actor.system?.schema) {
                if (foundry.utils.hasProperty(changed, "system.progression.experience")) {
                    await processStoredPokemonExperience(actor);
                }
                return;
            }
            if (actor.type === "character" && actor.system?.schema &&
                foundry.utils.hasProperty(changed, "flags.ptu.commanderDowntime")) {
                await awardTrainingExperience(actor);
            }
        });
        Hooks.on("deleteCombat", combat => awardCombatExperience(combat));
    },
    xpThreshold,
    combatXpForLevel,
    trainingXpForTrainerLevel,
    calculateLevelGain,
    awardPokemonExperience,
    awardCombatExperience,
    buildCombatXpPreview
};
