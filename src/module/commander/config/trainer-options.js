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

export const COMMANDER_ROLES = Object.freeze({
  "Ace Trainer": ["Duelist", "Strategist", "Team Captain", "Tactician"],
  "Coordinator": ["Choreographer", "Performer", "Stylist", "Showrunner"],
  "Explorer": ["Guide", "Mountaineer", "Pathfinder", "Scout"],
  "Handler": ["Breeder", "Caretaker", "Rancher", "Rehabilitator"],
  "Medic": ["Combat Medic", "Field Doctor", "Herbalist", "Veterinarian"],
  "Ranger": ["Conservationist", "Rescue Ranger", "Tracker", "Warden"],
  "Researcher": ["Ecologist", "Historian", "Professor", "Species Analyst"],
  "Specialist": ["Engineer", "Investigator", "Negotiator", "Technologist"],
  "Custom": ["Custom"]
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
  return optionList(COMMANDER_ROLES[role] ?? ["Custom"], selected);
}
