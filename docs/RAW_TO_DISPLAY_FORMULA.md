# raw → display формула: что нашлось

## TL;DR — формулы НЕТ

**В коде калькулятора нет преобразования raw→display.** Фронт читает уже готовые "displayed" числа. Эти числа исторически приходили из `data/_legacy/weapons_base.json` (curated, hand-tuned для калькулятора), и `packages/data/scripts/migrate.ts` копирует их 1:1 в свою схему.

Это означает: **legacy = source of truth для displayed-значений**. Формулы raw→display не существует.

## Что искали

| Что | Где смотрели | Найдено |
|---|---|---|
| Damage scale curve | `data/raw/formulas.json` | Нет — там только DOT durations, armor mitigation, crit, ammo_by_weapon_type |
| Damage scale curve | `data/raw/attribute_dict.json` ключ `WeaponDamage` | Указан `curve_name: "WeaponDamage"` но самой кривой в выгрузке нет |
| Transform функция | `apps/web/src/build-state.svelte.ts` | Нет |
| Transform функция | `packages/formulas/` | DPS-расчёт от готового `baseDamage`, не масштабирование |
| Migration копирование | `packages/data/scripts/migrate.ts` | Прямое копирование legacy (см. ниже) |

## Доказательства из кода

**`packages/data/scripts/migrate.ts:534`** — миграция legacy → новая schema:
```ts
baseDamage: w.dmg,            // legacy.dmg = уже готовое 58897
rpm: w.rpm,
magazine: w.mag,
reloadSeconds: w.reload,      // legacy.reload = уже 1.91 sec
headshotMultiplier: w.hsd ? 1 + w.hsd / 100 : 1.5,   // legacy.hsd=65 → 1.65 mult
```

Никакого `* gearScoreCurve(40)` или `* WT5_MULT`. Просто берёт legacy-число.

## HSD: понимание

| Layer | Формат | Пример (ACR) |
|---|---|---|
| game raw | multiplier | `1.55` |
| legacy curated | percent (выверено вручную, может быть `+10` от raw) | `65` |
| frontend internal | multiplier | `1 + 65/100 = 1.65` |

Расхождение `1.55 → 65` (а не 55):
- Похоже legacy включает базовое усиление от платформы Division 2 (раньше +10% HSD от мирового тира?), либо тонко выверено по in-game crit display.
- В коде нет `+10`, конвертация только `1 + percent/100`.
- Вывод: legacy.hsd значения нужно сохранить as-is (manual_overrides), они ground truth.

## Что это значит для миграции в data.db

Согласно ARCHITECTURE.md §7.2 ("Все числа уже в displayed-формате"):

**Стратегия импорта (предлагаемая):**

1. Импорт оружий с приоритетом **legacy → raw**:
   - Для weapon, который есть в `data/_legacy/weapons_base.json` (matched по name) → берём `dmg/hsd/reload/range/mag/rpm/slots` из **legacy**, остальные метаданные из raw (`weapon_group`, `weapon_identifier`, mod_slot details, intrinsic attrs).
   - Для weapon только в raw (новые в TU22, не было в legacy) → импортим raw как-есть, помечаем `_stat_quality: 'unverified'`. Эти 57+ оружий потом руками выверять.

2. Альтернатива: записать в `manual_overrides` все legacy displayed-stats, build_db применяет overrides поверх raw-импорта. Минус: 175×5 = 875 override-записей по weapons + 58×5 по exotic = ~1163, шумно.

3. **Чистый путь, который выбираю по умолчанию:** не делать overrides на каждое weapon-stat, а ввести **`stat_source` поле** на уровне записи: `{base_damage: 58897, base_damage_source: 'legacy_curated' | 'raw_estimate'}`. Чисто и видно где легасы, где сырые.

## Что НЕ нашлось — actionable

- **Damage curve** — её, видимо, надо снимать с in-game UI вручную или искать в Snowdrop dump'ах с большим контекстом (raw_files целиком, не только for_site/). Сейчас вне scope.
- Если кому-то понадобится формула на будущее (новые weapons → автомасштаб) — нужен снэпшот пар (raw_dmg_max, displayed_dmg) на 200+ оружий → линейная регрессия. У нас 175 пар уже сейчас (matched после фикса diff-скрипта). Можно посчитать как ratio mean/median → коэффициент или фит линейной модели.

**Гипотеза для проверки** (по 1 точке): `displayed_dmg = raw_dmg_max × K`, где K = 58897 / 113 ≈ 521. Проверим на нескольких oruzhiy после rerun diff-скрипта.
