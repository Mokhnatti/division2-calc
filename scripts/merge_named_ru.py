import json
import re
import sys
from pathlib import Path

RU_PATH = Path('D:/ClaudHorizont/DivCalc/gear_ru_json/Таланты_снаряжения.json')
NAMED_PATH = Path('C:/Users/glukm/division2-calc/data/named_gear.json')


def norm_apostrophes(s):
    if not isinstance(s, str):
        return s
    return s.replace('\u2019', "\u2019").replace("\u2018", "\u2019").replace("'", "\u2019")


def norm_key(s):
    if not isinstance(s, str):
        return ''
    s = s.lower().replace('\u2019', "'").replace('\u2018', "'").replace('`', "'")
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def parse_ru():
    with open(RU_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    rows = data['rows']
    named = []
    bonus_rows = []
    cur_gear_type = None
    for i, row in enumerate(rows[2:], start=2):
        if not row:
            continue
        if row[0]:
            cur_gear_type = row[0].strip()
        def sget2(r, idx):
            if len(r) <= idx or r[idx] is None:
                return ''
            v = r[idx]
            return v if isinstance(v, str) else str(v)
        c1b = sget2(row, 1).strip()
        c3b = sget2(row, 3).strip()
        c4b = sget2(row, 4).strip()
        c5b = sget2(row, 5).strip()
        c7b = sget2(row, 7).strip()
        if c3b and c4b in ('—', '1.0', '2.0', '1', '2') and 'Бренд' in c5b:
            mb2 = re.search(r'[Бб]ренд\s+([^,\(]+?)(?:\s*,|\s*\()', c5b)
            brand2 = mb2.group(1).strip() if mb2 else ''
            ms2 = re.search(r'\(([^)]+)\)', c5b)
            source2 = ms2.group(1).strip().replace('\n',' ') if ms2 else ''
            name_ru_b = c1b if c1b and c1b not in ('Атака','Защита','Лечение','Лечение\nи \nподдержка') else ''
            bonus_rows.append({
                'name_en': c3b,
                'name_ru': name_ru_b,
                'brand': brand2,
                'source_ru': source2,
                'bonus_ru': re.sub(r'\s+', ' ', c7b).strip(),
                'gear_type_ru': cur_gear_type,
            })
            continue
        def sget(r, idx):
            if len(r) <= idx or r[idx] is None:
                return ''
            v = r[idx]
            if isinstance(v, str):
                return v
            return str(v)
        c4 = sget(row, 4)
        c5 = sget(row, 5)
        if '(идеал' not in c4.lower():
            continue
        prev = rows[i - 1] if i - 1 >= 0 else []
        talent_en = sget(prev, 3).strip()
        talent_ru_norm = sget(prev, 4).strip()
        talent_ru_perfect = c4.strip()
        desc_ru = sget(row, 7).strip()

        m = re.search(r'["\u00AB\u201C]([^"\u00BB\u201D]+)["\u00BB\u201D]', c5)
        name_ru = m.group(1).strip() if m else ''
        mb = re.search(r'бренд\s+([^,\(]+?)(?:\s*,|\s*\()', c5)
        brand = mb.group(1).strip() if mb else ''
        ms = re.search(r'\(([^)]+)\)', c5)
        source_ru = ms.group(1).strip().replace('\n', ' ') if ms else ''

        name_ru = re.sub(r'\s+', ' ', name_ru).strip()
        desc_ru = re.sub(r'\s+', ' ', desc_ru).strip()

        if not name_ru:
            continue
        named.append({
            'name_ru': name_ru,
            'brand': brand,
            'source_ru': source_ru,
            'talent_en': talent_en,
            'talent_ru': talent_ru_norm,
            'talent_ru_perfect': talent_ru_perfect,
            'desc_ru': desc_ru,
            'gear_type_ru': cur_gear_type,
            'row_index': i,
        })
    return named, bonus_rows


def brand_key(s):
    if not s:
        return ''
    s = s.lower()
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'[.,]', '', s)
    return s


def gear_match(ru_type, existing_g):
    if not ru_type or not existing_g:
        return False
    ru_type = ru_type.lower()
    eg = existing_g.lower()
    map_ = {
        'бронежилет': ['броня', 'нагрудн'],
        'перчатки': ['перчатк'],
        'маска': ['маск'],
        'наколенники': ['наколенн'],
        'кобура': ['кобур'],
        'рюкзак': ['рюкзак'],
    }
    for k, vals in map_.items():
        if k in ru_type:
            for v in vals:
                if v in eg:
                    return True
    return False


