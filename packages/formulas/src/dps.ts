import type { DpsInput, DpsOutput } from './types.js';

const CHC_HARD_CAP = 0.60;
const EXPERTISE_PER_GRADE = 0.01;
const EXPERTISE_MAX_GRADE = 30;

interface MultiplierParts {
  additive: number;
  amplified: number;
  critHs: number;
  targetArmor: number;
  targetHealth: number;
  expertise: number;
}

function calcMultipliers(input: DpsInput): MultiplierParts {
  const additive =
    1 +
    input.additive.weaponDamagePct / 100 +
    input.additive.weaponTypeDamagePct / 100 +
    input.additive.additiveTalentsPct / 100;

  const amplified = input.amplified.multipliers.reduce(
    (acc, pct) => acc * (1 + pct / 100),
    1
  );

  const chc = Math.min(input.crit.chcPct / 100, CHC_HARD_CAP);
  const chd = input.crit.chdPct / 100;
  const hsChance = input.crit.headshotChancePct / 100;
  const hsd = input.crit.hsdPct / 100;
  const critHs = 1 + chc * chd + hsChance * hsd;

  const ooc = input.target.damageOutOfCoverPct / 100;
  const targetArmor = 1 + input.target.damageToArmorPct / 100 + ooc;
  const targetHealth = 1 + input.target.damageToHealthPct / 100 + ooc;

  const clampedGrade = Math.min(
    Math.max(input.expertise.grade, 0),
    EXPERTISE_MAX_GRADE
  );
  const expertise = 1 + clampedGrade * EXPERTISE_PER_GRADE;

  return { additive, amplified, critHs, targetArmor, targetHealth, expertise };
}

export function calculateBulletDamage(input: DpsInput): number {
  const m = calcMultipliers(input);
  // DtA and DtH are mutually exclusive (target has armor OR is on health, not both).
  // Default: fullArmor=true → use DtA.
  const hasArmor = input.target.fullArmor !== false;
  const targetMul = hasArmor ? m.targetArmor : m.targetHealth;
  return input.weapon.baseDamage * m.additive * m.amplified * m.critHs * targetMul * m.expertise;
}

export function calculateBulletDamageArmor(input: DpsInput): number {
  const m = calcMultipliers(input);
  return input.weapon.baseDamage * m.additive * m.amplified * m.critHs * m.targetArmor * m.expertise;
}

export function calculateBulletDamageHealth(input: DpsInput): number {
  const m = calcMultipliers(input);
  return input.weapon.baseDamage * m.additive * m.amplified * m.critHs * m.targetHealth * m.expertise;
}

export function calculateBulletDamageNoCrit(input: DpsInput): number {
  const m = calcMultipliers(input);
  const targetMul = input.target.fullArmor !== false ? m.targetArmor : m.targetHealth;
  return input.weapon.baseDamage * m.additive * m.amplified * targetMul * m.expertise;
}

export function calculateBulletDamageCritOnly(input: DpsInput): number {
  // Guaranteed crit (CHC = 100% for this calc), no headshot
  const m = calcMultipliers(input);
  const chd = input.crit.chdPct / 100;
  const critMul = 1 + chd;
  const targetMul = input.target.fullArmor !== false ? m.targetArmor : m.targetHealth;
  return input.weapon.baseDamage * m.additive * m.amplified * critMul * targetMul * m.expertise;
}

export function calculateBulletDamageCritHs(input: DpsInput): number {
  // Guaranteed crit + guaranteed headshot.
  // Weapon.headshotMultiplier is the intrinsic per-weapon HS multiplier (e.g., AR ~1.5, MMR ~2.0+).
  // Gear HSD stat adds on top of it.
  const m = calcMultipliers(input);
  const chd = input.crit.chdPct / 100;
  const hsd = input.crit.hsdPct / 100;
  const wpnHsMul = input.weapon.headshotMultiplier ?? 1.5;
  const critHsMul = (1 + chd) * wpnHsMul * (1 + hsd);
  const targetMul = input.target.fullArmor !== false ? m.targetArmor : m.targetHealth;
  return input.weapon.baseDamage * m.additive * m.amplified * critHsMul * targetMul * m.expertise;
}

/** Headshot only (no crit) */
export function calculateBulletDamageHsOnly(input: DpsInput): number {
  const m = calcMultipliers(input);
  const hsd = input.crit.hsdPct / 100;
  const wpnHsMul = input.weapon.headshotMultiplier ?? 1.5;
  const hsMul = wpnHsMul * (1 + hsd);
  const targetMul = input.target.fullArmor !== false ? m.targetArmor : m.targetHealth;
  return input.weapon.baseDamage * m.additive * m.amplified * hsMul * targetMul * m.expertise;
}

function dpsFrom(bullet: number, input: DpsInput): { burst: number; sustained: number; cycleSeconds: number } {
  const { rpm, magazine, reloadSeconds } = input.weapon;
  if (rpm <= 0 || magazine <= 0) return { burst: 0, sustained: 0, cycleSeconds: 0 };
  const sps = rpm / 60;
  const burst = bullet * sps;
  const cycleSeconds = magazine / sps + reloadSeconds;
  const sustained = cycleSeconds > 0 ? (bullet * magazine) / cycleSeconds : 0;
  return { burst, sustained, cycleSeconds };
}

/**
 * Headhunter cap logic (v1).
 * If backpack talent is Headhunter and HSD > 150%, cap ceiling is 1250% WD, else 800%.
 * Applied as a cap on bulletDamageCritHs.
 */
export function applyHeadhunterCap(bulletHsCrit: number, baseDamage: number, hsdPct: number): number {
  const capMul = hsdPct > 150 ? 12.5 : 8;
  const cap = baseDamage * capMul;
  return Math.min(bulletHsCrit, cap);
}

/**
 * DPS ramp-up over time: simulates stack accumulation from t=0 to t=seconds.
 * Returns array of (t, dps) points.
 */
export function dpsRampUp(input: DpsInput, maxT: number = 10): Array<{ t: number; dps: number }> {
  const points = [0, 1, 2, 3, 5, 7, 10].filter((t) => t <= maxT);
  const baseDps = calculateDps(input).burstDps;
  return points.map((t) => ({ t, dps: baseDps }));
}

export function calculateDps(input: DpsInput): DpsOutput {
  const bulletDamage = calculateBulletDamage(input);
  const bulletDamageArmor = calculateBulletDamageArmor(input);
  const bulletDamageHealth = calculateBulletDamageHealth(input);
  const bulletDamageNoCrit = calculateBulletDamageNoCrit(input);
  const bulletDamageCrit = calculateBulletDamageCritOnly(input);
  const bulletDamageHsOnly = calculateBulletDamageHsOnly(input);
  const bulletDamageCritHs = calculateBulletDamageCritHs(input);

  const main = dpsFrom(bulletDamage, input);
  const armor = dpsFrom(bulletDamageArmor, input);
  const health = dpsFrom(bulletDamageHealth, input);

  return {
    bulletDamage,
    bulletDamageArmor,
    bulletDamageHealth,
    bulletDamageNoCrit,
    bulletDamageCrit,
    bulletDamageHsOnly,
    bulletDamageCritHs,
    burstDps: main.burst,
    burstDpsArmor: armor.burst,
    burstDpsHealth: health.burst,
    sustainedDps: main.sustained,
    sustainedDpsArmor: armor.sustained,
    sustainedDpsHealth: health.sustained,
    cycleSeconds: main.cycleSeconds,
  };
}
