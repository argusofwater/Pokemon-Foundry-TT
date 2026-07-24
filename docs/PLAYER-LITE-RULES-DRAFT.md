# Player-Lite Rules Draft 0.2

## Design statement

This rules profile is player-light rather than rules-light. Tactical positioning, species identity, typing, moves, trainer expression, evolution, and levels remain important. Foundry carries the arithmetic, targeting logic, defense selection, type interactions, recharge tracking, and progression bookkeeping.

Players should make meaningful decisions without needing to manually operate the machinery beneath them.

## 1. Core check

Roll:

`1d20 + Rank + situational modifier`

Ranks:

- Untrained: +0
- Novice: +2
- Adept: +4
- Expert: +6
- Master: +8

Standard situational language:

- Favored: roll twice and keep the higher result
- Hindered: roll twice and keep the lower result
- Minor bonus or penalty: ±2
- Major bonus or penalty: ±4

Bonuses of the same name do not stack. Favored and Hindered cancel one-for-one.

## 2. Defenses

Pokémon retain separate defenses:

- Physical Defense
- Special Defense
- Reflex

Foundry automatically selects the correct defense from the move or effect:

- Physical moves use Physical Defense
- Special moves use Special Defense
- Hazards, traps, environmental effects, area avoidance, and suitable status effects use Reflex

Players do not manually choose the defense for an attack.

## 3. Attack sequence

A normal attack resolves as follows:

1. Choose a move and target.
2. Foundry checks range, targeting, line of effect, and legality.
3. Roll the attack against the automatically selected defense.
4. Foundry builds the damage pool.
5. Roll damage.
6. Foundry applies conditions and secondary effects.

## 4. Damage engine

Foundry calculates damage using:

- Move Power
- Relevant offensive stat
- Relevant defensive stat
- Type interaction
- STAB
- Optional modifiers

### Move Power conversion

Move Power converts to a base d6 pool:

- Power 1–30: 1d6
- Power 31–50: 2d6
- Power 51–70: 3d6
- Power 71–90: 4d6
- Power 91–110: 5d6
- Power 111–130: 6d6
- Power 131–150: 7d6
- Power 151+: 8d6

Status moves deal no normal damage unless specifically written to do so.

### Offensive stat versus defensive stat

Foundry compares the relevant offensive and defensive stats:

- Offense below 50% of Defense: -2 dice
- Offense from 50% to 79% of Defense: -1 die
- Offense from 80% to 124% of Defense: no change
- Offense from 125% to 199% of Defense: +1 die
- Offense at 200% or more of Defense: +2 dice

Physical moves compare Attack to Defense. Special moves compare Special Attack to Special Defense unless a move explicitly uses different stats.

### Type interaction

Type effectiveness changes the damage pool instead of multiplying total damage:

- Immune: 0 damage
- Double resistance: -2 dice
- Resistance: -1 die
- Neutral: no change
- Super-effective: +1 die
- Double weakness: +2 dice

A damaging move retains at least 1 die unless the target is immune.

### STAB

Same-Type Attack Bonus adds a flat bonus equal to +2 damage per final damage die.

### Optional modifiers

Abilities, items, weather, terrain, trainer features, and special effects should use standardized adjustments:

- Add or remove dice
- Add a flat bonus
- Upgrade or downgrade the move Power band
- Add a status or secondary effect
- Ignore one resistance step
- Reroll one or more dice
- Maximize one or more dice

Normal features should not multiply total damage.

### Critical hits

A natural 20 is a critical hit.

On a critical hit, maximize one damage die and roll the remaining dice normally. Expanded critical ranges should remain rare.

## 5. Combat stages

Replace long stage ladders with four states:

- Boosted: +2
- Sharply Boosted: +4
- Weakened: -2
- Sharply Weakened: -4

Repeated effects move the state one step. Opposite effects cancel one step. Attack, Special Attack, defenses, and Speed may still be affected separately when the move specifically cares about them.

## 6. Action economy

A trainer and active Pokémon share one initiative slot.

The pair receives:

- 2 Main Actions
- 2 Move Actions

Each individual may normally use:

- 1 Main Action
- 1 Move Action
- 1 Reaction per round

A Main Action may be converted into a Move Action. Move Actions cannot become Main Actions. Reactions cannot be converted.

### Main Actions

Examples include:

- Use a damaging or major status move
- Use a major item
- Attempt capture
- Switch Pokémon
- Use a major trainer feature
- Make a direct trainer attack
- Perform a complex environmental action
- Revive or heavily treat an ally

### Move Actions

Examples include:

- Move up to the listed movement value
- Draw or stow equipment
- Stand from Prone
- Mount or dismount
- Use simple terrain
- Take cover
- Make a basic scan or observation

### Reactions

