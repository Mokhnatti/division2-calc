import weaponsRaw from './weapons.json';

export interface Weapon {
  id: string;
  kind: 'base' | 'named' | 'exotic';
  category: 'ar' | 'smg' | 'lmg' | 'mmr' | 'rifle' | 'shotgun' | 'pistol';
  baseDamage: number;
  rpm: number;
  magazine: number;
  reloadSeconds: number;
  optimalRange?: number;
  headshotMultiplier?: number;
  modSlots?: string[];
  intrinsicAttrs?: Array<{ stat: string; value: number; max?: number }>;
  builtInMods?: Array<{ slot: string; stat: string; value: number; name_ru?: string }>;
  appliesBurn?: boolean;
  burnThresholdPct?: number;
  talentId?: string;
  talType?: string;
  talBonus?: number;
  talMax?: number;
}

const data = weaponsRaw as { version: string; gameVersion: string; weapons: Weapon[] };

export const WEAPONS: Weapon[] = data.weapons;

/**
 * Slugify weapon id: keep lowercase ASCII hyphenated, strip apostrophes.
 * Per plan: "St. Elmo's Engine" → "st-elmos-engine" (apostrophes stripped, NOT split)
 */
export function slugFromId(id: string): string {
  return id
    .toLowerCase()
    .replace(/_s_/g, 's-')   // st_elmo_s_engine → st-elmos-engine
    .replace(/_s$/, 's')     // trailing _s → s
    .replace(/_/g, '-');
}

/** Inverse: slug → original id */
const slugIdMap = new Map<string, string>();
for (const w of WEAPONS) {
  slugIdMap.set(slugFromId(w.id), w.id);
}
export function idFromSlug(slug: string): string | undefined {
  return slugIdMap.get(slug);
}

/** Display name from i18n locale (placeholder — wire up real i18n later) */
export function weaponName(w: Weapon, lang: 'en' | 'ru' = 'en'): string {
  // TODO: wire up locales/{en,ru}/weapons.json
  return w.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function weaponCategoryLabel(cat: Weapon['category'], lang: 'en' | 'ru' = 'en'): string {
  const labels = {
    en: { ar: 'Assault Rifle', smg: 'SMG', lmg: 'LMG', mmr: 'Marksman Rifle', rifle: 'Rifle', shotgun: 'Shotgun', pistol: 'Pistol' },
    ru: { ar: 'Штурмовая винтовка', smg: 'ПП', lmg: 'Пулемёт', mmr: 'Снайперская винтовка', rifle: 'Винтовка', shotgun: 'Дробовик', pistol: 'Пистолет' },
  };
  return labels[lang][cat] || cat;
}

export function getWeaponBySlug(slug: string): Weapon | undefined {
  const id = idFromSlug(slug);
  if (!id) return undefined;
  return WEAPONS.find(w => w.id === id);
}
