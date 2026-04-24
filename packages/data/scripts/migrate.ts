import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '../../..');
const OLD_DATA_DIR = join(REPO_ROOT, 'data');
const OUT_DATA_DIR = join(REPO_ROOT, 'packages/data/generated');
const OUT_LOCALES_DIR = join(REPO_ROOT, 'apps/web/public/locales');
const OUT_PUBLIC_DATA_DIR = join(REPO_ROOT, 'apps/web/public/data');

const GAME_VERSION = 'TU23.1';
const DATA_VERSION = '2.0.0';

mkdirSync(OUT_DATA_DIR, { recursive: true });
mkdirSync(join(OUT_LOCALES_DIR, 'en'), { recursive: true });
mkdirSync(join(OUT_LOCALES_DIR, 'ru'), { recursive: true });
mkdirSync(OUT_PUBLIC_DATA_DIR, { recursive: true });

function readJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/_+/g, '_');
}

interface OldBrand {
  name: string;
  name_full_en?: string;
  aliases_en?: string[];
  bonuses?: string[];
  core_en?: string;
  dlc?: string | null;
}

interface OldWeaponBase {
  name: string;
  type: string;
  quality?: string;
  dmg: number;
  rpm: number;
  mag: number;
  reload: number;
  range?: number;
  hsd?: number;
  slots?: string[];
}

function qualityToKind(q: string | undefined): 'base' | 'named' | 'exotic' {
  const s = (q || '').toLowerCase();
  if (s === 'exotic') return 'exotic';
  if (s === 'named') return 'named';
  return 'base';
}

interface OldGearSet {
  name: string;
  en: string;
  type: string;
  bonuses?: string[];
  chest?: string;
  bp?: string;
  chest_talent_en?: string;
  bp_talent_en?: string;
  dlc?: string | null;
}

const STAT_PATTERNS: Array<[RegExp, string]> = [
  [/Шанс крит\.? (попадания|удара)|Crit(ical Hit)? Chance|CHC/i, 'chc'],
  [/Урон (крит\.? (попадания|удара)|от крит\.? попадания)|Crit(ical Hit)? Damage|CHD/i, 'chd'],
  [/Урон (в голову|от выстрелов в голову)|Headshot Damage|HSD/i, 'hsd'],
  [/(Скорострельность|Rate of Fire|RoF)/i, 'rof'],
  [/(Размер магазина|Ёмкость магазина|Magazine Size)/i, 'mag'],
  [/(Скорость перезарядки|Reload Speed)/i, 'reload'],
  [/(Эргономика|Управление|Weapon Handling|Handling)/i, 'handling'],
  [/(Урон оружия|Weapon Damage|WD)(?! AR| SMG| LMG| MMR)/i, 'wd'],
  [/(Броня|Armor)\b(?! on Kill| Regen)/i, 'armor'],
  [/(Броня за убийство|Armor on Kill)/i, 'armor_on_kill'],
  [/(Восстан\.? брони|Armor Regen)/i, 'armor_regen'],
  [/(Здоровье|Health)\b(?! on Kill)/i, 'health'],
  [/(HP за убийство|Health on Kill)/i, 'health_on_kill'],
  [/(Защита от опасностей|Hazard Protection)/i, 'hazard_prot'],
  [/(Сопр\.? взрыву|Explosive Resist)/i, 'explosive_resist'],
  [/(Уровень скиллов|Skill Tier)/i, 'skill_tier'],
  [/(Ускорение скиллов|Ускорение навыков|Skill Haste)/i, 'skill_haste'],
  [/(Урон скиллов|Урон навыков|Skill Damage)/i, 'skill_dmg'],
  [/(Длительность скиллов|Skill Duration)/i, 'skill_duration'],
  [/(HP скиллов|Skill Health)/i, 'skill_health'],
  [/(Эффекты состояний|Status Effects)/i, 'status_effects'],
  [/(Урон вне укрытия|Damage out of Cover|OoC)/i, 'ooc'],
  [/(Урон по броне|Damage to Armor)/i, 'dta'],
  [/(Урон по здоровью|Damage to Health)/i, 'dth'],
  [/(Урон по элитам|Damage to Elites)/i, 'elite'],
];

function parseStat(text: string): string | null {
  for (const [rx, key] of STAT_PATTERNS) {
    if (rx.test(text)) return key;
  }
  return null;
}

function parseBonusLine(line: string): { pieces: number; stat: string; value: number } | null {
  const m = /(\d+)\s*(шт|pc)\.?\s*[:\-]?\s*\+?(\d+(?:\.\d+)?)\s*%?\s*(.+)/i.exec(line);
  if (!m) return null;
  const pieces = parseInt(m[1] as string, 10);
  const value = parseFloat(m[3] as string);
  const statText = m[4] as string;
  const stat = parseStat(statText);
  if (!stat) return null;
  return { pieces, stat, value };
}

