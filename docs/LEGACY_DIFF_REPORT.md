# Legacy ↔ Raw drift report v3 (TU22 reparse + cross-group dedup)

_Generated: 2026-04-25T16:56:18.674063+00:00_

## Стратегия импорта (утверждена)
**legacy = ground truth** для matched оружий/брони/сетов. build_db.py берёт displayed-числа из legacy при импорте, без overrides.
**Seed содержит только**: переводы (RU name/description/flavor/source/talent_text) + классификации (core, subkind, weapon_class, has_perfect, links).
**only_raw** (новые TU22) → импорт raw-passthrough с `stat_quality='unverified'`, попадает в [UNVERIFIED_ITEMS.md](UNVERIFIED_ITEMS.md) для ручной выверки.

**Seed candidates: 1416** (фильтрованный — без stat_drift)

## Weapons (cross-group dedup, priority exotic > named > base)

| Group | Legacy | Matched | Only legacy | Collisions |
|---|---:|---:|---:|---:|
| exotic | 62 | 58 | 4 | — |
| named  | 191 | 113 | 78 | — |
| base   | 172 | 148 | 24 | — |
| **total weapons collisions** |  |  |  | **152** |

**only_raw (новые TU22)**: 57

### only_legacy (предположительно удалены из игры или переименованы)
**exotic** (4): The Bighorn - Semi-Auto Mode, The Bighorn Full-Auto Mode, Bighorn, Regulus

**named** (78): Upshift, Maxim 9, Взаимообмен, Orbit, Sleipner, Mechanical beast, Lightning Rod, The Harvest, The Sheriff, Archivist, Smuggled AKM, Homemade smuggled AKM, Army AKM, Mania, Bighorn sheep (ShV mode), Bighorn (Mode B), Homemade F2000, Homemade FAL SA-58 Para, Homemade FAMAS 2010, Improved G36 C …

**base** (24): Military P416 G3, SIG Sauer 556, The Bighorn - Semi-Auto Mode, The Bighorn Full-Auto Mode, SIG MPX, Black Market RPK-74, Black Market RPK-74 Replica, HK GR9, Military L86 A2, Military L86 A2 Replica, Military RPK-74, October Fifth - M249 B, Bighorn, The Sheriff, 586 Magnum, Custom PF45, First Wave PF45, Lightning Rod, Maxim 9, Orbit …

### only_raw breakdown (новые/непокрытые) — топ 30
- **base** (57): Alexandrian, Magpul PDR, Cluster Grenade, Riot Foam Grenade, GR9, Colossus, MK249, Black Market RPK-74 E Replica, Artemis, Halicarnassus, Sig P320, RPG, Olympian, Babylonian, K8-JetStream Flamethrower, Minigun, P-017 Launcher, Companion, Decoy, Firefly, Smart Cover, Sticky Bomb, Trap, Giza, Survivor AK-47, EMT P416, Hazmat P416, JTF P416, Concussion Grenade, EMP Grenade …

### K = legacy_dmg / raw_dmg_max (диагностика)
- **exotic**: median=1.00, mean=1.00, n=57
- **named**: median=1.00, mean=345.28, n=112
- **base**: median=501.68, mean=905.50, n=145

→ K не единый. Подтверждение: формула raw→display отсутствует, legacy=ground truth.

## Brands

Legacy/brands.json **игнорим** (per spec). Используем raw/brands.json (64) + legacy/gear_sets для RU-имён там где matched.

- legacy.gear_sets matched: 26
- only_legacy: 0 → []
- only_raw (новые TU22 бренды): 38
  Sample: 5.11 Tactical, Golan Gear Ltd, Lengmo, Gila Guard, Palisade Steelworks, Richter & Kaiser GmbH, Zwiadowka Sp. z o.o., Petrov Defense Group, Legatus S.p.A., Yaahl Gear, China Light Industries Corporation, Shiny Monkey Gear, Overlord Armaments, Imminence Armaments, Providence Defense, Urban Lookout, Badger Tuff, Unit Alloys, Douglas & Harding, Royal Works

## Gear sets

Raw breakdown: {'gearset': 64, 'brand_set': 37, 'green_set': 27}
- matched: 26 / 26
- only_legacy: 0
- only_raw: 37

## Named gear

- matched: 64 / 94
- only_legacy: 30
- only_raw: 0

## Talents (cross-file, perfect-collapse on both sides)

Legacy counts: {'weapon': 101, 'gear': 154, 'exotic': 34}
Raw counts (after collapse): {'weapon': 67, 'gear': 69, 'exotic': 74}

| Group | Matched | Only legacy |
|---|---:|---:|
| exotic | 26 | 8 |
| weapon | 43 | 46 |
| gear | 80 | 74 |

**collisions**: 12

**only_raw**: 61
  Sample: [AR Archetype Talent 4 (PH)], Second Primary Weapon, On the Ropes, Berserk, Twinkling Lights, Compensated, Fill'er Up, Swift, Dialed In, Extra Weapon Choice, Devastating, Greased, Double Duty, Weapon Damage, Blossom Harvest, Eyeless 2.0, Jeopardy, Sport Mode, Refreshing, Second Weapon Slot

### only_legacy/exotic (8)
Охотник на крупную дичь, Воздух свободы, Замораживающие патроны, Свинцовый ад, Гери и Фреки, Точка, Взгляд через прицел, Цареубийство

### only_legacy/weapon (46)
Outsider, Frenzy, Headhunter, Allegro, Adrenaline Rush, Jazz Hands, Sustained, Boomerang, Vanguard, In Sync, Opportunistic, Precision, Pummel, Finisher, Calculated, Surgical, Naked, Capacitor, Eagle Bearer, Chameleon, Agitator, Ouroboros, Scorpio, Regicide, Elmo's Mark, Bighorn, Breathe Free, Chatterbox, Bluescreen, Bullet King …

### only_legacy/gear (74)
Explosive Delivery, Kinetic Momentum, Focus, Obliterate, Intimidate, Headhunter, Empathic Resolve, Overwatch, Glass Cannon, Spotter, Unbreakable, Vanguard, Protected Reload, Entrench, Efficient, Mad Bomber, Skilled, Tag Team, Trauma, Reassigned, Combined Arms, Tech Support, Shock and Awe, Versatile, Companion, Composure, Wicked, Opportunistic, Clutch, Safeguard …

## Apppliance

После апрува этого отчёта seed валидируется и build_db.py использует:
- **matched weapons/gear/sets**: stats из legacy, name/description/flavor/source/talent_text из overrides (translations) + raw для метаданных (game_id, weapon_group, mod_slots, intrinsic).
- **only_raw**: import raw as-is, `stat_quality='unverified'`, попадает в UNVERIFIED_ITEMS.md.
- **classifications** (core, subkind, has_perfect, links) применяются поверх раw.
