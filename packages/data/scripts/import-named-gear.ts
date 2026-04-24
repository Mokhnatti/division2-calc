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
  return s
    .replace(/<color[^>]*>/gi, '')
    .replace(/<\/color>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

interface HunterGear {
  id: string;
  name_en?: string;
  name_ru?: string;
  tooltip_en?: string;
  tooltip_ru?: string;
}

const hunterNamed = readJson<HunterGear[]>(join(HUNTER, 'gear_named.json'));

// Build map: slugify(cleaned name_en) -> {en, ru, tooltip_en, tooltip_ru}
const byNameEn = new Map<string, { name_en: string; name_ru: string; tooltip_en: string; tooltip_ru: string }>();
for (const g of hunterNamed) {
  const nameEn = stripColor(g.name_en || '');
  if (!nameEn) continue;
  byNameEn.set(nameEn.toLowerCase(), {
    name_en: nameEn,
    name_ru: stripColor(g.name_ru || ''),
    tooltip_en: stripColor(g.tooltip_en || ''),
    tooltip_ru: stripColor(g.tooltip_ru || ''),
  });
}
console.log(`Hunter named gear: ${byNameEn.size}`);

const ngEn = readJson<Record<string, string>>(join(LOC, 'en', 'named-gear.json'));
const ngRu = readJson<Record<string, string>>(join(LOC, 'ru', 'named-gear.json'));

let nameFixed = 0;
for (const [id, enName] of Object.entries(ngEn)) {
  const clean = enName.toLowerCase();
  const hunter = byNameEn.get(clean);
  if (!hunter) continue;
  // Check if existing RU is really Russian (or fallback). If not, overwrite with proper RU.
  const currentRu = ngRu[id] || '';
  if (currentRu === enName && hunter.name_ru && hunter.name_ru !== hunter.name_en) {
    ngRu[id] = hunter.name_ru;
    nameFixed++;
  }
}
console.log(`Named gear name_ru fixed: ${nameFixed}`);

writeJson(join(LOC, 'en', 'named-gear.json'), ngEn);
writeJson(join(LOC, 'ru', 'named-gear.json'), ngRu);
console.log('Done');
