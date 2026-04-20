#!/usr/bin/env python3
"""Filter sources.json v3 — match by item id via Hunter enriched files.

Strategy:
1. Build id → name_en lookup from Hunter weapons/gear files
2. For each source, resolve id → name_en
3. Keep only items whose name_en matches our site data
"""
import json, re
from pathlib import Path

SITE = Path('C:/Users/glukm/division2-calc/data')
HUNTER = Path('D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site')


def clean(s):
    if not s: return ''
    return re.sub(r'<color[^>]*>|</color>', '', s).replace('"', '').strip()


# Step 1: id → name_en from ALL Hunter enriched files
id_to_name = {}
hunter_files = [
    'weapons_exotic.json', 'weapons_named.json', 'weapons_base.json', 'weapons.json',
    'gear_exotic.json', 'gear_named.json', 'gear.json',
]
for fname in hunter_files:
    p = HUNTER / fname
    if not p.exists(): continue
    items = json.loads(p.read_text(encoding='utf-8'))
    arr = items.values() if isinstance(items, dict) else items
    for it in arr:
        iid = it.get('id')
        en = clean(it.get('name_en'))
        ru = clean(it.get('name_ru'))
        if iid and en:
            id_to_name[iid] = (en, ru)

print(f'id → name_en mapping built: {len(id_to_name)}')


# Step 2: site's wanted en names
wanted_en = set()
for it in json.loads((SITE / 'exotic_weapons.json').read_text(encoding='utf-8')).values():
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())
for it in json.loads((SITE / 'exotics.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())
for it in json.loads((SITE / 'named.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())
for it in json.loads((SITE / 'named_gear.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())
for it in json.loads((SITE / 'gear_sets.json').read_text(encoding='utf-8')):
    en = clean(it.get('en'))
    if en: wanted_en.add(en.lower())
for it in json.loads((SITE / 'brands.json').read_text(encoding='utf-8')):
    en = clean(it.get('name_full_en'))
    if en: wanted_en.add(en.lower())
print(f'Site wanted: {len(wanted_en)}')


# Step 3: process sources
sources = json.loads((HUNTER / 'sources.json').read_text(encoding='utf-8'))
print(f'Sources v3 entries: {len(sources)}')

compact = {}
for item_id, meta in sources.items():
    # Try name_en from meta first, fallback to id lookup
    name_en = clean(meta.get('name_en'))
    name_ru = clean(meta.get('name_ru'))
    if not name_en and item_id in id_to_name:
        name_en, name_ru_fb = id_to_name[item_id]
        if not name_ru: name_ru = name_ru_fb
    if not name_en:
        continue
    key = name_en.lower()
    if key not in wanted_en:
        continue
    srcs = meta.get('sources') or []
    if not srcs: continue
    # Dedupe + preserve match (direct/tag)
    seen = set()
    dedup = []
    for s in srcs:
        t = s.get('type') or 'other'
        n = clean(s.get('name_en') or '')
        nr = clean(s.get('name_ru') or n)
        m = s.get('match', 'tag')
        k2 = (t, n.lower(), m)
        if k2 in seen: continue
        seen.add(k2)
        dedup.append({
            'type': t,
            'name_en': n,
            'name_ru': nr,
            'mission_id': s.get('mission_id', ''),
            'match': m,
        })
    # Sort: direct matches first
    dedup.sort(key=lambda x: (0 if x['match'] == 'direct' else 1, x['type']))
    if dedup:
        if key in compact:
            for d in dedup:
                k2 = (d['type'], d['name_en'].lower())
                if not any((x['type'], x['name_en'].lower()) == k2 for x in compact[key]['sources']):
                    compact[key]['sources'].append(d)
        else:
            compact[key] = {'name_en': name_en, 'name_ru': name_ru, 'sources': dedup}

print(f'Compact entries (matched to site): {len(compact)}')

# Show sample types and random items
types_seen = set()
for v in compact.values():
    for s in v['sources']:
        types_seen.add(s['type'])
print(f'Source types in compact: {sorted(types_seen)}')

for k in ['quickstep', 'the bighorn', 'liberty', 'eagle bearer', 'big alejandro']:
    v = compact.get(k)
    if v:
        types = [s['type'] for s in v['sources']]
        names = [s.get('name_ru') or s.get('name_en') for s in v['sources'][:3]]
        print(f'  {k!r:20s}: {types} — {names}')
    else:
        print(f'  {k!r:20s}: NOT in compact')

out_path = SITE / 'sources_compact.json'
out_path.write_text(json.dumps(compact, ensure_ascii=False, indent=2), encoding='utf-8')
size = out_path.stat().st_size / 1024
print(f'\nSaved {out_path} ({size:.1f} KB)')
