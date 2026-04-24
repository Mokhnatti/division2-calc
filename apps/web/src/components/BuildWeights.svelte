<script lang="ts">
  import type { BuildSummary } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';
  import { calculateDps } from '@divcalc/formulas';
  import { lang as langState } from '../lang-state.svelte.js';
  import { i18next } from '../i18n.js';

  interface Props {
    summary: BuildSummary;
    data: GameData;
    weaponId: string | null;
  }

  let { summary, data, weaponId }: Props = $props();
  let lang = $derived(langState.current);

  const STATS_TO_TEST = [
    { key: 'wd', label_en: 'WD', label_ru: 'WD', desc_en: 'Weapon Damage', desc_ru: 'Урон оружия' },
    { key: 'chc', label_en: 'CHC', label_ru: 'CHC', desc_en: 'Crit Chance', desc_ru: 'Шанс крита' },
    { key: 'chd', label_en: 'CHD', label_ru: 'CHD', desc_en: 'Crit Damage', desc_ru: 'Урон крита' },
    { key: 'hsd', label_en: 'HSD', label_ru: 'HSD', desc_en: 'Headshot DMG', desc_ru: 'Урон в голову' },
    { key: 'dta', label_en: 'DtA', label_ru: 'DtA', desc_en: 'vs Armor', desc_ru: 'По броне' },
    { key: 'dth', label_en: 'DtH', label_ru: 'DtH', desc_en: 'vs Health', desc_ru: 'По здоровью' },
  ];

  let baseDps = $derived(summary.dps.burstDps);

  let weights = $derived.by(() => {
    void lang;
    if (!weaponId || baseDps <= 0 || !summary.dpsInput) return [];
    const base = summary.dpsInput;

    return STATS_TO_TEST.map((s) => {
      const input = {
        ...base,
        additive: { ...base.additive },
        crit: { ...base.crit },
        target: { ...base.target },
      };
      switch (s.key) {
        case 'wd': input.additive.weaponDamagePct += 1; break;
        case 'chc': input.crit.chcPct += 1; break;
        case 'chd': input.crit.chdPct += 1; break;
        case 'hsd': input.crit.hsdPct += 1; break;
        case 'dta': input.target.damageToArmorPct += 1; break;
        case 'dth': input.target.damageToHealthPct += 1; break;
      }
      const result = calculateDps(input);
      const delta = result.burstDps - baseDps;
      const pct = baseDps > 0 ? (delta / baseDps) * 100 : 0;
      return { ...s, delta, pct };
    }).sort((a, b) => b.delta - a.delta);
  });

  let maxAbsDelta = $derived(Math.max(...weights.map((w) => Math.abs(w.delta)), 1));
</script>

{#if weights.length > 0}
  <section class="panel bw">
    <div class="panel-title">
      <span>⚖ {lang === 'ru' ? 'Веса статов (+1%)' : 'Stat weights (+1%)'}</span>
    </div>
    <div class="bw-note">
      {lang === 'ru' ? 'Прирост DPS при добавлении +1% каждого стата. Сверху — лучший для вложений.' : 'DPS delta if you add +1% of each stat. Highest on top = best to invest.'}
    </div>
    <div class="bw-list">
      {#each weights as w (w.key)}
        {@const w2 = Math.max(2, (Math.abs(w.delta) / maxAbsDelta) * 100)}
        <div class="bw-row">
          <div class="bw-lbl">
            <span class="bw-key">{lang === 'ru' ? w.label_ru : w.label_en}</span>
            <span class="bw-desc">{lang === 'ru' ? w.desc_ru : w.desc_en}</span>
          </div>
          <div class="bw-bar-wrap">
            <div class="bw-bar" style:width="{w2}%"></div>
          </div>
          <div class="bw-val num">
            +{Math.round(w.delta).toLocaleString()}
            <span class="bw-pct">({w.pct >= 0 ? '+' : ''}{w.pct.toFixed(2)}%)</span>
          </div>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .bw { max-width: 1100px; margin: 10px auto; }
  .bw-note { font-size: 11px; color: var(--muted); font-style: italic; margin-bottom: 10px; }
  .bw-list { display: flex; flex-direction: column; gap: 3px; }
  .bw-row {
    display: grid; grid-template-columns: 180px 1fr 140px;
    align-items: center; gap: 8px;
    padding: 5px 8px;
    background: var(--bg-2);
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
  }
  .bw-lbl { display: flex; align-items: center; gap: 8px; }
  .bw-key { font: 700 11px/1 var(--f-display); color: var(--orange); letter-spacing: .1em; min-width: 40px; }
  .bw-desc { font-size: 11px; color: var(--text-dim); }
  .bw-bar-wrap { height: 14px; background: var(--raised); border-radius: 3px; overflow: hidden; }
  .bw-bar { height: 100%; background: linear-gradient(90deg, var(--orange), #ff7043); transition: width .2s; }
  .bw-val { font-family: var(--f-mono); font-size: 11px; text-align: right; color: var(--text); }
  .bw-pct { color: var(--muted); font-size: 10px; margin-left: 4px; }
  @media (max-width: 700px) {
    .bw-row { grid-template-columns: 110px 1fr 110px; }
    .bw-desc { display: none; }
  }
</style>
