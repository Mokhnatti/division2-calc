# divcalc.xyz: 90-дневный план запуска Astro+Svelte 5 гибрида с AI-контентом для пассивного дохода

**Главный вывод:** ниша Division 2 в 2026 — рабочая, но узкая. Реалистичный потолок 50–200K MAU за 12 месяцев и $500–$3,000/мес дохода к концу года. Текущие конкуренты (divisionbuilder, divtools, mxswat) — слабые по SEO, ни один не реализовал community-rated базу + патч-дей first-mover. Это и есть твой клин. Бюджет $50–200 на AI избыточен — реальная стоимость генерации 200 страниц + 10 long-form гайдов с batch API + prompt caching составит **$15–35**. Главный риск не конкуренция, а сам Division 2: в апреле 2026 пик 27K CCU на Steam после reveal Central Park DLC и Battle for Brooklyn — франшиза оживает перед Division 3, но на 30–50× меньше PoE/D4. Действуй сейчас, окно 12–24 месяца.

Стратегическая ставка: **Astro 5 SSG-обёртка над существующим Svelte 5 SPA** (без переписывания), 200 шаблонных страниц через **Claude Haiku 4.5 batch+cache** ($1/$5 за M токенов, Haiku 3.5 deprecated 19 апреля 2026), 10 long-form гайдов через **Claude Sonnet 4.6**, AdSense сразу с активацией Mediavine Journey при 1K сессий/мес (новый порог с января 2026, не 50K) и Raptive при 25K pageviews. Реддит /r/thedivision (369K subs) + патч-дей first-mover — главные рычаги трафика помимо SEO.

---

## План на 90 дней с командами и конфигами

### Неделя 1–2: Astro setup и legacy SPA wrap (HIGH priority, 8–12 дней)

Создаёшь Astro проект параллельно текущему SPA, не ломая прод. Все Svelte 5 компоненты переиспользуются как есть — `@astrojs/svelte@^8.0.4` поддерживает руны (`$state`, `$derived`, `$effect`) внутри Astro Islands без переписывания.

**Bootstrap команды:**
```bash
npm create astro@latest divcalc-astro -- --template minimal --typescript strict
cd divcalc-astro
npx astro add svelte sitemap
npm i nanostores @nanostores/svelte @nanostores/persistent sharp
```