Reactions replace most Interrupt and Priority timing. They may be used for:

- Interception
- Opportunity attacks
- Defensive abilities
- Priority effects
- Protect-style effects
- Emergency commands
- Reactive switching features

### Commands

Basic commands are free. Special commands that grant bonuses, movement, recovery, accuracy, damage, or coordinated tactics cost actions as written.

### Switching

Switching Pokémon costs one Main Action. The incoming Pokémon may use its Move Action and Reaction, but may not normally use a Main Action that turn.

### Trainer protection

A hostile Pokémon may not directly target a trainer while that trainer has an active, conscious Pokémon. The trainer becomes targetable when no active Pokémon is present or capable of protecting them.

Trainers may still be affected by hostile humans, traps, hazards, environmental effects, and explicit bypass abilities.

## 7. Movement and opportunity attacks

Each creature lists its movement modes, such as Walk, Fly, Swim, Burrow, or Climb.

- Diagonal movement costs one square per square
- Difficult terrain costs 2 movement per square
- Forced movement does not trigger opportunity attacks unless a feature says otherwise

A creature may spend its Reaction to make a basic opportunity attack when an adjacent enemy willingly leaves its reach.

## 8. Conditions

Every condition lists:

- Effect
- Duration
- Recovery
- Category

Condition categories:

- Physical
- Mental
- Elemental
- Positioning

Duration templates:

- Save Ends
- Fixed Duration
- Persistent

Conditions do not stack with themselves unless specifically designed to. Reapplication either refreshes duration, upgrades severity, or triggers an immediate effect, not all three.

Conditions should alter choices rather than erase turns.

### Core condition direction

- Burned: reduce Physical damage by one die, minimum 1 die, and take minor ongoing fire damage
- Poisoned: take recurring damage at end of turn
- Badly Poisoned: recurring damage escalates to a cap
- Paralyzed: halve movement and reduce Reflex by 2
- Frozen: movement becomes 0; attacks and Reflex checks are Hindered; regular recovery attempts remain available
- Asleep: unconscious; attacks against the target are Favored; recovery improves after failed attempts and damage grants an immediate attempt
- Confused: attacks are Hindered and failed checks restrict hostile targeting without automatic self-damage
- Flinched: lose Reaction until the start of the next turn
- Prone: adjacent attacks are Favored, ranged attacks are Hindered, and standing costs movement
- Restrained: movement 0 and Physical actions Hindered
- Slowed: movement halved
- Marked: uses one system-wide interpretation rather than separate class-specific versions

Allies may spend a Main Action to assist recovery through treatment, calming, breaking restraints, applying an item, or using an appropriate feature.

## 9. Wounds

Wounds replace the default repeating injury-threshold system.

- Gain one Wound when reduced to 0 HP
- Certain severe abilities may inflict a Wound directly
- At 1 Wound: no automatic penalty
- At 2 Wounds: Hindered on strenuous physical actions
- At 3 Wounds: seriously injured and unable to continue safely after the encounter
- At 4 Wounds: unconscious
- At 5 Wounds: dying

Classic PTR injuries may remain as an optional gritty campaign module.

## 10. Recharge categories

Use four standard recharge categories:

- At-Will
- Cooldown
- Encounter
- Expedition

Cooldown effects normally return at the end of the user's next turn. Encounter effects refresh when the encounter ends. Expedition effects refresh after substantial rest or recovery defined by the campaign.

## 11. Trainer progression

Trainers use levels 1–20.

A trainer is built from:

1. Background
2. Role
3. Specialty
4. Talents

### Trainer attributes

- Body
- Agility
- Mind
- Presence

### Core Roles

- Ace
- Field Expert
- Tactician
- Vanguard
- Mystic
- Performer

### Backgrounds

Backgrounds grant skill training, one utility feature, equipment or contacts, and a narrative benefit. They do not define the trainer's full combat identity.

### Specialties

Specialties narrow a Role into a specific fantasy, such as Type Specialist, Ranger, Medic, Commander, Weather Strategist, Martial Artist, Guardian, Aura Adept, Coordinator, or similar themes.

### Talents

Talents replace long feature chains and most prerequisite taxes. Talents should be self-contained, immediately useful, and rarely dependent on another Talent.

### Progression cadence

- Level 1: Background, Role, Specialty, starting Role feature, starting Specialty feature
- Even levels: skill improvement or utility choice
- Odd levels after 1: Talent
- Levels 5, 10, 15, and 20: major Role and Specialty advancements

### Skills

Use approximately fifteen consolidated skills:

- Athletics
- Acrobatics
- Endurance
- Stealth
- Perception
- Survival
- Medicine
- Technology
- Pokémon Lore
- Nature
- Investigation
- Influence
- Deception
- Performance
- Focus

