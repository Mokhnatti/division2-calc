# SEO+Monetization Implementation Log

Active plan: [SEO_MONETIZATION_PLAN_90DAY.md](./SEO_MONETIZATION_PLAN_90DAY.md)

Following the 90-day plan from Research mode.

## Status

| Week | Task | Status | Notes |
|------|------|--------|-------|
| 1-2 | Astro setup + legacy SPA wrap | ✅ partial | apps/astro/ initialized |
| 1-2 | Svelte 5 + sitemap integrations | ✅ done | @astrojs/svelte 8.0.5, @astrojs/sitemap 3.7.2, nanostores |
| 1-2 | First weapon page `/weapons/[slug].astro` | ✅ done | 359 pages built, schema.org Product+Breadcrumb, hreflang ru/en |
| 1-2 | Wrap existing Svelte SPA as `client:only` island | ⏳ pending | |
| 1-2 | Caddy try_files config | ⏳ pending | |
| 3-4 | Sitemap-генератор + git-based lastmod | ⏳ pending | |
| 3-4 | Schema.org Product+Breadcrumb разметка | ⏳ pending | |
| 3-4 | IndexNow webhook | ⏳ pending | |
| 5-8 | 30 priority pages via Haiku 4.5 | ⏳ pending | |
| 5-8 | AI generation pipeline (HorizonLLM → Haiku → human) | ⏳ pending | |
| 9-12 | 170 остальных страниц | ⏳ pending | |
| 9-12 | 4 Sonnet long-form гайда для топ-билдов | ⏳ pending | |
| 9-12 | AdSense активация | ⏳ pending | |

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
