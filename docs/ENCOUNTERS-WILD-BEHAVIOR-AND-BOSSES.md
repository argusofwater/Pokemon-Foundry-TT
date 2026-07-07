# Encounters, Wild Behavior, Trainer Battles, and Bosses

## Encounter types

The Commander Build supports four primary encounter types:

- Wild encounters
- Trainer battles
- Boss encounters
- Environmental encounters

All encounter types use the same core combat rules. Their differences come from behavior, goals, morale, team structure, environmental pressure, and victory conditions.

## Encounter difficulty

Use five broad difficulty bands:

- Trivial
- Standard
- Hard
- Severe
- Boss

Difficulty considers:

- Number of opposing actions
- Pokémon level
- Evolution stage
- Abilities and Talents
- Type matchups
- Terrain advantage
- Healing access
- Reinforcements
- Capture complications
- Whether trainers can be directly threatened

Action count is one of the strongest predictors of difficulty.

## Threat values

Use Threat as a simple encounter-building scaffold.

Suggested starting values:

- Minor wild Pokémon: 1 Threat
- Standard wild Pokémon: 2 Threat
- Strong or evolved Pokémon: 3 Threat
- Elite Pokémon: 4 Threat
- Trainer with active Pokémon: 3 Threat
- Boss phase: 5 Threat

For four trainers, suggested starting totals are:

- Trivial: 4–5 Threat
- Standard: 6–8 Threat
- Hard: 9–11 Threat
- Severe: 12–14 Threat
- Boss: 15+ Threat or special boss mechanics

These values are provisional and should be refined through playtesting and Foundry telemetry.

## Wild Pokémon behavior

Every wild Pokémon or wild group should define:

- Temperament
- Goal
- Morale
- Instinct package
- Escape condition

Wild Pokémon do not automatically behave like trained tournament battlers.

## Temperaments

### Timid

- Avoids direct conflict
- Uses cover and escape options
- Retreats when injured
- May accept food or calming attempts

### Territorial

- Defends a fixed area
- Refuses to pursue far beyond its territory
- Becomes more aggressive near nests, dens, or young
- May stop fighting once intruders leave

### Aggressive

- Seeks immediate confrontation
- Uses damaging moves early
- May overextend
- Rarely retreats before half HP

### Protective

- Defends another creature, object, or location
- Intercepts and uses control effects
- Prioritizes threats to its ward
- May stop once the protected target is safe

### Curious

- Tests opponents rather than fighting to the end
- Uses varied moves
- Observes reactions
- May disengage after learning enough
- Is often easier to befriend after the encounter

### Predatory

- Hunts isolated or weakened targets
- Prefers ambushes
- Avoids strong formations
- Retreats if the hunt becomes too costly

### Intelligent

- Uses deliberate tactics
- Exploits type matchups and terrain
- May target support trainers where legal
- May negotiate, deceive, or coordinate

## Encounter goals

Wild encounters should have goals beyond reducing all opponents to 0 HP.

Examples:

- Protect a nest
- Steal food
- Escape capture
- Drive intruders away
- Reach an injured ally
- Control territory
- Test a trainer
- Recover an item
- Survive a hazard
- Hunt one target
- Delay the party

## Morale

Wild Pokémon use three morale states:

- Steady
- Shaken
- Breaking

### Shaken

A wild Pokémon may become Shaken when:

- Reduced below half HP
- An ally faints
- Its goal becomes impossible
- It suffers a major weakness hit
- Its leader falls

A Shaken creature may retreat, hide, surrender, become easier to calm, or take one desperate action depending on temperament.

### Breaking

A low-HP, isolated, or leaderless wild Pokémon may flee unless it is Territorial, Protective, Enraged, Cornered, or controlled by a stronger creature.

Foundry should prompt the GM when morale triggers occur.

## Wild group initiative

- Minor wild Pokémon may share initiative by species group.
- Elite creatures roll separately.
- Leaders roll separately.
- Bosses use their own initiative structure.

## Wild combat roles

Wild groups may use behavioral roles:

- Bruiser
- Skirmisher
- Controller
- Support
- Ambusher
- Leader

A group should usually combine two or three roles rather than duplicate one pattern across every creature.

## Trainer battles

Opposing trainers follow the same core rules as player trainers:

- Shared trainer-Pokémon initiative
- Two Main Actions per pair
- Two Move Actions per pair
- One Reaction for trainer and one for Pokémon
- Switching costs a Main Action
- Trainers are protected while an active conscious Pokémon remains present

NPC trainers should not secretly use a different action economy.

## Trainer battle formats

### Single Battle

One active Pokémon per trainer.

### Double Battle

Two active Pokémon per side.

Each trainer gains:

- One additional Pokémon Main Action
- One additional Pokémon Move Action
- One additional Pokémon Reaction

The trainer still has only one personal Main Action, one Move Action, and one Reaction.

### Team Battle

Multiple trainers share one side and each operates normally.

### Gauntlet

One side faces multiple trainers sequentially with limited recovery.

### League Match

Formal restrictions may include:

- Team size
- Item limits
- Arena boundaries
- Capture prohibition
- Switching rules
- Fainting rules

## NPC trainer templates

NPC trainers should use templates instead of full player builds.

Each trainer template includes:

- Role
- Specialty
- Trainer Tier
- Two to four Talents
- One signature tactic
- Team theme
- Limited item loadout

