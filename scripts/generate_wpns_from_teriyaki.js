#!/usr/bin/env node
// Generate WPNS_BASE, WEAPON_TALENTS, EXOTIC_WPNS from Teriyaki DB.
// Outputs JS code snippets that can be pasted into index.html.
// Preserves existing Russian names from index.html where available.

const fs = require('fs');
const path = require('path');

const DB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_sources', 'teriyaki_db.json'), 'utf8'));
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// 1. Build EN -> RU name mapping from existing data
const enToRu = {};
const extractPairs = (arrName) => {
  const re = new RegExp("const\\s+" + arrName + "\\s*=\\s*\\[([\\s\\S]*?)^\\];", "m");
  const m = re.exec(HTML);
  if (!m) return;
  const pairs = [...m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
};
extractPairs('G');
extractPairs('E');
extractPairs('N');

// Also grab WPNS_BASE existing (for old base weapons that had Russian names)
const wpnsBaseMatch = /const\s+WPNS_BASE\s*=\s*\[([\s\S]*?)^\];/m.exec(HTML);
if (wpnsBaseMatch) {
  const pairs = [...wpnsBaseMatch[1].matchAll(/\{id:"([^"]+)",name:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[2]; // base weapons name is same EN
}

// 2. Cat mapping
const CAT_MAP = {
  AR: 'AR', SMG: 'SMG', LMG: 'LMG', Rifle: 'Rifle',
  MMR: 'MMR', Shotgun: 'SG', Pistol: 'Pistol',
};

// 3. Generate WPNS_BASE for all High-End weapons (181 items)
const slugify = (s) => s.toLowerCase()
  .replace(/[^\w\s'-]/g, '')
  .replace(/\s+/g, '_')
  .replace(/'/g, '')
  .replace(/-/g, '_');

const baseWeapons = DB.weapons
  .filter(w => w.quality === 'High-End')
  .map(w => ({
    id: slugify(w.name),
    name: w.name, // EN name (no RU mapping for base weapons usually)
    en: w.name,
    cat: CAT_MAP[w.type] || w.type,
    dmg: w.baseDamage,
    rpm: w.rpm,
    mag: w.magazineSize,
    reload: w.reloadSpeed,
    range: w.optimalRange,
    hsd_base: w.headshotDamage,
  }));

// Output WPNS_BASE js code
let wpnsBaseCode = 'const WPNS_BASE=[\n';
for (const t of ['AR', 'SMG', 'LMG', 'MMR', 'Rifle', 'SG', 'Pistol']) {
  wpnsBaseCode += `  // ===== ${t} =====\n`;
  for (const w of baseWeapons.filter(w => w.cat === t)) {
    wpnsBaseCode += `  {id:"${w.id}",name:"${w.name}",cat:"${w.cat}",dmg:${w.dmg},rpm:${w.rpm},mag:${w.mag},reload:${w.reload}},\n`;
  }
}
wpnsBaseCode += '];';
fs.writeFileSync(path.join(__dirname, '..', 'data_sources', 'gen_WPNS_BASE.js'), wpnsBaseCode);
console.log(`WPNS_BASE: ${baseWeapons.length} weapons → gen_WPNS_BASE.js`);

// 4. Generate WEAPON_TALENTS from Teriyaki weaponTalents
const talentsCode = ['const WEAPON_TALENTS={'];
talentsCode.push('  none:{name:"— нет —",bonus:null},');
for (const t of DB.weaponTalents) {
  const key = slugify(t.name);
  const mods = t.modifiers || {};
  const bonusObj = {};
  // Map modifier keys
  const map = {
    weaponDamage: 'wd', headshotDamage: 'hsd',
    critChance: 'chc', critDamage: 'chd',
    rateOfFire: 'rof', magazineSizePct: 'mag',
    reloadSpeed: 'reload',
  };
  for (const [k, v] of Object.entries(mods)) {
    if (map[k]) bonusObj[map[k]] = v;
  }
  // Most talents are conditional in description
  const isConditional = /after|while|for \d+s|increases?|every|on|when/i.test(t.description || '');
  if (isConditional) bonusObj.conditional = true;
  bonusObj.note = (t.description || '').slice(0, 180);
  const bonusStr = Object.keys(bonusObj).length
    ? `{${Object.entries(bonusObj).map(([k, v]) =>
        typeof v === 'string' ? `${k}:"${v.replace(/"/g, '\\"')}"` : `${k}:${v}`).join(',')}}`
    : 'null';
  talentsCode.push(`  ${key}:{name:"${t.name}",bonus:${bonusStr}},`);
}
talentsCode.push('};');
fs.writeFileSync(path.join(__dirname, '..', 'data_sources', 'gen_WEAPON_TALENTS.js'), talentsCode.join('\n'));
console.log(`WEAPON_TALENTS: ${DB.weaponTalents.length + 1} talents → gen_WEAPON_TALENTS.js`);

// 5. Generate EXOTIC_WPNS — preserve Russian names where we have them
const exotics = DB.weapons.filter(w => w.quality === 'Exotic');
const exoticCode = ['const EXOTIC_WPNS={'];
for (const e of exotics) {
  const ruName = enToRu[e.name] || e.name;
  const cat = CAT_MAP[e.type] || e.type;
  exoticCode.push(`  "${ruName}":{en:"${e.name}",cat:"${cat}",dmg:${e.baseDamage},rpm:${e.rpm},mag:${e.magazineSize},reload:${e.reloadSpeed}},`);
}
exoticCode.push('};');
fs.writeFileSync(path.join(__dirname, '..', 'data_sources', 'gen_EXOTIC_WPNS.js'), exoticCode.join('\n'));
console.log(`EXOTIC_WPNS: ${exotics.length} exotics → gen_EXOTIC_WPNS.js`);

// 6. Gear talents — extend TALENT_MATH
const gearTalents = DB.gearTalents || [];
const tmCode = ['// Auto-generated gear talents from Teriyaki — append to TALENT_MATH'];
const seen = new Set();
for (const t of gearTalents) {
  if (!t.name || seen.has(t.name)) continue;
  seen.add(t.name);
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
  bonus.note = (t.description || '').slice(0, 200);
  // Key as "Perfect X" for named items lookup
  const perfKey = 'Perfect ' + t.name;
  const bonusStr = Object.entries(bonus).map(([k, v]) =>
    typeof v === 'string' ? `${k}:"${v.replace(/"/g, '\\"')}"` : `${k}:${v}`).join(',');
  tmCode.push(`  "${perfKey}":{${bonusStr}},`);
}
fs.writeFileSync(path.join(__dirname, '..', 'data_sources', 'gen_TALENT_MATH_perfect.js'), tmCode.join('\n'));
console.log(`TALENT_MATH (Perfect variants): ${seen.size} talents → gen_TALENT_MATH_perfect.js`);

console.log('\nReady to paste into index.html. Back up first!');
