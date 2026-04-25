# Deploy guide — divcalc.xyz hybrid (Astro + Svelte SPA)

## Build artifacts

| Source | Output | Description |
|--------|--------|-------------|
| `apps/astro/` | `apps/astro/dist/` | Static pages: weapons, sets, brands, builds catalogs (806 pages) |
| `apps/web/` | `apps/web/dist/` | Svelte 5 SPA: interactive calculator (#build, #dps, #top, etc.) |

## Server layout

```
/var/www/divcalc/
├── astro/           ← apps/astro/dist contents
│   ├── index.html
│   ├── weapons/
│   ├── sets/
│   ├── brands/
│   ├── builds/
│   ├── ru/
│   ├── _astro/
│   ├── sitemap-index.xml
│   ├── sitemap-0.xml
│   └── robots.txt
└── spa/             ← apps/web/dist contents
    ├── index.html
    ├── assets/
    ├── data/
    ├── locales/
    └── sw.js
```

## Build commands (locally)

```bash
# 1. Build SPA
cd apps/web && pnpm build
# → apps/web/dist (2.8M)

# 2. Build Astro static pages
cd apps/astro && pnpm build
# → apps/astro/dist (7.2M)
```

## Deploy

### Option A: rsync from local (fastest)

```bash
# From repo root
rsync -avz --delete apps/astro/dist/ user@server:/var/www/divcalc/astro/
rsync -avz --delete apps/web/dist/   user@server:/var/www/divcalc/spa/
ssh user@server "sudo systemctl reload caddy"
```

### Option B: git pull + build on server

```bash
ssh user@server
cd /opt/divcalc/division2-calc
git pull origin refactor/v2
cd apps/web && pnpm install && pnpm build
cd ../astro && pnpm install && pnpm build
sudo rsync -avz --delete apps/astro/dist/ /var/www/divcalc/astro/
sudo rsync -avz --delete apps/web/dist/   /var/www/divcalc/spa/
sudo systemctl reload caddy
```

## Caddy config

Replace `/etc/caddy/Caddyfile` with `deploy/Caddyfile.v2` content:

```bash
sudo cp deploy/Caddyfile.v2 /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## After deploy

### 1. Verify Astro pages
- https://divcalc.xyz/ → landing
- https://divcalc.xyz/weapons/st-elmos-engine → weapon page
- https://divcalc.xyz/sets/strikers-battlegear → set page
- https://divcalc.xyz/builds/st-elmo-strikers-dd → build page
- https://divcalc.xyz/ru/ → RU landing

### 2. Verify SPA still works
- https://divcalc.xyz/spa/index.html#build → SPA calculator
- https://divcalc.xyz/spa/index.html#top → top builds tab

### 3. Verify SEO files
- https://divcalc.xyz/sitemap-index.xml → sitemap index
- https://divcalc.xyz/sitemap-0.xml → all 806 URLs
- https://divcalc.xyz/robots.txt → user-agent rules

### 4. Submit to search engines

#### Google Search Console
1. Go to https://search.google.com/search-console
2. Properties → Add property → URL: https://divcalc.xyz
3. Verify via DNS or HTML file
4. Sitemaps → Add → `sitemap-index.xml`

#### Yandex Webmaster
1. https://webmaster.yandex.ru
2. Add site → divcalc.xyz
3. Verify via meta tag (place in BaseLayout) or DNS
4. Indexing → Sitemap files → Add `https://divcalc.xyz/sitemap-index.xml`
5. Settings → Region → Russia + Belarus + Kazakhstan

#### Bing Webmaster
1. https://www.bing.com/webmasters
2. Add site → divcalc.xyz
3. Sitemaps → Submit `https://divcalc.xyz/sitemap-index.xml`
4. IndexNow → API key → save 32-char key as `[KEY].txt` in `apps/astro/public/`
5. Re-build Astro to publish key file

### 5. Setup IndexNow (after Bing key)

```bash
# Set env var
export INDEXNOW_KEY="your-32-char-key-from-bing"

# Submit changed URLs (run on every content update)
node apps/astro/scripts/indexnow.mjs
# Or specific URLs:
node apps/astro/scripts/indexnow.mjs https://divcalc.xyz/weapons/iron-lung
```

Bing/Yandex/Naver index within 30min via IndexNow. Google does NOT support — use GSC API for them.

## Rollback

If anything breaks:

```bash
# Restore old single-tree layout
sudo rsync -avz --delete /var/www/divcalc/spa/ /var/www/divcalc/
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile  # original
sudo systemctl reload caddy
```
