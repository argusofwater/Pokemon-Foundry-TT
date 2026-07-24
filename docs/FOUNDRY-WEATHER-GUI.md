# Foundry Weather, Terrain, and Zone GUI Requirements

## Purpose

Create a dedicated Foundry interface that automatically tracks global Weather, global Terrain, and local Zones without requiring players or the GM to manage durations and modifiers manually.

## Global control panel

The scene should expose a compact environmental panel showing:

- Current Weather
- Current Terrain
- Remaining rounds
- Source actor or effect
- Controller
- Strength or override priority where relevant
- Active global modifiers
- Quick access to end, replace, extend, or inspect the effect

The panel should be visible to players in read-only form and editable by the GM or authorized owners.

## Automatic tracking

The GUI must automatically:

- Decrease Weather and Terrain duration each round
- End expired effects
- Replace the previous global effect when a new one begins
- Apply and remove damage-die modifiers
- Apply and remove condition recovery modifiers
- Detect grounded, flying, levitating, and immune actors
- Track effect source and ownership
- Refresh token and sheet displays immediately
- Post concise chat messages when effects begin, change, or end

## Weather display

Weather should display:

- Name and icon
- Remaining duration
- Direction when relevant, such as Harsh Winds
- A short summary of active rules
- Type-damage changes
- Visibility or movement changes
- Special move interactions

## Terrain display

Terrain should display:

- Name and icon
- Remaining duration
- Whether a selected token is grounded and affected
- Type-damage changes
- Healing, condition, Priority, or movement effects

## Zone tools

Zones should be placeable on the canvas through templates, drawings, or dedicated zone tools.

Each Zone should track:

- Shape and area
- Source
- Duration
- Entry effect
- Start-of-turn effect
- End-of-turn effect
- Removal conditions
- Immunities

The GUI should automatically detect token entry, exit, and turn timing.

## GM controls

The GM should be able to:

- Apply Weather or Terrain from a searchable list
- Set custom duration
- Mark an effect as natural, encounter-long, or permanent
- Override normal replacement rules
- Create custom environmental effects
- Move or resize Zones
- Pause automatic resolution
- End an effect immediately

## Player controls

Authorized players should be able to:

- Activate Weather, Terrain, or Zones from owned moves and abilities
- Inspect active effects
- See exactly why damage dice, movement, defenses, or condition checks changed

Players should not need to manually enter modifiers already supplied by the environment.

## Integration requirements

The environmental GUI must integrate with:

- Damage-pool construction
- Type effectiveness
- Conditions
- Movement
- Vision
- Initiative and round tracking
- Move recharge
- Trainer Talents
- Pokémon abilities
- Chat cards

## Design principle

The interface should make the battlefield state obvious at a glance. Environmental complexity may remain rich, but its bookkeeping belongs to Foundry rather than the table.