function coreToStat(core: string | undefined): string {
  if (!core) return 'wd';
  const c = core.toLowerCase();
  if (c.includes('weapon')) return 'wd';
  if (c.includes('armor')) return 'armor';
  if (c.includes('skill')) return 'skill_tier';
  return 'wd';
}

function weaponTypeToCategory(t: string): string {
  const m = t.trim().toLowerCase();
  if (m.startsWith('ar')) return 'ar';
  if (m.startsWith('smg')) return 'smg';
  if (m.startsWith('lmg')) return 'lmg';
  if (m.startsWith('mmr')) return 'mmr';
  if (m.startsWith('rifle')) return 'rifle';
  if (m.startsWith('sg') || m.startsWith('shotgun')) return 'shotgun';
  if (m.startsWith('pistol')) return 'pistol';
  return 'ar';
}

const usedIds = new Set<string>();
function makeId(base: string): string {
  let id = slugify(base);
  if (!id) id = 'unknown';
  let tryId = id;
  let i = 2;
  while (usedIds.has(tryId)) tryId = `${id}_${i++}`;
  usedIds.add(tryId);
  return tryId;
}

// ============================================================
// BRANDS
// ============================================================

console.log('→ Migrating brands...');
const oldBrands = readJson<OldBrand[]>(join(OLD_DATA_DIR, 'brands.json'));

const translationsEn = (() => {
  try {
    return readJson<{ brands?: Record<string, { bonuses?: string[] }>; sets?: Record<string, { bonuses?: string[]; chest?: string; bp?: string }>; exotics?: Record<string, { tal?: string; d?: string }>; named?: Record<string, { tal?: string; d?: string }> }>(join(REPO_ROOT, 'translations_en.json'));
  } catch { return {}; }
})();

const brandsEn: Record<string, string> = {};
const brandsRu: Record<string, string> = {};
const brandBonusesEn: Record<string, string[]> = {};
const brandBonusesRu: Record<string, string[]> = {};
const newBrands = oldBrands
  .filter((b) => Array.isArray(b.bonuses) && b.bonuses.length > 0)
  .map((b) => {
  const id = makeId(b.name_full_en || b.name);
  const nameEn = b.name_full_en || b.name;
  const nameRu = b.name;

  const bonuses: Array<{ pieces: number; bonus: { stat: string; value: number } }> = [];
  for (const line of b.bonuses || []) {
    const parsed = parseBonusLine(line);
    if (parsed) {
      bonuses.push({ pieces: parsed.pieces, bonus: { stat: parsed.stat as never, value: parsed.value } });
    }
  }

  brandsEn[id] = nameEn;
  brandsRu[id] = nameRu;

  if (b.bonuses && b.bonuses.length) {
    brandBonusesRu[id] = b.bonuses;
  }
  const enCandidates = [nameEn, ...(b.aliases_en || [])];
  let enText: string[] | undefined;
  for (const c of enCandidates) {
    enText = translationsEn.brands?.[c]?.bonuses;
    if (enText && enText.length) break;
  }
  if (enText && enText.length) {
    brandBonusesEn[id] = enText;
  } else if (b.bonuses && b.bonuses.length) {
    brandBonusesEn[id] = b.bonuses;
  }

  return {
    id,
    bonuses,
    core: coreToStat(b.core_en),
    dlc: b.dlc ?? null,
  };
});

