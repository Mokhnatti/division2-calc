<script lang="ts">
  import type { GameData, Weapon } from '../data.js';
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';

  interface Props {
    data: GameData;
  }

  let { data }: Props = $props();
  let lang = $derived(langState.current);

  type Filter = 'all' | 'weapons' | 'brands' | 'sets' | 'named' | 'exotic';
  let filter = $state<Filter>('all');
  let query = $state('');

  const CATEGORY_ORDER: string[] = ['ar', 'smg', 'lmg', 'mmr', 'rifle', 'shotgun', 'pistol'];
  const CAT_LABELS: Record<string, { en: string; ru: string }> = {
    ar: { en: 'Assault Rifles', ru: 'Штурмовые винтовки' },
    smg: { en: 'SMGs', ru: 'Пистолеты-пулемёты' },
    lmg: { en: 'LMGs', ru: 'Ручные пулемёты' },
    mmr: { en: 'Marksman Rifles', ru: 'Снайперские винтовки' },
    rifle: { en: 'Rifles', ru: 'Винтовки' },
    shotgun: { en: 'Shotguns', ru: 'Дробовики' },
    pistol: { en: 'Pistols', ru: 'Пистолеты' },
  };

  function wName(w: Weapon): string {
    void lang;
    return i18next.t(w.id, { ns: 'weapons', defaultValue: w.id }) as string;
  }
  function brandName(id: string): string {
    void lang;
    return i18next.t(id, { ns: 'brands', defaultValue: id }) as string;
  }
  function setName(id: string): string {
    void lang;
    return i18next.t(id, { ns: 'gear-sets', defaultValue: id }) as string;
  }
  function talentName(id: string | undefined): string | null {
    void lang;
    if (!id) return null;
    return i18next.t(id, { ns: 'talents', defaultValue: id }) as string;
  }
  function hasResource(ns: string, id: string): boolean {
    void lang;
    return i18next.exists(id, { ns });
  }
  function talentDesc(id: string | undefined): string | null {
    void lang;
    if (!id) return null;
    if (!hasResource('talent-desc', id)) return null;
    const d = i18next.t(id, { ns: 'talent-desc', defaultValue: '' }) as string;
    return d || null;
  }
  function weaponSource(id: string): string | null {
    void lang;
    if (!hasResource('weapon-source', id)) return null;
    const s = i18next.t(id, { ns: 'weapon-source', defaultValue: '' }) as string;
    return s || null;
  }
  function brandBonusList(id: string): string[] {
    void lang;
    if (!hasResource('brand-bonuses', id)) return [];
    const r = i18next.t(id, { ns: 'brand-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  }
  function setBonusList(id: string): string[] {
    void lang;
    if (!hasResource('set-bonuses', id)) return [];
    const r = i18next.t(id, { ns: 'set-bonuses', returnObjects: true }) as unknown;
    return Array.isArray(r) ? (r as string[]) : [];
  }
  function setChest(id: string): string | null {
    void lang;
    if (!hasResource('set-chest', id)) return null;
    const s = i18next.t(id, { ns: 'set-chest', defaultValue: '' }) as string;
    return s || null;
  }
  function setBp(id: string): string | null {
    void lang;
    if (!hasResource('set-backpack', id)) return null;
    const s = i18next.t(id, { ns: 'set-backpack', defaultValue: '' }) as string;
    return s || null;
  }
  function namedBonus(id: string): string | null {
    void lang;
    if (!hasResource('named-bonus', id)) return null;
    const s = i18next.t(id, { ns: 'named-bonus', defaultValue: '' }) as string;
    return s || null;
  }
  function itemUrl(id: string): string {
    return `#item=${encodeURIComponent(id)}`;
  }

  type Section = { title: string; kind: 'weapon' | 'brand' | 'set' | 'named' | 'exotic' | 'namedGear' | 'exoticGear'; items: Weapon[] | string[] };

  let sections = $derived.by<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (name: string, id: string) => !q || name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    /** Match weapon: by name, id, talent name, or talent description text. */
    const matchWeapon = (w: Weapon, name: string) => {
      if (!q) return true;
      if (name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)) return true;
      const tName = talentName(w.talentId);
      if (tName && tName.toLowerCase().includes(q)) return true;
      const tDesc = talentDesc(w.talentId);
      if (tDesc && tDesc.toLowerCase().includes(q)) return true;
      return false;
    };
    const result: Section[] = [];

    if (filter === 'all' || filter === 'weapons') {
      for (const cat of CATEGORY_ORDER) {
        const catWeapons = data.weapons
          .filter((w) => w.category === cat && w.kind === 'base')
          .filter((w) => matchWeapon(w, wName(w)));
        if (catWeapons.length > 0) {
          const catLabel = CAT_LABELS[cat];
          result.push({ title: lang === 'ru' ? catLabel.ru : catLabel.en, kind: 'weapon', items: catWeapons });
        }
      }
    }
    if (filter === 'all' || filter === 'named') {
      for (const cat of CATEGORY_ORDER) {
        const items = data.weapons
          .filter((w) => w.category === cat && w.kind === 'named')
          .filter((w) => matchWeapon(w, wName(w)));
        if (items.length > 0) {
          const catLabel = CAT_LABELS[cat];
          const prefix = lang === 'ru' ? 'Именные' : 'Named';
          result.push({ title: `${prefix} — ${lang === 'ru' ? catLabel.ru : catLabel.en}`, kind: 'named', items });
        }
      }
      // Named GEAR (non-weapon): chest, backpack, gloves, mask, holster, kneepads
      const namedGear = data.namedGear
        .filter((n) => !n.isExotic)
        .filter((n) => match(i18next.t(n.id, { ns: 'named-gear', defaultValue: n.id }) as string, n.id));
      if (namedGear.length > 0) {
        result.push({
          title: lang === 'ru' ? 'Именная экипировка' : 'Named Gear',
          kind: 'namedGear',
          items: namedGear.map((n) => n.id),
        });
      }
    }
    if (filter === 'all' || filter === 'exotic') {
      for (const cat of CATEGORY_ORDER) {
        const items = data.weapons
          .filter((w) => w.category === cat && w.kind === 'exotic')
          .filter((w) => matchWeapon(w, wName(w)));
        if (items.length > 0) {
          const catLabel = CAT_LABELS[cat];
          const prefix = lang === 'ru' ? 'Экзотики' : 'Exotic';
          result.push({ title: `${prefix} — ${lang === 'ru' ? catLabel.ru : catLabel.en}`, kind: 'exotic', items });
        }
      }
      // Exotic GEAR
      const exoticGear = data.namedGear
        .filter((n) => n.isExotic)
        .filter((n) => match(i18next.t(n.id, { ns: 'named-gear', defaultValue: n.id }) as string, n.id));
      if (exoticGear.length > 0) {
        result.push({
          title: lang === 'ru' ? 'Экзотическая экипировка' : 'Exotic Gear',
          kind: 'exoticGear',
          items: exoticGear.map((n) => n.id),
        });
      }
    }
    if (filter === 'all' || filter === 'brands') {
      const ids = data.brands
        .map((b) => b.id)
        .filter((id) => match(brandName(id), id))
        .sort((a, b) => brandName(a).localeCompare(brandName(b)));
      if (ids.length) result.push({ title: t('ui', 'brands'), kind: 'brand', items: ids });
    }
    if (filter === 'all' || filter === 'sets') {
      const ids = data.sets
        .map((s) => s.id)
        .filter((id) => match(setName(id), id))
        .sort((a, b) => setName(a).localeCompare(setName(b)));
      if (ids.length) result.push({ title: t('ui', 'sets'), kind: 'set', items: ids });
    }
    return result;
  });

  let totalCount = $derived(sections.reduce((acc, s) => acc + s.items.length, 0));
