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

### Next targets

- Settings cleanup and a dedicated Commander Build configuration panel.
- Actor-sheet usability pass for trainers and Pokémon.
- Combat workflow audit covering targeting, accuracy, damage, conditions, and capture.
- Optional refined-rules profile kept separate from baseline PTR behavior.
- Determine whether the unregistered `dex-entries` and `maneuvers` databases are obsolete, internal-only, or should be exposed.
- Add semantic validation for species and move data.
- Smoke-test the packaged system in Foundry V13.
