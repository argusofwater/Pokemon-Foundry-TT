import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderFriendshipService } from "../runtime/friendship-service.js";
import { CommanderRollService } from "../runtime/roll-service.js";
import { COMMANDER_BACKGROUNDS, optionList, roleOptions, specialtyOptions } from "../config/trainer-options.js";

function resolveApplication(target, fallback) {
  return target?.closest?.(".application")?.application ?? fallback;
}

const MAX_TEAM_SIZE = 6;
const RANK_BONUSES = Object.freeze({ untrained: 0, novice: 2, adept: 4, expert: 6, master: 8 });
const ATTRIBUTE_LABELS = Object.freeze({ body: "Body", agility: "Agility", mind: "Mind", presence: "Presence" });
const TALENT_TYPES = new Set(["talent", "feat", "edge"]);
const INVENTORY_TYPES = new Set(["item", "equipment", "consumable"]);
const EXPEDITION_ROLES = Object.freeze([
  ["", "Unassigned"], ["guide", "Guide"], ["scout", "Scout"], ["quartermaster", "Quartermaster"],
  ["medic", "Medic"], ["researcher", "Researcher"], ["handler", "Handler"]
]);
const SOCIAL_STANCES = Object.freeze([
  ["hostile", "Hostile"], ["unfriendly", "Unfriendly"], ["neutral", "Neutral"], ["friendly", "Friendly"], ["devoted", "Devoted"]
]);
const DOWNTIME_CATEGORIES = Object.freeze([
  ["training", "Train"], ["bonding", "Bond"], ["research", "Research"], ["crafting", "Craft"],
  ["treatment", "Treat"], ["earning", "Earn"], ["networking", "Network"], ["facility", "Facility Work"]
]);
const DOWNTIME_SKILLS = Object.freeze({ training: "focus", bonding: "influence", research: "investigation", crafting: "technology", treatment: "medicine", earning: "influence", networking: "influence", facility: "technology" });

