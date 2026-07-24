const FORM_FLAG_SCOPE = "ptu";
const FORM_FLAG_KEY = "commanderFormState";

function requirePokemon(actor) {
  if (!actor || actor.type !== "pokemon") throw new Error("Form changes can only be applied to Pokémon actors.");
}

function clone(value) {
  return foundry.utils.deepClone(value);
}

function getCurrentProfile(actor) {
  return {
    identity: {
      types: clone(actor.system.identity?.types ?? []),
      evolutionStage: actor.system.identity?.evolutionStage ?? "",
      speciesName: actor.system.identity?.speciesName ?? ""
    },
    stats: clone(actor.system.stats ?? {}),
    defenses: clone(actor.system.defenses ?? {}),
    loadout: {
      activeAbilityUuids: clone(actor.system.loadout?.activeAbilityUuids ?? [])
    },
    exploration: {
      capabilities: clone(actor.system.exploration?.capabilities ?? [])
    },
    img: actor.img,
    prototypeToken: {
      texture: { src: actor.prototypeToken?.texture?.src ?? actor.img },
      width: actor.prototypeToken?.width ?? 1,
      height: actor.prototypeToken?.height ?? 1
    }
  };
}

function statUpdate(profile, actor) {
  const update = {};
  for (const [key, value] of Object.entries(profile.stats ?? {})) {
    if (!actor.system.stats?.[key]) continue;
    update[`system.stats.${key}.species`] = Number(value);
  }
  return update;
}

function buildFormUpdate(actor, profile) {
  const currentHp = Number(actor.system.health?.hp?.value ?? 0);
  const currentMax = Math.max(1, Number(actor.system.health?.hp?.max ?? 1));
  const hpPercent = Math.clamp(currentHp / currentMax, 0, 1);
  const nextHpBase = Number(profile.stats?.hp ?? actor.system.stats?.hp?.species ?? currentMax);

  const update = {
    "system.identity.types": clone(profile.types ?? actor.system.identity?.types ?? []),
    "system.identity.evolutionStage": profile.name ?? actor.system.identity?.evolutionStage ?? "",
    "system.loadout.activeAbilityUuids": clone(profile.abilityUuids ?? actor.system.loadout?.activeAbilityUuids ?? []),
    "system.health.hp.value": Math.max(0, Math.round(nextHpBase * hpPercent)),
    ...statUpdate(profile, actor)
  };

  if (profile.portrait) update.img = profile.portrait;
  if (profile.token) update["prototypeToken.texture.src"] = profile.token;
  if (profile.tokenWidth) update["prototypeToken.width"] = profile.tokenWidth;
  if (profile.tokenHeight) update["prototypeToken.height"] = profile.tokenHeight;

  return update;
}

export async function resolveSpeciesItem(actor) {
  const speciesUuid = actor.system.identity?.speciesUuid;
  if (!speciesUuid) return null;
  const species = await fromUuid(speciesUuid);
  return species?.type === "species" ? species : null;
}

export async function findFormProfile(actor, formSlug) {
  const species = await resolveSpeciesItem(actor);
  if (!species) throw new Error(`${actor.name} is not linked to a Species compendium entry.`);
  const profile = species.system.forms?.find(form => form.slug === formSlug);
  if (!profile) throw new Error(`Form profile '${formSlug}' was not found for ${species.name}.`);
  return { species, profile };
}

export async function canActivateForm(actor, profile, { trainer = null, ignoreRequirements = false } = {}) {
  requirePokemon(actor);
  if (ignoreRequirements) return { allowed: true, reasons: [] };

  const reasons = [];
  const requirements = profile.requirements ?? {};
  const baseSlug = actor.system.identity?.speciesName?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "";

  if (requirements.baseSpeciesSlugs?.length && !requirements.baseSpeciesSlugs.includes(baseSlug)) {
    reasons.push("The actor does not match an eligible base species.");
  }

  if (requirements.itemSlug) {
    const held = actor.items.find(item => item.system?.slug === requirements.itemSlug || item.name === requirements.itemSlug);
    if (!held) reasons.push(`Required item '${requirements.itemSlug}' is not assigned to the actor.`);
  }

  if (requirements.trainerTalentSlug && trainer) {
    const talent = trainer.items.find(item => item.system?.slug === requirements.trainerTalentSlug);
    if (!talent) reasons.push(`Linked Trainer lacks '${requirements.trainerTalentSlug}'.`);
  }

  if (requirements.trainerItemSlug && trainer) {
    const item = trainer.items.find(entry => entry.system?.slug === requirements.trainerItemSlug);
    if (!item) reasons.push(`Linked Trainer lacks '${requirements.trainerItemSlug}'.`);
  }

  return { allowed: reasons.length === 0, reasons };
}

