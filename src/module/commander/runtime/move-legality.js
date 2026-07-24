const UNIVERSAL_MOVE_SLUGS = new Set(["struggle"]);

export function normalizeMoveSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeLearnset(speciesOrSystem = {}) {
  const system = speciesOrSystem?.system ?? speciesOrSystem ?? {};
  const direct = Array.isArray(system.learnset) ? system.learnset : [];
  const legacyLevel = Array.isArray(system.moves?.level)
    ? system.moves.level.map(entry => ({
        moveSlug: entry.moveSlug ?? entry.slug ?? entry.name,
        method: "level",
        level: entry.level ?? 1,
        source: "legacy-level"
      }))
    : [];

  const merged = new Map();
  for (const entry of [...direct, ...legacyLevel]) {
    const moveSlug = normalizeMoveSlug(entry.moveSlug ?? entry.slug ?? entry.name);
    if (!moveSlug) continue;
    const method = String(entry.method ?? "level").toLowerCase();
    const normalized = {
      moveSlug,
      method,
      level: method === "level" ? Math.max(1, Number(entry.level ?? 1) || 1) : null,
      source: String(entry.source ?? "")
    };
    const current = merged.get(moveSlug);
    if (!current || method === "level" || (current.method !== "level" && normalized.source && !current.source)) {
      merged.set(moveSlug, normalized);
    }
  }
  return [...merged.values()];
}

export function starterMoveSlugs(speciesOrSystem, level = 1, limit = 6) {
  const maximum = Math.max(1, Number(limit) || 6);
  const levelMoves = normalizeLearnset(speciesOrSystem)
    .filter(entry => entry.method === "level")
    .sort((a, b) => a.level - b.level || a.moveSlug.localeCompare(b.moveSlug));
  const eligible = levelMoves.filter(entry => entry.level <= Math.max(1, Number(level) || 1));
  const candidates = eligible.length ? eligible : levelMoves.slice(0, maximum);
  return [...new Set(candidates.map(entry => entry.moveSlug))].slice(-maximum);
}

export function getEmbeddedSpeciesItem(actor) {
  const typed = actor?.itemTypes?.species?.[0];
  if (typed) return typed;
  const collection = actor?.items?.contents ?? actor?.items ?? [];
  const embedded = Array.from(collection).find(item => item?.type === "species");
  if (embedded) return embedded;
  return actor?._source?.items?.find?.(item => item?.type === "species") ?? null;
}

export function moveSlug(move) {
  return normalizeMoveSlug(move?.system?.slug ?? move?.slug ?? move?.name);
}

export function checkCanonicalMove(speciesOrSystem, move) {
  const slug = moveSlug(move);
  if (!slug) return { legal: false, slug, reason: "The move has no canonical slug." };
  if (UNIVERSAL_MOVE_SLUGS.has(slug)) return { legal: true, slug, method: "universal", level: null };

  const learnset = normalizeLearnset(speciesOrSystem);
  if (!learnset.length) {
    return { legal: false, slug, reason: "This Species record has no canonical learnset data." };
  }

  const entry = learnset.find(candidate => candidate.moveSlug === slug);
  if (!entry) return { legal: false, slug, reason: `${move?.name ?? slug} is not in this species' canonical learnset.` };
  return { legal: true, slug, method: entry.method, level: entry.level, source: entry.source };
}

export function checkActorMove(actor, move) {
  const species = getEmbeddedSpeciesItem(actor);
  if (!species) {
    return {
      legal: false,
      slug: moveSlug(move),
      reason: "This Pokémon has no embedded Species record, so move legality cannot be verified."
    };
  }
  return checkCanonicalMove(species, move);
}

export function availableCanonicalMoves(actor) {
  const species = getEmbeddedSpeciesItem(actor);
  if (!species) return [];
  const known = new Set(Array.from(actor?.itemTypes?.move ?? []).map(moveSlug).filter(Boolean));
  const level = Math.max(1, Number(actor?.system?.identity?.level ?? 1) || 1);
  return normalizeLearnset(species)
    .filter(entry => !known.has(entry.moveSlug))
    .map(entry => ({
      ...entry,
      available: entry.method !== "level" || entry.level <= level,
      requirement: entry.method === "level" ? `Level ${entry.level}` : entry.method
    }))
    .sort((a, b) => Number(b.available) - Number(a.available) ||
      (a.method === "level" ? 0 : 1) - (b.method === "level" ? 0 : 1) ||
      Number(a.level ?? 999) - Number(b.level ?? 999) ||
      a.moveSlug.localeCompare(b.moveSlug));
}
