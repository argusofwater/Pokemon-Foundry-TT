import { CommanderActorSheetBase } from "./base-sheet.js";
import { CommanderActionTracker } from "../runtime/action-tracker.js";
import { CommanderRollService } from "../runtime/roll-service.js";
import { CommanderFriendshipService } from "../runtime/friendship-service.js";
import { availableCanonicalMoves, checkActorMove } from "../runtime/move-legality.js";
import { xpThreshold } from "../../../scripts/hooks/commander-progression.js";

function resolveApplication(target, fallback) {
  return target?.closest?.(".application")?.application ?? fallback;
}

function buildFriendshipHearts(value, count = 10) {
  const normalized = Math.max(0, Math.min(255, Number(value) || 0));
  const perHeart = 255 / count;
  return Array.from({ length: count }, (_, index) => {
    const fill = Math.max(0, Math.min(1, (normalized - (index * perHeart)) / perHeart));
    return { index, percent: Math.round(fill * 100), filled: fill >= 1, partial: fill > 0 && fill < 1 };
  });
}

function getDropData(event) {
  const TextEditorV14 = foundry.applications?.ux?.TextEditor?.implementation;
  if (TextEditorV14?.getDragEventData) return TextEditorV14.getDragEventData(event);
  return TextEditor.getDragEventData(event);
}

const COMMANDER_STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];
const STAT_LABELS = Object.freeze({ hp: "Hit Points", attack: "Attack", defense: "Defense", specialAttack: "Special Attack", specialDefense: "Special Defense", speed: "Speed" });
const TALENT_TYPES = new Set(["pokeedge", "feat", "edge", "talent"]);
const EQUIPMENT_TYPES = new Set(["item", "equipment", "consumable", "pokeball"]);

function normalizeCommanderStat(systemStats, key) {
  const stat = systemStats?.[key] ?? {};
  const species = Number(stat.species ?? stat.value ?? 0) || 0;
  const level = Number(stat.level ?? 0) || 0;
  const path = Number(stat.path ?? 0) || 0;
  const nature = Number(stat.nature ?? 0) || 0;
  const bonus = Number(stat.bonus ?? 0) || 0;
  const final = Number(stat.final ?? species + level + path + nature + bonus) || 0;
  return { key, label: STAT_LABELS[key], species, level, path, nature, bonus, stage: Number(stat.stage ?? 0) || 0, final };
}

function itemSummary(item) {
  const system = item.system ?? {};
  return {
    item,
    type: item.type,
    description: system.description ?? system.effect ?? system.summary ?? system.snippet ?? "",
    frequency: system.recharge?.category ?? system.frequency ?? system.usage ?? "",
    trigger: system.trigger ?? "",
    category: system.category ?? system.talentType ?? system.abilityType ?? item.type,
    tags: system.tags ?? system.keywords ?? [],
    quantity: Number(system.quantity ?? 1),
    slot: system.slot ?? "",
    held: false
  };
}

function evolutionSummary(evolution) {
  return {
    target: evolution.targetSpeciesSlug ?? evolution.slug ?? "Unknown",
    method: evolution.method ?? "special",
    level: evolution.level ?? "",
    itemSlug: evolution.itemSlug ?? evolution.other?.evolutionItem?.slug ?? "",
    condition: evolution.condition ?? evolution.other?.restrictions?.join?.(", ") ?? ""
  };
}

function formSummary(form) {
  return {
    name: form.name ?? form.slug ?? "Unknown Form",
    family: form.family ?? form.formKind ?? "form",
    temporary: form.temporary !== false,
    types: form.types ?? [],
    requirements: form.requirements ?? {},
    tags: form.tags ?? []
  };
}

function moveSummary(move, actor) {
  if (!move) return null;
  const legality = checkActorMove(actor, move);
  return {
    item: move,
    id: move.id,
    uuid: move.uuid,
    name: move.name,
    img: move.img,
    system: move.system,
    legal: legality.legal,
    legalityReason: legality.reason ?? "",
    learnMethod: legality.method ?? "",
    learnLevel: legality.level ?? null
  };
}

