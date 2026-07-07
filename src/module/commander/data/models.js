const fields = foundry.data.fields;

const rankChoices = ["untrained", "novice", "adept", "expert", "master"];
const bondChoices = ["wary", "trusting", "bonded", "devoted"];
const lifecycleChoices = ["active", "party", "reserve", "stored", "injured", "egg", "juvenile", "fainted"];
const trainingPathChoices = ["striker", "specialist", "bulwark", "swift", "balanced", "custom"];

function schemaVersionField() {
  return new fields.SchemaField({
    version: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    lastMigration: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
  });
}

function resourceField({ value = 0, max = 0, min = 0 } = {}) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, nullable: false, min, initial: value }),
    max: new fields.NumberField({ required: true, nullable: false, min, initial: max })
  });
}

function defenseField(initial = 10) {
  return new fields.SchemaField({
    base: new fields.NumberField({ required: true, nullable: false, integer: true, initial }),
    bonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    final: new fields.NumberField({ required: true, nullable: false, integer: true, initial })
  });
}

function actionStateField() {
  return new fields.SchemaField({
    mainUsed: new fields.BooleanField({ required: true, nullable: false, initial: false }),
    moveUsed: new fields.BooleanField({ required: true, nullable: false, initial: false }),
    reactionUsed: new fields.BooleanField({ required: true, nullable: false, initial: false }),
    sharedMainRemaining: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 2 }),
    sharedMoveRemaining: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 2 }),
    lastCombatRound: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
    lastCombatTurn: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null })
  });
}

function skillField(attribute) {
  return new fields.SchemaField({
    attribute: new fields.StringField({ required: true, nullable: false, choices: ["body", "agility", "mind", "presence"], initial: attribute }),
    rank: new fields.StringField({ required: true, nullable: false, choices: rankChoices, initial: "untrained" }),
    misc: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    favorite: new fields.BooleanField({ required: true, nullable: false, initial: false })
  });
}

function attributeField(initial = 0) {
  return new fields.SchemaField({
    base: new fields.NumberField({ required: true, nullable: false, integer: true, initial }),
    bonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    final: new fields.NumberField({ required: true, nullable: false, integer: true, initial })
  });
}

function pokemonStatField(initial = 5) {
  return new fields.SchemaField({
    species: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial }),
    level: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    path: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    nature: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    bonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    stage: new fields.NumberField({ required: true, nullable: false, integer: true, min: -4, max: 4, initial: 0 }),
    final: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial })
  });
}

export class CommanderTrainerData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Trainer"];

  static defineSchema() {
    return {
      schema: schemaVersionField(),
      identity: new fields.SchemaField({
        level: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, max: 20, initial: 1 }),
        background: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        role: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        specialty: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        progressionMode: new fields.StringField({ required: true, nullable: false, choices: ["xp", "milestone"], initial: "milestone" }),
        experience: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),
      health: new fields.SchemaField({
        hp: resourceField({ value: 20, max: 20 }),
        temporaryHp: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        wounds: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, max: 5, initial: 0 }),
        fatigue: new fields.StringField({ required: true, nullable: false, choices: ["fresh", "tired", "exhausted", "spent"], initial: "fresh" })
      }),
      attributes: new fields.SchemaField({
        body: attributeField(),
        agility: attributeField(),
        mind: attributeField(),
        presence: attributeField()
      }),
      defenses: new fields.SchemaField({
        physical: defenseField(),
        special: defenseField(),
        reflex: defenseField()
      }),
      skills: new fields.SchemaField({
        athletics: skillField("body"),
        acrobatics: skillField("agility"),
        endurance: skillField("body"),
        stealth: skillField("agility"),
        perception: skillField("mind"),
        survival: skillField("mind"),
        medicine: skillField("mind"),
        technology: skillField("mind"),
        pokemonLore: skillField("mind"),
        nature: skillField("mind"),
        investigation: skillField("mind"),
        influence: skillField("presence"),
        deception: skillField("presence"),
        performance: skillField("presence"),
        focus: skillField("presence")
      }),
      actions: actionStateField(),
      team: new fields.SchemaField({
        activePokemonUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        pokemonUuids: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] })
      }),
      inventory: new fields.SchemaField({
        bulkCapacityBonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
        supplyUnits: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        medicalSupplies: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),
      campaign: new fields.SchemaField({
        expeditionRole: new fields.StringField({ required: true, nullable: false, choices: ["", "guide", "scout", "quartermaster", "medic", "researcher", "handler"], initial: "" }),
        downtimeActions: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        notes: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" })
      }),
      ui: new fields.SchemaField({
        mode: new fields.StringField({ required: true, nullable: false, choices: ["play", "edit"], initial: "play" }),
        activeTab: new fields.StringField({ required: true, nullable: false, blank: false, initial: "overview" }),
        pinnedTalentUuids: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] })
      })
    };
  }

  prepareDerivedData() {
    const rankBonus = { untrained: 0, novice: 2, adept: 4, expert: 6, master: 8 };
    for (const attribute of Object.values(this.attributes)) attribute.final = attribute.base + attribute.bonus;
    for (const skill of Object.values(this.skills)) {
      const attribute = this.attributes[skill.attribute]?.final ?? 0;
      skill.final = attribute + (rankBonus[skill.rank] ?? 0) + skill.misc;
    }
    this.health.hp.value = Math.clamp(this.health.hp.value, 0, this.health.hp.max);
    this.inventory.bulkCapacity = Math.max(0, 5 + this.attributes.body.final + this.inventory.bulkCapacityBonus);
  }
}

