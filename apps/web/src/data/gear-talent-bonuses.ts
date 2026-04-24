export interface GearTalentBonus {
  id: string;
  slot: 'chest' | 'backpack';
  name: string;
  bonusType: 'additive' | 'amplified';
  bonuses: Array<{ stat: string; value: number }>;
  requiresCoreWd?: number;
  note?: string;
}

export const GEAR_TALENT_BONUSES: GearTalentBonus[] = [
  // Chest talents
  { id: 'gt_focus', slot: 'chest', name: 'Focus', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 35 }], note: 'At optimal range, up to +35% WD' },
  { id: 'gt_obliterate', slot: 'chest', name: 'Obliterate', bonusType: 'additive', bonuses: [{ stat: 'chd', value: 25 }], note: '+25% CHD (additive)' },
  { id: 'gt_intimidate', slot: 'chest', name: 'Intimidate', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 25 }], note: '+25% WD vs close enemies' },
  { id: 'gt_gunslinger', slot: 'chest', name: 'Gunslinger', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 20 }], note: '+20% WD after pistol kill' },
  { id: 'gt_spark', slot: 'chest', name: 'Spark', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: '+15% WD after skill use' },
  { id: 'gt_kinetic_momentum', slot: 'chest', name: 'Kinetic Momentum', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: 'Reload grants +15% WD' },
  { id: 'gt_precision', slot: 'chest', name: 'Precision', bonusType: 'additive', bonuses: [{ stat: 'hsd', value: 100 }], note: '+100% HSD' },
  { id: 'gt_braced', slot: 'chest', name: 'Braced', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 25 }], note: 'Cover reload +25% WD' },
  { id: 'gt_empowered', slot: 'chest', name: 'Empowered', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: '+15% WD when status on enemy' },
  { id: 'gt_risk_management', slot: 'chest', name: 'Risk Management', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 20 }], note: 'Striker-related' },

  // Backpack talents
  { id: 'gt_glass_cannon', slot: 'backpack', name: 'Glass Cannon', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 25 }], note: '+25% WD / +50% damage taken' },
  { id: 'gt_vigilance', slot: 'backpack', name: 'Vigilance', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 25 }], note: '+25% WD at full armor' },
  { id: 'gt_composure', slot: 'backpack', name: 'Composure', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 20 }], note: '+20% WD in cover' },
  { id: 'gt_spotter', slot: 'backpack', name: 'Spotter', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 15 }], note: '+15% WD to pulsed enemies' },
  { id: 'gt_tag_team', slot: 'backpack', name: 'Tag Team', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: '+15% WD after kill, 10s' },
  { id: 'gt_companion', slot: 'backpack', name: 'Companion', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: '+15% WD near ally/skill' },
  { id: 'gt_wicked', slot: 'backpack', name: 'Wicked', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 20 }], note: '+20% WD after status applied' },
  { id: 'gt_trauma_specialist', slot: 'backpack', name: 'Trauma Specialist', bonusType: 'additive', bonuses: [{ stat: 'dth', value: 15 }], note: '+15% Damage to Health' },
  { id: 'gt_combined_arms', slot: 'backpack', name: 'Combined Arms', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 20 }], note: '+20% WD after skill hit' },
  { id: 'gt_press_the_advantage', slot: 'backpack', name: 'Press the Advantage', bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }], note: 'Striker-related' },
  { id: 'gt_headhunter', slot: 'backpack', name: 'Headhunter', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 125 }], note: 'After HS kill, next body shot +125% WD (30s window). Cap: 800% WD (1250% if HSD > 150%)' },
  { id: 'gt_perfect_headhunter', slot: 'backpack', name: 'Perfect Headhunter', bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 150 }], note: 'Perfect variant: +150% WD after HS kill' },
];

export const CHEST_TALENT_BONUSES = GEAR_TALENT_BONUSES.filter((t) => t.slot === 'chest');
export const BACKPACK_TALENT_BONUSES = GEAR_TALENT_BONUSES.filter((t) => t.slot === 'backpack');

export function findGearTalentBonus(id: string): GearTalentBonus | undefined {
  return GEAR_TALENT_BONUSES.find((t) => t.id === id);
}
