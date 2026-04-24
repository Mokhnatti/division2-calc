<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  interface Stats {
    wd: number; chc: number; chd: number; hsd: number;
    rof: number; mag: number; reload: number;
    ooc: number; dta: number; dth: number;
    wd_ar: number; wd_smg: number; wd_lmg: number; wd_mmr: number;
    wd_rifle: number; wd_shotgun: number; wd_pistol: number;
  }

  interface Props {
    mode: 'gear' | 'stats';
    stats: Stats;
    onModeChange: (m: 'gear' | 'stats') => void;
    onStatChange: (k: keyof Stats, v: number) => void;
    view?: 'both' | 'toggle' | 'fields';
  }

  let { mode, stats, onModeChange, onStatChange, view = 'both' }: Props = $props();
  let lang = $derived(langState.current);

  const FIELDS: Array<{ key: keyof Stats; label_en: string; label_ru: string; icon: string; max?: number }> = [
    { key: 'wd', label_en: 'Weapon Damage', label_ru: 'Урон оружия', icon: '💥', max: 500 },
    { key: 'chc', label_en: 'Crit Chance', label_ru: 'Шанс крита', icon: '🎯', max: 60 },
    { key: 'chd', label_en: 'Crit Damage', label_ru: 'Урон крита', icon: '💢', max: 500 },
    { key: 'hsd', label_en: 'Headshot Damage', label_ru: 'Урон в голову', icon: '🧠', max: 500 },
    { key: 'dta', label_en: 'Damage to Armor', label_ru: 'Урон по броне', icon: '🛡', max: 200 },
    { key: 'dth', label_en: 'Damage to Health', label_ru: 'Урон по здоровью', icon: '❤', max: 200 },
    { key: 'ooc', label_en: 'Out of Cover', label_ru: 'Вне укрытия', icon: '🏃', max: 200 },
    { key: 'rof', label_en: 'Rate of Fire', label_ru: 'Скорострельность', icon: '⚡', max: 100 },
    { key: 'mag', label_en: 'Magazine', label_ru: 'Магазин', icon: '📦', max: 100 },
    { key: 'reload', label_en: 'Reload Speed', label_ru: 'Скорость перезарядки', icon: '🔄', max: 100 },
  ];
  const TYPE_FIELDS: Array<{ key: keyof Stats; label: string; icon: string }> = [
    { key: 'wd_ar', label: 'AR', icon: '🔫' },
    { key: 'wd_smg', label: 'SMG', icon: '🔫' },
    { key: 'wd_lmg', label: 'LMG', icon: '🔫' },
    { key: 'wd_mmr', label: 'MMR', icon: '🎯' },
    { key: 'wd_rifle', label: 'Rifle', icon: '🔫' },
    { key: 'wd_shotgun', label: 'SG', icon: '🔫' },
    { key: 'wd_pistol', label: 'Pistol', icon: '🔫' },
  ];
</script>

<section class="panel stats-panel">
  {#if view === 'both' || view === 'toggle'}
    <div class="panel-title">
      <span>{lang === 'en' ? 'Input Mode' : 'Режим ввода'}</span>
      <div class="mode-tabs">
        <button
          class="mt-btn"
          class:active={mode === 'gear'}
          onclick={() => onModeChange('gear')}
        >
          🎒 {lang === 'en' ? 'From Gear' : 'Из брони'}
        </button>
        <button
          class="mt-btn"
          class:active={mode === 'stats'}
          onclick={() => onModeChange('stats')}
        >
          📊 {lang === 'en' ? 'From Stats' : 'Статами'}
        </button>
      </div>
    </div>
  {/if}

  {#if mode === 'stats' && (view === 'both' || view === 'fields')}
    {#if view === 'fields'}
      <div class="panel-title">
        <span>{lang === 'en' ? 'Manual Stats' : 'Статы вручную'}</span>
      </div>
    {/if}
    <div class="stats-hint">
      {lang === 'en'
        ? 'Enter stats directly. Gear choices are ignored for DPS.'
        : 'Вводи % напрямую. Выбор брони игнорируется для DPS.'}
    </div>
    <div class="stats-grid">
      {#each FIELDS as f (f.key)}
        <label class="sf">
          <span class="sf-label">
            <span class="sf-ico">{f.icon}</span>
            <span>{lang === 'en' ? f.label_en : f.label_ru}</span>
          </span>
          <div class="sf-input">
            <input
              class="input num"
              type="number"
              min="0"
              max={f.max}
              value={stats[f.key]}
              oninput={(e) => onStatChange(f.key, parseFloat((e.currentTarget as HTMLInputElement).value) || 0)}
            />
            <span class="sf-suffix">%</span>
          </div>
        </label>
      {/each}
    </div>

    <div class="type-title">
      {lang === 'en' ? 'Damage by Weapon Type' : 'Урон по типу оружия'}
      <span class="type-hint">{lang === 'en' ? '(applied only if weapon matches)' : '(применяется только если оружие совпадает)'}</span>
    </div>
    <div class="type-grid">
      {#each TYPE_FIELDS as f (f.key)}
        <label class="sf">
          <span class="sf-label">
            <span class="sf-ico">{f.icon}</span>
            <span>{f.label}</span>
          </span>
          <div class="sf-input">
            <input
              class="input num"
              type="number"
              min="0"
              max="300"
              value={stats[f.key]}
              oninput={(e) => onStatChange(f.key, parseFloat((e.currentTarget as HTMLInputElement).value) || 0)}
            />
            <span class="sf-suffix">%</span>
          </div>
        </label>
      {/each}
    </div>
  {:else if mode === 'gear' && view === 'both'}
    <div class="stats-hint">
      {lang === 'en'
        ? 'DPS auto-computed from gear picks, brands, sets, mods, talents below.'
        : 'DPS считается автоматически из выбранной брони, брендов, сетов, модов, талантов.'}
    </div>
  {/if}
</section>

<style>
  .stats-panel { margin-bottom: 10px; }
  .mode-tabs { display: flex; gap: 3px; }
  .mt-btn {
    padding: 4px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 999px;
    font: 700 10px/1 var(--f-display); letter-spacing: .1em;
    cursor: pointer;
    text-transform: uppercase;
    transition: all .12s;
  }
  .mt-btn:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .mt-btn.active {
    background: rgba(88,169,255,.15);
    border-color: rgba(88,169,255,.5);
    color: var(--blue);
  }

  .stats-hint { font-size: 11px; color: var(--text-dim); margin-bottom: 10px; font-style: italic; }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; }
  .sf { display: flex; flex-direction: column; gap: 3px; }
  .sf-label { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
  .sf-ico { font-size: 11px; }
  .sf-input { position: relative; display: flex; align-items: center; }
  .sf-input .input { width: 100%; padding: 5px 22px 5px 8px; font-size: 12px; }
  .sf-suffix { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 11px; pointer-events: none; }
  .type-title { font: 700 10px/1 var(--f-display); letter-spacing: .14em; color: var(--orange); text-transform: uppercase; margin-top: 12px; margin-bottom: 6px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .type-hint { font: 400 9px/1 var(--f-body); color: var(--muted); text-transform: none; letter-spacing: 0; font-style: italic; }
  .type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 5px; }
</style>