</script>

<section class="panel ctlg">
  <div class="panel-title">
    <span>{t('ui', 'tab_catalog')}</span>
    <span class="count num">{totalCount}</span>
  </div>
  <div class="cat-toolbar">
    <input class="input" type="search"
      placeholder={lang === 'ru' ? 'Поиск (имя, талант, описание)' : 'Search (name, talent, description)'}
      bind:value={query} />
    <div class="chip-row">
      <button class="btn small" class:active={filter === 'all'} onclick={() => (filter = 'all')}>{t('ui', 'all')}</button>
      <button class="btn small" class:active={filter === 'weapons'} onclick={() => (filter = 'weapons')}>{t('ui', 'weapons')}</button>
      <button class="btn small" class:active={filter === 'named'} onclick={() => (filter = 'named')}>{lang === 'ru' ? 'Именные' : 'Named'}</button>
      <button class="btn small" class:active={filter === 'exotic'} onclick={() => (filter = 'exotic')}>{lang === 'ru' ? 'Экзотики' : 'Exotic'}</button>
      <button class="btn small" class:active={filter === 'brands'} onclick={() => (filter = 'brands')}>{t('ui', 'brands')}</button>
      <button class="btn small" class:active={filter === 'sets'} onclick={() => (filter = 'sets')}>{t('ui', 'sets')}</button>
    </div>
  </div>
