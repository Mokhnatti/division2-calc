export interface Spec {
  id: string;
  name: { en: string; ru: string };
  weaponClass: string;
  bonus: Array<{ stat: string; value: number }>;
  note: { en: string; ru: string };
}

// Data source: hunter_pipeline specializations.json (actual game files TU22.1).
// Each specialization has a skill tree with flexible weapon-type damage bonuses.
// Default values here reflect a reasonable "invested main weapon type" build:
// +15% to primary weapon class + spec-specific unique bonuses.
// In game the max potential is up to +44% per weapon type if fully unlocked,
// but realistic meta builds typically yield +15% to primary type.
export const SPECS: Spec[] = [
  {
    id: 'sharpshooter',
    name: { en: 'Sharpshooter', ru: 'Меткий стрелок' },
    weaponClass: 'mmr',
    bonus: [
      { stat: 'wd_mmr', value: 15 },      // Primary MMR dmg
      { stat: 'wd_rifle', value: 15 },    // Also buffs Rifle
      { stat: 'hsd', value: 30 },          // +30% Headshot damage (unique)
      { stat: 'handling', value: 30 },     // Stability
    ],
    note: {
      en: '+15% MMR/Rifle DMG · +30% HSD · +30% Stability',
      ru: '+15% MMR/Rifle урон · +30% HSD · +30% Стабильность',
    },
  },
  {
    id: 'demolitionist',
    name: { en: 'Demolitionist', ru: 'Подрывник' },
    weaponClass: 'lmg',
    bonus: [
      { stat: 'wd_lmg', value: 15 },       // Primary LMG
      { stat: 'wd_ar', value: 5 },         // Minor AR
    ],
    note: {
      en: '+15% LMG · +5% AR · signature: grenade launcher',
      ru: '+15% LMG · +5% AR · сигнатура: гранатомёт',
    },
  },
  {
    id: 'survivalist',
    name: { en: 'Survivalist', ru: 'Выживальщик' },
    weaponClass: 'rifle',
    bonus: [
      { stat: 'wd_rifle', value: 15 },     // Primary Rifle
      { stat: 'wd_mmr', value: 10 },       // Also buffs MMR (crossbow)
      { stat: 'skill_dmg', value: 15 },    // +15% skill power
    ],
    note: {
      en: '+15% Rifle · +10% MMR · +15% Skill Power · signature: crossbow',
      ru: '+15% Rifle · +10% MMR · +15% Навыки · сигнатура: арбалет',
    },
  },
  {
    id: 'gunner',
    name: { en: 'Gunner', ru: 'Стрелок' },
    weaponClass: 'lmg',
    bonus: [
      { stat: 'wd_lmg', value: 20 },       // Primary LMG (best)
      { stat: 'rof', value: 5 },           // +5% RoF
    ],
    note: {
      en: '+20% LMG · +5% RoF · signature: minigun',
      ru: '+20% LMG · +5% RoF · сигнатура: миниган',
    },
  },
  {
    id: 'firewall',
    name: { en: 'Firewall', ru: 'Брандмауэр' },
    weaponClass: 'shotgun',
    bonus: [
      { stat: 'wd_shotgun', value: 15 },   // Primary Shotgun
      { stat: 'wd_smg', value: 10 },       // Minor SMG (close range)
    ],
    note: {
      en: '+15% Shotgun · +10% SMG · signature: flamethrower',
      ru: '+15% Дробовик · +10% SMG · сигнатура: огнемёт',
    },
  },
  {
    id: 'technician',
    name: { en: 'Technician', ru: 'Техник' },
    weaponClass: 'ar',
    bonus: [
      { stat: 'wd_ar', value: 15 },        // Primary AR
      { stat: 'skill_dmg', value: 15 },    // +15% Skill Damage (unique)
    ],
    note: {
      en: '+15% AR · +15% Skill Damage · signature: pulse',
      ru: '+15% AR · +15% Урон навыков · сигнатура: пульс',
    },
  },
];

export function findSpec(id: string): Spec | undefined {
  return SPECS.find((s) => s.id === id);
}
