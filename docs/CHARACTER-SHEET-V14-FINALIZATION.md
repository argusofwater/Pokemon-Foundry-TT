# Commander Build Character Sheets: Foundry V14 Finalization

## Target platform

The character sheets target Foundry Virtual Tabletop Version 14.

Implementation should use Foundry V14 public APIs and avoid private or underscore-prefixed internals whenever practical.

Primary technical targets:

- V14-native Actor and Item DataModels
- V14 ApplicationV2-based sheet architecture where supported by the system stack
- Public document, compendium, Active Effect, combat, Region, and Region Behavior APIs
- Schema-versioned migrations
- V14 manifest compatibility

Version 13 support is not a design requirement.

## Actor types

The Commander Build requires two primary actor types:

- Trainer
- Pokémon

Additional actor types may be added later for Vehicle, Group Base, or Encounter Controller, but they are not required for the first sheet milestone.

Egg and Juvenile states remain Pokémon lifecycle states rather than separate actor types unless implementation testing proves a separate type materially cleaner.

## Item document types

The sheet architecture assumes embedded Item documents for:

- Move
- Ability
- Talent
- Held Item
- Trainer Equipment
- Consumable
- Poké Ball
- TM
- Technical Record
- Evolution Item
- Capability
- Condition Template
- Project
- Research Subject

Some world-level campaign records may later use Journal, Active Effect, Region Behavior, or dedicated application data rather than embedded Items.

## Sheet framework

Trainer and Pokémon sheets should share a Commander sheet base class responsible for:

- Play Mode and Edit Mode
- Tab state
- drag-and-drop normalization
- item-card rendering
- source breakdown popovers
- roll-dialog integration
- Active Effect display
- action-state display
- responsive layout behavior
- permission-aware editing

Trainer and Pokémon sheets then extend the shared base with actor-specific preparation and event handling.

## Rendering strategy

The first implementation should favor predictable maintainability over visual cleverness.

Recommended structure:

- one primary sheet application per actor type
- reusable partial templates for headers, cards, tabs, effect rows, resource meters, and action controls
- CSS variables for the Commander palette and semantic colors
- data attributes for roll, use, equip, activate, transfer, pin, inspect, and delete actions
- minimal direct DOM mutation outside normal render cycles

The sheet must remain usable without optional UI modules.

## Visual language

Use an original creature-adventure palette rather than official game branding.

Suggested semantic palette:

- Commander red: warnings, health danger, destructive actions
- Commander blue: navigation, defenses, information, active tabs
- Commander gold: milestones, selected states, bond, rare resources
- Neutral slate: ordinary panels and text
- Green: recovery and ready states
- Violet: psychic, mystical, or temporary-source states

Do not ship official logos, official fonts, copyrighted interface art, or copied proprietary card layouts.

## Shared header contract

Both actor sheets must show without tab changes:

- portrait
- name
- actor type
- level
- ownership state
- current and maximum HP
- Wounds
- major Conditions
- initiative
- lifecycle or deployment state
- Play/Edit toggle
- quick roll or quick action control

Trainer-specific header fields:

- Background
- Role
- Specialty
- active Pokémon
- compact Reputation indicator

Pokémon-specific header fields:

- Species
- types
- Nature
- Training Path
- Bond
- Held Item
- linked Trainer

## Data presentation rules

Final values are always shown before construction details.

Every derived value should support an inspectable source breakdown containing:

- base value
- species or role contribution
- level contribution
- Training Path or Specialty contribution
- Nature contribution
- equipment contribution
- Talent and Ability contribution
- Active Effect contribution
- situational contribution
- final result

Players should never be forced to infer why a value changed.

## Editing and permissions

Play Mode:

- prioritizes rolling and using actions
- prevents accidental deletion or structural edits
- hides most schema-level metadata
- permits ordinary resource changes such as HP where ownership allows

Edit Mode:

- exposes draggable slots and configuration controls
- permits item assignment and loadout changes
- exposes progression and source metadata
- shows GM-only fields only to authorized users