**Критическая проверка peer-deps:** `@astrojs/svelte` v5/6 НЕ работает с Astro 5 (issue #12059). Нужен v7+ (текущий 8.0.4 от середины апреля 2026). Запусти `npx @astrojs/upgrade` чтобы синхронизировать версии.

**`astro.config.mjs` — готовый конфиг:**
```js
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://divcalc.xyz',
  output: 'static',
  trailingSlash: 'never',
  build: { assets: '_astro', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: { prefixDefaultLocale: false }, // EN на /, RU на /ru/
  },
  integrations: [
    svelte({ extensions: ['.svelte'] }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', ru: 'ru-RU' },
      },
      entryLimit: 45000,
      changefreq: 'weekly',
      chunks: {
        weapons: (i) => /\/weapons\//.test(i.url) ? i : undefined,
        sets:    (i) => /\/sets\//.test(i.url)    ? i : undefined,
        builds:  (i) => /\/builds\//.test(i.url)  ? i : undefined,
        brands:  (i) => /\/brands\//.test(i.url)  ? i : undefined,
      },
      serialize(item) {
        item.lastmod = process.env.LAST_MOD ?? new Date().toISOString();
        return item;
      },
    }),
  ],
});
```

**Decision-матрица hydration директив для твоих компонентов:**

| Компонент | Директива | Обоснование |
|---|---|---|
| DPS Calculator core | `client:load` | LCP-element, юзер пришёл считать |
| Gear picker (359 пушек) | `client:visible` | Длинный список, INP-budget |
| Mod selector | `client:visible` | Below-fold аккордеон |
| Charts/графики | `client:idle` | Не критично, через `requestIdleCallback` |
| Mobile filter drawer | `client:media="(max-width: 768px)"` | Только мобайл |
| Build URL parser | `client:only="svelte"` | Зависит от `window.location.hash` |
| Header / nav | без директивы | Pure SSR HTML |
| Legacy SPA shell `#build`/`#dps` | `client:only="svelte"` | Твой текущий SPA целиком |

**Migration steps (incremental wrap-not-rewrite, проверено для Svelte 5+Astro 5):**

1. Bootstrap Astro проекта в `/astro/` ветке, прод не трогать
2. Скопировать всё `src/` Svelte-дерево в `astro/src/legacy/`
3. Замаунтить весь legacy SPA как один `client:only` остров на `/spa/index.astro`:
   ```astro
   ---
   import LegacyApp from '../legacy/App.svelte';
   ---
   <html><head><title>Divcalc</title></head>
   <body><LegacyApp client:only="svelte" /></body></html>
   ```
4. Настроить Caddy `try_files … /spa/index.html` → проверить, что hash-роуты работают идентично
5. Добавить `BaseLayout.astro` с `<ClientRouter />`, hreflang, canonical
6. Сгенерировать первый тип SEO-страниц `/src/pages/weapons/[slug].astro` через `getStaticPaths` из существующего `weapons.json`
7. Подключить sitemap chunks → submit в GSC + Bing
8. Повторить для `/sets/`, `/brands/`, `/builds/[slug]`
9. Извлечь sub-features в named islands (DPS Calculator, Gear Picker)
10. Мигрировать межостровной state в **nanostores** (модуль `src/stores/build.ts` с `map<Loadout>` + `computed` для DPS) — `$state`-прокси не сериализуются через Astro→island границу
11. Включить `transition:persist="dps-island"` + `transition:persist-props` для калькулятора, чтобы loadout жил между навигациями
12. Удалить Puppeteer prerender для Astro-маршрутов (для `/weapons/*`, `/sets/*`, `/builds/*` он больше не нужен — это уже static HTML)

**Caddyfile (готовый snippet):**
```caddy
divcalc.xyz {
  encode zstd br gzip
  root * /var/www/divcalc/dist

  @astroAssets path /_astro/* /assets/*
  header @astroAssets Cache-Control "public, max-age=31536000, immutable"

  @html path *.html /
  header @html Cache-Control "public, max-age=0, s-maxage=300, must-revalidate"

  @seo path /sitemap-*.xml /robots.txt
  header @seo Cache-Control "public, max-age=3600"

  header {
    Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    -Server
  }

  try_files {path} {path}/ {path}.html /spa/index.html
  file_server { precompressed br zstd gzip }
}
```

`try_files` обходит: `/weapons/st-elmos-engine` → нет файла → `/weapons/st-elmos-engine/` (Astro dir) → `.html` → fallback `/spa/index.html` для legacy hash-роутов. Brotli требует `xcaddy build --with github.com/dunglas/caddy-cbrotli`.

**URL-структура (финальная, plural везде):**
```
/weapons/st-elmos-engine        ← detail
/weapons/                       ← archive
/sets/strikers-battlegear
/builds/st-elmo-striker-tu22
/brands/wyvern-wear
/ru/weapons/st-elmos-engine     ← RU зеркало
```
Slug rules: lowercase, hyphenated, ASCII, апострофы режутся (`St. Elmo's Engine` → `st-elmos-engine`, не `st-elmo-s-engine`). Hreflang в `<head>` всех страниц + автоматически в sitemap через `i18n` опцию.

### Неделя 3–4: Контент-pipeline, sitemap-генератор, schema (HIGH, 6–8 дней)

**Sitemap lastmod через git log** (не file mtime — он ломается в Docker):
```js
// scripts/get-lastmod.js
import { execSync } from 'node:child_process';
export function getLastMod(filePath) {
  try {
    return execSync(`git log -1 --format=%cI -- ${filePath}`).toString().trim();
  } catch { return new Date().toISOString(); }
}
```

**JSON-LD шаблон для weapon page (Product-shaped):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "BreadcrumbList", "itemListElement": [
      {"@type":"ListItem","position":1,"name":"Home","item":"https://divcalc.xyz/"},
      {"@type":"ListItem","position":2,"name":"Weapons","item":"https://divcalc.xyz/weapons/"},
      {"@type":"ListItem","position":3,"name":"Assault Rifles","item":"https://divcalc.xyz/weapons/ar/"},
      {"@type":"ListItem","position":4,"name":"St. Elmo's Engine"}
    ]},
    { "@type": "Product",
      "name": "St. Elmo's Engine",
      "description": "Exotic AR with Allegro/System Corruption talents...",
      "category": "Exotic Assault Rifle",
      "additionalProperty": [
        {"@type":"PropertyValue","name":"Base Damage","value":"11500"},
        {"@type":"PropertyValue","name":"Rounds Per Minute","value":"780"},
        {"@type":"PropertyValue","name":"Magazine Size","value":"70"}
      ],
      "aggregateRating": {"@type":"AggregateRating","ratingValue":"4.9","ratingCount":"412"}
    }
  ]
}
```

**Critical schema-факты для 2026:** HowTo rich results убиты в сентябре 2023, FAQPage rich results ограничены gov/health с августа 2023, но **FAQ-разметка по-прежнему имеет наивысшую корреляцию с цитированием в Google AI Overviews** (3.2× по данным SearchEngineLand). Так что FAQ-блоки на каждой странице — обязательно. Для калькулятора — co-type `SoftwareApplication` + `WebApplication` (только `VideoGame` без второго типа не даёт rich result). `applicationCategory: "GameApplication"`.

**IndexNow webhook** (Bing+Yandex+Naver индексируют за 30 минут вместо 48 часов; Google не поддерживает IndexNow и вряд ли будет):
```js
// scripts/indexnow.js
const KEY = 'your-32-char-key';
fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({
    host: 'divcalc.xyz', key: KEY,
    keyLocation: `https://divcalc.xyz/${KEY}.txt`,
    urlList: changedUrls // до 10K за раз
  })
});
```
Положи `[KEY].txt` в корень. Запускай при каждом publish/update контента.

**Google ping endpoint deprecated в июне 2023** — удали из любого старого кода. Sitemap submit только через robots.txt директиву `Sitemap:` + ручную регистрацию в GSC и Bing Webmaster Tools.

### Неделя 5–8: AI-генерация 30 priority страниц + Sonnet voice template (HIGH, 12–15 дней)

**Priority-30 (S-tier, что генерируем первым):**
- 10 экзотиков: St. Elmo's Engine, Iron Lung, Tipping Scales, Eagle Bearer, Big Alejandro, Memento, Coyote's Mask, Ridgeway's Pride, Bullet King, Regulus
- 8 meta сетов: Striker's Battlegear, Heartbreaker, Hunter's Fury, Negotiator's Dilemma, Eclipse Protocol, Aegis, Foundry Bulwark, Future Initiative
- 4 featured билда (твои existing): St. Elmo + Strikers DD, Iron Lung Ardent + Burn, Tipping Scales × Eagle Bearer MMR, Big Alejandro × Strikers LMG
- 8 high-traffic брендов: Wyvern Wear, Providence Defense, Grupo Sombra, Ceska, Murakami, Walker Harris, Overlord Armaments, Sokolov

**Воркфлоу с локальной Llama (бесплатно) → Haiku (полировка) → human edit:**
1. HorizonLLM (75 t/s) генерирует черновик из JSON-данных (бесплатно)
2. Claude Haiku 4.5 переписывает под твой voice template (batch API + 5min ephemeral cache)
3. Человек 8–12 минут редактирует intro, pros/cons, opinion-секции

**Master-prompt для weapon page (Haiku):**
```
SYSTEM:
You are an experienced Division 2 player and theorycrafter writing for divcalc.xyz.
Voice: factual, slightly opinionated, written for someone who already knows basics.
You NEVER calculate numbers — only use values from the data provided.
If data is missing, write [verify] in brackets.
Banned: "delve", "in conclusion", "in summary", "navigate the", "tapestry", "robust", 
"in today's fast-paced".
Output clean Markdown. H2/H3 only. No H1.