writeJson(join(OUT_PUBLIC_DATA_DIR, 'brands.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  brands: newBrands,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'brands.json'), brandsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'brands.json'), brandsRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'brand-bonuses.json'), brandBonusesEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'brand-bonuses.json'), brandBonusesRu);
console.log(`  ✓ ${newBrands.length} brands`);

// ============================================================
// GEAR SETS
// ============================================================

console.log('→ Migrating gear sets...');
const oldSets = readJson<OldGearSet[]>(join(OLD_DATA_DIR, 'gear_sets.json'));
const setsEn: Record<string, string> = {};
const setsRu: Record<string, string> = {};
const setBonusesEn: Record<string, string[]> = {};
const setBonusesRu: Record<string, string[]> = {};
const setChestDescEn: Record<string, string> = {};
const setChestDescRu: Record<string, string> = {};
const setBpDescEn: Record<string, string> = {};
const setBpDescRu: Record<string, string> = {};
const newSets = oldSets.map((s) => {
  const id = makeId(s.en);

  const numericBonuses: Array<{ pieces: number; bonus: { stat: string; value: number } }> = [];
  for (const line of s.bonuses || []) {
    const parsed = parseBonusLine(line);
    if (parsed) {
      numericBonuses.push({ pieces: parsed.pieces, bonus: { stat: parsed.stat as never, value: parsed.value } });
    }
  }

  const typeMap: Record<string, string> = { red: 'red', blue: 'blue', yellow: 'yellow', purple: 'purple' };

  setsEn[id] = s.en;
  setsRu[id] = s.name;

  if (s.bonuses && s.bonuses.length) setBonusesRu[id] = s.bonuses;
  const enEntry = translationsEn.sets?.[s.en];
  if (enEntry?.bonuses?.length) setBonusesEn[id] = enEntry.bonuses;
  else if (s.bonuses && s.bonuses.length) setBonusesEn[id] = s.bonuses;

  if (s.chest) setChestDescRu[id] = s.chest;
  if (enEntry?.chest) setChestDescEn[id] = enEntry.chest;
  else if (s.chest) setChestDescEn[id] = s.chest;
  if (s.bp) setBpDescRu[id] = s.bp;
  if (enEntry?.bp) setBpDescEn[id] = enEntry.bp;
  else if (s.bp) setBpDescEn[id] = s.bp;

  return {
    id,
    type: typeMap[s.type] || 'red',
    numericBonuses,
    chestTalentId: s.chest_talent_en ? slugify(s.chest_talent_en) : undefined,
    backpackTalentId: s.bp_talent_en ? slugify(s.bp_talent_en) : undefined,
    dlc: s.dlc ?? null,
  };
});

writeJson(join(OUT_PUBLIC_DATA_DIR, 'gear-sets.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  sets: newSets,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'gear-sets.json'), setsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'gear-sets.json'), setsRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'set-bonuses.json'), setBonusesEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'set-bonuses.json'), setBonusesRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'set-chest.json'), setChestDescEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'set-chest.json'), setChestDescRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'set-backpack.json'), setBpDescEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'set-backpack.json'), setBpDescRu);
console.log(`  ✓ ${newSets.length} gear sets`);

// ============================================================
// WEAPON MODS (94 mods from game files)
// ============================================================

console.log('→ Migrating weapon mods...');
interface OldWeaponMod {
  name_en?: string;
  name_ru?: string;
  type_en?: string | null;
  slot_en?: string | null;
  bonus_en?: string | null;
  bonus_ru?: string | null;
  penalty_en?: string | null;
  penalty_ru?: string | null;
  stat?: string;
  stat_ru?: string;
  value?: string;
  source_en?: string;
  source_ru?: string;
}

const oldWeaponMods = readJson<OldWeaponMod[]>(join(OLD_DATA_DIR, 'weapon_mods.json'));
const TYPE_MAP: Record<string, string> = {
  'OPTICS RAIL': 'optic',
  'MUZZLE SLOT': 'muzzle',
  'UNDERBARREL': 'underbarrel',
  'MAGAZINE SLOT': 'magazine',
};
function parseModPct(value: string | undefined): number {
  if (!value) return 0;
  const m = /([+-]?\d+(?:\.\d+)?)/.exec(value);
  return m ? parseFloat(m[1] as string) : 0;
}
function statToKey(stat: string | undefined): string | null {
  if (!stat) return null;
  const s = stat.toLowerCase();
  if (s.includes('crit') && s.includes('damage')) return 'chd';
  if (s.includes('crit') && s.includes('chance')) return 'chc';
  if (s.includes('headshot')) return 'hsd';
  if (s.includes('weapon damage')) return 'wd';
  if (s.includes('reload')) return 'reload';
  if (s.includes('magazine')) return 'mag';
  if (s.includes('optimal range') || s.includes('range')) return 'range';
  if (s.includes('handling')) return 'handling';
  if (s.includes('accuracy')) return 'accuracy';
  if (s.includes('stability')) return 'stability';
  return null;
}

const weaponModsEn: Record<string, string> = {};
const weaponModsRu: Record<string, string> = {};
const newWeaponMods: Array<Record<string, unknown>> = [];
usedIds.clear();
for (const m of oldWeaponMods) {
  if (!m.name_en) continue;
  const id = makeId(m.name_en);
  const slotRaw = m.type_en || m.slot_en || '';
  const slot = TYPE_MAP[slotRaw] || 'optic';
  const stat = statToKey(m.stat);
  const value = parseModPct(m.value);
  newWeaponMods.push({
    id, slot,
    stat: stat || null,
    value,
    rawStat: m.stat || null,
  });
  weaponModsEn[id] = m.name_en;
  weaponModsRu[id] = m.name_ru || m.name_en;
}
writeJson(join(OUT_PUBLIC_DATA_DIR, 'weapon-mods.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  mods: newWeaponMods,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'weapon-mods.json'), weaponModsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'weapon-mods.json'), weaponModsRu);
console.log(`  ✓ ${newWeaponMods.length} weapon mods`);

// ============================================================
// NAMED GEAR (armor pieces with fixed talents)
// ============================================================

console.log('→ Migrating named gear...');
interface OldNamedGear {
  name: string;
  en: string;
  g?: string;
  t?: string;
  brand?: string;
  bonus_ru?: string;
  bonus_short_en?: string;
  core?: string | string[];
  attr1?: Record<string, number>;
  attr2?: Record<string, number>;
}
const oldNamedGearRaw = readJson<OldNamedGear[]>(join(OLD_DATA_DIR, 'named_gear.json'));
const _mergedNamed = new Map<string, OldNamedGear>();
for (const ng of oldNamedGearRaw) {
  const key = (ng.en || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!key) continue;
  const existing = _mergedNamed.get(key);
  if (!existing) {
    _mergedNamed.set(key, { ...ng });
  } else {
    _mergedNamed.set(key, {
      ...existing,
      ...ng,
      name: ng.name || existing.name,
      en: existing.en || ng.en,
      brand: ng.brand || existing.brand,
      bonus_ru: existing.bonus_ru || ng.bonus_ru,
      bonus_short_en: existing.bonus_short_en || ng.bonus_short_en,
      core: existing.core || ng.core,
      attr1: existing.attr1 || ng.attr1,
      attr2: existing.attr2 || ng.attr2,
      g: existing.g || ng.g,
      t: existing.t || ng.t,
    });
  }
}
const oldNamedGear = Array.from(_mergedNamed.values());

const SLOT_MAP_RU: Record<string, string> = {
  'Маска': 'mask',
  'Нагрудник': 'chest',
  'Рюкзак': 'backpack',
  'Перчатки': 'gloves',
  'Кобура': 'holster',
  'Кобуры': 'holster',
  'Наколенники': 'kneepads',
};

const namedGearEn: Record<string, string> = {};
const namedGearRu: Record<string, string> = {};
const namedGearBonusEn: Record<string, string> = {};
const namedGearBonusRu: Record<string, string> = {};
const newNamedGear: Array<Record<string, unknown>> = [];

usedIds.clear();
for (const n of oldNamedGear) {
  if (!n.en) continue;
  const id = makeId(n.en);
  const slotKey = SLOT_MAP_RU[n.g || ''] || 'chest';
  const attrs: Array<{ stat: string; value: number }> = [];
  for (const a of [n.attr1, n.attr2]) {
    if (!a) continue;
    for (const [k, v] of Object.entries(a)) {
      if (typeof v === 'number') {
        const stat = parseStat(k);
        if (stat) attrs.push({ stat, value: v });
      }
    }
  }
  newNamedGear.push({
    id,
    slot: slotKey,
    brand: n.brand ? slugify(n.brand) : undefined,
    core: Array.isArray(n.core) ? coreToStat((n.core)[0]) : coreToStat(n.core as string),
    fixedAttrs: attrs,
  });
  namedGearEn[id] = n.en;
  namedGearRu[id] = n.name;
  const bEn = n.bonus_short_en || n.bonus_ru || '';
  const bRu = n.bonus_ru || n.bonus_short_en || '';
  if (bEn) namedGearBonusEn[id] = bEn;
  if (bRu) namedGearBonusRu[id] = bRu;
}

writeJson(join(OUT_PUBLIC_DATA_DIR, 'named-gear.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  items: newNamedGear,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'named-gear.json'), namedGearEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'named-gear.json'), namedGearRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'named-bonus.json'), namedGearBonusEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'named-bonus.json'), namedGearBonusRu);
console.log(`  ✓ ${newNamedGear.length} named gear items`);

// ============================================================
// WEAPONS (base + named + exotic)
// ============================================================

console.log('→ Migrating weapons...');
usedIds.clear();
const oldWeaponsBase = readJson<OldWeaponBase[]>(join(OLD_DATA_DIR, 'weapons_base.json'));
const oldNamed = readJson<Array<{
  name: string;
  en: string;
  g?: string;
  t?: string;
  brand?: string;
  tal?: string;
  tal_ru?: string;
  d?: string;
  bonus_ru?: string;
  bonus_short_en?: string;
  dmg?: number;
  rpm?: number;
  mag?: number;
  reload?: number;
  range?: number;
  hsd?: number;
  source_en?: string;
  source_ru?: string;
}>>(join(OLD_DATA_DIR, 'named.json'));
const oldExotics = readJson<Array<{
  name: string;
  en: string;
  g?: string;
  t?: string;
  tal?: string;
  tal_ru?: string;
  d?: string;
  bonus_ru?: string;
  dmg?: number;
  rpm?: number;
  mag?: number;
  reload?: number;
  range?: number;
  hsd?: number;
  source_en?: string;
  source_ru?: string;
}>>(join(OLD_DATA_DIR, 'exotics.json'));

const weaponsEn: Record<string, string> = {};
const weaponsRu: Record<string, string> = {};
const weaponSourceEn: Record<string, string> = {};
const weaponSourceRu: Record<string, string> = {};
const newWeapons: Array<Record<string, unknown>> = [];
const weaponById = new Map<string, Record<string, unknown>>();

for (const w of oldWeaponsBase) {
  const id = makeId(w.name);
  const weapon = {
    id,
    kind: qualityToKind(w.quality),
    category: weaponTypeToCategory(w.type),
    baseDamage: w.dmg,
    rpm: w.rpm,
    magazine: w.mag,
    reloadSeconds: w.reload,
    optimalRange: w.range,
    headshotMultiplier: w.hsd ? 1 + w.hsd / 100 : 1.5,
    modSlots: (w.slots || ['Scope', 'Muzzle', 'Underbarrel', 'Magazine']).map((s) => s.toLowerCase()),
  } as Record<string, unknown>;
  newWeapons.push(weapon);
  weaponById.set(w.name, weapon);
  weaponsEn[id] = w.name;
  weaponsRu[id] = w.name;
}

// Enrich named weapons with RU name, talent, brand, source
for (const n of oldNamed) {
  const w = weaponById.get(n.en);
  if (!w) continue;
  w.kind = 'named';
  if (n.tal) w.talentId = slugify(n.tal);
  if (n.brand) w.brandId = slugify(n.brand);
  if (typeof w.id === 'string') {
    if (n.name) weaponsRu[w.id] = n.name;
    if (n.en) weaponsEn[w.id] = n.en;
    if (n.source_en) weaponSourceEn[w.id] = n.source_en;
    if (n.source_ru) weaponSourceRu[w.id] = n.source_ru;
  }
}

// Pre-load weapon_talents to resolve exotic talents by weapon-name key
const _preWeaponTalents = readJson<Record<string, unknown>>(join(OLD_DATA_DIR, 'weapon_talents.json'));
const weaponTalentsAvailable = new Set(Object.keys(_preWeaponTalents));

// Pre-load exotic_weapons.json for richer exotic data (tal_type, peak bonuses, etc.)
const oldExoticWeapons = readJson<Record<string, {
  en?: string;
  tal_type?: string;
  tal_bonus?: number;
  tal_max?: number;
  exotic_amp_type?: string;
  exotic_peak_wd?: number;
  exotic_peak_chc?: number;
  exotic_peak_chd?: number;
  is_burst?: boolean;
  burst_note?: string;
}>>(join(OLD_DATA_DIR, 'exotic_weapons.json'));
const exoticByEn = new Map<string, typeof oldExoticWeapons[string]>();
for (const [, v] of Object.entries(oldExoticWeapons)) {
  if (v.en) exoticByEn.set(v.en, v);
}

// Enrich exotic weapons with RU name, talent, tal_type, peak bonuses
for (const e of oldExotics) {
  const w = weaponById.get(e.en);
  if (!w) continue;
  w.kind = 'exotic';
  if (typeof w.id === 'string') {
    const exoticKey = `${w.id}_exotic`;
    if (weaponTalentsAvailable.has(exoticKey)) {
      w.talentId = exoticKey;
    } else if (e.tal) {
      w.talentId = slugify(e.tal);
    }
    if (e.name) weaponsRu[w.id] = e.name;
    if (e.en) weaponsEn[w.id] = e.en;
    if (e.source_en) weaponSourceEn[w.id] = e.source_en;
    if (e.source_ru) weaponSourceRu[w.id] = e.source_ru;

    // Enrich from exotic_weapons.json (tal_type, peak bonuses)
    const ew = exoticByEn.get(e.en);
    if (ew) {
      if (ew.tal_type) w.talType = ew.tal_type;
      if (ew.tal_bonus !== undefined) w.talBonus = ew.tal_bonus;
      if (ew.tal_max !== undefined) w.talMax = ew.tal_max;
      if (ew.exotic_amp_type) w.exoticAmpType = ew.exotic_amp_type;
      if (ew.exotic_peak_wd !== undefined) w.exoticPeakWd = ew.exotic_peak_wd;
      if (ew.exotic_peak_chc !== undefined) w.exoticPeakChc = ew.exotic_peak_chc;
      if (ew.exotic_peak_chd !== undefined) w.exoticPeakChd = ew.exotic_peak_chd;
      if (ew.is_burst) w.isBurst = true;
      if (ew.burst_note) w.burstNote = ew.burst_note;
    }
  }
}

try {
  const knownSources = readJson<Array<{
    name_en?: string;
    source_name_en?: string;
    source_name_ru?: string;
  }>>(join(OLD_DATA_DIR, 'known_sources.json'));
  for (const ks of knownSources) {
    if (!ks.name_en) continue;
    const wEntry = weaponById.get(ks.name_en);
    if (!wEntry || typeof wEntry.id !== 'string') continue;
    if (!weaponSourceEn[wEntry.id] && ks.source_name_en) {
      weaponSourceEn[wEntry.id] = ks.source_name_en;
    }
    if (!weaponSourceRu[wEntry.id] && ks.source_name_ru) {
      weaponSourceRu[wEntry.id] = ks.source_name_ru;
    }
  }
} catch {
  // known_sources optional
}

writeJson(join(OUT_PUBLIC_DATA_DIR, 'weapons.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  weapons: newWeapons,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'weapons.json'), weaponsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'weapons.json'), weaponsRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'weapon-source.json'), weaponSourceEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'weapon-source.json'), weaponSourceRu);
console.log(`  ✓ ${newWeapons.length} weapons (sources: ${Object.keys(weaponSourceEn).length} EN / ${Object.keys(weaponSourceRu).length} RU)`);

// ============================================================
// TALENTS (weapon + gear)
// ============================================================

console.log('→ Migrating talents...');
const oldWeaponTalents = readJson<Record<string, {
  name?: string;
  bonus?: Record<string, unknown>;
  classes?: string[];
}>>(join(OLD_DATA_DIR, 'weapon_talents.json'));
const oldGearTalents = readJson<Array<{
  id?: string;
  name_en?: string;
  name_ru?: string;
  perfect_name_en?: string;
  perfect_name_ru?: string;
  description?: string;
  desc_ru?: string;
  slot?: string;
  set?: string;
}>>(join(OLD_DATA_DIR, 'gear_talents.json'));

const oldWeaponTalentsFull = (() => {
  try {
    return readJson<Array<{
      id?: string;
      name_en?: string;
      name_ru?: string;
      tooltip_en_filled?: string;
      tooltip_ru_filled?: string;
    }>>(join(OLD_DATA_DIR, 'weapon_talents_full.json'));
  } catch {
    return [];
  }
})();

const HUNTER_DIR = 'D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site';
const hunterTalents = (() => {
  try {
    return readJson<Array<{
      name_en?: string;
      name_ru?: string;
      tooltip_en?: string;
      tooltip_ru?: string;
    }>>(join(HUNTER_DIR, 'talents_weapon.json'));
  } catch {
    return [];
  }
})();

function stripTooltip(s: string | undefined): string {
  if (!s) return '';
  return s
    .replace(/<color[^>]*>/gi, '')
    .replace(/<\/color>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const tooltipByName = new Map<string, { en: string; ru: string }>();
// Hunter pipeline is authoritative (from game files) — populate first
for (const ht of hunterTalents) {
  const nameEn = (ht.name_en || '').trim();
  if (!nameEn) continue;
  const stripPerfect = nameEn.replace(/^Perfect\s+/i, '').trim();
  const entry = {
    en: stripTooltip(ht.tooltip_en),
    ru: stripTooltip(ht.tooltip_ru),
  };
  tooltipByName.set(nameEn.toLowerCase(), entry);
  if (stripPerfect && !tooltipByName.has(stripPerfect.toLowerCase())) {
    tooltipByName.set(stripPerfect.toLowerCase(), entry);
  }
}
for (const ft of oldWeaponTalentsFull) {
  const nameEn = (ft.name_en || '').trim();
  if (!nameEn) continue;
  const stripPerfect = nameEn.replace(/^Perfect\s+/i, '').trim();
  const entry = {
    en: stripTooltip(ft.tooltip_en_filled),
    ru: stripTooltip(ft.tooltip_ru_filled),
  };
  if (!tooltipByName.has(nameEn.toLowerCase())) {
    tooltipByName.set(nameEn.toLowerCase(), entry);
  }
  if (stripPerfect && !tooltipByName.has(stripPerfect.toLowerCase())) {
    tooltipByName.set(stripPerfect.toLowerCase(), entry);
  }
}

usedIds.clear();
const talentsEn: Record<string, string> = {};
const talentsRu: Record<string, string> = {};
const talentsDescEn: Record<string, string> = {};
const talentsDescRu: Record<string, string> = {};
const newTalents: Array<Record<string, unknown>> = [];

for (const [key, t] of Object.entries(oldWeaponTalents)) {
  const id = makeId(key);
  const isPerfect = key.startsWith('perfect');
  const name = t.name || key;
  const note = (t.bonus as { note?: string } | undefined)?.note || '';

  const englishPart = name.split('(')[0].trim();
  const lookup = tooltipByName.get(englishPart.toLowerCase())
    ?? tooltipByName.get(englishPart.replace(/^Perfect\s+/i, '').toLowerCase());
  const tooltipEn = lookup?.en || '';
  const tooltipRu = lookup?.ru || '';
  const bonuses: Array<{ stat: string; value: number }> = [];
  for (const [k, v] of Object.entries(t.bonus || {})) {
    if (k === 'note' || k === 'conditional' || k === 'static') continue;
    if (typeof v === 'number') {
      const statRaw = k.toLowerCase();
      const stat = ['wd', 'chc', 'chd', 'hsd', 'rof', 'mag', 'reload', 'handling', 'armor'].includes(statRaw)
        ? statRaw
        : parseStat(k);
      if (stat) bonuses.push({ stat, value: v });
    }
  }

  newTalents.push({
    id,
    kind: 'weapon',
    bonusType: isPerfect ? 'amplified' : 'additive',
    bonuses,
    applicableWeaponClasses: t.classes,
    hasPerfectVariant: !isPerfect,
  });

  const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const enPart = m ? m[1].trim() : name;
  const ruPart = m ? m[2].trim() : name;
  talentsEn[id] = enPart;
  talentsRu[id] = ruPart;
  talentsDescEn[id] = tooltipEn || '';
  talentsDescRu[id] = tooltipRu || note;
}

for (const gt of oldGearTalents) {
  if (!gt.name_en) continue;
  const id = makeId(gt.name_en);
  const slot = (gt.slot || 'chest').toLowerCase();
  newTalents.push({
    id,
    kind: slot === 'backpack' || slot === 'bp' ? 'backpack' : slot === 'gloves' ? 'gloves' : 'chest',
    bonusType: 'additive',
    bonuses: [],
    hasPerfectVariant: !!gt.perfect_name_en,
  });
  talentsEn[id] = gt.name_en;
  talentsRu[id] = gt.name_ru || gt.name_en;
  talentsDescEn[id] = gt.description || '';
  talentsDescRu[id] = gt.desc_ru || gt.description || '';
}

writeJson(join(OUT_PUBLIC_DATA_DIR, 'talents.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  talents: newTalents,
});
writeJson(join(OUT_LOCALES_DIR, 'en', 'talents.json'), talentsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'talents.json'), talentsRu);
writeJson(join(OUT_LOCALES_DIR, 'en', 'talent-desc.json'), talentsDescEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'talent-desc.json'), talentsDescRu);
console.log(`  ✓ ${newTalents.length} talents`);

// ============================================================
// STATS i18n
// ============================================================

console.log('→ Writing stat translations...');
const statsEn: Record<string, string> = {
  wd: 'Weapon Damage',
  chc: 'Critical Hit Chance',
  chd: 'Critical Hit Damage',
  hsd: 'Headshot Damage',
  rof: 'Rate of Fire',
  mag: 'Magazine Size',
  reload: 'Reload Speed',
  handling: 'Weapon Handling',
  accuracy: 'Accuracy',
  stability: 'Stability',
  range: 'Optimal Range',
  ammo: 'Ammo Capacity',
  armor: 'Armor',
  armor_on_kill: 'Armor on Kill',
  armor_regen: 'Armor Regen',
  health: 'Health',
  health_on_kill: 'Health on Kill',
  hazard_prot: 'Hazard Protection',
  explosive_resist: 'Explosive Resistance',
  skill_tier: 'Skill Tier',
  skill_haste: 'Skill Haste',
  skill_dmg: 'Skill Damage',
  skill_duration: 'Skill Duration',
  skill_health: 'Skill Health',
  skill_repair: 'Skill Repair',
  status_effects: 'Status Effects',
  ooc: 'Damage out of Cover',
  dta: 'Damage to Armor',
  dth: 'Damage to Health',
  elite: 'Damage to Elites',
  wd_ar: 'AR Damage',
  wd_smg: 'SMG Damage',
  wd_lmg: 'LMG Damage',
  wd_mmr: 'Marksman Rifle Damage',
  wd_rifle: 'Rifle Damage',
  wd_shotgun: 'Shotgun Damage',
  wd_pistol: 'Pistol Damage',
  ergo: 'Handling',
};
const statsRu: Record<string, string> = {
  wd: 'Урон от оружия',
  chc: 'Шанс крит. попадания',
  chd: 'Урон от крит. попадания',
  hsd: 'Урон от выстрелов в голову',
  rof: 'Скорострельность',
  mag: 'Размер магазина',
  reload: 'Скорость перезарядки',
  handling: 'Эргономика',
  accuracy: 'Точность',
  stability: 'Стабильность',
  range: 'Оптимальная дальность',
  ammo: 'Боезапас',
  armor: 'Броня',
  armor_on_kill: 'Броня за убийство',
  armor_regen: 'Восстановление брони',
  health: 'Здоровье',
  health_on_kill: 'Здоровье за убийство',
  hazard_prot: 'Защита от опасностей',
  explosive_resist: 'Защита от взрывов',
  skill_tier: 'Уровень навыков',
  skill_haste: 'Ускорение навыков',
  skill_dmg: 'Урон от навыков',
  skill_duration: 'Длительность навыков',
  skill_health: 'Прочность навыков',
  skill_repair: 'Ремонт навыков',
  status_effects: 'Эффекты состояния',
  ooc: 'Урон вне укрытия',
  dta: 'Урон по броне',
  dth: 'Урон по здоровью',
  elite: 'Урон по элитам',
  wd_ar: 'Урон штурмовых винтовок',
  wd_smg: 'Урон ПП',
  wd_lmg: 'Урон пулемётов',
  wd_mmr: 'Урон снайперских винтовок',
  wd_rifle: 'Урон винтовок',
  wd_shotgun: 'Урон дробовиков',
  wd_pistol: 'Урон пистолетов',
  ergo: 'Эргономика',
};
writeJson(join(OUT_LOCALES_DIR, 'en', 'stats.json'), statsEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'stats.json'), statsRu);
console.log(`  ✓ stats i18n`);

// ============================================================
// UI strings
// ============================================================

const uiEn = {
  app_title: 'Division 2 Build Calculator',
  tab_build: 'Build',
  tab_catalog: 'Catalog',
  tab_skills: 'Skills',
  tab_dps: 'DPS',
  tab_top: 'Top',
  tab_community: 'Community',
  tab_mods: 'Mods',
  tab_expertise: 'Expertise',
  tab_formulas: 'Formulas',
  tab_help: 'Help',
  weapon: 'Weapon',
  weapons: 'Weapons',
  gear: 'Gear',
  brand: 'Brand',
  brands: 'Brands',
  set: 'Set',
  sets: 'Sets',
  talent: 'Talent',
  talents: 'Talents',
  exotic: 'Exotic',
  exotics: 'Exotics',
  named: 'Named',
  base: 'Base',
  pick_weapon: 'Pick a weapon',
  pick_gear: 'Pick gear',
  chest: 'Chest',
  backpack: 'Backpack',
  gloves: 'Gloves',
  mask: 'Mask',
  holster: 'Holster',
  kneepads: 'Knee Pads',
  bullet_damage: 'Bullet Damage',
  burst_dps: 'Burst DPS',
  sustained_dps: 'Sustained DPS',
  cycle_time: 'Cycle Time',
  search: 'Search',
  empty: '— empty —',
  none: '— none —',
  pieces: 'pc',
  pieces_short: 'pc',
  bonus_line: '{{pieces}}pc: +{{value}}% {{stat}}',
  found_n: 'Found: {{count}} of {{total}}',
  lang_switch: 'EN / RU',
  coming_soon: 'Coming soon',
  all: 'All',
  bonuses: 'Bonuses',
  apply: 'Apply',
  header_subtitle: 'Division 2 — DPS · Gear · Talents',
};
const uiRu = {
  app_title: 'Калькулятор билдов Division 2',
  tab_build: 'Билд',
  tab_catalog: 'Каталог',
  tab_skills: 'Навыки',
  tab_dps: 'DPS',
  tab_top: 'Топ',
  tab_community: 'Сообщество',
  tab_mods: 'Моды',
  tab_expertise: 'Экспертиза',
  tab_formulas: 'Формулы',
  tab_help: 'Справка',
  weapon: 'Оружие',
  weapons: 'Оружие',
  gear: 'Снаряжение',
  brand: 'Бренд',
  brands: 'Бренды',
  set: 'Сет',
  sets: 'Сеты',
  talent: 'Талант',
  talents: 'Таланты',
  exotic: 'Экзотик',
  exotics: 'Экзотики',
  named: 'Именной',
  base: 'Обычное',
  pick_weapon: 'Выбери оружие',
  pick_gear: 'Выбери снаряжение',
  chest: 'Бронежилет',
  backpack: 'Рюкзак',
  gloves: 'Перчатки',
  mask: 'Маска',
  holster: 'Кобура',
  kneepads: 'Наколенники',
  bullet_damage: 'Урон за пулю',
  burst_dps: 'Пиковый DPS',
  sustained_dps: 'Средний DPS',
  cycle_time: 'Время цикла',
  search: 'Поиск',
  empty: '— пусто —',
  none: '— нет —',
  pieces: 'шт',
  pieces_short: 'шт',
  bonus_line: '{{pieces}}шт: +{{value}}% {{stat}}',
  found_n: 'Найдено: {{count}} из {{total}}',
  lang_switch: 'EN / RU',
  coming_soon: 'Скоро',
  all: 'Все',
  bonuses: 'Бонусы',
  apply: 'Включить',
  header_subtitle: 'Division 2 — DPS · Снаряжение · Таланты',
};
writeJson(join(OUT_LOCALES_DIR, 'en', 'ui.json'), uiEn);
writeJson(join(OUT_LOCALES_DIR, 'ru', 'ui.json'), uiRu);
console.log(`  ✓ UI strings`);

// ============================================================
// Meta manifest
// ============================================================

writeJson(join(OUT_PUBLIC_DATA_DIR, 'meta.json'), {
  version: DATA_VERSION,
  gameVersion: GAME_VERSION,
  generatedAt: new Date().toISOString(),
  files: {
    weapons: 'weapons.json',
    brands: 'brands.json',
    gearSets: 'gear-sets.json',
    talents: 'talents.json',
  },
  locales: ['en', 'ru'],
  namespaces: ['ui', 'stats', 'weapons', 'brands', 'gear-sets', 'talents'],
});

console.log('\n✓ Migration complete.');
console.log(`  Data: ${OUT_PUBLIC_DATA_DIR}`);
console.log(`  Locales: ${OUT_LOCALES_DIR}`);
