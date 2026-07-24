# Abilities and Talents

## Ability format

Every ability uses the same fields:

- Type
- Trigger
- Effect
- Recharge
- Automation
- Tags

Example:

### Intimidate

- Type: Triggered
- Trigger: When this Pokémon enters battle
- Effect: One visible enemy within 6 squares becomes Weakened on Physical attacks until the end of its next turn
- Recharge: Encounter
- Automation: Foundry prompts the owner to choose a valid target
- Tags: Mental, Entry

## Ability types

Use five universal ability types:

- Passive
- Triggered
- Reaction
- Activated
- Special

Special abilities should remain rare and are primarily reserved for Legendary, boss, form-change, or campaign-defining effects.

## Recharge

Abilities use the same recharge language as moves:

- At-Will
- Cooldown
- Encounter
- Expedition

Passive abilities require no recharge unless they contain a triggered sub-effect.

## Ability power tiers

Abilities are classified by broad power budget:

- Minor
- Standard
- Major
- Signature

### Minor

Narrow, useful benefits such as one sense improvement, one movement adaptation, +2 to a specific recovery check, or ignoring one kind of difficult terrain.

### Standard

Meaningful combat effects such as an entry debuff, one defensive Reaction, one conditional damage die, or extending Weather by one round.

### Major

Encounter-shaping effects such as creating global Weather on entry, redirecting attacks, suppressing abilities, or restoring significant HP.

### Signature

Species-defining, Legendary-scale, or form-changing effects that may combine several systems.

## Ability design rules

- An ability should have one primary job.
- Abilities should use existing systems rather than creating private subsystems.
- Avoid passive arithmetic soup and narrow percentage clauses.
- Foundry should automate obvious triggers such as HP thresholds, switching, entry, fainting, Weather, Terrain, type matchups, conditions, and Zone entry.
- Players should receive prompts rather than perform manual bookkeeping.

## Species Talents

Species Talents represent natural traits, anatomy, habitat adaptations, instincts, and evolutionary behavior.

Examples include:

- Keen Nose
- Burrowing Claws
- Iron Shell
- Pack Hunter
- Amphibious
- Tiny Frame

Species Talents should feel biological rather than class-like.

## Training Talents

Training Talents represent what an individual Pokémon learned through practice and mentorship.

Examples include:

- Precise Striker
- Guarded Advance
- Elemental Focus
- Condition Specialist
- Mobile Caster
- Battle Recovery

Training Talents are the primary way players shape one Pokémon differently from another member of the same species.

## Pokémon Talent limits

Recommended normal progression:

- 1 Talent at low level
- 2 Talents by level 25
- 3 Talents by level 50
- 4 Talents by level 75
- 5 Talents by level 100

Evolution and major milestones may grant extra Species Talents when appropriate.

## Trainer Talent format

Trainer Talents list:

- Requirement
- Action or Trigger
- Effect
- Recharge
- Tags

Trainer Talents are divided into General Talents and Role Talent lists.

## General Trainer Talents

Examples:

- Quick Hands
- Field Medic
- Prepared
- Sharp Eye
- Durable

## Role Talent themes

### Ace

Pokémon growth, command, bond, switching, and move refinement.

Example Talents:

- Perfect Timing
- Refined Technique
- Trusted Partner
- Rapid Switch

### Field Expert

Capture, medicine, exploration, survival, and species knowledge.

Example Talents:

- Capture Setup
- Emergency Treatment
- Species Study
- Trailblazer

### Tactician

Movement, marks, timing, formations, and environmental control.

Example Talents:

- Reposition
- Focus Fire
- Hold the Line
- Counterplan

### Vanguard

Trainer-side combat, protection, endurance, and fighting beside Pokémon.

Example Talents:

- Interpose
- Heavy Guard
- Relentless
- Battle Partner

### Mystic

Aura, psychic power, spirits, supernatural senses, and elemental channeling.

Example Talents:

- Aura Sense
- Resonant Shield
- Spirit Bond
- Elemental Channel

### Performer

Morale, support, social influence, contests, reputation, and Momentum.

Example Talents:

- Inspire
- Encore
- Distracting Display
- Crowd Favorite

## Talent prerequisites

Avoid long chains.

A Talent may have one simple requirement such as Role, Specialty, trainer level, Pokémon level, or a related Talent.

Most Talents should be self-contained. Some may have one clear upgrade, such as Interpose and Improved Interpose.

## Ability suppression

A suppressed ability provides no benefit for the stated duration.

Suppression does not:

- Remove Species Talents
- Remove Training Talents
- Remove typing
- Undo permanent transformations
- Erase effects that already resolved

Abilities with the Innate tag cannot be suppressed. The Innate tag should be used sparingly.

## Copy, steal, and replace

### Copy

The copying creature gains the target ability temporarily. The original creature keeps it.

### Steal

The original creature loses the ability while the thief gains it.

### Replace

The target ability is replaced by another listed ability for the stated duration.

A creature may benefit from only one copied ability at a time unless a Signature effect says otherwise.

Foundry must track source, duration, and ownership of temporary abilities.

## Entry abilities

Abilities tagged Entry normally trigger once per encounter per creature.

Switching out and returning does not create unlimited repeated entry triggers unless an ability explicitly says otherwise.

A Talent may increase an Entry ability to twice per encounter.

## Form-change abilities

Form changes use a standard profile:

- Trigger
- Type changes
- Stat adjustments
- Move changes
- Ability changes
- Duration
- Reversion rule

Foundry should apply the profile to the existing actor rather than replacing the actor.

Examples include Castform, Darmanitan, Aegislash, Wishiwashi, Minior, Mega Evolution, regional forms, battle forms, and Legendary forms.

## Foundry automation requirements

Foundry should support:

- Trigger detection
- Reaction prompts
- Recharge tracking
- Entry-use limits
- Temporary ability source and duration
- Suppression state
- Copy, steal, and replacement state
- Talent prerequisites
- Form profile application and reversion
- Clear chat-card explanations for every automatic modifier

## Locked decisions

- Five ability types
- Four recharge categories
- Four ability power tiers
- Species Talents for natural traits
- Training Talents for learned development
- General and Role trainer Talent lists
- Minimal prerequisites
- Five normal Pokémon Talents by level 100
- Entry abilities trigger once per encounter by default
- Standard suppression, copying, stealing, and replacement language
- Standardized form-change profiles
- Foundry automation for obvious triggers and temporary states
