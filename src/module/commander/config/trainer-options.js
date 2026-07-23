export const COMMANDER_BACKGROUNDS = Object.freeze([
  "Academic",
  "Athlete",
  "Caregiver",
  "Entertainer",
  "Field Worker",
  "Investigator",
  "Medic",
  "Merchant",
  "Ranger",
  "Research Assistant",
  "Streetwise",
  "Technician",
  "Traveler",
  "Custom"
]);

export const COMMANDER_TRAINER_TABS = Object.freeze([
  "overview",
  "team",
  "skills",
  "talents",
  "inventory",
  "exploration",
  "social",
  "downtime",
  "effects",
  "biography"
]);

// These are the six locked Commander roles. Specialties remain free-form until
// their rules lists are finalized; the sheet preserves existing/custom values.
export const COMMANDER_ROLES = Object.freeze({
  "Ace": [],
  "Field Expert": [],
  "Tactician": [],
  "Vanguard": [],
  "Mystic": [],
  "Performer": []
});

export function optionList(values, selected = "") {
  const entries = [...values];
  if (selected && !entries.includes(selected)) entries.unshift(selected);
  return entries.map(value => ({ value, label: value, selected: value === selected }));
}

export function roleOptions(selected = "") {
  return optionList(Object.keys(COMMANDER_ROLES), selected);
}

export function specialtyOptions(role, selected = "") {
  return optionList(COMMANDER_ROLES[role] ?? [], selected);
}
