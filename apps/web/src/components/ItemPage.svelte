<script lang="ts">
  import type { GameData, Weapon } from '../data.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    data: GameData;
    itemId: string;
    onClose: () => void;
  }

  let { data, itemId, onClose }: Props = $props();
  let lang = $derived(langState.current);

  let weapon = $derived(data.byId.weapon.get(itemId));
  let named = $derived(data.byId.namedGear.get(itemId));
  let brand = $derived(data.brands.find((b) => b.id === itemId));
  let gearSet = $derived(data.sets.find((s) => s.id === itemId));

  function tName(id: string, ns: string): string {
    void lang;
    if (!i18next.exists(id, { ns })) return id;
    return i18next.t(id, { ns, defaultValue: id }) as string;
  }
  function exists(ns: string, id: string): boolean { void lang; return i18next.exists(id, { ns }); }

  let title = $derived.by(() => {
    void lang;
    if (weapon) return tName(weapon.id, 'weapons');
    if (named) return tName(named.id, 'named-gear');
    if (brand) return tName(brand.id, 'brands');
    if (gearSet) return tName(gearSet.id, 'gear-sets');
    return itemId;
  });

  let source = $derived.by(() => {
    void lang;
    if (!weapon) return '';
    if (!exists('weapon-source', weapon.id)) return '';
    return i18next.t(weapon.id, { ns: 'weapon-source', defaultValue: '' }) as string;
  });

  let talentName = $derived.by(() => {
    void lang;
    if (!weapon?.talentId) return '';
    return tName(weapon.talentId, 'talents');
  });

  let talentDesc = $derived.by(() => {
    void lang;
    if (!weapon?.talentId) return '';
    if (!exists('talent-desc', weapon.talentId)) return '';
    return i18next.t(weapon.talentId, { ns: 'talent-desc', defaultValue: '' }) as string;
  });

  let brandBonuses = $derived.by(() => {
    void lang;
    if (!brand) return [] as string[];
    if (!exists('brand-bonuses', brand.id)) return [];
    const r = i18next.t(brand.id, { ns: 'brand-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  });

  let setBonuses = $derived.by(() => {
    void lang;
    if (!gearSet) return [] as string[];
    if (!exists('set-bonuses', gearSet.id)) return [];
    const r = i18next.t(gearSet.id, { ns: 'set-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  });

  let setChest = $derived.by(() => {
    void lang;
    if (!gearSet) return '';
    if (!exists('set-chest', gearSet.id)) return '';
    return i18next.t(gearSet.id, { ns: 'set-chest', defaultValue: '' }) as string;
  });
  let setBp = $derived.by(() => {
    void lang;
    if (!gearSet) return '';
    if (!exists('set-backpack', gearSet.id)) return '';
    return i18next.t(gearSet.id, { ns: 'set-backpack', defaultValue: '' }) as string;
  });

  let namedBonus = $derived.by(() => {
    void lang;
    if (!named) return '';
    if (!exists('named-bonus', named.id)) return '';
    return i18next.t(named.id, { ns: 'named-bonus', defaultValue: '' }) as string;
  });

  let namedSource = $derived.by(() => {
    void lang;
    if (!named) return '';
    if (!exists('named-source', named.id)) return '';
    return i18next.t(named.id, { ns: 'named-source', defaultValue: '' }) as string;
  });
</script>

<section class="item-page">
  <div class="nav-back">
    <button class="btn" onclick={onClose}>← {lang === 'en' ? 'Back' : 'Назад'}</button>
  </div>

  <div class="item-hero" data-kind={weapon?.kind ?? (named ? 'named' : brand ? 'brand' : gearSet ? 'set' : 'none')}>
    <h1 class="item-title" class:named={weapon?.kind === 'named'} class:exotic={weapon?.kind === 'exotic'}>
      {title}
    </h1>
    {#if weapon}
      <div class="item-cat">{weapon.category.toUpperCase()} · {weapon.kind.toUpperCase()}</div>
    {/if}
  </div>

  {#if weapon}
    <section class="panel">
      <div class="panel-title"><span>{lang === 'en' ? 'Stats' : 'Характеристики'}</span></div>
      <div class="stats-grid">
        <div class="s"><span class="k">💥 {lang === 'en' ? 'Base Dmg' : 'Базовый урон'}</span><span class="v num">{weapon.baseDamage.toLocaleString()}</span></div>
        <div class="s"><span class="k">⚡ RPM</span><span class="v num">{weapon.rpm}</span></div>
        <div class="s"><span class="k">📦 {lang === 'en' ? 'Magazine' : 'Магазин'}</span><span class="v num">{weapon.magazine}</span></div>
        <div class="s"><span class="k">🔄 {lang === 'en' ? 'Reload' : 'Перезарядка'}</span><span class="v num">{weapon.reloadSeconds}s</span></div>
        {#if weapon.optimalRange}<div class="s"><span class="k">🎯 {lang === 'en' ? 'Range' : 'Дистанция'}</span><span class="v num">{weapon.optimalRange}m</span></div>{/if}
        <div class="s"><span class="k">🧠 HSD</span><span class="v num">×{weapon.headshotMultiplier.toFixed(2)}</span></div>
      </div>
    </section>

    {#if talentName}
      <section class="panel">
        <div class="panel-title"><span>🎯 {lang === 'en' ? 'Talent' : 'Талант'}</span></div>
        <div class="talent-name">{talentName}</div>
        {#if talentDesc}
          <div class="talent-desc">{talentDesc}</div>
        {/if}
      </section>
    {/if}

    {#if source}
      <section class="panel source-panel">
        <div class="panel-title"><span>📍 {lang === 'en' ? 'Where to Get' : 'Где взять'}</span></div>
        <div class="source-text">{source}</div>
      </section>
    {/if}

    {#if weapon.modSlots && weapon.modSlots.length}
      <section class="panel">
        <div class="panel-title"><span>🔧 {lang === 'en' ? 'Mod Slots' : 'Слоты модов'}</span></div>
        <div class="slots-row">
          {#each weapon.modSlots as s (s)}
            <span class="slot-chip">{s}</span>
          {/each}
        </div>
      </section>
    {/if}
  {:else if named}
    <section class="panel">
      <div class="panel-title"><span>🔒 {lang === 'en' ? 'Fixed Bonus' : 'Фикс. бонус'}</span></div>
      <div class="named-text">{namedBonus || '—'}</div>
    </section>
    {#if namedSource}
      <section class="panel source-panel">
        <div class="panel-title"><span>📍 {lang === 'en' ? 'Where to Get' : 'Где взять'}</span></div>
        <div class="source-text">{namedSource}</div>
      </section>
    {/if}
    <section class="panel">
      <div class="panel-title"><span>{lang === 'en' ? 'Base' : 'База'}</span></div>
      <div class="stats-grid">
        <div class="s"><span class="k">{lang === 'en' ? 'Slot' : 'Слот'}</span><span class="v">{named.slot}</span></div>
        {#if named.brand}<div class="s"><span class="k">{lang === 'en' ? 'Brand' : 'Бренд'}</span><span class="v">{tName(named.brand, 'brands')}</span></div>{/if}
        <div class="s"><span class="k">{lang === 'en' ? 'Core' : 'Ядро'}</span><span class="v">{named.core}</span></div>
      </div>
    </section>
  {:else if brand}
    <section class="panel">
      <div class="panel-title"><span>{lang === 'en' ? 'Brand Bonuses' : 'Бонусы бренда'}</span></div>
      <div class="bonuses-list">
        {#each brandBonuses as b, i (i)}<div class="bonus-line">{b}</div>{/each}
      </div>
      {#if brand.core}
        <div class="meta-row">
          <span class="k">{lang === 'en' ? 'Core' : 'Ядро'}:</span>
          <span class="v core-{brand.core}">{brand.core.toUpperCase()}</span>
        </div>
      {/if}
    </section>
  {:else if gearSet}
    <section class="panel">
      <div class="panel-title"><span>{lang === 'en' ? 'Set Bonuses' : 'Бонусы сета'}</span></div>
      <div class="bonuses-list">
        {#each setBonuses as b, i (i)}<div class="bonus-line">{b}</div>{/each}
      </div>
      <div class="meta-row">
        <span class="k">{lang === 'en' ? 'Type' : 'Тип'}:</span>
        <span class="v tag-{gearSet.type}">{gearSet.type}</span>
      </div>
      {#if setChest}
        <div class="set-talent">🎽 {lang === 'en' ? 'Chest' : 'Нагрудник'}: {setChest}</div>
      {/if}
      {#if setBp}
        <div class="set-talent">🎒 {lang === 'en' ? 'Backpack' : 'Рюкзак'}: {setBp}</div>
      {/if}
    </section>
  {:else}
    <div class="not-found">{lang === 'en' ? 'Item not found' : 'Предмет не найден'}</div>
  {/if}
</section>

<style>
  .item-page { max-width: 900px; margin: 0 auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .nav-back .btn { display: inline-flex; align-items: center; gap: 4px; }
  .item-hero { text-align: center; padding: 20px 10px; border-bottom: 1px solid var(--border); }
  .item-title { margin: 0; font: 700 24px/1 var(--f-display); letter-spacing: .08em; text-transform: uppercase; color: var(--text); }
  .item-title.named { color: var(--named, #b19cd9); }
  .item-title.exotic { color: var(--exotic, #ff6b00); }
  .item-cat { font: 700 10px/1 var(--f-mono); color: var(--muted); margin-top: 8px; letter-spacing: .14em; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
  .s { display: flex; justify-content: space-between; padding: 6px 10px; background: var(--bg-2); border-radius: var(--r-sm); }
  .s .k { color: var(--muted); font-size: 11px; }
  .s .v { font-weight: 600; color: var(--text); font-family: var(--f-mono); font-size: 12px; }
  .talent-name { font: 700 16px/1.2 var(--f-display); color: var(--orange); margin-bottom: 6px; }
  .talent-desc { font-size: 13px; color: var(--text-dim); line-height: 1.5; }
  .source-panel { border-left: 3px solid var(--blue); }
  .source-text { font-size: 13px; color: var(--text); }
  .slots-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .slot-chip { font: 700 10px/1 var(--f-display); padding: 6px 12px; background: var(--raised); border-radius: 999px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .1em; }
  .named-text { font-size: 14px; color: var(--orange); line-height: 1.5; }
  .bonuses-list { display: flex; flex-direction: column; gap: 4px; }
  .bonus-line { font-size: 13px; color: var(--text); }
  .meta-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
  .meta-row .k { font-size: 11px; color: var(--muted); }
  .meta-row .v { font: 700 10px/1 var(--f-display); padding: 3px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: .1em; }
  .core-wd { background: rgba(254,175,16,.15); color: var(--orange); }
  .core-armor { background: rgba(88,169,255,.15); color: var(--blue); }
  .core-skill_tier { background: rgba(255,235,59,.15); color: #ffd54f; }
  .tag-red { background: rgba(239,83,80,.15); color: var(--red); }
  .tag-blue { background: rgba(88,169,255,.15); color: var(--blue); }
  .tag-yellow { background: rgba(255,235,59,.15); color: #ffd54f; }
  .tag-purple { background: rgba(186,104,200,.15); color: #ce93d8; }
  .set-talent { font-size: 12px; color: var(--text-dim); margin-top: 6px; padding: 6px 8px; background: var(--bg-2); border-radius: 3px; }
  .not-found { text-align: center; padding: 40px; color: var(--muted); }
</style>
