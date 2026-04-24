import { describe, expect, it } from 'vitest';
import { calculateDps, calculateBulletDamage, type DpsInput } from '../src/index.js';

function base(): DpsInput {
  return {
    weapon: { baseDamage: 100_000, rpm: 600, magazine: 30, reloadSeconds: 2, headshotMultiplier: 1.5 },
    additive: { weaponDamagePct: 0, weaponTypeDamagePct: 0, additiveTalentsPct: 0 },
    amplified: { multipliers: [] },
    crit: { chcPct: 0, chdPct: 0, hsdPct: 0, headshotChancePct: 0 },
    target: { damageToArmorPct: 0, damageToHealthPct: 0, damageOutOfCoverPct: 0 },
    expertise: { grade: 0 },
  };
}

describe('Golden builds — s-i-n.co.uk canonical formula', () => {
  it('Striker AR (6 core WD + brands) — crit build baseline', () => {
    const input = base();
    input.weapon.baseDamage = 50_000;
    input.weapon.rpm = 750;
    input.additive.weaponDamagePct = 90;
    input.additive.weaponTypeDamagePct = 15;
    input.crit.chcPct = 60;
    input.crit.chdPct = 180;
    const r = calculateDps(input);
    const expected = 50_000 * 2.05 * (1 + 0.6 * 1.8);
    expect(r.bulletDamage).toBeCloseTo(expected, 0);
    expect(r.bulletDamage).toBeGreaterThan(200_000);
  });

  it('Glass Cannon amplified: separate multipliers stack multiplicatively', () => {
    const input = base();
    input.additive.weaponDamagePct = 90;
    input.amplified.multipliers = [25];
    const r1 = calculateDps(input);

    input.amplified.multipliers = [25, 25];
    const r2 = calculateDps(input);

    expect(r2.bulletDamage / r1.bulletDamage).toBeCloseTo(1.25, 3);
  });

  it('Amplified talent beats additive on high-WD builds (fox test Y8S1)', () => {
    const input = base();
    input.weapon.baseDamage = 47_000;
    input.weapon.rpm = 850;
    input.additive.weaponDamagePct = 90;
    input.crit.chcPct = 60;
    input.crit.chdPct = 120;

    input.amplified.multipliers = [25];
    const gc = calculateDps(input);

    input.amplified.multipliers = [];
    input.additive.additiveTalentsPct = 25;
    const oblit = calculateDps(input);

    expect(gc.bulletDamage).toBeGreaterThan(oblit.bulletDamage);
    const diffPct = ((gc.bulletDamage - oblit.bulletDamage) / oblit.bulletDamage) * 100;
    expect(diffPct).toBeGreaterThan(3);
    expect(diffPct).toBeLessThan(15);
  });

  it('Headshot damage cap sanity: HSD stacks but HS chance caps at 100%', () => {
    const input = base();
    input.crit.hsdPct = 100;
    input.crit.headshotChancePct = 100;
    const r = calculateDps(input);
    expect(r.bulletDamage).toBeCloseTo(100_000 * 2, 0);
  });

  it('Expertise grade 30 adds +30% to total bullet damage', () => {
    const input = base();
    input.additive.weaponDamagePct = 90;
    input.crit.chcPct = 60;
    input.crit.chdPct = 100;
    const noExp = calculateBulletDamage(input);
    input.expertise.grade = 30;
    const withExp = calculateBulletDamage(input);
    expect(withExp / noExp).toBeCloseTo(1.3, 3);
  });

  it('DtA and DtH are mutually exclusive based on fullArmor flag', () => {
    const input = base();
    input.target.damageToArmorPct = 50;
    input.target.damageToHealthPct = 100;
    // fullArmor = true (default) → DtA applies, DtH ignored
    input.target.fullArmor = true;
    const armored = calculateBulletDamage(input);
    // fullArmor = false → DtH applies, DtA ignored
    input.target.fullArmor = false;
    const onHealth = calculateBulletDamage(input);

    expect(armored).toBeCloseTo(100_000 * 1.5, 0);  // base * 1.5 (DtA)
    expect(onHealth).toBeCloseTo(100_000 * 2.0, 0); // base * 2.0 (DtH)
    // They should NOT sum (would be ×2.5)
    expect(armored).not.toBeCloseTo(100_000 * 2.5, 0);
  });

  it('Headshot crit applies weapon.headshotMultiplier × HSD bonus', () => {
    const input = base();
    input.weapon.baseDamage = 50_000;
    input.weapon.headshotMultiplier = 1.65;  // ACR
    input.additive.weaponDamagePct = 90;
    input.crit.chdPct = 100;
    input.crit.hsdPct = 50;
    const r = calculateDps(input);
    // Headshot crit = base × additive × (1+CHD) × weaponHsMul × (1+HSD)
    const expected = 50_000 * 1.9 * 2.0 * 1.65 * 1.5;
    expect(r.bulletDamageCritHs).toBeCloseTo(expected, -1);
  });
});
