<script lang="ts">
  import type { GameData } from '../data.js';
  import type { BuildSummary } from '../build-state.svelte.js';
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';
  import { ui } from '../ui-state.svelte.js';

  interface Props {
    summary: BuildSummary;
    data: GameData;
    weaponId: string | null;
    dashboardMode?: boolean;
  }

  let { summary, data, weaponId, dashboardMode = false }: Props = $props();
  let lang = $derived(langState.current);
  const numLocale = $derived(lang === 'ru' ? 'ru' : 'en');

  let pro = $derived(ui.pro);

  function fmt(n: number): string {
    void lang;
    return Math.round(n).toLocaleString(numLocale);
  }

  let weapon = $derived(weaponId ? data.byId.weapon.get(weaponId) : null);
  let hasWeapon = $derived(!!weapon);
  let isDashboard = $derived(pro && dashboardMode && hasWeapon);

  let additiveRows = $derived.by(() => {
    void lang;
    return Object.entries(summary.additive)
      .filter(([, v]) => v !== 0)
      .map(([stat, value]) => ({
        stat, value,
        name: i18next.t(stat, { ns: 'stats', defaultValue: stat }) as string,
      }));
  });

  let brandGroups = $derived.by(() => {
    void lang;
    return Object.entries(summary.brandCounts).map(([id, count]) => ({
      id, count,
      name: i18next.t(id, { ns: 'brands', defaultValue: id }) as string,
    }));
  });

  let setGroups = $derived.by(() => {
    void lang;
    return Object.entries(summary.setCounts).map(([id, count]) => ({
      id, count,
      name: i18next.t(id, { ns: 'gear-sets', defaultValue: id }) as string,
    }));
  });

  function loc(en: string, ru: string): string { void lang; return lang === 'ru' ? ru : en; }
  let maxRampDps = $derived(Math.max(...summary.ramp.map((r) => r.dps), summary.dps.burstDps, 1));
</script>

