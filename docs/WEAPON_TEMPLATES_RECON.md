# weapon_templates.json — разведка

Источник: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/weapon_templates.json` (~379 KB)

## Структура верхнего уровня

- Корень: **объект-словарь**, ключ = имя шаблона (строка), напр. `player_weapon_assaultrifle_M4`.
- Записей: **479**.
- Каждая запись содержит 3 поля:
  - `uid` — 32-символьный hex-хэш
  - `parent` — имя родительского шаблона (наследование stats)
  - `stats` — объект с ТТХ

## Связь с weapon-instance

`weapons.json` — это **CraftingBlueprintItem** (чертежи), не реальные оружия.
Реальные экземпляры лежат в:
- `weapons_base.json`
- `weapons_exotic.json` (= `exotic_weapons.json`?)
- `named.json` / `named_items.json`

Поле связи: **`weapon_ref`** в weapon-instance → ключ шаблона в `weapon_templates.json` (имя, не UID).

```
weapons_exotic.json[i].weapon_ref = "player_weapon_assaultrifle_acr_t1"
                                          ↓
weapon_templates.json["player_weapon_assaultrifle_acr_t1"] = { uid, parent, stats }
                                          ↓ (parent inheritance)
weapon_templates.json["weapon_assaultrifle_v2"].stats (fallback fields)
```

## Поля stats (полный список, 30)

| Поле | Тип | Что |
|---|---|---|
| `dmg_min`, `dmg_max` | float | base damage range (по качеству 0.7—1.0) |
| `dmg_cover_min`, `dmg_cover_max` | float | урон стрелка из укрытия |
| `rpm` | float | выстрелов/мин |
| `mag` | int | магазин |
| `reload_ms` | int | reload (тактический) |
| `reload_empty_ms` | int | reload с пустого |
| `range_optimal` | float | оптимал |
| `range_long` | float | начало falloff |
| `range_max` | float | макс |
| `hsd` | float | headshot multiplier |
| `mult_body` / `_arms` / `_legs` | float | мульты по частям тела |
| `crit_dmg_mult` | float | мульт крит-урона (поверх chd?) |
| `crit_dist_min`, `crit_dist_max` | float | дистанции крит-окна |
| `suppression` | float | подавление |
| `aim_spread_min`, `aim_spread_max` | float | разброс при прицеливании |
| `spread_increase_ms` | int | скорость роста разброса |
| `time_to_min_acc_ms` | int | время до мин точности |
| `rpm_flux_min`, `rpm_flux_max` | float | вариативность rpm |
| `weapon_group` | string | категория (см. ниже) |
| `weapon_identifier` | string | модель ("M4", "AK47", …) |
| `bullets_per_shot` | int | для дробовиков (8 у 870) |

**Не хранится в шаблонах:**
- mod slots — отдельно `weapon_mod_slots.json`
- intrinsic attrs (3 встроенных стата экзотов) — в `weapons_exotic.json[i].attrs` или через `weapon_talents_full.json`
- burst/single/auto fire mode — нет явного флага; выводить эвристикой или вручную

## weapon_group (категория) — частоты

| Group | Кол-во |
|---|---|
| Pistol | 67 |
| SniperRifle | 63 |
| SubMachinegun | 62 |
| Shotgun | 51 |
| LightMachinegun | 49 |
| Rifle | 30 |
| Skill | 15 |
| Throwable | 11 |
| SignatureWeapon | 7 |
| MountedWeapon | 6 |
| AssaultRifle | 4 (legacy: новые AR могут быть `Rifle`) |
| RPG, ShieldPistol, DualWield, Bat | мало |

## Damage scaling

Не формула — разные tier'ы хранятся **разными шаблонами** (`_t1`, `_t2`, `_t3`) с собственными `dmg_min/max`. Импорту достаточно брать тот шаблон на который ссылается weapon-instance.

Для калькулятора: **`baseDamage = dmg_max`** (значение на максимальном качестве, эталон Division 2 калькуляторов).

## Наследование `parent`

Цепочка: конкретный (`player_weapon_assaultrifle_M4`) → версия v2 (`weapon_assaultrifle_v2`) → возможно ещё выше.
При импорте — **разворачивать**: для каждого шаблона собрать эффективный stats как merge(parent.stats, own.stats), своё перебивает.

## 10 примеров — см. raw в [`recon-samples/weapon_templates_samples.json`](recon-samples/) (TODO: дамп при первом импорте).

Краткая сводка типичных значений:

| Архетип | dmg_max | rpm | mag | reload_ms | range_opt | hsd |
|---|---|---|---|---|---|---|
| AR (M4) | 94 | 850 | 30 | 2100 | 35 | 1.55 |
| SMG (MP5) | 110 | 800 | 32 | 1800 | 16 | 1.5 |
| LMG (HK121) | 92 | 800 | 50 | 5600 | 30 | 1.85 |
| Marksman (SRS) | 620 | 54 | 7 | 1800 | 42 | 1.0 |
| Sniper exotic (AWM) | 2000 | 50 | 5 | 1900 | — | 1.0 |
| Shotgun (870) | 185 | 75 | 5 | 700 | 14 | 1.45 (+8 пуль) |
| Pistol (93R) | 112 | 700 | 15 | 1610 | 12 | 2.0 |
| Rifle (M16A2) | 160 | 300 | 30 | 2100 | — | 1.6 |
| Exotic AR (AK47-E) | 129 | 600 | 30 | 2200 | — | 1.55 |
