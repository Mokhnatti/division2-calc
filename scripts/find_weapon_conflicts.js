#!/usr/bin/env node
// Compare weapon stats between Teriyaki DB and div2hub CSVs
// Any significant discrepancy → add as quiz question

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TERIYAKI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'teriyaki_db.json'), 'utf8'));
const QUESTIONS_FILE = path.join(ROOT, 'data_sources', 'quiz_questions.json');

// Build EN -> RU mapping from index.html
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const enToRu = {};
for (const arrName of ['N', 'E', 'G']) {
  const re = new RegExp('const\\s+' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)^\\];', 'm');
  const m = re.exec(HTML);
  if (!m) continue;
  const pairs = [...m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
}

function readCsv(p) {
  const lines = fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const fields = [];
    let cur = '';
    let inQ = false;
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

// Build map of div2hub weapons
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
  const rows = readCsv(path.join(ROOT, 'data_sources', 'div2hub', file));
  for (const r of rows) {
    const name = r.name;
    if (!name) continue;
    div2hub[name] = {
      type,
      dmg: parseFloat(r.base_damage),
      rpm: parseInt(r.base_rpm),
      mag: parseInt(r.base_mag_size),
      reload: parseFloat(r.base_reload_time),
      hsd: parseFloat(r.hsd),
    };
  }
}

// Compare with Teriyaki
const conflicts = [];
for (const t of TERIYAKI.weapons) {
  const name = t.name;
  const d = div2hub[name];
  if (!d) continue;
  const diffs = [];
  if (Math.abs(t.baseDamage - d.dmg) > 1) {
    diffs.push(`damage: ${t.baseDamage} vs ${d.dmg}`);
  }
  if (t.rpm !== d.rpm) {
    diffs.push(`rpm: ${t.rpm} vs ${d.rpm}`);
  }
  if (t.magazineSize !== d.mag) {
    diffs.push(`mag: ${t.magazineSize} vs ${d.mag}`);
  }
  if (Math.abs(t.reloadSpeed - d.reload) > 0.05) {
    diffs.push(`reload: ${t.reloadSpeed} vs ${d.reload}`);
  }
  if (t.headshotDamage !== d.hsd) {
    diffs.push(`hsd: ${t.headshotDamage} vs ${d.hsd}`);
  }
  if (diffs.length) {
    conflicts.push({ name, type: t.type, diffs, t, d });
  }
}

console.log(`Total conflicts: ${conflicts.length}`);

// Group by stat type to summarize
const byStat = { damage: 0, rpm: 0, mag: 0, reload: 0, hsd: 0 };
for (const c of conflicts) {
  for (const d of c.diffs) {
    const k = d.split(':')[0];
    if (byStat[k] !== undefined) byStat[k]++;
  }
}
console.log('By stat:', byStat);

// Show top 10 biggest damage discrepancies
const dmgConflicts = conflicts
  .filter((c) => c.diffs.some((d) => d.startsWith('damage')))
  .map((c) => ({
    name: c.name,
    type: c.type,
    t: c.t.baseDamage,
    d: c.d.dmg,
    diff: Math.abs(c.t.baseDamage - c.d.dmg),
    pct: Math.abs(c.t.baseDamage - c.d.dmg) / c.t.baseDamage * 100,
  }))
  .sort((a, b) => b.pct - a.pct);

console.log('\nTop 10 biggest damage discrepancies:');
for (const c of dmgConflicts.slice(0, 10)) {
  console.log(`  ${c.name} (${c.type}): Teriyaki ${c.t} vs div2hub ${c.d} (${c.pct.toFixed(1)}% diff)`);
}

// Generate quiz questions for top N damage conflicts
const existing = fs.existsSync(QUESTIONS_FILE) ? JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8')) : [];
const existingIds = new Set(existing.map((q) => q.id));

const TOP_N = 20;
for (const c of dmgConflicts.slice(0, TOP_N)) {
  const qid = `dmg_${c.name.toLowerCase().replace(/[^\w]+/g, '_')}`;
  if (existingIds.has(qid)) continue;
  const ruName = enToRu[c.name];
  const displayName = ruName ? `${ruName} / ${c.name}` : c.name;
  existing.push({
    id: qid,
    category: `🔫 Базовый урон оружия`,
    question: `<b>${displayName}</b> (${c.type}) — базовый урон пули на макс gear score?`,
    options: [
      { label: `${Math.round(c.t).toLocaleString()} (Teriyaki v1.7.4)`, value: Math.round(c.t), source: 'teriyaki', detail: 'Div2 Gear Calculator от ImThatTeriyaki, апрель 2026' },
      { label: `${Math.round(c.d).toLocaleString()} (div2hub/data CSV)`, value: Math.round(c.d), source: 'div2hub', detail: 'div2hub/data репозиторий, апрель 2026' },
    ],
    field: `WPNS_BASE.${c.name}.dmg`,
  });
}

fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
console.log(`\nAdded ${Math.min(TOP_N, dmgConflicts.length)} damage conflicts to quiz.`);
console.log('Total questions:', existing.length);
