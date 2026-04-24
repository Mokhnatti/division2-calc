/**
 * 4-piece set active-stack bonuses — TU22.1 Rise Up verified (April 2026).
 * Sources: fandom wiki (updated 2024-2026), kboosting.com guides,
 * Divisionalysis mannequin tests, s-i-n.co.uk.
 */

export interface SetStacks {
  /** ID in our new naming (slugified English set name) */
  setId: string;
  name: { en: string; ru: string };
  trigger: 'hit' | 'hs' | 'kill' | 'tempo' | 'proc';
  triggerNote: { en: string; ru: string };
  /** Maximum stacks without chest/backpack perks */
  maxBase: number;
  /** Optional increased cap when chest talent of the set is worn */
  maxChest?: number;
  /** Stat each stack adds and its % per stack */
  perStack: Array<{ stat: 'wd' | 'chd' | 'chc' | 'hsd' | 'rof' | 'handling'; value: number }>;
  /** When backpack talent of the set is equipped, per-stack value may differ */
  perStackBp?: Array<{ stat: 'wd' | 'chd' | 'chc' | 'hsd' | 'rof' | 'handling'; value: number }>;
  /** True if the WD bonus goes into the amplified bucket (own multiplier) vs additive. */
  wdAmplified?: boolean;
  note?: { en: string; ru: string };
}

