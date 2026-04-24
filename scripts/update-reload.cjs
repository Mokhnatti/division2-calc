const fs = require('fs');
const path = require('path');

const SRC_DIR = 'D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site';
const WEB_JSON = 'C:/Users/glukm/division2-calc/apps/web/public/data/weapons.json';

const sources = [
  path.join(SRC_DIR, 'weapons_base.json'),
  path.join(SRC_DIR, 'weapons_exotic.json'),
  path.join(SRC_DIR, 'weapons_named.json'),
];

function cleanName(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function slug(s) {
  return cleanName(s).toLowerCase()
    .replace(/['']/g, '_s')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const byId = new Map();
const byNameRu = new Map();

for (const f of sources) {
  if (!fs.existsSync(f)) continue;
  const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const w of arr) {
    const empty = w.stats?.reload_empty_ms;
    if (typeof empty !== 'number') continue;
    const nameEn = cleanName(w.name_en);
    const nameRu = cleanName(w.name_ru);
    const id = slug(nameEn);
    const entry = { id, name_en: nameEn, name_ru: nameRu, empty_ms: empty };
    if (id && !byId.has(id)) byId.set(id, entry);
    const ruKey = slug(nameRu);
    if (ruKey && !byNameRu.has(ruKey)) byNameRu.set(ruKey, entry);
  }
}

console.log(`Indexed: ${byId.size} by id, ${byNameRu.size} by ruName`);

const web = JSON.parse(fs.readFileSync(WEB_JSON, 'utf8'));
let matched = 0, changed = 0;
const unmatched = [];

for (const w of web.weapons) {
  let e = byId.get(w.id) || byNameRu.get(w.id);
  if (e) {
    const newReload = +(e.empty_ms / 1000).toFixed(3);
    if (w.reloadSeconds !== newReload) {
      w.reloadSeconds = newReload;
      changed++;
    }
    matched++;
  } else {
    unmatched.push(w.id);
  }
}

fs.writeFileSync(WEB_JSON, JSON.stringify(web, null, 2));
console.log(`Matched: ${matched} / ${web.weapons.length}, changed: ${changed}`);
if (unmatched.length) {
  console.log(`Unmatched (${unmatched.length}):`);
  console.log(unmatched.join('\n'));
}
