<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  interface Row {
    grade: number;
    weaponWd: number;
    armorPct: number;
    skillPct: number;
  }

  let rows = $derived.by<Row[]>(() => {
    const out: Row[] = [];
    for (let g = 0; g <= 30; g++) {
      out.push({
        grade: g,
        weaponWd: g * 1.0,
        armorPct: g * 0.3,
        skillPct: g * 0.5,
      });
    }
    return out;
  });

  const MILESTONES = [1, 5, 10, 15, 20, 25, 30];

  interface EscTier { hp: number; ar: number; dmg: number; label: string }
  interface EscMutator { harvester: number; suppressor: number; anchor: number; aid: number }
  interface EscReward { deposit: number; profit: number; group: number }

  let escTiers = $state<Record<string, EscTier>>({});
  let escMutators = $state<Record<string, EscMutator>>({});
  let escRewards = $state<Record<string, EscReward>>({});
  let escDrop = $state<Record<string, number>>({});

  $effect(() => {
    void lang;
    fetch('/data/escalation-tiers.json').then((r) => r.ok ? r.json() : null).then((j) => { if (j) escTiers = j; });
    fetch('/data/escalation-mutators.json').then((r) => r.ok ? r.json() : null).then((j) => { if (j) escMutators = j; });
    fetch('/data/escalation-rewards.json').then((r) => r.ok ? r.json() : null).then((j) => { if (j) escRewards = j; });
    fetch('/data/escalation-drop.json').then((r) => r.ok ? r.json() : null).then((j) => { if (j) escDrop = j; });
  });

  let escTierIds = $derived(Object.keys(escTiers).map((k) => parseInt(k, 10)).sort((a, b) => a - b));
  let escMutIds = $derived(Object.keys(escMutators).map((k) => parseInt(k, 10)).sort((a, b) => a - b));
</script>

<section class="panel exp-header">
  <div class="panel-title">
    <span>{lang === 'en' ? 'Expertise' : 'Экспертиза'}</span>
  </div>
  <div class="intro">
    {lang === 'en'
      ? 'Expertise Grade adds a multiplicative bonus to weapon damage, armor, and skills. Max Grade is 30.'
      : 'Экспертиза добавляет мультипликативный бонус к урону оружия, броне и навыкам. Максимальный уровень — 30.'}
  </div>
</section>

