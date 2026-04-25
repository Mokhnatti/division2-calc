# data.db — схема

Источник правды для калькулятора Division 2.
Расположение: `data/data.db` (в корне репо).
Сборка: `scripts/build_db.py` ← `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/`
Экспорт: `scripts/export_data.py` → `apps/web/public/data/*.json` + `apps/web/public/locales/{lang}/*.json`

## Принципы

- БД — единый источник правды; экспорт детерминистичен.
- `manual_overrides` перебивает импорт на этапе экспорта (не в БД!) — чтобы каждый ребилд не терял ручные правки.
- `slug` (фронт) ≠ `game_uid` (игра) ≠ `template_name`. Связка через `items.id` (= наш slug).
- Языки: en, ru загружаются из игры; de, fr, es — пустые с fallback на en (фронт уже умеет).

## DDL

```sql
PRAGMA foreign_keys = ON;

-- ============================================================
-- Метаданные сборки (для трассировки)
-- ============================================================
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Ключи: game_version, db_built_at, hunter_pipeline_hash, schema_version

CREATE TABLE import_source_files (
  filename     TEXT PRIMARY KEY,        -- 'weapons_base.json'
  sha256       TEXT NOT NULL,
  size_bytes   INTEGER,
  imported_at  TEXT NOT NULL            -- ISO-8601
);

-- ============================================================
-- Семантический мост: имя стата в игре → slug на фронте
-- Заполняется из data/stat_aliases.json (вручную, ~25 строк)
-- ============================================================
CREATE TABLE stat_map (
  game_name      TEXT PRIMARY KEY,      -- 'WeaponDamage', 'CriticalHitChance'
  slug           TEXT NOT NULL UNIQUE,  -- 'wd', 'chc'
  category       TEXT,                  -- offensive|defensive|utility|weapon
  attribute_uid  TEXT                   -- из attribute_dict.json (опц., для обратного резолва)
);
CREATE INDEX idx_stat_map_uid ON stat_map(attribute_uid);

-- ============================================================
-- Мост slug ↔ game UID (старые id фронта сохраняем!)
-- Заполняется из data/slug_map.json (генерируется один раз
-- из текущих apps/web/public/data/*.json + ручная сверка)
-- ============================================================
CREATE TABLE slug_map (
  slug         TEXT PRIMARY KEY,        -- 'acr', 'providence_defense'
  game_uid     TEXT,                    -- UID из игры
  game_id      TEXT,                    -- 'GearBrand_511', 'player_weapon_…'
  kind_hint    TEXT,                    -- weapon|brand|gear_set|named|talent
  source       TEXT                     -- 'manual' | 'auto-slugify' | 'legacy-public'
);
CREATE INDEX idx_slug_map_uid ON slug_map(game_uid);

-- ============================================================
-- Все игровые предметы: единая таблица + дискриминатор kind
-- ============================================================
CREATE TABLE items (
  id           TEXT PRIMARY KEY,        -- наш slug ('acr', 'striker_s_battlegear')
  game_uid     TEXT UNIQUE,             -- UID из игры (для трассировки)
  kind         TEXT NOT NULL CHECK (kind IN
                ('weapon','brand','gear_set','named_gear','talent','weapon_mod')),
  subkind      TEXT,                    -- weapon: 'ar'/'smg'/'sniper'/...
                                        -- gear_set: 'red'/'blue'/'yellow'/'gearset'
                                        -- talent: 'weapon'/'chest'/'backpack'/'gloves'
  slot         TEXT,                    -- mask|chest|backpack|gloves|holster|kneepads
  core         TEXT,                    -- wd|armor|skill_tier (для брони)
  dlc          TEXT,                    -- NULL | 'warlords' | 'brooklyn' | ...
  is_exotic    INTEGER NOT NULL DEFAULT 0,
  is_named     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_items_kind_slot ON items(kind, slot);
CREATE INDEX idx_items_subkind   ON items(subkind);

-- ============================================================
-- ТТХ оружия (1:1 с items для kind='weapon')
-- Поля повторяют weapon_templates.stats; baseDamage = dmg_max
-- ============================================================
CREATE TABLE weapon_specs (
  item_id            TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  template_name      TEXT,                          -- 'player_weapon_assaultrifle_M4'
  parent_template    TEXT,                          -- 'weapon_assaultrifle_v2'
  weapon_group       TEXT,                          -- 'AssaultRifle' (raw из игры)
  weapon_identifier  TEXT,                          -- 'M4'
  base_damage        REAL NOT NULL,                 -- = dmg_max после merge с parent
  dmg_min            REAL,
  dmg_max            REAL,
  rpm                REAL,
  magazine           INTEGER,
  reload_ms          INTEGER,
  reload_empty_ms    INTEGER,
  range_optimal      REAL,
  range_long         REAL,
  range_max          REAL,
  headshot_mult      REAL DEFAULT 1.0,              -- = hsd
  crit_dmg_mult      REAL DEFAULT 1.0,
  bullets_per_shot   INTEGER DEFAULT 1,             -- 8 у дробовиков
  is_burst           INTEGER DEFAULT 0,             -- эвристика/override
  mod_slots_json     TEXT                           -- ["optic","muzzle","underbarrel","magazine"]
);

-- ============================================================
-- Бонусы за части сета/бренда + бонусы талантов
-- pieces:
--   1..6 — для брендов (1pc/2pc/3pc) и сетов (2pc/3pc/4pc/6pc)
--   NULL — для талантов и intrinsic-атрибутов экзотов
-- is_amp = 1 — мультипликативный бонус (поверх additive)
-- ============================================================
CREATE TABLE item_bonuses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  pieces      INTEGER,
  stat_slug   TEXT NOT NULL REFERENCES stat_map(slug),
  value       REAL NOT NULL,
  is_amp      INTEGER NOT NULL DEFAULT 0,
  source_uid  TEXT                                 -- attribute_uid из bonus, для трассы
);
CREATE INDEX idx_item_bonuses_item ON item_bonuses(item_id);

-- ============================================================
-- Связи между предметами: chest_talent / backpack_talent сетов,
-- weapon_talent дефолтный для оружия, named-bonded brand
-- ============================================================
CREATE TABLE item_links (
  item_id        TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  link_type      TEXT NOT NULL,        -- 'chest_talent' | 'backpack_talent' |
                                       -- 'default_talent' | 'brand'
  target_item_id TEXT NOT NULL REFERENCES items(id),
  PRIMARY KEY (item_id, link_type)
);

-- ============================================================
-- Расширение для талантов (1:1 с items для kind='talent')
-- ============================================================
CREATE TABLE talent_specs (
  item_id                 TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  applies_to              TEXT NOT NULL,    -- weapon|chest|backpack|gloves|holster
  bonus_type              TEXT,             -- additive|amplified|conditional
  bucket                  TEXT,             -- 'wd_additive'|'amp'|'kill_buff'|...
  has_perfect             INTEGER DEFAULT 0,
  applicable_classes_json TEXT,             -- ["ar","sniper"] | NULL = все
  condition_text_key      TEXT              -- ключ в translations для условия
);

-- ============================================================
-- Локализация — плоско. Любой entity, любой field, любой lang
-- ============================================================
CREATE TABLE translations (
  entity_type TEXT NOT NULL,    -- 'item' | 'stat' | 'ui' | 'category'
  entity_id   TEXT NOT NULL,    -- items.id или stat_map.slug или ui-key
  field       TEXT NOT NULL,    -- 'name' | 'description' | 'flavor' | 'note' | 'condition'
  lang        TEXT NOT NULL,    -- en | ru | de | fr | es
  text        TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, field, lang)
);
CREATE INDEX idx_translations_lookup ON translations(entity_type, entity_id, lang);

-- ============================================================
-- Ручные правки — перебивают импорт на этапе экспорта.
-- ВАЖНО: не применяются к БД при build, применяются при export.
-- Это позволяет ребилдить data.db с нуля без потерь.
-- ============================================================
CREATE TABLE manual_overrides (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type  TEXT NOT NULL,             -- 'item' | 'translation' | 'bonus' | 'spec'
  entity_id    TEXT NOT NULL,             -- items.id (или составной ключ для bonus/translation)
  field        TEXT NOT NULL,             -- 'base_damage' | 'name:ru' | 'bonus[2pc].value'
  value        TEXT NOT NULL,             -- сериализованное значение (число/строка/JSON)
  reason       TEXT NOT NULL,             -- 'игра показывает 175, фактически 170 (тестировано in-game)'
  source_link  TEXT,                      -- ссылка на reddit/wiki/issue
  created_at   TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_overrides_lookup ON manual_overrides(entity_type, entity_id, active);
```