<section class="panel" class:dps-dashboard={isDashboard}>
  <div class="panel-title">
    <span>{isDashboard ? loc('DPS — DASHBOARD', 'DPS — DASHBOARD') : 'DPS'}</span>
    <div class="title-right">
      {#if weapon}<span class="wpn-tag num">{weapon.category.toUpperCase()}</span>{/if}
      <button class="mode-toggle" class:on={pro} onclick={() => ui.setPro(!pro)}>
        {pro ? loc('PRO', 'ПРО') : loc('MINI', 'МИНИ')}
      </button>
    </div>
  </div>

  {#if isDashboard}
    <!-- PRO + DASHBOARD LAYOUT: 2-column grid -->
    <div class="dash-grid">
      <div class="dash-hero">
        <div class="dps-grid">
          <div class="metric primary">
            <div class="value num">{fmt(summary.dps.burstDps)}</div>
            <div class="label">{t('ui', 'burst_dps')}</div>
          </div>
          <div class="metric">
            <div class="value num">{fmt(summary.dps.sustainedDps)}</div>
            <div class="label">{t('ui', 'sustained_dps')}</div>
          </div>
          <div class="metric">
            <div class="value num">{fmt(summary.dps.bulletDamage)}</div>
            <div class="label">{t('ui', 'bullet_damage')}</div>
          </div>
          <div class="metric">
            <div class="value num">{summary.dps.cycleSeconds.toFixed(2)}s</div>
            <div class="label">{t('ui', 'cycle_time')}</div>
          </div>
        </div>
      </div>

      <div class="dash-cell">
        <div class="subtitle">{loc('Bullet damage', 'Урон за выстрел')}</div>
        <table class="dmg-table">
          <thead>
            <tr>
              <th>{loc('Shot type', 'Тип')}</th>
              <th class="num">{loc('vs Armor', 'Броня')}</th>
              <th class="num">{loc('vs Health', 'Здоровье')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{loc('Body (no crit)', 'Корпус (без крита)')}</td>
              <td class="num">{fmt(summary.dps.bulletDamageNoCrit)}</td>
              <td class="num">{fmt(summary.dps.bulletDamageNoCrit * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
            <tr>
              <td>{loc('Body (crit)', 'Корпус (крит)')}</td>
              <td class="num">{fmt(summary.dps.bulletDamageCrit)}</td>
              <td class="num">{fmt(summary.dps.bulletDamageCrit * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
            <tr>
              <td>{loc('Headshot', 'В голову')}</td>
              <td class="num good">{fmt(summary.dps.bulletDamageCritHs)}</td>
              <td class="num good">{fmt(summary.dps.bulletDamageCritHs * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dash-cell">
        <div class="subtitle">{loc('DPS ramp-up', 'DPS с ростом стаков')}</div>
        <div class="ramp-bars">
          {#each summary.ramp as p (p.t)}
            {@const pctWidth = (p.dps / maxRampDps) * 100}
            <div class="rb">
              <span class="rb-t">t={p.t}s</span>
              <div class="rb-bar"><div class="rb-fill" style:width="{pctWidth}%"></div></div>
              <span class="rb-v num">{fmt(p.dps)}</span>
            </div>
          {/each}
        </div>
        <div class="ramp-note">
          {loc('Real simulation: Striker ~8 hits/s, Heartbreaker ~2 HS/s, kill ~0.33/s.', 'Реальная симуляция: Striker ~8 попаданий/с, Heartbreaker ~2 HS/с.')}
        </div>
      </div>

      {#if weapon}
        <div class="dash-cell">
          <div class="subtitle">{loc('Weapon stats', 'Статы оружия')}</div>
          <div class="wpn-grid">
            <div class="ws"><span class="k">Base</span><span class="v num">{fmt(weapon.baseDamage)}</span></div>
            <div class="ws"><span class="k">RPM</span><span class="v num">{weapon.rpm}</span></div>
            <div class="ws"><span class="k">Mag</span><span class="v num">{weapon.magazine}</span></div>
            <div class="ws"><span class="k">Reload</span><span class="v num">{weapon.reloadSeconds}s</span></div>
            {#if weapon.optimalRange}<div class="ws"><span class="k">Range</span><span class="v num">{weapon.optimalRange}m</span></div>{/if}
            <div class="ws"><span class="k">HSD</span><span class="v num">×{weapon.headshotMultiplier.toFixed(2)}</span></div>
          </div>
        </div>
      {/if}

      {#if additiveRows.length > 0}
        <div class="dash-cell">
          <div class="subtitle">{t('ui', 'bonuses')}</div>
          <ul class="bonus-list">
            {#each additiveRows as row (row.stat)}
              <li>
                <span class="bonus-val num">+{row.value}%</span>
                <span class="bonus-stat">{row.name}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if brandGroups.length > 0 || setGroups.length > 0}
        <div class="dash-cell">
          <div class="subtitle">{loc('Groups', 'Группы')}</div>
          <div class="groups">
            {#each brandGroups as g (g.id)}
              <span class="group-tag brand">{g.name}<b class="num">×{g.count}</b></span>
            {/each}
            {#each setGroups as g (g.id)}
              <span class="group-tag set">{g.name}<b class="num">×{g.count}</b></span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- MINI / PRO non-dashboard layout -->
    <div class="dps-grid">
      <div class="metric primary">
        <div class="value num">{fmt(summary.dps.burstDps)}</div>
        <div class="label">{t('ui', 'burst_dps')}</div>
      </div>
      <div class="metric">
        <div class="value num">{fmt(summary.dps.sustainedDps)}</div>
        <div class="label">{t('ui', 'sustained_dps')}</div>
      </div>
      <div class="metric">
        <div class="value num">{fmt(summary.dps.bulletDamage)}</div>
        <div class="label">{t('ui', 'bullet_damage')}</div>
      </div>
      <div class="metric">
        <div class="value num">{summary.dps.cycleSeconds.toFixed(2)}s</div>
        <div class="label">{t('ui', 'cycle_time')}</div>
      </div>
    </div>

    {#if !hasWeapon}
      <div class="hint">{t('ui', 'pick_weapon')}</div>
    {:else}
      <div class="wpn-final-block">
        <div class="subtitle">🎯 {loc('Weapon final stats', 'Характеристики оружия')}</div>
        <table class="wpn-final-tbl">
          <tbody>
            <tr class="hero"><td class="num">{fmt((summary.dpsInput.weapon?.baseDamage ?? 0) * (1 + (summary.additive.wd ?? 0)/100 + (summary.dpsInput.additive?.weaponTypeDamagePct ?? 0)/100))}</td><td>{loc('Weapon damage', 'Урон от оружия')}</td></tr>
            <tr><td class="num">{summary.additive.chc.toFixed(1)}%</td><td>{loc('Crit Chance', 'Шанс крит. попадания')}</td></tr>
            <tr><td class="num">{summary.additive.chd.toFixed(1)}%</td><td>{loc('Crit Damage', 'Урон крит. попадания')}</td></tr>
            <tr><td class="num">{(summary.additive.hsd + ((weapon?.headshotMultiplier ?? 1.5) - 1) * 100).toFixed(1)}%</td><td>{loc('Headshot Damage', 'Урон в голову')}</td></tr>
            <tr><td class="num">{(summary.additive.dta ?? 0).toFixed(1)}%</td><td>{loc('Damage to Armor', 'Урон броне')}</td></tr>
            <tr><td class="num">{(summary.additive.dth ?? 0).toFixed(1)}%</td><td>{loc('Damage to Health', 'Урон здоровью')}</td></tr>
            <tr><td class="num">{weapon?.optimalRange ?? '—'}</td><td>{loc('Optimal Range', 'Дальность')}</td></tr>
            <tr class="hero"><td class="num">{(summary.dpsInput.weapon?.reloadSeconds ?? 0).toFixed(2)}s</td><td>{loc('Reload Time', 'Время на перезарядку')}</td></tr>
            <tr><td class="num">{Math.round(summary.dpsInput.weapon?.rpm ?? 0)}</td><td>{loc('Rate of Fire (RPM)', 'Скорострельность (В/М)')}</td></tr>
            <tr><td class="num">{summary.dpsInput.weapon?.magazine ?? 0}</td><td>{loc('Magazine', 'Магазин')}</td></tr>
            <tr><td class="num">{(summary.dpsInput.additive?.weaponTypeDamagePct ?? 0).toFixed(1)}%</td><td>{loc('Weapon-class bonus', 'Доп. урон от класса')} ({weapon?.category.toUpperCase() ?? ''})</td></tr>
            <tr><td class="num">{((summary.additive as Record<string, number>).handling ?? 0).toFixed(1)}%</td><td>{loc('Reload Speed Bonus', 'Повышение скорости перезарядки')}</td></tr>
            <tr><td class="num">{((summary.additive as Record<string, number>).handling ?? 0).toFixed(1)}%</td><td>{loc('Handling (Accuracy / Stability)', 'Эргономичность')}</td></tr>
            <tr><td class="num">{((summary.additive as Record<string, number>).ooc ?? 0).toFixed(1)}%</td><td>{loc('Damage Out of Cover', 'Урон вне укрытия')}</td></tr>
          </tbody>
        </table>
      </div>
    {/if}

    {#if pro && additiveRows.length > 0}
      <div class="pro-block">
        <div class="subtitle">⚡ {t('ui', 'bonuses')}</div>
        <ul class="bonus-list">
          {#each additiveRows as row (row.stat)}
            <li>
              <span class="bonus-val num">+{row.value}%</span>
              <span class="bonus-stat">{row.name}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if pro && (brandGroups.length > 0 || setGroups.length > 0)}
      <div class="pro-block">
        <div class="subtitle">📦 {loc('Groups', 'Группы')}</div>
        <div class="groups">
          {#each brandGroups as g (g.id)}
            <span class="group-tag brand">{g.name}<b class="num">×{g.count}</b></span>
          {/each}
          {#each setGroups as g (g.id)}
            <span class="group-tag set">{g.name}<b class="num">×{g.count}</b></span>
          {/each}
        </div>
      </div>
    {/if}

    {#if pro && hasWeapon}
      <div class="pro-block">
        <div class="subtitle">💥 {loc('Bullet damage', 'Урон за выстрел')}</div>
        <table class="dmg-table">
          <thead>
            <tr>
              <th>{loc('Shot type', 'Тип выстрела')}</th>
              <th class="num">{loc('vs Armor', 'По броне')}</th>
              <th class="num">{loc('vs Health', 'По здоровью')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{loc('Body (no crit)', 'Корпус (без крита)')}</td>
              <td class="num">{fmt(summary.dps.bulletDamageNoCrit)}</td>
              <td class="num">{fmt(summary.dps.bulletDamageNoCrit * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
            <tr>
              <td>{loc('Body (crit)', 'Корпус (крит)')}</td>
              <td class="num">{fmt(summary.dps.bulletDamageCrit)}</td>
              <td class="num">{fmt(summary.dps.bulletDamageCrit * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
            <tr>
              <td>{loc('Headshot (crit)', 'В голову (крит)')}</td>
              <td class="num good">{fmt(summary.dps.bulletDamageCritHs)}</td>
              <td class="num good">{fmt(summary.dps.bulletDamageCritHs * (1 + summary.additive.dth / 100) / (1 + summary.additive.dta / 100))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pro-block">
        <div class="subtitle">{loc('DPS ramp-up', 'DPS с ростом стаков')}</div>
        <div class="ramp-bars">
          {#each summary.ramp as p (p.t)}
            {@const pctWidth = (p.dps / maxRampDps) * 100}
            <div class="rb">
              <span class="rb-t">t={p.t}s</span>
              <div class="rb-bar"><div class="rb-fill" style:width="{pctWidth}%"></div></div>
              <span class="rb-v num">{fmt(p.dps)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if !pro && additiveRows.length > 0}
      <div class="bonuses">
        <div class="subtitle">{t('ui', 'bonuses')}</div>
        <ul>
          {#each additiveRows as row (row.stat)}
            <li>
              <span class="bonus-val num">+{row.value}%</span>
              <span class="bonus-stat">{row.name}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if !pro && (brandGroups.length > 0 || setGroups.length > 0)}
      <div class="groups">
        {#each brandGroups as g (g.id)}
          <span class="group-tag brand">{g.name}<b class="num">×{g.count}</b></span>
        {/each}
        {#each setGroups as g (g.id)}
          <span class="group-tag set">{g.name}<b class="num">×{g.count}</b></span>
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .title-right { display: flex; align-items: center; gap: 6px; }
  .wpn-tag { font-size: 10px; color: var(--muted); background: var(--raised); padding: 2px 8px; border-radius: 999px; }
  .mode-toggle {
    padding: 4px 12px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 999px;
    font: 700 10px/1 var(--f-display); letter-spacing: .18em;
    cursor: pointer;
    text-transform: uppercase;
    transition: all .15s;
    min-width: 58px;
  }
  .mode-toggle:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .mode-toggle.on {
    background: linear-gradient(135deg, var(--orange), #ff7043);
    border-color: var(--orange);
    color: #000;
    box-shadow: 0 0 14px rgba(254,175,16,.5);
  }

  /* Dashboard grid */
  .dps-dashboard :global(.dash-grid) { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dps-dashboard :global(.dash-hero) { grid-column: span 2; }
  .dps-dashboard :global(.dash-cell) { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r); padding: 10px; }
  .dps-dashboard :global(.dash-cell .subtitle) { margin-top: 0; }
  @media (max-width: 900px) {
    .dps-dashboard :global(.dash-grid) { grid-template-columns: 1fr; }
    .dps-dashboard :global(.dash-hero) { grid-column: auto; }
  }

  .dps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .metric {
    background: var(--bg-2); border: 1px solid var(--border);
    border-radius: var(--r); padding: 10px 12px; text-align: center;
  }
  .metric.primary {
    background: radial-gradient(circle at 50% 0%, rgba(254,175,16,.15), transparent 70%), var(--bg-2);
    border: 1px solid rgba(254,175,16,.5);
    box-shadow: 0 0 0 1px rgba(254,175,16,.1) inset, 0 6px 20px -8px rgba(254,175,16,.4);
    grid-column: span 2;
  }
  .metric .value { font-size: 18px; font-weight: 700; color: var(--text); }
  .metric.primary .value { color: var(--orange); font-size: 24px; }
  .metric .label {
    font: 700 9px/1 var(--f-display); color: var(--muted);
    margin-top: 4px; text-transform: uppercase; letter-spacing: .14em;
  }
  .hint {
    margin-top: 10px; padding: 10px; background: var(--bg-2);
    border-radius: var(--r); color: var(--muted); text-align: center;
    font: 500 11px/1 var(--f-body); text-transform: uppercase; letter-spacing: .1em;
  }
  .subtitle {
    font: 700 9px/1 var(--f-display); color: var(--orange);
    text-transform: uppercase; letter-spacing: .14em; margin: 12px 0 6px;
  }
  .pro-block { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); }
  :global(.dmg-table) { width: 100%; border-collapse: collapse; font-size: 11px; }
  :global(.dmg-table) th, :global(.dmg-table) td { padding: 5px 8px; border-bottom: 1px solid var(--border); }
  :global(.dmg-table) th { font: 700 9px/1 var(--f-display); letter-spacing: .08em; color: var(--muted); text-transform: uppercase; text-align: left; }
  :global(.dmg-table) .num { text-align: right; font-family: var(--f-mono); }
  :global(.dmg-table) .good { color: var(--green); font-weight: 700; }

  .wpn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .ws { display: flex; justify-content: space-between; padding: 4px 8px; background: var(--bg-2); border-radius: 3px; font-size: 10px; }
  .ws .k { color: var(--muted); font: 700 9px/1 var(--f-display); letter-spacing: .08em; text-transform: uppercase; }
  .ws .v { color: var(--text); font-weight: 700; }

  :global(.ramp-bars) { display: flex; flex-direction: column; gap: 3px; }
  :global(.rb) { display: grid; grid-template-columns: 40px 1fr 80px; gap: 6px; align-items: center; font-size: 10px; }
  :global(.rb-t) { color: var(--muted); font-family: var(--f-mono); }
  :global(.rb-bar) { height: 12px; background: var(--bg-2); border-radius: 2px; overflow: hidden; }
  :global(.rb-fill) { height: 100%; background: linear-gradient(90deg, var(--blue), var(--orange)); }
  :global(.rb-v) { text-align: right; color: var(--text); font-weight: 700; }
  :global(.ramp-note) { font-size: 9px; color: var(--muted); font-style: italic; margin-top: 6px; }

  .bonuses ul, .bonus-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .bonuses li, .bonus-list li {
    display: flex; gap: 6px; font-size: 11px;
    padding: 4px 8px; background: var(--bg-2);
    border: 1px solid var(--border); border-radius: var(--r-sm);
  }
  .bonus-val { color: var(--green); font-weight: 700; min-width: 40px; }
  .bonus-stat { color: var(--text-dim); }
  .groups { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px; }
  .group-tag {
    font-size: 10px; padding: 3px 8px; border-radius: 999px;
    display: flex; gap: 4px; align-items: center;
  }
  .group-tag.brand { background: rgba(88,169,255,.1); color: var(--blue); border: 1px solid rgba(88,169,255,.3); }
  .group-tag.set { background: rgba(1,254,144,.08); color: var(--green); border: 1px solid rgba(1,254,144,.3); }
  .group-tag b { font-weight: 700; }
</style>
