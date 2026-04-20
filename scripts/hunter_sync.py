#!/usr/bin/env python3
"""Hunter Data Sync — overwrite site data with authoritative game-file data.

Source:  D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/
Target:  C:/Users/glukm/division2-calc/data/

Strategy:
- For each item in old data, match by name_en (lowercase, stripped)
- If match found and game name_ru/name_en differs → overwrite
- Log all changes
- Leave old-only entries untouched (they might be stale but keep to avoid data loss)
"""
import json
from pathlib import Path

BASE_NEW = Path('D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site')
BASE_OLD = Path('C:/Users/glukm/division2-calc/data')


def load(p):
    return json.loads(Path(p).read_text(encoding='utf-8'))


def save(p, d):
    Path(p).write_text(
        json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8'
    )


import re
COLOR_TAG_RE = re.compile(r'<color[^>]*>|</color>', re.IGNORECASE)


def clean_name(s):
    if not s:
        return ''
    # Strip <color name="..."> tags, </color>, stray quotes
    s = COLOR_TAG_RE.sub('', s)
    s = s.replace('"', '').strip()
    return s


def build_index(items, en_field='name_en'):
    """Lowercase name_en → item (with cleaned name_en/name_ru stored)"""
    idx = {}
    for it in items:
        en = clean_name(it.get(en_field) or '')
        ru = clean_name(it.get('name_ru') or '')
        if en:
            # Store cleaned versions for downstream use
            it['_clean_en'] = en
            it['_clean_ru'] = ru
            idx[en.lower()] = it
    return idx


def sync_simple(old_items, new_index, en_key, ru_key, label):
    """old_items as list of dicts with `en_key`/`ru_key`. Update from new_index."""
    updated = 0
    matched = 0
    for it in old_items:
        en = (it.get(en_key) or '').strip()
        if not en:
            continue
        new = new_index.get(en.lower())
        if not new:
            continue
        matched += 1
        new_en = new.get('_clean_en') or ''
        new_ru = new.get('_clean_ru') or ''
        changed = False
        if new_en and it.get(en_key) != new_en:
            it[en_key] = new_en
            changed = True
        if new_ru and it.get(ru_key) != new_ru:
            it[ru_key] = new_ru
            changed = True
        if changed:
            updated += 1
    print(f'{label}: matched={matched} updated={updated} out_of={len(old_items)}')


# === 1. GEAR TALENTS ===
print('\n=== SYNC: gear_talents ===')
new_gt = load(BASE_NEW / 'talents_gear.json')
gt_idx = build_index(new_gt)
old_gt = load(BASE_OLD / 'gear_talents.json')
sync_simple(old_gt, gt_idx, 'name_en', 'name_ru', 'gear_talents')
save(BASE_OLD / 'gear_talents.json', old_gt)


# === 2. WEAPON TALENTS ===
# Old format: dict { "0": { name_en, name_ru, perfect_name_en, perfect_name_ru, desc_en, desc_ru } }
print('\n=== SYNC: weapon_talents_full ===')
new_wt = load(BASE_NEW / 'talents_weapon.json')
wt_idx = build_index(new_wt)
old_wt = load(BASE_OLD / 'weapon_talents_full.json')
updated = matched = 0
for key, it in old_wt.items():
    en = (it.get('name_en') or '').strip()
    if not en:
        continue
    new = wt_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('name_en') != new_en:
        it['name_en'] = new_en
        changed = True
    if new_ru and it.get('name_ru') != new_ru:
        it['name_ru'] = new_ru
        if it.get('perfect_name_ru', '').strip() in ('', f'{it.get("name_ru","")} (идеальный)'):
            it['perfect_name_ru'] = f'{new_ru} (идеальный)'
        changed = True
    if changed:
        updated += 1
print(f'weapon_talents_full: matched={matched} updated={updated} out_of={len(old_wt)}')
save(BASE_OLD / 'weapon_talents_full.json', old_wt)


# === 3. EXOTIC GEAR (old exotics.json) ===
# Old: list of { name, en, tal, tal_ru, d, ... }  where `name` = Russian name, `en` = English
print('\n=== SYNC: exotics (gear) ===')
new_ex = load(BASE_NEW / 'gear_exotic.json')
ex_idx = build_index(new_ex)
old_ex = load(BASE_OLD / 'exotics.json')
updated = matched = 0
for it in old_ex:
    en = (it.get('en') or '').strip()
    if not en:
        continue
    new = ex_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('en') != new_en:
        it['en'] = new_en
        changed = True
    if new_ru and it.get('name') != new_ru:
        it['name'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'exotics(gear): matched={matched} updated={updated} out_of={len(old_ex)}')
