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
    targetStatus?: 'none' | 'burning' | 'bleeding' | 'shocked' | 'poisoned' | 'blinded';
  }

  let { summary, data, weaponId, expertiseGrade, headshotChancePct, fullArmor = true, targetStatus = 'none' }: Props = $props();
  let lang = $derived(langState.current);
  const numLocale = $derived(lang === 'ru' ? 'ru' : 'en');
  function fmt(n: number): string { void lang; return Math.round(n).toLocaleString(numLocale); }

  let weapon = $derived(weaponId ? data.byId.weapon.get(weaponId) : null);

  // Status / DoT damage estimates — from game's attribute_dictionary (TU22.1)
  // Bleed_Damage_Final = SkillCurveFinal × 35 × (1 + BleedDamageModBonus)
  // Burn_Damage_Final  = SkillCurveFinal × 40 × (1 + BurnDamageModBonus)
  // Poison_Damage_Final = SkillCurveFinal × 20  (no ModBonus in base formula)
  // Tick rate ≈ 1/sec. NPC durations: Bleed 10s, Burn 7s, Poison 10s.
  // SkillCurveFinal scales with skill tier; at tier 6 ≈ 1.0 for baseline weapon-applied status.
  // Weapon-applied statuses (Trauma, Scorpio, Pestilence, St. Elmo's) typically use weapon damage
  // as the curve source, so we estimate with base damage as a rough proxy.
  const STATUS_DOT: Record<string, { perTickBase: number; duration: number; modKey: string; label_en: string; label_ru: string; icon: string }> = {
    burning:  { perTickBase: 40, duration: 7,  modKey: 'burn',  label_en: 'Burn',   label_ru: 'Горит',    icon: '🔥' },
    bleeding: { perTickBase: 35, duration: 10, modKey: 'bleed', label_en: 'Bleed',  label_ru: 'Кровоточ', icon: '🩸' },
    poisoned: { perTickBase: 20, duration: 10, modKey: 'poison', label_en: 'Poison', label_ru: 'Яд',       icon: '☠' },
    shocked:  { perTickBase: 0,  duration: 5,  modKey: 'shock', label_en: 'Shock (no DoT, CC only)', label_ru: 'Шок (без DoT, только CC)', icon: '⚡' },
    blinded:  { perTickBase: 0,  duration: 5,  modKey: 'blind', label_en: 'Blind (no DoT, CC only)',  label_ru: 'Ослеп (без DoT, только CC)', icon: '✦' },
  };

  let dotRow = $derived.by(() => {
    if (targetStatus === 'none' || !weapon) return null;
    const cfg = STATUS_DOT[targetStatus];
    if (!cfg || cfg.perTickBase === 0) return cfg;
    // Rough proxy: per-tick × weapon-damage scaling (additive WD affects the curve for weapon-applied statuses)
    const wdScale = 1 + (summary.additive.wd / 100) * 0.25; // conservative 25% WD contribution to DoT
    const perTick = cfg.perTickBase * wdScale;
    const ticks = cfg.duration;
    const total = perTick * ticks;
    return { ...cfg, perTick, ticks, total };
  });

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
        label: `${e.icon} ${lang === 'ru' ? e.label_ru : e.label_en}`,
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

  {#if summary.burn}
    <section class="panel burn">
      <div class="panel-title"><span>🔥 {lang === 'ru' ? 'Урон от горения (DoT)' : 'Burn Damage (DoT)'}</span></div>
      <div class="hero-grid">
        <div class="hero-metric primary with-tt"
          title={lang === 'ru'
            ? `Формула: 300 × 40 × (1 + Негативные эффекты%)\n= 300 × 40 × (1 + ${summary.burn.statusEffectsPct}%)\n= ${Math.round(summary.burn.dpsPerTick)}\nТик раз в 1 секунду.`
            : `Formula: 300 × 40 × (1 + Status Effects%)\n= 300 × 40 × (1 + ${summary.burn.statusEffectsPct}%)\n= ${Math.round(summary.burn.dpsPerTick)}\nTick every 1 second.`}>
          <div class="v num">{fmt(Math.round(summary.burn.dpsPerTick))}</div>
          <div class="l">{lang === 'ru' ? 'Урон за тик (1с) ⓘ' : 'Damage per tick (1s) ⓘ'}</div>
        </div>
        <div class="hero-metric with-tt"
          title={lang === 'ru'
            ? `Формула: 5с × (1 + Длительность горения%)\n= 5 × (1 + ${summary.burn.burnDurationPct}%)\n= ${summary.burn.duration.toFixed(1)}с\nДлительность увеличивает ОБЩИЙ урон (больше тиков), урон за тик не меняется.`
            : `Formula: 5s × (1 + Burn Duration%)\n= 5 × (1 + ${summary.burn.burnDurationPct}%)\n= ${summary.burn.duration.toFixed(1)}s\nDuration increases TOTAL damage (more ticks), tick damage unchanged.`}>
          <div class="v num">{summary.burn.duration.toFixed(1)}s</div>
          <div class="l">{lang === 'ru' ? 'Длительность ⓘ' : 'Duration ⓘ'}</div>
        </div>
        <div class="hero-metric with-tt"
          title={lang === 'ru'
            ? `Формула: DPS × Длительность\n= ${Math.round(summary.burn.dpsPerTick)} × ${summary.burn.duration.toFixed(1)}\n= ${Math.round(summary.burn.totalPerApplication)}\nПолный урон от одного поджога. Повторное применение НЕ суммируется — обновляет таймер.`
            : `Formula: DPS × Duration\n= ${Math.round(summary.burn.dpsPerTick)} × ${summary.burn.duration.toFixed(1)}\n= ${Math.round(summary.burn.totalPerApplication)}\nFull damage per ignite. Re-application does NOT stack — just refreshes timer.`}>
          <div class="v num">{fmt(Math.round(summary.burn.totalPerApplication))}</div>
          <div class="l">{lang === 'ru' ? 'Всего за поджог ⓘ' : 'Total per ignite ⓘ'}</div>
        </div>
        <div class="hero-metric with-tt"
          title={lang === 'ru'
            ? `Сумма из брендов / вставок / атрибутов / рекомбинатора.\nПример источников: Golan Gear +10% (1шт), Empress +10% (1шт), вставка брони до +20%.\nУвеличивает урон за тик, количество тиков не меняет.`
            : `Sum from brands / mods / attrs / recombinator.\nExamples: Golan Gear +10% (1pc), Empress +10% (1pc), gear mod up to +20%.\nIncreases per-tick damage, tick count unchanged.`}>
          <div class="v num">{summary.burn.statusEffectsPct.toFixed(0)}%</div>
          <div class="l">{lang === 'ru' ? 'Негативные эффекты ⓘ' : 'Status Effects ⓘ'}</div>
        </div>
      </div>
      <div class="burn-note">
        {lang === 'ru'
          ? `Общий урон = 300 × 40 × (1 + Status%) × 5 × (1 + Duration%). Оба стата мультипликативно складываются. +100% Status + +100% Duration = ×4 общего урона (240,000 за поджог). Не зависит от урона оружия, не складывается с CHC/CHD/HSD.`
          : `Total damage = 300 × 40 × (1 + Status%) × 5 × (1 + Duration%). Both stats multiply. +100% Status + +100% Duration = ×4 total damage (240,000 per ignite). Independent from weapon damage, does not stack with CHC/CHD/HSD.`}
      </div>
    </section>
  {/if}

  {#if weapon}
    <section class="panel weapon-stats">
      <div class="panel-title"><span>{lang === 'ru' ? 'Характеристики оружия' : 'Weapon stats (in-game view)'}</span></div>
      <table class="wpn-stats-tbl">
        <tbody>
          <tr>
            <td class="num primary">{fmt(summary.dpsInput.weapon.baseDamage * (1 + summary.additive.wd/100 + summary.dpsInput.additive.weaponTypeDamagePct/100))}</td>
            <td>{lang === 'ru' ? 'Урон от оружия' : 'Weapon damage'}</td>
          </tr>
          <tr><td class="num">{summary.additive.chc.toFixed(1)}%</td><td>{lang === 'ru' ? 'Шанс критического попадания' : 'Critical Hit Chance'}</td></tr>
          <tr><td class="num">{summary.additive.chd.toFixed(1)}%</td><td>{lang === 'ru' ? 'Урон от критического попадания' : 'Critical Hit Damage'}</td></tr>
          <tr><td class="num">{(summary.additive.hsd + ((weapon?.headshotMultiplier ?? 1.5) - 1) * 100).toFixed(1)}%</td><td>{lang === 'ru' ? 'Урон от выстрелов в голову' : 'Headshot Damage'}</td></tr>
          <tr><td class="num">{(summary.additive as Record<string, number>).dta?.toFixed(1) ?? 0}%</td><td>{lang === 'ru' ? 'Урон броне' : 'Damage to Armor'}</td></tr>
          <tr><td class="num">{(summary.additive as Record<string, number>).dth?.toFixed(1) ?? 0}%</td><td>{lang === 'ru' ? 'Урон здоровью' : 'Damage to Health'}</td></tr>
          <tr><td class="num">{weapon.optimalRange ?? '—'}</td><td>{lang === 'ru' ? 'Дальность' : 'Optimal Range'}</td></tr>
          <tr><td class="num primary">{summary.dpsInput.weapon.reloadSeconds.toFixed(2)}s</td><td>{lang === 'ru' ? 'Время на перезарядку' : 'Reload Time'}</td></tr>
          <tr><td class="num">{((summary.additive as Record<string, number>).handling ?? 0).toFixed(1)}%</td><td>{lang === 'ru' ? 'Повышение скорости перезарядки' : 'Reload Speed Bonus'}</td></tr>
          <tr><td class="num">{((summary.additive as Record<string, number>).handling ?? 0).toFixed(1)}%</td><td>{lang === 'ru' ? 'Точность' : 'Accuracy'}</td></tr>
          <tr><td class="num">{((summary.additive as Record<string, number>).handling ?? 0).toFixed(1)}%</td><td>{lang === 'ru' ? 'Стабильность' : 'Stability'}</td></tr>
          <tr><td class="num">{Math.round(summary.dpsInput.weapon.rpm)}</td><td>{lang === 'ru' ? 'Скорострельность (В/М)' : 'Rate of fire (RPM)'}</td></tr>
          <tr><td class="num">{summary.dpsInput.weapon.magazine}</td><td>{lang === 'ru' ? 'Магазин' : 'Magazine'}</td></tr>
          <tr><td class="num">{((summary.additive as Record<string, number>).ooc ?? 0).toFixed(1)}%</td><td>{lang === 'ru' ? 'Урон вне укрытия' : 'Damage out of Cover'}</td></tr>
          <tr><td class="num">{summary.dpsInput.additive.weaponTypeDamagePct.toFixed(1)}%</td><td>{lang === 'ru' ? 'Доп. урон от класса (' + weapon.category.toUpperCase() + ')' : 'Weapon-class bonus (' + weapon.category.toUpperCase() + ')'}</td></tr>
        </tbody>
      </table>
    </section>
  {/if}

  {#if weapon && summary.dps.bulletDamage > 0}
    <section class="panel dmg-breakdown">
      <div class="panel-title"><span>{lang === 'ru' ? 'Урон за выстрел — разбивка' : 'Bullet damage breakdown'}</span></div>
      <table>
        <thead>
          <tr>
            <th>{lang === 'ru' ? 'Тип выстрела' : 'Shot type'}</th>
            <th class="num">{lang === 'ru' ? 'Урон' : 'Damage'}</th>
            <th class="num">× {lang === 'ru' ? 'от тела' : 'vs body'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🎯 {lang === 'ru' ? 'Тело (без крита)' : 'Body (no crit)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageNoCrit)}</td>
            <td class="num">1.00×</td>
          </tr>
          <tr>
            <td>💥 {lang === 'ru' ? 'Тело (крит)' : 'Body (crit)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageCrit)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageCrit / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
          <tr>
            <td>🧠 {lang === 'ru' ? 'В голову (без крита)' : 'Headshot (no crit)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageHsOnly)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageHsOnly / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
          <tr class="hero">
            <td>💥🧠 {lang === 'ru' ? 'В голову (крит)' : 'Headshot (crit)'}</td>
            <td class="num">{fmt(summary.dps.bulletDamageCritHs)}</td>
            <td class="num">{summary.dps.bulletDamageNoCrit > 0 ? (summary.dps.bulletDamageCritHs / summary.dps.bulletDamageNoCrit).toFixed(2) : '—'}×</td>
          </tr>
        </tbody>
      </table>
    </section>
  {/if}

  <section class="panel buckets">
    <div class="panel-title"><span>{lang === 'ru' ? 'Множители формулы' : 'Formula buckets'}</span></div>
    <div class="bucket-row">
      <div class="b-name">{lang === 'ru' ? 'База' : 'Base'}</div>
      <div class="b-val num">{fmt(weapon?.baseDamage ?? 0)}</div>
      <div class="b-note">{weapon ? (lang === 'ru' ? 'Базовый урон оружия' : 'Weapon base damage') : (lang === 'ru' ? 'Оружие не выбрано — выбери для полного DPS' : 'No weapon — pick one for full DPS')}</div>
    </div>
      <div class="bucket-row">
        <div class="b-name">× {lang === 'ru' ? 'Аддитив' : 'Additive'}</div>
        <div class="b-val num">×{(1 + additiveTotal / 100).toFixed(3)}</div>
        <div class="b-note">+{additiveTotal}% WD ({lang === 'ru' ? 'ядро+бренды+сеты+моды+shd' : 'core+brands+sets+mods+shd'})</div>
      </div>
      {#if summary.dps.bulletDamage > 0}
        <div class="bucket-row">
          <div class="b-name">× {lang === 'ru' ? 'Крит+HS' : 'Crit+HS'}</div>
          <div class="b-val num">×{critHsMul.toFixed(3)}</div>
          <div class="b-note">CHC {summary.additive.chc}% × CHD {summary.additive.chd}% + HS {headshotChancePct}% × HSD {summary.additive.hsd}%</div>
        </div>
        <div class="bucket-row">
          <div class="b-name">× {lang === 'ru' ? 'Цель' : 'Target'}</div>
          <div class="b-val num">×{targetMul.toFixed(3)}</div>
          <div class="b-note">
            {#if fullArmor}
              DtA {summary.additive.dta}% + OoC {summary.additive.ooc}%
              <span class="b-tip">({lang === 'ru' ? 'цель в броне — DtH не работает' : 'target has armor — DtH ignored'})</span>
            {:else}
              DtH {summary.additive.dth}% + OoC {summary.additive.ooc}%
              <span class="b-tip">({lang === 'ru' ? 'цель на здоровье — DtA не работает' : 'target on health — DtA ignored'})</span>
            {/if}
          </div>
        </div>
        <div class="bucket-row">
          <div class="b-name">× {lang === 'ru' ? 'Экспертиза' : 'Expertise'}</div>
          <div class="b-val num">×{expertiseMul.toFixed(3)}</div>
          <div class="b-note">Grade {expertiseGrade}/30</div>
        </div>
        <div class="bucket-row total">
          <div class="b-name">= {lang === 'ru' ? 'Пуля' : 'Bullet'}</div>
          <div class="b-val num">{fmt(summary.dps.bulletDamage)}</div>
          <div class="b-note">{lang === 'ru' ? 'урон за выстрел по цели' : 'per-shot damage vs target'}</div>
        </div>
      {/if}
    </section>

    <section class="panel ttk">
      <div class="panel-title">
        <span>{lang === 'ru' ? 'TTK — Время убийства' : 'TTK — Time to Kill'}</span>
      </div>
      <div class="ttk-controls">
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'ru' ? 'Сложность' : 'Difficulty'}</span>
          {#if enemyData}
            <select class="input sm" value={difficultyIdx} onchange={(e) => (difficultyIdx = parseInt((e.currentTarget as HTMLSelectElement).value, 10))}>
              {#each enemyData.difficulties as d, i (d.name)}
                <option value={i}>{d.name}</option>
              {/each}
            </select>
          {/if}
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'ru' ? 'Игроков' : 'Players'}</span>
          <select class="input sm" value={playerCount} onchange={(e) => (playerCount = (parseInt((e.currentTarget as HTMLSelectElement).value, 10) as 1 | 2 | 3 | 4))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'ru' ? 'Эскалация' : 'Escalation'}</span>
          <select class="input sm" value={tierId} onchange={(e) => (tierId = (e.currentTarget as HTMLSelectElement).value)}>
            {#each TIERS as tr (tr.id)}
              <option value={tr.id}>{tr.label}</option>
            {/each}
          </select>
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'ru' ? 'HP+%' : 'HP+%'}</span>
          <input class="input sm num" type="number" min="0" max="800" bind:value={hpMult} />
        </label>
        <label class="ttk-ctrl">
          <span class="ct-label">{lang === 'ru' ? 'Броня+%' : 'Armor+%'}</span>
          <input class="input sm num" type="number" min="0" max="800" bind:value={arMult} />
        </label>
      </div>
      {#if enemies.length > 0}
        <table>
          <thead>
            <tr>
              <th>{lang === 'ru' ? 'Враг' : 'Enemy'}</th>
              <th class="num">{lang === 'ru' ? 'HP+Броня' : 'HP+Armor'}</th>
              <th class="num">{lang === 'ru' ? 'Пиковый' : 'Burst'}</th>
              <th class="num">{lang === 'ru' ? 'Средний' : 'Sustained'}</th>
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
  .panel.burn { border-left: 3px solid #ff6533; }
  .hero-metric.with-tt { cursor: help; transition: transform .12s; }
  .hero-metric.with-tt:hover { transform: translateY(-1px); background: rgba(255,101,51,.05); }
  .panel.burn .hero-metric.primary { border-color: rgba(255,101,51,.5); background: radial-gradient(circle at 50% 0%, rgba(255,101,51,.2), transparent 70%), var(--bg-2); }
  .panel.burn .hero-metric.primary .v { color: #ff6533; }
  .burn-note { margin-top: 8px; font-size: 10px; color: var(--text-dim); font-style: italic; padding: 6px 8px; background: rgba(255,101,51,.06); border-radius: var(--r-sm); }

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

  .wpn-stats-tbl td.primary { color: var(--orange); font-weight: 700; font-size: 14px; }
  .wpn-stats-tbl td { padding: 4px 10px; font-size: 12px; }
  .wpn-stats-tbl td.num { text-align: right; font-family: var(--f-mono); font-weight: 700; color: var(--text); min-width: 80px; }

  .dmg-breakdown table tr.hero { background: rgba(254,175,16,.08); color: var(--orange); font-weight: 700; }
  .dmg-breakdown table tr.hero td.num { color: var(--orange); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { padding: 7px 10px; text-align: left; border-bottom: 1px solid var(--border); }
  table th { font: 700 10px/1 var(--f-display); letter-spacing: .12em; color: var(--orange); text-transform: uppercase; }
  table .num { text-align: right; font-family: var(--f-mono); }
  .hint { padding: 40px; text-align: center; color: var(--muted); font: 700 12px/1 var(--f-display); letter-spacing: .2em; text-transform: uppercase; }
</style>
