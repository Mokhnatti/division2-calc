<script lang="ts">
  import { t, lang as langState } from '../lang-state.svelte.js';
  import type { BuildState, SlotKey } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';

  interface Props {
    build: BuildState;
    data: GameData;
    onLoaded: () => void;
  }
  let { build, data, onLoaded }: Props = $props();

  const GEAR_SLOTS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];

  interface MetaBuild {
    id?: string;
    name?: string;
    name_en?: string;
    name_ru?: string;
    tag?: string;
    tag_en?: string;
    tag_ru?: string;
    desc?: string;
    desc_lang?: string; // language of the original description (ru/en/...)
    description_en?: string;
    description_ru?: string;
    wpn_en?: string;
    weapon_en?: string;
    weapon_cat?: string;
    set_focus?: string;
    gear_set?: string;
    tier?: string;
    source_url?: string;
    source_author?: string;
    expected_dps_peak_m?: number;
  }

  const CYRILLIC_RX = /[А-Яа-яЁё]/;
  function detectDescLang(b: MetaBuild): string {
    if (b.desc_lang) return b.desc_lang;
    // Always match the current UI language if description in that language exists
    const l = langState.current;
    if (l === 'en' && b.description_en) return 'en';
    if (l === 'ru' && b.description_ru) return 'ru';
    const txt = (b.description_ru || b.description_en || b.desc || '').trim();
    if (!txt) return 'en';
    return CYRILLIC_RX.test(txt) ? 'ru' : 'en';
  }

  let builds = $state<MetaBuild[] | null>(null);
  let err = $state<string | null>(null);
  let tierFilter = $state<'all' | 'S' | 'A' | 'B'>('all');
  let lang = $derived(langState.current);

  $effect(() => {
    void lang;
    fetch('/data/meta-builds.json')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { builds = (Array.isArray(j) ? j : j?.builds) || []; })
      .catch((e) => (err = String(e)));
  });

  let filtered = $derived.by<MetaBuild[]>(() => {
    if (!builds) return [];
    return builds.filter((b) => tierFilter === 'all' || b.tier === tierFilter);
  });

  function bName(b: MetaBuild): string {
    void lang;
    return (lang === 'en' ? (b.name_en || b.name) : (b.name_ru || b.name)) || b.id || '?';
  }
  // Description is author's own text — NOT translated by UI language.
  // The author wrote it, that's what we show.
  function bDesc(b: MetaBuild): string {
    void lang;
    const t = lang === 'en'
      ? (b.description_en || b.description_ru || b.desc)
      : (b.description_ru || b.description_en || b.desc);
    return (t || '').trim();
  }
  function bTag(b: MetaBuild): string {
    void lang;
    return (lang === 'en' ? (b.tag_en || b.tag) : (b.tag_ru || b.tag)) || '';
  }

  const TIER_COLOR: Record<string, string> = { S: '#ef5350', A: '#f5a623', B: '#42a5f5', '—': '#888' };

  function slugify(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/_+/g, '_');
  }

  function loadBuild(b: MetaBuild) {
    build.reset();
    // Find weapon by EN name
    const wpnName = (b.wpn_en || b.weapon_en || '').toLowerCase();
    if (wpnName) {
      const match = data.weapons.find((w) => {
        const en = (w.id || '').replace(/_/g, ' ').toLowerCase();
        return en === wpnName || en.includes(wpnName) || wpnName.includes(en);
      });
      if (match) build.weaponId = match.id;
    }
    // Find set by set_focus — apply to 4 slots (plus 2 brand slots for tank/utility)
    const setName = b.set_focus || b.gear_set;
    if (setName && setName !== 'any') {
      const setId = slugify(setName);
      const found = data.sets.find((s) => s.id === setId || s.id.includes(setId) || setId.includes(s.id));
      if (found) {
        for (let i = 0; i < 4; i++) {
          build.setSlotSet(GEAR_SLOTS[i], found.id);
        }
        // Fill remaining 2 slots with Providence for DPS / Golan for armor
        const isDps = found.type === 'red';
        const fillBrand = isDps ? 'providence_defense' : 'golan_gear_ltd';
        const hasFill = data.brands.some((b) => b.id === fillBrand);
        if (hasFill) {
          build.setSlotBrand(GEAR_SLOTS[4], fillBrand);
          build.setSlotBrand(GEAR_SLOTS[5], fillBrand);
        }
      }
    }
    // Set DPS cores + attrs for red builds
    for (let i = 0; i < 6; i++) {
      build.setSlotCore(GEAR_SLOTS[i], 'wd');
      build.setSlotAttr(GEAR_SLOTS[i], 'attr1', 'chd' as never);
      build.setSlotAttr(GEAR_SLOTS[i], 'attr2', i % 2 === 0 ? 'chd' as never : 'hsd' as never);
    }
    // Activate weapon talent by default
    build.weaponTalentActive = true;
    // Activate SHD Watch by default for meta builds
    build.shdWatchActive = true;
    onLoaded();
  }
</script>