</section>

<div class="catalog-body">
  {#each sections as sec (sec.title + ':' + sec.kind)}
    <div class="section">
      <div class="section-title">
        <span>{sec.title}</span>
        <span class="sec-count num">{sec.items.length}</span>
      </div>
      <div class="grid">
        {#if sec.kind === 'weapon' || sec.kind === 'named' || sec.kind === 'exotic'}
          {#each sec.items as w (typeof w === 'string' ? w : w.id)}
            {@const weapon = w as Weapon}
            <a class="cat-card" href={itemUrl(weapon.id)} data-dot={weapon.kind}>
              <div class="cc-head">
                <span class="kind-dot {weapon.kind}"></span>
                <span class="cc-name" class:named={weapon.kind === 'named'} class:exotic={weapon.kind === 'exotic'}>
                  {wName(weapon)}
                </span>
                <span class="cc-badge num">{weapon.category.toUpperCase()}</span>
              </div>
              <div class="cc-stats num">
                💥 {weapon.baseDamage.toLocaleString()} · ⚡ {weapon.rpm}rpm · 📦 {weapon.magazine} · 🔄 {weapon.reloadSeconds}s
              </div>
              {#if weapon.talentId}
                {@const tn = talentName(weapon.talentId)}
                {@const td = talentDesc(weapon.talentId)}
                {#if tn}
                  <div class="cc-talent">🎯 {tn}</div>
                {/if}
                {#if td}
                  <div class="cc-talent-desc">{td}</div>
                {/if}
              {/if}
              {#if weaponSource(weapon.id)}
                <div class="cc-source">📍 {weaponSource(weapon.id)}</div>
              {/if}
            </a>
          {/each}
        {:else if sec.kind === 'brand'}
          {#each sec.items as id (id)}
            {@const brand = data.brands.find((b) => b.id === id)}
            <a class="cat-card" href={itemUrl(id)} data-kind="brand">
              <div class="cc-head">
                <span class="cc-name">
                  {brandName(id)}
                </span>
                {#if brand?.core}
                  <span class="cc-core core-{brand.core}">{(brand.core === 'skill_tier' ? 'SKL' : brand.core.toUpperCase())}</span>
                {/if}
              </div>
              {#each brandBonusList(id) as line, i (i)}
                <div class="cc-bonus">{line}</div>
              {/each}
            </a>
          {/each}
        {:else if sec.kind === 'set'}
          {#each sec.items as id (id)}
            {@const gset = data.sets.find((s) => s.id === id)}
            <a class="cat-card" href={itemUrl(id)} data-kind="set">
              <div class="cc-head">
                <span class="cc-name">
                  {setName(id)}
                </span>
                {#if gset?.type}
                  <span class="cc-tag tag-{gset.type}">{gset.type}</span>
                {/if}
              </div>
              {#each setBonusList(id) as line, i (i)}
                <div class="cc-bonus">{line}</div>
              {/each}
              {#if setChest(id)}
                <div class="cc-talent">🎽 {lang === 'ru' ? 'Нагрудник' : 'Chest'}: {setChest(id)}</div>
              {/if}
              {#if setBp(id)}
                <div class="cc-talent">🎒 {lang === 'ru' ? 'Рюкзак' : 'Backpack'}: {setBp(id)}</div>
              {/if}
            </a>
          {/each}
        {:else if sec.kind === 'namedGear' || sec.kind === 'exoticGear'}
          {#each sec.items as id (id)}
            {@const ng = data.namedGear.find((n) => n.id === id)}
            {#if ng}
              <a class="cat-card" href={itemUrl(id)} data-kind={sec.kind === 'exoticGear' ? 'exotic' : 'named'}>
                <div class="cc-head">
                  <span class="cc-name" class:named={!ng.isExotic} class:exotic={ng.isExotic}>
                    {i18next.t(ng.id, { ns: 'named-gear', defaultValue: ng.id })}
                  </span>
                  <span class="cc-badge">{ng.slot.toUpperCase()}</span>
                </div>
                <div class="cc-stats num">
                  🛡 {ng.core === 'skill_tier' ? 'SKL' : ng.core.toUpperCase()}
                  {#if ng.brand}· {brandName(ng.brand)}{/if}
                </div>
                {#each ng.fixedAttrs as a, i (i)}
                  <div class="cc-talent">🔒 +{a.value}% {i18next.t(a.stat, { ns: 'stats', defaultValue: a.stat })}</div>
                {/each}
                {#if namedBonus(id)}
                  <div class="cc-talent-desc">{namedBonus(id)}</div>
                {/if}
              </a>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .ctlg { max-width: 1400px; margin: 0 auto 12px; }
  .count, .sec-count { font-size: 11px; color: var(--muted); background: var(--raised); padding: 2px 10px; border-radius: 999px; }
  .cat-toolbar { display: flex; flex-direction: column; gap: 8px; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
  .catalog-body { max-width: 1400px; margin: 0 auto; }
  .section { margin-bottom: 24px; }
  .section-title {
    display: flex; align-items: center; justify-content: space-between;
    font: 700 13px/1 var(--f-display); letter-spacing: .14em;
    text-transform: uppercase; color: var(--orange);
    padding-bottom: 8px; margin-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
  .cat-card {
    display: flex; flex-direction: column; gap: 4px;
    padding: 10px 12px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    transition: border-color .12s, background .12s;
    text-decoration: none; color: inherit;
    cursor: pointer;
  }
  .cat-card:hover { text-decoration: none; }
  .cat-card:hover { border-color: var(--border-hi); background: var(--card-2); }
  .cat-card[data-kind="brand"] { border-left: 3px solid var(--blue); }
  .cat-card[data-kind="set"] { border-left: 3px solid var(--green); }
  .cat-card[data-dot="exotic"] { border-left: 3px solid var(--exotic, #ff6b00); }
  .cat-card[data-dot="named"] { border-left: 3px solid var(--named, #b19cd9); }
  .cc-head { display: flex; align-items: center; gap: 6px; }
  .cc-name { font-size: 13px; color: var(--text); flex: 1; font-weight: 600; }
  .cc-name.named { color: var(--named, #b19cd9); }
  .cc-name.exotic { color: var(--exotic, #ff6b00); }
  .cc-badge { font-size: 9px; color: var(--muted); letter-spacing: .08em; }
  .cc-stats { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .cc-talent { font-size: 11px; color: var(--orange); font-style: italic; }
  .cc-talent-desc { font-size: 10px; color: var(--text-dim); line-height: 1.4; }
  .cc-source { font-size: 10px; color: var(--blue); }
  .cc-bonus { font-size: 11px; color: var(--text); }
  .cc-core { font: 700 9px/1 var(--f-display); letter-spacing: .1em; padding: 3px 6px; border-radius: 3px; }
  .cc-core.core-wd { background: rgba(254,175,16,.15); color: var(--orange); }
  .cc-core.core-armor { background: rgba(88,169,255,.15); color: var(--blue); }
  .cc-core.core-skill_tier { background: rgba(255,235,59,.15); color: #ffd54f; }
  .cc-tag { font: 700 9px/1 var(--f-display); letter-spacing: .1em; padding: 3px 6px; border-radius: 3px; text-transform: uppercase; }
  .cc-tag.tag-red { background: rgba(239,83,80,.15); color: var(--red); }
  .cc-tag.tag-blue { background: rgba(88,169,255,.15); color: var(--blue); }
  .cc-tag.tag-yellow { background: rgba(255,235,59,.15); color: #ffd54f; }
  .cc-tag.tag-purple { background: rgba(186,104,200,.15); color: #ce93d8; }
  .kind-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
  .kind-dot.named { background: var(--named, #b19cd9); }
  .kind-dot.exotic { background: var(--exotic, #ff6b00); }
  .wiki { color: var(--blue); text-decoration: none; margin-left: 4px; font-size: 10px; }
  .wiki:hover { text-decoration: underline; }
</style>
