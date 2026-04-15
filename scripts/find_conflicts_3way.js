#!/usr/bin/env node
// Three-way comparison: Teriyaki vs div2hub vs ilantvig
// Adds quiz questions for triple discrepancies

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QUESTIONS_FILE = path.join(ROOT, 'data_sources', 'quiz_questions.json');
const TERIYAKI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'teriyaki_db.json'), 'utf8'));

// Load div2hub
function readCsv(p) {
  const lines = fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const fields = []; let cur = ''; let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { fields.push(cur); cur = ''; }
      else cur += c;
    }
    fields.push(cur);
    const row = {};
    headers.forEach((h, i) => { row[h] = fields[i] || ''; });
    return row;
  });
}

const div2hub = {};
const cats = [
  { file: 'assault_rifles.csv', type: 'AR' },
  { file: 'lmgs.csv', type: 'LMG' },
  { file: 'mmrs.csv', type: 'MMR' },
  { file: 'pistols.csv', type: 'Pistol' },
  { file: 'rifles.csv', type: 'Rifle' },
  { file: 'shotguns.csv', type: 'Shotgun' },
  { file: 'smgs.csv', type: 'SMG' },
];
for (const { file, type } of cats) {
  const p = path.join(ROOT, 'data_sources', 'div2hub', file);
  if (!fs.existsSync(p)) continue;
  for (const r of readCsv(p)) {
    if (!r.name) continue;
    div2hub[r.name.trim()] = parseFloat(r.base_damage);
  }
}
console.log(`div2hub: ${Object.keys(div2hub).length} weapons`);

// Load ilantvig
const ilantvigSrc = fs.readFileSync(path.join(ROOT, 'data_sources', 'ilantvig', 'weaponBaseDamage.js'), 'utf8');
const ilantvig = {};
const wMatch = [...ilantvigSrc.matchAll(/\{\s*value:\s*(\d+)\s*,\s*name:\s*"([^"]+)"\s*\}/g)];
for (const m of wMatch) {
  // Strip "Named - Base" prefix to get clean name
  const name = m[2].trim().replace(/^[^-]+ - /, '').trim();
  ilantvig[name] = parseInt(m[1]);
  // Also store raw name (with prefix) in case it matches Teriyaki naming
  ilantvig[m[2].trim()] = parseInt(m[1]);
}
console.log(`ilantvig: ${wMatch.length} weapon entries (${Object.keys(ilantvig).length} unique)`);

// Compare three sources for damage
const triple = [];
for (const t of TERIYAKI.weapons) {
  const tDmg = t.baseDamage;
  const dDmg = div2hub[t.name];
  const iDmg = ilantvig[t.name];
  if (tDmg && dDmg && iDmg) {
    // 3 sources have value
    const set = new Set([Math.round(tDmg), Math.round(dDmg), Math.round(iDmg)]);
    if (set.size === 1) continue; // all agree
    // Calculate spread
    const min = Math.min(tDmg, dDmg, iDmg);
    const max = Math.max(tDmg, dDmg, iDmg);
    const spread = (max - min) / max * 100;
    if (spread > 5) {
      triple.push({ name: t.name, type: t.type, t: tDmg, d: dDmg, i: iDmg, spread });
    }
  }
}

triple.sort((a, b) => b.spread - a.spread);
console.log(`\n3-way conflicts (>5% spread): ${triple.length}`);
console.log('Top 15:');
for (const c of triple.slice(0, 15)) {
  console.log(`  ${c.name} (${c.type}): T=${c.t} D=${c.d} I=${c.i} spread=${c.spread.toFixed(1)}%`);
}

// Build EN -> RU mapping
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const enToRu = {};
for (const arrName of ['N', 'E', 'G']) {
  const re = new RegExp('const\\s+' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)^\\];', 'm');
  const m = re.exec(HTML);
  if (!m) continue;
  const pairs = [...m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
}

// Add to quiz_questions.json
const existing = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
const existingIds = new Set(existing.map((q) => q.id));

let added = 0;
for (const c of triple.slice(0, 15)) {
  const qid = `dmg3_${c.name.toLowerCase().replace(/[^\w]+/g, '_')}`;
  if (existingIds.has(qid)) continue;
  const ruName = enToRu[c.name];
  const displayName = ruName ? `${ruName} / ${c.name}` : c.name;
  // Build options — sort by source name
  const opts = [
    { label: `${Math.round(c.t).toLocaleString()} (Teriyaki v1.7.4 — Apr 2026)`, value: Math.round(c.t), source: 'teriyaki' },
    { label: `${Math.round(c.d).toLocaleString()} (div2hub/data — Apr 2026)`, value: Math.round(c.d), source: 'div2hub' },
    { label: `${Math.round(c.i).toLocaleString()} (ilantvig td2calc-wd)`, value: Math.round(c.i), source: 'ilantvig' },
    { label: '🤷 Не знаю / пропустить', value: 'dunno', source: 'dunno' },
  ];
  // Dedupe options with same value
  const seen = new Set();
  const dedup = opts.filter((o) => {
    if (o.value === 'dunno') return true;
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
  existing.push({
    id: qid,
    category: '🔫 Базовый урон оружия (3 источника)',
    question: `<b>${displayName}</b> (${c.type}) — базовый урон пули на макс gear score?\n\nИсточники расходятся на ${c.spread.toFixed(1)}%.`,
    options: dedup,
    field: `WPNS_BASE.${c.name}.dmg`,
  });
  added++;
}

fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
console.log(`\nAdded ${added} 3-way conflicts. Total questions: ${existing.length}`);
