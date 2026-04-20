#!/usr/bin/env python3
"""Import items that exist in Hunter game files but missing in site data.

Preserves existing site structure (does NOT change fields of existing items).
Appends new items with proper field mapping from Hunter format → site format.
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


# === GEAR TALENTS ===
print('=== gear_talents ===')
site_gt = load(SITE / 'gear_talents.json')
h_gt = load(HUNTER / 'talents_gear.json')
site_en = {clean_name(t.get('name_en') or '').lower(): t for t in site_gt if t.get('name_en')}
added = 0
for h in h_gt:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    # Determine slot from tooltip hints — default 'chest' if unclear
    tip_ru = (h.get('tooltip_ru') or '').lower()
    tip_en = (h.get('tooltip_en') or '').lower()
    slot = 'chest'
    if 'рюкзак' in tip_ru or 'backpack' in tip_en or 'рюкзаке' in tip_ru:
        slot = 'bp'
    new_item = {
        'name_en': en,
        'name_ru': ru if re.search(r'[а-яА-ЯёЁ]', ru) else '',
        'slot': slot,
        'perfect_name_en': f'Perfect {en}',
        'perfect_name_ru': f'Идеальный {ru}' if re.search(r'[а-яА-ЯёЁ]', ru) else '',
        'desc_ru': clean_name(h.get('tooltip_ru') or ''),
        'desc_en': clean_name(h.get('tooltip_en') or ''),
        'id': (h.get('id') or '').lower().replace(' ', '_'),
        'source': 'hunter_v2.2.3',
    }
    site_gt.append(new_item)
    added += 1
save(SITE / 'gear_talents.json', site_gt)
print(f'  Added: {added}')


# === WEAPON TALENTS ===
print('=== weapon_talents_full ===')
site_wt = load(SITE / 'weapon_talents_full.json')
h_wt = load(HUNTER / 'talents_weapon.json')
site_en = set()
for k, t in site_wt.items():
    en = clean_name(t.get('name_en') or '').lower()
    if en: site_en.add(en)

# Find max key
max_key = max((int(k) for k in site_wt.keys() if k.isdigit()), default=0)
added = 0
for h in h_wt:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    # Skip placeholder-like names
    if '[' in en or ']' in en or '(ph)' in en.lower(): continue
    max_key += 1
    site_wt[str(max_key)] = {
        'name_en': en,
        'name_ru': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'perfect_name_en': f'Perfect {en}',
        'perfect_name_ru': f'Идеальный {ru}' if re.search(r'[а-яА-ЯёЁ]', ru) else f'Perfect {en}',
        'desc_ru': clean_name(h.get('tooltip_ru') or ''),
        'desc_en': clean_name(h.get('tooltip_en') or ''),
        'source': 'hunter_v2.2.3',
    }
    added += 1
save(SITE / 'weapon_talents_full.json', site_wt)
print(f'  Added: {added}')


# === EXOTIC WEAPONS ===
# Site format: dict keyed by RU name
print('=== exotic_weapons ===')
site_exw = load(SITE / 'exotic_weapons.json')
h_exw = load(HUNTER / 'weapons_exotic.json')
site_en = {clean_name(t.get('en') or '').lower() for t in site_exw.values()}
added = 0
for h in h_exw:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    # Guess category from id
    hid = (h.get('id') or '').lower()
    cat = 'AR'
    if 'mmr' in hid or 'marksman' in hid or 'sniper' in hid: cat = 'MMR'
    elif 'smg' in hid: cat = 'SMG'
    elif 'lmg' in hid: cat = 'LMG'
    elif 'shotgun' in hid or '_sg' in hid: cat = 'SG'
    elif 'pistol' in hid: cat = 'Pistol'
    elif 'rifle' in hid and 'ar' not in hid: cat = 'Rifle'
    key = ru or en
    site_exw[key] = {
        'name_ru': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'en': en,
        'cat': cat,
        'dmg': 0,  # MISSING — Hunter pipeline doesn't export stats yet
        'rpm': 0,
        'mag': 0,
        'reload': 0,
        'tal': en + ' Talent',
        'tal_desc': clean_name(h.get('tooltip_en') or ''),
        'tal_desc_ru': clean_name(h.get('tooltip_ru') or ''),
        'tal_name_en': '',
        'flavor_en': '',
        'source': 'hunter_v2.2.3',
        'stats_missing': True,
    }
    added += 1
save(SITE / 'exotic_weapons.json', site_exw)
print(f'  Added: {added} (stats_missing flag set — needs manual review!)')


# === EXOTIC GEAR ===
# Site format: list with fields: name, en, tal, tal_ru, d, g, stats_ru, etc.
print('=== exotics (gear) ===')
site_ex = load(SITE / 'exotics.json')
h_ex = load(HUNTER / 'gear_exotic.json')
site_en = {clean_name(t.get('en') or '').lower() for t in site_ex}
added = 0
for h in h_ex:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    # Guess slot from id
    hid = (h.get('id') or '').lower()
    slot = 'chest'
    if 'chest' in hid: slot = 'chest'
    elif 'back' in hid or '_bp' in hid: slot = 'bp'
    elif 'mask' in hid: slot = 'mask'
    elif 'gloves' in hid: slot = 'gloves'
    elif 'holster' in hid: slot = 'holster'
    elif 'knee' in hid: slot = 'knees'
    site_ex.append({
        'name': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'en': en,
        'g': slot,
        'tal': en + ' (talent)',
        'tal_ru': ru + ' (талант)' if re.search(r'[а-яА-ЯёЁ]', ru) else en + ' (talent)',
        'd': clean_name(h.get('tooltip_en') or ''),
        'd_ru': clean_name(h.get('tooltip_ru') or ''),
        'source': 'hunter_v2.2.3',
    })
    added += 1
save(SITE / 'exotics.json', site_ex)
print(f'  Added: {added}')


# === NAMED WEAPONS ===
print('=== named (weapons) ===')
site_named = load(SITE / 'named.json')
h_named = load(HUNTER / 'weapons_named.json')
site_en = {clean_name(t.get('en') or '').lower() for t in site_named}
added = 0
for h in h_named:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    hid = (h.get('id') or '').lower()
    cat = 'AR'
    if 'mmr' in hid or 'marksman' in hid or 'sniper' in hid: cat = 'MMR'
    elif 'smg' in hid: cat = 'SMG'
    elif 'lmg' in hid: cat = 'LMG'
    elif 'shotgun' in hid or '_sg' in hid: cat = 'SG'
    elif 'pistol' in hid: cat = 'Pistol'
    elif 'rifle' in hid and 'ar' not in hid: cat = 'Rifle'
    site_named.append({
        'name': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'en': en,
        'g': cat,
        't': cat,
        'brand': '',
        'tal': 'Perfect ' + en + ' Talent',
        'tal_ru': 'Идеальный ' + ru if re.search(r'[а-яА-ЯёЁ]', ru) else 'Perfect ' + en,
        'd': clean_name(h.get('tooltip_en') or ''),
        'd_ru': clean_name(h.get('tooltip_ru') or ''),
        'dmg': 0,  # MISSING — Hunter stats not yet in pipeline
        'rpm': 0,
        'mag': 0,
        'reload': 0,
        'source': 'hunter_v2.2.3',
        'stats_missing': True,
    })
    added += 1
save(SITE / 'named.json', site_named)
print(f'  Added: {added} (stats_missing flag set)')


# === NAMED GEAR ===
print('=== named_gear ===')
site_ng = load(SITE / 'named_gear.json')
h_ng = load(HUNTER / 'gear_named.json')
site_en = {clean_name(t.get('en') or '').lower() for t in site_ng}
added = 0
for h in h_ng:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en: continue
    if en.lower() in site_en: continue
    hid = (h.get('id') or '').lower()
    slot = 'chest'
    if '_chest' in hid: slot = 'chest'
    elif '_back' in hid or '_bp' in hid: slot = 'bp'
    elif '_mask' in hid: slot = 'mask'
    elif '_gloves' in hid: slot = 'gloves'
    elif '_holster' in hid: slot = 'holster'
    elif '_knee' in hid: slot = 'knees'
    site_ng.append({
        'name': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'en': en,
        'g': {'chest':'Бронежилет','bp':'Рюкзак','mask':'Маска','gloves':'Перчатки','holster':'Кобура','knees':'Наколенники'}.get(slot, 'Маска'),
        't': slot,
        'brand': '',
        'bonus_ru': clean_name(h.get('tooltip_ru') or ''),
        'bonus_short_en': clean_name(h.get('tooltip_en') or '')[:120],
        'source': 'hunter_v2.2.3',
    })
    added += 1
save(SITE / 'named_gear.json', site_ng)
print(f'  Added: {added}')


# === BRANDS ===
print('=== brands ===')
site_br = load(SITE / 'brands.json')
h_br = load(HUNTER / 'brand_sets.json')
site_en = {clean_name(t.get('name_full_en') or '').lower() for t in site_br}
added = 0
for h in h_br:
    en = clean_name(h.get('name_en') or '')
    ru = clean_name(h.get('name_ru') or '')
    if not en or en.lower() == 'set name': continue
    if en.lower() in site_en: continue
    site_br.append({
        'name': ru if re.search(r'[а-яА-ЯёЁ]', ru) else en,
        'name_full_en': en,
        'bonuses': [],
        'bonuses_old': [],
        'aliases_en': [],
        'core_en': '',
        'armor_type_en': '',
        'dlc': '',
        'source': 'hunter_v2.2.3',
    })
    added += 1
save(SITE / 'brands.json', site_br)
print(f'  Added: {added}')


print('\n=== IMPORT COMPLETE ===')
print('\nNOTE: Items with `stats_missing: true` need follow-up from Hunter pipeline to fill dmg/rpm/mag/reload stats.')
