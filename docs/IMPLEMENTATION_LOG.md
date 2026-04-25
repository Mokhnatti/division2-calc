# SEO+Monetization Implementation Log

Active plan: [SEO_MONETIZATION_PLAN_90DAY.md](./SEO_MONETIZATION_PLAN_90DAY.md)

Following the 90-day plan from Research mode.

## Status

| Week | Task | Status | Notes |
|------|------|--------|-------|
| 1-2 | Astro setup + integrations | ✅ done | @astrojs/svelte 8.0.5, sitemap, nanostores |
| 1-2 | All page generators | ✅ done | weapons, sets, brands, builds + indexes + RU mirror |
| 1-2 | **806 static pages built** | ✅ done | 1 index + 359 weapons + 26 sets + 36 brands + 10 builds + 4 catalog indexes + 5 RU pages = 806 |
| 1-2 | SPA serving via /spa/ path | ✅ done | apps/web/dist served separately by Caddy |
| 1-2 | Caddyfile.v2 hybrid config | ✅ done | try_files: Astro static → SPA fallback |
| 1-2 | robots.txt + IndexNow script | ✅ done | apps/astro/public/robots.txt, scripts/indexnow.mjs |
| 1-2 | Deploy guide | ✅ done | deploy/DEPLOY.md with rsync + GSC/Yandex/Bing instructions |
| 3-4 | Sitemap-генератор + git-based lastmod | ⏳ pending | |
| 3-4 | Schema.org Product+Breadcrumb разметка | ⏳ pending | |
| 3-4 | IndexNow webhook | ⏳ pending | |
| 5-8 | AI pipeline + 30 priority pages | ✅ done | Master prompt template, marked.js renderer |
| 5-8 | 4 Sonnet long-form гайда для топ-билдов | ✅ done | St.Elmo (3919w), Iron Lung Burn, Tipping Eagle, Big Alejandro |
| 5-12 | **186 priority pages with AI content** | ✅ done | 120 weapons + 26 sets + 36 brands + 4 long-form builds |
| 5-12 | **~250,000 words AI-generated** | ✅ done | Sonnet for first 160, Haiku for last 26 |
| - | Stagger remaining 173 base/replica weapons | ⏳ deferred | Plan says 10-20/day post-deploy |
| - | AdSense активация | ⏳ pending | After deploy + 1k sessions/mo |

## Decisions made

- **Architecture**: Hybrid (Astro 5 SSG over existing Svelte 5 SPA, NO rewrite)
- **Markets**: EN-first (RU локаль остаётся как side-channel, hreflang ready)
- **AI budget**: $50-200 (Haiku for templates, Sonnet for top guides, HorizonLLM for drafts)
- **Tech stack**: `@astrojs/svelte@^8.0.4`, `@astrojs/sitemap`, `nanostores`
- **URL structure**: `/weapons/<slug>`, `/sets/<slug>`, `/builds/<slug>`, `/brands/<slug>` + `/ru/*` mirrors
- **Hosting**: Caddy with try_files fallback to `/spa/index.html`

## Key constraints

- 10-20 pages/day publish stagger (anti-AI-detection)
- Real named author with Twitch/Reddit history
- Per-page editorial micro-edits required
- Never calculate DPS via AI — only inject pre-computed values
- Patch-day updates within 24h via IndexNow

## Decision points

- Mediavine Journey activation: at 1k sessions/mo (NEW threshold Jan 2026)
- Raptive switch: at 25k pv/mo
- Never use Monumetric (blocks gaming vertical)

## Financial targets

- Month 6: $200-500/mo
- Month 12: $2,000-3,000/mo, 100k MAU
- Year 1 gross: $8.5k-$15k
