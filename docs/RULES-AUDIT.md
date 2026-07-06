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

### 2. Three evasions create choice without enough player-facing value

Physical, Special, and Speed Evasion are each derived from a different stat, then modified independently. The code currently derives them from Defense, Special Defense, and Speed in fifths, caps their stat contribution, applies separate modifiers, and then handles exceptions such as Vulnerable and Stuck.

This is tactically precise but player-heavy. Most players experience it as three defensive target numbers that must be checked before each attack.

### 3. Damage uses a ladder plus several additions and subtractions

Damage begins from a move Damage Base, may be altered before and after STAB, then adds an offensive statistic and bonuses. Defense and damage reduction are applied later, followed by type interactions and a minimum-damage rule.

This preserves PTU lineage but creates a long resolution chain. Foundry can automate it, yet players still struggle to estimate whether a move is weak, strong, or dangerous without opening several details.

### 4. Injuries are both attrition and a second health system

The current implementation can award injuries from massive damage and from crossing repeating HP thresholds. Injuries reduce maximum HP and later impose severe penalties, including damage for taking Standard Actions and eventual death.

This creates dramatic consequences, but it also means one attack may change current HP, maximum HP, injury count, rest eligibility, action costs, and death proximity. That is excellent for a survival campaign and unnecessarily punishing for a default Pokémon adventure.

### 5. Trainer and Pokémon advancement are interlocked

Trainer level, advancement tracks, milestones, Pokémon training caps, Pokémon experience, stat points, edges, feats, abilities, and move acquisition all create parallel progression tracks.

The system supports deep customization, but level-up events are dense and maintenance-heavy. Players must understand two character systems at once, often across several active Pokémon.

### 6. Frequency bookkeeping is pervasive

Moves, features, abilities, items, and effects may refresh at different intervals. Even when Foundry tracks usage, players must understand the meaning and timing of each recharge category.

### 7. The action economy has too many named exceptions

Standard, Shift, Swift, Free, Interrupt, Priority, command restrictions, trainer actions, Pokémon actions, and special move clauses produce friction. Tactical richness is useful; vocabulary proliferation is not.

### 8. Character sheets expose implementation detail

The sheets contain many fields needed for exact PTU compatibility, but the player-facing hierarchy is weak. Frequently used actions compete visually with derived statistics, injury rules, advancement data, and niche toggles.

## Player-lite design constraints

The lighter rules profile should meet these targets:

1. A new player can run one trainer and one active Pokémon after a fifteen-minute explanation.
2. A normal attack resolves with one attack roll and one damage roll or one combined Foundry action.
3. Players should not manually calculate derived defenses or type multipliers.
4. A Pokémon sheet should present no more than six primary combat numbers.
5. A player should track no more than three expendable resource categories during ordinary play.
6. Level-up choices should fit on one guided screen.
7. Conditions should have consistent timing and recovery language.
8. The GM may use deeper encounter tools, but players should not need system mastery to take competent turns.

## Recommended redesign order

### Stage A: Core resolution

- Choose whether attacks use one Defense, two defenses, or a unified target number.
- Replace modifier stacking with a smaller bonus vocabulary.
- Simplify critical hits and combat stages.
- Establish one visible attack sequence.

### Stage B: Damage and durability

- Replace or compress the Damage Base ladder.
- Decide whether defenses reduce damage or modify hit chance, but avoid making both equally prominent.
- Replace default injuries with a simpler Wound rule, keeping classic injuries as an optional module.

### Stage C: Turns and resources

- Reduce actions to Move, Main, and Reaction.
- Standardize recharge categories.
- Clarify trainer and Pokémon command flow.

### Stage D: Progression

- Reduce trainer prerequisite chains.
- Consolidate Pokémon stat advancement.
- Replace multiple parallel level-up decisions with guided packages and optional advanced choices.

### Stage E: Exploration and capture

- Make capture a short opposed or threshold procedure.
- Give skills, capabilities, travel, and social play equal structural support.

## First conclusion

The system does not need to become rules-light. It needs to become player-light.

Foundry can carry detailed species data, type logic, targeting, range, conditions, and encounter math. Players should see a clean action, a clear result, and only the choices that matter. The machine may remain intricate beneath the floorboards, provided it stops asking everyone at the table to become a clockmaker.
