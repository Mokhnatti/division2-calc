<script lang="ts">
  import type { BuildState, AttrStat } from '../build-state.svelte.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props { build: BuildState }
  let { build }: Props = $props();
  let lang = $derived(langState.current);

  const STATS: Array<{ v: AttrStat; ru: string; en: string }> = [
    { v: 'wd',       ru: 'Урон оружия',       en: 'Weapon Damage' },
    { v: 'chc',      ru: 'Шанс крита',        en: 'Crit Chance' },
    { v: 'chd',      ru: 'Урон крита',        en: 'Crit Damage' },
    { v: 'hsd',      ru: 'Урон в голову',     en: 'Headshot Damage' },
    { v: 'dta',      ru: 'Урон броне',        en: 'Damage to Armor' },
    { v: 'dth',      ru: 'Урон здоровью',     en: 'Damage to Health' },
    { v: 'ooc',      ru: 'Вне укрытия',       en: 'Out of Cover' },
    { v: 'rof',      ru: 'Скорострельность',  en: 'Rate of Fire' },
    { v: 'mag',      ru: 'Размер магазина',   en: 'Magazine Size' },
    { v: 'reload',   ru: 'Скорость перезарядки', en: 'Reload Speed' },
    { v: 'handling', ru: 'Эргономичность',    en: 'Weapon Handling' },
    { v: 'status_effects', ru: 'Негативные эффекты', en: 'Status Effects' },
    { v: 'burn_duration',  ru: 'Длительность горения', en: 'Burn Duration' },
  ];

  const MODULE_LABELS = [
    { ru: 'Наступательный', en: 'Offense' },
    { ru: 'Защитный',       en: 'Defense' },
    { ru: 'Служебный',      en: 'Utility' },
  ];
</script>

<section class="panel rec-panel">
  <div class="panel-title">
    <span>🧬 {lang === 'ru' ? 'Рекомбинатор' : 'Recombinator'}</span>
    <span class="hint">{lang === 'ru' ? '3 модуля — сам ставишь стат и %' : '3 modules — pick stat and %'}</span>
  </div>
  <div class="rec-grid">
    {#each [0, 1, 2] as idx}
      <div class="rec-slot">
        <span class="mod-label">{lang === 'ru' ? MODULE_LABELS[idx].ru : MODULE_LABELS[idx].en}</span>
        <div class="rec-row">
          <select
            class="input"
            value={build.recombinator[idx].stat ?? ''}
            onchange={(e) => {
              const v = (e.currentTarget as HTMLSelectElement).value;
              build.setRecombinatorSlot(idx, (v || null) as AttrStat | null, build.recombinator[idx].value);
            }}
          >
            <option value="">— {lang === 'ru' ? 'стат' : 'stat'} —</option>
            {#each STATS as s}
              <option value={s.v}>{lang === 'ru' ? s.ru : s.en}</option>
            {/each}
          </select>
          <div class="rec-input">
            <input
              class="input num"
              type="number"
              min="0"
              max="200"
              value={build.recombinator[idx].value}
              oninput={(e) => {
                const n = parseFloat((e.currentTarget as HTMLInputElement).value) || 0;
                build.setRecombinatorSlot(idx, build.recombinator[idx].stat, n);
              }}
            />
            <span class="suffix">%</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .rec-panel { margin-top: 8px; }
  .panel-title { display: flex; justify-content: space-between; align-items: baseline; }
  .hint { font: 400 10px/1 var(--f-body); color: var(--muted); font-style: italic; }
  .rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; margin-top: 6px; }
  .rec-slot { display: flex; flex-direction: column; gap: 3px; padding: 6px 8px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-sm); }
  .mod-label { font: 700 9px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--orange); }
  .rec-row { display: flex; gap: 4px; align-items: center; }
  .rec-row select { flex: 2; min-width: 0; font-size: 11px; padding: 4px 4px; }
  .rec-input { position: relative; flex: 1; min-width: 60px; }
  .rec-input .input { width: 100%; padding: 4px 18px 4px 6px; font-size: 12px; }
  .suffix { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 10px; pointer-events: none; }
</style>
