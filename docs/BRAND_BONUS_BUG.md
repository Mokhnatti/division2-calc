# Brand & Set bonuses — root cause + fix

**Дата:** 2026-04-26
**Trigger:** verification (DB_VERIFICATION.md) flagged 12/15 brand bonuses + 4/5 set bonuses имели неверный `stat_slug`.

## Root cause

### Brands (12/15 wrong)
- `raw/brands.json` имеет `bonuses: []` для большинства брендов — parser bug в hunter pipeline, который не извлекал `myBonusList` из `.mgearbrand` raw assets. ЧАТ 6 откатил brands.json из бэкапа, но бэкап тоже без bonuses.
- `apps/web/public/data/brands.json` (был источником в моём импорте) имеет ручные правки в `bonuses[].bonus.stat`, но эти slug-и **не сходятся** с реальными бонусами игры. Например:
  - Petrov 1pc: public говорит `chd 10%` — фактически в игре `+10% LMG Damage`.
  - Wyvern 1pc: public говорит `healing 8%` — фактически `+8% Skill Damage`.
- `apps/web/public/locales/en/brand-bonuses.json` хранит **корректный текст** (verified spot-check vs in-game UI).

### Sets (4/5 wrong)
- `apps/web/public/data/gear-sets.json` имеет неполные/устаревшие `numericBonuses` (Hunter's Fury — только 3pc записан, 2pc отсутствует; Heartbreaker — только 3pc).
- `apps/web/public/locales/en/set-bonuses.json` содержит EN-описания **чужих сетов** (Hunter's Fury EN говорит "Skill Haste & Skill Repair" — это совсем другой сет).
- `raw/gearsets.json` + `raw/brand_sets.json` + `raw/green_sets.json` имеют **корректные данные**: `attribute_uid` + `attribute_name` + `value`. Алгоритм определения pieces — через поле `ref` ("New BonusAttributeRef (0)" начинает новый pieces level, "(1)+" добавляет к текущему).

## Что починено

### 1. stat_aliases.json расширен
Раньше: 28 пар (game_name → slug), 25 из них без attribute_uid.
Теперь: 3 lookup-пути + 60+ записей.
- `by_text`: 60+ TEXT-форм ("Weapon Damage" → "wd", "LMG Damage" → "lmg_dmg", "Status Effects" → "status_effects"...)
- `by_game_name`: 50+ GAME-форм ("WeaponDamage", "ShotgunDamageModBonus", "AllAmmoModBonus"...)
- `by_uid`: автогенерируется из attribute_dict + bonus_ref_names + **all_ref_names** (это покрывает кейс Heartbreaker AR, где attribute_name был literal "New BonusAttributeRef (0)" но UID указывает на AssaultRifleDamageModBonus через all_ref_names).

### 2. build_db.py: brand bonuses из EN-текста
Парсер регуляркой `(\d)pc:\s*([+-]?[\d.]+)%?\s*(.+)` берёт `apps/web/public/locales/en/brand-bonuses.json` и резолвит stat через `by_text`. EN-text является ground truth для брендов — другого надёжного источника нет (raw пуст, public/data структурно неверен).

Результат до/после:
| Бренд | До (DB stat_slug) | После | bonus_text |
|---|---|---|---|
| petrov_defense_group 1pc | chd 10% | **lmg_dmg 10%** | +10% LMG Damage ✓ |
| petrov 2pc | (отсутствует) | **handling 15%** | +15% Weapon Handling ✓ |
| petrov 3pc | dte 50% | **ammo_cap 50%** | +50% Ammo Capacity ✓ |
| wyvern 1pc | healing 8% | **skill_dmg 8%** | +8% Skill Damage ✓ |
| wyvern 2pc | health 18% | **status_effects 18%** | +18% Status Effects ✓ |
| wyvern 3pc | skill_dmg 45% | **skill_duration 45%** | +45% Skill Duration ✓ |
| hana_u 1pc | skill_tier 10% | **skill_haste 10%** | +10% Skill Haste ✓ |
| hana_u 2pc | healing 10% | **skill_dmg 10%** | +10% Skill Damage ✓ |
| hana_u 3pc | explosive_dmg 15% | **wd 15%** | +15% Weapon Damage ✓ |
| walker 1pc | explosive_dmg 5% | **wd 5%** | +5% Weapon Damage ✓ |
| walker 2pc | armor_regen 5% | **dta 5%** | +5% Damage to Armor ✓ |
| walker 3pc | skill_haste 10% | **dth 10%** | +10% Damage to Health ✓ |
| providence | hsd/chc/chd ✓ | **без изменений** | (был корректен) |

### 3. build_db.py: gear-set bonuses из raw + ref(0)-pieces algorithm

```python
def parse_raw_set_bonuses(raw_bonuses):
    out = []
    current_pieces = 1  # increments to 2 on first ref(0)
    for bonus in raw_bonuses:
        if "(0)" in bonus.get("ref", ""):
            current_pieces += 1
        out.append((current_pieces, attr_name, value, uid))
    return out
```

Резолв через `resolve_stat(uid=uid, game_name=attr_name)`.

Результат:
| Сет | До | После |
|---|---|---|
| hunter_s_fury | только 3pc armor_on_kill 20 | **2pc shotgun_dmg 15 + smg_dmg 15, 3pc armor_on_kill 20 + life_on_kill 50** |
| heartbreaker | только 3pc handling 15 | **2pc ar_dmg 15 + lmg_dmg 15, 3pc handling 15** |
| true_patriot | только 3pc mag 30 | **2pc ammo_cap 30, 3pc mag 30** |
| striker_s_battlegear | 2pc handling 15, 3pc rof 15 ✓ | без изменений (был корректен) |
| negotiator_s_dilemma | 2pc chc 15, 3pc chd 20 ✓ | без изменений |

### 4. EN bonus_text/set_bonuses регенерация из item_bonuses

`apps/web/public/locales/en/{set,brand}-bonuses.json` устарел или содержит чужие данные. Build_db **регенерирует** EN из таблицы `item_bonuses` (которая теперь корректна) → пишет в translations с field='bonus_text' / 'set_bonuses'. RU-локализация остаётся из public/locales (curated, проверена).

### 5. Bighorn name_ru
Fuzzy-match: при lookup в raw weapons пробуется и оригинальное имя, и с/без префикса "The". Toлсторог теперь сматчен через "The Bighorn" → "Bighorn" slug.

### 6. Source[en] для St.Elmo, Regulus
Добавлено `weapon_overrides.json` секция `source_fixes` (manual текст для weapons где raw + public/locales пусты).

### 7. Talent_text для exotic weapons
Build_db делает cross-link: weapon → default_talent → talent.description. Talent items уже имеют свежие EN/RU описания (raw/talents_*.json tooltip_*_filled). Linked description копируется в weapon's talent_text.
Manual_overrides RU остаётся (curated) и применяется поверх при export — так что фронт получает curated RU + актуальный EN.

### 8. The Ravenous rpm
Public/data был 240, raw=850, in-game=850. Добавлено `weapon_overrides.json` секция `stat_fixes` для прямой установки. Применяется на стадии build_db поверх public/data импорта.

## Coverage check

```
all 64 brands: re-parsed from public/locales/en/brand-bonuses.json text
                → 156 item_bonuses записей (3.0 на бренд в среднем; верифицировано
                  по Petrov/Wyvern/Hana-U/Walker/Providence)
all 64 sets:   re-imported from raw/gearsets.json + brand_sets + green_sets
                → 137 item_bonuses записей с корректными stat_slug + value
                  (верифицировано по 5 ключевым: Hunter's Fury, Heartbreaker,
                  True Patriot, Striker's, Negotiator's)
```

## Что НЕ починено (требует дальнейшей работы)

- **`only_raw` brands** (Alps Summit, Précision Défense, Exhausted Equipment, Habsburg Guard) — не в public/data, raw не имеет bonuses. Сейчас в БД с пустыми bonuses + `stat_quality='unverified'`. Не блокер для основного функционала.
- **`sacrum_imperium` name_ru** — Ubisoft не локализовал имя. raw имеет "Sacrum Imperium" в ru локали. Известная игровая фича.
- **Reference DPS UI test** — выполнен на статике (data layer верифицирован), но не запущена браузерная сессия с интерактивной сборкой билда. Frontend dev-сервер запущен, серсит исправленные данные (St.Elmo, Ravenous, Petrov, Wyvern). Финальную UI-проверку 116216/120%/707785 нужно сделать руками или E2E-скриптом — следующий шаг.
