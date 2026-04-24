export interface SpecTreePerk {
  id: string;
  name: { en: string; ru: string };
  /** Stat → value. For reload_boost use special stat 'reload_every_3rd_50pct'. */
  stat: string;
  value: number;
  /** Description of activation condition (for UI hint). */
  condition?: { en: string; ru: string };
}

export interface Spec {
  id: string;
  name: { en: string; ru: string };
  /** Unique talents that come with the spec when equipped (not shared across tree). */
  uniqueBonus: Array<{ stat: string; value: number }>;
  /** Tree perks — toggleable by user (represent unlocked upgrades in spec tree). */
  treePerks?: SpecTreePerk[];
  note: { en: string; ru: string };
}

// TU22.1 "Rise Up" — verified via research (compass artifact 2026-04-24).
// IMPORTANT: Each spec's tree allows up to +15% WD per weapon class (any class via talent points).
// The "+44%" number from raw game data (total_passive_bonuses) is an AGGREGATE of multiple
// unrelated talents — it is NOT the true single-class max. Community-verified cap: +15%.
// Unique passives below are spec-specific (Sharpshooter HSD, Survivalist skill power, etc.).
export const SPECS: Spec[] = [
  {
    id: 'sharpshooter',
    name: { en: 'Sharpshooter', ru: 'Меткий стрелок' },
    uniqueBonus: [
      { stat: 'hsd', value: 25 },          // One In The Head: +25% HSD
      { stat: 'handling', value: 30 },     // Stability from Breath Control
    ],
    treePerks: [
      {
        id: 'sharp_focus',
        name: { en: 'Focus', ru: 'Фокусировка' },
        stat: 'hsd',
        value: 20,
        condition: { en: '+20% HSD on aim 3s+', ru: '+20% HSD при прицеливании 3+ сек' },
      },
      {
        id: 'sharp_chc',
        name: { en: 'Precision', ru: 'Точность' },
        stat: 'chc',
        value: 5,
        condition: { en: '+5% Crit Chance', ru: '+5% Шанс крита' },
      },
      {
        id: 'sharp_chd',
        name: { en: 'Heavy Hitter', ru: 'Мощный удар' },
        stat: 'chd',
        value: 10,
        condition: { en: '+10% Crit Damage', ru: '+10% Урон крита' },
      },
    ],
    note: {
      en: '+25% HSD (One in the Head) · +30% Stability. Signature: TAC-50. Class tree: up to +15% Rifle or MMR.',
      ru: '+25% HSD (One in the Head) · +30% Стабильность. Сигнатура: TAC-50. Дерево класса: до +15% Rifle или MMR.',
    },
  },
  {
    id: 'demolitionist',
    name: { en: 'Demolitionist', ru: 'Подрывник' },
    uniqueBonus: [
      { stat: 'explosive_dmg', value: 25 }, // +25% Explosive damage
    ],
    note: {
      en: '+25% Explosive damage. Signature: M32A1 grenade launcher. Tree: up to +15% LMG (Onslaught) or SMG (Spray and Pray).',
      ru: '+25% Урон взрыва. Сигнатура: M32A1 гранатомёт. Дерево: до +15% LMG или SMG.',
    },
  },
  {
    id: 'survivalist',
    name: { en: 'Survivalist', ru: 'Выживальщик' },
    uniqueBonus: [
      { stat: 'skill_dmg', value: 15 },    // SkillPowerModBonus
    ],
    treePerks: [
      {
        id: 'surv_status_dur',
        name: { en: 'Persistent Effects', ru: 'Стойкие эффекты' },
        stat: 'burn_duration',
        value: 15,
        condition: { en: '+15% Status effect duration (Burn)', ru: '+15% длительность эффектов (Горение)' },
      },
      {
        id: 'surv_status_dmg',
        name: { en: 'Afflictor', ru: 'Мучитель' },
        stat: 'status_effects',
        value: 10,
        condition: { en: '+10% Status Effects damage', ru: '+10% Урон негативных эффектов' },
      },
    ],
    note: {
      en: '+15% Skill Power. Signature: Crossbow. Tree: up to +15% AR (E.M.I.) or Shotgun (Running The Gun).',
      ru: '+15% Навыки. Сигнатура: Арбалет. Дерево: до +15% AR или Shotgun.',
    },
  },
  {
    id: 'gunner',
    name: { en: 'Gunner', ru: 'Стрелок' },
    uniqueBonus: [],
    treePerks: [
      {
        id: 'firing_position',
        name: { en: 'Firing Position', ru: 'Огневая позиция' },
        stat: 'handling',
        value: 10,
        condition: { en: 'While stationary 1s+', ru: 'При неподвижности 1+ сек' },
      },
      {
        id: 'accelerated_reload_s3',
        name: { en: 'Accelerated Reload S3', ru: 'Ускоренное заряжание — этап 3' },
        stat: 'reload_every_3rd_50pct',
        value: 50,
        condition: { en: 'Every 3rd reload 50% faster (avg −17%)', ru: 'Каждая 3-я перезарядка на 50% быстрее (ср. −17%)' },
      },
      {
        id: 'gunner_headshot',
        name: { en: 'Targeted Strike', ru: 'Целевой удар' },
        stat: 'hsd',
        value: 10,
        condition: { en: '+10% Headshot damage', ru: '+10% Урон в голову' },
      },
      {
        id: 'gunner_mag_size',
        name: { en: 'Extra Rounds', ru: 'Доп. патроны' },
        stat: 'mag',
        value: 15,
        condition: { en: '+15% Magazine size', ru: '+15% Размер магазина' },
      },
      {
        id: 'gunner_stability',
        name: { en: 'Stability', ru: 'Стабильность' },
        stat: 'handling',
        value: 10,
        condition: { en: '+10% handling (stability → reload)', ru: '+10% эргономика (стабильность → перезарядка)' },
      },
    ],
    note: {
      en: 'Signature: Minigun (+200% sig damage). Tree: 45 points distributable, up to +15% LMG.',
      ru: 'Сигнатура: Миниган (+200% урон сигнатуры). Дерево: 45 очков, до +15% LMG.',
    },
  },
  {
    id: 'firewall',
    name: { en: 'Firewall', ru: 'Брандмауэр' },
    uniqueBonus: [
      { stat: 'burn_dmg', value: 15 },     // Burn duration/damage (approximate)
    ],
    note: {
      en: 'Signature: Flamethrower. Focus: burn synergy + Striker Shield buffs. Tree: up to +15% Shotgun.',
      ru: 'Сигнатура: Огнемёт. Фокус: burn + Striker Shield. Дерево: до +15% Shotgun.',
    },
  },
  {
    id: 'technician',
    name: { en: 'Technician', ru: 'Техник' },
    uniqueBonus: [
      { stat: 'skill_dmg', value: 15 },    // Skill damage bonus
    ],
    note: {
      en: '+15% Skill Damage. Signature: Pulse. Tree: up to +5% MMR or +15% Rifle (via skill synergy).',
      ru: '+15% Урон навыков. Сигнатура: Пульс. Дерево: до +5% MMR или +15% Rifle.',
    },
  },
];

export function findSpec(id: string): Spec | undefined {
  return SPECS.find((s) => s.id === id);
}

/** Weapon classes available for +15% WD skill-tree investment. */
export const WEAPON_CLASSES = [
  { id: 'ar',      label_en: 'AR',       label_ru: 'AR' },
  { id: 'smg',     label_en: 'SMG',      label_ru: 'SMG' },
  { id: 'lmg',     label_en: 'LMG',      label_ru: 'LMG' },
  { id: 'mmr',     label_en: 'MMR',      label_ru: 'MMR' },
  { id: 'rifle',   label_en: 'Rifle',    label_ru: 'Rifle' },
  { id: 'shotgun', label_en: 'Shotgun',  label_ru: 'Дробовик' },
  { id: 'pistol',  label_en: 'Pistol',   label_ru: 'Пистолет' },
] as const;

/** +15% WD per invested class (TU22.1 community canon per-class max). */
export const SPEC_CLASS_BONUS_PCT = 15;
/** Max classes player can fully invest in (realistic point budget). */
export const SPEC_CLASS_MAX_PICKS = 3;
