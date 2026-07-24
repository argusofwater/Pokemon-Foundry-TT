# Commander Build Character Sheet Architecture

## Feasibility

The full Trainer and Pokémon sheet system described here is technically feasible in Foundry V13, but it must be implemented in stages.

The recommended order is:

1. Define actor and item schemas
2. Build Trainer and Pokémon MVP sheets
3. Add drag-and-drop compendium support
4. Add roll dialogs and chat cards
5. Add action, recharge, condition, and effect automation
6. Add team, environment, expedition, and downtime widgets
7. Add advanced campaign tabs and responsive layouts

## Shared design principles

Trainer and Pokémon sheets use the same visual grammar:

- Important combat information remains visible
- Common actions are one click away
- Advanced information lives in tabs or expandable panels
- Derived values are calculated automatically
- Compendium entries support drag-and-drop
- Every modifier can explain its source
- Play Mode prevents accidental edits
- Edit Mode exposes configuration and GM fields

## Shared header

Both sheets include:

- Portrait
- Name
- Actor type
- Level
- Owner
- Current and maximum HP
- Wounds
- Conditions
- Initiative
- Active, Stored, Juvenile, Egg, or Fainted state
- Quick-roll control
- Sheet lock or mode toggle

Pokémon headers also include Species, typing, Bond, Held Item, and active Trainer link.

Trainer headers also include Background, Role, Specialty, active Pokémon link, and Reputation summary.

## Trainer sheet tabs

- Overview
- Skills
- Talents
- Pokémon Team
- Inventory
- Exploration
- Social
- Downtime
- Biography
- Effects

## Trainer Overview

The Overview tab serves as the command center.

It includes:

- Identity and progression
- Body, Agility, Mind, and Presence
- Physical Defense, Special Defense, and Reflex
- HP, Wounds, Fatigue, and Conditions
- Remaining Main, Move, and Reaction resources
- Shared Trainer-Pokémon action pool
- Active Pokémon card
- Pinned Talents
- Equipment slots
- Consumable and campaign resources

## Trainer Skills

Each skill row shows:

- Skill name
- Rank
- Linked attribute
- Situational modifiers
- Final bonus
- Roll button
- Favorite toggle

Skill rolls support Favored, Hindered, minor and major modifiers, assistance, environmental modifiers, and target number.

Chat cards must explain the complete roll breakdown.

## Trainer Talents

Talent cards show:

- Name
- Source
- Action or trigger
- Recharge
- Tags
- Effect
- Use control
- Pin control
- Automation state

Automation states are:

- Automatic
- Prompted
- Manual
- Unsupported

## Pokémon Team

Team cards show:

- Portrait
- Name
- Species
- Level
- Type
- HP
- Wounds
- Bond
- Active or storage state
- Held Item
- Conditions
- Quick actions

Supported states include Active, Party, Reserve, Stored, Injured, Egg, and Juvenile.

## Trainer Inventory

Inventory categories include:

- Equipped
- Consumables
- Poké Balls
- Medicine
- Tools
- Weapons
- Packs
- TMs and Technical Records
- Evolution Items
- Crafting Materials
- Quest Items

Each row supports quantity, Bulk, slot, assigned actor, rarity, use, transfer, and storage state.

## Trainer Exploration

The Exploration tab tracks:

- Expedition name and Progress
- Current role
- Supply Units
- Fatigue
- Weather and Terrain
- Travel interval
- Hazards
- Discoveries
- Research subjects
- Knowledge tiers
- Pokémon assistants

## Trainer Social

The Social tab tracks:

- Faction Reputation
- Contacts
- Disposition
- Goals
- Leverage
- Social Progress
- Patience
- Promises and favors

## Trainer Downtime

The Downtime tab tracks:

- Available Downtime Actions
- Active projects
- Facilities
- Group base access
- Crafting queue
- Research queue
- Training queue
- Recovery tasks

## Pokémon sheet tabs

- Overview
- Moves
- Abilities
- Talents
- Growth
- Equipment
- Bond
- Exploration
- Effects
- Biography

## Pokémon Overview

The Overview tab includes:

