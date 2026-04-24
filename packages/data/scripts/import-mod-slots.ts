import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..', '..');
const HUNTER = 'D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site';
const PUBLIC = join(ROOT, 'apps', 'web', 'public', 'data');

function readJson<T>(p: string): T { return JSON.parse(readFileSync(p, 'utf8')) as T; }
function writeJson(p: string, d: unknown) { writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8'); }

interface HunterSlots {
  id: string;
  name_en?: string;
  name_ru?: string;
  weapon_class?: string;
  slots_available?: string[];
  slot_count?: number;
  is_exotic?: boolean;
}

const hunter = readJson<Record<string, HunterSlots>>(join(HUNTER, 'weapon_mod_slots.json'));
const ours = readJson<{ weapons: Array<{ id: string; category: string; modSlots?: string[] }> }>(join(PUBLIC, 'weapons.json'));

// Build map: weapon name lowercase -> slots
const byName = new Map<string, string[]>();
for (const v of Object.values(hunter)) {
  const name = (v.name_en || '').toLowerCase().trim();
  if (!name) continue;
  if (!v.slots_available || v.slots_available.length === 0) continue;
  if (!byName.has(name)) byName.set(name, v.slots_available);
}
console.log(`Hunter weapons with slots: ${byName.size}`);

// Load our EN weapon names
const wEn = readJson<Record<string, string>>(join(ROOT, 'apps', 'web', 'public', 'locales', 'en', 'weapons.json'));

let updated = 0;
for (const w of ours.weapons) {
  const enName = (wEn[w.id] || '').toLowerCase().trim();
  const hunterSlots = byName.get(enName);
  if (hunterSlots && hunterSlots.length > 0) {
    w.modSlots = hunterSlots;
    updated++;
  }
}

writeJson(join(PUBLIC, 'weapons.json'), ours);
console.log(`Weapons updated with real mod slots: ${updated}/${ours.weapons.length}`);
