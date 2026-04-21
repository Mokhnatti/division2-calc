// Rewrites gear_attribute_pool.json with realistic Division 2 per-slot max rolls (TU22)
// Source: Division 2 community gear attribute cap references.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'gear_attribute_pool.json');
const pool = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// Per-attribute per-slot god-roll max (NOT the cumulative 6-slot sum).
// For chest/back many offensive attributes roll slightly higher than other slots.
// Values are decimals (0.055 = 5.5%).
const CAPS_ATTR = {
  CritChance: 0.055,
  CritDamage: 0.11,
  HeadshotDamage: 0.11,
  WeaponDamage: 0.09,
  DamageToTargetsOutOfCover: 0.15,
  DamageToHealth: 0.15,
  DamageToArmor: 0.15,
  ExplosiveResist: 0.15,
  Health: 0.10,
  HazardProtection: 0.15,
  ArmorOnKill: 0.10,
  SkillHaste: 0.10,
  SkillDamage: 0.15,
  SkillRepair: 0.15,
  WeaponHandling: 0.09,
  Ergonomics: 0.09,
  RateOfFire: 0.05,
  MagazineSize: 0.30,
  ProtectionFromElites: 0.15,
  PulseResistance: 0.15,
  DisruptResistance: 0.15,
  DecoyDurability: 0.25,
  ReloadSpeed: 0.10,
  RepairSkills: 0.15,
  OutOfCoverDamage: 0.15,
  Stamina: 0.10,
};

// Core caps (by slot + attr)
const CORE_CAPS = {
  WeaponDamage: {chest: 0.15, back: 0.15, default: 0.09},
  Armor: {chest: 0.2413, back: 0.1988, kneepads: 0.1538, holster: 0.1538, gloves: 0.1170, mask: 0.1170, default: 0.15},
  SkillTier: {default: 1},
};

const MIN_RATIO = 0.60; // min_roll ≈ 60% of max_roll for simple scaling

function capForCore(attr, slot) {
  const table = CORE_CAPS[attr];
  if (!table) return undefined;
  return table[slot] !== undefined ? table[slot] : table.default;
}

function fixAttr(opt, slot) {
  const m = CAPS_ATTR[opt.attr];
  if (m === undefined) return;
  opt.max_roll = m;
  opt.min_roll = Math.round(m * MIN_RATIO * 1000) / 1000;
}

function fixCore(opt, slot) {
  const m = capForCore(opt.attr, slot);
  if (m === undefined) return;
  opt.max_roll = m;
  if (opt.slot_modifier !== undefined && opt.attr === 'Armor') {
    opt.slot_modifier = m;
  }
}

for (const slot of Object.keys(pool)) {
  const s = pool[slot];
  if (Array.isArray(s.core_options)) {
    for (const c of s.core_options) fixCore(c, slot);
  }
  if (Array.isArray(s.attr1_options)) {
    for (const a of s.attr1_options) fixAttr(a, slot);
  }
  if (Array.isArray(s.attr2_options)) {
    for (const a of s.attr2_options) fixAttr(a, slot);
  }
}

fs.writeFileSync(FILE, JSON.stringify(pool, null, 2) + '\n');
console.log('✓ Rewrote', FILE);
console.log('Slots updated:', Object.keys(pool).join(', '));
