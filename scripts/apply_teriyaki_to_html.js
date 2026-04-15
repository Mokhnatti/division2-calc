#!/usr/bin/env node
// Apply Teriyaki data to index.html surgically:
// 1. Replace WPNS_BASE wholesale (new has 181 exact weapons vs our ~92 approximated)
// 2. Merge EXOTIC_WPNS — preserve existing mechanics (tal_type, tal_bonus, etc), update stats
// 3. Append new WEAPON_TALENTS entries (keep existing hand-curated)
// 4. Append new TALENT_MATH entries (keep existing)

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const DB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_sources', 'teriyaki_db.json'), 'utf8'));

let html = fs.readFileSync(HTML_PATH, 'utf8');
fs.writeFileSync(HTML_PATH + '.bak', html, 'utf8');
console.log('Backup saved: index.html.bak');

const CAT_MAP = { AR: 'AR', SMG: 'SMG', LMG: 'LMG', Rifle: 'Rifle', MMR: 'MMR', Shotgun: 'SG', Pistol: 'Pistol' };
const slugify = (s) => s.toLowerCase().replace(/[^\w\s'-]/g, '').replace(/\s+/g, '_').replace(/'/g, '').replace(/-/g, '_');

// ============ 1. WPNS_BASE replace ============
const baseWeapons = DB.weapons.filter(w => w.quality === 'High-End');
let wpnsBaseBody = '';
for (const t of ['AR', 'SMG', 'LMG', 'MMR', 'Rifle', 'SG', 'Pistol']) {
  wpnsBaseBody += `  // ===== ${t} =====\n`;
  for (const w of baseWeapons) {
    if (CAT_MAP[w.type] !== t) continue;
    const id = slugify(w.name);
    wpnsBaseBody += `  {id:"${id}",name:"${w.name.replace(/"/g, '\\"')}",cat:"${t}",dmg:${w.baseDamage},rpm:${w.rpm},mag:${w.magazineSize},reload:${w.reloadSpeed}},\n`;
  }
}
const wpnsBaseBlock = '// Full weapon database — base + exotic + named (named auto-generated from N[] at init)\n// Damage values: exact from Teriyaki calculator (div2-gear-calc v1.7.4 April 2026)\nconst WPNS_BASE=[\n' + wpnsBaseBody + '];';

// Replace existing WPNS_BASE
const wpnsBaseRegex = /\/\/ Full weapon database[\s\S]*?const WPNS_BASE\s*=\s*\[[\s\S]*?^\];/m;
if (!wpnsBaseRegex.test(html)) {
  console.error('WPNS_BASE regex did not match — check format');
  process.exit(1);
}
html = html.replace(wpnsBaseRegex, wpnsBaseBlock);
console.log(`WPNS_BASE replaced with ${baseWeapons.length} weapons`);

// ============ 2. EXOTIC_WPNS merge ============
// Parse existing EXOTIC_WPNS to preserve mechanics
const existingExoticBlock = /const\s+EXOTIC_WPNS\s*=\s*\{([\s\S]*?)^\};/m.exec(html);
const existingExotics = {};
if (existingExoticBlock) {
  const body = existingExoticBlock[1];
  // Very rough parse: split by lines starting with "  "name":{
  const re = /"([^"]+)":\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(body))) {
    const name = m[1];
    const props = m[2];
    // Extract tal_type, tal_bonus, tal_max, tal if present
    const tal_type = /tal_type:"([^"]+)"/.exec(props)?.[1];
    const tal_bonus = /tal_bonus:(\d+)/.exec(props)?.[1];
    const tal_max = /tal_max:(\d+)/.exec(props)?.[1];
    const tal = /tal:"([^"]+)"/.exec(props)?.[1];
    existingExotics[name] = { tal_type, tal_bonus, tal_max, tal };
  }
}
console.log(`Preserving mechanics for ${Object.keys(existingExotics).length} existing exotics`);