## Trainer tiers

### Rookie

- 1–2 Pokémon
- One Talent
- Basic items
- Simple tactics

### Capable

- 2–3 Pokémon
- Two Talents
- One specialized item
- Uses switching intelligently

### Veteran

- 3–5 Pokémon
- Three Talents
- Strong team identity
- One environmental tactic

### Elite

- Full team
- Four Talents
- Signature ability
- Advanced switching
- Strong item use

### Champion

- Full curated team
- Unique tactical rule
- Multiple battle phases or arena control

## NPC switching behavior

Suggested switch triggers:

- Severe type disadvantage
- Active Pokémon below one-quarter HP
- Reserve Pokémon can exploit Weather or Terrain
- A Talent rewards switching
- A planned combo requires it

Foundry may suggest switches, but the GM retains control.

## Boss encounters

Bosses must resist being flattened by player action economy through mechanics rather than only inflated HP.

Boss power may come from:

- Multiple turns or off-turn actions
- Extra Reactions
- Phases
- Environmental control
- Summoned allies
- Interrupt thresholds
- Objective pressure

## Boss action structure

Recommended baseline:

- One normal turn
- One Boss Action after every two player turns
- Two Reactions per round
- One phase mechanic
- Resistance to complete shutdown from one condition

### Boss Actions

Boss Actions are shorter than full Main Actions and may include:

- Move half Speed
- Use a minor attack
- Create or move a Zone
- Clear one minor condition
- Command a minion
- Change stance
- Trigger terrain
- Mark a target

## Boss phases

Bosses may have two or three phases.

Phase changes may trigger from:

- HP threshold
- Wound gained
- Objective completed
- Body part destroyed
- Weather changed
- Minion defeated
- Story event

A phase may change:

- Move loadout
- Ability
- Type
- Form
- Terrain
- Behavior
- Vulnerability
- Objective

Foundry should apply phase profiles automatically.

## Boss Condition Resistance

Bosses should not be universally immune to conditions.

The first time each round a boss would gain a major condition, it may choose one:

- Downgrade the condition
- Shorten it to one round
- Spend a Boss Reaction to ignore it
- Convert it into a minor penalty

## Boss Wounds

Bosses may use Wounds as phase triggers instead of following the ordinary collapse sequence.

Example:

- 1 Wound: armor breaks
- 2 Wounds: enraged phase
- 3 Wounds: final phase
- 4 Wounds: defeated
- 5 Wounds: lethal or story-specific outcome

## Boss objectives

Boss encounters may require:

- Breaking sustaining crystals
- Rescuing trapped Pokémon
- Surviving until Weather ends
- Preventing escape
- Shutting down machinery
- Cleansing corrupted Zones
- Protecting civilians
- Capturing instead of defeating
- Forcing a form change
- Activating arena controls

Objectives should weaken the boss, halt reinforcements, or change phases.

## Minions

Minions use simplified rules:

- One or two useful moves
- One passive trait
- Low HP
- No Wound tracking
- Faint at 0 HP
- Share initiative
- Often act in groups

Minions create pressure and movement without generating large amounts of bookkeeping.

## Reinforcements

Reinforcements should arrive through visible triggers such as:

- Round number
- Alarm activation
- Leader below half HP
- Nest disturbed
- Weather changed
- Enemy escaped

Foundry should support public or hidden reinforcement timers.

## Retreat and surrender

Retreat is a valid encounter outcome.

A creature may escape by:

- Reaching an escape edge
- Using a movement ability
- Succeeding on an escape check
- Breaking line of sight
- Negotiating
- Surrendering

Enemies do not always fight to unconsciousness, and players may retreat without special punishment beyond the fiction.

## Capture legality

Wild encounters use the normal capture rules.

Trainer battles normally prohibit capture unless:

- The opposing trainer consents
- The Pokémon is abandoned
- The story explicitly permits intervention
- The encounter permits capture
- The ball targets an unclaimed wild Pokémon

Foundry should track ownership and capture legality.

## Victory conditions

An encounter ends when the opposing side:

- Faints
- Flees
- Surrenders
- Loses its objective
- Is captured
- Is calmed
- Is separated from what it protects
- Can no longer meaningfully resist

## Rewards

Encounter rewards may include:

- Pokémon XP
- Trainer advancement
- Items
- Reputation
- Research data
- Capture access
- Tutor access
- Evolution catalysts
- Faction favor
- Environmental resources

## Foundry encounter tools

The encounter interface should track:

- Difficulty estimate
- Threat total
- Action-count comparison
- Wild temperament
- Morale
- Encounter goal
- Escape condition
- Reinforcement timers
- Boss phases
- Boss Actions
- Minion groups
- Capture legality
- Environmental effects
- Victory conditions

The GM should be able to build encounters by dragging entries from the compendium.

## Locked decisions

- Four encounter types
- Threat-based difficulty scaffold
- Wild temperament, goal, morale, instinct, and escape condition
- Group initiative for minor wild Pokémon
- Wild combat roles
- Symmetrical trainer battle rules
- NPC trainer tiers and templates
- Boss Actions, phases, and Condition Resistance
- Minions without Wounds
- Visible reinforcement triggers
- Retreat and surrender support
- Multiple victory conditions
- Foundry encounter-builder automation
