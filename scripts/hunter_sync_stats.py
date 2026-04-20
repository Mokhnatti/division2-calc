#!/usr/bin/env python3
"""Sync weapon stats (dmg/rpm/mag/reload/hsd) from Hunter files.
Hunter v2.2.3 enriched update (21.04.2026) adds `stats` field with numeric values.
"""
import json, re
from pathlib import Path

SITE = Path('C:/Users/glukm/division2-calc/data')
HUNTER = Path('D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site')


def clean_name(s):
    if not s: return ''
    return re.sub(r'<color[^>]*>|</color>', '', s).replace('"', '').strip()


def load(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def save(p, d): Path(p).write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')


def build_hunter_index(items):
    idx = {}
    for it in items:
        en = clean_name(it.get('name_en') or '').lower()
        if en and it.get('stats'):
            idx[en] = it
    return idx


def extract_cat_from_identifier(identifier):
    """weapon_identifier → category used by site."""
    if not identifier: return None
    i = identifier.upper()
    # AR family
    if i in {'ACR','AK47','AUG','CARBINE','FAL','G36','M4','MK16','SCAR','AK47_EXT',
            'F2000','FAMAS','HONEYBADGER','TAVOR','GALIL','PRO57','SR25','MDR','SR1','AK74','BULLFROG'}:
        return 'AR'
    # SMG
    if i in {'MP5','MP7','UMP','MPX','VECTOR','P90','KRISS','PP19','SR9','HONEYBADGER_SMG','MP5_K'}:
        return 'SMG'
    # LMG
    if i in {'M249','M60','STONER','LWMG','LMG_NATO','RPK','NEGEV','HK21','L86','UMP_LMG','MK47'}:
        return 'LMG'
    # MMR / Marksman
    if i in {'M1A','SR25','HEROLD','MK14','SVD','SCOUT','MSR','M82','TAC50','MARKSMAN','G28'}:
        return 'MMR'
    # Rifle (semi-auto)
    if i in {'M1','MINI14','AK47_RIFLE','RIFLE','MK18','AUG_RIFLE'}:
        return 'Rifle'
    # Shotgun
    if i in {'M870','MKA','1887','BENELLI','SAIGA','DBSG','DOUBLE_BARREL','SPAS'}:
        return 'SG'
    # Pistol
    if i in {'M9','P226','M44','DESERT_EAGLE','PISTOL','GLOCK','COLT','57USG','D50','M1911'}:
        return 'Pistol'
    return None


# === EXOTIC WEAPONS ===
print('=== exotic_weapons ===')
h_exw = load(HUNTER / 'weapons_exotic.json')
h_idx = build_hunter_index(h_exw)
site_exw = load(SITE / 'exotic_weapons.json')

updated = missing = 0
for key, item in site_exw.items():
    en = clean_name(item.get('en') or '').lower()
    if not en:
        missing += 1
        continue
    h = h_idx.get(en)
    if not h:
        missing += 1
        if item.get('stats_missing'):
            # Still missing, keep flag
            pass
        continue
    stats = h.get('stats', {})
    # Use max damage (AR/LMG have dmg_min..dmg_max — use mid or max)
    item['dmg'] = int(round(stats.get('dmg_max') or stats.get('dmg_min') or 0))
    item['dmg_min'] = int(round(stats.get('dmg_min') or 0))
    item['dmg_max'] = int(round(stats.get('dmg_max') or 0))
    item['rpm'] = int(round(stats.get('rpm') or 0))
    item['mag'] = int(round(stats.get('mag') or 0))
    item['reload'] = round((stats.get('reload_ms') or 0) / 1000, 2)
    item['reload_empty'] = round((stats.get('reload_empty_ms') or 0) / 1000, 2)
    item['hsd_mult'] = stats.get('hsd', 1.55)
    item['range_optimal'] = stats.get('range_optimal', 0)
    item['weapon_identifier'] = stats.get('weapon_identifier', '')
    cat = extract_cat_from_identifier(stats.get('weapon_identifier', ''))
    if cat:
        item['cat'] = cat
    item['stats_missing'] = False
    updated += 1

save(SITE / 'exotic_weapons.json', site_exw)
print(f'  Updated: {updated}  Still missing stats: {missing}')


# === NAMED WEAPONS ===
print('\n=== named (weapons) ===')
h_nw = load(HUNTER / 'weapons_named.json')
h_idx_nw = build_hunter_index(h_nw)
site_nw = load(SITE / 'named.json')

updated = missing = 0
for item in site_nw:
    en = clean_name(item.get('en') or '').lower()
    if not en:
        missing += 1
        continue
    h = h_idx_nw.get(en)
    if not h:
        missing += 1
        continue
    stats = h.get('stats', {})
    item['dmg'] = int(round(stats.get('dmg_max') or stats.get('dmg_min') or 0))
    item['rpm'] = int(round(stats.get('rpm') or 0))
    item['mag'] = int(round(stats.get('mag') or 0))
    item['reload'] = round((stats.get('reload_ms') or 0) / 1000, 2)
    item['hsd'] = stats.get('hsd', 1.55)
    item['range'] = stats.get('range_optimal', 0)
    cat = extract_cat_from_identifier(stats.get('weapon_identifier', ''))
    if cat and not item.get('g'):
        item['g'] = cat
    if cat and not item.get('t'):
        item['t'] = cat
    item['stats_missing'] = False
    updated += 1

save(SITE / 'named.json', site_nw)
print(f'  Updated: {updated}  Still missing: {missing}')


# === BASE WEAPONS (weapons_base.json) ===
# Only if we have existing weapons_base.json
site_base_p = SITE / 'weapons_base.json'
if site_base_p.exists():
    print('\n=== weapons_base ===')
    h_wb = load(HUNTER / 'weapons_base.json')
    h_idx_wb = build_hunter_index(h_wb)
    site_wb = load(site_base_p)
    updated = 0
    # weapons_base structure: dict or list?
    items = site_wb.values() if isinstance(site_wb, dict) else site_wb
    for item in items:
        en = clean_name(item.get('en') or item.get('name_en') or '').lower()
        if not en: continue
        h = h_idx_wb.get(en)
        if not h: continue
        stats = h.get('stats', {})
        if not item.get('dmg'):
            item['dmg'] = int(round(stats.get('dmg_max') or 0))
        if not item.get('rpm'):
            item['rpm'] = int(round(stats.get('rpm') or 0))
        if not item.get('mag'):
            item['mag'] = int(round(stats.get('mag') or 0))
        if not item.get('reload'):
            item['reload'] = round((stats.get('reload_ms') or 0) / 1000, 2)
        updated += 1
    save(site_base_p, site_wb)
    print(f'  Updated: {updated}')


print('\n=== Done ===')