USER:
<weapon_data>{{WEAPON_JSON}}</weapon_data>
<talent_text_verbatim>{{TALENT_TEXT}}</talent_text_verbatim>
<calculated_dps>{{DPS_AT_VARIOUS_STACKS}}</calculated_dps>
<top_builds_using_this_weapon>{{BUILDS_JSON}}</top_builds_using_this_weapon>
<comparison_weapons>{{COMPARISON_TABLE_JSON}}</comparison_weapons>
<voice_seed>
Adjective: {{ROTATE: clinical|scrappy|methodical|no-nonsense|deliberate}}
Hook pattern: {{1-8: use-case|numbers-first|meta-state|comparison|patch-context|problem-solved|who-this-is-for|contrarian}}
</voice_seed>
<reviewer_notes>{{2-3 BULLETS FROM HUMAN PLAYER}}</reviewer_notes>

Write a 1,500-1,900 word weapon page following structure:
H2: At a Glance (bullets) → H2: Full Stats Table → H2: Weapon Talent (verbatim quote + math) 
→ H2: Top Builds (3 with linkout) → H2: PvE vs PvP → H2: Pros & Cons → H2: Comparison 
(table 4-row) → H2: FAQ (5-8 Q&A, real player phrasing) → H2: Verified vs In-Game

