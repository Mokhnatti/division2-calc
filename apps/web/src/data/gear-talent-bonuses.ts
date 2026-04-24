export interface GearTalentBonus {
  id: string;
  slot: 'chest' | 'backpack';
  name: string;
  /** Bucket classification from TU22.1 Rise Up research (community-verified):
   *  - 'wd_additive'        — goes into shared (1 + ΣWD_add) pool ("increases total weapon damage")
   *  - 'wd_multiplicative'  — its own (1+x) multiplier ("amplifies weapon damage")
   *  - 'crit_damage'        — goes into CHD pool
   *  - 'crit_chance'        — goes into CHC pool (capped 60%)
   *  - 'headshot_damage'    — goes into HSD pool
   *  - 'amplified_damage'   — final global multiplier on all damage (Glass Cannon only)
   *  - 'special'            — unique mechanic (Headhunter, Trauma, skill-only, utility, stacks cap)
   */
  bucket: 'wd_additive' | 'wd_multiplicative' | 'crit_damage' | 'crit_chance' | 'headshot_damage' | 'amplified_damage' | 'special';
  value: number;
  /** Stat the bucket value applies to (for UI display / bonus aggregation). */
  stat: string;
  /** Legacy fields for existing code — bonusType='amplified' routes to its own multiplier. */
  bonusType: 'additive' | 'amplified';
  bonuses: Array<{ stat: string; value: number }>;
  note?: string;
}

