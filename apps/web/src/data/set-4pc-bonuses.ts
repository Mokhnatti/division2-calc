/**
 * 4-piece set active-stack bonuses.
 * Ported from v1 set_bonuses.json — most-used DPS sets with stacks mechanic.
 * Numeric p2/p3 bonuses are already applied via gear-sets.json migration.
 * This adds the p4 "stacks" mechanic (active state, scales WD/CHC/CHD/ROF).
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
  perStack: Array<{ stat: 'wd' | 'chd' | 'chc' | 'hsd' | 'rof'; value: number }>;
  /** When backpack talent of the set is equipped, per-stack value may differ */
  perStackBp?: Array<{ stat: 'wd' | 'chd' | 'chc' | 'hsd' | 'rof'; value: number }>;
  note?: { en: string; ru: string };
}

export const SET_4PC_STACKS: SetStacks[] = [
  {
    setId: 'striker_s_battlegear',
    name: { en: "Striker's Battlegear", ru: 'Снаряжение боевика' },
    trigger: 'hit',
    triggerNote: { en: 'per hit, decay 1/s above 100', ru: 'за попадание, распад 1/с выше 100' },
    maxBase: 100,
    maxChest: 200,
    perStack: [{ stat: 'wd', value: 0.65 }],
    perStackBp: [{ stat: 'wd', value: 0.9 }],
  },
  {
    setId: 'heartbreaker',
    name: { en: 'Heartbreaker', ru: 'Разбиватель сердец' },
    trigger: 'hs',
    triggerNote: { en: 'headshot on marked target', ru: 'хедшот по меченому' },
    maxBase: 50,
    maxChest: 100,
    perStack: [{ stat: 'wd', value: 1 }],
  },
  {
    setId: 'umbra_initiative',
    name: { en: 'Umbra Initiative', ru: 'Инициатива Умбра' },
    trigger: 'tempo',
    triggerNote: { en: '+20/s in cover, −6/s out', ru: '+20/сек в укрытии, −6/сек вне' },
    maxBase: 50,
    maxChest: 100,
    perStack: [
      { stat: 'chd', value: 1 },
      { stat: 'rof', value: 0.3 },
    ],
  },
  {
    setId: 'hunter_s_fury',
    name: { en: "Hunter's Fury", ru: 'Ярость охотника' },
    trigger: 'hit',
    triggerNote: { en: 'per hit within 25m', ru: 'за попадание в 25м' },
    maxBase: 6,
    perStack: [
      { stat: 'wd', value: 10 },
      { stat: 'rof', value: 2 },
    ],
  },
  {
    setId: 'negotiator_s_dilemma',
    name: { en: "Negotiator's Dilemma", ru: 'Дилемма переговорщика' },
    trigger: 'proc',
    triggerNote: { en: 'marked targets; on kill transfer', ru: 'отмеченные цели; перенос при убийстве' },
    maxBase: 1,
    perStack: [{ stat: 'chd', value: 25 }],
    note: {
      en: 'Marked targets take +25% damage from all sources',
      ru: 'По отмеченным целям +25% урона от всех источников',
    },
  },
];

export function findSet4pc(setId: string): SetStacks | undefined {
  return SET_4PC_STACKS.find((s) => s.setId === setId);
}
