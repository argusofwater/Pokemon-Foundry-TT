# Commander Build Compendium Content Scope

## Goal

Build a complete, searchable Commander Build compendium covering the usable Pokémon tabletop catalog without requiring manual record creation for every species, move, ability, and item.

The compendium is generated from normalized source data, validated during the build, and packed into Foundry compendiums.

## Included species content

Include:

- Every standard Pokémon species supported by the selected source dataset
- Regional forms
- Sex-specific battle-relevant forms
- Permanent alternate forms with mechanical differences
- Battle forms with mechanical differences
- Mega Evolutions
- Primal Reversion profiles if retained as a separate optional transformation family
- Terastal-compatible species records without creating one duplicate actor for every Tera Type
- Evolution families and branching evolution paths
- Species learnsets
- Egg Groups and breeding tags
- Abilities and alternate ability options
- Base capabilities and movement modes
- Capture and wild-behavior metadata

Exclude from the initial Commander Build catalog:

- Dynamax forms
- Gigantamax forms
- Dynamax-specific moves
- Max Moves
- G-Max Moves
- Dynamax-only items and encounter rules

Cosmetic forms without mechanical differences should remain aliases, artwork options, or descriptive tags rather than separate species entries.

## Included move content

Include standard moves with:

- stable slug
- display name
- type
- category
- source-game Power
- Commander Power band input
- range and area
- target defense
- recharge category
- conditions and secondary effects
- recoil, drain, healing, and movement metadata
- Weather, Terrain, and Zone interactions
- contest category and tags
- compatible species references or compatibility tags
- automation support state

Exclude Max and G-Max moves.

## Included ability content

Include standard abilities and form-specific abilities with:

- stable slug
- display name
- ability type
- trigger
- effect text
- recharge
- power tier
- suppression and copy behavior
- entry-trigger limit
- automation support state

## Included item content

Include mechanically relevant items grouped as:

- Held Items
- Berries
- Medicine
- Poké Balls
- Evolution items
- Mega Stones and transformation catalysts
- TMs and Technical Records
- Key tools needed by tabletop rules
- Trainer gear and weapons defined by Commander Build
- Crafting ingredients that have tabletop use

Exclude decorative or single-game key items that have no tabletop function unless they are useful as optional campaign props.

## Species record strategy

A standard species is one Species compendium Item.

A mechanical form may be represented in one of two ways:

1. A separate Species Item when the form is permanent, selectable at actor creation, or materially distinct outside battle.
2. A Form Profile embedded in or referenced by the base Species Item when the form is temporary or transformation-driven.

Regional forms should normally be separate Species Items.

Mega Evolutions should normally be Form Profiles linked to their base Species Item rather than standalone party actors.

## Mega Evolution behavior

Mega Evolution is a temporary actor transformation.

When activated, Foundry should:

- preserve the actor UUID
- preserve current HP percentage rather than raw HP when maximum HP changes
- preserve Wounds, Bond, ownership, token disposition, Trainer link, move loadout, and ongoing conditions
- apply the Mega form's typing
- replace the active ability according to the form profile
- apply the Mega form's stat profile
- update portrait and token artwork when configured
- update size and token dimensions when configured
- display a visible Mega state on the sheet
- retain a complete reversible snapshot of transformed fields

When reverted, Foundry should restore the base profile without deleting changes made to unrelated actor data during the transformation.

Mega Evolution should not create a new actor and should not replace the actor UUID.

## Mega Evolution requirements

A Mega form profile may require:

- a specific Mega Stone or catalyst
- an eligible base species or form
- an active Trainer link
- a Trainer Talent, campaign permission, or Key Stone equivalent
- no other active Mega Evolution controlled by the same Trainer, unless the campaign enables an override

These restrictions should be expressed as data and validated by automation rather than hard-coded per species.

## Transformation families

The form system should support several transformation families through the same underlying profile engine:

- Mega Evolution
- Primal Reversion
- temporary battle forms
- stance forms
- weather-triggered forms
- item-triggered forms
- ability-triggered forms
- story transformations

Dynamax and Gigantamax remain explicitly unsupported in the initial catalog.

## Source-data directories

Recommended source layout:

- `data-src/species/`
- `data-src/forms/`
- `data-src/moves/`
- `data-src/abilities/`
- `data-src/items/`
- `data-src/talents/`
- `data-src/evolutions/`
- `data-src/compatibility/`
- `data-src/localization/`

Normalized source records should be plain JSON or YAML and should not depend on Foundry document IDs.

## Stable identity

Every record requires:

- stable slug
- content type
- source identifier
- schema version
- rules profile

References should use stable slugs during authoring and resolve to Foundry UUIDs during pack generation.

## Import pipeline

The build pipeline should:

1. Read normalized source records
2. Validate required fields and unique slugs
3. Exclude Dynamax and Gigantamax content
4. Resolve species, form, move, ability, item, and evolution references
5. Apply Commander conversion rules
6. Produce deterministic Foundry documents
7. Build LevelDB compendium packs
8. Generate validation and coverage reports

## Coverage reports

Every build should report:

- total species
- total regional forms
- total mechanical alternate forms
- total Mega profiles
- total moves
- total abilities
- total items
- unresolved references
- missing automation handlers
- missing artwork
- missing learnsets
- duplicate slugs
- excluded Dynamax and Gigantamax records

## Initial data implementation order

1. Types and shared tags
2. Abilities
3. Moves
4. Held Items and Berries
5. Evolution and transformation items
6. Base species
7. Regional forms
8. Mega form profiles
9. Learnsets and compatibility
10. Remaining medicine, Poké Balls, TMs, and campaign items
11. Validation and coverage reporting

## Locked decisions

- The target is the complete usable game catalog, not a small curated subset
- Dynamax and Gigantamax content is excluded
- Mega Evolution transforms the existing actor automatically
- Mega forms use reversible form profiles
- Regional forms remain separate species entries when mechanically distinct
- Cosmetic-only forms do not create duplicate species records
- Source data is normalized outside Foundry packs
- Compendiums are generated and validated rather than maintained by hand