<section class="panel top-header">
  <div class="panel-title">
    <span>{lang === 'en' ? 'Meta Builds Y8S1' : 'Мета-билды Y8S1'}</span>
    {#if builds}<span class="count num">{filtered.length}</span>{/if}
  </div>
  <div class="tier-row">
    <button class="btn small" class:active={tierFilter === 'all'} onclick={() => (tierFilter = 'all')}>ALL</button>
    <button class="btn small s" class:active={tierFilter === 'S'} onclick={() => (tierFilter = 'S')}>S</button>
    <button class="btn small a" class:active={tierFilter === 'A'} onclick={() => (tierFilter = 'A')}>A</button>
    <button class="btn small b" class:active={tierFilter === 'B'} onclick={() => (tierFilter = 'B')}>B</button>
  </div>
</section>

{#if err}
  <div class="status error">{err}</div>
{:else if !builds}
  <div class="status">Loading…</div>
{:else if filtered.length === 0}
  <div class="status">{lang === 'en' ? 'No meta builds' : 'Нет мета-билдов'}</div>
{:else}
  <div class="meta-list">
    {#each filtered as b (b.id ?? b.name ?? Math.random())}
      <div class="meta-card">
        <div class="mh">
          <span class="tier-badge" style="background: {TIER_COLOR[b.tier ?? '—']};">{b.tier ?? '—'}</span>
          <span class="m-name">{bName(b)}</span>
          {#if b.tag || b.tag_en || b.tag_ru}<span class="m-tag">{bTag(b)}</span>{/if}
        </div>
        <div class="m-tags">
          {#if b.weapon_cat}<span class="chip">🔫 {b.weapon_cat}</span>{/if}
          {#if b.wpn_en || b.weapon_en}<span class="chip">{b.wpn_en ?? b.weapon_en}</span>{/if}
          {#if b.set_focus || b.gear_set}<span class="chip set">📦 {b.set_focus ?? b.gear_set}</span>{/if}
          {#if b.expected_dps_peak_m}<span class="chip dps">💥 {b.expected_dps_peak_m}M</span>{/if}
        </div>
        {#if bDesc(b)}
        {@const desc = bDesc(b)}
        {@const descLang = detectDescLang(b).toUpperCase()}
          <div class="m-desc">
            {#if descLang}<span class="m-desc-lang" title="Language of author's description">{descLang}</span>{/if}
            {desc}
          </div>
        {/if}
        <div class="m-actions">
          <button class="btn small load" onclick={() => loadBuild(b)}>
            {lang === 'en' ? '⤴ Load' : '⤴ Загрузить'}
          </button>
          {#if b.source_author}
            <span class="m-author">
              ✎ {b.source_author}
              {#if /^mokhnatti$/i.test(b.source_author.trim())}
                <span class="admin-badge" title={lang === 'en' ? 'Calculator author' : 'Автор калькулятора'}>★ ADMIN</span>
              {/if}
            </span>
          {/if}
          {#if b.source_url}
            <a href={b.source_url} target="_blank" rel="noopener" class="m-src">↗ source</a>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .top-header { max-width: 1200px; margin: 0 auto 14px; display: flex; flex-direction: column; gap: 10px; }
  .count { font-size: 11px; color: var(--muted); background: var(--raised); padding: 2px 10px; border-radius: 999px; }
  .tier-row { display: flex; gap: 4px; }
  .btn.small.s.active { background: #ef5350 !important; border-color: #ef5350 !important; }
  .btn.small.a.active { background: #f5a623 !important; border-color: #f5a623 !important; }
  .btn.small.b.active { background: #42a5f5 !important; border-color: #42a5f5 !important; }
  .meta-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; max-width: 1400px; margin: 0 auto; }
  .meta-card {
    background: var(--card); border: 1px solid var(--border); border-left: 3px solid var(--orange);
    border-radius: var(--r); padding: 12px;
  }
  .mh { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .tier-badge { padding: 3px 10px; border-radius: 999px; font: 700 11px/1 var(--f-display); color: #000; letter-spacing: .1em; }
  .m-name { font: 700 13px/1 var(--f-display); letter-spacing: .04em; color: var(--text); flex: 1; }
  .m-tag { font-size: 10px; padding: 2px 8px; background: var(--raised); border-radius: 999px; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .m-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px; }
  .chip { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(245,166,35,.1); color: var(--orange); border: 1px solid rgba(245,166,35,.3); }
  .chip.set { background: rgba(1,254,144,.08); color: var(--green); border-color: rgba(1,254,144,.3); }
  .chip.dps { background: rgba(239,83,80,.1); color: var(--red); border-color: rgba(239,83,80,.3); }
  .m-desc { font-size: 11px; color: var(--text-dim); line-height: 1.4; margin-bottom: 6px; }
  .m-desc-lang {
    display: inline-block; margin-right: 6px;
    font: 700 8px/1 var(--f-display); letter-spacing: .12em;
    padding: 2px 5px; border-radius: 3px;
    background: var(--raised); color: var(--muted);
    vertical-align: middle;
  }
  .m-actions { display: flex; gap: 10px; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .btn.load { background: rgba(254,175,16,.15); border-color: rgba(254,175,16,.5); color: var(--orange); }
  .btn.load:hover { background: var(--orange); color: #000; }
  .m-author { font-size: 10px; color: var(--text-dim); font-style: italic; display: inline-flex; align-items: center; gap: 6px; }
  .admin-badge {
    font: 700 9px/1 var(--f-display); letter-spacing: .14em;
    padding: 2px 6px; border-radius: 3px;
    background: linear-gradient(135deg, rgba(254,175,16,.25), rgba(239,83,80,.2));
    color: var(--orange); border: 1px solid rgba(254,175,16,.5);
    font-style: normal;
  }
  .m-src { font-size: 10px; color: var(--blue); text-decoration: none; }
  .m-src:hover { text-decoration: underline; }
  .status { padding: 40px; text-align: center; color: var(--muted); font: 700 12px/1 var(--f-display); letter-spacing: .2em; text-transform: uppercase; }
  .status.error { color: var(--red); }
</style>
