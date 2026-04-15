#!/usr/bin/env node
// Find data conflicts between sources and generate quiz_questions.json
// Sources compared:
// - Our current index.html (WPNS_BASE, EXOTIC_WPNS, PROTOTYPE_AUGMENTS, SHD defaults)
// - Teriyaki DB (data_sources/teriyaki_db.json)
// - div2hub CSVs (data_sources/div2hub/)
// - BDDFr JSONC (data_sources/bddfr/)
// - Hand-curated known Y8S1 datamine values

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QUESTIONS_FILE = path.join(ROOT, 'data_sources', 'quiz_questions.json');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function loadJson(p, def) {
  if (!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return def; }
}

function readCsv(p) {
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    // Basic CSV parser (handles quoted fields)
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

// ===== Translation helper: EN talent name -> RU =====
// Build mapping from index.html N[] and E[] arrays + manual overrides
function buildRuMap() {
  const map = {};
  const extract = (arrName) => {
    const re = new RegExp('const\\s+' + arrName + '\\s*=\\s*\\[([\\s\\S]*?)^\\];', 'm');
    const m = re.exec(HTML);
    if (!m) return;
    const pairs = [...m[1].matchAll(/\{name:"([^"]+)",en:"([^"]+)"/g)];
    for (const p of pairs) map[p[2]] = p[1];
  };
  extract('N');
  extract('E');
  extract('G');
  return map;
}

const RU_MAP = buildRuMap();

// ===== Conflict detection rules =====
const conflicts = [];
let nextId = 0;
function addConflict(q) {
  q.id = q.id || `auto_${nextId++}`;
  conflicts.push(q);
}

// 1. Hand-curated high-priority conflicts (known from research)
const HAND_CURATED = [
  {
    id: 'trapper_max',
    category: '🧪 Prototype Augment',
    question: 'Аугмент <b>Trapper / Ловец</b> — увеличивает длительность статус-эффектов.\n\nКакое макс значение на 10-м уровне прокачки?',
    options: [
      { label: '14% макс (5% → 14% шагом 1%)', value: 14, source: 'reddit_bddfr', detail: 'Reddit TU28 datamine + BDDFr talents-prototypes.jsonc' },
      { label: '22% макс (4% → 22% шагом 1.8%)', value: 22, source: 'div2hub', detail: 'div2hub/data augments.csv (апрель 2026)' },
    ],
    field: 'PROTOTYPE_AUGMENTS.trapper.max',
  },
  {
    id: 'shd_chd_max',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Crit Damage / Урон крита</b> атрибут.\n\nМакс % при 50/50 очков?',
    options: [
      { label: '20% макс (шаг 0.4%, 50 × 0.4)', value: 20, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.4' },
      { label: '30% макс', value: 30, source: 'hand', detail: 'Моё старое значение из памяти' },
      { label: '25% макс', value: 25, source: 'other', detail: 'Альтернатива' },
    ],
    field: 'shd-chd',
  },
  {
    id: 'shd_hsd_max',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Headshot Damage / Урон в голову</b> атрибут.\n\nМакс % при 50/50 очков?',
    options: [
      { label: '20% макс (шаг 0.4%)', value: 20, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.4' },
      { label: '10% макс (шаг 0.2%)', value: 10, source: 'hand', detail: 'Моё старое значение' },
    ],
    field: 'shd-hsd',
  },
  {
    id: 'shd_wd_max',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Weapon Damage / Урон оружием</b> атрибут.\n\nМакс % при 50/50 очков?',
    options: [
      { label: '10% макс (шаг 0.2%)', value: 10, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.2' },
      { label: '15% макс', value: 15, source: 'other' },
    ],
    field: 'shd-wd',
  },
  {
    id: 'shd_chc_max',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Crit Chance / Шанс крита</b>.\n\nМакс % при 50/50 очков?',
    options: [
      { label: '10% макс (шаг 0.2%)', value: 10, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.2' },
      { label: '15% макс', value: 15, source: 'other' },
    ],
    field: 'shd-chc',
  },
  {
    id: 'escalation_t10_hp',
    category: '⚔ Escalation Tier 10',
    question: 'Новый режим <b>Escalation</b> в Y8S1 — максимальный Tier 10.\n\nНа сколько увеличено HP врагов?',
    options: [
      { label: '+700% (800% от базы)', value: 700, source: 'reddit', detail: 'Reddit TU28 datamine' },
      { label: '+800% (900% от базы)', value: 800, source: 'reddit2' },
      { label: '+600% (700% от базы)', value: 600, source: 'hand' },
    ],
    field: 'ESCALATION_TIERS.10.hp',
  },
  {
    id: 'weapon_dmg_cap',
    category: '📊 DPS Математика',
    question: 'Какой soft cap на <b>Weapon Damage bucket</b>?\n\n(Сумма всех WD-бонусов: бренды + атрибуты + SHD + таланты)',
    options: [
      { label: '+800% cap (без HSD > 150%)', value: 800, source: 'reddit', detail: 'Community consensus' },
      { label: '+1250% cap (с HSD > 150%)', value: 1250, source: 'reddit2', detail: 'С Perfect Headhunter' },
      { label: 'Нет soft cap', value: 0, source: 'none' },
    ],
    field: 'note_only',
  },
  {
    id: 'chc_soft_cap',
    category: '📊 DPS Математика',
    question: 'Soft cap на <b>Critical Hit Chance (CHC)</b>?\n\nПосле какого значения CHC перестаёт работать?',
    options: [
      { label: '60% cap (классика)', value: 60, source: 'classic', detail: 'Стандартное значение с Y1' },
      { label: '75% cap (Y8S1)', value: 75, source: 'y8s1', detail: 'Слух про повышение в Y8S1' },
      { label: 'Нет cap', value: 0, source: 'none' },
    ],
    field: 'note_only',
  },
  {
    id: 'base_crit_dmg',
    category: '📊 DPS Математика',
    question: 'Базовый множитель <b>крит-урона</b> (без бонусов)?',
    options: [
      { label: '+25% (1.25x)', value: 25, source: 'classic', detail: 'Стандартное значение' },
      { label: '+50% (1.5x)', value: 50, source: 'other' },
      { label: '+100% (2x)', value: 100, source: 'other' },
    ],
    field: 'note_only',
  },
];

for (const q of HAND_CURATED) addConflict(q);

// 2. Auto augment comparison — disabled (values match between sources within rounding)

// 3. Auto: Compare div2hub weapons vs our WPNS_BASE for base damage discrepancies
// Skipping — 181 weapons × N checks would explode question count. Add on demand.

// ===== Save questions =====
const outPath = QUESTIONS_FILE;
fs.writeFileSync(outPath, JSON.stringify(conflicts, null, 2), 'utf8');
console.log(`Generated ${conflicts.length} quiz questions`);
console.log('Saved:', outPath);

// Print summary
for (const q of conflicts) {
  console.log(` ${q.id}: ${q.options.length} options`);
}
