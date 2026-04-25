# divcalc.xyz — Architecture & Conventions

> Единый документ для всех чатов/агентов работающих над проектом. Читать ПЕРВЫМ перед любой задачей.

## 1. Что это
Калькулятор Division 2 — DPS, билды, статы, гайды. Работает на divcalc.xyz.

**Аудитория:** игроки PvE/PvP, теоркрафтеры. Основной язык — английский, русский — второй приоритет, далее de/fr/es.

**Монетизация:** AdSense (после 1k sessions/mo), partner links на игру.

## 2. Стек
| Слой | Технология | Назначение |
|---|---|---|
| SEO-страницы | Astro 6.1 SSG + @astrojs/svelte | Статические страницы оружий/сетов/гайдов, sitemap, structured data |
| Калькулятор | Svelte 5 (runes) SPA | Интерактивный билд-калькулятор, рендерится на клиенте |
| Хост | Caddy 2.11 + VPS Timeweb | TLS, hybrid Astro+SPA serving |
| Данные | SQLite (data.db) | Source of truth, в репо |
| Build | pnpm workspaces | Монорепо apps/astro + apps/web |

**Не добавлять без веских причин:** бэкенд-API, headless CMS, Next.js, k8s, docker, микросервисы.

## 3. Топология
```
divcalc.xyz/                    → Astro static (SEO landing, гайды, страницы предметов)
divcalc.xyz/spa/                → Svelte SPA (интерактивный калькулятор)
divcalc.xyz/data/*.json         → derived данные для SPA (из data.db)
divcalc.xyz/locales/{lang}/     → переводы (из data.db)
divcalc.xyz/api/                → PocketBase (если/когда понадобится)
```

VPS: `root@89.223.65.56` (Timeweb), Caddy serve из `/var/www/divcalc/{astro,spa}/`.

## 4. Single Source of Truth — данные
**Источник всего:** `data.db` (SQLite, в репо).

**Откуда наполняем data.db:**
- **Игровые файлы (распакованные из Division 2):** `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/`
  - `weapons.json` — все оружия с base damage, RPM, magazine, intrinsic attrs
  - `brands.json` — бренды с `attribute_uid` бонусами
  - `gearsets.json`, `brand_sets.json`, `green_sets.json`, `hunters_fury_set.json` — сеты
  - `talents.json`, `weapon_talents.json` — таланты
  - `named_items.json` — именные предметы
  - `attribute_dict.json` — словарь `attribute_uid` → `stat_key` (WeaponDamage→wd, CriticalHitChance→chc и т.д.)
  - `locale_*.json` — игровые локализации (если есть, проверь содержимое)
- **Ручные дополнения** (когда в игровых файлах нет/криво): отдельная таблица `manual_overrides` в БД, с пометкой почему override — чтобы видеть на ревью

**Языки:** en (primary), ru, de, fr, es. Через таблицу `translations(entity_type, entity_id, field, lang, text)`. Fallback на en если перевода нет.

**Запрещено:** ручные правки в `apps/web/public/data/*.json` или `apps/web/public/locales/*/*.json` — это derived артефакты, перезаписываются на build.

## 5. Pipeline
```
hunter_pipeline/for_site/*.json  ──┐
                                   ├──→ scripts/build_db.py ──→ data.db
manual_overrides (если нужны) ─────┘                              │
                                                                  │
                                          ┌───────────────────────┤
                                          ▼                       ▼
                            scripts/export_data.py     scripts/export_locales.py
                                          │                       │
                                          ▼                       ▼
                  apps/web/public/data/*.json    apps/web/public/locales/{lang}/*.json
                                          │                       │
                                          └────────┬──────────────┘
                                                   ▼
                                  ┌────────────────┴───────────────┐
                                  ▼                                ▼
                        apps/astro pnpm build           apps/web pnpm build
                                  │                                │
                                  ▼                                ▼
                            astro/dist                         web/dist
                                  │                                │
                                  └────────────┬───────────────────┘
                                               ▼
                                       deploy (CI/CD)
                                               ▼
                                  VPS /var/www/divcalc/{astro,spa}/
```

**Идемпотентность:** `rm -rf node_modules dist apps/web/public/data apps/web/public/locales && pnpm install && pnpm build` всегда даёт идентичный результат. Если нет — баг.

## 6. Что коммитим в репо

| Категория | Коммитим? |
|---|---|
| `data.db` | ✅ да (бинарник, ~10 МБ норм) |
| `scripts/build_db.py`, `export_*.py` | ✅ да |
| `hunter_pipeline/for_site/*.json` | ❌ нет (это input, лежит локально на машине; в репо хранить отдельно или на S3) |
| `apps/web/public/data/*.json` | ❌ нет (generated) |
| `apps/web/public/locales/**/*.json` | ❌ нет (generated) |
| `apps/astro/src/content/**/*.md` (если генерируются) | ❌ нет |
| Шаблоны контента (jinja/md-templates) | ✅ да |
| `deploy/Caddyfile` | ✅ да |
| `.github/workflows/*.yml` | ✅ да |

