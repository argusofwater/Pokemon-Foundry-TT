# Commander Build Changelog

This file records private-table changes made on top of Pokémon Tabletop Reunited 1e. Upstream attribution remains in `system.json` and the original project documentation.

## 4.4.3-private.55

### Pokémon sheets and canonical moves

- Audited and enforced all ten locked Pokémon sheet tabs.
- Added evolution stage, typing, linked Trainer, Held Item, lifecycle, and shiny status to the Overview identity panel.
- Corrected Species size rendering and restored XP progression as the generated-Pokémon default.
- Added XP threshold, pending advancement, and evolution-readiness information to Growth.
- New Pokémon now embed up to six level-appropriate canonical starting moves, filling four active slots before two reserve slots.
- Move drops and direct embedded Move creation are rejected when the move is absent from the Pokémon's embedded Species learnset.
- Existing illegal moves are retained for repair, visibly warned, and prevented from rolling.
- Added an Available to Learn list sourced from the canonical Species record.
- Expanded move cards with accuracy, range, target defense, recharge, and legality information.
- Species absent from Generation 9 now use their newest available canonical Showdown learnset instead of receiving an empty move pool.
- Added canonical-move regression tests, including explicit verification that Eevee cannot learn Oblivion Wing.

## 4.4.3-private.54

### Pokémon progression

- Replaced the provisional v52 progression math with the Commander XP baseline.
- Pokémon now require `10 + (current level × 2)` XP for their next level.
- Defeated hostile Pokémon contribute `level × 2` XP to an adjustable encounter pool.
- Eligible participating, non-fainted Pokémon split combat XP evenly, with deterministic remainder distribution.
- Successful training awards the active Pokémon the Trainer's level in XP, with a minimum of 5 XP.
- Added multi-level awards, a level-100 cap, evolution eligibility updates, and pending advancement choices.
- Removed automatic Training Path stat assignment; level-up decisions remain pending until their authoritative rules are locked.
- Added a permanent combat-award ledger to prevent an encounter from granting XP twice.
- Added a separate Disabled/Milestone/XP world setting for optional Trainer progression.
- New Commander Pokémon default to XP progression while existing actors retain their saved mode.

### Safety and release integrity

- Commander models now remain off until a GM confirms and completes actor migration.
- Repeatedly restoring an unused action no longer duplicates shared actions.
- Release packaging restores unchanged upstream compendiums before overwriting Commander-generated packs.
- The release job now fails if any compendium declared in `system.json` is absent.
- Added executable progression regression tests.

## 4.4.3-private.1

### Development tooling

- Added a local Node project with validation and packaging commands.
- Added manifest, asset, language JSON, compendium-source, and JavaScript syntax validation.
- Added a reproducible Foundry installation ZIP command.
- Added an initial technical audit document.

### Foundry foundation

- Normalized every compendium path to its checked-in LevelDB directory under `packs/`.
- Added explicit paths to packs whose manifest entries previously relied on implicit resolution.
- Established a separate Commander Build identity while preserving every original creator credit.
- Removed automatic update and download links aimed at the upstream public release, preventing this private fork from being silently overwritten.
- Pointed project and changelog metadata at the private development repository.

### Rules redesign

