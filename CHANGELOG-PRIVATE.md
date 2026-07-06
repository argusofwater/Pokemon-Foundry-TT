# Private Development Changelog

This file records changes made for the private table build. Upstream attribution remains in `system.json` and the original README.

## Unreleased

### Development tooling

- Added a local Node project with validation and packaging commands.
- Added manifest, asset, language JSON, compendium-source, and JavaScript syntax validation.
- Added a reproducible Foundry installation ZIP command.
- Added an initial technical audit document.

### Foundry V13 manifest

- Normalized every compendium `path` to its checked-in LevelDB directory under `packs/`.
- Added explicit paths to packs whose manifest entries previously relied on implicit resolution.

### Known follow-up work

- Determine whether the unregistered `dex-entries` and `maneuvers` databases are obsolete, internal-only, or should be exposed.
- Add semantic validation for species and move data.
- Smoke-test the packaged system in Foundry V13.
