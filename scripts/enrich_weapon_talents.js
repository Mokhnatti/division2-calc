// One-shot: merge applicable_weapon_classes from weapon_talents_full.json
// into weapon_talents.json by fuzzy-matching name.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const oldPath = path.join(ROOT, 'data/weapon_talents.json');
const fullPath = path.join(ROOT, 'data/weapon_talents_full.json');
const outPath = oldPath;

const old = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
const fullArr = Array.isArray(full) ? full : Object.values(full);

function norm(s) {
  return (s || '').toLowerCase().replace(/\bperfect(ly)?\s+/g, '').replace(/[^a-z0-9]+/g, '').trim();
}

const fullByName = {};
for (const f of fullArr) {
  if (!f.name_en) continue;
  const key = norm(f.name_en);
  if (!fullByName[key]) fullByName[key] = f;
}

let matched = 0;
for (const [k, v] of Object.entries(old)) {
  if (!v.name) continue;
  // v.name is like "Optimist (Оптимист)"
  const enOnly = v.name.split('(')[0].trim();
  const key = norm(enOnly);
  const f = fullByName[key];
  if (f && f.applicable_weapon_classes && f.applicable_weapon_classes.length) {
    const cls = f.applicable_weapon_classes.filter(c => c !== 'universal');
    if (cls.length) {
      v.classes = cls;
      matched++;
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(old, null, 2) + '\n');
console.log(`✓ Enriched ${matched} weapon talents with class restrictions`);
