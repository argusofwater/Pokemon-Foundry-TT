# Items, Equipment, TMs, Tutors, and Evolution Access

## Held Items

A Pokémon may normally equip one Held Item.

Held Items use five categories:

- Offensive
- Defensive
- Utility
- Recovery
- Transformation

Each Held Item lists:

- Passive effect
- Trigger, if any
- Recharge, if any
- Tags
- Automation

### Offensive Held Items

Typed boosting items such as Charcoal, Mystic Water, and Magnet grant +2 flat damage to moves of the matching type.

Choice items may grant +1 damage die but restrict the holder to the first damaging move used until switching or encounter end.

Critical-range items such as Scope Lens may expand critical range to 19–20. Expanded critical ranges do not stack.

### Defensive Held Items

Examples include:

- Leftovers: recover 5% maximum HP at end of turn while conscious
- Focus Sash: when at full HP, remain at 1 HP instead of falling to 0; consumed on use
- Assault Vest: +2 Special Defense and no Status moves
- Eviolite: unevolved Pokémon capable of further evolution gain +2 Physical Defense and +2 Special Defense

### Utility Held Items

Examples include:

- Quick Claw
- Wide Lens
- Grip Claw
- Shed Shell

### Recovery Held Items

Berries and similar items usually trigger automatically and are consumed.

Examples include:

- Sitrus Berry: below half HP, recover 20% maximum HP
- Lum Berry: immediately remove one removable condition
- Mental Herb: remove one Mental condition or hostile command effect

### Transformation Held Items

Transformation items include Mega Stones, Primal Orbs, Drives, Memories, Plates, and form-specific relics.

They may unlock a form profile instead of granting an ordinary passive bonus.

## Held Item rules

- Held Items normally change during Camp Rest, Full Rest, training, or a suitable out-of-combat scene.
- Changing a Held Item during combat costs a Main Action and normally requires trainer adjacency.
- Duplicate instances of the same item do not stack.
- Effects with the same purpose do not stack unless explicitly allowed.
- Suppression disables an item without destroying or unequipping it.

## Trainer equipment

Trainer equipment uses slots:

- Outfit
- Accessory
- Tool
- Weapon
- Pack

A trainer may carry more gear than this, but only slotted equipment grants persistent mechanical benefits.

### Outfit

Examples:

- Field Jacket
- Reinforced Coat
- Stealth Suit

### Accessory

Examples:

- Communication Earpiece
- Safety Goggles
- Aura Charm

### Tool

Examples:

- Medical Kit
- Capture Kit
- Research Scanner
- Climbing Gear

### Weapon

Trainer weapons use a concise profile:

- Damage Power
- Attack attribute
- Range
- Tags
- Special effect

Trainer weapons remain useful without overshadowing Pokémon.

### Pack

Packs organize expedition gear and may increase carrying capacity or grant one small expedition benefit.

Examples:

- Medic Pack
- Survival Pack
- Research Pack
- Capture Pack
- Engineer Pack

## Inventory and Bulk

Use Bulk instead of detailed weight:

- Tiny item: 0 Bulk
- Normal item: 1 Bulk
- Heavy item: 2 Bulk
- Bulky item: 3 Bulk

Trainer carrying capacity is:

`5 + Body`

Small consumables may be bundled, such as five Poké Balls or three Potions counting as 1 Bulk.

## TMs and Technical Records

### Standard TMs

- Reusable
- Add the move to the Pokémon's archived move library
- Do not automatically equip the move
- Require compatibility and training time or Camp Rest

### Technical Records

- Consumable
- Usually stronger, rarer, or more specialized

### Prototype and Custom TMs

Prototype TMs may have restrictions or side effects.

Custom TMs may be created through research, crafting, or tutoring.

### Compatibility

Compatibility may depend on:

- Species learnset
- Type affinity
- Anatomy
- Trainer Talent
- Research breakthrough
- Story permission

Foundry should show:

- Compatible
- Conditionally compatible
- Incompatible
- Unknown

## Move Tutors

Tutors teach moves through time, payment, favors, or story requirements.

Tutors may teach:

- Rare moves
- Regional moves
- Egg moves
- Signature techniques
- Modified move variants

### Tutor Modifications

A Tutor may modify one existing move by:

- Increasing range by 1
- Changing shape
- Adding a minor secondary effect
- Removing a drawback
- Converting damage category
- Adding a Zone interaction
- Changing recharge

A move normally has only one Tutor Modification unless a Talent says otherwise.

## Evolution items and catalysts

Evolution access includes:

- Stones
- Held evolution items
- Trade substitutes
- Location catalysts
- Bond catalysts
- Time catalysts
- Move catalysts

Evolution requires:

- Eligible species
- Required catalyst
- Player consent
- Safe conditions unless the evolution is intentionally dramatic or story-triggered

Evolution never occurs automatically merely because a numerical threshold was reached.

### Trade evolution substitutes

Trade evolutions may use:

- Link Cable item
- Exchange ritual
- Pokémon Center procedure
- Bonded trainer interaction
- Special energy catalyst

## Crafting

Crafting is optional and uses three disciplines:

- Medicine
- Technology
- Natural Craft

Each recipe lists:

- Materials
- Time
- Relevant Rank
- Tool or facility
- Difficulty

Crafting may create:

- Healing items
- Specialized Poké Balls
- Field tools
- Food and berries
- Environmental gear
- Custom TMs
- Evolution catalysts

Failure usually wastes time or some materials rather than creating a catastrophic result unless the recipe is experimental.

## Item rarity

Use five rarity bands:

- Common
- Uncommon
- Rare
- Exceptional
- Unique

Price and availability are separate.

## Economy

Use either broad cost bands or Pokédollar ranges.

Suggested bands:

- Cheap
- Standard
- Expensive
- Major Purchase
- Restricted

Availability may also depend on:

- Settlement size
- License
- Reputation
- Faction access
- Research access
- League rank
- Story permission

## Storage and inventory state

Items use three inventory locations:

- Carried
- Stored
- Assigned

Stored items do not count against Bulk.

## Foundry automation requirements

Foundry should automatically:

- Track item quantities
- Reduce consumables on use
- Apply healing limits
- Trigger berries and similar items
- Track medical supplies
- Distinguish reusable TMs from consumable Technical Records
- Display compatibility
- Track item slots and assignment
- Separate carried, stored, and assigned items
- Enforce Bulk and carrying capacity
- Apply suppression and restoration of Held Item effects
- Track one Tutor Modification per move

## Locked decisions

- One Held Item per Pokémon
- Five Held Item categories
- Flat bonuses for typed Held Items
- Automatic consumable berries
- Trainer equipment slots
- Bulk instead of detailed weight
- Reusable standard TMs
- Consumable Technical Records
- Archived moves instead of permanent forgetting
- One Tutor Modification per move by default
- Evolution requires player consent
- Trade-evolution substitutes
- Five rarity bands
- Automatic Foundry inventory and consumable tracking
