#!/usr/bin/env node
// Merge Teriyaki's gear calculator DB into translations_en.json
// Source: https://github.com/ImThatTeriyaki/Tom-Clancy-The-Division-2-Gear-calculator
//
// Teriyaki DB has ~320 weapons, 115 weapon talents, 489 gear items, 177 gear talents,
// 36 brands, 26 gear sets, 27 prototype attributes — all with official English text.
//
// Usage: node scripts/merge_teriyaki.js

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data_sources', 'teriyaki_db.json');
const TRANS_PATH = path.join(__dirname, '..', 'translations_en.json');

if (!fs.existsSync(DB_PATH)) {
  console.error('teriyaki_db.json not found. Run download step first.');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const trans = fs.existsSync(TRANS_PATH) ? JSON.parse(fs.readFileSync(TRANS_PATH, 'utf8')) : {};
trans.sets = trans.sets || {};
trans.brands = trans.brands || {};
trans.exotics = trans.exotics || {};
trans.named = trans.named || {};
trans.talents_authoritative = trans.talents_authoritative || {};

let stats = { weapon_talents: 0, gear_talents: 0, sets: 0, brands: 0, named: 0, exotic: 0 };

// 1. Weapon talents — store as authoritative talents by name
for (const t of db.weaponTalents || []) {
  if (!t.name) continue;
  trans.talents_authoritative[t.name] = {
    tal: t.name,
    d: t.description || '',
    source: 'teriyaki',
    modifiers: t.modifiers || {},
  };
  stats.weapon_talents++;
  // Also add "Perfect X" variant if applicable (named versions)
  const perfKey = 'Perfect ' + t.name;
  if (!trans.talents_authoritative[perfKey]) {
    trans.talents_authoritative[perfKey] = {
      tal: perfKey,
      d: t.description + ' (Perfect version — enhanced on Named items)',
      source: 'teriyaki-derived',
    };
  }
}

// 2. Gear talents (named armor talents)
for (const t of db.gearTalents || []) {
  if (!t.name) continue;
  const key = t.name;
  // Teriyaki DB has duplicates (same name with different descriptions = different gear)
  // Keep the first one encountered, note slot
  if (!trans.talents_authoritative[key] || trans.talents_authoritative[key].source === 'faildruid') {
    trans.talents_authoritative[key] = {
      tal: t.name,
      d: t.description || '',
      slot: t.slot || '',
      source: 'teriyaki',
      modifiers: t.modifiers || {},
    };
    stats.gear_talents++;
  }
  // Perfect variant
  const perfKey = 'Perfect ' + t.name;
  if (!trans.talents_authoritative[perfKey]) {
    trans.talents_authoritative[perfKey] = {
      tal: perfKey,
      d: t.description + ' (Perfect — enhanced values on Named items)',
      source: 'teriyaki-derived',
    };
  }
}

// Stat type humanizer — maps internal statType to user-facing English label
const STAT_LABEL = {
  arDamage: 'Assault Rifle Damage', smgDamage: 'SMG Damage', lmgDamage: 'LMG Damage',
  mmrDamage: 'Marksman Rifle Damage', rifleDamage: 'Rifle Damage', shotgunDamage: 'Shotgun Damage',
  pistolDamage: 'Pistol Damage',
  weaponDamage: 'Weapon Damage', headshotDamage: 'Headshot Damage',
  critChance: 'Critical Hit Chance', critDamage: 'Critical Hit Damage',
  weaponHandling: 'Weapon Handling', reloadSpeed: 'Reload Speed', rateOfFire: 'Rate of Fire',
  accuracy: 'Accuracy', stability: 'Stability', magazineSizePct: 'Magazine Size',
  optimalRange: 'Optimal Range', ammoCapacity: 'Ammo Capacity', swapSpeed: 'Swap Speed',
  damageToArmor: 'Damage to Armor', damageToHealth: 'Damage to Health',
  armor: 'Armor', totalArmor: 'Total Armor', armorRegen: 'Armor Regeneration',
  armorOnKill: 'Armor on Kill', incomingRepairs: 'Incoming Repairs', shieldHealth: 'Shield Health',
  health: 'Health', explosiveRes: 'Explosive Resistance', shockRes: 'Shock Resistance',
  hazardProtection: 'Hazard Protection', pulseResistance: 'Pulse Resistance',
  skillDamage: 'Skill Damage', skillHaste: 'Skill Haste', skillDuration: 'Skill Duration',
  skillHealth: 'Skill Health', skillEfficiency: 'Skill Efficiency', skillRepair: 'Skill Repair',
  skillTier: 'Skill Tier', burnDamage: 'Burn Damage', burnDuration: 'Burn Duration',
  statusEffects: 'Status Effects', explosiveDamage: 'Explosive Damage',
};
function formatBonus(b) {
  if (Array.isArray(b)) return b.map(formatBonus).join(' & ');
  if (!b || typeof b !== 'object') return String(b);
  const label = STAT_LABEL[b.statType] || b.statType;
  return `+${b.value}% ${label}`;
}

// 3. Gear sets — convert from {bonuses:{2:...,3:...,4:...}} to array of strings
for (const [setName, set] of Object.entries(db.gearSets || {})) {
  const entry = trans.sets[setName] || { name: setName, en: setName };
  entry.source = 'teriyaki';
  if (set.bonuses) {
    const bonuses = [];
    for (const tier of ['2', '3', '4']) {
      if (set.bonuses[tier]) bonuses.push(`${tier}pc: ${formatBonus(set.bonuses[tier])}`);
    }
    if (bonuses.length) entry.bonuses = bonuses;
  }
  trans.sets[setName] = entry;
  stats.sets++;
}

// 4. Brands — same structure
for (const [brandName, brand] of Object.entries(db.brands || {})) {
  const entry = trans.brands[brandName] || { name: brandName };
  entry.source = 'teriyaki';
  if (brand.bonuses) {
    const bonuses = [];
    for (const tier of ['1', '2', '3']) {
      if (brand.bonuses[tier]) bonuses.push(`${tier}pc: ${formatBonus(brand.bonuses[tier])}`);
    }
    if (bonuses.length) entry.bonuses = bonuses;
  }
  trans.brands[brandName] = entry;
  stats.brands++;
}

// 5. Named items from gearItems (quality: Named)
for (const item of db.gearItems || []) {
  if (item.quality !== 'Named') continue;
  const name = item.name;
  if (!name) continue;
  const entry = trans.named[name] || { en: name };
  entry.name = item.nameRu || entry.name || name;
  entry.source = 'teriyaki';
  if (item.description) entry.d = item.description;
  if (item.talent) entry.tal = typeof item.talent === 'string' ? item.talent : (item.talent.name || '');
  if (item.brand) entry.brand = item.brand;
  if (item.slot) entry.slot = item.slot;
  trans.named[name] = entry;
  stats.named++;
}

// Also exotic gear (quality: Exotic)
for (const item of db.gearItems || []) {
  if (item.quality !== 'Exotic') continue;
  const name = item.name;
  if (!name) continue;
  const entry = trans.exotics[name] || { en: name };
  entry.name = item.nameRu || entry.name || name;
  entry.source = 'teriyaki';
  if (item.description) entry.d = item.description;
  if (item.talent) entry.tal = typeof item.talent === 'string' ? item.talent : (item.talent.name || '');
  if (item.slot) entry.slot = item.slot;
  trans.exotics[name] = entry;
  stats.exotic++;
}

trans.meta = trans.meta || {};
trans.meta.teriyaki_merged = new Date().toISOString();
trans.meta.teriyaki_source = 'https://github.com/ImThatTeriyaki/Tom-Clancy-The-Division-2-Gear-calculator';
trans.meta.teriyaki_version = 'v1.7.4 April 2026';

fs.writeFileSync(TRANS_PATH, JSON.stringify(trans, null, 2), 'utf8');

console.log('Merged from Teriyaki:');
console.log('  weapon talents:', stats.weapon_talents);
console.log('  gear talents:', stats.gear_talents);
console.log('  sets:', stats.sets);
console.log('  brands:', stats.brands);
console.log('  named items:', stats.named);
console.log('  exotic items:', stats.exotic);
console.log('Total authoritative talents now:', Object.keys(trans.talents_authoritative).length);
console.log('Output:', TRANS_PATH);