// TU22.1 Rise Up — verified via research (2026-04-24 compass artifact).
// Sources: s-i-n.co.uk, vocal.media/gamers, gamerjournalist.com, steamcommunity mannequin tests.
export const GEAR_TALENT_BONUSES: GearTalentBonus[] = [
  // ───────── CHEST ─────────
  { id: 'gt_focus', slot: 'chest', name: 'Focus',
    bucket: 'wd_additive', value: 50, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 50 }],
    note: 'ADS 8x+ scope, ramps to +50% WD over 10s (Perfect: 60%). Additive with other WD.' },
  { id: 'gt_intimidate', slot: 'chest', name: 'Intimidate',
    bucket: 'wd_multiplicative', value: 35, stat: 'wd',
    bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 35 }],
    note: 'While bonus armor, amplifies +35% WD to enemies <10m (Perfect 40%). Own multiplier.' },
  { id: 'gt_obliterate', slot: 'chest', name: 'Obliterate',
    bucket: 'crit_damage', value: 25, stat: 'chd',
    bonusType: 'additive', bonuses: [{ stat: 'chd', value: 25 }],
    note: 'Crit hits +1% WD for 5s, up to 25 stacks. Goes into CHD pool? Note: current wording is WD additive, stacks up to +25%.' },
  { id: 'gt_gunslinger', slot: 'chest', name: 'Gunslinger',
    bucket: 'wd_additive', value: 20, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 20 }],
    note: 'Weapon swap +20% WD for 5s (Perfect 23%). Additive.' },
  { id: 'gt_spark', slot: 'chest', name: 'Spark',
    bucket: 'wd_additive', value: 15, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }],
    note: 'Skill damage grants +15% WD 15s (Perfect: 18%/20s). Additive.' },
  { id: 'gt_kinetic_momentum', slot: 'chest', name: 'Kinetic Momentum',
    bucket: 'special', value: 0, stat: 'skill_dmg',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'In combat skill stacks → +15% skill damage only. Does not affect weapon DPS.' },
  { id: 'gt_precision', slot: 'chest', name: 'Precision',
    bucket: 'special', value: 0, stat: 'utility',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'Current D2 version: HS kill pulses target. NOT an HSD talent anymore.' },
  { id: 'gt_braced', slot: 'chest', name: 'Braced',
    bucket: 'special', value: 45, stat: 'handling',
    bonusType: 'additive', bonuses: [{ stat: 'handling', value: 45 }],
    note: 'In cover +45% handling (Perfect 50%). Not damage.' },
  { id: 'gt_risk_management', slot: 'chest', name: 'Risk Management',
    bucket: 'wd_additive', value: 35, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 35 }],
    note: "Striker's Gamble bp talent: +1% WD per stack × 35 stacks. Additive (inherits from Striker)." },
  { id: 'gt_glass_cannon', slot: 'chest', name: 'Glass Cannon',
    bucket: 'amplified_damage', value: 25, stat: 'all_dmg',
    bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 25 }],
    note: 'CHEST slot. All damage +25% amplified (Perfect 30%), take +50%/60% damage. Global final multiplier.' },
  { id: 'gt_headhunter', slot: 'chest', name: 'Headhunter',
    bucket: 'special', value: 125, stat: 'wd',
    bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 125 }],
    note: 'CHEST slot. After HS kill: next hit does +125% of killing shot dmg. Cap 800% WD (1250% if HSD>150%). CONSUMED on next hit.' },
  { id: 'gt_perfect_headhunter', slot: 'chest', name: 'Perfect Headhunter (Chainkiller)',
    bucket: 'special', value: 150, stat: 'wd',
    bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 150 }],
    note: 'Chainkiller chest: next hit +150% of killing shot. Same cap logic.' },
  { id: 'gt_unstoppable_force', slot: 'chest', name: 'Unstoppable Force',
    bucket: 'wd_additive', value: 25, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 25 }],
    note: 'Kill +5% WD for 15s, 5 stacks. FLAG: tests 2020-22 showed multiplicative behavior. Needs re-test.' },
  { id: 'gt_berserk', slot: 'chest', name: 'Berserk',
    bucket: 'wd_additive', value: 100, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 100 }],
    note: '+10% WD per 10% missing armor. Up to +100% at 0 armor. Additive.' },
  { id: 'gt_on_the_ropes', slot: 'chest', name: 'On the Ropes',
    bucket: 'wd_additive', value: 25, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 25 }],
    note: 'While all skills on cooldown: +25% WD. FLAG: known bugged 2019 test. Maybe reworked in Gear 2.0.' },
  { id: 'gt_press_the_advantage', slot: 'chest', name: 'Press the Advantage',
    bucket: 'special', value: 0, stat: 'stacks_cap',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: "Striker chest: max stacks 100→200, 3/s decay between 101-200. No direct damage, enables higher Striker stacks." },
  { id: 'gt_vanguard', slot: 'chest', name: 'Vanguard',
    bucket: 'special', value: 0, stat: 'utility',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'Shield deploy: invuln 5s + ally +45% bonus armor 20s. Utility only.' },

  // ───────── BACKPACK ─────────
  { id: 'gt_vigilance', slot: 'backpack', name: 'Vigilance',
    bucket: 'wd_additive', value: 25, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 25 }],
    note: '+25% WD at full armor. Taking damage disables 4s (Perfect 3s). Additive.' },
  { id: 'gt_composure', slot: 'backpack', name: 'Composure',
    bucket: 'wd_additive', value: 15, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }],
    note: 'In cover +15% WD. Additive.' },
  { id: 'gt_tag_team', slot: 'backpack', name: 'Tag Team',
    bucket: 'special', value: 0, stat: 'cdr',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'Last enemy hit by skill is marked. Weapon hit on mark → CDR 6s. Utility only, no damage.' },
  { id: 'gt_companion', slot: 'backpack', name: 'Companion',
    bucket: 'wd_additive', value: 15, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 15 }],
    note: 'Within 5m of ally/skill: +15% WD. Additive.' },
  { id: 'gt_spotter', slot: 'backpack', name: 'Spotter',
    bucket: 'wd_multiplicative', value: 15, stat: 'wd',
    bonusType: 'amplified', bonuses: [{ stat: 'wd', value: 15 }],
    note: 'Amplifies +15% weapon AND skill damage vs pulsed (Perfect 20%). Own multiplier. Verified by 2019 mannequin test.' },
  { id: 'gt_wicked', slot: 'backpack', name: 'Wicked',
    bucket: 'wd_additive', value: 18, stat: 'wd',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 18 }],
    note: 'Applying status +18% WD 20s (Perfect 23-27s). Additive.' },
  { id: 'gt_combined_arms', slot: 'backpack', name: 'Combined Arms',
    bucket: 'special', value: 0, stat: 'skill_dmg',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'Shoot enemy → +25% skill damage 3s (Perfect 30%). Only skill damage.' },
  { id: 'gt_trauma_specialist', slot: 'backpack', name: 'Trauma Specialist',
    bucket: 'special', value: 100, stat: 'bleed',
    bonusType: 'additive', bonuses: [{ stat: 'wd', value: 0 }],
    note: 'Ongoing Directive only. +50% bleed duration, +100% bleed damage. Status DoT bucket, not direct WD.' },
];

export const CHEST_TALENT_BONUSES = GEAR_TALENT_BONUSES.filter((t) => t.slot === 'chest');
export const BACKPACK_TALENT_BONUSES = GEAR_TALENT_BONUSES.filter((t) => t.slot === 'backpack');

export function findGearTalentBonus(id: string): GearTalentBonus | undefined {
  return GEAR_TALENT_BONUSES.find((t) => t.id === id);
}
