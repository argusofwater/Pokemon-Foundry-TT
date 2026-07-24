export const COMMANDER_RANK_BONUS = Object.freeze({
  untrained: 0,
  novice: 2,
  adept: 4,
  expert: 6,
  master: 8
});

export const COMMANDER_POWER_BANDS = Object.freeze([
  { max: 20, dice: 1 },
  { max: 40, dice: 2 },
  { max: 60, dice: 3 },
  { max: 80, dice: 4 },
  { max: 100, dice: 5 },
  { max: 120, dice: 6 },
  { max: 140, dice: 7 },
  { max: Infinity, dice: 8 }
]);

const TYPE_CHART = Object.freeze({
  normal: { rock: -1, ghost: -99, steel: -1 },
  fire: { fire: -1, water: -1, grass: 1, ice: 1, bug: 1, rock: -1, dragon: -1, steel: 1 },
  water: { fire: 1, water: -1, grass: -1, ground: 1, rock: 1, dragon: -1 },
  electric: { water: 1, electric: -1, grass: -1, ground: -99, flying: 1, dragon: -1 },
  grass: { fire: -1, water: 1, grass: -1, poison: -1, ground: 1, flying: -1, bug: -1, rock: 1, dragon: -1, steel: -1 },
  ice: { fire: -1, water: -1, grass: 1, ice: -1, ground: 1, flying: 1, dragon: 1, steel: -1 },
  fighting: { normal: 1, ice: 1, poison: -1, flying: -1, psychic: -1, bug: -1, rock: 1, ghost: -99, dark: 1, steel: 1, fairy: -1 },
  poison: { grass: 1, poison: -1, ground: -1, rock: -1, ghost: -1, steel: -99, fairy: 1 },
  ground: { fire: 1, electric: 1, grass: -1, poison: 1, flying: -99, bug: -1, rock: 1, steel: 1 },
  flying: { electric: -1, grass: 1, fighting: 1, bug: 1, rock: -1, steel: -1 },
  psychic: { fighting: 1, poison: 1, psychic: -1, dark: -99, steel: -1 },
  bug: { fire: -1, grass: 1, fighting: -1, poison: -1, flying: -1, psychic: 1, ghost: -1, dark: 1, steel: -1, fairy: -1 },
  rock: { fire: 1, ice: 1, fighting: -1, ground: -1, flying: 1, bug: 1, steel: -1 },
  ghost: { normal: -99, psychic: 1, ghost: 1, dark: -1 },
  dragon: { dragon: 1, steel: -1, fairy: -99 },
  dark: { fighting: -1, psychic: 1, ghost: 1, dark: -1, fairy: -1 },
  steel: { fire: -1, water: -1, electric: -1, ice: 1, rock: 1, steel: -1, fairy: 1 },
  fairy: { fire: -1, fighting: 1, poison: -1, dragon: 1, dark: 1, steel: -1 }
});

export class CommanderRulesEngine {
  static rankBonus(rank) {
    return COMMANDER_RANK_BONUS[String(rank ?? "untrained").toLowerCase()] ?? 0;
  }

  static powerDice(power) {
    const numeric = Math.max(0, Number(power) || 0);
    if (numeric <= 0) return 0;
    return COMMANDER_POWER_BANDS.find(band => numeric <= band.max)?.dice ?? 8;
  }

  static typeDiceShift(moveType, defenderTypes = []) {
    const attackType = String(moveType ?? "").toLowerCase();
    if (!attackType) return { shift: 0, immune: false, label: "Neutral" };
    let shift = 0;
    for (const type of defenderTypes ?? []) {
      const value = TYPE_CHART[attackType]?.[String(type).toLowerCase()] ?? 0;
      if (value === -99) return { shift: 0, immune: true, label: "Immune" };
      shift += value;
    }
    return { shift, immune: false, label: shift > 0 ? "Super Effective" : shift < 0 ? "Resisted" : "Neutral" };
  }

  static damageProfile({ attacker, target, move, critical = false } = {}) {
    const system = move?.system ?? {};
    const category = String(system.category ?? "status").toLowerCase();
    const baseDice = this.powerDice(system.power);
    const targetTypes = target?.system?.identity?.types ?? [];
    const typing = this.typeDiceShift(system.type, targetTypes);
    const finalDice = typing.immune ? 0 : Math.max(0, Math.min(8, baseDice + typing.shift));
    const attackerTypes = attacker?.system?.identity?.types ?? [];
    const stab = attackerTypes.map(type => String(type).toLowerCase()).includes(String(system.type ?? "").toLowerCase());
    const flat = stab ? finalDice * 2 : 0;
    return { category, baseDice, finalDice, flat, stab, critical, typing };
  }

  static checkFormula({ rank = "untrained", attribute = 0, misc = 0, situational = 0, favored = false, hindered = false } = {}) {
    const bonus = Number(attribute || 0) + this.rankBonus(rank) + Number(misc || 0) + Number(situational || 0);
    const dice = favored === hindered ? "1d20" : favored ? "2d20kh" : "2d20kl";
    return { dice, bonus, formula: `${dice} + ${bonus}` };
  }
}