No separate Edge and Feature currencies. Cross-role Talents replace traditional multiclassing.

Sheet layout is intentionally deferred until the rules are stable.

## 12. Pokémon progression

Pokémon retain levels 1–100 and the six core stats:

- HP
- Attack
- Defense
- Special Attack
- Special Defense
- Speed

### Automatic growth

Stat growth is automatic and based on species, level, Training Path, and Nature. Players do not manually assign a point every level unless using the optional Custom path.

### Training Paths

- Striker
- Specialist
- Bulwark
- Swift
- Balanced
- Custom

### Natures

Natures provide one Favored growth category, one Hindered growth category, and a personality cue. Foundry applies the growth adjustments automatically.

### Milestones

Meaningful choices occur at milestone levels rather than every level. Milestone choices may include:

- Stat emphasis
- New or upgraded ability
- Bonus move
- Movement or capability improvement
- Species Talent
- Training Talent
- Training Path refinement

### Evolution

Evolution remains species-specific and may depend on level, item, bond, location, time, move, story, or player choice. Evolution updates species data while preserving the Pokémon's Training Path and build.

### Abilities

Pokémon begin with one species ability and may gain up to three active abilities at higher levels. Abilities use standardized tags such as Passive, Triggered, Reaction, Encounter, and Expedition.

### Moves

A Pokémon may have:

- Four equipped combat moves
- Two reserve moves
- An archived move library

Moves are not permanently forgotten unless the player chooses to erase them. Changing equipped moves normally requires rest, training, a feature, or an item.

### Pokémon Edges

Pokémon Edges are converted into:

- Species Talents
- Training Talents
- Capability upgrades
- Milestone improvements

### Bond

Bond uses four states:

- Wary
- Trusting
- Bonded
- Devoted

Bond supports fiction and limited mechanics without becoming a second detailed experience track.

### Advancement mode

Campaigns may use XP advancement or milestone advancement.

## 13. Capture system

Capture may occur during combat or after combat.

Core roll:

`1d20 + Capture Rank + Ball Bonus + HP Modifier + Status Modifier + Momentum + other modifiers`

versus:

`10 + Species Difficulty`

### Species Difficulty

- Common: +0
- Uncommon: +2
- Rare: +4
- Exceptional: +6
- Legendary: +10
- Restricted: no normal capture roll without story permission

### HP modifier

- Above 75% HP: -4
- 51% to 75% HP: -2
- 26% to 50% HP: +0
- 1% to 25% HP: +2
- 0 HP: +4

### Status modifier

Only the strongest status bonus applies:

- Minor condition: +1
- Major condition: +2
- Asleep, Frozen, or fully Restrained: +3

### During combat

Throwing a Poké Ball costs one Main Action.

On failure:

- The ball is consumed
- The target remains active
- The trainer gains +1 Capture Momentum against that target, maximum +3

Momentum ends when the target escapes, the encounter ends, another trainer captures it, the trainer changes targets, or the trainer rolls a natural 1.

A natural 20 succeeds unless capture is narratively impossible. A natural 1 fails and resets Momentum.

### Post-combat capture

A Pokémon at 0 HP or peacefully subdued may be captured after combat, but capture is not automatic. Relevant treatment, empathy, handling, or social checks may grant +2, Favored, or automatic capture for a cooperative Pokémon.

Normally only one forced post-combat capture attempt is allowed.

### Poké Balls

Standard balls:

- Poké Ball: +0
- Great Ball: +2
- Ultra Ball: +4
- Master Ball: automatic success when legally usable

Specialized balls usually grant +3 when their condition applies and +0 otherwise, sometimes with a small secondary effect.

Examples include Net, Dusk, Dive, Heavy, Fast, Level, Friend, Heal, Luxury, Quick, Timer, Repeat, Nest, Moon, and crafted regional balls.

### Wild and boss tags

Special Pokémon may use visible tags:

- Stubborn
- Territorial
- Intelligent
- Bonded
- Legendary
- Story-Protected

These create narrative capture requirements without hiding extreme numerical bonuses.

## 14. Current locked principles

- Player-light, not rules-light
- Foundry handles arithmetic and rules lookup
- Separate Physical, Special, and Reflex defenses remain
- Type advantage adds or removes damage dice
- Pokémon remain level 1–100
- Trainers remain protected from direct Pokémon attacks while an active Pokémon is present
- Capture works during or after combat
- Capture uses one clear roll
- Trainer progression uses Background, Role, Specialty, and Talents
- Pokémon progression uses automatic growth, Training Paths, milestones, and four equipped moves
- Sheet design waits until the rules stabilize

## 15. Next design area

Healing, rest, recovery, Pokémon Centers, fainting, condition treatment, Wound recovery, medicine, and expedition pacing.