export const SET_4PC_STACKS: SetStacks[] = [
  {
    setId: 'striker_s_battlegear',
    name: { en: "Striker's Battlegear", ru: 'Снаряжение боевика' },
    trigger: 'hit',
    triggerNote: {
      en: 'Per hit: +0.65% WD. Decay: 1/s (0-50), 2/s (51-100), 3/s (101-200 with chest).',
      ru: 'За попадание: +0.65% WD. Спад: 1/с (0-50), 2/с (51-100), 3/с (101-200 с chest).',
    },
    maxBase: 100,
    maxChest: 200,
    perStack: [{ stat: 'wd', value: 0.65 }],
    perStackBp: [{ stat: 'wd', value: 0.9 }],
    // v1 data: "Amplifier, stacks additively" — (1 + 0.0065*n) applied as its OWN multiplier
    // outside the main WD bucket. Not additive with weapon damage stat.
    wdAmplified: true,
    note: {
      en: '100 stacks × 0.65%/0.9% applied as AMPLIFIED multiplier (own bucket, not additive WD).',
      ru: '100 стеков × 0.65%/0.9% — AMPLIFIER (отдельный множитель, не складывается с WD).',
    },
  },
  {
    setId: 'heartbreaker',
    name: { en: 'Heartbreaker', ru: 'Разбиватель сердец' },
    trigger: 'hs',
    triggerNote: {
      en: 'HS pulses target; hits on pulsed grant +1% WD + +1% bonus armor/stack.',
      ru: 'Хедшот пульсирует цель; попадания по пульсированным → +1% WD + +1% брони/стак.',
    },
    maxBase: 50,
    maxChest: 100,  // Max BPM chest talent
    perStack: [{ stat: 'wd', value: 1.0 }],  // WD bonus only vs pulsed
    note: {
      en: 'WD bonus applies only to pulsed enemies. 50 stacks base → +50% vs pulsed, 100 with chest.',
      ru: 'Бонус WD только по пульсированным. 50 стеков → +50%, 100 с chest.',
    },
  },
  {
    setId: 'umbra_initiative',
    name: { en: 'Umbra Initiative', ru: 'Инициатива Умбра' },
    trigger: 'tempo',
    triggerNote: {
      en: 'In cover: +10/s (gain From the Shadows). Out: -2/s standing, -1/s sprint.',
      ru: 'В укрытии: +10/с (From the Shadows). Вне: -2/с стоя, -1/с спринт.',
    },
    maxBase: 50,
    maxChest: 100,  // From the Shadows chest talent: 50→100
    perStack: [
      { stat: 'chd', value: 1.2 },    // TU22 buff: was 1.0% → 1.2% CHD per stack
      { stat: 'rof', value: 0.4 },    // TU22 buff: was 0.3% → 0.4% RoF per stack
    ],
    note: {
      en: 'TU22 buffed: +1.2% CHD, +0.4% RPM/stack. Max 50 = +60% CHD +20% RPM; 100 = +120%/+40%.',
      ru: 'TU22 баф: +1.2% CHD, +0.4% RPM/стак. Макс 50 = +60% CHD +20% RPM; 100 = +120%/+40%.',
    },
  },
  {
    setId: 'hunter_s_fury',
    name: { en: "Hunter's Fury", ru: 'Ярость охотника' },
    trigger: 'kill',
    triggerNote: {
      en: 'Kill of debuffed enemy (<15m) grants +5% amplified WD stack, 10s (30s with chest).',
      ru: 'Убийство дебафнутого (<15м) даёт +5% амплиф. WD стак, 10с (30с с chest).',
    },
    maxBase: 5,
    perStack: [{ stat: 'wd', value: 5 }],
    wdAmplified: true,  // Hunter's Fury WD is AMPLIFIED, not additive
    note: {
      en: 'AMPLIFIED bucket. Max +25% amplified WD (5 stacks × 5%). Chest: 30s duration.',
      ru: 'AMPLIFIED множитель. Макс +25% амплиф. WD (5 × 5%). Chest: 30с длительность.',
    },
  },
  {
    setId: 'negotiator_s_dilemma',
    name: { en: "Negotiator's Dilemma", ru: 'Дилемма переговорщика' },
    trigger: 'proc',
    triggerNote: {
      en: 'Hit → marks target. Up to 5 marks. On kill: transfer to nearest.',
      ru: 'Попадание помечает цель. До 5 меток. При убийстве: перенос.',
    },
    maxBase: 5,
    perStack: [{ stat: 'wd', value: 10 }],  // +10% damage to marked targets per mark (amp-like)
    wdAmplified: true,
    note: {
      en: 'Amplified. 5 marks = +50% damage to marked (only to marked).',
      ru: 'Амплиф. 5 меток = +50% урон по меченым (только меченым).',
    },
  },
  {
    setId: 'tipping_scales',
    name: { en: 'Tipping Scales', ru: 'Чаша весов' },
    trigger: 'hit',
    triggerNote: {
      en: 'Per shot: +4% CHD, +0.5% handling. Decay: -6/s not firing. No decay if enemy suppressed.',
      ru: 'За выстрел: +4% CHD, +0.5% эргономика. Спад: -6/с без стрельбы. Нет спада если цель подавлена.',
    },
    maxBase: 50,
    maxChest: 75,  // Sustainability chest talent: 50→75
    perStack: [
      { stat: 'chd', value: 4 },
      { stat: 'handling', value: 0.5 },
    ],
    perStackBp: [
      { stat: 'chd', value: 7 },  // Snowball backpack: 4→7% CHD
      { stat: 'handling', value: 0.5 },
    ],
    note: {
      en: 'At 75 stacks × 7% = +525% CHD — bracket-high CHD build.',
      ru: 'При 75 × 7% = +525% CHD — топ по CHD.',
    },
  },
  {
    setId: 'future_initiative',
    name: { en: 'Future Initiative', ru: 'Инициатива будущего' },
    trigger: 'proc',
    triggerNote: {
      en: 'At full armor: baseline +15% WD/SD for you and allies (25% with backpack).',
      ru: 'При полной броне: +15% WD/SD для себя и союзников (25% с backpack).',
    },
    maxBase: 1,
    perStack: [{ stat: 'wd', value: 15 }],
    perStackBp: [{ stat: 'wd', value: 25 }],  // Tactical Superiority backpack
    note: {
      en: 'Goes inactive when armor breaks; refresh at full armor.',
      ru: 'Отключается при пробитии брони; активируется при полной броне.',
    },
  },
  {
    setId: 'hard_wired',
    name: { en: 'Hard Wired', ru: 'Жёстко зашитый' },
    trigger: 'proc',
    triggerNote: {
      en: 'Use/cancel skill → -30s other skill CD + +10% SD/Repair 20s (25% with chest). ICD 20s (10s with backpack).',
      ru: 'Исп./отмена навыка → -30с CD другого + +10% SD/Repair 20с (25% с chest). ICD 20с (10с с backpack).',
    },
    maxBase: 1,
    perStack: [{ stat: 'wd', value: 0 }],  // Skill damage only, not weapon
    note: {
      en: 'Skill builds only — no weapon damage component.',
      ru: 'Только для скилл-билдов — нет бонуса к оружейному урону.',
    },
  },
  {
    setId: 'tip_of_the_spear',
    name: { en: 'Tip of the Spear', ru: 'Остриё копья' },
    trigger: 'proc',
    triggerNote: {
      en: 'Signature weapon kill: +15% Sig WD 10s (30% with chest). Auto-regen sig ammo every 60s.',
      ru: 'Убийство signature оружием: +15% Sig WD 10с (30% с chest). Авто-регенерация боеприпасов сигнатуры каждые 60с.',
    },
    maxBase: 1,
    perStack: [{ stat: 'wd', value: 15 }],  // Signature weapon only
    note: {
      en: '3pc: +10% WD. Bonus applies only to signature weapon damage, not regular weapons.',
      ru: '3шт: +10% WD. Бонус только для signature-оружия, не обычного.',
    },
  },
];

export function findSet4pc(setId: string): SetStacks | undefined {
  return SET_4PC_STACKS.find((s) => s.setId === setId);
}