function signed(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function talentSummary(item, pinnedUuids) {
  const system = item.system ?? {};
  const prerequisites = system.prerequisites ?? system.requirements ?? system.prerequisite ?? "";
  return {
    item,
    action: system.actionType ?? system.action?.type ?? system.activation?.type ?? "Passive",
    frequency: system.recharge?.category ?? system.frequency ?? system.usage ?? "At-Will",
    prerequisites: Array.isArray(prerequisites) ? prerequisites.join(", ") : prerequisites,
    description: system.description ?? system.effect ?? system.summary ?? "",
    isPinned: pinnedUuids.includes(item.uuid)
  };
}

function inventorySummary(item) {
  const system = item.system ?? {};
  const quantity = Math.max(0, Number(system.quantity ?? 1) || 0);
  const bulk = Math.max(0, Number(system.bulk ?? 0) || 0);
  return {
    item, quantity, bulk, totalBulk: quantity * bulk,
    category: system.category ?? item.type ?? "item",
    rarity: system.rarity ?? "common",
    slot: system.slot ?? "",
    consumedOnUse: Boolean(system.consumedOnUse),
    description: system.description ?? system.effect ?? system.summary ?? "",
    automationState: system.automation?.state ?? "manual"
  };
}

function downtimeDefaults() {
  return { category: "training", project: "", progress: 0, goal: 5, notes: "", lastResult: "" };
}

function biographyDefaults() {
  return {
    pronouns: "",
    age: "",
    hometown: "",
    occupation: "",
    appearance: "",
    personality: "",
    ideals: "",
    bonds: "",
    flaws: "",
    goals: "",
    history: "",
    trainerCreed: "",
    allies: "",
    rivals: "",
    notes: ""
  };
}

export class CommanderTrainerSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-trainer-sheet"],
    position: { width: 980, height: 800 },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      setActivePokemon: CommanderTrainerSheet.setActivePokemon,
      removePokemon: CommanderTrainerSheet.removePokemon,
      openPokemon: CommanderTrainerSheet.openPokemon,
      rollSkill: CommanderTrainerSheet.rollSkill,
      togglePinnedTalent: CommanderTrainerSheet.togglePinnedTalent,
      postTalent: CommanderTrainerSheet.postTalent,
      useInventoryItem: CommanderTrainerSheet.useInventoryItem,
      adjustItemQuantity: CommanderTrainerSheet.adjustItemQuantity,
      postInventoryItem: CommanderTrainerSheet.postInventoryItem,
      adjustExpeditionResource: CommanderTrainerSheet.adjustExpeditionResource,
      rollExpeditionSkill: CommanderTrainerSheet.rollExpeditionSkill,
      postExpeditionStatus: CommanderTrainerSheet.postExpeditionStatus,
      adjustSocialResource: CommanderTrainerSheet.adjustSocialResource,
      rollSocialSkill: CommanderTrainerSheet.rollSocialSkill,
      postSocialStatus: CommanderTrainerSheet.postSocialStatus,
      resetSocialScene: CommanderTrainerSheet.resetSocialScene,
      adjustDowntimeActions: CommanderTrainerSheet.adjustDowntimeActions,
      saveDowntimeProject: CommanderTrainerSheet.saveDowntimeProject,
      workDowntimeProject: CommanderTrainerSheet.workDowntimeProject,
      adjustDowntimeProgress: CommanderTrainerSheet.adjustDowntimeProgress,
      postDowntimeStatus: CommanderTrainerSheet.postDowntimeStatus,
      resetDowntimeProject: CommanderTrainerSheet.resetDowntimeProject,
      saveBiography: CommanderTrainerSheet.saveBiography,
      postBiography: CommanderTrainerSheet.postBiography
    }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/trainer/overview.hbs" },
    team: { template: "systems/ptu/src/module/commander/templates/trainer/team.hbs" },
    skills: { template: "systems/ptu/src/module/commander/templates/trainer/skills.hbs" },
    talents: { template: "systems/ptu/src/module/commander/templates/trainer/talents.hbs" },
    inventory: { template: "systems/ptu/src/module/commander/templates/trainer/inventory.hbs" },
    exploration: { template: "systems/ptu/src/module/commander/templates/trainer/exploration.hbs" },
    social: { template: "systems/ptu/src/module/commander/templates/trainer/social.hbs" },
    downtime: { template: "systems/ptu/src/module/commander/templates/trainer/downtime.hbs" },
    effects: { template: "systems/ptu/src/module/commander/templates/shared/effects.hbs" },
    biography: { template: "systems/ptu/src/module/commander/templates/trainer/biography.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const activeUuid = this.actor.system.team?.activePokemonUuid;
    const activeCompanion = activeUuid ? await fromUuid(activeUuid) : null;
    const team = [];
    const attributes = this.actor.system.attributes ?? {};
    const attributeOptions = Object.entries(ATTRIBUTE_LABELS).map(([value, label]) => ({ value, label }));
    const skillList = Object.entries(this.actor.system.skills ?? {}).map(([key, skill]) => {
      const attributeValue = Number(attributes[skill.attribute]?.final ?? 0);
      const rankBonus = RANK_BONUSES[String(skill.rank ?? "untrained").toLowerCase()] ?? 0;
      const misc = Number(skill.misc ?? 0);
      const total = attributeValue + rankBonus + misc;
      return {
        key,
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()),
        ...skill,
        attributeLabel: ATTRIBUTE_LABELS[skill.attribute] ?? skill.attribute,
        attributeValue,
        attributeSigned: signed(attributeValue),
        rankBonus,
        rankSigned: signed(rankBonus),
        misc,
        miscSigned: signed(misc),
        total,
        totalSigned: signed(total),
        attributeOptions: attributeOptions.map(option => ({ ...option, selected: option.value === skill.attribute }))
      };
    });

    for (const uuid of this.actor.system.team?.pokemonUuids ?? []) {
      const pokemon = await fromUuid(uuid);
      if (!pokemon) continue;
      const friendship = CommanderFriendshipService.getState(pokemon);
      const hp = pokemon.system.health?.hp ?? {};
      team.push({
        actor: pokemon,
        isActive: pokemon.uuid === activeUuid,
        friendship,
        types: pokemon.system.identity?.types ?? [],
        hpPercent: Number(hp.max ?? 0) > 0 ? Math.round((Number(hp.value ?? 0) / Number(hp.max)) * 100) : 0,
        isFainted: Number(hp.value ?? 0) <= 0 || pokemon.system.identity?.lifecycle === "fainted",
        conditionCount: pokemon.effects?.contents?.length ?? 0,
        actionState: pokemon.system.actions ?? {},
        capabilities: pokemon.system.exploration?.capabilities ?? [],
        mountCapable: Boolean(pokemon.system.exploration?.mountCapable)
      });
    }

    const identity = this.actor.system.identity ?? {};
    const pinnedUuids = this.actor.system.ui?.pinnedTalentUuids ?? [];
    const talents = this.actor.items.filter(item => TALENT_TYPES.has(item.type)).map(item => talentSummary(item, pinnedUuids));
    talents.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.item.name.localeCompare(b.item.name));

    const inventoryItems = this.actor.items.filter(item => INVENTORY_TYPES.has(item.type)).map(inventorySummary);
    inventoryItems.sort((a, b) => a.category.localeCompare(b.category) || a.item.name.localeCompare(b.item.name));
    const carriedBulk = inventoryItems.reduce((total, entry) => total + entry.totalBulk, 0);
    const bulkCapacity = Number(this.actor.system.inventory?.bulkCapacity ?? 0);
    const explorationCapabilities = [...new Set(team.flatMap(member => member.capabilities))].sort((a, b) => String(a).localeCompare(String(b)));
    const expeditionRole = this.actor.system.campaign?.expeditionRole ?? "";
    const social = this.actor.system.social ?? {};
    const downtime = foundry.utils.mergeObject(downtimeDefaults(), this.actor.getFlag("ptu", "commanderDowntime") ?? {}, { inplace: false });
    const downtimeGoal = Math.max(1, Number(downtime.goal ?? 5));
    const downtimeProgress = Math.clamp(Number(downtime.progress ?? 0), 0, downtimeGoal);
    const biography = foundry.utils.mergeObject(biographyDefaults(), this.actor.getFlag("ptu", "commanderBiography") ?? {}, { inplace: false });

    return {
      ...context,
      sheetType: "trainer",
      tabs: ["overview", "team", "skills", "talents", "inventory", "exploration", "social", "downtime", "effects", "biography"],
      activeCompanion,
      team,
      teamCount: team.length,
      maxTeamSize: MAX_TEAM_SIZE,
      teamFull: team.length >= MAX_TEAM_SIZE,
      skillList,
      talents,
      pinnedTalentCount: talents.filter(talent => talent.isPinned).length,
      inventoryItems,
      inventoryCount: inventoryItems.length,
      carriedBulk,
      bulkCapacity,
      overBulkCapacity: carriedBulk > bulkCapacity,
      explorationCapabilities,
      mountTeam: team.filter(member => member.mountCapable),
      expeditionRoleOptions: EXPEDITION_ROLES.map(([value, label]) => ({ value, label, selected: value === expeditionRole })),
      socialStanceOptions: SOCIAL_STANCES.map(([value, label]) => ({ value, label, selected: value === social.stance })),
      socialInfluencePercent: Number(social.influence?.max ?? 0) > 0 ? Math.round((Number(social.influence?.value ?? 0) / Number(social.influence.max)) * 100) : 0,
      downtime: { ...downtime, progress: downtimeProgress, goal: downtimeGoal },
      downtimePercent: Math.round((downtimeProgress / downtimeGoal) * 100),
      downtimeComplete: downtimeProgress >= downtimeGoal,
      downtimeCategoryOptions: DOWNTIME_CATEGORIES.map(([value, label]) => ({ value, label, selected: value === downtime.category })),
      biography,
      backgroundOptions: optionList(COMMANDER_BACKGROUNDS, identity.background),
      roleOptions: roleOptions(identity.role),
      specialtyOptions: specialtyOptions(identity.role, identity.specialty)
    };
  }

  static async rollSkill(event, target) {
    const app = resolveApplication(target, this);
    return CommanderRollService.rollSkill({ actor: app.actor, skillKey: target.dataset.skillKey });
  }

  static async togglePinnedTalent(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That Talent could not be resolved.");
    const current = [...(app.actor.system.ui?.pinnedTalentUuids ?? [])];
    const next = current.includes(item.uuid) ? current.filter(uuid => uuid !== item.uuid) : [...current, item.uuid];
    await app.actor.update({ "system.ui.pinnedTalentUuids": next });
    return app.render();
  }

  static async postTalent(event, target) {
    const app = resolveApplication(target, this);
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That Talent could not be resolved.");
    const description = item.system?.description ?? item.system?.effect ?? item.system?.summary ?? "No rules text available.";
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(item.name)}</h3><p>${description}</p></section>` });
  }

  static async useInventoryItem(event, target) {
    const app = resolveApplication(target, this);
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That item could not be resolved.");
    const system = item.system ?? {};
    const quantity = Math.max(0, Number(system.quantity ?? 1) || 0);
    if (quantity <= 0) return ui.notifications.warn(`${item.name} has no uses remaining.`);
    const description = system.description ?? system.effect ?? system.summary ?? "No rules text available.";
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(item.name)}</h3><p>${description}</p></section>` });
    if (system.consumedOnUse) await item.update({ "system.quantity": Math.max(0, quantity - 1) });
    return app.render();
  }

  static async adjustItemQuantity(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That item could not be resolved.");
    const current = Math.max(0, Number(item.system?.quantity ?? 1) || 0);
    await item.update({ "system.quantity": Math.max(0, current + Number(target.dataset.amount ?? 0)) });
    return app.render();
  }

  static async postInventoryItem(event, target) {
    const app = resolveApplication(target, this);
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That item could not be resolved.");
    const description = item.system?.description ?? item.system?.effect ?? item.system?.summary ?? "No rules text available.";
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(item.name)}</h3><p>${description}</p></section>` });
  }

  static async adjustExpeditionResource(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const resource = target.dataset.resource;
    if (!["supplyUnits", "medicalSupplies"].includes(resource)) return;
    const current = Number(app.actor.system.inventory?.[resource] ?? 0);
    await app.actor.update({ [`system.inventory.${resource}`]: Math.max(0, current + Number(target.dataset.amount ?? 0)) });
    return app.render();
  }

  static async rollExpeditionSkill(event, target) {
    const app = resolveApplication(target, this);
    return CommanderRollService.rollSkill({ actor: app.actor, skillKey: target.dataset.skillKey, target: target.dataset.target ? Number(target.dataset.target) : null });
  }

  static async postExpeditionStatus(event, target) {
    const app = resolveApplication(target, this);
    const role = EXPEDITION_ROLES.find(([value]) => value === app.actor.system.campaign?.expeditionRole)?.[1] ?? "Unassigned";
    const active = app.actor.system.team?.activePokemonUuid ? await fromUuid(app.actor.system.team.activePokemonUuid) : null;
    const capabilities = active?.system.exploration?.capabilities ?? [];
    const content = `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(app.actor.name)} Expedition Status</h3><p><strong>Role:</strong> ${foundry.utils.escapeHTML(role)}</p><p><strong>Supplies:</strong> ${Number(app.actor.system.inventory?.supplyUnits ?? 0)} | <strong>Medical:</strong> ${Number(app.actor.system.inventory?.medicalSupplies ?? 0)}</p><p><strong>Active Pokémon:</strong> ${foundry.utils.escapeHTML(active?.name ?? "None")}</p><p><strong>Capabilities:</strong> ${foundry.utils.escapeHTML(capabilities.join(", ") || "None")}</p></section>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content });
  }

  static async adjustSocialResource(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const resource = target.dataset.resource;
    const amount = Number(target.dataset.amount ?? 0);
    const social = app.actor.system.social;
    if (resource === "influence") {
      await app.actor.update({ "system.social.influence.value": Math.clamp(Number(social.influence?.value ?? 0) + amount, 0, Number(social.influence?.max ?? 5)) });
    } else if (["leverage", "reputation"].includes(resource)) {
      const current = Number(social[resource] ?? 0);
      await app.actor.update({ [`system.social.${resource}`]: resource === "leverage" ? Math.max(0, current + amount) : current + amount });
    }
    return app.render();
  }

  static async rollSocialSkill(event, target) {
    const app = resolveApplication(target, this);
    const skillKey = target.dataset.skillKey;
    const stance = app.actor.system.social?.stance ?? "neutral";
    const skill = app.actor.system.skills?.[skillKey];
    if (!skill) return ui.notifications.warn("That social skill could not be resolved.");
    return CommanderRollService.rollCheck({
      actor: app.actor,
      label: `${skillKey.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase())} Social Check`,
      rank: skill.rank,
      attribute: app.actor.system.attributes?.[skill.attribute]?.final ?? 0,
      misc: skill.misc,
      favored: Boolean(skill.favorite || stance === "friendly" || stance === "devoted"),
      hindered: stance === "hostile" || stance === "unfriendly",
      target: target.dataset.target ? Number(target.dataset.target) : null,
      notes: `Current stance: ${stance}`
    });
  }

  static async postSocialStatus(event, target) {
    const app = resolveApplication(target, this);
    const social = app.actor.system.social;
    const stance = SOCIAL_STANCES.find(([value]) => value === social.stance)?.[1] ?? "Neutral";
    const subject = foundry.utils.escapeHTML(social.subject || "Current social scene");
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${subject}</h3><p><strong>Stance:</strong> ${stance}</p><p><strong>Influence:</strong> ${social.influence.value} / ${social.influence.max}</p><p><strong>Leverage:</strong> ${social.leverage} | <strong>Reputation:</strong> ${signed(social.reputation)}</p></section>` });
  }

  static async resetSocialScene(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Reset Social Scene?" }, content: "<p>Reset stance, influence, leverage, subject, and notes? Reputation will be preserved.</p>" });
    if (!confirmed) return;
    await app.actor.update({ "system.social.stance": "neutral", "system.social.influence.value": 0, "system.social.leverage": 0, "system.social.subject": "", "system.social.notes": "" });
    return app.render();
  }

  static async adjustDowntimeActions(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const current = Number(app.actor.system.campaign?.downtimeActions ?? 0);
    await app.actor.update({ "system.campaign.downtimeActions": Math.max(0, current + Number(target.dataset.amount ?? 0)) });
    return app.render();
  }

  static async saveDowntimeProject(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const current = foundry.utils.mergeObject(downtimeDefaults(), app.actor.getFlag("ptu", "commanderDowntime") ?? {}, { inplace: false });
    const next = {
      ...current,
      category: app.element.querySelector("[data-downtime-category]")?.value ?? current.category,
      project: app.element.querySelector("[data-downtime-project]")?.value ?? current.project,
      goal: Math.max(1, Number(app.element.querySelector("[data-downtime-goal]")?.value ?? current.goal)),
      notes: app.element.querySelector("[data-downtime-notes]")?.value ?? current.notes
    };
    next.progress = Math.clamp(Number(next.progress ?? 0), 0, next.goal);
    await app.actor.setFlag("ptu", "commanderDowntime", next);
    ui.notifications.info("Downtime project saved.");
    return app.render();
  }

  static async workDowntimeProject(event, target) {
    const app = resolveApplication(target, this);
    const actions = Number(app.actor.system.campaign?.downtimeActions ?? 0);
    if (actions <= 0) return ui.notifications.warn("No Downtime Actions remain.");
    const downtime = foundry.utils.mergeObject(downtimeDefaults(), app.actor.getFlag("ptu", "commanderDowntime") ?? {}, { inplace: false });
    const skillKey = DOWNTIME_SKILLS[downtime.category] ?? "focus";
    const skill = app.actor.system.skills?.[skillKey];
    if (!skill) return ui.notifications.warn("The downtime skill could not be resolved.");
    const roll = await new Roll("1d20 + @attribute + @rank + @misc", { attribute: app.actor.system.attributes?.[skill.attribute]?.final ?? 0, rank: RANK_BONUSES[skill.rank] ?? 0, misc: skill.misc ?? 0 }).evaluate();
    const progress = roll.total >= 18 ? 2 : roll.total >= 10 ? 1 : 0;
    const goal = Math.max(1, Number(downtime.goal ?? 5));
    const nextProgress = Math.clamp(Number(downtime.progress ?? 0) + progress, 0, goal);
    const result = progress === 2 ? "Strong success: +2 progress" : progress === 1 ? "Success: +1 progress" : "No progress; the action is still spent";
    await Promise.all([
      app.actor.update({ "system.campaign.downtimeActions": actions - 1 }),
      app.actor.setFlag("ptu", "commanderDowntime", { ...downtime, progress: nextProgress, lastResult: result })
    ]);
    const categoryLabel = DOWNTIME_CATEGORIES.find(([value]) => value === downtime.category)?.[1] ?? "Downtime";
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(categoryLabel)}: ${foundry.utils.escapeHTML(downtime.project || "Downtime Project")}</h3><p><strong>${foundry.utils.escapeHTML(skillKey)}</strong> total: ${roll.total}</p><p>${foundry.utils.escapeHTML(result)}</p><p>Progress: ${nextProgress} / ${goal}</p></section>`, rolls: [roll] });
    return app.render();
  }

  static async adjustDowntimeProgress(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const downtime = foundry.utils.mergeObject(downtimeDefaults(), app.actor.getFlag("ptu", "commanderDowntime") ?? {}, { inplace: false });
    downtime.progress = Math.clamp(Number(downtime.progress ?? 0) + Number(target.dataset.amount ?? 0), 0, Math.max(1, Number(downtime.goal ?? 5)));
    await app.actor.setFlag("ptu", "commanderDowntime", downtime);
    return app.render();
  }

  static async postDowntimeStatus(event, target) {
    const app = resolveApplication(target, this);
    const downtime = foundry.utils.mergeObject(downtimeDefaults(), app.actor.getFlag("ptu", "commanderDowntime") ?? {}, { inplace: false });
    const category = DOWNTIME_CATEGORIES.find(([value]) => value === downtime.category)?.[1] ?? "Downtime";
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(downtime.project || "Downtime Project")}</h3><p><strong>Category:</strong> ${foundry.utils.escapeHTML(category)}</p><p><strong>Progress:</strong> ${Number(downtime.progress ?? 0)} / ${Math.max(1, Number(downtime.goal ?? 5))}</p><p><strong>Actions Remaining:</strong> ${Number(app.actor.system.campaign?.downtimeActions ?? 0)}</p></section>` });
  }

  static async resetDowntimeProject(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Reset Downtime Project?" }, content: "<p>Clear the current project and all progress?</p>" });
    if (!confirmed) return;
    await app.actor.setFlag("ptu", "commanderDowntime", downtimeDefaults());
    return app.render();
  }

  static async saveBiography(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const next = {};
    for (const key of Object.keys(biographyDefaults())) next[key] = app.element.querySelector(`[data-biography-field="${key}"]`)?.value ?? "";
    await app.actor.setFlag("ptu", "commanderBiography", next);
    ui.notifications.info("Biography saved.");
    return app.render();
  }

  static async postBiography(event, target) {
    const app = resolveApplication(target, this);
    const biography = foundry.utils.mergeObject(biographyDefaults(), app.actor.getFlag("ptu", "commanderBiography") ?? {}, { inplace: false });
    const identity = [biography.pronouns, biography.age && `Age ${biography.age}`, biography.hometown].filter(Boolean).map(foundry.utils.escapeHTML).join(" • ");
    const content = `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(app.actor.name)}</h3>${identity ? `<p>${identity}</p>` : ""}${biography.trainerCreed ? `<blockquote>${foundry.utils.escapeHTML(biography.trainerCreed)}</blockquote>` : ""}${biography.goals ? `<p><strong>Goals:</strong> ${foundry.utils.escapeHTML(biography.goals)}</p>` : ""}${biography.bonds ? `<p><strong>Bonds:</strong> ${foundry.utils.escapeHTML(biography.bonds)}</p>` : ""}</section>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content });
  }

  async _onDropActor(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const dropped = await Actor.implementation.fromDropData(data);
    if (!dropped || dropped.type !== "pokemon") return ui.notifications.warn("Only Pokémon actors can be added to a Trainer team.");
    const current = this.actor.system.team?.pokemonUuids ?? [];
    if (current.includes(dropped.uuid)) return ui.notifications.info(`${dropped.name} is already on this team.`);
    if (current.length >= MAX_TEAM_SIZE) return ui.notifications.warn(`A Trainer team can hold no more than ${MAX_TEAM_SIZE} Pokémon.`);
    await this.actor.update({ "system.team.pokemonUuids": [...current, dropped.uuid] });
    await dropped.update({ "system.identity.trainerUuid": this.actor.uuid, "system.identity.lifecycle": current.length ? "party" : "active" });
    if (!this.actor.system.team?.activePokemonUuid) await this.actor.update({ "system.team.activePokemonUuid": dropped.uuid });
    return this.render();
  }

  async _onDropItem(event, data) {
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this Trainer.");
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    const activeTab = this._commanderActiveTab ?? this.actor.system.ui?.activeTab;
    if (activeTab === "talents" && !TALENT_TYPES.has(item.type)) return ui.notifications.warn("Only Talent, Feat, or Edge items can be dropped onto the Talents tab.");
    if (activeTab === "inventory" && !INVENTORY_TYPES.has(item.type)) return ui.notifications.warn("Only inventory items can be dropped onto the Inventory tab.");
    return Item.create(item.toObject(), { parent: this.actor });
  }

  static async setActivePokemon(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const next = target.dataset.uuid ? await fromUuid(target.dataset.uuid) : null;
    if (!next || next.type !== "pokemon") return ui.notifications.warn("That Pokémon could not be resolved.");
    if (Number(next.system.health?.hp?.value ?? 0) <= 0) return ui.notifications.warn(`${next.name} is fainted and cannot become active.`);
    const previousUuid = app.actor.system.team?.activePokemonUuid;
    const previous = previousUuid && previousUuid !== next.uuid ? await fromUuid(previousUuid) : null;
    const updates = [app.actor.update({ "system.team.activePokemonUuid": next.uuid }), next.update({ "system.identity.trainerUuid": app.actor.uuid, "system.identity.lifecycle": "active" })];
    if (previous?.type === "pokemon") updates.push(previous.update({ "system.identity.lifecycle": "party" }));
    await Promise.all(updates);
    ui.notifications.info(`${next.name} is now ${app.actor.name}'s active Pokémon.`);
    return app.render();
  }

  static async removePokemon(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this trainer.");
    const uuid = target.dataset.uuid;
    const pokemon = uuid ? await fromUuid(uuid) : null;
    const current = app.actor.system.team?.pokemonUuids ?? [];
    const remaining = current.filter(entry => entry !== uuid);
    const wasActive = app.actor.system.team?.activePokemonUuid === uuid;
    const replacementUuid = wasActive ? (remaining[0] ?? "") : app.actor.system.team?.activePokemonUuid;
    await app.actor.update({ "system.team.pokemonUuids": remaining, "system.team.activePokemonUuid": replacementUuid });
    if (pokemon?.type === "pokemon" && pokemon.system.identity?.trainerUuid === app.actor.uuid) await pokemon.update({ "system.identity.trainerUuid": "", "system.identity.lifecycle": "reserve" });
    if (wasActive && replacementUuid) {
      const replacement = await fromUuid(replacementUuid);
      if (replacement?.type === "pokemon") await replacement.update({ "system.identity.lifecycle": Number(replacement.system.health?.hp?.value ?? 0) > 0 ? "active" : "fainted" });
    }
    return app.render();
  }

  static async openPokemon(event, target) {
    const pokemon = target.dataset.uuid ? await fromUuid(target.dataset.uuid) : null;
    return pokemon?.sheet?.render(true);
  }
}