export async function activateForm(actor, formSlug, options = {}) {
  requirePokemon(actor);
  const currentState = actor.getFlag(FORM_FLAG_SCOPE, FORM_FLAG_KEY);
  if (currentState?.active) throw new Error(`${actor.name} already has an active form.`);

  const { species, profile } = await findFormProfile(actor, formSlug);
  const trainer = options.trainer ?? (actor.system.identity?.trainerUuid ? await fromUuid(actor.system.identity.trainerUuid) : null);
  const permission = await canActivateForm(actor, profile, { ...options, trainer });
  if (!permission.allowed) throw new Error(permission.reasons.join(" "));

  const snapshot = getCurrentProfile(actor);
  const state = {
    active: true,
    family: profile.family,
    formSlug: profile.slug,
    formName: profile.name,
    speciesUuid: species.uuid,
    activatedAt: Date.now(),
    snapshot
  };

  await actor.setFlag(FORM_FLAG_SCOPE, FORM_FLAG_KEY, state);
  await actor.update(buildFormUpdate(actor, profile), { diff: false, recursive: false });

  for (const token of actor.getActiveTokens(true, true)) {
    const tokenUpdate = {};
    if (profile.token) tokenUpdate["texture.src"] = profile.token;
    if (profile.tokenWidth) tokenUpdate.width = profile.tokenWidth;
    if (profile.tokenHeight) tokenUpdate.height = profile.tokenHeight;
    if (Object.keys(tokenUpdate).length) await token.document.update(tokenUpdate);
  }

  return { actor, profile, state };
}

export async function revertForm(actor) {
  requirePokemon(actor);
  const state = actor.getFlag(FORM_FLAG_SCOPE, FORM_FLAG_KEY);
  if (!state?.active || !state.snapshot) return false;

  const snapshot = state.snapshot;
  const currentHp = Number(actor.system.health?.hp?.value ?? 0);
  const currentMax = Math.max(1, Number(actor.system.health?.hp?.max ?? 1));
  const hpPercent = Math.clamp(currentHp / currentMax, 0, 1);
  const restoredMax = Math.max(1, Number(snapshot.stats?.hp?.final ?? snapshot.stats?.hp?.species ?? currentMax));

  const update = {
    "system.identity.types": clone(snapshot.identity.types),
    "system.identity.evolutionStage": snapshot.identity.evolutionStage,
    "system.loadout.activeAbilityUuids": clone(snapshot.loadout.activeAbilityUuids),
    "system.stats": clone(snapshot.stats),
    "system.defenses": clone(snapshot.defenses),
    "system.exploration.capabilities": clone(snapshot.exploration.capabilities),
    "system.health.hp.value": Math.max(0, Math.round(restoredMax * hpPercent)),
    img: snapshot.img,
    "prototypeToken.texture.src": snapshot.prototypeToken.texture.src,
    "prototypeToken.width": snapshot.prototypeToken.width,
    "prototypeToken.height": snapshot.prototypeToken.height
  };

  await actor.update(update, { diff: false, recursive: false });
  await actor.unsetFlag(FORM_FLAG_SCOPE, FORM_FLAG_KEY);

  for (const token of actor.getActiveTokens(true, true)) {
    await token.document.update({
      "texture.src": snapshot.prototypeToken.texture.src,
      width: snapshot.prototypeToken.width,
      height: snapshot.prototypeToken.height
    });
  }

  return true;
}

export function getActiveFormState(actor) {
  return actor.getFlag(FORM_FLAG_SCOPE, FORM_FLAG_KEY) ?? null;
}
