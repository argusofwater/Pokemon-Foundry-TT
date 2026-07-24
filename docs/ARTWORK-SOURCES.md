# Commander Build Artwork Sources

Commander Build uses sprites fetched from the public `PokeAPI/sprites` repository for this private, noncommercial tabletop system.

## Source

- Repository: `PokeAPI/sprites`
- Imported content: Pokémon front sprites and item sprites
- Import method: `tools/commander/fetch-pokeapi-artwork.mjs`
- Pinning: every import records the exact upstream commit SHA and source URL in `temp/compendium-translated/artwork/artwork-manifest.json`

## Ownership and fan-project notice

Pokémon, Pokémon character names, and related imagery are trademarks and copyrights of Nintendo, Game Freak, Creatures, and The Pokémon Company. Commander Build is an unofficial, private, noncommercial fan project. It is not affiliated with, sponsored by, or endorsed by those companies.

The fetched assets are retained only for the private Foundry system and should not be repackaged as a standalone sprite archive.

## Asset paths

```text
static/assets/commander/
├── pokemon/
├── forms/
└── items/
```

Foundry document paths use:

```text
systems/ptu/assets/commander/...
```

## Reproducibility

Run:

```bash
npm run artwork:fetch-pokeapi
```

The importer:

1. resolves the current `PokeAPI/sprites` commit,
2. matches translated species and forms against PokeAPI Pokémon identifiers,
3. downloads local PNG assets,
4. enriches staging records with Foundry image paths,
5. records source URLs, hashes, byte sizes, and missing-asset entries.

Missing sprites remain visible in the generated report rather than silently receiving an incorrect image.
