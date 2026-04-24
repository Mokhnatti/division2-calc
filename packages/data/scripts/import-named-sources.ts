import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..', '..');
const HUNTER = 'D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site';
const LOC = join(ROOT, 'apps', 'web', 'public', 'locales');

function readJson<T>(p: string): T { return JSON.parse(readFileSync(p, 'utf8')) as T; }
function writeJson(p: string, d: unknown) { writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8'); }
function strip(s: string): string {
  return s.replace(/<color[^>]*>/gi, '').replace(/<\/color>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

interface HunterSource {
  id: string;
  name_en?: string;
  name_ru?: string;
  class?: string;
  sources?: Array<{ type: string; name_en?: string; name_ru?: string }>;
}

const sources = readJson<Record<string, HunterSource>>(join(HUNTER, 'sources.json'));

// Armor items only
const armorSources = Object.values(sources).filter((s) =>
  s.class === 'ArmorItem' && s.sources && s.sources.length > 0
);
console.log(`Hunter armor sources: ${armorSources.length}`);

// Build map: clean name_en lowercase -> primary source
const byName = new Map<string, { en: string; ru: string }>();
for (const a of armorSources) {
  const nm = strip(a.name_en || '').toLowerCase();
  if (!nm || !a.sources?.length) continue;
  // Prefer named/raid over generic
  const sorted = [...a.sources].sort((x, y) => {
    const priority = (s: typeof x) => {
      if (s.type === 'raid') return 0;
      if (s.type === 'manhunt') return 1;
      if (s.type === 'season_reward') return 2;
      if (s.type === 'battlepass') return 3;
      if (s.type === 'chest') return 4;
      if (s.type === 'darkzone') return 5;
      return 9;
    };
    return priority(x) - priority(y);
  });
  const primary = sorted[0];
  byName.set(nm, {
    en: strip(primary.name_en || ''),
    ru: strip(primary.name_ru || ''),
  });
}

const neEn = readJson<Record<string, string>>(join(LOC, 'en', 'named-gear.json'));
const neRu = readJson<Record<string, string>>(join(LOC, 'ru', 'named-gear.json'));

const nsEn: Record<string, string> = {};
const nsRu: Record<string, string> = {};

let matched = 0;
for (const [id, enName] of Object.entries(neEn)) {
  const clean = enName.toLowerCase();
  const hunter = byName.get(clean);
  if (hunter) {
    if (hunter.en) nsEn[id] = hunter.en;
    if (hunter.ru) nsRu[id] = hunter.ru;
    matched++;
  }
}

console.log(`Named gear with source: ${matched}/${Object.keys(neEn).length}`);
writeJson(join(LOC, 'en', 'named-source.json'), nsEn);
writeJson(join(LOC, 'ru', 'named-source.json'), nsRu);
console.log('Saved named-source.json');
