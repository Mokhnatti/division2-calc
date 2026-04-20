#!/usr/bin/env python3
"""Filter sources.json — keep only items that appear in our site data.
Output: data/sources_compact.json (by lowercased name_en key).
"""
import json, re
from pathlib import Path

SITE = Path('C:/Users/glukm/division2-calc/data')
HUNTER = Path('D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site')


def clean(s):
    if not s: return ''
    return re.sub(r'<color[^>]*>|</color>', '', s).replace('"', '').strip()


sources = json.loads((HUNTER / 'sources.json').read_text(encoding='utf-8'))
print(f'Total items in sources: {len(sources)}')

# Collect all name_en values we care about
wanted_en = set()

# Exotic weapons (dict by RU name)
for it in json.loads((SITE / 'exotic_weapons.json').read_text(encoding='utf-8')).values():
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())

# Exotic gear (list)
for it in json.loads((SITE / 'exotics.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())

# Named weapons
for it in json.loads((SITE / 'named.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())

# Named gear
for it in json.loads((SITE / 'named_gear.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())

# Gear sets + brands
for it in json.loads((SITE / 'gear_sets.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())

for it in json.loads((SITE / 'brands.json').read_text(encoding='utf-8')):
    en = clean(it.get('name_full_en'))
    if en: wanted_en.add(en.lower())

print(f'Site items to match: {len(wanted_en)}')

# Build compact sources by en_name (lowercase)
compact = {}
for item_id, meta in sources.items():
    name_en = clean(meta.get('name_en'))
    if not name_en: continue
    key = name_en.lower()
    if key not in wanted_en: continue
    srcs = meta.get('sources') or []
    if not srcs: continue
    # Dedupe sources by (type + name_en)
    seen = set()
    dedup = []
    for s in srcs:
        t = s.get('type') or 'other'
        n = clean(s.get('name_en') or '')
        key2 = (t, n.lower())
        if key2 in seen: continue
        seen.add(key2)
        dedup.append({
            'type': t,
            'name_en': n,
            'name_ru': clean(s.get('name_ru') or n),
            'mission_id': s.get('mission_id', ''),
        })
    if dedup:
        # Store under lowercase en name
        if key not in compact:
            compact[key] = {
                'name_en': name_en,
                'name_ru': clean(meta.get('name_ru') or ''),
                'sources': dedup,
            }
        else:
            # Merge sources from multiple variants of same name
            for s in dedup:
                k2 = (s['type'], s['name_en'].lower())
                if not any((x['type'], x['name_en'].lower()) == k2 for x in compact[key]['sources']):
                    compact[key]['sources'].append(s)

print(f'Compact entries: {len(compact)}')
print(f'Items without sources: {len(wanted_en) - len(compact)}')

# Show sample
for k in list(compact.keys())[:3]:
    print(f'\n{k}:')
    print(json.dumps(compact[k], ensure_ascii=False, indent=2))

# Save
out_path = SITE / 'sources_compact.json'
out_path.write_text(json.dumps(compact, ensure_ascii=False, indent=2), encoding='utf-8')
size = out_path.stat().st_size / 1024
print(f'\nSaved {out_path} ({size:.1f} KB)')
