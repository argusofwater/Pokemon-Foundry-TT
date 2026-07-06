# Player-Lite Rules Draft 0.1

## Design statement

This profile is not intended to erase tactical play. It moves complexity out of the player's hands and into consistent rules and Foundry automation.

The starting proposal below is deliberately conservative. It preserves the six Pokémon stats, move categories, typing, tactical maps, and individual species identity while reducing the number of derived values and exception chains.

## 1. Core check

Roll:

`1d20 + Rank + situational bonus`

Compare against a target number.

### Rank

Skills and combat proficiencies use five ranks:

- Untrained: +0
- Novice: +2
- Adept: +4
- Expert: +6
- Master: +8

This replaces several small bonuses with one visible competency value.

### Situational bonus vocabulary

Use only these common states:

- Favored: roll twice and keep the higher result.
- Hindered: roll twice and keep the lower result.
- Minor bonus or penalty: ±2.
- Major bonus or penalty: ±4.

Bonuses of the same name do not stack. Favored and Hindered cancel one-for-one.

## 2. Defenses

Replace Physical, Special, and Speed Evasion with two defenses:

- Guard: resistance to direct attacks, based on the better of Defense or Special Defense for the relevant move category.
- Reflex: resistance to area, trap, environmental, and status attacks, based primarily on Speed.

A move specifies which defense it targets. Foundry calculates the number.

Provisional formula:

- Guard = 10 + relevant defensive tier + bonuses
- Reflex = 10 + Speed tier + bonuses

Stat tiers are derived automatically from total stats. Players never calculate them manually.

### Why two defenses

One defense risks flattening fast and durable Pokémon into the same silhouette. Three evasions create excessive lookup. Two defenses preserve the distinction between enduring a hit and avoiding a danger.

## 3. Attack sequence

A standard attack follows one visible sequence:

1. Choose a move and target.
2. Foundry validates range, line of effect, and legal targeting.
3. Roll against Guard or Reflex.
4. On a hit, roll damage.
5. Foundry applies typing, resistance, conditions, and secondary effects.

No separate player-side evasion selection is required.

## 4. Combat stages

Replace seven independent combat-stage tracks with three temporary states:

- Boosted: +2 to checks using the affected stat family.
- Sharply Boosted: +4.
- Weakened: -2.
- Sharply Weakened: -4.

Physical Attack and Special Attack may remain separate where a move specifically cares about them. Defense effects map to Guard; Speed effects map to Reflex and movement.

Boosts do not accumulate point by point. Applying the same direction upgrades the state one step, to a maximum of ±4. Opposite effects cancel one step.

## 5. Damage

Keep Damage Base as move metadata but compress it into damage tiers.

Provisional tiers:

- Light: 1d6
- Standard: 2d6
- Heavy: 3d6
- Severe: 4d6
- Signature: 5d6

Add the relevant offensive tier. Subtract a small armor value derived from the relevant defense stat.

Foundry handles STAB and type effectiveness automatically.

### Type effectiveness

Use multipliers internally, but present the result plainly:

- Immune: 0 damage
- Resisted: half damage
- Normal: normal damage
- Super-effective: double damage
- Extreme interaction: cap at triple damage unless a specific boss or optional rule says otherwise

This limits explosive quadruple-weakness results while preserving type strategy.

## 6. Critical hits

A natural 20 is a critical hit.

Critical hits maximize one damage die and roll the remainder normally. This is faster and less volatile than doubling every component of a multi-layer damage formula.

Expanded critical ranges become a rare feature rather than a common stacking statistic.

## 7. Turns

Each creature receives:

- One Main Action
- One Move Action
- One Reaction per round
- Reasonable free interaction

Main Actions include attacking, using a major item, performing a complex maneuver, or commanding a Pokémon when command pressure matters.

Move Actions include movement, drawing or using simple gear, switching positions, and short tactical interactions.

Reactions replace Interrupt and most Priority exceptions.

### Trainer and Pokémon flow

Default mode:

- The trainer and active Pokémon share one initiative entry.
- Each receives a Move Action.
- The pair receives two Main Actions total, but no creature may normally take more than one Main Action.

This lets both trainer and Pokémon matter without creating two entirely separate turns per player.

A noncombat-focused trainer may spend their Main Action supporting, using an item, scanning, switching Pokémon, or assisting.

## 8. Conditions

Conditions use three templates:

- Save ends: attempt a save at the end of the affected creature's turn.
- Fixed duration: lasts until a stated turn boundary.
- Persistent: requires treatment, rest, or a specific action.

Conditions should avoid bespoke timing unless central to their identity.

## 9. Wounds instead of default injuries

Normal play uses Wounds:

- Gain one Wound when reduced to 0 HP.
- Gain one Wound from an exceptionally severe attack only when a feature explicitly says so.
- Each Wound reduces maximum HP by 10%.
- At 3 Wounds, the creature is seriously injured and cannot safely continue adventuring.
- At 5 Wounds, the creature is dying.

Classic PTR injuries remain available as an optional gritty module.

This removes repeated threshold checking and prevents a single attack from awarding multiple overlapping injury consequences.

## 10. Move frequency

Use four recharge categories:

- At-Will: no usage limit.
- Cooldown: unavailable until the end of the user's next turn.
- Encounter: once per encounter.
- Rest: once until a full rest or equivalent recovery.

Scene, Daily, Extended Action, and bespoke refresh language should be mapped into these categories unless the feature truly requires unique timing.

## 11. Pokémon progression

Pokémon continue to gain levels, but level-up choices are grouped:

- Automatic species progression
- One guided stat package
- Move choice when eligible
- Ability or edge choice only at milestone levels

Suggested stat packages:

- Striker
- Bulwark
- Swift
- Specialist
- Balanced

Advanced players may use manual stat allocation as an optional setting.

## 12. Trainer progression

A trainer chooses:

- Background
- Core role
- Specialty
- Talents at milestone levels

Provisional core roles:

- Ace: direct Pokémon improvement and command
- Field Expert: exploration, capture, medicine, and knowledge
- Tactician: positioning, reactions, and team coordination
- Combatant: trainer-side battle capability
- Mystic: supernatural or aura-based abilities
- Performer: morale, social influence, and contests

Specialties provide flavor and narrower mechanical identity without requiring long prerequisite chains.

## 13. Player-facing sheet target

The default Pokémon combat header should show only:

- HP and Wounds
- Guard
- Reflex
- Movement
- Attack tier
- Special Attack tier
- Four equipped moves
- Conditions and limited-use resources

Detailed stats, capabilities, breeding information, tutor lists, and automation diagnostics move to secondary tabs.

## Questions requiring playtest decisions

1. Should trainers and Pokémon share two Main Actions, or should the trainer primarily act through commands?
2. Should Guard use the relevant defensive stat, or should every Pokémon have one fixed Guard value?
3. Should super-effective damage remain ×2, or shift to bonus dice to reduce spikes?
4. Should Pokémon retain levels 1–100, compress to 1–20, or use milestone ranks?
5. How dangerous should trainers be when directly attacked?
6. Should capture be a combat action, a post-defeat procedure, or support both?

## Recommended first prototype

Implement only these changes for the first playable slice:

- Guard and Reflex
- Main, Move, Reaction
- Four recharge categories
- Wounds
- Compressed damage tiers
- One trainer and three representative Pokémon

Test with:

- A fast physical attacker
- A slow defensive Pokémon
- A special attacker with a status move

The prototype succeeds when a new player can complete a turn without opening a rulebook and can explain why the result occurred afterward.
