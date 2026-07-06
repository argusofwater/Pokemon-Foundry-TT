# Commander Build Changelog

This file records private-table changes made on top of Pokémon Tabletop Reunited 1e. Upstream attribution remains in `system.json` and the original project documentation.

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

- Added a rules-first audit identifying the main sources of player burden: stacked numeric layers, three evasions, Damage Base resolution, injury thresholds, parallel advancement, frequency bookkeeping, action exceptions, and sheet density.
- Added the first player-lite rules draft.
- Proposed two defenses, Guard and Reflex, instead of three evasions.
- Proposed a Main, Move, and Reaction action economy.
- Proposed compressed damage tiers, simplified combat stages, four recharge categories, and Wounds as the default durability consequence.
- Defined a first vertical-slice playtest using three mechanically distinct Pokémon.

### Next targets

- Decide the final attack and defense math.
- Decide whether Pokémon progression remains 1–100 or is compressed.
- Build a Foundry rules-profile setting so baseline PTR and player-lite rules can coexist during testing.
- Prototype Guard, Reflex, Wounds, and the new action economy.
- Determine whether the unregistered `dex-entries` and `maneuvers` databases are obsolete, internal-only, or should be exposed.
- Add semantic validation for species and move data.
- Smoke-test the packaged system in Foundry V13.
