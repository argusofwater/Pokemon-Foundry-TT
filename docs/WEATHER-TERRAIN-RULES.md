# Weather, Terrain, and Zone Rules

## Locked design principles

- Only one global Weather effect is active at a time.
- Only one global Terrain effect is active at a time.
- Local Zones may coexist with global Weather and Terrain.
- Standard Weather and Terrain duration is 5 rounds unless an effect says otherwise.
- Natural environmental effects may last for the entire encounter.
- Entry-triggered Weather or Terrain normally lasts 3 rounds.
- Expedition-scale or legendary effects may last for the encounter.
- Weather and Terrain modify damage by adding or removing dice, never by multiplying total damage.
- Terrain primarily affects grounded creatures.
- Foundry tracks source, duration, affected actors, immunities, and automatic effects.

## Weather

A new global Weather replaces the current one unless a feature explicitly creates a localized version.

Each Weather should define:

- Broad environmental effect
- Offensive effect
- Defensive or tactical effect
- Move interactions
- Duration
- Source

### Sunlight

- Fire attacks gain +1 damage die.
- Water attacks lose 1 damage die.
- Ordinary darkness penalties are removed.
- Solar and plant-based moves may lose charge requirements.
- Healing from sunlight-based moves may increase by 10% maximum HP.
- Frozen recovery is Favored.

### Rain

- Water attacks gain +1 damage die.
- Fire attacks lose 1 damage die.
- Open flames and some Fire Zones are extinguished.
- Thunder-style attacks may become Favored.
- Water movement and Soaked interactions improve.

### Sandstorm

- Long-range perception and ranged attacks are Hindered past a defined distance.
- Rock, Ground, and Steel creatures ignore environmental penalties.
- Rock creatures may gain +2 Special Defense.
- Sandstorm should avoid universal automatic damage unless a specific encounter calls for it.

### Snow

- Ground may become difficult terrain.
- Ice attacks gain +1 damage die.
- Ice-adapted creatures ignore snow movement penalties.
- Frozen recovery may become Hindered.
- Fire effects can remove Snow or Ice Zones.

### Harsh Winds

- Ranged attacks and flying movement may be Hindered against the wind.
- Forced movement increases in the wind direction.
- Smoke, gas, and Fog Zones disperse faster.
- Direction should be displayed clearly in Foundry.

### Fog

- Vision and long-range attacks are limited.
- Attacks beyond a short range are Hindered.
- Hidden movement becomes easier.
- Sound, scent, aura, and special senses become more valuable.

### Strange Weather

Psychic Storm, Shadow Sky, Magnetic Field, Ashfall, Aurora, Time Distortion, and similar effects are bespoke boss or story mechanics rather than ordinary player weather.

## Terrain

A new global Terrain replaces the current one unless an effect explicitly creates a localized zone.

Flying, Levitating, or otherwise ungrounded creatures normally ignore Terrain unless the effect says otherwise.

### Electric Terrain

- Grounded creatures cannot normally be put to Sleep.
- Grounded Electric attacks gain +1 damage die.
- Electrified effects and conductive hazards become easier to trigger.

### Grassy Terrain

- Grounded creatures recover 5% maximum HP at end of turn.
- Grass attacks gain +1 damage die.
- Certain Ground attacks lose 1 damage die.
- Plant-based concealment, rooting, and healing improve.
- Terrain healing does not count against item-healing limits.

### Psychic Terrain

- Grounded creatures cannot be targeted by hostile Priority effects.
- Grounded Psychic attacks gain +1 damage die.
- Telepathy, prediction, and mental effects improve.

### Misty Terrain

- Grounded creatures gain resistance to Mental and Elemental conditions.
- Dragon attacks lose 1 damage die against grounded targets.
- Fairy attacks may gain +1 damage die where Fairy typing is supported.
- Recovery from Confusion, Fear, Charm, Burn, and Paralysis is Favored.

### Dark Terrain

Dark Terrain is optional and best reserved for bosses, dungeons, and specialties.

- Dark and Ghost attacks gain +1 damage die.
- Psychic attacks may lose 1 damage die.
- Concealment, Fear, and curse effects improve.

## Local Zones

Zones occupy marked areas and may be created by moves, abilities, hazards, or scenery.

Every Zone lists:

- Area
- Duration
- Entry effect
- Start-of-turn effect
- End-of-turn effect
- Removal method

Only one copy of the same Zone normally affects a creature at a time.

### Fire Zone

- Deals minor Fire damage on entry or start of turn.
- Ignites flammable objects.
- Water, Ice, or Rain can remove it.

### Ice Zone

- Counts as difficult terrain.
- Reflex checks are Hindered.
- Fire removes sections.
- Ice-adapted creatures ignore penalties.

### Water Zone

- Grounded creatures become Soaked when entering.
- Electric effects may spread or gain area.
- Fire damage loses 1 die.
- Water-adapted creatures gain movement benefits.

### Poison Cloud

- Entry or start of turn requires a defense or recovery check.
- Failure applies Poisoned.
- Wind disperses the Zone.
- Poison and Steel creatures may ignore it.

### Spikes

- Trigger when a grounded creature enters.
- Deal fixed minor damage or one damage die.
- Do not trigger repeatedly from movement within the same turn.
- Can be cleared by a Main Action, movement effects, wind, or suitable Ground moves.

## Elemental setup conditions

These conditions are optional tactical tools and are not automatically attached to every typed move.

### Soaked

- Fire damage loses 1 die.
- Electric damage gains 1 die.
- Ends after suitable Fire damage, drying, or encounter end.

### Chilled

- Movement is reduced by 2.
- The next Ice condition against the target is Favored.
- Specific effects may upgrade it to Frozen.

### Scorched

- The next Fire attack gains +1 damage die.
- Fire-resistant creatures may ignore it.
- Specific reapplication may cause Burned.

### Electrified

- Reflex is reduced by 2.
- Certain Electric attacks gain +1 damage die or chain.
- Ground effects remove it.

## Creating Weather, Terrain, and Zones

Typical costs:

- Main Action for global Weather or Terrain
- Encounter recharge for strong global effects
- Cooldown for weaker localized effects
- Expedition for legendary-scale effects

Trainer features may extend duration, move Zones, protect allies, prevent replacement, or convert global effects into localized ones.

## Competing effects

When a new Weather or Terrain begins:

- The previous effect ends.
- The new source becomes controller.
- Equal-strength effects replace one another automatically.
- Legendary effects may require a check or explicit permission to override.

Localized Zones may coexist.
