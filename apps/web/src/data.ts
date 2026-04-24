export interface Weapon {
  id: string;
  kind: 'base' | 'named' | 'exotic';
  category: string;
  baseDamage: number;
  rpm: number;
  magazine: number;
  reloadSeconds: number;
  optimalRange?: number;
  headshotMultiplier: number;
  talentId?: string;
  brandId?: string;
  modSlots: string[];
  /** Exotic talent type: amp|kill|stacks|shot_cover|hs_kill|swap_in|conditional|no_reload */
  talType?: string;
  /** % bonus per stack (or total for amp/swap_in) */
  talBonus?: number;
  /** Max stacks (for stacking talents) */
  talMax?: number;
  /** 'amp' = additive exotic bonus, else peak-only */
  exoticAmpType?: string;
  exoticPeakWd?: number;
  exoticPeakChc?: number;
  exoticPeakChd?: number;
  isBurst?: boolean;
  burstNote?: string;
}

export interface Brand {
  id: string;
  bonuses: Array<{ pieces: number; bonus: { stat: string; value: number } }>;
  core: string;
  dlc?: string | null;
}

export interface GearSet {
  id: string;
  type: 'red' | 'blue' | 'yellow' | 'purple';
  numericBonuses: Array<{ pieces: number; bonus: { stat: string; value: number } }>;
  chestTalentId?: string;
  backpackTalentId?: string;
  dlc?: string | null;
}

export interface Talent {
  id: string;
  kind: 'weapon' | 'chest' | 'backpack' | 'gloves';
  bonusType: 'additive' | 'amplified' | 'conditional';
  bonuses: Array<{ stat: string; value: number }>;
  applicableWeaponClasses?: string[];
  hasPerfectVariant?: boolean;
}

export interface NamedGear {
  id: string;
  slot: 'chest' | 'backpack' | 'gloves' | 'mask' | 'holster' | 'kneepads';
  brand?: string;
  core: string;
  fixedAttrs: Array<{ stat: string; value: number }>;
}

export interface GameData {
  weapons: Weapon[];
  brands: Brand[];
  sets: GearSet[];
  talents: Talent[];
  namedGear: NamedGear[];
  byId: {
    weapon: Map<string, Weapon>;
    brand: Map<string, Brand>;
    set: Map<string, GearSet>;
    talent: Map<string, Talent>;
    namedGear: Map<string, NamedGear>;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return (await r.json()) as T;
}

import { loadWeaponMods } from './data/weapon-mods.js';

export async function loadGameData(): Promise<GameData> {
  const [weaponsFile, brandsFile, setsFile, talentsFile, namedFile] = await Promise.all([
    fetchJson<{ weapons: Weapon[] }>('/data/weapons.json'),
    fetchJson<{ brands: Brand[] }>('/data/brands.json'),
    fetchJson<{ sets: GearSet[] }>('/data/gear-sets.json'),
    fetchJson<{ talents: Talent[] }>('/data/talents.json'),
    fetchJson<{ items: NamedGear[] }>('/data/named-gear.json'),
    loadWeaponMods(),
  ]);

  const data: GameData = {
    weapons: weaponsFile.weapons,
    brands: brandsFile.brands,
    sets: setsFile.sets,
    talents: talentsFile.talents,
    namedGear: namedFile.items,
    byId: {
      weapon: new Map(weaponsFile.weapons.map((w) => [w.id, w])),
      brand: new Map(brandsFile.brands.map((b) => [b.id, b])),
      set: new Map(setsFile.sets.map((s) => [s.id, s])),
      talent: new Map(talentsFile.talents.map((t) => [t.id, t])),
      namedGear: new Map(namedFile.items.map((n) => [n.id, n])),
    },
  };
  return data;
}