Rules:
- First sentence under each H2 must be a self-contained answer (AI Overview bait)
- Use ONLY DPS numbers from <calculated_dps>
- FAQ phrased as real player would type into Reddit
- End: "Last reviewed: {{DATE}} · TU22.1 · Verified vs in-game"
```

**Критически важно для AI-detection avoidance в 2026** (после волны manual actions июнь 2025 и марта 2026):
- Не публиковать пачкой — **10–20 страниц/день максимум**, растягивать на 2–4 недели (publication velocity сама по себе сигнал)
- **Реальный named author** с активной историей (Twitch/YouTube/Reddit/clan) — Lily Ray (декабрь 2025): отсутствие авторства — самый частый паттерн у дероутнутых сайтов
- Per-page editorial micro-edits — менять 2–3 предложения, добавить 1 in-game observation
- "Verified vs in-game" badge + changelog с инициалами рецензента
- Никогда не считать DPS через AI — все числа инжектишь pre-computed из калькулятора, инструктируешь "[verify]" если данных нет

**Cost calculation для всего проекта:**

| Этап | Tokens (in/out) | Без оптимизации | Batch (-50%) + Cache (-90%) |
|---|---|---|---|
| 200 weapon/set/brand на Haiku 4.5 ($1/$5) | ~4.1K in / 2.4K out per page | $3.20 | $1.40 |
| 10 build guides на Sonnet 4.6 ($3/$15) | ~8K in / 5K out per guide | $0.99 | $0.50 |
| Voice-tuning итерации (5–7 prompt versions) | – | $5–10 | $5–10 |
| Retries + re-runs (3× буфер) | – | – | $5–10 |
| **ИТОГО реалистично** | – | $9–15 | **$15–35 с буфером** |

Ультра-комфортно укладывается в $50–200. Остаток на патчевые re-runs (TU22.2, TU22.3 — каждый ~$3–5) и Sonnet humanization passes на flagged-as-too-AI страницах.

### Неделя 9–12: Остальные 170 страниц + 4 long-form Sonnet гайды + AdSense (MED, 10–12 дней)

170 оставшихся weapons/sets через batch API. 4 long-form Sonnet-гайда (каждый 2,800–4,000 слов, 30–45 минут human review):
1. "St. Elmo Striker DPS Build (TU22.1, 2026) — Complete Guide"
2. "Iron Lung Ardent Burn Build — Solo Legendary Viable"
3. "Tipping Scales × Eagle Bearer MMR — High-DPS PvE"
4. "Big Alejandro × Strikers LMG — Sustained Fire Build"

**Активация AdSense** — у тебя уже approved (на жену, TH адрес+банк). День 1: только manual placements на static страницах, минимальные Auto Ads (только anchor + vignette с low frequency, in-page форматы выключить — Auto читает SPA-роуты неправильно). Калькулятор пока без рекламы (низкий traffic, не стоит UX-урона).

**Размещение на static weapon/set страницах** (target 1 ad на 250–400 слов, 4–5 visible на десктопе, 3 мобайл):
```
HEADER NAV
H1
[AD #1: 728x90 above-fold]
First 2-3 paragraphs              [AD #4: 300x250
[AD #2: in-content native after ¶3] sidebar sticky]
More content + tables             [AD #5: 300x600]
[AD #3: in-content after section]
Related items
[STICKY FOOTER 320x50 mobile only]
```

**Размещение на калькуляторе** (включается при 1K+ sessions/мес):
- Sidebar 300x250 above-fold OK (high engagement, не блог)
- **Под результатом DPS — высший RPM** (achievement moment, юзер dwell-ит)
- Между collapsible секциями детализации
- Sticky footer на мобайле, dismissible
- НЕ инжектить между активными inputs

**Crucial для SPA RPM:** инструментировать каждое значимое изменение state как virtual pageview через `gtag('event', 'page_view')` или Astro view-transitions с push-state. Без этого один сеанс = одна страница и pageview-counted сети (AdSense, Ezoic, Monumetric, Nitro) недосчитают 3–6× твоих реальных pageviews.

---

## Контент-план

### 30 priority pages roadmap

Стратегия "patch-day first-mover" + community-rated database (главный wedge против fandom — wikis отвечают "что это?", калькулятор отвечает "что собрать?"). Все 30 priority pages — **build/calculator/comparison intent**, не описательные.

### Долгосрочный roadmap 200 страниц

| Wave | Контент | Кол-во | Tier-priority |
|---|---|---|---|
| 1 (нед. 5–6) | S-tier экзотики + meta сеты + 4 featured builds | 30 | S |
| 2 (нед. 7–8) | A-tier red weapons (high-DPS legendaries) | 50 | A |
| 3 (нед. 9–10) | B-tier остальные exotics + named items | 50 | B |
| 4 (нед. 11–12) | Бренды + utility weapons + niche sets | 70 | C |
| 5 (мес. 4+, на патч) | TU22.2/22.3 weapon updates, season-меты | rolling | refresh |

**Топ-50 long-tail keywords** (сгруппированы по приоритету, оценки MSV из Keyword Surfer + Google Trends, Ahrefs/SEMrush не использовались):

**Tier S — tool-intent, низкая релевантность wiki, делаем в первую очередь:**
- "division 2 build calculator" (1.6–2.4K), "division 2 dps calculator" (700–1.1K), "division 2 build maker", "division 2 weapon damage calculator", "division 2 stat calculator", "division 2 ttk calculator", "best division 2 builds 2026" (2–4K, конкуренция HIGH), "division 2 tu22 builds", "division 2 meta builds 2026"

**Tier A — build-specific (highest tool-conversion):**
- "st elmo striker build" (1.2–2K), "iron lung build pve" (250–500), "tipping scales build", "heartbreaker lmg build 2026" (600–1K), "hot shot headhunter build" (XP-farm intent, very high conversion), "aegis tank build division 2" (новый сет, wikis behind), "negotiator's dilemma build legendary", "striker dps build 2026", "best raid dps build division 2", "division 2 solo legendary build"

**Tier B — comparison/data-driven (только калькулятор может ответить):**
- "st elmo vs heartbreaker", "division 2 highest dps weapon 2026", "division 2 best exotic 2026", "division 2 crit cap" (стат-вопрос — answer первым предложением для AIO), "division 2 weapon damage cap", "division 2 best ar 2026", "division 2 best lmg 2026"

**Fandom-evasion правило:** избегать чистых дескриптивных запросов "division 2 [item name]" — всегда модификатор intent: *build, calculator, dps, vs, best, 2026, pve, pvp, raid, solo*. Fandom отстаёт на 1–4 недели после патчей — публикуй TU22.X страницы в течение 24 часов и захватывай transient queries через IndexNow.

---

## Метрики и KPI

GSC + GA4 на EN, Yandex Metrica добавишь через 6 мес для RU. Что мерить:

**1 месяц после launch:**
- Indexed pages: 150–200 из 200+ (sitemap submit + IndexNow)
- GSC Impressions: 1K–5K
- GSC Avg position: 25–60 (первые long-tails появляются)
- AdSense RPM: $1–3 EN (gaming = низкий CPM вертикаль)
- MAU: 500–3K
- Месячный доход: $0–15

**3 месяца:**
- Indexed: 200/200
- Impressions: 10K–30K
- CTR: 1.5–3%
- Avg position: 15–35
- MAU: 3K–10K
- Доход: $10–60 (AdSense + начало Mediavine Journey, порог 1K сессий с янв 2026)

**6 месяцев (decision point — переход на Mediavine/Raptive):**
- Impressions: 50K–150K
- MAU: 15K–40K
- AdSense RPM: $1.5–3, **Mediavine Journey RPM: $5–12 в gaming**
- Доход: **$200–500/мес**
- Reddit /r/thedivision: накопил 500+ comment karma, посты с upvotes 100+, появление в community resources sidebar

**12 месяцев:**
- MAU: 50K–100K (если Division 2 roadmap держится)
- Raptive (порог 25K pv lowered Q4 2025): RPM $15–25 gaming
- Доход: **$1,000–3,000/мес**

**Когда переходить:**
- AdSense → Mediavine Journey: **сразу при 1K sessions/мес** (новый порог январь 2026, RPM lift 3–5× для gaming Tier-1)
- Mediavine Journey → Raptive: при 25K pv/мес, если 50%+ Tier-1 трафика (Raptive RPM $15–25 vs Mediavine Journey $5–12 в gaming)
- Raptive → split-test Nitro: при 100K MAU (Nitro = gaming-native, тот же сток что у PvPoke, LeekDuck, RoyalRoad; "2–4× AdSense" в gaming pop-culture)
- **Никогда не пробовать Monumetric**: они блокируют "Video Games (Casual & Online)" по умолчанию

---

## Реальные кейсы и уроки

**light.gg (Destiny 2)** — ближайший аналог по модели. ~17.8M visits/мес, **$2,800/мес Patreon (1077 paid @ $2.60 avg)** — но это вспомогательно: основной доход от display ads ~$40–60K/мес при их трафике. Стратегия: API-driven база каждого оружия + community-voted "god rolls" (35M+ guardians проголосовали) + патч-дей first-mover. Заняло ~7 лет до текущей шкалы.

**d4builds.gg** — самая показательная indie-history. Один человек, ~20 страниц, привязан к creator-бренду Rob2628. Трафик: декабрь 2024 — 5.37M, ноябрь 2025 — 1.3M, март 2026 — 2.97M. Чисто сезонный, но при D4-патче выстреливает в миллионы. Урок: **tight build coverage + creator brand** работает.

**maxroll.gg** — 28.5M visits/мес, мульти-игровой ARPG-хаб, мид-7-figure ARR. Direct traffic 62–69% (бренд recall) — недостижимо для соло-проекта в первый год.

**d2.maxroll.gg (Division 2 sub на maxroll)** — отрезвляющий потолок: **всего 11.86K visits/мес** даже под зонтиком maxroll. Это твой потолок-ориентир для D2-only сайта первого года. Реалистичный TAM Division 2: ~300–500K monthly active EN-speaking игроков, из которых build-curious 30–50% = 100–200K addressable.

**pob.cool / Path of Building Community Fork** — open-source, GitHub-форк после ухода оригинального автора, стал **standard форматом** для PoE (все импортируют PoB-strings). Никакого revenue, но infrastructure-роль = недосягаемая позиция.

**GGRecon** (gaming/esports паблишер) — **закрылся в 2024 после HCU сентября 2023**. Урок: контент-thin/листиклы умирают, interactive tools — нет.

**Текущее состояние Division 2 ниши апрель 2026:** Steam пик 27,482 CCU 8 марта 2026 (+400% от baseline), 369K subscribers /r/thedivision, Ubisoft подтвердил roadmap 2026 с crossplay, Realism Mode, Central Park DLC, Battle for Brooklyn. Никто из текущих indie tools (divisionbuilder, divtools, mxswat, shdintel) не реализовал community-rated database. Это твой главный wedge.

**Топ-5 actionable insights (сжатые):**
1. **Patch-day first-mover** — все 200 страниц должны обновляться в течение 24 часов после TU. Build a JSON pipeline сейчас.
2. **Community-rated database** — UGC layer ("PvE meta", "PvP meta", "Legendary viable" по голосованию) — это то, что есть у light.gg и нет ни у одного D2-tool.
3. **Стать import/export стандартом** — определи build-string format, Discord-bot, OCR из скриншотов. Ты становишься инфраструктурой.
4. **Reddit-first launch** — лидируй полезным free калькулятором, не маркетинг-питчем. Аккаунт ≥30 дней + 500 comment karma BEFORE первой ссылки. 9:1 ratio (коммент 9 чужих постов на 1 свой). Modmail pre-clearance для tool launches.
5. **Infrastructure-фичи, которые wikis не повторят** — weekly vendor tracker, Recombinant calculator, build optimizer "given my stash → best DPS Striker", TTK/breakpoint vs enemy archetype.

---

## Финансовый прогноз 12 месяцев

Все цифры — реалистичные диапазоны для EN-only first 6 месяцев, с учётом:
- Gaming = низкая RPM-вертикаль (AdSense $1–3 RPM против $30+ в food/finance)
- 47% десктопных геймеров используют AdBlock; в гейминг-tool среде до 60% — твоя monetizable impression base ~половина raw трафика
- Q4 (окт–дек) RPM на 30–60% выше Q1
- AdSense на TH-адрес жены — Thai personal income tax 5–35% progressive, первые ~150K THB/год (~$4,200) tax-free

| Месяц | Visitors/мес | Сеть | Доход/мес | Заметки |
|---|---|---|---|---|
| 1 | 200–1,000 | AdSense | $0–5 | Launch, 200 страниц индексируются |
| 2 | 1K–3K | AdSense | $3–15 | Reddit warmup, backlinks |
| 3 | 3K–7K | AdSense + apply Mediavine Journey | $10–40 | Journey approval 3–4 нед |
| 4 | 7K–12K | **Mediavine Journey live** | $40–120 | 3–5× lift над AdSense |
| 5 | 12K–20K | Mediavine Journey | $80–250 | Оптимизация ad-placements |
| 6 | 20K–30K | Journey или apply Raptive (25K pv) | $200–500 | Decision point |
| 7 | 30K–45K | **Raptive** | $500–900 | Switch lift 20%+, Q4 boost подходит |
| 8 | 45K–60K | Raptive | $800–1,500 | |
| 9 | 60K–75K | Raptive | $1,200–2,000 | Q4 RPM peak начинается |
| 10 | 75K–90K | Raptive | $1,800–2,800 | Q4 |
| 11 | 90K–100K | Raptive | $2,000–3,200 | Декабрь — пик года |
| 12 | 100K+ | Raptive + test Nitro split | $1,800–3,000 | Q1 dip; Nitro для gaming-native |

**Realistic 12-month gross:** **$8,500–$15,000.** На run-rate $2,500/мес к месяцу 12 — годовая траектория $30K–$50K если трафик плато, $60K+ если удвоится.

**Cost structure:**
- AI tokens (одноразово): **$15–35 на полную генерацию 200+10**
- Patch refresh tokens: ~$3–5 на каждый TU патч (4–6 патчей/год = ~$20–30/год)
- Domain: $0 (уже владеешь)
- Hosting: $0–20/мес (Cloudflare Pages бесплатно)
- AdSense/Mediavine setup fees: $0
- Stripe fees если включишь $1–2/мес "remove ads" subscription: 3% + $0.30/tx

**Net profit реалистично:** ~$2,300–$2,400/мес к концу года 1, до тайских налогов. Cumulative gross год 1: $8,500–$15,000. Год 2 при стабильном Division 2 контенте + roadmap-апсайд (Resurgence mobile, Division 3 buzz): $30K–$80K если игра не deprioritized.

**Дополнительные revenue streams (5–15% к ad-доходу при текущих масштабах, до 20–40% при community development):**
- Ko-fi tip jar: 0.05–0.3% visitors tip ($3–5 avg) → ~$50–200/мес при 50K MAU
- Patreon $1/$3/$5 tiers (cosmetic supporter badge в shared builds): 0.1–0.5% conversion
- Subscription "remove ads + supporter badge" $1–2/мес через Stripe direct: 0.5–2% conversion → **$375–$1,500/мес при 50K MAU** (часто equal или выше потерянного ad-revenue от тех же юзеров с AdBlock)
- Boost-services affiliate (kboosting, dving 5–15% commission) — аккуратно, может конфликтовать с user trust

## Заключение и главные риски

**Самый высоколеверажный шаг прямо сейчас:** запускать Astro wrap не как rewrite, а как progressive enhancement. Существующий Svelte 5 SPA остаётся `client:only` островом, 200 SEO-страниц нарастают вокруг него за 12 рабочих недель. Бюджет AI избыточен в 5–10 раз. Реальный bottleneck — **human review time** (33 часа на 200 страниц при 10 мин/страницу + 3–4 часа на каждый Sonnet-гайд).

**Наибольший внешний риск — не конкуренция, а сам Division 2.** Roadmap 2026 — самый позитивный сигнал за 3 года, но если Ubisoft deprioritized франшизу после Battle for Brooklyn, твой потолок MAU обрезается ~50%. Хеджирование: build-string format и Recombinant calculator делают тебя инфраструктурой, что переживает спад популярности (как pob.cool пережил все спады PoE).

**Наибольший внутренний риск — AI-content penalty.** Volna manual actions июнь 2025 + март 2026 показала, что Google активно наказывает за scaled content abuse. Митигация прописана детально: stagger 10–20 страниц/день, named author с Twitch/Reddit history, per-page editorial micro-edits, "Verified vs in-game" badge, никаких AI-расчётов DPS (только pre-computed injection). При соблюдении этих правил ZacJohnson-style деиндекс не грозит.

**Окно действий — следующие 12–18 месяцев** до того, как либо (а) кто-то ещё построит community-rated D2 базу, либо (б) Ubisoft выпустит официальный SEO-friendly tool, либо (в) Division 2 совсем затухнет перед Division 3. После трёх квартальных Mediavine→Raptive переключений и стабильного $2,500+/мес run-rate ты в позиции либо удваивать (Division 3 prelaunch buzz, Resurgence mobile), либо продавать сайт через FE International / Tiny Acquisitions за ~30–40× месячный profit.