- Name, Species, level, evolution stage, typing
- Nature and Training Path
- Bond and active Trainer
- Held Item
- Six core stats
- Physical Defense, Special Defense, and Reflex
- HP, Wounds, Conditions, Fatigue
- Action and Reaction state
- Recharge summary
- Four equipped move cards

Each stat exposes final value first and a breakdown on demand.

## Pokémon Moves

Move sections are:

- Equipped
- Reserve
- Archived
- Available to Learn

The sheet enforces four equipped moves and two reserve moves.

Move cards show:

- Type
- Category
- Power
- Accuracy
- Range
- Area
- Target defense
- Recharge
- Tags
- Conditions
- Zone effects
- Contest tags
- Tutor Modification
- Automation state

Damage preview should show the complete pool construction before use.

Example:

- Base 3d6
- Attack versus Defense +1 die
- Super-effective +1 die
- STAB +10
- Final 5d6 + 10

## Pokémon Abilities

Ability cards show:

- Ability type
- Trigger
- Recharge
- Power tier
- Tags
- Suppression state
- Temporary source
- Use or prompt control

Copied, replaced, stolen, or temporary abilities require clear visual markings.

## Pokémon Talents

Sections include:

- Species Talents
- Training Talents
- Capability upgrades
- Milestone choices

## Pokémon Growth

Growth tools include:

- Current level
- XP or milestone mode
- Next milestone
- Training Path
- Nature
- Growth preview
- Evolution eligibility
- Level-up confirmation preview

Custom Path may expose manual choices, but normal paths calculate growth automatically.

## Pokémon Equipment

This tab manages:

- Held Item
- Item suppression
- Transformation item
- Mount gear
- Training gear
- Assigned equipment

## Pokémon Bond

This tab tracks:

- Bond level
- Caregiver
- Milestones
- Important memories
- Trust conditions
- Loyalty complications
- Care actions

## Pokémon Exploration

This tab tracks:

- Capabilities
- Movement modes
- Senses
- Mount status
- Expedition assistance
- Egg or Juvenile state
- Incubation or development Progress
- Research data

## Shared Effects tab

Effect categories include:

- Conditions
- Combat stages
- Weather
- Terrain
- Zones
- Talents
- Items
- Temporary abilities
- Form changes
- Fatigue
- Social effects

Each effect row shows source, duration, remaining rounds, modifiers, and controls to remove, pause, or inspect.

## Sidebar widgets

Planned compact widgets:

### Combat widget

- Active Trainer-Pokémon pair
- Remaining actions
- Reaction state
- Cooldowns
- Conditions
- Capture Momentum

### Environment widget

- Weather
- Terrain
- Zones
- Remaining duration
- Environmental modifiers

### Team widget

- Active Pokémon
- Party HP
- Quick switching
- Conditions
- Stored or invalid-state warnings

### Expedition widget

- Progress
- Supplies
- Fatigue
- Roles
- Weather
- Travel interval

## Responsive behavior

Narrow layouts prioritize:

1. Quick actions
2. HP and Conditions
3. Active Pokémon
4. Moves
5. Talents
6. Advanced metadata

## Minimum viable implementation

### Trainer MVP

- Header
- Attributes
- Skills
- Defenses
- HP, Wounds, and Conditions
- Action tracker
- Active Pokémon
- Team list
- Inventory
- Talents

### Pokémon MVP

- Header
- Six stats
- Defenses
- HP, Wounds, and Conditions
- Four equipped moves
- Abilities
- Held Item
- Bond
- Talents

### Shared MVP

- Drag-and-drop
- Roll buttons
- Damage preview
- Active Effects
- Recharge tracking
- Action tracking

## Locked decisions

- Separate Trainer and Pokémon actor sheets
- Shared visual grammar and header conventions
- Overview-first layouts
- Tab structures defined in this document
- Shared action tracker
- Four-move Pokémon combat panel
- Damage preview with full modifier explanation
- Drag-and-drop compendium support
- Play Mode and Edit Mode
- Compact sidebar widgets
- Responsive narrow-display support
- MVP-first development before advanced campaign tabs

## Implementation note

This architecture is a development target, not a claim that every feature already exists in code. The first working milestone should be a functional Trainer MVP and Pokémon MVP backed by stable Foundry document schemas.