export class CommanderPokemonData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Pokemon"];

  static defineSchema() {
    return {
      schema: schemaVersionField(),
      identity: new fields.SchemaField({
        speciesUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        speciesName: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        level: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, max: 100, initial: 1 }),
        evolutionStage: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        types: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] }),
        nature: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        trainingPath: new fields.StringField({ required: true, nullable: false, choices: trainingPathChoices, initial: "balanced" }),
        lifecycle: new fields.StringField({ required: true, nullable: false, choices: lifecycleChoices, initial: "party" }),
        trainerUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      }),
      health: new fields.SchemaField({
        hp: resourceField({ value: 10, max: 10 }),
        temporaryHp: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        wounds: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, max: 5, initial: 0 }),
        fatigue: new fields.StringField({ required: true, nullable: false, choices: ["fresh", "tired", "exhausted", "spent"], initial: "fresh" })
      }),
      stats: new fields.SchemaField({
        hp: pokemonStatField(10),
        attack: pokemonStatField(),
        defense: pokemonStatField(),
        specialAttack: pokemonStatField(),
        specialDefense: pokemonStatField(),
        speed: pokemonStatField()
      }),
      defenses: new fields.SchemaField({
        physical: defenseField(),
        special: defenseField(),
        reflex: defenseField()
      }),
      bond: new fields.SchemaField({
        level: new fields.StringField({ required: true, nullable: false, choices: bondChoices, initial: "wary" }),
        progress: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        caregiverUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        notes: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" })
      }),
      actions: actionStateField(),
      loadout: new fields.SchemaField({
        equippedMoveUuids: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: true }), { required: true, nullable: false, initial: ["", "", "", ""] }),
        reserveMoveUuids: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: true }), { required: true, nullable: false, initial: ["", ""] }),
        heldItemUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        activeAbilityUuids: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] })
      }),
      progression: new fields.SchemaField({
        mode: new fields.StringField({ required: true, nullable: false, choices: ["xp", "milestone"], initial: "milestone" }),
        experience: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        milestone: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
        evolutionEligible: new fields.BooleanField({ required: true, nullable: false, initial: false })
      }),
      exploration: new fields.SchemaField({
        capabilities: new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] }),
        mountCapable: new fields.BooleanField({ required: true, nullable: false, initial: false }),
        incubation: resourceField({ value: 0, max: 0 }),
        development: resourceField({ value: 0, max: 0 })
      }),
      ui: new fields.SchemaField({
        mode: new fields.StringField({ required: true, nullable: false, choices: ["play", "edit"], initial: "play" }),
        activeTab: new fields.StringField({ required: true, nullable: false, blank: false, initial: "overview" })
      })
    };
  }

  prepareDerivedData() {
    for (const stat of Object.values(this.stats)) {
      stat.final = Math.max(0, stat.species + stat.level + stat.path + stat.nature + stat.bonus);
    }
    this.health.hp.max = Math.max(1, this.stats.hp.final);
    this.health.hp.value = Math.clamp(this.health.hp.value, 0, this.health.hp.max);
    this.defenses.physical.final = this.defenses.physical.base + this.defenses.physical.bonus;
    this.defenses.special.final = this.defenses.special.base + this.defenses.special.bonus;
    this.defenses.reflex.final = this.defenses.reflex.base + this.defenses.reflex.bonus;
  }
}