## Пример выборки (контрольная)

```sql
SELECT t.text
FROM translations t
WHERE t.entity_type = 'item'
  AND t.entity_id   = 'st_elmo_s_engine'
  AND t.field       = 'name'
  AND t.lang        = 'ru';
```

## Пайплайн

```
hunter_pipeline/for_site/*.json  ─┐
data/stat_aliases.json (ручной)  ─┼─► build_db.py ──► data/data.db
data/slug_map.json (генерится)   ─┘                       │
                                                          │
                                manual_overrides ────────►├─► export_data.py
                                                          │     ├─► apps/web/public/data/*.json
                                                          │     └─► apps/web/public/locales/{lang}/*.json
                                                          │
                                                    validate.py (broken refs, schema)
```

`build_db.py` — пересоздаёт БД с нуля каждый раз (DROP+CREATE). Идемпотентно.
`export_data.py` — читает БД + накладывает manual_overrides → пишет JSON для фронта в формате `apps/web/src/build-state.svelte.ts`.
prebuild у `apps/web` и `apps/astro`: `pnpm exec python ../../scripts/export_data.py` (или Node-обёртка через child_process — обсудим).

## Открытые вопросы (нужно подтверждение перед build_db.py)

1. **`C:/Users/glukm/division2-calc/data/` уже забита файлами** (named.json, weapons_base.json, exotics.json, attribute_dict.json, …). Что это? Можно ли её очистить под `data.db` + `stat_aliases.json` + `slug_map.json`?
2. **Источник weapon-instance**: подтверди что брать `weapons_base.json` + `weapons_exotic.json` (или `exotic_weapons.json`?) + `named.json` (или `named_items.json`?). В hunter_pipeline есть и те, и те — какие актуальные?
3. **Burst-флаг и mod_slots**: эвристика (например AR `Rifle` + identifier `M16A2` → burst=1) или ручной список в `data/weapon_overrides.json`? Я бы сделал ручной список — детерминистичнее.
4. **Headshot multiplier**: брать из `weapon_specs.hsd` или из текущих frontend-данных (там уже выверено)? Игровое hsd = 1.0 для снайперок, а фронт обычно держит 1.5/2.0. Возможно требует override.
