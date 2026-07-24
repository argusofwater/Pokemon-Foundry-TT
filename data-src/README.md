# Commander Build Source Data

This directory contains normalized authoring data used to generate Foundry compendium documents.

## Directories

- `species/` standard species and permanent mechanical forms
- `forms/` temporary form profiles such as Mega Evolution
- `moves/` move definitions
- `abilities/` ability definitions
- `items/` Held Items, Berries, medicine, Poké Balls, TMs, evolution items, and equipment
- `talents/` Trainer and Pokémon Talents
- `evolutions/` optional shared evolution rules and lookup data
- `compatibility/` learnset and compatibility overlays
- `localization/` generated or maintained display text

JSON files may contain either one object or an array of objects.

## Common record fields

```json
{
  "schemaVersion": 1,
  "name": "Display Name",
  "slug": "stable-slug",
  "description": "Rules text",
  "tags": ["searchable", "tags"],
  "rulesProfile": "commander",
  "source": {
    "dataset": "source-name",
    "sourceId": "source-record-id",
    "generation": 1
  },
  "automation": {
    "state": "manual",
    "handler": "",
    "notes": ""
  }
}
```

## Excluded content

Records tagged with any of the following are excluded automatically:

- `dynamax`
- `gigantamax`
- `max-move`
- `gmax-move`
- `dynamax-only`
- `gigantamax-only`

Dynamax and Gigantamax form families are rejected by validation.

## Stable references

Authoring records reference each other by slug. The generator assigns deterministic 16-character Foundry document IDs and resolves pack documents consistently between builds.

Never reference generated Foundry `_id` values in source data.

## Commands

```bash
npm run compendium:validate
npm run compendium:build
```

Generated canonical documents and coverage reports are written to:

`build/commander-compendiums/`

The generated JSON and JSONL files are intermediate artifacts. A later packaging stage will import them into Foundry LevelDB compendium packs.