- Added a rules-first audit identifying the main sources of player burden.
- Updated the player-lite rules draft to version 0.2 with all currently locked design decisions.
- Retained separate Physical Defense, Special Defense, and Reflex values, with Foundry automatically selecting the correct defense.
- Replaced multiplicative type damage with added or removed damage dice.
- Defined a hidden Foundry damage pipeline using move Power, attacking stat, defending stat, type interaction, STAB, and standardized optional modifiers.
- Simplified critical hits, combat stages, and modifier vocabulary.
- Locked a shared trainer-Pokémon initiative model with two Main Actions, two Move Actions, and one Reaction per individual.
- Made basic commands free, switching a Main Action, and incoming Pokémon unable to take a Main Action on the switch turn by default.
- Protected trainers from direct hostile Pokémon attacks while they have an active conscious Pokémon.
- Standardized condition categories, timing, recovery, reapplication, and assistance.
- Replaced repeating injury thresholds with a five-step Wound track while retaining classic injuries as an optional gritty module.
- Standardized recharge categories as At-Will, Cooldown, Encounter, and Expedition.
- Locked trainer progression to levels 1–20 using Background, Role, Specialty, and Talents.
- Removed separate Edge and Feature currencies and replaced multiclassing with Cross-Role Talents.
- Locked Pokémon progression to levels 1–100 with automatic growth, Training Paths, simplified Natures, milestone choices, evolution continuity, and XP or milestone advancement.
- Defined four equipped moves, two reserve moves, and an archived move library.
- Converted Pokémon Edges into Species Talents, Training Talents, capability upgrades, and milestone improvements.
- Added a one-roll capture system usable during or after combat.
- Defined capture difficulty, HP and status modifiers, Capture Momentum, critical results, ball bonuses, specialized balls, and narrative wild-Pokémon tags.
- Locked fainting, Danger Checks, Breather/Camp/Full Rest recovery, Pokémon Center treatment, percentage-based healing items, medicine checks, healing limits, and exact move-recharge timing.
- Locked one global Weather, one global Terrain, and local Zones with five-round default durations and dice-based environmental modifiers.
- Defined Sunlight, Rain, Sandstorm, Snow, Harsh Winds, Fog, Electric Terrain, Grassy Terrain, Psychic Terrain, Misty Terrain, Dark Terrain, and representative local Zones.
- Added optional elemental setup conditions: Soaked, Chilled, Scorched, and Electrified.
- Added a dedicated Foundry Weather, Terrain, and Zone GUI requirements document covering automatic duration, source tracking, modifiers, token entry, grounded detection, player visibility, and GM controls.
- Locked five ability types, four recharge categories, and four ability power tiers.
- Defined Species Talents for natural traits and Training Talents for learned development.
- Defined General and Role-based trainer Talent lists with minimal prerequisites and limited upgrade chains.
- Limited normal Pokémon progression to five Talents by level 100, with evolution and milestones able to grant suitable extras.
- Standardized ability suppression, copying, stealing, replacement, Entry triggers, and form-change profiles.
- Added Foundry automation requirements for triggers, Reactions, recharge, temporary ability states, Talent prerequisites, and form application.
- Locked one Held Item per Pokémon, five Held Item categories, flat typed-item bonuses, automatic consumable berries, and item suppression.
- Added trainer equipment slots for Outfit, Accessory, Tool, Weapon, and Pack.
- Replaced detailed encumbrance with Bulk and bundled small consumables.
- Made standard TMs reusable, Technical Records consumable, and learned moves part of the archived move library.
- Limited Tutor Modifications to one per move by default.
- Required player consent for evolution and added trade-evolution substitutes.
- Added crafting disciplines, rarity bands, availability controls, inventory locations, and automatic item tracking requirements.
- Added a Foundry compendium architecture plan for rules, moves, abilities, Talents, items, TMs, species, effects, and encounter tools.
- Locked four encounter types and a Threat-based difficulty scaffold that treats action count as a primary balance factor.
- Defined wild Pokémon Temperament, Goal, Morale, Instinct, Escape Condition, and combat-role metadata.
- Added group initiative for minor wild Pokémon and separate handling for leaders, elites, and bosses.
- Locked symmetrical trainer battle rules, battle formats, NPC trainer tiers, switching behavior, and simplified trainer templates.
- Added Boss Actions, phase profiles, Condition Resistance, boss-specific Wound triggers, objective mechanics, and environmental control.
- Added simplified minions without Wound tracking, visible reinforcement triggers, retreat and surrender rules, capture legality, and multiple victory conditions.
- Added Foundry encounter-builder requirements for Threat, action comparison, morale, goals, phases, timers, ownership, and compendium drag-and-drop.
- Locked exploration Scenes, Expeditions, travel Progress, expedition roles, Supply Units, Fatigue, hazards, Discoveries, Research Progress, Pokédex knowledge tiers, social Progress, Reputation, and three-round Contests.
- Added Foundry campaign-tracker requirements for travel, research, social state, Reputation, and Contests.
- Locked Egg development, inherited move and Talent options, Incubation Progress, caregiver Bond, vehicle profiles, Integrity, chases, crew roles, mounts, Downtime Actions, long projects, facilities, and optional group bases.
- Added Foundry tracking requirements for Eggs, vehicles, mounts, downtime, facilities, and base improvements.
- Deferred character-sheet design until the rules stabilize.

### Next targets

- Define the implementation architecture, compendium schemas, stable entry slugs, automation hooks, and migration strategy.
- Build a Foundry rules-profile setting so baseline PTR and Commander Build rules can coexist during testing.
- Prototype the damage engine, defense selection, action economy, conditions, Wounds, capture, recovery, environment controller, ability states, inventory, encounter builder, and campaign trackers.
- Determine whether the unregistered `dex-entries` and `maneuvers` databases are obsolete, internal-only, or should be exposed.
- Add semantic validation for species, moves, abilities, items, Talents, encounters, research subjects, hazards, contests, vehicles, and downtime data.
- Smoke-test the packaged system in Foundry V13.
