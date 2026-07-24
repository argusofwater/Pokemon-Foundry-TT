# Commander Build Compendium Data Provenance

## Canonical cutoff

Commander Build uses a frozen pre-Pokémon Legends: Z-A data baseline.

The canonical gameplay cutoff is:

- Pokémon Scarlet
- Pokémon Violet
- The Teal Mask
- The Indigo Disk

This means the catalog uses Generation 9 Scarlet/Violet-era species stats, typing, moves, abilities, items, evolution data, and learnset state as its default reference point.

## Explicit exclusions

Do not import or apply:

- Pokémon Legends: Z-A-only stat changes
- Pokémon Legends: Z-A-only move changes
- Pokémon Legends: Z-A-only ability changes
- Pokémon Legends: Z-A-only items
- Pokémon Legends: Z-A-only forms
- new Mega Evolutions introduced only in Pokémon Legends: Z-A
- Dynamax or Gigantamax content

Z-A content may be added later only through an explicit optional Commander content module.

## Source hierarchy

The build pipeline uses a layered source hierarchy.

### 1. Battle-facing canonical data

Use a frozen Generation 9 Pokémon Showdown-compatible dataset for:

- base stats
- typing
- move Power and accuracy
- move categories
- abilities
- held items
- mechanical alternate forms

### 2. Pokédex metadata

Use a frozen PokéAPI or veekun-style dataset for:

- National Dex identifiers
- evolution chains
- capture rates
- Egg Groups
- species metadata
- growth and breeding references
- learnset cross-checks

### 3. Legacy PTR compendiums

Use the existing PTR content for tabletop-specific material such as:

- movement capabilities
- size
- tabletop capability tags
- existing tabletop prose
- legacy encounter and habitat metadata

Legacy PTR data never overrides the frozen Generation 9 canonical stat line unless a Commander override explicitly says so.

### 4. Commander overrides

Commander-authored records control:

- tabletop stat conversion
- Power bands
- target defenses
- ranges and areas
- recharge
- capture Difficulty
- condition effects
- automation
- Talents
- item behavior
- encounter metadata

## Mega Evolution baseline

Mega Evolution uses established pre-Z-A Mega forms and their latest canonical pre-Z-A stat, typing, and ability profiles.

Because Scarlet and Violet do not use Mega Evolution directly, Mega data should be drawn from the most recent official pre-Z-A implementation of each established Mega form, then converted through Commander rules.

Mega profiles remain temporary reversible Form Profiles attached to their base species.

## Conflict resolution

When source data disagrees, use this priority:

1. Commander override
2. frozen Scarlet/Violet plus DLC battle dataset
3. pre-Z-A canonical Mega profile data
4. Pokédex metadata source
5. legacy PTR compendium

Every override should record its reason and source in metadata.

## Reproducibility

The importer should record:

- source dataset name
- source repository or package version
- source commit or release identifier
- import timestamp
- canonical cutoff label

The intended cutoff label is:

`gen9-sv-dlc-pre-za`

This prevents future upstream updates from silently introducing Z-A content.

## Locked decisions

- Scarlet/Violet plus both DLCs are the canonical base-game cutoff
- Z-A data is excluded by default
- new Z-A-only Mega forms are excluded
- established older Mega forms remain supported
- canonical battle data outranks legacy PTR numeric data
- legacy PTR remains valuable for tabletop-only capabilities and prose
- all imported data must carry a reproducible source snapshot identifier
