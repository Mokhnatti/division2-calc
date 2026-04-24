<script lang="ts">
  import type { GameData, Brand, GearSet, NamedGear } from '../data.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    mode: 'brand' | 'set' | 'named';
    data: GameData;
    current: string | null;
    availableNamed?: NamedGear[];
    onPick: (id: string | null) => void;
    onClose: () => void;
  }

  let { mode, data, current, availableNamed = [], onPick, onClose }: Props = $props();
  let lang = $derived(langState.current);
  let query = $state('');

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

  let items = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (mode === 'brand') {
      return data.brands
        .map((b: Brand) => ({ id: b.id, name: tName(b.id, 'brands'), core: b.core, bonuses: brandBonuses(b.id) }))
        .filter((x) => !q || x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else if (mode === 'set') {
      return data.sets
        .map((s: GearSet) => ({ id: s.id, name: tName(s.id, 'gear-sets'), type: s.type, bonuses: setBonuses(s.id) }))
        .filter((x) => !q || x.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return availableNamed
        .map((n) => ({ id: n.id, name: tName(n.id, 'named-gear'), brand: n.brand, bonus: namedBonus(n.id) }))
        .filter((x) => !q || x.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="gp-overlay" onclick={onClose} role="presentation"></div>
<div class="gp-modal">
  <div class="gp-title">
    <span>
      {#if mode === 'brand'}{lang === 'en' ? 'Pick Brand' : 'Выбрать бренд'}
      {:else if mode === 'set'}{lang === 'en' ? 'Pick Set' : 'Выбрать сет'}
      {:else}{lang === 'en' ? 'Pick Named' : 'Выбрать именное'}{/if}
    </span>
    <button class="gp-close" onclick={onClose}>×</button>
  </div>

  <input
    class="input"
    type="search"
    placeholder={lang === 'en' ? 'Search...' : 'Поиск...'}
    bind:value={query}
    use:focusOnMount
  />

  <div class="gp-grid">
    <button class="gp-card gp-clear" class:current={!current} onclick={() => { onPick(null); onClose(); }}>
      <div class="gp-name">— {lang === 'en' ? 'None' : 'Нет'} —</div>
    </button>
    {#each items as it (it.id)}
      <button
        class="gp-card"
        class:current={current === it.id}
        data-type={mode === 'set' ? (it as { type?: string }).type : ''}
        data-kind={mode}
        onclick={() => { onPick(it.id); onClose(); }}
      >
        <div class="gp-head">
          {#if mode === 'brand'}<span class="gp-core core-{(it as { core?: string }).core}">{(it as { core?: string }).core?.toUpperCase() ?? ''}</span>{/if}
          {#if mode === 'set'}<span class="gp-tag tag-{(it as { type?: string }).type}">{(it as { type?: string }).type}</span>{/if}
          <span class="gp-name">{it.name}</span>
        </div>
        {#if mode === 'brand'}
          {#each (it as { bonuses: string[] }).bonuses as ln, i (i)}<div class="gp-bonus">{ln}</div>{/each}
        {:else if mode === 'set'}
          {#each (it as { bonuses: string[] }).bonuses as ln, i (i)}<div class="gp-bonus">{ln}</div>{/each}
        {:else}
          {#if (it as { bonus?: string }).bonus}<div class="gp-bonus gp-locked">🔒 {(it as { bonus?: string }).bonus}</div>{/if}
        {/if}
      </button>
    {/each}
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
  .gp-bonus { font-size: 11px; color: var(--text-dim); line-height: 1.3; }
  .gp-locked { color: var(--orange); font-style: italic; }
  @media (max-width: 600px) {
    .gp-modal { inset: 10px; width: auto; height: auto; transform: none; }
    .gp-grid { grid-template-columns: 1fr; }
  }
</style>
