class PTUCombat extends Combat {
    get expBudget() {
        let budget = 0;
        for(const combatant of this.combatants) {
            const token = combatant.token;
            const actor = combatant.actor;
            if(!actor || !token) continue;
            if(actor.hasPlayerOwner) continue;
            if(token.disposition >= 0) continue;

            const level = actor.attributes?.level?.current ?? actor.system?.identity?.level ?? actor.system?.level?.current ?? 1;
            budget += actor.type === "character" ? level + level : level;
        }
        return budget;
    }

    /** @override */
    _sortCombatants(a, b) {
        const leagueBattle = game.settings.get("ptu", "leagueBattle");

        const speedPriority = (combatant) => {
            const actor = combatant?.actor;
            if (!actor) return { one: 0, two: 0, three: 0, four: 0 };
            const speed = actor.system?.stats?.spd ?? actor.system?.stats?.speed ?? {};
            return {
                one: Number(speed.total ?? speed.final ?? 0),
                two: Number(speed.levelUp ?? speed.level ?? 0),
                three: Number(speed.value ?? speed.species ?? 0),
                four: Number(actor.system?.level?.current ?? actor.system?.identity?.level ?? 0)
            };
        };
        
        const resolveTie = () => {
            if (!a?.actor || !b?.actor) return (a?.id ?? "").localeCompare(b?.id ?? "");
            const [priorityA, priorityB] = [a, b].map(speedPriority);

            return priorityA.one === priorityB.one
                ? priorityA.two === priorityB.two
                    ? priorityA.three === priorityB.three
                        ? priorityA.four === priorityB.four
                            ? a.id.localeCompare(b.id)
                            : priorityB.four - priorityA.four
                        : priorityB.three - priorityA.three
                    : priorityB.two - priorityA.two
                : priorityB.one - priorityA.one;
        }

        if (!a?.actor && !b?.actor) return (a?.id ?? "").localeCompare(b?.id ?? "");
        if (!a?.actor) return 1;
        if (!b?.actor) return -1;

        if (leagueBattle) {
            const [isTrainerA, isTrainerB] = [a, b].map((combatant) => combatant.actor instanceof CONFIG.PTU.Actor.documentClasses.character);
            return isTrainerA && isTrainerB && isTrainerA === isTrainerB
                ? typeof a.initiative === "number" && typeof b.initiative === "number" && a.initiative === b.initiative
                    ? resolveTie() * -1
                    : super._sortCombatants(a, b) * -1
                : isTrainerA && !isTrainerB
                    ? -1
                    : !isTrainerA && isTrainerB
                        ? 1
                        : typeof a.initiative === "number" && typeof b.initiative === "number" && a.initiative === b.initiative
                            ? resolveTie()
                            : super._sortCombatants(a, b);
        }
        else {
            return typeof a.initiative === "number" && typeof b.initiative === "number" && a.initiative === b.initiative
                ? resolveTie()
                : super._sortCombatants(a, b);
        }
    }

    /** @override */
    getCombatantWithHigherInit(a, b) {
        const sortResult = this._sortCombatants(a, b);
        return sortResult > 0 ? b : sortResult < 0 ? a : null;
    }

    /** @override */
    async createEmbeddedDocuments(embeddedName = "Combatant", data, context = {}) {
        const createData = data.filter((datum) => {
            const token = canvas.tokens.placeables.find((canvasToken) => canvasToken.id === datum.tokenId);
            if (!token) return false;

            const { actor } = token;
            if (!actor) {
                ui.notifications.warn(`${token.name} has no associated actor.`);
                return false;
            }

            return true;
        })
        return super.createEmbeddedDocuments(embeddedName, createData, context);
    }

