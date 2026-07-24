# Commander Build Compendium Plan

## Purpose

Use Foundry compendiums as the primary home for the growing rules catalog so the system remains searchable, reusable, migratable, and easier to maintain than hard-coded lists scattered across sheets and scripts.

## Planned compendiums

### Core Rules

Stores journals for:

- Core checks
- Damage
- Actions
- Conditions
- Wounds
- Healing and rest
- Capture
- Weather and Terrain
- Item rules
- Progression

### Moves

Stores move entries with:

- Type
- Category
- Power
- Range
- Area
- Defense target
- Recharge
- Conditions
- Zone effects
- Tutor modifications
- Automation metadata

### Abilities

Stores abilities with:

- Ability type
- Trigger
- Effect
- Recharge
- Power tier
- Tags
- Automation metadata

### Pokémon Talents

Stores:

- Species Talents
- Training Talents
- Capability upgrades
- Milestone improvements

### Trainer Talents

Stores:

- General Talents
- Role Talents
- Specialty Talents
- Cross-Role Talents
- Talent upgrades

### Items

Stores:

- Held Items
- Trainer equipment
- Healing items
- Berries
- Poké Balls
- Evolution items
- Crafting materials
- Packs and tools

### TMs and Tutors

Stores:

- Standard reusable TMs
- Consumable Technical Records
- Prototype and Custom TMs
- Tutor services
- Tutor Modifications
- Compatibility metadata

### Species

Stores species data, including:

- Base stats
- Typing
- Movement
- Size
- Abilities
- Species Talents
- Learnsets
- Evolution paths
- Capture Difficulty
- Wild behavior tags
- Form profiles

### Conditions and Effects

Stores reusable Active Effects or equivalent effect templates for:

- Conditions
- Weather
- Terrain
- Zones
- Temporary ability states
- Suppression
- Item suppression
- Form changes

### Encounter Tools

Stores:

- Wild encounter groups
- Trainer templates
- Boss packages
- Environmental presets
- Weather and Terrain presets
- Example scenes and hazards

## Data ownership

Rules content should live in compendium source data whenever possible.

Code should provide:

- Automation
- Validation
- Migration
- Search and filtering
- Sheet integration
- Effect application

Code should not become the only place where a move, item, Talent, or ability can be understood or edited.

## Authoring goals

Compendium entries should be:

- Searchable by name and tags
- Drag-and-drop compatible
- Editable without changing system code
- Referenced by stable IDs or slugs
- Validated during build and packaging
- Exportable for backup and migration

## Tagging

Common tags should include:

- Type
- Role
- Specialty
- Species
- Ability type
- Recharge
- Power tier
- Condition category
- Item category
- Rarity
- Source book or rules profile
- Automation support level

## Rules profiles

Entries should identify whether they belong to:

- Baseline PTR
- Commander Build
- Shared
- Optional module

This supports a future rules-profile setting without duplicating every record unnecessarily.

## Foundry UI requirements

The compendium browser should support:

- Full-text search
- Tag filters
- Type and category filters
- Compatible-only views for selected Pokémon
- Role and Specialty filters for trainers
- Rarity and availability filters for items
- Drag-and-drop onto actors and sheets
- Preview of automation and prerequisites
- Warnings for incompatible or profile-mismatched entries

## Migration and validation

Build tooling should validate:

- Unique stable slugs
- Required fields
- Valid references
- Compatible tags
- Recharge values
- Defense targets
- Item slots
- Talent prerequisites
- Evolution references
- Move and ability automation schemas

Migration scripts should update old entries when schemas change.

## Initial implementation order

1. Conditions and reusable effects
2. Moves
3. Abilities
4. Items
5. Trainer Talents
6. Pokémon Talents
7. TMs and Tutors
8. Species migration
9. Encounter tools
10. Core Rules journals

## Design principle

The compendium is the library. Foundry automation is the librarian. The character sheet is only the reading desk.
