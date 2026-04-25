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

## 7. Validation gates (build падает если)
- Любой `talentId` в weapons.json не существует в talents.json
- Любой `brand` в named-gear.json не существует в brands.json
- В locales отсутствует ключ для существующего предмета (на любом языке кроме en — fallback)
- `attribute_uid` в game files не имеет маппинга в `attribute_dict.json`
- JSON schema mismatch (zod/jsonschema проверка)
- Дубли id в любой таблице

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