save(BASE_OLD / 'exotics.json', old_ex)


# === 4. EXOTIC WEAPONS ===
# Old format: dict by RU name keys { "Агитатор": { name_ru, en, ... } }
print('\n=== SYNC: exotic_weapons ===')
new_exw = load(BASE_NEW / 'weapons_exotic.json')
exw_idx = build_index(new_exw)
old_exw = load(BASE_OLD / 'exotic_weapons.json')
updated = matched = 0
for key, it in old_exw.items():
    en = (it.get('en') or '').strip()
    if not en:
        continue
    new = exw_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('en') != new_en:
        it['en'] = new_en
        changed = True
    if new_ru and it.get('name_ru') != new_ru:
        it['name_ru'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'exotic_weapons: matched={matched} updated={updated} out_of={len(old_exw)}')
save(BASE_OLD / 'exotic_weapons.json', old_exw)


# === 5. NAMED WEAPONS ===
# Old: list of { name (ru), en, tal, tal_ru, ... }
print('\n=== SYNC: named (weapons) ===')
new_nw = load(BASE_NEW / 'weapons_named.json')
nw_idx = build_index(new_nw)
old_nw = load(BASE_OLD / 'named.json')
updated = matched = 0
for it in old_nw:
    en = (it.get('en') or '').strip()
    if not en:
        continue
    new = nw_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('en') != new_en:
        it['en'] = new_en
        changed = True
    if new_ru and it.get('name') != new_ru:
        it['name'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'named(weapons): matched={matched} updated={updated} out_of={len(old_nw)}')
save(BASE_OLD / 'named.json', old_nw)


# === 6. NAMED GEAR ===
print('\n=== SYNC: named_gear ===')
new_ng = load(BASE_NEW / 'gear_named.json')
ng_idx = build_index(new_ng)
old_ng = load(BASE_OLD / 'named_gear.json')
updated = matched = 0
for it in old_ng:
    en = (it.get('en') or '').strip()
    if not en:
        continue
    new = ng_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('en') != new_en:
        it['en'] = new_en
        changed = True
    if new_ru and it.get('name') != new_ru:
        it['name'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'named_gear: matched={matched} updated={updated} out_of={len(old_ng)}')
save(BASE_OLD / 'named_gear.json', old_ng)


# === 7. GEAR SETS ===
# Combine green_sets.json + gearsets.json by name_en
print('\n=== SYNC: gear_sets ===')
new_gs = load(BASE_NEW / 'green_sets.json')  # 27 RU-localized sets
all_gs = new_gs + load(BASE_NEW / 'gearsets.json')
gs_idx = build_index(all_gs)
old_gs = load(BASE_OLD / 'gear_sets.json')
# Old structure is a LIST of dicts
updated = matched = 0
for it in old_gs:
    en = (it.get('en') or '').strip()
    if not en:
        continue
    new = gs_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('en') != new_en:
        it['en'] = new_en
        changed = True
    if new_ru and it.get('name') != new_ru:
        it['name'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'gear_sets: matched={matched} updated={updated} out_of={len(old_gs)}')
save(BASE_OLD / 'gear_sets.json', old_gs)


# === 8. BRANDS ===
# Old: list of dicts { name, name_full_en, ... }
print('\n=== SYNC: brands ===')
new_br = load(BASE_NEW / 'brand_sets.json')
br_idx = build_index(new_br)
old_br = load(BASE_OLD / 'brands.json')
updated = matched = 0
for it in old_br:
    en = (it.get('name_full_en') or '').strip()
    if not en:
        continue
    new = br_idx.get(en.lower())
    if not new:
        continue
    matched += 1
    new_en = new.get('_clean_en') or ''
    new_ru = new.get('_clean_ru') or ''
    changed = False
    if new_en and it.get('name_full_en') != new_en:
        it['name_full_en'] = new_en
        changed = True
    if new_ru and it.get('name') != new_ru:
        it['name'] = new_ru
        changed = True
    if changed:
        updated += 1
print(f'brands: matched={matched} updated={updated} out_of={len(old_br)}')
save(BASE_OLD / 'brands.json', old_br)


print('\n=== SYNC DONE ===')
