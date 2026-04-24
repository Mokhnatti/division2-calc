<script lang="ts">
  import type { GameData, Weapon } from '../data.js';
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';

  interface Props {
    data: GameData;
    weaponId: string | null;
    onPick: (id: string | null) => void;
  }

  let { data, weaponId, onPick }: Props = $props();

  let query = $state('');
  let kindFilter = $state<'all' | 'base' | 'named' | 'exotic'>('all');
  let categoryFilter = $state<string>('all');

  let lang = $derived(langState.current);

  function wName(w: Weapon): string {
    void lang;
    const raw = i18next.t(w.id, { ns: 'weapons', defaultValue: '' }) as string;
    return raw || w.id;
  }

  type WItem = { w: Weapon; name: string };
  let allNamed = $derived.by<WItem[]>(() => {
    void lang;
    return data.weapons.map((w) => ({ w, name: wName(w) }));
  });

  let filtered = $derived.by<WItem[]>(() => {
    const q = query.trim().toLowerCase();
    return allNamed.filter(({ w, name }) => {
      if (kindFilter !== 'all' && w.kind !== kindFilter) return false;
      if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
      if (!q) return true;
      return name.toLowerCase().includes(q) || w.id.includes(q);
    });
  });

  let selected = $derived(weaponId ? data.byId.weapon.get(weaponId) ?? null : null);
  let selectedName = $derived(selected ? wName(selected) : '');

  let selectedSource = $derived.by(() => {
    void lang;
    if (!selected) return '';
    if (!i18next.exists(selected.id, { ns: 'weapon-source' })) return '';
    return i18next.t(selected.id, { ns: 'weapon-source', defaultValue: '' }) as string;
  });

  const kinds: Array<{ k: 'all' | 'base' | 'named' | 'exotic'; labelKey: string }> = [
    { k: 'all', labelKey: 'all' },
    { k: 'base', labelKey: 'base' },
    { k: 'named', labelKey: 'named' },
    { k: 'exotic', labelKey: 'exotic' },
  ];
  const categories = ['all', 'ar', 'smg', 'lmg', 'mmr', 'rifle', 'shotgun', 'pistol'];
</script>

<section class="panel">
  <div class="panel-title">
    <span>{t('ui', 'weapon')}</span>
    {#if selected}
      <button class="btn small danger" onclick={() => onPick(null)}>×</button>
    {/if}
  </div>

  {#if selected}
    <div class="selected">
      <div class="sel-top">
        <span class="kind-dot {selected.kind}"></span>
        <span class="sel-name">{selectedName}</span>
        <span class="sel-cat num">{selected.category.toUpperCase()}</span>
      </div>
      <div class="sel-stats num">
        {selected.baseDamage.toLocaleString()} · {selected.rpm}rpm · {selected.magazine}mag · {selected.reloadSeconds}s
      </div>
      <a class="sel-info" href={`#item=${encodeURIComponent(selected.id)}`}>
        📄 {langState.current === 'en' ? 'Details · where to get' : 'Детали · где взять'} ↗
      </a>
    </div>
  {/if}

  <div class="filters">
    <input class="input" type="search" placeholder={t('ui', 'search')} bind:value={query} />
    <div class="chip-row">
      {#each kinds as k (k.k)}
        <button
          class="btn small"
          class:active={kindFilter === k.k}
          onclick={() => (kindFilter = k.k)}
        >{t('ui', k.labelKey)}</button>
      {/each}
    </div>
    <div class="chip-row">
      {#each categories as c (c)}
        <button
          class="btn small"
          class:active={categoryFilter === c}
          onclick={() => (categoryFilter = c)}
        >{c === 'all' ? t('ui', 'all') : c.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  <ul class="list">
    {#each filtered.slice(0, 100) as item (item.w.id)}
      <li>
        <button
          class="item"
          class:selected={weaponId === item.w.id}
          onclick={() => onPick(item.w.id)}
        >
          <span class="kind-dot {item.w.kind}"></span>
          <span class="name" class:named={item.w.kind === 'named'} class:exotic={item.w.kind === 'exotic'}>{item.name}</span>
          <span class="cat num">{item.w.category.toUpperCase()}</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if filtered.length > 100}
    <div class="more">+ {filtered.length - 100}</div>
  {/if}
</section>

<style>
  .selected { padding: 8px 10px; background: var(--bg-2); border-left: 3px solid var(--orange); border-radius: var(--r); margin-bottom: 12px; }
  .sel-top { display: flex; align-items: center; gap: 8px; }
  .sel-name { font-weight: 600; color: var(--text); flex: 1; }
  .sel-cat { font-size: 10px; color: var(--muted); background: var(--raised); padding: 2px 8px; border-radius: 999px; }
  .sel-stats { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
  .sel-source { font-size: 10px; color: var(--blue); margin-top: 4px; line-height: 1.4; font-style: italic; background: rgba(88,169,255,.06); padding: 4px 8px; border-radius: 3px; border-left: 2px solid var(--blue); }
  .sel-info { display: inline-block; margin-top: 6px; font-size: 11px; color: var(--blue); text-decoration: none; padding: 3px 8px; background: rgba(88,169,255,.08); border: 1px solid rgba(88,169,255,.3); border-radius: 3px; }
  .sel-info:hover { background: rgba(88,169,255,.18); }
  .filters { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .filters .input { font-size: 12px; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 3px; }
  .list { list-style: none; margin: 0; padding: 0; max-height: 420px; overflow-y: auto; }
  .item {
    display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 6px 8px; background: transparent; border: 1px solid transparent;
    color: var(--text-dim); text-align: left; cursor: pointer;
    border-radius: var(--r-sm); transition: background .12s, border-color .12s;
  }
  .item:hover { background: var(--card-2); }
  .item.selected { background: rgba(254,175,16,.08); border-color: rgba(254,175,16,.35); }
  .name { flex: 1; font-size: 12px; color: var(--text); }
  .name.named { color: var(--named); }
  .name.exotic { color: var(--exotic); }
  .cat { font-size: 9px; color: var(--muted); }
  .more { padding: 8px; text-align: center; font-size: 10px; color: var(--dim); font-family: var(--f-mono); }
</style>
