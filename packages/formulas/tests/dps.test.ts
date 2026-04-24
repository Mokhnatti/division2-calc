import { describe, expect, it } from 'vitest';
import { calculateBulletDamage, calculateDps, type DpsInput } from '../src/index.js';

function emptyInput(): DpsInput {
  return {
    weapon: { baseDamage: 100_000, rpm: 600, magazine: 30, reloadSeconds: 2, headshotMultiplier: 1.5 },
    additive: { weaponDamagePct: 0, weaponTypeDamagePct: 0, additiveTalentsPct: 0 },
    amplified: { multipliers: [] },
    crit: { chcPct: 0, chdPct: 0, hsdPct: 0, headshotChancePct: 0 },
    target: { damageToArmorPct: 0, damageToHealthPct: 0, damageOutOfCoverPct: 0 },
    expertise: { grade: 0 },
  };
}

describe('calculateBulletDamage', () => {
  it('no bonuses → baseDamage unchanged', () => {
    expect(calculateBulletDamage(emptyInput())).toBe(100_000);
  });

  it('weaponDamage bucket is additive', () => {
    const input = emptyInput();
    input.additive.weaponDamagePct = 30;
    input.additive.weaponTypeDamagePct = 15;
    expect(calculateBulletDamage(input)).toBeCloseTo(145_000, 0);
  });

  it('amplified bucket is multiplicative per stack', () => {
    const input = emptyInput();
    input.amplified.multipliers = [25, 25];
    expect(calculateBulletDamage(input)).toBeCloseTo(100_000 * 1.25 * 1.25, 0);
  });

  it('CHC respects 60% hard cap', () => {
    const input = emptyInput();
    input.crit.chcPct = 80;
    input.crit.chdPct = 100;
    expect(calculateBulletDamage(input)).toBeCloseTo(160_000, 0);
  });

  it('expertise adds +1% per grade up to 30', () => {
    const input = emptyInput();
    input.expertise.grade = 30;
    expect(calculateBulletDamage(input)).toBeCloseTo(130_000, 0);
  });

  it('expertise caps at grade 30', () => {
    const input = emptyInput();
    input.expertise.grade = 45;
    expect(calculateBulletDamage(input)).toBeCloseTo(130_000, 0);
  });
});

describe('calculateDps', () => {
  it('no bonuses AR 600rpm 30mag 2s reload', () => {
    const out = calculateDps(emptyInput());
    expect(out.bulletDamage).toBe(100_000);
    expect(out.burstDps).toBeCloseTo(1_000_000, 0);
    expect(out.cycleSeconds).toBeCloseTo(5, 2);
    expect(out.sustainedDps).toBeCloseTo(600_000, 0);
  });

  it('zero rpm returns zero dps (empty weapon state)', () => {
    const input = emptyInput();
    input.weapon.rpm = 0;
    const out = calculateDps(input);
    expect(out.burstDps).toBe(0);
    expect(out.sustainedDps).toBe(0);
    expect(out.cycleSeconds).toBe(0);
  });
});
