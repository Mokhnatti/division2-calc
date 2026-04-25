# SEO Infrastructure — divcalc.xyz

> Snapshot: 2026-04-25. Owns sitemap, structured data, meta-tags, robots/llms, IndexNow,
> bot prerender. Read together with `ARCHITECTURE.md` (§10).

## 1. Sitemap

`@astrojs/sitemap` integration in [apps/astro/astro.config.mjs](../apps/astro/astro.config.mjs):

- `entryLimit: 45000` — single sitemap-0.xml is fine for current site size.
- i18n: `en` + `ru` produce `<xhtml:link rel="alternate" hreflang="...">` per URL.
- `filter` excludes `/spa/*` and `/api/*` from sitemap.
- `serialize` sets:
  - `lastmod` from `LAST_MOD` env (set in deploy script) or `new Date()` at build time.
  - `changefreq` + `priority` per URL bucket:
    - home → `daily`, 1.0
    - section indexes (`/weapons/`, `/sets/`, `/brands/`, `/builds/`) → `weekly`, 0.9
    - item pages (`/weapons/<slug>`, `/sets/<slug>`, `/brands/<slug>`) → `monthly`, 0.8
    - builds → `weekly`, 0.7

**Output URLs:**
- `https://divcalc.xyz/sitemap-index.xml` — index
- `https://divcalc.xyz/sitemap-0.xml` — actual entries

**Future locales (de/fr/es)** — when pages exist add codes to `i18n.locales` *and* the
sitemap `i18n.locales` map. Empty locales 404 in Astro, do NOT add prematurely.

## 2. Structured data (Schema.org)

| Page | Schemas |
|------|---------|
| `/` (index) | `WebSite` + `SearchAction`, `Organization` |
| `/weapons/<slug>` | `BreadcrumbList`, `Product` (with `additionalProperty` for stats) |
| `/sets/<slug>` | `BreadcrumbList`, `Product` (bonuses as properties) |
| `/brands/<slug>` | `BreadcrumbList` |
| `/builds/<slug>` | `BreadcrumbList`, `Article` (author=Org, date 2026-04-25) |

All emitted via `<SEO>` component → `<script type="application/ld+json">`.

**Validate after deploy:** https://search.google.com/test/rich-results

## 3. Meta tags & SEO component

[apps/astro/src/components/SEO.astro](../apps/astro/src/components/SEO.astro) — single
source for `<head>` SEO. Used by `BaseLayout`. Emits:

- `<title>`, `<meta name=description>`, `noindex` (optional)
- `<link rel=canonical>` (auto from `Astro.url` if not given)
- `<link rel=alternate hreflang=en|ru|x-default>` per URL
- Open Graph: `og:site_name`, `og:title|description|url|image`, `og:image:width=1200`, `height=630`,
  `og:type` (default `website`), `og:locale`, `og:locale:alternate`
- Twitter: `summary_large_image`, title/desc/image
- Auto-builds `BreadcrumbList` JSON-LD from `breadcrumbs` prop (optional).
- Merges custom `schema` prop with breadcrumbs into a single ld+json blob.

OG image: `https://divcalc.xyz/og-default.png` (1200×630). Per-page override via `ogImage` prop.

## 4. robots.txt + llms.txt

Files in [apps/astro/public/](../apps/astro/public):

**robots.txt** — disallow `/api/`, `/_/`, calculator hash-routes (canonical SPA URL is
`/spa/`). Explicitly allow GPTBot/ClaudeBot/PerplexityBot/Google-Extended (we want LLM
coverage). Sitemap directive on last line.

