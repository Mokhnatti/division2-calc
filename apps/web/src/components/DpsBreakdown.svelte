<script lang="ts">
  import type { BuildSummary } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';
  import { t, lang as langState } from '../lang-state.svelte.js';
  import { loadEnemyHp, getTotalHpArmor, type EnemyHpData } from '../data/enemies.js';
  import BuildWeights from './BuildWeights.svelte';

  interface Props {
    summary: BuildSummary;
    data: GameData;
    weaponId: string | null;
    expertiseGrade: number;
    headshotChancePct: number;
    fullArmor?: boolean;
  }

  let { summary, data, weaponId, expertiseGrade, headshotChancePct, fullArmor = true }: Props = $props();
  let lang = $derived(langState.current);
  const numLocale = $derived(lang === 'ru' ? 'ru' : 'en');
  function fmt(n: number): string { void lang; return Math.round(n).toLocaleString(numLocale); }

  let weapon = $derived(weaponId ? data.byId.weapon.get(weaponId) : null);

  let additiveTotal = $derived(summary.additive.wd);
  let critHsMul = $derived(1 + (summary.additive.chc / 100) * (summary.additive.chd / 100) + (headshotChancePct / 100) * (summary.additive.hsd / 100));
  // DtA/DtH are mutually exclusive based on target armor state
  let targetMul = $derived(fullArmor
    ? 1 + summary.additive.dta / 100 + summary.additive.ooc / 100
    : 1 + summary.additive.dth / 100 + summary.additive.ooc / 100);
  let expertiseMul = $derived(1 + expertiseGrade * 0.01);

  let enemyData = $state<EnemyHpData | null>(null);
  let difficultyIdx = $state(3);
  let playerCount = $state<1 | 2 | 3 | 4>(1);
  let hpMult = $state(0);
  let arMult = $state(0);

  $effect(() => { loadEnemyHp().then((d) => (enemyData = d)); });

  // Escalation tier multipliers — from actual game files (hunter pipeline)
  const TIERS: Array<{ id: string; label: string; hp: number; ar: number }> = [
    { id: 'none', label: 'None', hp: 0, ar: 0 },
    { id: 't1', label: 'T1 (+15%)', hp: 15, ar: 15 },
    { id: 't2', label: 'T2 (+30%)', hp: 30, ar: 30 },
    { id: 't3', label: 'T3 (+50%)', hp: 50, ar: 50 },
    { id: 't4', label: 'T4 (+75%)', hp: 75, ar: 75 },
    { id: 't5', label: 'T5 (+100%)', hp: 100, ar: 100 },
    { id: 't6', label: 'T6 (+130%)', hp: 130, ar: 130 },
    { id: 't7', label: 'T7 (+165%)', hp: 165, ar: 165 },
    { id: 't8', label: 'T8 (+200%)', hp: 200, ar: 200 },
    { id: 't9', label: 'T9 (+250%)', hp: 250, ar: 250 },
    { id: 't10', label: 'T10 (+300%)', hp: 300, ar: 300 },
  ];
  let tierId = $state('none');

  $effect(() => {
    const tier = TIERS.find((x) => x.id === tierId);
    if (tier) { hpMult = tier.hp; arMult = tier.ar; }
  });

  const ENEMY_IDS: Array<{ id: string; icon: string; label_en: string; label_ru: string }> = [
    { id: 'normal',  icon: '🔴', label_en: 'Normal',  label_ru: 'Рядовые' },
    { id: 'veteran', icon: '🟣', label_en: 'Veteran', label_ru: 'Ветераны' },
    { id: 'elite',   icon: '🟠', label_en: 'Elite',   label_ru: 'Элитные' },
    { id: 'named',   icon: '⭐', label_en: 'Named',   label_ru: 'Именные' },
  ];

  let enemies = $derived.by<Array<{ id: string; label: string; totalHp: number; rawHp: number }>>(() => {
    if (!enemyData) return [];
    const diff = enemyData.difficulties[difficultyIdx] ?? enemyData.difficulties[0];
    const pKey = `p${playerCount}`;
    return ENEMY_IDS.map((e) => {
      let raw = 0;
      if (diff?.total_hp_armor) {
        raw = getTotalHpArmor(diff, e.id, pKey);
      } else if (enemyData) {
        const base = enemyData.types.find((tt) => tt.id === e.id);
        raw = (base?.hp ?? 0) + (base?.armor ?? 0);
        const m = diff?.multiplier ?? 1;
        raw = raw * m;
      }
      const hp = (diff?.health?.[e.id]?.[pKey]) ?? 0;
      const ar = (diff?.armor?.[e.id]?.[pKey]) ?? 0;
      const scaled = hp * (1 + hpMult / 100) + ar * (1 + arMult / 100) || raw;
      return {
        id: e.id,
        label: `${e.icon} ${lang === 'en' ? e.label_en : e.label_ru}`,
        totalHp: Math.round(scaled),
        rawHp: Math.round(raw),
      };
    }).filter((x) => x.totalHp > 0);
  });

  function ttk(hp: number, dps: number): string {
    if (dps <= 0) return '∞';
    const sec = hp / dps;
    if (sec < 1) return (sec * 1000).toFixed(0) + 'ms';
    if (sec < 60) return sec.toFixed(1) + 's';
    return Math.floor(sec / 60) + 'm ' + Math.round(sec % 60) + 's';
  }
  function ttkColor(sec: number): string {
    if (!isFinite(sec) || sec <= 0) return '#888';
    if (sec < 2) return '#00c853';
    if (sec < 5) return '#9ccc65';
    if (sec < 10) return '#fdd835';
    if (sec < 20) return '#ff9800';
    return '#ef5350';
  }
