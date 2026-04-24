import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..', '..');
const PUBLIC = join(ROOT, 'apps', 'web', 'public');
const LOC = join(PUBLIC, 'locales');
const DATA = join(PUBLIC, 'data');

function readJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

const weapons = readJson<{ weapons: Array<{ id: string; category: string; kind: string }> }>(join(DATA, 'weapons.json')).weapons;
const brands = readJson<{ brands: Array<{ id: string }> }>(join(DATA, 'brands.json')).brands;
const sets = readJson<{ sets: Array<{ id: string }> }>(join(DATA, 'gear-sets.json')).sets;
const talents = readJson<{ talents: Array<{ id: string; kind: string }> }>(join(DATA, 'talents.json')).talents;
const namedGear = readJson<{ items: Array<{ id: string }> }>(join(DATA, 'named-gear.json')).items;
const weaponMods = readJson<{ mods: Array<{ id: string; slot: string }> }>(join(DATA, 'weapon-mods.json')).mods;

function loadLoc(lang: 'en' | 'ru', ns: string): Record<string, string> {
  return readJson(join(LOC, lang, `${ns}.json`));
}

const wEn = loadLoc('en', 'weapons');
const wRu = loadLoc('ru', 'weapons');
const bEn = loadLoc('en', 'brands');
const bRu = loadLoc('ru', 'brands');
const sEn = loadLoc('en', 'gear-sets');
const sRu = loadLoc('ru', 'gear-sets');
const tEn = loadLoc('en', 'talents');
const tRu = loadLoc('ru', 'talents');
const tdEn = loadLoc('en', 'talent-desc');
const tdRu = loadLoc('ru', 'talent-desc');
const neEn = loadLoc('en', 'named-gear');
const neRu = loadLoc('ru', 'named-gear');
const nbEn = loadLoc('en', 'named-bonus');
const nbRu = loadLoc('ru', 'named-bonus');
const wsEn = loadLoc('en', 'weapon-source');
const wsRu = loadLoc('ru', 'weapon-source');
const wmEn = loadLoc('en', 'weapon-mods');
const wmRu = loadLoc('ru', 'weapon-mods');

function check(label: string, ids: string[], enMap: Record<string, string>, ruMap: Record<string, string>) {
  const missEn = ids.filter((id) => !enMap[id]);
  const missRu = ids.filter((id) => !ruMap[id]);
  const sameCount = ids.filter((id) => enMap[id] && ruMap[id] && enMap[id] === ruMap[id]).length;
  console.log(`\n=== ${label} (${ids.length}) ===`);
  console.log(`  EN missing: ${missEn.length}${missEn.length ? ` — ${missEn.slice(0, 5).join(', ')}` : ''}`);
  console.log(`  RU missing: ${missRu.length}${missRu.length ? ` — ${missRu.slice(0, 5).join(', ')}` : ''}`);
  console.log(`  EN==RU (not translated): ${sameCount}`);
}

const wIds = weapons.map((w) => w.id);
const bIds = brands.map((b) => b.id);
const sIds = sets.map((s) => s.id);
const tIds = talents.map((t) => t.id);
const wtIds = talents.filter((t) => t.kind === 'weapon').map((t) => t.id);
const nIds = namedGear.map((n) => n.id);
const wmIds = weaponMods.map((m) => m.id);

check('Weapons name', wIds, wEn, wRu);
check('Brands name', bIds, bEn, bRu);
check('Sets name', sIds, sEn, sRu);
check('Talents name', tIds, tEn, tRu);
check('Talent desc (weapon only)', wtIds, tdEn, tdRu);
check('Named gear name', nIds, neEn, neRu);
check('Named bonuses', nIds, nbEn, nbRu);
check('Weapon source', wIds, wsEn, wsRu);
check('Weapon mods name', wmIds, wmEn, wmRu);

console.log('\n=== WEAPON MOD SLOTS ===');
const bySlot = weaponMods.reduce<Record<string, number>>((acc, m) => { acc[m.slot] = (acc[m.slot] || 0) + 1; return acc; }, {});
console.log(bySlot);

console.log('\n=== WEAPON KINDS ===');
const byKind = weapons.reduce<Record<string, number>>((acc, w) => { acc[w.kind] = (acc[w.kind] || 0) + 1; return acc; }, {});
console.log(byKind);