    /** @override */
    async rollInitiative(ids, options = {}) {
        const extraRollOptions = options.extraRollOptions ?? [];
        const rollMode = options.messageOptions?.rollMode ?? options.rollMode ?? game.settings.get("core", "rollMode");
        if (options.secret) extraRollOptions.push("secret");

        const combatants = ids.flatMap(
            (id) => this.combatants.get(id) ?? []
        );
        const fightyCombatants = combatants.filter((c) => !!c.actor?.initiative);
        const rollResults = await Promise.all(
            fightyCombatants.map(async (combatant) => {
                return (
                    combatant.actor.initiative?.roll({
                        ...options,
                        extraRollOptions,
                        updateTracker: false,
                        rollMode,
                    }) ?? null
                );
            })
        );

        const initiatives = rollResults.flatMap((result) => {
            if (result?.combatant?.isPrimaryBossCombatant) {
                const { otherTurns } = result.combatant.bossTurns;
                const results = [{ id: result.combatant.id, value: result.roll.total }];

                for (let i = 1; i <= otherTurns.length; i++) {
                    const init = result.roll.total - 5 * i;
                    const actualInit = init >= 0 ? init : result.roll.total + -5 * (Math.ceil(init / 5) - 1)
                    results.push({
                        id: otherTurns[i - 1].id,
                        value: actualInit
                    });
                }
                return results;
            }
            return result
                ? {
                    id: result.combatant.id,
                    value: result.roll.total,
                }
                : []
        }
        );

        await this.setMultipleInitiatives(initiatives);

        const remainingIds = ids.filter((id) => !fightyCombatants.some((c) => c.id === id));
        return super.rollInitiative(remainingIds, options);
    }

    async setMultipleInitiatives(initiatives) {
        const currentId = this.combatant?.id
        const updates = initiatives.map(({ id, value }) => ({
            _id: id,
            initiative: value
        }));
        await this.updateEmbeddedDocuments("Combatant", updates);
        if (currentId) await this.update({ turn: this.turns.findIndex((c) => c.id === currentId) });
    }

    async resetActors() {
        for (const actor of this.combatants.contents.flatMap(c => c.actor ?? [])) actor.reset();
    }

    /** @override */
    async nextTurn() {
        const turn = this.turn ?? -1;

        let next = null;
        for (let [i, t] of this.turns.entries()) {
            if (i == turn) continue;
            if (t.hasActed) continue;
            if (this.settings.skipDefeated && t.isDefeated) continue;
            next = i;
            break;
        }

        let round = this.round;
        if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
            return this.nextRound();
        }

        const updateData = { round, turn: next };
        const updateOptions = { advanceTime: CONFIG.time.turnTime, direction: 1 };
        Hooks.callAll("combatTurn", this, updateData, updateOptions);
        return this.update(updateData, updateOptions);
    }

    /** @override */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        if (!this.started) return;

        const { combatant, previous } = this;
        const [newRound, newTurn] = [changed.round, changed.turn];
        const isRoundChange = typeof newRound === "number";
        const isTurnChange = typeof newTurn === "number";
        const isNewTurnUnacted = isTurnChange && this.turns[newTurn]?.hasActed === false;
        const isNextRound = isRoundChange && (previous.round === null || newRound > previous.round);
        const isNextTurn = isTurnChange && (previous.turn === null || newTurn > previous.turn || isNewTurnUnacted);

        if (!(isRoundChange || isTurnChange)) return;

        Promise.resolve().then(async () => {
            if (isNextRound || isNextTurn) {
                const previousCombatant = this.combatants.get(previous.combatantId ?? "");
                if (game.user === previousCombatant?.actor?.primaryUpdater) {
                    const alreadyWent = previousCombatant.roundOfLastTurnEnd === previous.round;
                    if (typeof previous.round === "number" && !alreadyWent) {
                        await previousCombatant.endTurn({ round: previous.round });
                    }
                }

                if (game.user === combatant?.actor?.primaryUpdater) {
                    const alreadyWent = combatant?.roundOfLastTurn === this.round || combatant?.bossTurns?.mainTurn.roundOfLastTurn === this.round;
                    if (combatant && !alreadyWent) {
                        await combatant.startTurn();
                    }
                }
            }

            this.resetActors();
            await game.ptu.effectTracker.refresh();
            game.ptu.tokenPanel.refresh();
        });
    }

    /** @override */
    _onDelete(options, userId) {
        super._onDelete(options, userId);

        if (this.started) {
            Hooks.callAll("ptu.endTurn", this.combatant ?? null, this, userId);
            game.ptu.effectTracker.onEncounterEnd(this);
        }

        game.user.targets.clear();
    }
}

export { PTUCombat }
