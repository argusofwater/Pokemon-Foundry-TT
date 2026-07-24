# Commander Build Compendium Conversion Rules

## Purpose

These rules translate legacy PTR and main-series-style source data into Commander Build compendium records consistently.

The converter is intentionally conservative. Values that can be translated reliably are converted automatically. Effects whose meaning depends on prose or edition-specific mechanics are preserved and marked for review rather than guessed into false precision.

## Source profiles

The conversion pipeline recognizes three practical source shapes:

- Commander-native data already using Commander fields
- Legacy PTR data using tabletop-scale stats and Damage Base values
- Main-series-style data using base stats, base Power, accuracy percentage, and capture rate

Source-shape detection is based on field names and numeric ranges. Explicit source metadata always overrides automatic detection.

## Species stat conversion

Commander species stats use a compact tabletop scale while preserving the relative shape of the original stat line.

### Existing tabletop-scale stats

If all six source stats are 30 or lower and the total is 150 or lower, treat them as already tabletop-scaled and preserve them directly.

Minimum value is 1.

### Main-series base stats

Convert each main-series base stat independently:

`Commander stat = round(base stat / 10)`

Minimum value is 1.

Examples:

- 35 becomes 4
- 45 becomes 5
- 80 becomes 8
- 100 becomes 10
- 135 becomes 14
- 255 becomes 26

This preserves recognizable species identity without importing three-digit arithmetic into play.

### Form and Mega stats

Mechanical form profiles use the same conversion.

Mega Evolution replaces the base species contribution with the Mega profile contribution. It does not stack the Mega stat line on top of the base stat line.

## HP conversion

Species HP uses the same stat conversion as the other five stats.

Actor maximum HP is derived later from:

- species HP
- level growth
- Training Path
- Nature
- Talents, abilities, and effects

The compendium converter does not calculate final actor HP.

## Capture conversion

When the source already provides Commander Capture Difficulty values of 0, 2, 4, 6, or 10, preserve them.

For main-series capture rates:

- 200–255: Common, Difficulty +0
- 100–199: Uncommon, Difficulty +2
- 45–99: Rare, Difficulty +4
- 3–44: Exceptional, Difficulty +6
- 1–2: Legendary, Difficulty +10
- 0 or explicitly unavailable: Restricted

The pipeline also sets a suggested rarity from the same conversion.

Story restrictions may override numeric capture rate.

## Move Power conversion

Commander Move Power uses the familiar base-Power scale that feeds the locked Power bands.

### Main-series base Power

Preserve the source base Power directly.

### Legacy PTR Damage Base

When a source field is explicitly named Damage Base or `db`, convert:

`Commander Power = Damage Base × 10`

Examples:

- DB 4 becomes Power 40
- DB 7 becomes Power 70
- DB 12 becomes Power 120

A legacy Damage Base of 1 becomes Power 10.

### Already converted Power

A field explicitly named Power is preserved unless source metadata identifies it as a legacy Damage Base.

### Variable-Power moves

Use the ordinary or median Power as the displayed Power and add a `variable-power` tag.

Automation or rules text determines the actual value at use time.

### Fixed-damage moves

Set Power to 0 and add a `fixed-damage` tag. Preserve the fixed-damage rule in structured effects or description.

### One-hit knockout moves

Set Power to 0, use Encounter or Expedition recharge as appropriate, and add `special-resolution` and `ohko` tags. They do not enter normal damage-band calculation.

## Accuracy conversion

Preserve main-series accuracy percentage as source metadata.

Commander checks do not directly roll percentage accuracy. The converter suggests an accuracy modifier:

- 100 or always hits: +0
- 90–99: +0
- 80–89: -2
- 70–79: -4
- below 70: -4 and Hindered
- source accuracy absent: +0

Moves with unusual accuracy logic receive an `accuracy-special` tag and require review.

## Target defense

Default mapping:

- Physical damaging move: Physical Defense
- Special damaging move: Special Defense
- Status move based on dodging, beams, projectiles, traps, or areas: Reflex
- Status move based on will, perception, emotion, or direct mystical influence: Special Defense unless a specific rule says otherwise
- Self, field, Weather, Terrain, and automatic effects: none

Imported Status moves default to `none` and receive a review warning unless structured source data identifies their defense.

## Range conversion

Default ranges:

