export type GearModCategory = 'offense' | 'defense' | 'skill';

export interface GearModAttr {
  id: string;
  stat: string;
  value: number;
  category: GearModCategory;
  name: { en: string; ru: string };
}

export const GEAR_MODS: GearModAttr[] = [
  // Offense (Атака)
  { id: 'gm_chc', stat: 'chc', value: 6, category: 'offense', name: { en: 'Critical Hit Chance', ru: 'Шанс крит. попадания' } },
  { id: 'gm_chd', stat: 'chd', value: 12, category: 'offense', name: { en: 'Critical Hit Damage', ru: 'Урон от крит. попадания' } },
  { id: 'gm_hsd', stat: 'hsd', value: 10, category: 'offense', name: { en: 'Headshot Damage', ru: 'Урон от выстрелов в голову' } },

  // Defense (Оборона)
  { id: 'gm_aok', stat: 'armor_on_kill', value: 18935, category: 'defense', name: { en: 'Armor on Kill', ru: 'Броня за убийство' } },
  { id: 'gm_bleed_res', stat: 'bleed_resist', value: 10, category: 'defense', name: { en: 'Bleed Resistance', ru: 'Сопротивление кровотечению' } },
  { id: 'gm_blind_res', stat: 'blind_resist', value: 10, category: 'defense', name: { en: 'Blind Resistance', ru: 'Сопротивление ослеплению' } },
  { id: 'gm_burn_res', stat: 'burn_resist', value: 10, category: 'defense', name: { en: 'Burn Resistance', ru: 'Сопротивление возгоранию' } },
  { id: 'gm_disorient_res', stat: 'disorient_resist', value: 10, category: 'defense', name: { en: 'Disorient Resistance', ru: 'Сопротивление дезориентации' } },
  { id: 'gm_freeze_res', stat: 'freeze_resist', value: 10, category: 'defense', name: { en: 'Freeze Resistance', ru: 'Сопротивление заморозке' } },
  { id: 'gm_ensnare_res', stat: 'ensnare_resist', value: 10, category: 'defense', name: { en: 'Ensnare Resistance', ru: 'Сопротивление прилипанию' } },
  { id: 'gm_incoming_repairs', stat: 'incoming_repairs', value: 20, category: 'defense', name: { en: 'Incoming Repairs', ru: 'Получаемый ремонт' } },
  { id: 'gm_protection_elites', stat: 'protection_elites', value: 13, category: 'defense', name: { en: 'Protection from Elites', ru: 'Защита от Элитных врагов' } },
  { id: 'gm_pulse_res', stat: 'pulse_resist', value: 10, category: 'defense', name: { en: 'Pulse Resistance', ru: 'Сопротивление импульсу' } },
  { id: 'gm_shock_res', stat: 'shock_resist', value: 10, category: 'defense', name: { en: 'Shock Resistance', ru: 'Сопротивление шоку' } },

  // Skill (Навык)
  { id: 'gm_skill_duration', stat: 'skill_duration', value: 10, category: 'skill', name: { en: 'Skill Duration', ru: 'Длительность действия навыка' } },
  { id: 'gm_skill_haste', stat: 'skill_haste', value: 12, category: 'skill', name: { en: 'Skill Haste', ru: 'Убыстрение навыков' } },
  { id: 'gm_repair_skills', stat: 'repair_skills', value: 20, category: 'skill', name: { en: 'Repair Skills', ru: 'Навыки ремонта' } },
];

export const CATEGORY_LABELS: Record<GearModCategory, { en: string; ru: string; color: string }> = {
  offense: { en: 'Offense', ru: 'Атака', color: '#ef5350' },
  defense: { en: 'Defense', ru: 'Оборона', color: '#42a5f5' },
  skill: { en: 'Skill', ru: 'Навык', color: '#ffd84a' },
};

export function findGearMod(id: string): GearModAttr | undefined {
  return GEAR_MODS.find((m) => m.id === id);
}

/** Preset configurations for the 3 mod slots (chest/backpack/mask). */
export interface ModPreset {
  id: string;
  name: { en: string; ru: string };
  description: { en: string; ru: string };
  /** mod ids for chest / backpack / mask */
  mods: [string, string, string];
}

export const MOD_PRESETS: ModPreset[] = [
  {
    id: 'dd',
    name: { en: 'DD (Damage Dealer)', ru: 'ДД (Урон)' },
    description: { en: '3× CHD = +36% Crit Damage', ru: '3× CHD = +36% урон крита' },
    mods: ['gm_chd', 'gm_chd', 'gm_chd'],
  },
  {
    id: 'sniper',
    name: { en: 'Sniper', ru: 'Снайпер' },
    description: { en: '3× HSD = +30% Headshot', ru: '3× HSD = +30% в голову' },
    mods: ['gm_hsd', 'gm_hsd', 'gm_hsd'],
  },
  {
    id: 'crit',
    name: { en: 'Crit Chance', ru: 'Крит-шанс' },
    description: { en: '3× CHC = +18% Crit Chance (hit 60% cap)', ru: '3× CHC = +18% к шансу крита (до cap 60%)' },
    mods: ['gm_chc', 'gm_chc', 'gm_chc'],
  },
  {
    id: 'hybrid_crit',
    name: { en: 'Hybrid: 1CHC + 2CHD', ru: 'Гибрид: 1CHC + 2CHD' },
    description: { en: '+6% CHC, +24% CHD', ru: '+6% CHC, +24% CHD' },
    mods: ['gm_chc', 'gm_chd', 'gm_chd'],
  },
  {
    id: 'hybrid_hs',
    name: { en: 'Hybrid: 1CHD + 2HSD', ru: 'Гибрид: 1CHD + 2HSD' },
    description: { en: '+12% CHD, +20% HSD', ru: '+12% CHD, +20% HSD' },
    mods: ['gm_chd', 'gm_hsd', 'gm_hsd'],
  },
  {
    id: 'skill',
    name: { en: 'Skill DPS', ru: 'Скилл DPS' },
    description: { en: '3× Skill Haste = +36%', ru: '3× Ускорение = +36%' },
    mods: ['gm_skill_haste', 'gm_skill_haste', 'gm_skill_haste'],
  },
  {
    id: 'tank',
    name: { en: 'Tank', ru: 'Танк' },
    description: { en: '2× Protection + 1× AoK', ru: '2× Защита + 1× AoK' },
    mods: ['gm_protection_elites', 'gm_protection_elites', 'gm_aok'],
  },
];

export function findModPreset(id: string): ModPreset | undefined {
  return MOD_PRESETS.find((p) => p.id === id);
}
