#!/usr/bin/env node
// Merge MikeRee talents.json into TALENT_MATH and WEAPON_TALENTS in index.html
// MikeRee has authoritative talent data: 206 talents with exact bonus/stacks/perfectBonus

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const MR_TALENTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'mikeree', 'talents.json'), 'utf8'));

let html = fs.readFileSync(HTML_PATH, 'utf8');

// Map MikeRee stat names to our internal keys
const STAT_MAP = {
  'weapon damage': 'wd',
  'headshot damage': 'hsd',
  'critical hit chance': 'chc',
  'critical hit damage': 'chd',
  'rate of fire': 'rof',
  'magazine size': 'mag',
  'reload speed': 'reload',
  'damage to armor': 'dta',
  'damage to health': 'dth',
  'damage to elites': 'dte',
  'weapon handling': 'handling',
  'damage to target out of cover': 'ooc',
};

function buildBonusObj(talent, isPerfect) {
  const out = {};
  // 1. Direct bonus on talent
  const bonus = isPerfect ? (talent.perfectBonus || {}) : (talent.bonus || {});
  for (const [k, v] of Object.entries(bonus)) {
    if (STAT_MAP[k]) out[STAT_MAP[k]] = v;
  }
  // 2. Stacks-based bonus (multiply per-stack × max stacks)
  const stacks = isPerfect ? (talent.perfectStacks || []) : (talent.stacks || []);
  for (const s of stacks) {
    if (!s.bonus) continue;
    for (const [k, v] of Object.entries(s.bonus)) {
      if (STAT_MAP[k]) {
        const total = v * (s.size || 1);
        out[STAT_MAP[k]] = (out[STAT_MAP[k]] || 0) + total;
      }
    }
  }
  return out;
}

// Group by Perfect / regular
let weaponTalentsAdded = 0;
let gearTalentsAdded = 0;
const newPerfectEntries = []; // for TALENT_MATH

const existingTM = /const\s+TALENT_MATH\s*=\s*\{([\s\S]*?)^\};/m.exec(html);
const existingTMKeys = new Set();
if (existingTM) {
  const keys = [...existingTM[1].matchAll(/^\s*"([^"]+)":\{/gm)];
  for (const k of keys) existingTMKeys.add(k[1]);
}

for (const t of MR_TALENTS) {
  if (!t.name) continue;
  // Generate Perfect variant if applicable
  const perfectName = t.perfectName || ('Perfect ' + t.name);
  if (existingTMKeys.has(perfectName)) continue;

  const perfectBonus = buildBonusObj(t, true);
  const regularBonus = buildBonusObj(t, false);
  // Use perfect if available, else regular
  const finalBonus = Object.keys(perfectBonus).length ? perfectBonus : regularBonus;
  if (!Object.keys(finalBonus).length) continue;

  finalBonus.conditional = true;
  // Sanitize: remove newlines, escape quotes
  finalBonus.note = (t.perfectDescription || t.description || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  const bonusStr = Object.entries(finalBonus).map(([k, v]) =>
    typeof v === 'string' ? `${k}:"${v}"` : `${k}:${v}`).join(',');
  newPerfectEntries.push(`  "${perfectName}":{${bonusStr}},`);
  if (t.type === 'weapon') weaponTalentsAdded++;
  else gearTalentsAdded++;
}

if (newPerfectEntries.length) {
  html = html.replace(
    /(const\s+TALENT_MATH\s*=\s*\{[\s\S]*?)\n\};/m,
    `$1\n  // === appended from MikeRee talents.json (authoritative bonus + stacks) ===\n${newPerfectEntries.join('\n')}\n};`
  );
  fs.writeFileSync(HTML_PATH, html, 'utf8');
}

console.log(`Added ${newPerfectEntries.length} Perfect talents from MikeRee:`);
console.log(`  weapon: ${weaponTalentsAdded}, gear: ${gearTalentsAdded}`);
console.log(`  existing in TALENT_MATH: ${existingTMKeys.size}`);