- Contact or melee-tagged move: Melee 1
- Single-target projectile or beam: 6 squares
- Long-range-tagged move: 10 squares
- Self move: Self
- Field-wide Weather or Terrain move: Scene
- Burst, cone, line, wall, and Zone shapes use source metadata when available

Unstructured legacy text does not generate a guessed area. It receives a range-review warning.

## Recharge inference

Recharge considers the whole effect package rather than Power alone.

Default damaging moves:

- Power 0–80: At-Will
- Power 81–110: Cooldown
- Power 111–150: Encounter
- Power 151+: Expedition or Encounter with a serious drawback

Adjust upward one category for:

- strong reliable control
- large area
- major forced movement
- broad protection
- action denial
- automatic critical or maximized damage

Adjust downward one category for:

- meaningful recoil
- charge turn
- severe accuracy penalty
- user lock-in
- conditional use

Specific locked rules override inference:

- Protect-style negation: Cooldown
- 20% healing: Encounter unless narrow
- 35% healing: Encounter
- 50% healing: Expedition
- full healing: Expedition
- ordinary setup moves: At-Will or Cooldown
- major setup or team-wide setup: Encounter

All inferred recharge values carry an `inferred-recharge` tag until reviewed.

## Recoil, drain, and healing

Translate recognized percentages into structured effects:

- Recoil 10%, 25%, or 50%
- Drain healing 25% or 50% of damage dealt
- Healing 20%, 35%, 50%, or full

Unsupported fractions are preserved in text and marked for review.

## Conditions and secondary effects

Recognized condition names map to Commander condition slugs.

Chance-based secondary effects are represented with:

- condition slug
- source chance percentage
- automation state

The initial Commander rules engine may later convert source chance into a trigger roll or fixed threshold. The import does not discard the original chance.

## Ability conversion

Abilities preserve their full descriptive text.

Automatic classification suggestions:

- always-on text: Passive
- “when,” “after,” “upon,” or “whenever”: Triggered
- explicit response to an attack or effect: Reaction
- “may activate,” “as an action,” or commanded use: Activated
- form-changing, rule-replacing, or unique legendary effects: Special

Suggested power tier:

- narrow ribbon or resistance: Minor
- ordinary battle-facing ability: Standard
- broad action-economy, immunity, weather, terrain, or major damage ability: Major
- form-defining or legendary rule replacement: Signature

All prose-inferred classifications are reviewable.

## Item conversion

Items are classified by function before name.

Reliable automatic conversions include:

- Poké Balls
- healing medicine
- status medicine
- Berries
- TMs and Technical Records
- evolution stones
- Mega Stones
- common held type boosters
- choice-style held items
- defensive held items with direct stat effects

Complex items preserve their text and use Manual automation until reviewed.

Type boosters use Commander’s locked +2 flat damage rule unless a specific item is intentionally stronger.

## Evolution conversion

Evolution references use stable species slugs.

Recognized methods:

- level
- item
- friendship or Bond
- trade substitute
- location
- time
- known move
- party composition
- stat comparison
- sex
- weather
- story or special

Trade evolutions are imported with the original condition retained, but Commander presentation should expose Link Cable, ritual, Center service, bonded interaction, or catalyst substitutes.

## Forms

Regional forms are separate Species records when mechanically distinct.

Temporary battle forms are Form Profiles.

Mega profiles require:

- base species slug
- Mega Stone or catalyst slug
- transformed typing
- transformed stat line
- transformed ability
- artwork references when available

Dynamax and Gigantamax forms are excluded before conversion.

## Review flags

The converter may add the following tags:

- `review-required`
- `review-power`
- `review-accuracy`
- `review-range`
- `review-defense`
- `review-recharge`
- `review-effects`
- `review-automation`
- `variable-power`
- `fixed-damage`
- `special-resolution`
- `inferred-recharge`

Coverage reports count these flags so review work is measurable rather than hidden.

## Locked decisions

- Main-series stats convert at one Commander point per ten base-stat points
- Existing tabletop-scale stats remain intact
- Legacy Damage Base converts at ten Power per DB
- Main-series base Power remains unchanged
- Capture rate maps to Commander Difficulty bands
- Ambiguous effects are preserved and flagged, not invented
- Mega profiles replace the species contribution temporarily
- Dynamax and Gigantamax remain excluded
