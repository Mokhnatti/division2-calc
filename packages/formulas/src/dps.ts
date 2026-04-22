import type { DpsInput, DpsOutput } from './types.js';

const CHC_HARD_CAP = 0.60;
const EXPERTISE_PER_GRADE = 0.01;
const EXPERTISE_MAX_GRADE = 30;

export function calculateBulletDamage(input: DpsInput): number {
  const { weapon, additive, amplified, crit, target, expertise } = input;

  const additiveMultiplier =
    1 +
    additive.weaponDamagePct / 100 +
    additive.weaponTypeDamagePct / 100 +
    additive.additiveTalentsPct / 100;

  const amplifiedMultiplier = amplified.multipliers.reduce(
    (acc, pct) => acc * (1 + pct / 100),
    1
  );

  const chc = Math.min(crit.chcPct / 100, CHC_HARD_CAP);
  const chd = crit.chdPct / 100;
  const hsChance = crit.headshotChancePct / 100;
  const hsd = crit.hsdPct / 100;
  const critHeadshotMultiplier = 1 + chc * chd + hsChance * hsd;

  const targetStateMultiplier =
    1 +
    target.damageToArmorPct / 100 +
    target.damageToHealthPct / 100 +
    target.damageOutOfCoverPct / 100;

  const clampedGrade = Math.min(
    Math.max(expertise.grade, 0),
    EXPERTISE_MAX_GRADE
  );
  const expertiseMultiplier = 1 + clampedGrade * EXPERTISE_PER_GRADE;

  return (
    weapon.baseDamage *
    additiveMultiplier *
    amplifiedMultiplier *
    critHeadshotMultiplier *
    targetStateMultiplier *
    expertiseMultiplier
  );
}

export function calculateDps(input: DpsInput): DpsOutput {
  const bulletDamage = calculateBulletDamage(input);
  const shotsPerSecond = input.weapon.rpm / 60;
  const burstDps = bulletDamage * shotsPerSecond;
  const magazineDurationSeconds = input.weapon.magazine / shotsPerSecond;
  const cycleSeconds = magazineDurationSeconds + input.weapon.reloadSeconds;
  const magazineDamage = bulletDamage * input.weapon.magazine;
  const sustainedDps = magazineDamage / cycleSeconds;

  return {
    bulletDamage,
    burstDps,
    sustainedDps,
    cycleSeconds,
  };
}