def main():
    ru, bonus_rows = parse_ru()
    print(f'Parsed RU named: {len(ru)}', file=sys.stderr)
    print(f'Parsed bonus rows: {len(bonus_rows)}', file=sys.stderr)

    with open(NAMED_PATH, 'r', encoding='utf-8') as f:
        named = json.load(f)

    for item in named:
        for k in ('name', 'en', 'brand', 'tal', 'd'):
            if k in item and isinstance(item[k], str):
                item[k] = item[k].replace('\u2019', "\u2019").replace('\u2018', "\u2019")

    matched_by = {}
    ru_used = set()

    def find_match(ru_item):
        ten = norm_key(ru_item['talent_en'])
        brand_k = brand_key(ru_item['brand'])
        gear_type = ru_item['gear_type_ru']
        name_ru_k = norm_key(ru_item['name_ru'])

        used = set(matched_by.values())

        candidates_by_talent = []
        if ten:
            ten_clean = re.sub(r'[^a-z0-9 ]', ' ', ten)
            ten_words = [w for w in ten_clean.split() if len(w) >= 3]
            for idx, n in enumerate(named):
                if idx in used:
                    continue
                tal = norm_key(n.get('tal', ''))
                if not tal:
                    continue
                tal_clean = re.sub(r'[^a-z0-9 ]', ' ', tal)
                tal_words = tal_clean.split()
                if ten_words and all(w in tal_words for w in ten_words):
                    candidates_by_talent.append(idx)

        def pick(cands):
            if not cands:
                return None
            scored = []
            for idx in cands:
                n = named[idx]
                nb = brand_key(n.get('brand', ''))
                score = 0
                if brand_k and nb and (brand_k in nb or nb in brand_k):
                    score += 10
                if gear_match(gear_type, n.get('g', '')):
                    score += 5
                tal_words_len = len(norm_key(n.get('tal', '')).split())
                score += max(0, 5 - abs(tal_words_len - (len(re.sub(r'[^a-z0-9 ]',' ',ten).split()) + 1)))
                scored.append((score, idx))
            scored.sort(reverse=True)
            return scored[0][1] if scored[0][0] > 0 else scored[0][1]

        if candidates_by_talent:
            if len(candidates_by_talent) == 1:
                idx = candidates_by_talent[0]
                n = named[idx]
                nb = brand_key(n.get('brand', ''))
                if brand_k and nb and not (brand_k in nb or nb in brand_k):
                    pass
                else:
                    return idx, 'talent_en_words'
            best = None
            best_score = -1
            for idx in candidates_by_talent:
                n = named[idx]
                nb = brand_key(n.get('brand', ''))
                score = 0
                if brand_k and nb and (brand_k in nb or nb in brand_k):
                    score += 10
                if gear_match(gear_type, n.get('g', '')):
                    score += 5
                if score > best_score:
                    best_score = score
                    best = idx
            if best is not None and best_score >= 10:
                return best, 'talent_en+brand'
            if best is not None and best_score >= 5 and len(candidates_by_talent) == 1:
                return best, 'talent_en+gear'

        for idx, n in enumerate(named):
            if idx in used:
                continue
            existing_name = norm_key(n.get('name', ''))
            if name_ru_k and existing_name and (name_ru_k == existing_name):
                nb = brand_key(n.get('brand', ''))
                if not brand_k or not nb or brand_k in nb or nb in brand_k:
                    return idx, 'name+brand'

        for idx, n in enumerate(named):
            if idx in used:
                continue
            nb = brand_key(n.get('brand', ''))
            if brand_k and nb and (brand_k in nb or nb in brand_k):
                if gear_match(gear_type, n.get('g', '')):
                    if candidates_by_talent and idx not in candidates_by_talent:
                        continue
                    return idx, 'brand+gear'

        if candidates_by_talent:
            for idx in candidates_by_talent:
                if idx in used:
                    continue
                if gear_match(gear_type, named[idx].get('g', '')):
                    return idx, 'talent_en+gear_fallback'

        return None, None

    renamed = 0
    desc_upd = 0
    added_new = []
    unmatched = []
    log = []

    for ri, ru_item in enumerate(ru):
        idx, reason = find_match(ru_item)
        if idx is None:
            unmatched.append(ru_item)
            continue
        matched_by[ri] = idx
        ru_used.add(ri)
        n = named[idx]
        old_name = n.get('name', '')
        new_name = ru_item['name_ru']
        if new_name and old_name != new_name:
            n.setdefault('aliases_ru', [])
            if old_name and old_name not in n['aliases_ru']:
                n['aliases_ru'].append(old_name)
            n['name'] = new_name
            renamed += 1
        old_d = n.get('d', '')
        new_d = ru_item['desc_ru']
        if new_d and new_d != old_d:
            if old_d:
                n['d_old'] = old_d
            n['d'] = new_d
            desc_upd += 1
        if ru_item['source_ru']:
            n['source_ru'] = ru_item['source_ru']
        if ru_item['brand'] and not n.get('brand'):
            n['brand'] = ru_item['brand']
        elif ru_item['brand']:
            n['brand_ru'] = ru_item['brand']
        if ru_item['gear_type_ru']:
            n['gear_type_ru'] = ru_item['gear_type_ru']
        if ru_item['talent_ru_perfect']:
            n['talent_ru'] = ru_item['talent_ru_perfect']
        log.append(f'MATCH[{reason}]: RU "{ru_item["name_ru"]}" -> named[{idx}] (was "{old_name}", en={n.get("en","")}, tal={n.get("tal","")})')

    bonus_updated = 0
    bonus_unmatched = []
    bonus_renamed_counter = [0]
    for b in bonus_rows:
        ben = norm_key(b['name_en'])
        brand_k = brand_key(b['brand'])
        gt = b['gear_type_ru']
        found = None
        for idx, n in enumerate(named):
            en = norm_key(n.get('en', ''))
            if not en:
                continue
            if ben and (ben == en or ben in en or en in ben):
                if gear_match(gt, n.get('g', '')):
                    found = idx
                    break
        if found is None:
            for idx, n in enumerate(named):
                nb = brand_key(n.get('brand', ''))
                if brand_k and nb and (brand_k in nb or nb in brand_k):
                    if gear_match(gt, n.get('g', '')):
                        if n.get('bonus_ru'):
                            continue
                        found = idx
                        break
        if found is not None:
            n = named[found]
            if b['bonus_ru']:
                n['bonus_ru'] = b['bonus_ru']
            if b['source_ru']:
                n.setdefault('source_ru', b['source_ru'])
            if b['brand'] and not n.get('brand'):
                n['brand'] = b['brand']
            if b.get('name_ru'):
                old_name = n.get('name', '')
                new_name = b['name_ru']
                if old_name and old_name != new_name:
                    n.setdefault('aliases_ru', [])
                    if old_name not in n['aliases_ru']:
                        n['aliases_ru'].append(old_name)
                    n['name'] = new_name
                    bonus_renamed_counter[0] += 1
                elif not old_name:
                    n['name'] = new_name
            bonus_updated += 1
            log.append(f'BONUS: "{b["name_en"]}" / "{b.get("name_ru","")}" -> named[{found}] bonus="{b["bonus_ru"][:50]}"')
        else:
            bonus_unmatched.append(b)

    for ru_item in unmatched:
        new_rec = {
            'name': ru_item['name_ru'],
            'en': ru_item['name_ru'],
            'g': ru_item['gear_type_ru'] or '',
            'brand': ru_item['brand'],
            'tal': ru_item['talent_en'] or '',
            'talent_ru': ru_item['talent_ru_perfect'],
            'd': ru_item['desc_ru'],
            'source_ru': ru_item['source_ru'],
            'gear_type_ru': ru_item['gear_type_ru'],
            'core': [],
            'attr1': {},
            'attr2': {},
            '_added_from_ru': True,
        }
        named.append(new_rec)
        added_new.append(ru_item['name_ru'])

    for b in bonus_unmatched:
        new_rec = {
            'name': b.get('name_ru') or b['name_en'],
            'en': b['name_en'],
            'g': b['gear_type_ru'] or '',
            'brand': b['brand'],
            'tal': '',
            'd': '',
            'bonus_ru': b['bonus_ru'],
            'source_ru': b['source_ru'],
            'gear_type_ru': b['gear_type_ru'],
            'core': [],
            'attr1': {},
            'attr2': {},
            '_added_from_ru_bonus': True,
        }
        named.append(new_rec)
        added_new.append(b['name_en'])

    with open(NAMED_PATH, 'w', encoding='utf-8') as f:
        json.dump(named, f, ensure_ascii=False, indent=2)

    print(f'\n=== REPORT ===', file=sys.stderr)
    print(f'Parsed RU entries: {len(ru)}', file=sys.stderr)
    print(f'Renamed: {renamed}', file=sys.stderr)
    print(f'Descriptions updated: {desc_upd}', file=sys.stderr)
    print(f'Bonus_ru set: {bonus_updated}', file=sys.stderr)
    print(f'Renamed via bonus section: {bonus_renamed_counter[0]}', file=sys.stderr)
    print(f'Bonus unmatched: {len(bonus_unmatched)}', file=sys.stderr)
    for b in bonus_unmatched:
        print(f'  UNMATCHED BONUS: {b["name_en"]} | {b["brand"]} | {b["gear_type_ru"]}', file=sys.stderr)
    print(f'Added new: {len(added_new)}', file=sys.stderr)
    print(f'Unmatched (added as new): {len(unmatched)}', file=sys.stderr)
    if added_new:
        print('New items:', file=sys.stderr)
        for n in added_new:
            print('  +', n, file=sys.stderr)
    print('\nMATCH LOG:', file=sys.stderr)
    for l in log:
        print(l, file=sys.stderr)


if __name__ == '__main__':
    main()
