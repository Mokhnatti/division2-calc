#!/usr/bin/env node
// Find conflicts in RPM, magazine size, reload speed across sources
// Adds to quiz_questions.json

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QF = path.join(ROOT, 'data_sources', 'quiz_questions.json');
const TERIYAKI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_sources', 'teriyaki_db.json'), 'utf8'));

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
const cats = ['assault_rifles', 'lmgs', 'mmrs', 'pistols', 'rifles', 'shotguns', 'smgs'];
for (const c of cats) {
  const rows = readCsv(path.join(ROOT, 'data_sources', 'div2hub', c + '.csv'));
  for (const r of rows) {
    if (!r.name) continue;
    div2hub[r.name.trim()] = {
      rpm: parseInt(r.base_rpm),
      mag: parseInt(r.base_mag_size),
      reload: parseFloat(r.base_reload_time),
    };
  }
}

const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const enToRu = {};
for (const arrName of ['N', 'E', 'G']) {
  const re = new RegExp('const\\s+' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)^\\];', 'm');
  const m = re.exec(HTML);
  if (!m) continue;
  const pairs = [...m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
  for (const p of pairs) enToRu[p[2]] = p[1];
}

const existing = JSON.parse(fs.readFileSync(QF, 'utf8'));
const existingIds = new Set(existing.map(q => q.id));

const conflicts = { rpm: [], mag: [], reload: [] };

for (const t of TERIYAKI.weapons) {
  const d = div2hub[t.name];
  if (!d) continue;

  if (t.rpm !== d.rpm && Math.abs(t.rpm - d.rpm) > 10) {
    conflicts.rpm.push({ name: t.name, type: t.type, t: t.rpm, d: d.rpm });
  }
  if (t.magazineSize !== d.mag && Math.abs(t.magazineSize - d.mag) > 1) {
    conflicts.mag.push({ name: t.name, type: t.type, t: t.magazineSize, d: d.mag });
  }
  if (Math.abs(t.reloadSpeed - d.reload) > 0.15) {
    conflicts.reload.push({ name: t.name, type: t.type, t: t.reloadSpeed, d: d.reload });
  }
}

console.log('RPM conflicts:', conflicts.rpm.length);
console.log('Mag conflicts:', conflicts.mag.length);
console.log('Reload conflicts:', conflicts.reload.length);

let added = 0;
const TOP = 5; // 5 each = 15 questions

function addQ(c, stat, statRu, statEn) {
  const qid = `${stat}_${c.name.toLowerCase().replace(/[^\w]+/g, '_')}`;
  if (existingIds.has(qid)) return;
  const ruName = enToRu[c.name];
  const display = ruName ? `${ruName} / ${c.name}` : c.name;
  const opts = [
    { label: `${c.t} (Teriyaki)`, value: c.t, source: 'teriyaki' },
    { label: `${c.d} (div2hub)`, value: c.d, source: 'div2hub' },
    { label: '🤷 Не знаю', value: 'dunno', source: 'dunno' },
  ];
  existing.push({
    id: qid,
    category: `🔫 ${statRu}`,
    question: `<b>${display}</b> (${c.type}) — ${statRu} (${statEn})?`,
    options: opts,
    field: `WPNS_BASE.${c.name}.${stat}`,
  });
  added++;
}

for (const c of conflicts.rpm.slice(0, TOP)) addQ(c, 'rpm', 'Скорострельность', 'Rate of Fire');
for (const c of conflicts.mag.slice(0, TOP)) addQ(c, 'mag', 'Размер магазина', 'Magazine Size');
for (const c of conflicts.reload.slice(0, TOP)) addQ(c, 'reload', 'Время перезарядки (сек)', 'Reload Time');

fs.writeFileSync(QF, JSON.stringify(existing, null, 2), 'utf8');
console.log(`Added ${added} new conflicts. Total questions: ${existing.length}`);
