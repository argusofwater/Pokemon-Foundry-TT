const fields = foundry.data.fields;

function schemaVersionField() {
  return new fields.SchemaField({
    version: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    lastMigration: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
  });
}

function automationField() {
  return new fields.SchemaField({
    state: new fields.StringField({ required: true, nullable: false, choices: ["automatic", "prompted", "manual", "unsupported"], initial: "manual" }),
    handler: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
    notes: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
  });
}

function tagsField() {
  return new fields.ArrayField(new fields.StringField({ required: true, nullable: false, blank: false }), { required: true, nullable: false, initial: [] });
}

function rechargeField() {
  return new fields.SchemaField({
    category: new fields.StringField({ required: true, nullable: false, choices: ["at-will", "cooldown", "encounter", "expedition"], initial: "at-will" }),
    rounds: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    remaining: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
  });
}

class CommanderItemBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      schema: schemaVersionField(),
      slug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" }),
      tags: tagsField(),
      automation: automationField(),
      source: new fields.SchemaField({
        profile: new fields.StringField({ required: true, nullable: false, choices: ["commander", "baseline", "shared", "optional"], initial: "commander" }),
        book: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        page: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      })
    };
  }
}

export class CommanderMoveData extends CommanderItemBase {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Move"];

  static defineSchema() {
    return foundry.utils.mergeObject(super.defineSchema(), {
      type: new fields.StringField({ required: true, nullable: false, blank: false, initial: "normal" }),
      category: new fields.StringField({ required: true, nullable: false, choices: ["physical", "special", "status"], initial: "status" }),
      power: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      accuracy: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
      range: new fields.SchemaField({
        value: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 }),
        unit: new fields.StringField({ required: true, nullable: false, choices: ["self", "melee", "squares", "scene"], initial: "melee" }),
        shape: new fields.StringField({ required: true, nullable: false, choices: ["single", "burst", "blast", "cone", "line", "wall", "zone"], initial: "single" }),
        area: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),
      target: new fields.SchemaField({
        defense: new fields.StringField({ required: true, nullable: false, choices: ["physical", "special", "reflex", "none"], initial: "none" }),
        count: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 }),
        disposition: new fields.StringField({ required: true, nullable: false, choices: ["any", "ally", "enemy", "self"], initial: "enemy" })
      }),
      recharge: rechargeField(),
      effects: new fields.ArrayField(new fields.SchemaField({
        kind: new fields.StringField({ required: true, nullable: false, choices: ["condition", "zone", "movement", "healing", "recoil", "drain", "custom"], initial: "custom" }),
        slug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        value: new fields.NumberField({ required: true, nullable: false, initial: 0 }),
        text: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      }), { required: true, nullable: false, initial: [] }),
      contest: new fields.SchemaField({
        tags: tagsField(),
        category: new fields.StringField({ required: true, nullable: false, choices: ["", "beauty", "cool", "clever", "cute", "tough", "freestyle"], initial: "" }),
        appeal: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),
      tutorModification: new fields.SchemaField({
        active: new fields.BooleanField({ required: true, nullable: false, initial: false }),
        name: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        description: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      })
    }, { inplace: false });
  }
}

export class CommanderAbilityData extends CommanderItemBase {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Ability"];

  static defineSchema() {
    return foundry.utils.mergeObject(super.defineSchema(), {
      abilityType: new fields.StringField({ required: true, nullable: false, choices: ["passive", "triggered", "reaction", "activated", "special"], initial: "passive" }),
      trigger: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      effect: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" }),
      recharge: rechargeField(),
      powerTier: new fields.StringField({ required: true, nullable: false, choices: ["minor", "standard", "major", "signature"], initial: "standard" }),
      innate: new fields.BooleanField({ required: true, nullable: false, initial: false }),
      entryLimit: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 })
    }, { inplace: false });
  }
}

export class CommanderTalentData extends CommanderItemBase {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Talent"];

  static defineSchema() {
    return foundry.utils.mergeObject(super.defineSchema(), {
      ownerType: new fields.StringField({ required: true, nullable: false, choices: ["trainer", "pokemon", "either"], initial: "either" }),
      talentType: new fields.StringField({ required: true, nullable: false, choices: ["general", "role", "specialty", "cross-role", "species", "training", "capability", "milestone"], initial: "general" }),
      role: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      specialty: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      requirement: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      action: new fields.StringField({ required: true, nullable: false, choices: ["passive", "free", "main", "move", "reaction", "downtime"], initial: "passive" }),
      trigger: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      recharge: rechargeField(),
      upgradeOf: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
    }, { inplace: false });
  }
}

export class CommanderEquipmentData extends CommanderItemBase {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Equipment"];

  static defineSchema() {
    return foundry.utils.mergeObject(super.defineSchema(), {
      category: new fields.StringField({ required: true, nullable: false, choices: ["held", "outfit", "accessory", "tool", "weapon", "pack", "consumable", "pokeball", "tm", "tr", "evolution", "material", "quest"], initial: "tool" }),
      quantity: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 }),
      bulk: new fields.NumberField({ required: true, nullable: false, min: 0, initial: 1 }),
      rarity: new fields.StringField({ required: true, nullable: false, choices: ["common", "uncommon", "rare", "exceptional", "unique"], initial: "common" }),
      location: new fields.StringField({ required: true, nullable: false, choices: ["carried", "stored", "assigned"], initial: "carried" }),
      slot: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      assignedActorUuid: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      consumedOnUse: new fields.BooleanField({ required: true, nullable: false, initial: false }),
      suppressed: new fields.BooleanField({ required: true, nullable: false, initial: false }),
      compatibility: tagsField(),
      effects: new fields.ArrayField(new fields.ObjectField({ required: true, nullable: false, initial: {} }), { required: true, nullable: false, initial: [] }),
      sourceMetadata: new fields.ObjectField({ required: true, nullable: false, initial: {} })
    }, { inplace: false });
  }
}

export class CommanderCapabilityData extends CommanderItemBase {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Capability"];

  static defineSchema() {
    return foundry.utils.mergeObject(super.defineSchema(), {
      capabilityType: new fields.StringField({ required: true, nullable: false, choices: ["movement", "sense", "environment", "mount", "utility", "social"], initial: "utility" }),
      movement: new fields.SchemaField({
        mode: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        speed: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
      }),
      automaticSolutions: tagsField()
    }, { inplace: false });
  }
}
