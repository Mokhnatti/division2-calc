<script lang="ts">
  import type { BuildSummary, BuildState } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';
  import { encodeBuild, applyUrlToBuild } from '../build-url.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    build: BuildState;
    data: GameData;
    currentSummary: BuildSummary | null;
  }

  let { build, data, currentSummary }: Props = $props();
  let lang = $derived(langState.current);

  interface Snapshot {
    name: string;
    url: string;
    summary: BuildSummary;
  }

  const STORAGE_KEY = 'divcalc:compare-snapshots';
  let snapshots = $state<Snapshot[]>([]);

  $effect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) snapshots = JSON.parse(raw);
    } catch { /* ignore */ }
  });

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots)); } catch { /* ignore */ }
  }

  function saveSnapshot() {
    if (!currentSummary) return;
    const url = encodeBuild(build);
    const name = prompt(lang === 'en' ? 'Build name:' : 'Название билда:', `Build ${snapshots.length + 1}`);
    if (!name) return;
    snapshots = [...snapshots, { name, url, summary: currentSummary }];
    persist();
  }

  function remove(i: number) {
    snapshots = snapshots.filter((_, idx) => idx !== i);
    persist();
  }

  function restore(i: number) {
    const snap = snapshots[i];
    if (!snap) return;
    const params = new URLSearchParams(snap.url);
    build.reset();
    applyUrlToBuild(build, params);
  }

  function wName(id: string | null): string {
    if (!id) return lang === 'en' ? '— none —' : '— нет —';
    void lang;
    return i18next.t(id, { ns: 'weapons', defaultValue: id }) as string;
  }

  function fmt(n: number): string {
    return Math.round(n).toLocaleString(lang === 'ru' ? 'ru' : 'en');
  }

  function delta(a: number, b: number): { txt: string; cls: string } {
    const d = a - b;
    if (Math.abs(d) < 1) return { txt: '=', cls: 'eq' };
    const pct = b > 0 ? (d / b) * 100 : 0;
    return {
      txt: `${d >= 0 ? '+' : ''}${fmt(d)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`,
      cls: d > 0 ? 'up' : 'down',
    };
  }
</script>

<section class="panel bc">
  <div class="panel-title">
    <span>⚖ {lang === 'en' ? 'Compare Builds' : 'Сравнение билдов'}</span>
    <button class="btn small" onclick={saveSnapshot} disabled={!currentSummary}>
      💾 {lang === 'en' ? 'Save current' : 'Сохранить текущий'}
    </button>
  </div>

  {#if snapshots.length === 0}
    <div class="bc-empty">
      {lang === 'en'
        ? 'Save 2+ snapshots to compare. Configure a build, save it, change something, save again — see delta.'
        : 'Сохрани 2+ снапшота для сравнения. Настрой билд, сохрани, поменяй что-то, сохрани ещё раз — увидишь разницу.'}
    </div>
  {:else}
    <table class="bc-table">
      <thead>
        <tr>
          <th></th>
          <th>{lang === 'en' ? 'Weapon' : 'Оружие'}</th>
          <th class="num">Burst DPS</th>
          <th class="num">Sustained</th>
          <th class="num">Bullet</th>
          <th class="num">{lang === 'en' ? 'vs best' : 'от лучшего'}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each snapshots as snap, i (i)}
          {@const maxBurst = Math.max(...snapshots.map((s) => s.summary.dps.burstDps))}
          {@const d = delta(snap.summary.dps.burstDps, maxBurst)}
          <tr class:best={snap.summary.dps.burstDps === maxBurst}>
            <td>{snap.name}</td>
            <td>{wName(snap.url.match(/w=([^&]+)/)?.[1] ?? null)}</td>
            <td class="num">{fmt(snap.summary.dps.burstDps)}</td>
            <td class="num">{fmt(snap.summary.dps.sustainedDps)}</td>
            <td class="num">{fmt(snap.summary.dps.bulletDamage)}</td>
            <td class="num d-{d.cls}">{d.txt}</td>
            <td class="bc-actions">
              <button class="btn small" onclick={() => restore(i)} title="Load">↺</button>
              <button class="btn small danger" onclick={() => remove(i)} title="Delete">×</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .bc { max-width: 1100px; margin: 10px auto; }
  .bc-empty { text-align: center; padding: 30px; color: var(--muted); font-style: italic; font-size: 12px; }
  .bc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .bc-table th, .bc-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
  .bc-table th { font: 700 10px/1 var(--f-display); letter-spacing: .12em; color: var(--orange); text-transform: uppercase; text-align: left; }
  .bc-table th.num, .bc-table td.num { text-align: right; font-family: var(--f-mono); }
  .bc-table tr.best { background: rgba(254,175,16,.06); font-weight: 700; }
  .bc-table tr.best td { color: var(--orange); }
  .d-up { color: var(--green); }
  .d-down { color: var(--red); }
  .d-eq { color: var(--muted); }
  .bc-actions { display: flex; gap: 4px; justify-content: flex-end; }
  .btn.small.danger { color: var(--red); }
</style>
