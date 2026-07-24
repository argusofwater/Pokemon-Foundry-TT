# PTR 1e Rules Audit

## Purpose

This document evaluates Pokémon Tabletop Reunited as a tabletop game first and a Foundry implementation second. The target is a lighter player experience that preserves tactical Pokémon battles, species identity, trainer expression, and meaningful type interactions.

The redesign should reduce what players must remember, calculate, and maintain manually. Foundry may retain deeper internal machinery when that machinery is invisible and reliable.

## Current structural strengths

- Tactical maps, movement, range, areas, interception, and positioning give battles texture.
- Pokémon remain mechanically distinct through species data, moves, abilities, capabilities, and typing.
- Trainers have strong identity and can contribute beyond issuing commands.
- Type effectiveness, STAB, status conditions, and capture remain recognizably Pokémon.
- The existing Foundry system already automates a significant amount of targeting, damage, effects, range, leveling, and compendium lookup.

These are worth preserving. The redesign should not become Pokémon-flavored D&D with the serial numbers filed off.

## Major weight sources

### 1. Too many concurrent numeric layers

A single attack can involve accuracy, three possible evasions, move accuracy, critical range, combat stages, typed selectors, conditional modifiers, damage base, STAB adjustments, attack statistics, defense statistics, damage reduction, type effectiveness, immunity, weakness, resistance, temporary HP, injuries, and secondary effects.

The individual pieces are understandable. The burden comes from their interaction and from the number of places a player must inspect to predict an outcome.

### 2. Three evasions create lookup burden

Physical, Special, and Speed Evasion are each derived from a different stat, modified independently, and affected by separate exceptions.

The redesign keeps three distinct defensive outcomes because they preserve Pokémon identity, but reframes them as Physical Defense, Special Defense, and Reflex. Foundry selects the correct defense automatically so the player no longer performs the lookup.

### 3. Damage uses a ladder plus several additions and subtractions

Damage begins from a move Damage Base, may be altered before and after STAB, then adds an offensive statistic and bonuses. Defense and damage reduction are applied later, followed by type interactions and a minimum-damage rule.

The redesign replaces that visible chain with a Foundry-built d6 pool based on move Power, attacking stat, defending stat, type interaction, STAB, and standardized modifiers.

### 4. Injuries are both attrition and a second health system

The current implementation can award injuries from massive damage and from crossing repeating HP thresholds. Injuries reduce maximum HP and later impose severe penalties, including damage for taking Standard Actions and eventual death.

The redesign replaces repeating injury thresholds with a five-step Wound track. Classic PTR injuries remain available as an optional gritty module.

### 5. Trainer and Pokémon advancement are interlocked

Trainer level, advancement tracks, milestones, Pokémon training caps, Pokémon experience, stat points, edges, feats, abilities, and move acquisition all create parallel progression tracks.

The redesign separates trainer and Pokémon progression. Trainers use levels 1–20 with Background, Role, Specialty, and Talents. Pokémon remain levels 1–100 with automatic growth, Training Paths, milestone choices, evolution continuity, and simplified move management.

### 6. Frequency bookkeeping is pervasive

Moves, features, abilities, items, and effects may refresh at different intervals. Even when Foundry tracks usage, players must understand the meaning and timing of each recharge category.

The redesign standardizes recharge as At-Will, Cooldown, Encounter, and Expedition.

### 7. The action economy has too many named exceptions

Standard, Shift, Swift, Free, Interrupt, Priority, command restrictions, trainer actions, Pokémon actions, and special move clauses produce friction.

The redesign uses shared trainer-Pokémon initiative, two Main Actions, two Move Actions, and one Reaction per individual. Basic commands are free. Reactions replace most interrupt and priority timing.

### 8. Capture math is opaque

Canonical-style capture math is difficult to explain, difficult to estimate, and hostile to quick table resolution.

The redesign uses one d20 capture roll against a species difficulty, modified by trainer rank, ball, HP, status, momentum, and visible narrative tags. Capture remains possible during or after combat.

### 9. Character sheets expose implementation detail

