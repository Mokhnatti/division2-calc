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

interface HunterTalent {
  id: string;
  name_en?: string;
  name_ru?: string;
  tooltip_en?: string;
  tooltip_ru?: string;
}

const hunterGearTalents = readJson<HunterTalent[]>(join(HUNTER, 'talents_gear.json'));

const byName = new Map<string, { en: string; ru: string; descEn: string; descRu: string }>();
for (const t of hunterGearTalents) {
  const nameEn = stripColor(t.name_en || '');
  if (!nameEn) continue;
  byName.set(nameEn.toLowerCase(), {
    en: nameEn,
    ru: stripColor(t.name_ru || ''),
    descEn: stripColor(t.tooltip_en || ''),
    descRu: stripColor(t.tooltip_ru || ''),
  });
  // Also map stripped Perfect
  const stripPerfect = nameEn.replace(/^Perfect\s+/i, '').trim();
  if (stripPerfect !== nameEn && !byName.has(stripPerfect.toLowerCase())) {
    byName.set(stripPerfect.toLowerCase(), {
      en: nameEn,
      ru: stripColor(t.name_ru || ''),
      descEn: stripColor(t.tooltip_en || ''),
      descRu: stripColor(t.tooltip_ru || ''),
    });
  }
}
console.log(`Hunter gear talents: ${byName.size}`);

const tEn = readJson<Record<string, string>>(join(LOC, 'en', 'talents.json'));
const tRu = readJson<Record<string, string>>(join(LOC, 'ru', 'talents.json'));
const tdEn = readJson<Record<string, string>>(join(LOC, 'en', 'talent-desc.json'));
const tdRu = readJson<Record<string, string>>(join(LOC, 'ru', 'talent-desc.json'));

let updatedEn = 0;
let updatedRu = 0;
let updatedDescEn = 0;
let updatedDescRu = 0;

for (const [id, enName] of Object.entries(tEn)) {
  const hunter = byName.get(enName.toLowerCase()) ?? byName.get(enName.replace(/^Perfect\s+/i, '').toLowerCase());
  if (!hunter) continue;

  // Update RU name if missing or same as EN
  if (!tRu[id] || tRu[id] === enName) {
    if (hunter.ru && hunter.ru !== enName) {
      tRu[id] = hunter.ru;
      updatedRu++;
    }
  }

  // Update tooltips
  if (!tdEn[id] && hunter.descEn) {
    tdEn[id] = hunter.descEn;
    updatedDescEn++;
  }
  if ((!tdRu[id] || tdRu[id] === hunter.descEn) && hunter.descRu) {
    tdRu[id] = hunter.descRu;
    updatedDescRu++;
  }
}

console.log(`talents.json RU updated: ${updatedRu}`);
console.log(`talent-desc.json EN updated: ${updatedDescEn}`);
console.log(`talent-desc.json RU updated: ${updatedDescRu}`);

writeJson(join(LOC, 'en', 'talents.json'), tEn);
writeJson(join(LOC, 'ru', 'talents.json'), tRu);
writeJson(join(LOC, 'en', 'talent-desc.json'), tdEn);
writeJson(join(LOC, 'ru', 'talent-desc.json'), tdRu);
console.log('Done');
