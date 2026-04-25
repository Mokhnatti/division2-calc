import setsRaw from './gear-sets.json';

export interface GearSetBonus {
  pieces: number;
  bonus: { stat: string; value: number };
}

export interface GearSet {
  id: string;
  type: 'red' | 'yellow' | 'blue' | 'green';
  numericBonuses: GearSetBonus[];
  chestTalentId?: string;
  backpackTalentId?: string;
  dlc?: string | null;
}

const data = setsRaw as { version: string; gameVersion: string; sets: GearSet[] };
export const SETS: GearSet[] = data.sets;

export function setSlug(id: string): string {
  return id.toLowerCase().replace(/_s_/g, 's-').replace(/_s$/, 's').replace(/_/g, '-');
}
const slugMap = new Map<string, string>();
for (const s of SETS) slugMap.set(setSlug(s.id), s.id);
export function setIdFromSlug(slug: string): string | undefined { return slugMap.get(slug); }

export function setName(s: GearSet, lang: 'en' | 'ru' = 'en'): string {
  const names: Record<string, { en: string; ru: string }> = {
    striker_s_battlegear: { en: "Striker's Battlegear", ru: 'Снаряжение боевика' },
    heartbreaker: { en: 'Heartbreaker', ru: 'Разбиватель сердец' },
    umbra_initiative: { en: 'Umbra Initiative', ru: 'Инициатива Умбра' },
    hunter_s_fury: { en: "Hunter's Fury", ru: 'Ярость охотника' },
    negotiator_s_dilemma: { en: "Negotiator's Dilemma", ru: 'Дилемма переговорщика' },
    eclipse_protocol: { en: 'Eclipse Protocol', ru: 'Протокол Затмения' },
    aces_eights: { en: 'Aces and Eights', ru: 'Восьмёрки и тузы' },
    tip_of_the_spear: { en: 'Tip of the Spear', ru: 'Острие копья' },
    perfect_alignment: { en: 'Perfect Alignment', ru: 'Идеальное равновесие' },
    ongoing_directive: { en: 'Ongoing Directive', ru: 'Бессрочная директива' },
    ridgeway_s_pride: { en: "Ridgeway's Pride", ru: 'Гордость Риджуэя' },
  };
  return names[s.id]?.[lang] || s.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function typeColor(type: GearSet['type']): string {
  return { red: '#ef5350', yellow: '#fdd835', blue: '#42a5f5', green: '#66bb6a' }[type] || '#888';
}

export function typeLabel(type: GearSet['type'], lang: 'en' | 'ru' = 'en'): string {
  const labels = {
    en: { red: 'DPS / Red', yellow: 'Skill / Yellow', blue: 'Tank / Blue', green: 'Hybrid / Green' },
    ru: { red: 'ДПС / Красный', yellow: 'Скилл / Жёлтый', blue: 'Танк / Синий', green: 'Гибрид / Зелёный' },
  };
  return labels[lang][type] || type;
}
