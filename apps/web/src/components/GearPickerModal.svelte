<script lang="ts">
  import type { GameData, Brand, GearSet, NamedGear } from '../data.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    data: GameData;
    availableNamed?: NamedGear[];
    currentBrandId?: string | null;
    currentSetId?: string | null;
    currentNamedId?: string | null;
    onPickBrand: (id: string | null) => void;
    onPickSet: (id: string | null) => void;
    onPickNamed: (id: string | null) => void;
    onClose: () => void;
  }

  let {
    data,
    availableNamed = [],
    currentBrandId = null,
    currentSetId = null,
    currentNamedId = null,
    onPickBrand,
    onPickSet,
    onPickNamed,
    onClose,
  }: Props = $props();

  let lang = $derived(langState.current);
  let query = $state('');
  let filter = $state<'all' | 'brand' | 'set' | 'named' | 'exotic'>('all');

  function focusOnMount(node: HTMLInputElement) {
    queueMicrotask(() => node.focus());
  }

  function tName(id: string, ns: string): string {
    void lang;
    if (!i18next.exists(id, { ns })) return id;
    return i18next.t(id, { ns, defaultValue: id }) as string;
  }
  function brandBonuses(id: string): string[] {
    void lang;
    if (!i18next.exists(id, { ns: 'brand-bonuses' })) return [];
    const r = i18next.t(id, { ns: 'brand-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  }
  function setBonuses(id: string): string[] {
    void lang;
    if (!i18next.exists(id, { ns: 'set-bonuses' })) return [];
    const r = i18next.t(id, { ns: 'set-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  }
  function namedBonus(id: string): string {
    void lang;
    if (!i18next.exists(id, { ns: 'named-bonus' })) return '';
    return i18next.t(id, { ns: 'named-bonus', defaultValue: '' }) as string;
  }

  type UnifiedItem =
    | { kind: 'brand'; id: string; name: string; core?: string; bonuses: string[] }
    | { kind: 'set'; id: string; name: string; type?: string; bonuses: string[] }
    | { kind: 'named'; id: string; name: string; brand?: string; bonus: string; isExotic?: boolean };

  let items = $derived.by<UnifiedItem[]>(() => {
    void lang;
    const q = query.trim().toLowerCase();
    const all: UnifiedItem[] = [];

    if (filter === 'all' || filter === 'brand') {
      for (const b of data.brands as Brand[]) {
        const name = tName(b.id, 'brands');
        all.push({ kind: 'brand', id: b.id, name, core: b.core, bonuses: brandBonuses(b.id) });
      }
    }
    if (filter === 'all' || filter === 'set') {
      for (const s of data.sets as GearSet[]) {
        const name = tName(s.id, 'gear-sets');
        all.push({ kind: 'set', id: s.id, name, type: s.type, bonuses: setBonuses(s.id) });
      }
    }
    if (filter === 'all' || filter === 'named' || filter === 'exotic') {
      for (const n of availableNamed) {
        const isExo = !!n.isExotic;
        if (filter === 'named' && isExo) continue;
        if (filter === 'exotic' && !isExo) continue;
        const name = tName(n.id, 'named-gear');
        all.push({ kind: 'named', id: n.id, name, brand: n.brand, bonus: namedBonus(n.id), isExotic: isExo });
      }
    }

    return all
      .filter((x) => !q || x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q))
      .sort((a, b) => {
        // brand → set → named order within search results
        const order: Record<string, number> = { brand: 0, set: 1, named: 2 };
        const oa = order[a.kind], ob = order[b.kind];
        if (oa !== ob) return oa - ob;
        return a.name.localeCompare(b.name);
      });
  });

  function isCurrent(it: UnifiedItem): boolean {
    if (it.kind === 'brand') return currentBrandId === it.id;
    if (it.kind === 'set') return currentSetId === it.id;
    if (it.kind === 'named') return currentNamedId === it.id;
    return false;
  }

  function pick(it: UnifiedItem) {
    if (it.kind === 'brand') onPickBrand(it.id);
    else if (it.kind === 'set') onPickSet(it.id);
    else onPickNamed(it.id);
    onClose();
  }

  function clearAll() {
    onPickBrand(null);
    onPickSet(null);
    onPickNamed(null);
    onClose();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  let counts = $derived.by(() => {
    void lang;
    const exoCount = availableNamed.filter((n) => n.isExotic).length;
    return {
      brand: data.brands.length,
      set: data.sets.length,
      named: availableNamed.length - exoCount,
      exotic: exoCount,
    };
  });
</script>

<svelte:window on:keydown={onKey} />

<div class="gp-overlay" onclick={onClose} role="presentation"></div>
<div class="gp-modal">
  <div class="gp-title">
    <span>{lang === 'ru' ? 'Выбрать экипировку' : 'Pick gear'}</span>
    <button class="gp-close" onclick={onClose}>×</button>
  </div>

  <div class="gp-toolbar">
    <input
      class="input"
      type="search"
      placeholder={lang === 'ru' ? 'Поиск по всем брендам, сетам, именным...' : 'Search across all brands, sets, named...'}
      bind:value={query}
      use:focusOnMount
    />
    <div class="chip-filters">
      <button class="chip" class:on={filter === 'all'} onclick={() => (filter = 'all')}>
        {lang === 'ru' ? 'Все' : 'All'} · {counts.brand + counts.set + counts.named}
      </button>
      <button class="chip brand" class:on={filter === 'brand'} onclick={() => (filter = 'brand')}>
        {lang === 'ru' ? 'Бренды' : 'Brands'} · {counts.brand}
      </button>
      <button class="chip set" class:on={filter === 'set'} onclick={() => (filter = 'set')}>
        {lang === 'ru' ? 'Сеты' : 'Sets'} · {counts.set}
      </button>
      {#if counts.named > 0}
        <button class="chip named" class:on={filter === 'named'} onclick={() => (filter = 'named')}>
          {lang === 'ru' ? 'Именные' : 'Named'} · {counts.named}
        </button>
      {/if}
      {#if counts.exotic > 0}
        <button class="chip exotic" class:on={filter === 'exotic'} onclick={() => (filter = 'exotic')}>
          {lang === 'ru' ? 'Экзотик' : 'Exotic'} · {counts.exotic}
        </button>
      {/if}
    </div>
  </div>

  <div class="gp-grid">
    <button class="gp-card gp-clear" onclick={clearAll}>
      <div class="gp-name">— {lang === 'ru' ? 'Очистить' : 'Clear'} —</div>
    </button>
    {#each items as it (it.kind + ':' + it.id)}
      <button
        class="gp-card"
        class:current={isCurrent(it)}
        data-type={it.kind === 'set' ? (it as { type?: string }).type : ''}
        data-kind={it.kind}
        data-exotic={it.kind === 'named' && (it as { isExotic?: boolean }).isExotic ? 'true' : 'false'}
        onclick={() => pick(it)}
      >
        <div class="gp-head">
          {#if it.kind === 'brand'}<span class="gp-core core-{(it as { core?: string }).core}">{(it as { core?: string }).core?.toUpperCase() ?? ''}</span>{/if}
          {#if it.kind === 'set'}<span class="gp-tag tag-{(it as { type?: string }).type}">{(it as { type?: string }).type}</span>{/if}
          {#if it.kind === 'named'}<span class="gp-tag {(it as { isExotic?: boolean }).isExotic ? 'tag-exotic' : 'tag-named'}">{(it as { isExotic?: boolean }).isExotic ? 'EXOTIC' : 'NAMED'}</span>{/if}
          <span class="gp-name">{it.name}</span>
        </div>
        {#if it.kind === 'brand' || it.kind === 'set'}
          {#each (it as { bonuses: string[] }).bonuses as ln, i (i)}<div class="gp-bonus">{ln}</div>{/each}
        {:else if it.kind === 'named'}
          {#if (it as { bonus?: string }).bonus}<div class="gp-bonus gp-locked">🔒 {(it as { bonus?: string }).bonus}</div>{/if}
        {/if}
      </button>
    {/each}
    {#if items.length === 0}
      <div class="gp-empty">{lang === 'ru' ? 'Ничего не найдено' : 'No matches'}</div>
    {/if}
  </div>
</div>

<style>
  .gp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 1000; }
  .gp-modal {
    position: fixed; inset: 40px auto auto 50%; transform: translateX(-50%);
    width: min(900px, calc(100vw - 40px));
    height: calc(100vh - 80px);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    z-index: 1001;
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    box-shadow: 0 24px 60px rgba(0,0,0,.8);
  }
  .gp-title {
    display: flex; align-items: center; justify-content: space-between;
    font: 700 13px/1 var(--f-display); letter-spacing: .14em;
    color: var(--orange); text-transform: uppercase;
    padding-bottom: 8px; border-bottom: 1px solid var(--border);
  }
  .gp-close {
    background: transparent; border: none; color: var(--text);
    font-size: 20px; cursor: pointer; padding: 2px 10px;
  }
  .gp-close:hover { color: var(--red); }
  .gp-toolbar { display: flex; flex-direction: column; gap: 6px; }
  .gp-toolbar .input { padding: 8px 12px; font-size: 13px; }
  .chip-filters { display: flex; gap: 4px; flex-wrap: wrap; }
  .chip {
    padding: 5px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted); border-radius: 999px; cursor: pointer;
    font: 700 10px/1 var(--f-display); letter-spacing: .1em;
    text-transform: uppercase; transition: all .12s;
  }
  .chip:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .chip.on { background: var(--orange); color: #000; border-color: var(--orange); }
  .chip.brand.on { background: var(--blue); border-color: var(--blue); }
  .chip.set.on { background: var(--green); border-color: var(--green); }
  .chip.named.on { background: var(--named, #b19cd9); border-color: var(--named, #b19cd9); }
  .chip.exotic.on { background: var(--exotic, #ff6b00); border-color: var(--exotic, #ff6b00); color: #000; }

  .gp-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 6px; overflow-y: auto;
    padding-right: 4px;
  }
  .gp-card {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    transition: border-color .12s, background .12s;
    display: flex; flex-direction: column; gap: 4px;
  }
  .gp-card:hover { border-color: var(--border-hi); background: var(--card-2); }
  .gp-card.current { border-color: var(--orange); background: rgba(254,175,16,.08); }
  .gp-card[data-kind="brand"] { border-left: 3px solid var(--blue); }
  .gp-card[data-kind="set"] { border-left: 3px solid var(--green); }
  .gp-card[data-kind="named"] { border-left: 3px solid var(--named, #b19cd9); }
  .gp-card[data-type="red"] { border-left-color: var(--red); }
  .gp-card[data-type="blue"] { border-left-color: var(--blue); }
  .gp-card[data-type="yellow"] { border-left-color: #ffd54f; }
  .gp-card[data-type="purple"] { border-left-color: #ce93d8; }
  .gp-card.gp-clear { grid-column: 1 / -1; text-align: center; color: var(--muted); }
  .gp-head { display: flex; align-items: center; gap: 6px; }
  .gp-name { font-weight: 600; font-size: 13px; color: var(--text); flex: 1; }
  .gp-core, .gp-tag {
    font: 700 9px/1 var(--f-display); letter-spacing: .1em;
    padding: 3px 6px; border-radius: 3px;
    text-transform: uppercase;
  }
  .gp-core.core-wd { background: rgba(254,175,16,.15); color: var(--orange); }
  .gp-core.core-armor { background: rgba(88,169,255,.15); color: var(--blue); }
  .gp-core.core-skill_tier { background: rgba(255,235,59,.15); color: #ffd54f; }
  .gp-tag.tag-red { background: rgba(239,83,80,.15); color: var(--red); }
  .gp-tag.tag-blue { background: rgba(88,169,255,.15); color: var(--blue); }
  .gp-tag.tag-yellow { background: rgba(255,235,59,.15); color: #ffd54f; }
  .gp-tag.tag-purple { background: rgba(186,104,200,.15); color: #ce93d8; }
  .gp-tag.tag-named { background: rgba(177,156,217,.15); color: var(--named, #b19cd9); }
  .gp-tag.tag-exotic { background: rgba(255,107,0,.18); color: var(--exotic, #ff6b00); }
  .gp-card[data-exotic="true"] { border-left: 3px solid var(--exotic, #ff6b00) !important; }
  .gp-bonus { font-size: 11px; color: var(--text-dim); }
  .gp-bonus.gp-locked { color: var(--named, #b19cd9); font-style: italic; }
  .gp-empty { grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--muted); font-style: italic; }
</style>