The sheets contain many fields needed for exact PTR compatibility, but the player-facing hierarchy is weak. Frequently used actions compete visually with derived statistics, injury rules, advancement data, and niche toggles.

Sheet redesign is intentionally deferred until the rules are stable.

## Player-lite design constraints

The lighter rules profile should meet these targets:

1. A new player can run one trainer and one active Pokémon after a fifteen-minute explanation.
2. A normal attack resolves with one attack roll and one damage roll or one combined Foundry action.
3. Players do not manually calculate derived defenses or type multipliers.
4. A Pokémon sheet eventually presents only the most important combat information by default.
5. A player tracks no more than a few meaningful resource categories during ordinary play.
6. Level-up choices fit on one guided screen.
7. Conditions use consistent timing and recovery language.
8. The GM may use deeper encounter tools, but players do not need system mastery to take competent turns.

## Locked redesign decisions

### Core resolution

- Use `1d20 + Rank + situational modifier`.
- Use Favored, Hindered, ±2, and ±4 as the standard modifier vocabulary.
- Keep separate Physical Defense, Special Defense, and Reflex values.
- Let Foundry automatically select the defense.
- Simplify combat stages to Boosted, Sharply Boosted, Weakened, and Sharply Weakened.

### Damage

- Convert move Power to a d6 pool.
- Compare offensive and defensive stats by percentage bands to add or remove dice.
- Replace type multipliers with added or removed dice.
- Keep STAB as a flat bonus based on final damage dice.
- Standardize optional modifiers and avoid total-damage multipliers.
- Critical hits maximize one damage die.

### Turns

- Trainer and active Pokémon share initiative.
- The pair receives two Main Actions and two Move Actions.
- Each individual receives one Reaction.
- Basic commands are free.
- Switching costs a Main Action.
- Trainers cannot normally be directly targeted by hostile Pokémon while an active conscious Pokémon protects them.

### Conditions and durability

- Use Physical, Mental, Elemental, and Positioning categories.
- Use Save Ends, Fixed Duration, and Persistent timing.
- Conditions change choices rather than deleting turns.
- Use a five-step Wound track instead of repeating injury thresholds.

### Progression

- Trainers use levels 1–20.
- Trainers use Background, Role, Specialty, and Talents.
- Remove separate Edge and Feature currencies.
- Pokémon remain levels 1–100.
- Pokémon use automatic growth, Training Paths, simplified Natures, milestone choices, and preserved evolution builds.
- Pokémon use four equipped moves, two reserve moves, and an archived move library.

### Capture

- Capture works during or after combat.
- Use one d20 capture roll.
- Include visible species difficulty, HP, status, ball, Momentum, and narrative modifiers.
- At 0 HP, capture is easier but not automatic.
- Specialized balls use simple trigger bonuses and secondary effects.

## Recommended redesign order from here

### Stage A: Healing and recovery

- Define fainting and stabilization.
- Define short rest, expedition rest, Pokémon Centers, Wound recovery, and condition treatment.
- Define medicine, healing items, and support features.

### Stage B: Move and ability conversion

- Map existing move Power and effects into the new damage pipeline.
- Map existing frequencies into the four recharge categories.
- Convert abilities and Pokémon Edges into standardized abilities and Talents.

### Stage C: Encounter structure

- Establish encounter-building expectations.
- Define wild Pokémon behavior, bosses, trainers, and group initiative.
- Test damage and durability across representative level bands.

### Stage D: Exploration and social play

- Give skills, capabilities, travel, contests, research, and social scenes equal structural support.

### Stage E: Foundry interface

- Build the rules-profile toggle.
- Implement automation and migration.
- Redesign sheets only after the rules prove stable.

## Current conclusion

The system does not need to become rules-light. It needs to become player-light.

Foundry can carry detailed species data, type logic, targeting, range, conditions, damage construction, capture math, and progression bookkeeping. Players should see a clean action, a clear result, and only the choices that matter. The machine may remain intricate beneath the floorboards, provided it stops asking everyone at the table to become a clockmaker.
