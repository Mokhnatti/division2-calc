import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..', '..');
const PUBLIC = join(ROOT, 'apps', 'web', 'public', 'data');

function readJson<T>(p: string): T { return JSON.parse(readFileSync(p, 'utf8')) as T; }
function writeJson(p: string, d: unknown) { writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8'); }

interface Mod {
  id: string;
  slot: string;
  stat?: string;
  value?: number;
  rawStat?: string;
  weaponClasses?: string[];
}

const data = readJson<{ mods: Mod[] }>(join(PUBLIC, 'weapon-mods.json'));

const CLASS_PATTERNS: Array<{ classes: string[]; re: RegExp }> = [
  // Magazines — specific by naming
  { classes: ['mmr'], re: /marksman_mag|sniper|marksman/i },
  { classes: ['lmg'], re: /gunner_mag|link_belt|non_disruptive_link|pouch|calibrated_link/i },
  { classes: ['pistol'], re: /pistol_|compact_mag|short_mag/i },
  { classes: ['shotgun'], re: /shotgun|buckshot|slug/i },
  { classes: ['rifle'], re: /rifle_mag|tubular_spring/i },
  { classes: ['ar', 'smg'], re: /extended_mag|large_mag|magpul/i },
];

let updated = 0;
for (const m of data.mods) {
  if (m.slot !== 'magazine') continue;
  for (const p of CLASS_PATTERNS) {
    if (p.re.test(m.id)) {
      m.weaponClasses = p.classes;
      updated++;
      break;
    }
  }
}

console.log(`Magazine mods with weapon class: ${updated}/${data.mods.filter((m) => m.slot === 'magazine').length}`);
writeJson(join(PUBLIC, 'weapon-mods.json'), data);