**В `.gitignore`:**
```
apps/web/public/data/
apps/web/public/locales/
apps/astro/src/content/weapons-*/
apps/astro/src/content/sets-*/
apps/astro/src/content/brands-*/
hunter_pipeline/
```

## 7. Обязательный стандарт записи в БД

**Главный принцип:** одна БД содержит ВСЁ что нужно сайту, в готовом виде. Фронт ничего не доcчитывает на лету, не склеивает 5 файлов, не fallback'ает между источниками. Один запрос → весь предмет на нужном языке.

### 7.1 На каждый предмет (item) в БД ДОЛЖНО быть:
| Поле | Источник | Обязательно |
|---|---|---|
| `slug` | slug_map.json (мост) или slugify(name_en) | ✅ |
| `game_id` | from raw (UID/identifier) | ✅ |
| `kind` | weapon / gear / brand / set / talent / mod | ✅ |
| `slot` | для gear: mask/backpack/chest/gloves/holster/kneepads; для weapons: primary/secondary/sidearm | ✅ если применимо |
| `core_attribute` | wd / armor / skill_tier / health | ✅ если применимо |
| `is_exotic` / `is_named` / `is_brand_set` / `is_green_set` / `is_seasonal` | bool флаги | ✅ |
| `dlc` | NULL / Warlords / Heartland | ✅ |
| `tier` / `rarity` | где применимо | ✅ если есть |
| `icon_url` | путь к иконке (если есть) | опц |
| `family` / `weapon_class` | AR / SMG / LMG / sniper / pistol / shotgun | ✅ для weapons |

### 7.2 Числовые статы (item_stats / weapon_specs):
- **Все числа уже в displayed-формате** (через формулу raw→display, применённую в build_db.py)
- НЕ raw-значения, НЕ "посчитает фронт"
- HSD-множители выверенные (через manual_overrides из legacy если raw неточный)
- Для оружий: `base_damage`, `rpm`, `magazine`, `reload_time`, `optimal_range`, `headshot_mult`, `intrinsic_attrs[3]`
- Для брендов/сетов: `bonuses[{pieces, stat, value}]` — value в финальном %

### 7.3 Переводы (translations):
- **На КАЖДОЕ поле, КАЖДЫЙ язык** (en, ru, de, fr, es)
- Поля: `name`, `description`, `flavor`, `source`, `talent_text`
- Если перевода нет на язык — fallback на en + флаг `_translated: false` в meta этой записи
- НЕТ "переводы оружия в одном файле, переводы талантов в другом" — всё через `translations(entity_type, entity_id, field, lang, text)`

### 7.4 Source / откуда дропается:
- Текстовое поле `source` на КАЖДОМ языке (en/ru/de/fr/es)
- Примеры: "Manhunt: Aaron Keener", "Targeted Loot: Tidal Basin", "Apparel cache", "Crafting"
- Если предмет дропает с конкретного босса — структурировано: `source_event_id` + `source_event_name_<lang>`
- Никогда не пусто на en (fallback)

### 7.5 Связи (через FK):
- `weapon → talents` (какие таланты применимы — ссылка на talent.id, не дубль текста)
- `brand → bonuses` (бонусы вынесены в item_bonuses, не inline в brand)
- `set → bonuses` (то же)
- `set → required_pieces[]` (если конкретные слоты требуются)
- `talent → applicable_weapon_classes` (массив family-имён)

### 7.6 Meta (трассировка):
- `_imported_at` — дата
- `_source_file` — какой raw_file послужил источником
- `_overrides_applied` — список manual_overrides применённых к записи (если были)
- `_translated_langs` — массив языков на которых перевод фактически есть
- В таблице `meta`: `game_version` (TU22), `db_built_at`, `import_source_hash`

### 7.7 Что фронт получает (export артефакты):
Для каждого языка `<lang>` экспорт даёт ОДИН набор:
```
apps/web/public/data/<lang>/
  items.json        — все items с уже подставленными переводами для <lang>
  talents.json      — все таланты с переводами
  bonuses.json      — связи бонусов
```

Фронт делает: `fetch('/data/' + currentLang + '/items.json')` и всё, никаких склеек.

## 8. Validation gates (build падает если)
- Любой `talent_id` в weapons не существует в talents
- Любой `brand_id` в named-gear не существует в brands
- В translations отсутствует `name` для существующего предмета на en (на других языках — fallback с флагом)
- `attribute_uid` в game files не имеет маппинга в stat_aliases.json
- JSON schema mismatch (zod/jsonschema проверка)
- Дубли slug в любой kind-группе
- Reference build St.Elmo + Strikers DD: WD ≠ 116216 ± 1, CHD ≠ 120% ± 0.1, body crit ≠ 707785 ± 100 → DPS-формула или импорт сломаны, build fail
- Counts расходятся с raw_files более чем на 5%

Скрипт: `scripts/validate.py`. Запускается в build pipeline ПЕРЕД pnpm build, и в pre-commit hook.