<div class="exp-grid">
  {#each MILESTONES as g (g)}
    {@const r = rows[g]}
    <div class="milestone" class:top={g === 30} class:mid={g >= 10 && g < 30}>
      <div class="m-grade num">G{g}</div>
      <div class="m-stats">
        <div class="ms"><span class="k">WD</span><span class="v num">+{r?.weaponWd.toFixed(0)}%</span></div>
        <div class="ms"><span class="k">Armor</span><span class="v num">+{r?.armorPct.toFixed(1)}%</span></div>
        <div class="ms"><span class="k">Skill</span><span class="v num">+{r?.skillPct.toFixed(1)}%</span></div>
      </div>
    </div>
  {/each}
</div>

<section class="panel table-wrap">
  <div class="panel-title"><span>{lang === 'en' ? 'Escalation — Tier Scaling' : 'Эскалация — масштабирование тиров'}</span></div>
  <div class="intro" style="padding: 0 14px 8px">
    {lang === 'en'
      ? 'Y8S1+ Countdown game mode. Higher tiers = more enemy HP/armor + higher rewards and drop chance.'
      : 'Режим Y8S1+ Countdown. Выше тир — больше HP/брони у врагов, больше наград и шанс дропа.'}
  </div>
  <table class="esc-table">
    <thead>
      <tr>
        <th>{lang === 'en' ? 'Tier' : 'Тир'}</th>
        <th class="num">{lang === 'en' ? 'Enemy HP' : 'HP врагов'}</th>
        <th class="num">{lang === 'en' ? 'Enemy Armor' : 'Броня'}</th>
        <th class="num">{lang === 'en' ? 'Enemy DMG' : 'Урон врагов'}</th>
        <th class="num">{lang === 'en' ? 'Drop %' : 'Шанс дропа'}</th>
      </tr>
    </thead>
    <tbody>
      {#each escTierIds as id (id)}
        {@const t = escTiers[String(id)]}
        <tr class:top={id === 10}>
          <td>{id === 0 ? (lang === 'en' ? 'Base' : 'База') : 'T' + id}</td>
          <td class="num">+{t.hp}%</td>
          <td class="num">+{t.ar}%</td>
          <td class="num">{t.dmg}%</td>
          <td class="num">{id === 0 ? '—' : (escDrop[String(id)] ?? 0).toFixed(2) + '%'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

{#if escMutIds.length > 0}
<section class="panel table-wrap">
  <div class="panel-title"><span>{lang === 'en' ? 'Mutators by Tier' : 'Мутаторы по тирам'}</span></div>
  <table class="esc-table">
    <thead>
      <tr>
        <th>{lang === 'en' ? 'Tier' : 'Тир'}</th>
        <th class="num">Harvester</th>
        <th class="num">Suppressor</th>
        <th class="num">Anchor</th>
        <th class="num">Aid</th>
      </tr>
    </thead>
    <tbody>
      {#each escMutIds as id (id)}
        {@const m = escMutators[String(id)]}
        <tr>
          <td>T{id}</td>
          <td class="num">{m.harvester === 0 ? '—' : m.harvester + '%'}</td>
          <td class="num">{m.suppressor === 0 ? '—' : m.suppressor + '%'}</td>
          <td class="num">{m.anchor === 0 ? '—' : m.anchor + '%'}</td>
          <td class="num">{m.aid === 0 ? '—' : m.aid + '%'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>
{/if}

<section class="panel table-wrap">
  <div class="panel-title"><span>{lang === 'en' ? 'All Grades' : 'Все уровни'}</span></div>
  <table>
    <thead>
      <tr>
        <th>{lang === 'en' ? 'Grade' : 'Ур.'}</th>
        <th class="num">Weapon Damage</th>
        <th class="num">Armor</th>
        <th class="num">Skill</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.grade)}
        <tr class:top={r.grade === 30}>
          <td class="num">G{r.grade}</td>
          <td class="num">+{r.weaponWd.toFixed(0)}%</td>
          <td class="num">+{r.armorPct.toFixed(1)}%</td>
          <td class="num">+{r.skillPct.toFixed(1)}%</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  .exp-header { max-width: 1100px; margin: 0 auto 14px; }
  .intro { color: var(--text-dim); font-size: 13px; line-height: 1.5; }
  .exp-grid {
    max-width: 1100px; margin: 0 auto 14px;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;
  }
  .milestone {
    padding: 14px;
    background: var(--card); border: 1px solid var(--border);
    border-left: 3px solid var(--blue);
    border-radius: var(--r); text-align: center;
  }
  .milestone.mid { border-left-color: var(--orange); }
  .milestone.top {
    border-left-color: var(--exotic);
    box-shadow: 0 0 20px rgba(255,59,47,.15);
  }
  .m-grade {
    font: 700 22px/1 var(--f-display); color: var(--orange);
    letter-spacing: .12em; margin-bottom: 8px;
  }
  .milestone.top .m-grade { color: var(--exotic); }
  .m-stats { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
  .ms { display: flex; justify-content: space-between; padding: 2px 6px; background: var(--bg-2); border-radius: 3px; }
  .ms .k { color: var(--muted); font-family: var(--f-display); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; font-size: 9px; }
  .ms .v { color: var(--green); font-weight: 700; }

  .table-wrap { max-width: 800px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
  table th { font: 700 10px/1 var(--f-display); letter-spacing: .12em; color: var(--orange); text-transform: uppercase; text-align: left; }
  table th.num, table td.num { text-align: right; font-family: var(--f-mono); }
  tr.top { background: rgba(255,59,47,.08); color: var(--exotic-hi); font-weight: 700; }
  .esc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .esc-table th, .esc-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
  .esc-table th { font: 700 10px/1 var(--f-display); letter-spacing: .12em; color: var(--orange); text-transform: uppercase; text-align: left; }
  .esc-table th.num, .esc-table td.num { text-align: right; font-family: var(--f-mono); }
</style>