// Build new EXOTIC_WPNS — preserve Russian names for ones we know, add new stats
const exotics = DB.weapons.filter(w => w.quality === 'Exotic');
// Load EN->RU mapping from index.html
const enToRu = {};
const nMatch = /const\s+N\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
if (nMatch) {
  const pairs = [...nMatch[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
}
const eMatch = /const\s+E\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
if (eMatch) {
  const pairs = [...eMatch[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
}

let exoticBody = '';
for (const e of exotics) {
  const ruName = enToRu[e.name] || e.name;
  const cat = CAT_MAP[e.type] || e.type;
  const talentEn = e.defaultTalent ? (DB.weaponTalents.find(t => t.id === e.defaultTalent)?.name || '') : '';
  const talentDesc = e.defaultTalent ? (DB.weaponTalents.find(t => t.id === e.defaultTalent)?.description || '') : '';
  // Preserve existing mechanics
  const preserved = existingExotics[ruName] || {};
  const parts = [`en:"${e.name.replace(/"/g, '\\"')}"`, `cat:"${cat}"`, `dmg:${e.baseDamage}`, `rpm:${e.rpm}`, `mag:${e.magazineSize}`, `reload:${e.reloadSpeed}`];
  if (talentEn) parts.push(`tal:"${talentEn.replace(/"/g, '\\"')}"`);
  if (talentDesc) parts.push(`tal_desc:"${talentDesc.slice(0, 180).replace(/"/g, '\\"')}"`);
  if (preserved.tal_type) parts.push(`tal_type:"${preserved.tal_type}"`);
  if (preserved.tal_bonus) parts.push(`tal_bonus:${preserved.tal_bonus}`);
  if (preserved.tal_max) parts.push(`tal_max:${preserved.tal_max}`);
  exoticBody += `  "${ruName.replace(/"/g, '\\"')}":{${parts.join(',')}},\n`;
}
const newExoticBlock = '// Exotic weapons — stats from Teriyaki v1.7.4, mechanics preserved from our hand-tuned values\nconst EXOTIC_WPNS={\n' + exoticBody + '};';
const exoticRegex = /\/\/ Exotic weapons[\s\S]*?const EXOTIC_WPNS\s*=\s*\{[\s\S]*?^\};/m;
if (exoticRegex.test(html)) {
  html = html.replace(exoticRegex, newExoticBlock);
} else {
  // Fallback: replace without comment header
  html = html.replace(/const EXOTIC_WPNS\s*=\s*\{[\s\S]*?^\};/m, newExoticBlock);
}
console.log(`EXOTIC_WPNS: ${exotics.length} exotics (${Object.keys(existingExotics).length} with preserved mechanics)`);

// ============ 3. WEAPON_TALENTS append new ============
// Parse existing talents
const wtMatch = /const\s+WEAPON_TALENTS\s*=\s*\{([\s\S]*?)^\};/m.exec(html);
const existingWtKeys = new Set();
if (wtMatch) {
  const keys = [...wtMatch[1].matchAll(/^\s*(\w+):\{/gm)];
  for (const k of keys) existingWtKeys.add(k[1]);
}

let newWtLines = [];
for (const t of DB.weaponTalents) {
  const key = slugify(t.name);
  if (existingWtKeys.has(key)) continue;
  const mods = t.modifiers || {};
  const map = {
    weaponDamage: 'wd', headshotDamage: 'hsd',
    critChance: 'chc', critDamage: 'chd',
    rateOfFire: 'rof', magazineSizePct: 'mag',
    reloadSpeed: 'reload',
  };
  const bonus = {};
  for (const [k, v] of Object.entries(mods)) {
    if (map[k]) bonus[map[k]] = v;
  }
  const isCond = /after|while|on kill|when|every/i.test(t.description || '');
  if (isCond) bonus.conditional = true;
  const note = (t.description || '').slice(0, 180).replace(/"/g, '\\"');
  bonus.note = note;
  const bonusStr = Object.keys(bonus).length
    ? `{${Object.entries(bonus).map(([k, v]) =>
        typeof v === 'string' ? `${k}:"${v}"` : `${k}:${v}`).join(',')}}`
    : 'null';
  newWtLines.push(`  ${key}:{name:"${t.name.replace(/"/g, '\\"')}",bonus:${bonusStr}},`);
}

if (newWtLines.length) {
  // Insert before closing };
  html = html.replace(
    /(const\s+WEAPON_TALENTS\s*=\s*\{[\s\S]*?)\n\};/m,
    `$1\n  // === appended from Teriyaki ===\n${newWtLines.join('\n')}\n};`
  );
  console.log(`WEAPON_TALENTS: +${newWtLines.length} new (${existingWtKeys.size} preserved)`);
} else {
  console.log('WEAPON_TALENTS: no new talents to add');
}

// ============ 4. TALENT_MATH append new Perfect variants ============
const tmMatch = /const\s+TALENT_MATH\s*=\s*\{([\s\S]*?)^\};/m.exec(html);
const existingTmKeys = new Set();
if (tmMatch) {
  const keys = [...tmMatch[1].matchAll(/^\s*"([^"]+)":\{/gm)];
  for (const k of keys) existingTmKeys.add(k[1]);
}

const tmNew = [];
const seenTalentNames = new Set();
for (const t of DB.gearTalents) {
  if (!t.name || seenTalentNames.has(t.name)) continue;
  seenTalentNames.add(t.name);
  const perfKey = 'Perfect ' + t.name;
  if (existingTmKeys.has(perfKey)) continue;

  const mods = t.modifiers || {};
  const map = {
    weaponDamage: 'wd', headshotDamage: 'hsd',
    critChance: 'chc', critDamage: 'chd',
    rateOfFire: 'rof', magazineSizePct: 'mag',
    reloadSpeed: 'reload',
  };
  const bonus = {};
  for (const [k, v] of Object.entries(mods)) {
    if (map[k]) bonus[map[k]] = v;
  }
  bonus.conditional = true;
  bonus.note = (t.description || '').slice(0, 180).replace(/"/g, '\\"');
  if (Object.keys(bonus).length <= 2) continue; // skip if only conditional+note (no real bonus)
  const bonusStr = Object.entries(bonus).map(([k, v]) =>
    typeof v === 'string' ? `${k}:"${v}"` : `${k}:${v}`).join(',');
  tmNew.push(`  "${perfKey}":{${bonusStr}},`);
}

if (tmNew.length) {
  html = html.replace(
    /(const\s+TALENT_MATH\s*=\s*\{[\s\S]*?)\n\};/m,
    `$1\n  // === appended from Teriyaki gearTalents ===\n${tmNew.join('\n')}\n};`
  );
  console.log(`TALENT_MATH: +${tmNew.length} new Perfect variants (${existingTmKeys.size} preserved)`);
} else {
  console.log('TALENT_MATH: no new talents');
}

fs.writeFileSync(HTML_PATH, html, 'utf8');
console.log('\nindex.html written. File size:', fs.statSync(HTML_PATH).size, 'bytes');