## 8. CI/CD (целевое)
GitHub Actions `.github/workflows/deploy.yml`:
1. **on push refactor/v2** → build → validate → deploy на `staging.divcalc.xyz`
2. **on push main** → build → validate → deploy на `divcalc.xyz`
3. SSH key через GitHub Secret `DEPLOY_SSH_KEY`
4. Smoke test после деплоя: `curl https://divcalc.xyz/data/weapons.json | jq '. | length' >= 300`

**Пока CI не настроен** — ручной деплой:
```bash
cd C:/Users/glukm/division2-calc
pnpm build
scp -r apps/astro/dist/* root@89.223.65.56:/var/www/divcalc/astro/
scp -r apps/web/dist/* root@89.223.65.56:/var/www/divcalc/spa/
ssh root@89.223.65.56 "systemctl reload caddy"
```

## 9. Контент-стратегия

### Generated (шаблонами)
Страницы предметов (`/weapons/[slug]`, `/sets/[slug]`, `/brands/[slug]`) — генерируются из шаблона + данных БД. Текст НЕ хардкодится: "{{ name }} — {{ kind }} ({{ rarity }}). Base damage {{ base_damage }}..." Шаблоны в `apps/astro/src/templates/`.

### AI-generated (evergreen)
Гайды, ротации, мета-обзоры — пишутся один раз AI, лежат в `apps/astro/src/content/guides/*.md` (это коммитим, обновляем редко). Статы внутри не хардкодим, ссылаемся на компоненты которые читают из БД.

### Запрещено
Хардкодить числа из БД в Markdown статьях. Через 3 патча игры всё устареет, искать-исправлять = ад.

## 10. SEO
- **Sitemap:** `@astrojs/sitemap` с i18n hreflang chunks → `divcalc.xyz/sitemap-index.xml`
- **Structured data:** Schema.org Product + BreadcrumbList на каждой странице предмета, Article на гайдах
- **IndexNow:** webhook на Bing/Yandex/Naver при деплое (`scripts/indexnow.py`)
- **Bot prerender:** Caddy матчит UA Googlebot/Bingbot/YandexBot и отдаёт пререндер (если SPA-страница) — реализовано через Puppeteer service
- **Canonicals + hreflang:** `<link rel="alternate" hreflang="en" href="..."/>` на каждой странице
- **robots.txt + llms.txt:** в `/var/www/divcalc/astro/`

## 11. Мониторинг
- **Bug-form:** Formspree → email `glukmalai@gmail.com` → IMAP poll → Telegram chat `398299572`
- **GitHub Issues:** poll → Telegram
- **Демоны:** `D:/Life/bug_watch_divcalc.py` + `mail_watch_divcalc.py`, запускаются автостартом
- **Аплайфт:** Sentry для рантайм-ошибок SPA, Lighthouse CI в pipeline (TODO)

## 12. Окружения
- **Local dev:** `pnpm dev` в apps/web и apps/astro
- **Staging:** `staging.divcalc.xyz` (TODO — пока нет)
- **Prod:** `divcalc.xyz` через Caddy на VPS

## 13. Расчётное ядро (DPS)
Формула проверена 1:1 с игрой:
```
DPS = base_damage × (1 + Σ additive) × (1 + Σ amplified) × crit_multiplier × target_modifier × expertise_bonus
```
Burn DPS = `SkillCurveFinal × 40 × (1 + Status%) × duration`.

Reference build для регрессий: St. Elmo's Engine + Strikers DD → WD 116216, CHD 120%, body crit 707785.

Код: `apps/web/src/build-state.svelte.ts` — `calculateStats()`.

## 14. Принципы (TL;DR)
1. **Single source of truth** — `data.db`, всё остальное derived
2. **Generated артефакты не в репо** — кроме самой БД
3. **Идемпотентный build** — clean install + build = тот же результат
4. **Validation gates** — build падает на расхождениях, не молчит
5. **Один способ делать вещь** — не три скрипта деплоя, не два формата для одних данных
6. **Всё в коде** — Caddyfile, CI, env, конфиги в репо
7. **Никаких ручных правок derived-файлов** — правишь БД или game-files importer
8. **Не over-engineer** — pure-client SPA, не нужен бэкенд

## 15. Антипаттерны (если поймал — стоп и переделывай)
- ❌ Правка `apps/web/public/data/*.json` руками
- ❌ Хардкод чисел из БД в Markdown статьях
- ❌ Деплой `git checkout` на VPS
- ❌ Manual Caddyfile edit на сервере (только через репо + reload)
- ❌ Языковой файл который не сгенерирован из БД
- ❌ Push сразу на main без staging проверки (когда staging будет настроен)
- ❌ Build без validate-шага

## 16. Roadmap архитектурный
1. ✅ ЧАТ 1: Миграция данных в SQLite + export pipeline (в работе)
2. ⏳ Validation gates (`scripts/validate.py`)
3. ⏳ GitHub Actions CI/CD
4. ⏳ Staging-домен
5. ⏳ Content templating вместо хардкоженных AI-md
6. ⏳ Sentry + Lighthouse CI
7. ⏳ Новые языки (de/fr/es)
8. ⏳ AdSense активация (privacy policy, cookie consent, ads.txt)
