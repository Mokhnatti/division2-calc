#!/usr/bin/env python3
"""Remove duplicate talents — keep the first (pre-Hunter) occurrence."""
import json
from pathlib import Path
SITE = Path('C:/Users/glukm/division2-calc/data')


def load(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def save(p, d): Path(p).write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')


# gear_talents: list — dedupe by name_en (case-insensitive)
gt = load(SITE / 'gear_talents.json')
seen = set()
out = []
removed = 0
for t in gt:
    en = (t.get('name_en') or '').lower().strip()
    if en and en in seen:
        removed += 1
        continue
    seen.add(en)
    out.append(t)
save(SITE / 'gear_talents.json', out)
print(f'gear_talents: removed {removed} duplicates, kept {len(out)}')


# weapon_talents_full: dict — need to keep unique name_en
wt = load(SITE / 'weapon_talents_full.json')
seen = set()
removed = 0
keys_to_remove = []
for k, t in wt.items():
    en = (t.get('name_en') or '').lower().strip()
    if en and en in seen:
        keys_to_remove.append(k)
        removed += 1
        continue
    seen.add(en)
for k in keys_to_remove:
    del wt[k]
save(SITE / 'weapon_talents_full.json', wt)
print(f'weapon_talents_full: removed {removed} duplicates, kept {len(wt)}')