**llms.txt** ([llmstxt.org](https://llmstxt.org)) — short site description, reference
build, formula, site map for AI agents. Update when major game patches change formulas.

## 5. IndexNow

[scripts/indexnow.py](../scripts/indexnow.py) — push notifications to Bing/Yandex/Naver/Seznam
via single `api.indexnow.org` endpoint.

```bash
# After deploy, ping every URL in sitemap:
py -X utf8 scripts/indexnow.py --all

# Or only diff vs previous deploy:
py -X utf8 scripts/indexnow.py --since-commit HEAD~1

# Or explicit:
py -X utf8 scripts/indexnow.py --urls https://divcalc.xyz/weapons/iron-lung
```

**Setup (once per VPS):**
1. Generate key: `python -c "import uuid; print(uuid.uuid4().hex)"` → save to `scripts/.indexnow.key` (gitignored)
2. Deploy as `/var/www/divcalc/astro/<key>.txt` with body = `<key>` (Caddy serves it via `@seo_static` matcher: matches `*.txt`).
3. Set env `INDEXNOW_KEY` in CI secrets.

## 6. Bot prerender (SPA SEO)

Without prerender Googlebot sees only the SPA shell. Solution: detect bot UA in Caddy,
proxy to a Puppeteer-rendered HTML.

[scripts/prerender_server.js](../scripts/prerender_server.js) — Express + Puppeteer on
`127.0.0.1:3001`. Caches rendered HTML on disk for 24h (`/var/cache/prerender`).

[deploy/Caddyfile.v2](../deploy/Caddyfile.v2) `@bot_spa` matcher (path `/spa/*` + UA
regex covering Googlebot/Bingbot/YandexBot/etc) → `reverse_proxy 127.0.0.1:3001`. Humans
hit static SPA via `handle_path /spa/*`.

**Setup (VPS):**
```bash
ssh root@89.223.65.56 << 'EOF'
cd /opt && mkdir -p prerender && cd prerender
npm init -y && npm i express puppeteer
ln -sf /var/www/divcalc/scripts/prerender_server.js .
mkdir -p /var/cache/prerender && chown caddy:caddy /var/cache/prerender
pm2 start prerender_server.js --name prerender
pm2 save && pm2 startup
EOF
```

## 7. Internal linking

Implemented on `/weapons/<slug>`:
- "Builds using <weapon>" — `META_BUILDS` filtered by `wpn_en` substring or `weapon_cat` match (max 6).
- "Gear sets that pair well" — derived from related builds' `set_focus` (max 4).
- "Browse more" — category index, weapons index, sets, builds.

**TODO:** sets/brands/builds internal-link sections (same pattern, mirror direction).

## 8. Deploy checklist

```bash
# 1. Build with fresh lastmod
LAST_MOD=$(date -u +%Y-%m-%dT%H:%M:%SZ) pnpm -C apps/astro build

# 2. Upload
scp -r apps/astro/dist/* root@89.223.65.56:/var/www/divcalc/astro/

# 3. Reload Caddy (only if Caddyfile changed)
ssh root@89.223.65.56 "systemctl reload caddy"

# 4. Ping IndexNow
py -X utf8 scripts/indexnow.py --since-commit HEAD~1
```

## 9. Validation tools

| What | URL |
|------|-----|
| Rich results | https://search.google.com/test/rich-results |
| Mobile-friendly | https://search.google.com/test/mobile-friendly |
| Sitemap | https://divcalc.xyz/sitemap-index.xml |
| Bing webmaster | https://www.bing.com/webmasters |
| Yandex webmaster | https://webmaster.yandex.com |
| OG debugger | https://www.opengraph.xyz/url/https%3A%2F%2Fdivcalc.xyz |

## 10. Done / Pending

**Done (this pass):**
- Sitemap config: changefreq buckets, lastmod, filter SPA/api, hreflang en/ru.
- `<SEO>` component, BaseLayout uses it.
- Index page WebSite + SearchAction + Organization JSON-LD.
- robots.txt: blocked `/api/`, `/_/`; explicitly allowed AI bots.
- llms.txt at `/llms.txt`.
- `scripts/indexnow.py` (sitemap / git-diff / explicit modes).
- `scripts/prerender_server.js` + Caddy `@bot_spa` matcher for `/spa/*`.
- Weapon page internal links (related builds, related sets, browse-more).

**Pending:**
- de/fr/es locales — wait for translations (separate ChatN).
- IndexNow key file deploy on VPS (one-time).
- Prerender service running on VPS (npm i + pm2).
- Internal linking on /sets/, /brands/, /builds/ pages.
- `aggregateRating` on Product schema — needs ratings collection (none yet).
- Article schema for `/guides/*` (no `/guides` route yet — TODO future content).
- Verify rich results in Search Console after deploy.