The sheet mode is a user preference and does not replace Foundry document permissions.

## Trainer sheet final tab order

1. Overview
2. Team
3. Skills
4. Talents
5. Inventory
6. Exploration
7. Social
8. Downtime
9. Effects
10. Biography

Team moves ahead of Skills because active-Pokémon management is a more common table action.

On narrow layouts, Overview and Team must remain the easiest tabs to reach.

## Pokémon sheet final tab order

1. Overview
2. Moves
3. Abilities
4. Talents
5. Growth
6. Equipment
7. Bond
8. Exploration
9. Effects
10. Biography

## Trainer Overview final layout

Desktop layout uses three functional regions:

### Identity and defenses

- level and progression
- Background, Role, Specialty
- four attributes
- three defenses
- HP, Wounds, Fatigue, and Conditions

### Command center

- shared pair action pool
- trainer action state
- active Pokémon card
- switch control
- quick item control
- capture control
- assist and stabilize controls

### Pinned resources

- pinned Talents
- equipped gear
- Poké Balls
- healing resources
- medical supplies
- expedition supplies
- Downtime Actions when relevant

## Pokémon Overview final layout

Desktop layout uses three functional regions:

### Identity and growth

- Species
- level
- evolution stage
- typing
- Nature
- Training Path
- Bond
- Trainer link

### Combat profile

- six final stats
- three defenses
- HP and Wounds
- Conditions
- action and Reaction state
- recharge summary

### Move dock

- exactly four equipped move cards
- compact damage preview
- use control
- recharge state
- target-defense label
- warning state for illegal or unavailable use

## Move loadout behavior

Pokémon support:

- four equipped moves
- two reserve moves
- unlimited archived moves

Drag-and-drop rules:

- dropping onto an empty equipped slot equips the move
- dropping onto an occupied slot offers swap or replace
- moving between equipped and reserve respects slot limits
- archived moves cannot be used directly in combat
- loadout changes outside approved rest or feature contexts generate a warning or require GM override

No move document is destroyed merely because it leaves the equipped loadout.

## Damage preview behavior

The move card should provide a preview without requiring a target and an exact calculation once a target is selected.

Preview may show:

- base Power band
- attack stat
- likely damage category
- STAB eligibility
- Weather and Terrain adjustments
- Held Item adjustments

Targeted calculation should additionally show:

- selected defense
- stat-ratio dice adjustment
- type interaction
- target effects
- final dice and flat damage

The chat card must preserve this breakdown after the roll.

## Action tracker behavior

Trainer and active Pokémon share:

- two Main Actions
- two Move Actions

Each individual may use no more than:

- one Main Action
- one Move Action
- one Reaction

The sheet must display both the shared pool and individual limits.

The action tracker should reset through combat-turn hooks and support GM correction.

Switching must update the linked active Pokémon without deleting either actor or rewriting team ownership.

## Effects behavior

The Effects tab is the human-readable control surface for Active Effects and Commander state records.

Each row should show:

- name
- category
- source
- duration type
- remaining duration
- mechanical summary
- paused or suppressed state
- inspect control
- authorized remove control

Weather, Terrain, and local Zones may be world or scene state rather than actor-owned Active Effects. The sheet displays their impact but should not duplicate their source records onto every actor.

## Drag-and-drop contracts

Supported drops include:

- compendium Item to actor
- actor-owned Item between legal sheet slots
- Pokémon actor onto Trainer team area
- Item onto assigned Pokémon or equipment slot
- condition or effect template onto actor

Every drop handler must validate:

- document type
- ownership
- compatibility
- slot capacity
- duplicate rules
- current sheet mode
- rest or timing restrictions

Invalid drops should produce a clear notification rather than silently failing.

## Team management contract

Trainer team cards use actor UUID references rather than copied Pokémon data.

Team states:

- Active
- Party
- Reserve
- Stored
- Injured
- Egg
- Juvenile

The Trainer sheet must not allow Stored, Egg, or Juvenile Pokémon to become combat-active without an authorized override and explanatory warning.

