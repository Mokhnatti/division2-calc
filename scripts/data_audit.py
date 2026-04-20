#!/usr/bin/env python3
"""Полная ревизия: дубли в site data, расхождения с Hunter game files.

Outputs:
- site_dupes.json — дубли в текущих данных
- missing_in_hunter.json — что есть у нас, нет в игре (возможно устарело)
- missing_in_site.json — что есть в игре, нет у нас (пропустили)
- mismatch.json — где имена/поля различаются
"""
import json, re
from pathlib import Path
from collections import defaultdict

SITE = Path('C:/Users/glukm/division2-calc/data')
HUNTER = Path('D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site')

def load(p):
    return json.loads(p.read_text(encoding='utf-8'))

def clean_name(s):
    if not s: return ''
    s = re.sub(r'<color[^>]*>|</color>', '', s)
    return s.replace('"', '').strip()

def as_list(d): return list(d.values()) if isinstance(d, dict) else d


def check_duplicates(items, name_key, label):
    """Find duplicate name_en values."""
    names = defaultdict(list)
    for i, it in enumerate(items):
        en = clean_name(it.get(name_key) or '').lower()
        if en:
            names[en].append((i, it))
    dupes = {k: [(i, it.get(name_key) or it.get('name') or '?') for i, it in v] for k, v in names.items() if len(v) > 1}
    if dupes:
        print(f'\n[{label}] Duplicates ({len(dupes)}):')
        for k, copies in list(dupes.items())[:10]:
            print(f'  "{k}" appears {len(copies)} times: {copies}')
    else:
        print(f'[{label}] No duplicates.')
    return dupes


def diff_sets(site_items, hunter_items, site_key, hunter_key, label):
    """What's in one but not the other."""
    site_names = {clean_name(it.get(site_key) or '').lower() for it in site_items if it.get(site_key)}
    hunter_names = {clean_name(it.get(hunter_key) or '').lower() for it in hunter_items if it.get(hunter_key)}
    only_site = site_names - hunter_names
    only_hunter = hunter_names - site_names
    site_discard = {n for n in only_site if not n or len(n) < 2}
    only_site -= site_discard
    print(f'\n[{label}]')
    print(f'  Site total: {len(site_names)}, Hunter total: {len(hunter_names)}')
    print(f'  Only in site (not in game files — possibly outdated): {len(only_site)}')
    print(f'  Only in Hunter (missing from site!): {len(only_hunter)}')
    if only_hunter:
        print(f'  === MISSING FROM SITE (real Hunter items): ===')
        for n in sorted(only_hunter)[:20]:
            print(f'    - {n}')
        if len(only_hunter) > 20:
            print(f'    ... and {len(only_hunter) - 20} more')
    return only_site, only_hunter


# === LOAD DATA ===
print('=== LOADING ===')
site_gt = as_list(load(SITE / 'gear_talents.json'))
site_wt = as_list(load(SITE / 'weapon_talents_full.json'))
site_ex = as_list(load(SITE / 'exotics.json'))
site_named = as_list(load(SITE / 'named.json'))
site_named_gear = as_list(load(SITE / 'named_gear.json'))
site_exwpn = as_list(load(SITE / 'exotic_weapons.json'))
site_sets = as_list(load(SITE / 'gear_sets.json'))
site_brands = as_list(load(SITE / 'brands.json'))

h_gt = load(HUNTER / 'talents_gear.json')
h_wt = load(HUNTER / 'talents_weapon.json')
h_ex_gear = load(HUNTER / 'gear_exotic.json')
h_named = load(HUNTER / 'weapons_named.json')
h_named_gear = load(HUNTER / 'gear_named.json')
h_exwpn = load(HUNTER / 'weapons_exotic.json')
h_green = load(HUNTER / 'green_sets.json')
h_gearsets = load(HUNTER / 'gearsets.json')
h_brand_sets = load(HUNTER / 'brand_sets.json')

print('=' * 60)
print('STEP 1: DUPLICATES IN SITE DATA')
print('=' * 60)
check_duplicates(site_gt, 'name_en', 'gear_talents')
check_duplicates(site_wt, 'name_en', 'weapon_talents_full')
check_duplicates(site_ex, 'en', 'exotics (gear)')
check_duplicates(site_named, 'en', 'named (weapons)')
check_duplicates(site_named_gear, 'en', 'named_gear')
check_duplicates(site_exwpn, 'en', 'exotic_weapons')
check_duplicates(site_sets, 'en', 'gear_sets')
check_duplicates(site_brands, 'name_full_en', 'brands')

print('\n' + '=' * 60)
print('STEP 2: MISSING / EXTRA vs HUNTER GAME FILES')
print('=' * 60)
diff_sets(site_gt, h_gt, 'name_en', 'name_en', 'gear_talents')
diff_sets(site_wt, h_wt, 'name_en', 'name_en', 'weapon_talents_full')
diff_sets(site_ex, h_ex_gear, 'en', 'name_en', 'exotics (gear)')
diff_sets(site_named, h_named, 'en', 'name_en', 'named (weapons)')
diff_sets(site_named_gear, h_named_gear, 'en', 'name_en', 'named_gear')
diff_sets(site_exwpn, h_exwpn, 'en', 'name_en', 'exotic_weapons')
diff_sets(site_sets, h_green + h_gearsets, 'en', 'name_en', 'gear_sets')
diff_sets(site_brands, h_brand_sets, 'name_full_en', 'name_en', 'brand_sets/brands')

print('\n=== AUDIT COMPLETE ===')