export class CommanderPokemonSheet extends CommanderActorSheetBase {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: [...super.DEFAULT_OPTIONS.classes, "commander-pokemon-sheet"],
    position: { width: 980, height: 800 },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      rollMove: CommanderPokemonSheet.rollMove,
      spendMoveAction: CommanderPokemonSheet.spendMoveAction,
      clearMoveSlot: CommanderPokemonSheet.clearMoveSlot,
      setFriendship: CommanderPokemonSheet.setFriendship,
      adjustFriendship: CommanderPokemonSheet.adjustFriendship,
      resetFriendshipResolve: CommanderPokemonSheet.resetFriendshipResolve,
      toggleHeldItem: CommanderPokemonSheet.toggleHeldItem,
      postPokemonSummary: CommanderPokemonSheet.postPokemonSummary
    }
  };

  static PARTS = {
    header: { template: "systems/ptu/src/module/commander/templates/shared/header.hbs" },
    navigation: { template: "systems/ptu/src/module/commander/templates/shared/navigation.hbs" },
    overview: { template: "systems/ptu/src/module/commander/templates/pokemon/overview.hbs" },
    moves: { template: "systems/ptu/src/module/commander/templates/pokemon/moves.hbs" },
    abilities: { template: "systems/ptu/src/module/commander/templates/pokemon/abilities.hbs" },
    talents: { template: "systems/ptu/src/module/commander/templates/pokemon/talents.hbs" },
    growth: { template: "systems/ptu/src/module/commander/templates/pokemon/growth.hbs" },
    equipment: { template: "systems/ptu/src/module/commander/templates/pokemon/equipment.hbs" },
    bond: { template: "systems/ptu/src/module/commander/templates/pokemon/bond.hbs" },
    exploration: { template: "systems/ptu/src/module/commander/templates/pokemon/exploration.hbs" },
    effects: { template: "systems/ptu/src/module/commander/templates/shared/effects.hbs" },
    biography: { template: "systems/ptu/src/module/commander/templates/pokemon/biography.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const statSource = this.actor.system.commanderStats ?? this.actor.system.stats ?? {};
    const statList = COMMANDER_STAT_KEYS.map(key => normalizeCommanderStat(statSource, key));
    const speciesItem = this.actor.itemTypes?.species?.[0] ?? null;
    const speciesSystem = speciesItem?.system ?? {};
    const equippedMoves = (await this.#resolveMoveSlots(this.actor.system.loadout?.equippedMoveUuids ?? [], 4)).map(move => moveSummary(move, this.actor));
    const reserveMoves = (await this.#resolveMoveSlots(this.actor.system.loadout?.reserveMoveUuids ?? [], 2)).map(move => moveSummary(move, this.actor));
    const embeddedMoves = this.actor.items.filter(item => item.type === "move").map(move => moveSummary(move, this.actor));
    const embeddedAbilities = this.actor.items.filter(item => item.type === "ability").map(itemSummary);
    const talents = this.actor.items.filter(item => TALENT_TYPES.has(item.type)).map(itemSummary);
    const heldItemUuid = this.actor.system.loadout?.heldItemUuid ?? "";
    const heldItem = heldItemUuid ? await fromUuid(heldItemUuid) : null;
    const trainerUuid = this.actor.system.identity?.trainerUuid ?? "";
    const linkedTrainer = trainerUuid ? await fromUuid(trainerUuid) : null;
    const equipment = this.actor.items.filter(item => EQUIPMENT_TYPES.has(item.type)).map(item => ({ ...itemSummary(item), held: item.uuid === heldItemUuid }));
    equipment.sort((a, b) => Number(b.held) - Number(a.held) || a.item.name.localeCompare(b.item.name));
    const evolutions = (speciesSystem.evolutions ?? []).map(evolutionSummary);
    const forms = (speciesSystem.forms ?? []).map(formSummary);
    const capabilityItems = this.actor.items.filter(item => item.type === "capability").map(itemSummary);
    const capabilitySlugs = [...new Set([...(this.actor.system.exploration?.capabilities ?? []), ...(speciesSystem.capabilitySlugs ?? [])])].sort((a, b) => String(a).localeCompare(String(b)));
    const movement = speciesSystem.movement ?? speciesSystem.capabilities ?? {};
    const friendship = CommanderFriendshipService.getState(this.actor);
    const friendshipHearts = buildFriendshipHearts(friendship.value);

    return {
      ...context,
      sheetType: "pokemon",
      tabs: ["overview", "moves", "abilities", "talents", "growth", "equipment", "bond", "exploration", "effects", "biography"],
      statList,
      equippedMoves,
      reserveMoves,
      embeddedMoves,
      illegalMoveCount: embeddedMoves.filter(move => !move.legal).length,
      availableMoves: availableCanonicalMoves(this.actor),
      embeddedAbilities,
      talents,
      equipment,
      heldItem,
      linkedTrainer,
      speciesItem,
      speciesSystem,
      speciesSize: typeof speciesSystem.size === "string" ? speciesSystem.size : speciesSystem.size?.sizeClass ?? "medium",
      isShiny: Boolean(this.actor.getFlag("ptu", "commanderShiny")),
      nextLevelXp: xpThreshold(this.actor.system.identity?.level),
      evolutions,
      forms,
      capabilityItems,
      capabilitySlugs,
      movement,
      friendship,
      friendshipHearts
    };
  }

  async #resolveMoveSlots(uuids, size) {
    const resolved = [];
    for (const uuid of uuids) resolved.push(uuid ? await fromUuid(uuid) : null);
    while (resolved.length < size) resolved.push(null);
    return resolved.slice(0, size);
  }

  _onDragStart(event) {
    const element = event.currentTarget;
    const itemUuid = element?.dataset?.itemUuid;
    if (!itemUuid) return super._onDragStart?.(event);
    const slot = element.closest("[data-move-zone][data-move-index]");
    const dragData = slot ? { type: "CommanderMoveSlot", actorUuid: this.actor.uuid, itemUuid, zone: slot.dataset.moveZone, index: Number(slot.dataset.moveIndex) } : { type: "Item", uuid: itemUuid };
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  async _onDrop(event) {
    const slot = event.target.closest?.("[data-move-zone][data-move-index]");
    if (!slot) return super._onDrop(event);
    if (!this.isEditable) return ui.notifications.warn("You do not have permission to edit this Pokémon.");
    const data = getDropData(event);
    const targetZone = slot.dataset.moveZone;
    const targetIndex = Number(slot.dataset.moveIndex);
    if (data.type === "CommanderMoveSlot") {
      if (data.actorUuid !== this.actor.uuid) return ui.notifications.warn("Move slots can only be rearranged on the same Pokémon.");
      return this.#moveSlot(data.zone, Number(data.index), targetZone, targetIndex);
    }
    if (data.type !== "Item") return ui.notifications.warn("Only Move Items can be assigned to move slots.");
    const dropped = data.uuid ? await fromUuid(data.uuid) : await Item.implementation.fromDropData(data);
    if (!dropped || dropped.type !== "move") return ui.notifications.warn("Only Move Items can be assigned to move slots.");
    const legality = checkActorMove(this.actor, dropped);
    if (!legality.legal) return ui.notifications.warn(legality.reason);
    const item = dropped.parent?.uuid === this.actor.uuid ? dropped : (await this.actor.createEmbeddedDocuments("Item", [dropped.toObject()]))?.[0];
    if (!item) return;
    return this.#assignMoveToSlot(item.uuid, targetZone, targetIndex);
  }

  async #moveSlot(sourceZone, sourceIndex, targetZone, targetIndex) {
    const equipped = [...(this.actor.system.loadout?.equippedMoveUuids ?? ["", "", "", ""] )];
    const reserve = [...(this.actor.system.loadout?.reserveMoveUuids ?? ["", ""] )];
    const source = sourceZone === "active" ? equipped : reserve;
    const target = targetZone === "active" ? equipped : reserve;
    const sourceUuid = source[sourceIndex] ?? "";
    const targetUuid = target[targetIndex] ?? "";
    source[sourceIndex] = targetUuid;
    target[targetIndex] = sourceUuid;
    await this.actor.update({ "system.loadout.equippedMoveUuids": equipped, "system.loadout.reserveMoveUuids": reserve });
    return this.render();
  }

  async #assignMoveToSlot(uuid, zone, index) {
    const equipped = [...(this.actor.system.loadout?.equippedMoveUuids ?? ["", "", "", ""] )];
    const reserve = [...(this.actor.system.loadout?.reserveMoveUuids ?? ["", ""] )];
    for (let i = 0; i < equipped.length; i += 1) if (equipped[i] === uuid) equipped[i] = "";
    for (let i = 0; i < reserve.length; i += 1) if (reserve[i] === uuid) reserve[i] = "";
    const target = zone === "active" ? equipped : reserve;
    target[index] = uuid;
    await this.actor.update({ "system.loadout.equippedMoveUuids": equipped, "system.loadout.reserveMoveUuids": reserve });
    return this.render();
  }

  static async rollMove(event, target) {
    const app = resolveApplication(target, this);
    const item = await fromUuid(target.dataset.itemUuid);
    if (!item) return ui.notifications.warn("Move could not be resolved.");
    const legality = checkActorMove(app.actor, item);
    if (!legality.legal) return ui.notifications.warn(legality.reason);
    return CommanderRollService.rollMove({ actor: app.actor, item });
  }

  static async spendMoveAction(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    return CommanderActionTracker.spend(app.actor, "move");
  }

  static async clearMoveSlot(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    const zone = target.dataset.moveZone;
    const index = Number(target.dataset.moveIndex);
    const path = zone === "active" ? "system.loadout.equippedMoveUuids" : "system.loadout.reserveMoveUuids";
    const slots = [...(foundry.utils.getProperty(app.actor, path) ?? [])];
    slots[index] = "";
    await app.actor.update({ [path]: slots });
    return app.render();
  }

  static async toggleHeldItem(event, target) {
    const app = resolveApplication(target, this);
    if (!app.isEditable) return ui.notifications.warn("You do not have permission to edit this actor.");
    const item = app.actor.items.get(target.dataset.itemId);
    if (!item) return ui.notifications.warn("That item could not be resolved.");
    const current = app.actor.system.loadout?.heldItemUuid ?? "";
    await app.actor.update({ "system.loadout.heldItemUuid": current === item.uuid ? "" : item.uuid });
    return app.render();
  }

  static async postPokemonSummary(event, target) {
    const app = resolveApplication(target, this);
    const types = (app.actor.system.identity?.types ?? []).join(" / ") || "Unknown type";
    const level = app.actor.system.identity?.level ?? "?";
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: app.actor }), content: `<section class="commander-chat-card"><h3>${foundry.utils.escapeHTML(app.actor.name)}</h3><p>Level ${level} · ${foundry.utils.escapeHTML(types)}</p></section>` });
  }

  static async setFriendship(event, target) {
    const app = resolveApplication(target, this);
    if (!game.user?.isGM) return ui.notifications.warn("Only the GM can change Friendship.");
    const input = app.element?.querySelector?.("[name='commanderFriendshipValue']");
    await CommanderFriendshipService.setValue(app.actor, input?.value ?? app.actor.getFlag("ptu", "commanderFriendship")?.value ?? 0);
    return app.render();
  }

  static async adjustFriendship(event, target) {
    const app = resolveApplication(target, this);
    if (!game.user?.isGM) return ui.notifications.warn("Only the GM can change Friendship.");
    const current = CommanderFriendshipService.getState(app.actor).value;
    await CommanderFriendshipService.setValue(app.actor, current + Number(target.dataset.amount ?? 0));
    return app.render();
  }

  static async resetFriendshipResolve(event, target) {
    const app = resolveApplication(target, this);
    await CommanderFriendshipService.resetResolve(app.actor);
    return app.render();
  }
}