Deleting a team link must not delete the Pokémon actor.

## Inventory contract

Inventory supports:

- quantity
- Bulk
- carried, stored, or assigned state
- equipment slot
- assigned actor UUID
- consumable state
- rarity
- availability

The sheet calculates Bulk from carried items only.

Assigned items remain visible in the Trainer inventory and on the assigned actor where appropriate, but ownership must not be duplicated through separate item copies unless the implementation explicitly creates one canonical embedded Item and one read-only reference.

## Ability and Talent automation labels

Every Ability and Talent displays one automation status:

- Automatic
- Prompted
- Manual
- Unsupported

Unsupported content remains usable through text and manual controls. The sheet must never hide a feature because automation is incomplete.

## Responsive rules

Desktop:

- multi-column Overview layouts
- expanded cards
- side-by-side action and resource panels

Medium width:

- two-column layout
- collapsible secondary panels

Narrow width:

- single-column layout
- sticky HP and action header
- horizontally scrollable tab navigation
- move cards remain full-width tappable controls
- destructive controls move into contextual menus

Minimum usable width should be tested around 420 CSS pixels.

## Accessibility

The sheets should include:

- keyboard-focusable controls
- visible focus states
- meaningful labels and titles
- icon-plus-text for critical actions
- color-independent state indicators
- adequate contrast
- reduced-motion respect where animation is used

Type, condition, and recharge information must not rely on color alone.

## Performance boundaries

The sheet should not query every compendium during every render.

Use cached or indexed lookups for:

- species references
- move compatibility
- Talent prerequisites
- item assignment
- type data

Large archived move libraries and inventories should use collapsed sections, filtered lists, or deferred rendering.

## V14 lifecycle and migration requirements

Actor and Item system data must carry a schema version.

Migrations must be:

- idempotent
- version-gated
- logged
- safe to run in test worlds
- capable of handling missing optional fields

Before any destructive migration, the system should warn the GM to back up the World.

## First code milestone

The first installable V14 sheet milestone is complete when:

### Trainer acceptance criteria

- a Trainer actor can be created
- header renders without console errors
- attributes, skills, defenses, HP, Wounds, and Conditions display
- skill roll creates a readable chat card
- a Pokémon actor can be linked through UUID
- active Pokémon can be changed safely
- basic inventory items can be dropped and displayed
- Play/Edit mode works

### Pokémon acceptance criteria

- a Pokémon actor can be created
- Species, level, typing, Nature, and Training Path display
- six stats and three defenses display
- four equipped move slots and two reserve slots function
- a move can be dropped from a compendium
- damage preview renders
- Ability, Talent, Bond, Held Item, HP, Wounds, and Conditions display
- Play/Edit mode works

### Shared acceptance criteria

- no uncaught errors during ordinary sheet use
- drag-and-drop rejects invalid content clearly
- data survives closing and reopening the sheet
- permissions prevent unauthorized structural edits
- sheets remain usable at narrow width
- the package installs and loads in Foundry V14

## Deferred after MVP

The following are explicitly deferred until the MVP is stable:

- full Expedition widget
- full Social and Reputation dashboard
- automated Downtime queues
- contest-scoring interface
- breeding and incubation dashboard
- vehicle sheet and chase interface
- advanced form-change editor
- automatic compatibility browser
- polished animation and sound

## Final locked sheet decisions

- Foundry V14 is the sole initial platform target
- Trainer and Pokémon remain separate Actor types
- shared base sheet behavior is required
- UUID references link Trainers and Pokémon
- final values appear before breakdown details
- Overview and Team are the primary Trainer workflows
- Overview and Moves are the primary Pokémon workflows
- four equipped and two reserve move limits are enforced
- drag-and-drop is validated and permission-aware
- Play Mode and Edit Mode are distinct
- incomplete automation never hides usable content
- responsive and accessible behavior is part of acceptance, not optional polish
- MVP acceptance criteria govern the first implementation milestone
