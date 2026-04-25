# Claude project context — divcalc.xyz

## Active plan
Follow [`docs/SEO_MONETIZATION_PLAN_90DAY.md`](./docs/SEO_MONETIZATION_PLAN_90DAY.md).
Track progress in [`docs/IMPLEMENTATION_LOG.md`](./docs/IMPLEMENTATION_LOG.md) — update task status when steps complete.

## Critical rules
- **Don't break prod** (`apps/web/`) — current Svelte 5 SPA serves divcalc.xyz
- New Astro work goes in `apps/astro/`, parallel folder
- Migration is **wrap-not-rewrite**: legacy SPA mounts as one `client:only` island
- All 200+ AI-generated pages must inject **pre-computed DPS values** — never calculate via AI
- Stagger publication 10-20 pages/day max (anti-AI-detection)
- Per-page editorial micro-edits required (2-3 sentences modified per AI-gen page)
- Real named author with Twitch/Reddit history on each page
- "Verified vs in-game" badge + changelog with reviewer initials

## Tech constraints
- `@astrojs/svelte@^8.0.4` (NOT v5/v6 — incompatible with Astro 5)
- Svelte 5 runes (`$state`, `$derived`, `$effect`) work inside Astro Islands
- Cross-island state via `nanostores` — `$state` proxies don't serialize across boundaries
- URL slugs: lowercase ASCII hyphenated, apostrophes stripped (`St. Elmo's Engine` → `st-elmos-engine`)
- Plural URLs: `/weapons/<slug>`, `/sets/<slug>`, `/builds/<slug>`, `/brands/<slug>`
- RU mirror: `/ru/weapons/<slug>` etc, hreflang in head + sitemap

## Decision matrix (already made)
- Architecture: **Hybrid** (Astro SSG wrapper + Svelte 5 SPA islands)
- Markets: **EN-first** (RU side-channel)
- AI budget: **$15-35** total tokens (Haiku batch+cache for templates, Sonnet for 4 long-forms, HorizonLLM for drafts)
- Hosting: Caddy with `try_files` fallback to `/spa/index.html`

## Calculator state (2026-04-25)
- DPS calc verified 1:1 with game (St. Elmo + Strikers DD reference build)
- All weapons reload data uses `reload_empty_ms` (2.4s for St. Elmo, etc)
- Burn DPS formula: `300 × 40 × (1 + Status%) × duration` for `appliesBurn` weapons
- Spec tree perks: Gunner / Sharpshooter / Survivalist (10 perks total)
- Top-builds loader: `applyPreset()` shared util in `apps/web/src/data/preset-logic.ts`
- Bug-watch: GitHub + Gmail watchers running (D:/Life/, autostart)

## Useful refs
- Plan: `docs/SEO_MONETIZATION_PLAN_90DAY.md`
- Log: `docs/IMPLEMENTATION_LOG.md`
- Reference build (verified): `meta-builds.json` → `st_elmo_strikers_dd` with `buildConfig`
- Calculator entry: `apps/web/src/build-state.svelte.ts` `computeBuild()`
- Telegram bug feed: chat 398299572 (D:/Life/bug_watch_divcalc.py + D:/Life/mail_watch_divcalc.py)
