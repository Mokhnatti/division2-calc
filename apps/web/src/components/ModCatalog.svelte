<script lang="ts">
  import { WEAPON_MODS, MOD_SLOTS } from '../data/weapon-mods.js';
  import { GEAR_MODS, CATEGORY_LABELS } from '../data/gear-mods.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  function modName(id: string): string {
    void lang;
    return i18next.t(id, { ns: 'weapon-mods', defaultValue: id }) as string;
  }
</script>

<section class="panel">
  <div class="panel-title">
    <span>{lang === 'en' ? 'Weapon Mods' : 'Моды оружия'}</span>
    <span class="count num">{WEAPON_MODS.length}</span>
  </div>
  {#each MOD_SLOTS as slot (slot)}
    {@const mods = WEAPON_MODS.filter((m) => m.slot === slot)}
    <div class="group">
      <div class="g-head">{slot.toUpperCase()} <span class="sub-count">({mods.length})</span></div>
      <div class="grid">
        {#each mods as m (m.id)}
          <div class="mod">
            <div class="m-name">{modName(m.id)}</div>
            {#if m.stat && m.value}
              <div class="m-bonus" class:good={m.value > 0} class:bad={m.value < 0}>{m.value > 0 ? '+' : ''}{m.value}% {m.stat.toUpperCase()}</div>
            {:else if m.rawStat}
              <div class="m-bonus muted">{m.rawStat}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>

<section class="panel">
  <div class="panel-title"><span>{lang === 'en' ? 'Gear Mods (Inserts)' : 'Вставки брони'}</span></div>
  {#each ['offense', 'defense', 'skill'] as const as cat (cat)}
    {@const mods = GEAR_MODS.filter((m) => m.category === cat)}
    <div class="group">
      <div class="g-head" style="color: {CATEGORY_LABELS[cat].color}">
        {lang === 'en' ? CATEGORY_LABELS[cat].en : CATEGORY_LABELS[cat].ru}
      </div>
      <div class="grid">
        {#each mods as m (m.id)}
          <div class="mod" style="border-left-color: {CATEGORY_LABELS[cat].color}">
            <div class="m-name">{lang === 'en' ? m.name.en : m.name.ru}</div>
            <div class="m-bonus">+{m.value}{m.value < 100 ? '%' : ''}</div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>

<style>
  section.panel { max-width: 1200px; margin: 0 auto 14px; }
  .group { margin-bottom: 14px; }
  .g-head { font: 700 12px/1 var(--f-display); letter-spacing: .14em; color: var(--orange); margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--border); text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px; }
  .mod { padding: 8px 10px; background: var(--bg-2); border: 1px solid var(--border); border-left: 3px solid var(--orange); border-radius: var(--r-sm); }
  .m-name { font-size: 11px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .m-bonus { font-size: 10px; font-family: var(--f-mono); color: var(--text-dim); }
  .m-bonus.good { color: var(--green); }
  .m-bonus.bad { color: var(--red); }
  .m-bonus.muted { color: var(--muted); font-style: italic; }
  .count { font: 700 10px/1 var(--f-mono); color: var(--muted); background: var(--raised); padding: 2px 10px; border-radius: 999px; }
  .sub-count { color: var(--muted); font-family: var(--f-mono); font-weight: 400; }
</style>
