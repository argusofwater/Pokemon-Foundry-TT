const fields = foundry.data.fields;

function tagsField() {
  return new fields.ArrayField(
    new fields.StringField({ required: true, nullable: false, blank: false }),
    { required: true, nullable: false, initial: [] }
  );
}

function statBlockField() {
  return new fields.SchemaField({
    hp: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 10 }),
    attack: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 5 }),
    defense: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 5 }),
    specialAttack: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 5 }),
    specialDefense: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 5 }),
    speed: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 5 })
  });
}

function canonicalStatBlockField() {
  return new fields.SchemaField({
    hp: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    attack: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    defense: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    specialAttack: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    specialDefense: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
    speed: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 })
  });
}

function movementField() {
  return new fields.SchemaField({
    overland: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 5 }),
    swim: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    fly: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    burrow: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    climb: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
  });
}

function requirementField() {
  return new fields.SchemaField({
    itemSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
    trainerTalentSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
    trainerItemSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
    baseSpeciesSlugs: tagsField(),
    campaignFlag: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
  });
}

function formProfileField() {
  return new fields.SchemaField({
    slug: new fields.StringField({ required: true, nullable: false, blank: false }),
    name: new fields.StringField({ required: true, nullable: false, blank: false }),
    family: new fields.StringField({ required: true, nullable: false, choices: ["mega", "primal", "battle", "stance", "weather", "item", "ability", "story"], initial: "battle" }),
    temporary: new fields.BooleanField({ required: true, nullable: false, initial: true }),
    types: tagsField(),
    canonicalStats: canonicalStatBlockField(),
    stats: statBlockField(),
    abilitySlugs: tagsField(),
    movement: movementField(),
    size: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
    portrait: new fields.FilePathField({ required: true, nullable: false, blank: true, initial: "", categories: ["IMAGE"] }),
    token: new fields.FilePathField({ required: true, nullable: false, blank: true, initial: "", categories: ["IMAGE"] }),
    tokenWidth: new fields.NumberField({ required: true, nullable: false, min: 0.5, initial: 1 }),
    tokenHeight: new fields.NumberField({ required: true, nullable: false, min: 0.5, initial: 1 }),
    requirements: requirementField(),
    replacesMoveSlugs: tagsField(),
    addsMoveSlugs: tagsField(),
    tags: tagsField()
  });
}

export class CommanderSpeciesData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["PTU.Commander.Species"];

  static defineSchema() {
    return {
      schema: new fields.SchemaField({
        version: new fields.NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
        lastMigration: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      }),
      slug: new fields.StringField({ required: true, nullable: false, blank: false }),
      description: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" }),
      nationalDex: new fields.NumberField({ required: false, nullable: true, integer: true, min: 1, initial: null }),
      formSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      formKind: new fields.StringField({ required: true, nullable: false, choices: ["base", "regional", "permanent", "temporary", "cosmetic"], initial: "base" }),
      baseSpeciesSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
      types: tagsField(),
      canonicalStats: canonicalStatBlockField(),
      stats: statBlockField(),
      movement: movementField(),
      size: new fields.StringField({ required: true, nullable: false, blank: true, initial: "medium" }),
      heightMeters: new fields.NumberField({ required: true, nullable: false, min: 0, initial: 0 }),
      weightKg: new fields.NumberField({ required: true, nullable: false, min: 0, initial: 0 }),
      weightClass: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 }),
      captureDifficulty: new fields.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      rarity: new fields.StringField({ required: true, nullable: false, choices: ["common", "uncommon", "rare", "exceptional", "legendary", "restricted"], initial: "common" }),
      eggGroups: tagsField(),
      habitatTags: tagsField(),
      temperamentTags: tagsField(),
      capabilitySlugs: tagsField(),
      abilitySlugs: tagsField(),
      talentSlugs: tagsField(),
      learnset: new fields.ArrayField(new fields.SchemaField({
        moveSlug: new fields.StringField({ required: true, nullable: false, blank: false }),
        method: new fields.StringField({ required: true, nullable: false, choices: ["level", "machine", "tm", "tr", "tutor", "egg", "event", "restricted", "dream-world", "virtual-console", "special"], initial: "level" }),
        level: new fields.NumberField({ required: false, nullable: true, integer: true, min: 1, initial: null }),
        source: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      }), { required: true, nullable: false, initial: [] }),
      evolutions: new fields.ArrayField(new fields.SchemaField({
        targetSpeciesSlug: new fields.StringField({ required: true, nullable: false, blank: false }),
        method: new fields.StringField({ required: true, nullable: false, blank: false }),
        level: new fields.NumberField({ required: false, nullable: true, integer: true, min: 1, initial: null }),
        itemSlug: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        condition: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" })
      }), { required: true, nullable: false, initial: [] }),
      forms: new fields.ArrayField(formProfileField(), { required: true, nullable: false, initial: [] }),
      artwork: new fields.SchemaField({
        portrait: new fields.FilePathField({ required: true, nullable: false, blank: true, initial: "", categories: ["IMAGE"] }),
        token: new fields.FilePathField({ required: true, nullable: false, blank: true, initial: "", categories: ["IMAGE"] })
      }),
      source: new fields.SchemaField({
        dataset: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        sourceId: new fields.StringField({ required: true, nullable: false, blank: true, initial: "" }),
        generation: new fields.NumberField({ required: false, nullable: true, integer: true, min: 1, initial: null })
      })
    };
  }
}
