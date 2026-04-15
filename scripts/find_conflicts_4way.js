#!/usr/bin/env node
// 4-way comparison: Teriyaki vs div2hub vs ilantvig vs MikeRee
// Find weapons where all 4 sources differ — adds to quiz

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QF = path.join(ROOT, 'data_sources', 'quiz_questions.json');
const TERIYAKI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'teriyaki_db.json'), 'utf8'));
const MIKEREE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'mikeree', 'weapons.json'), 'utf8'));

function readCsv(p) {
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, 'utf8').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
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
for (const c of ['assault_rifles', 'lmgs', 'mmrs', 'pistols', 'rifles', 'shotguns', 'smgs']) {
  for (const r of readCsv(path.join(ROOT, 'data_sources', 'div2hub', c + '.csv'))) {
    if (r.name) div2hub[r.name.trim()] = parseFloat(r.base_damage);
  }
}

const ilantvig = {};
const ilantSrc = fs.readFileSync(path.join(ROOT, 'data_sources', 'ilantvig', 'weaponBaseDamage.js'), 'utf8');
for (const m of ilantSrc.matchAll(/\{\s*value:\s*(\d+)\s*,\s*name:\s*"([^"]+)"\s*\}/g)) {
  const cleanName = m[2].trim().replace(/^[^-]+ - /, '').trim();
  ilantvig[cleanName] = parseInt(m[1]);
  ilantvig[m[2].trim()] = parseInt(m[1]);
}

const mikeree = {};
for (const w of MIKEREE) {
  if (w.name) mikeree[w.name.trim()] = w.damage;
}

console.log(`Sources: Teriyaki ${TERIYAKI.weapons.length}, div2hub ${Object.keys(div2hub).length}, ilantvig ${Object.keys(ilantvig).length}, MikeRee ${Object.keys(mikeree).length}`);

// Compare all 4 for each Teriyaki weapon
const conflicts = [];
for (const t of TERIYAKI.weapons) {
  const tDmg = t.baseDamage;
  const dDmg = div2hub[t.name];
  const iDmg = ilantvig[t.name];
  const mDmg = mikeree[t.name];
  const sources = [];
  if (tDmg) sources.push({ src: 'teriyaki', val: Math.round(tDmg) });
  if (dDmg) sources.push({ src: 'div2hub', val: Math.round(dDmg) });
  if (iDmg) sources.push({ src: 'ilantvig', val: Math.round(iDmg) });
  if (mDmg) sources.push({ src: 'mikeree', val: Math.round(mDmg) });
  if (sources.length < 3) continue;
  const uniqVals = [...new Set(sources.map(s => s.val))];
  if (uniqVals.length === 1) continue; // all agree
  const min = Math.min(...uniqVals);
  const max = Math.max(...uniqVals);
  const spread = (max - min) / max * 100;
  if (spread < 8) continue;
  conflicts.push({ name: t.name, type: t.type, sources, spread });
}

conflicts.sort((a, b) => b.spread - a.spread);
console.log(`\n4-way conflicts (>8% spread): ${conflicts.length}`);
console.log('Top 10:');
for (const c of conflicts.slice(0, 10)) {
  const sourceStr = c.sources.map(s => `${s.src[0].toUpperCase()}=${s.val}`).join(' ');
  console.log(`  ${c.name} (${c.type}): ${sourceStr} spread=${c.spread.toFixed(1)}%`);
}

// Build EN -> RU mapping
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const enToRu = {};
for (const arrName of ['N', 'E', 'G']) {
  const re = new RegExp('const\\s+' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)^\\];', 'm');
  const m = re.exec(HTML);
  if (!m) continue;
  for (const p of m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)) enToRu[p[2]] = p[1];
}

// Add to quiz_questions.json
const existing = JSON.parse(fs.readFileSync(QF, 'utf8'));
const existingIds = new Set(existing.map(q => q.id));

const sourceLabels = {
  teriyaki: 'Teriyaki v1.7.4 (Apr 2026)',
  div2hub: 'div2hub/data CSV (Apr 2026)',
  ilantvig: 'ilantvig (старая мета)',
  mikeree: 'MikeRee meta_workbench (Apr 2026)',
};

let added = 0;
for (const c of conflicts.slice(0, 15)) {
  const qid = `dmg4_${c.name.toLowerCase().replace(/[^\w]+/g, '_')}`;
  if (existingIds.has(qid)) continue;
  const ruName = enToRu[c.name];
  const display = ruName ? `${ruName} / ${c.name}` : c.name;
  const seenVals = new Set();
  const opts = c.sources
    .filter(s => {
      if (seenVals.has(s.val)) return false;
      seenVals.add(s.val);
      return true;
    })
    .map(s => ({
      label: `${s.val.toLocaleString()} (${sourceLabels[s.src]})`,
      value: s.val,
      source: s.src,
    }));
  opts.push({ label: '🤷 Не знаю', value: 'dunno', source: 'dunno' });
  existing.push({
    id: qid,
    category: '🔫 Урон оружия (4 источника)',
    question: `<b>${display}</b> (${c.type}) — базовый урон пули?\n\nИсточники расходятся на ${c.spread.toFixed(1)}%.`,
    options: opts,
    field: `WPNS_BASE.${c.name}.dmg`,
  });
  added++;
}

fs.writeFileSync(QF, JSON.stringify(existing, null, 2), 'utf8');
console.log(`\nAdded ${added} 4-way conflicts. Total questions: ${existing.length}`);
