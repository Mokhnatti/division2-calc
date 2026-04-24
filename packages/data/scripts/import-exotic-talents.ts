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

interface HunterTalent {
  id: string;
  name_en?: string;
  name_ru?: string;
  tooltip_en?: string;
  tooltip_ru?: string;
  tooltip_en_filled?: string;
  tooltip_ru_filled?: string;
}

const exotic = readJson<HunterTalent[]>(join(HUNTER, 'talents_exotic.json'));

const byName = new Map<string, { en: string; ru: string; descEn: string; descRu: string }>();
for (const t of exotic) {
  const nameEn = stripColor(t.name_en || '');
  if (!nameEn) continue;
  byName.set(nameEn.toLowerCase(), {
    en: nameEn,
    ru: stripColor(t.name_ru || ''),
    descEn: stripColor(t.tooltip_en_filled || t.tooltip_en || ''),
    descRu: stripColor(t.tooltip_ru_filled || t.tooltip_ru || ''),
  });
}
console.log(`Hunter exotic talents: ${byName.size}`);

const tEn = readJson<Record<string, string>>(join(LOC, 'en', 'talents.json'));
const tRu = readJson<Record<string, string>>(join(LOC, 'ru', 'talents.json'));
const tdEn = readJson<Record<string, string>>(join(LOC, 'en', 'talent-desc.json'));
const tdRu = readJson<Record<string, string>>(join(LOC, 'ru', 'talent-desc.json'));

let fixedRu = 0, fixedDescEn = 0, fixedDescRu = 0;
for (const [id, enName] of Object.entries(tEn)) {
  const hunter = byName.get(enName.toLowerCase());
  if (!hunter) continue;
  if ((!tRu[id] || tRu[id] === enName) && hunter.ru && hunter.ru !== enName) {
    tRu[id] = hunter.ru;
    fixedRu++;
  }
  if (!tdEn[id] && hunter.descEn) { tdEn[id] = hunter.descEn; fixedDescEn++; }
  if ((!tdRu[id] || tdRu[id] === hunter.descEn) && hunter.descRu) { tdRu[id] = hunter.descRu; fixedDescRu++; }
}

console.log(`Talents RU: ${fixedRu}, Desc EN: ${fixedDescEn}, Desc RU: ${fixedDescRu}`);
writeJson(join(LOC, 'en', 'talents.json'), tEn);
writeJson(join(LOC, 'ru', 'talents.json'), tRu);
writeJson(join(LOC, 'en', 'talent-desc.json'), tdEn);
writeJson(join(LOC, 'ru', 'talent-desc.json'), tdRu);
