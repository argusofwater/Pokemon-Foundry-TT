# Initial Technical Audit

## Baseline

- Upstream system version: 4.4.3
- Foundry compatibility: minimum 13.345, verified 13.350
- Source JavaScript modules: validated through Node syntax checks
- Compendiums: stored as LevelDB directories under `packs/`

## Immediate findings

1. The repository did not include a local Node project, validation command, or reproducible local packaging command.
2. Several manifest compendium entries use legacy `.db` paths while the repository stores LevelDB directories.
3. Several compendium entries omit `path` entirely.
4. `packs/dex-entries` and `packs/maneuvers` exist but are not registered in `system.json`.
5. Release workflows are tied to the upstream repository, branch names, secrets, and legacy GitHub Actions syntax.
6. Large generated species datasets are embedded in JavaScript, increasing startup and maintenance cost.

## Safety rule

Do not change game mechanics until the baseline package can be validated, packaged, installed, and smoke-tested in Foundry V13. Technical fixes and optional rules changes should remain separate.

## First milestones

- Add deterministic validation and packaging tools.
- Normalize the V13 compendium manifest after verifying the correct paths in a Foundry installation.
- Add data integrity checks for species, moves, abilities, evolutions, and referenced UUIDs.
- Establish a smoke-test world and record startup errors.