</script>

<div class="dps-page">
  <section class="panel hero">
    <div class="panel-title"><span>{t('ui', 'burst_dps')}</span></div>
    <div class="hero-grid">
      <div class="hero-metric primary">
        <div class="v num">{fmt(summary.dps.burstDps)}</div>
        <div class="l">{t('ui', 'burst_dps')}</div>
      </div>
      <div class="hero-metric">
        <div class="v num">{fmt(summary.dps.sustainedDps)}</div>
        <div class="l">{t('ui', 'sustained_dps')}</div>
      </div>
      <div class="hero-metric">
        <div class="v num">{fmt(summary.dps.bulletDamage)}</div>
        <div class="l">{t('ui', 'bullet_damage')}</div>
      </div>
      <div class="hero-metric">
        <div class="v num">{summary.dps.cycleSeconds.toFixed(2)}s</div>
        <div class="l">{t('ui', 'cycle_time')}</div>
      </div>
    </div>
  </section>

  {#if weapon && summary.dps.bulletDamage > 0}
    <section class="panel dmg-breakdown">
      <div class="panel-title"><span>{lang === 'en' ? 'Bullet damage breakdown' : 'Урон за выстрел — разбивка'}</span></div>
      <table>
        <thead>
          <tr>
            <th>{lang === 'en' ? 'Shot type' : 'Тип выстрела'}</th>
            <th class="num">{lang === 'en' ? 'Damage' : 'Урон'}</th>
            <th class="num">× {lang === 'en' ? 'vs body' : 'от тела'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🎯 {lang === 'en' ? 'Body (no crit)' : 'Тело (без крита)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageNoCrit)}</td>
            <td class="num">1.00×</td>
          </tr>
          <tr>
            <td>💥 {lang === 'en' ? 'Body (crit)' : 'Тело (крит)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageCrit)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageCrit / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
          <tr>
            <td>🧠 {lang === 'en' ? 'Headshot (no crit)' : 'В голову (без крита)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageHsOnly)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageHsOnly / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
          <tr class="hero">
            <td>💥🧠 {lang === 'en' ? 'Headshot (crit)' : 'В голову (крит)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageCritHs)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageCritHs / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
        </tbody>
      </table>
    </section>
  {/if}

  <section class="panel buckets">
    <div class="panel-title"><span>{lang === 'en' ? 'Formula buckets' : 'Множители формулы'}</span></div>
    <div class="bucket-row">
      <div class="b-name">Base</div>
      <div class="b-val num">{fmt(weapon?.baseDamage ?? 0)}</div>
      <div class="b-note">{weapon ? (lang === 'en' ? 'Weapon base damage' : 'Базовый урон оружия') : (lang === 'en' ? 'No weapon — pick one for full DPS' : 'Оружие не выбрано — выбери для полного DPS')}</div>
    </div>
      <div class="bucket-row">
        <div class="b-name">× Additive</div>
        <div class="b-val num">×{(1 + additiveTotal / 100).toFixed(3)}</div>
        <div class="b-note">+{additiveTotal}% WD ({lang === 'en' ? 'core+brands+sets+mods+shd' : 'ядро+бренды+сеты+моды+shd'})</div>
      </div>
      {#if summary.dps.bulletDamage > 0}
        <div class="bucket-row">
          <div class="b-name">× Crit+HS</div>
          <div class="b-val num">×{critHsMul.toFixed(3)}</div>
          <div class="b-note">CHC {summary.additive.chc}% × CHD {summary.additive.chd}% + HS {headshotChancePct}% × HSD {summary.additive.hsd}%</div>
        </div>
        <div class="bucket-row">
          <div class="b-name">× Target</div>
          <div class="b-val num">×{targetMul.toFixed(3)}</div>
          <div class="b-note">
            {#if fullArmor}
              DtA {summary.additive.dta}% + OoC {summary.additive.ooc}%
              <span class="b-tip">({lang === 'en' ? 'target has armor — DtH ignored' : 'цель в броне — DtH не работает'})</span>
            {:else}
              DtH {summary.additive.dth}% + OoC {summary.additive.ooc}%
              <span class="b-tip">({lang === 'en' ? 'target on health — DtA ignored' : 'цель на здоровье — DtA не работает'})</span>
            {/if}
          </div>
        </div>
        <div class="bucket-row">
          <div class="b-name">× Expertise</div>
          <div class="b-val num">×{expertiseMul.toFixed(3)}</div>
          <div class="b-note">Grade {expertiseGrade}/30</div>
        </div>
        <div class="bucket-row total">
          <div class="b-name">= Bullet</div>
          <div class="b-val num">{fmt(summary.dps.bulletDamage)}</div>
          <div class="b-note">{lang === 'en' ? 'per-shot damage vs target' : 'урон за выстрел по цели'}</div>
        </div>
      {/if}
    </section>

    <section class="panel ttk">
      <div class="panel-title">
        <span>{lang === 'en' ? 'TTK — Time to Kill' : 'TTK — Время убийства'}</span>
      </div>
      <div class="ttk-controls">
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'en' ? 'Difficulty' : 'Сложность'}</span>
          {#if enemyData}
            <select class="input sm" value={difficultyIdx} onchange={(e) => (difficultyIdx = parseInt((e.currentTarget as HTMLSelectElement).value, 10))}>
              {#each enemyData.difficulties as d, i (d.name)}
                <option value={i}>{d.name}</option>
              {/each}
            </select>
          {/if}
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'en' ? 'Players' : 'Игроков'}</span>
          <select class="input sm" value={playerCount} onchange={(e) => (playerCount = (parseInt((e.currentTarget as HTMLSelectElement).value, 10) as 1 | 2 | 3 | 4))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">Escalation</span>
          <select class="input sm" value={tierId} onchange={(e) => (tierId = (e.currentTarget as HTMLSelectElement).value)}>
            {#each TIERS as tr (tr.id)}
              <option value={tr.id}>{tr.label}</option>
            {/each}
          </select>
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'en' ? 'HP+%' : 'HP+%'}</span>
          <input class="input sm num" type="number" min="0" max="800" bind:value={hpMult} />
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'en' ? 'Armor+%' : 'Броня+%'}</span>
          <input class="input sm num" type="number" min="0" max="800" bind:value={arMult} />
        </label>
      </div>
      {#if enemies.length > 0}
        <table>
          <thead>
            <tr>
              <th>{lang === 'en' ? 'Enemy' : 'Враг'}</th>
              <th class="num">{lang === 'en' ? 'HP+Armor' : 'HP+Броня'}</th>
              <th class="num">Burst</th>
              <th class="num">Sustained</th>
            </tr>
          </thead>
          <tbody>
            {#each enemies as e (e.id)}
              {@const burstSec = e.totalHp / Math.max(1, summary.dps.burstDps)}
              {@const sustSec = e.totalHp / Math.max(1, summary.dps.sustainedDps)}
              <tr>
                <td>{e.label}</td>
                <td class="num">{(e.totalHp / 1e6).toFixed(2)}M</td>
                <td class="num" style="color:{ttkColor(burstSec)};font-weight:700">{ttk(e.totalHp, summary.dps.burstDps)}</td>
                <td class="num" style="color:{ttkColor(sustSec)}">{ttk(e.totalHp, summary.dps.sustainedDps)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="hint">Loading enemy data...</div>
      {/if}
    </section>

    <BuildWeights {summary} {data} {weaponId} />
</div>

<style>
  .dps-page { display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 1100px; margin: 0 auto; }
  .hero-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  @media (max-width: 700px) { .hero-grid { grid-template-columns: 1fr 1fr; } }
  .hero-metric { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r); padding: 12px; text-align: center; }
  .hero-metric.primary { border-color: rgba(254,175,16,.5); background: radial-gradient(circle at 50% 0%, rgba(254,175,16,.15), transparent 70%), var(--bg-2); }
  .hero-metric .v { font-size: 22px; font-weight: 700; color: var(--text); }
  .hero-metric.primary .v { color: var(--orange); font-size: 28px; }
  .hero-metric .l { font: 700 9px/1 var(--f-display); letter-spacing: .14em; color: var(--muted); margin-top: 6px; text-transform: uppercase; }

  .bucket-row {
    display: grid; grid-template-columns: 130px 100px 1fr; gap: 10px;
    padding: 7px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    border-radius: var(--r-sm);
    margin-bottom: 3px;
    align-items: center;
  }
  .bucket-row.total { background: rgba(254,175,16,.08); border-color: rgba(254,175,16,.4); margin-top: 6px; }
  .b-name { font: 700 11px/1 var(--f-display); letter-spacing: .1em; color: var(--orange); text-transform: uppercase; }
  .b-val { font-weight: 700; color: var(--text); }
  .total .b-val { color: var(--orange); font-size: 14px; }
  .b-note { font-size: 10px; color: var(--muted); }
  .b-tip { color: var(--orange); font-style: italic; margin-left: 4px; }

  .ttk-controls { display: flex; flex-wrap: wrap; gap: 10px; padding: 8px; margin-bottom: 8px; background: var(--raised); border-radius: var(--r-sm); }
  .ttk-ctrl { display: flex; flex-direction: column; gap: 3px; font-size: 10px; color: var(--muted); min-width: 100px; }
  .ct-label { font: 700 9px/1 var(--f-display); letter-spacing: .12em; text-transform: uppercase; }
  .input.sm { padding: 4px 6px; font-size: 11px; }

  .dmg-breakdown table tr.hero { background: rgba(254,175,16,.08); color: var(--orange); font-weight: 700; }
  .dmg-breakdown table tr.hero td.num { color: var(--orange); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); }
  table th { font: 700 10px/1 var(--f-display); letter-spacing: .12em; color: var(--orange); text-transform: uppercase; }
  table .num { text-align: right; font-family: var(--f-mono); }
  .hint { padding: 40px; text-align: center; color: var(--muted); font: 700 12px/1 var(--f-display); letter-spacing: .2em; text-transform: uppercase; }
</style>
