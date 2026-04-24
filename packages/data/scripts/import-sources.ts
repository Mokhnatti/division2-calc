import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..', '..');
const HUNTER = 'D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site';
const LOC = join(ROOT, 'apps', 'web', 'public', 'locales');

function readJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}
function writeJson(p: string, d: unknown) {
  writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
}
function stripColor(s: string): string {
  return s.replace(/<color[^>]*>/gi, '').replace(/<\/color>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

interface HunterSource {
  id: string;
  name_en?: string;
  name_ru?: string;
  class?: string;
  sources?: Array<{ type: string; name_en?: string; name_ru?: string; loot_table?: string }>;
}

const sources = readJson<Record<string, HunterSource>>(join(HUNTER, 'sources.json'));

// Weapons only (filter by class or ID prefix)
const weaponSources = Object.values(sources).filter((s) =>
  s.class === 'WeaponItem' || (s.id || '').startsWith('player_weapon_')
);

console.log(`Hunter weapon sources: ${weaponSources.length}`);

const wsEn = readJson<Record<string, string>>(join(LOC, 'en', 'weapon-source.json'));
const wsRu = readJson<Record<string, string>>(join(LOC, 'ru', 'weapon-source.json'));
const weaponsEn = readJson<Record<string, string>>(join(LOC, 'en', 'weapons.json'));

// Build map: name_en (normalized) -> hunter source entry
const byName = new Map<string, HunterSource>();
for (const w of weaponSources) {
  const nm = stripColor(w.name_en || '').toLowerCase();
  if (nm) byName.set(nm, w);
}

let matched = 0;
let missedBefore = 0;
for (const [id, enName] of Object.entries(weaponsEn)) {
  if (wsEn[id]) continue;
  missedBefore++;
  const key = enName.toLowerCase();
  const hunter = byName.get(key);
  if (!hunter || !hunter.sources?.length) continue;

  const primary = hunter.sources[0];
  if (primary.name_en) wsEn[id] = primary.name_en;
  if (primary.name_ru) wsRu[id] = primary.name_ru;
  matched++;
}

console.log(`Missed EN sources: ${missedBefore} → matched ${matched} via hunter pipeline`);

writeJson(join(LOC, 'en', 'weapon-source.json'), wsEn);
writeJson(join(LOC, 'ru', 'weapon-source.json'), wsRu);
console.log('Wrote weapon-source files');
