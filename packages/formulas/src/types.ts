export interface WeaponStats {
  baseDamage: number;
  rpm: number;
  magazine: number;
  reloadSeconds: number;
  headshotMultiplier: number;
}

export interface AdditiveBucket {
  weaponDamagePct: number;
  weaponTypeDamagePct: number;
  additiveTalentsPct: number;
}

export interface AmplifiedBucket {
  multipliers: number[];
}

export interface CritHeadshotBucket {
  chcPct: number;
  chdPct: number;
  hsdPct: number;
  headshotChancePct: number;
}

export interface TargetStateBucket {
  damageToArmorPct: number;
  damageToHealthPct: number;
  damageOutOfCoverPct: number;
  /** If true, target has armor → apply DtA. If false, target is on health → apply DtH. Default: true (full armor) */
  fullArmor?: boolean;
}

export interface ExpertiseBonus {
  grade: number;
}

export interface DpsInput {
  weapon: WeaponStats;
  additive: AdditiveBucket;
  amplified: AmplifiedBucket;
  crit: CritHeadshotBucket;
  target: TargetStateBucket;
  expertise: ExpertiseBonus;
}

export interface DpsOutput {
  bulletDamage: number;
  bulletDamageArmor: number;
  bulletDamageHealth: number;
  bulletDamageNoCrit: number;
  bulletDamageCrit: number;
  bulletDamageHsOnly: number;
  bulletDamageCritHs: number;
  burstDps: number;
  burstDpsArmor: number;
  burstDpsHealth: number;
  sustainedDps: number;
  sustainedDpsArmor: number;
  sustainedDpsHealth: number;
  cycleSeconds: number;
}
