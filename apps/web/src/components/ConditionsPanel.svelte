<script lang="ts">
  import { t, lang as langState } from '../lang-state.svelte.js';

  interface Props {
    groupSize: number;
    targetStatus: 'none' | 'burning' | 'bleeding' | 'shocked' | 'poisoned' | 'blinded';
    targetPulsed: boolean;
    fullArmor: boolean;
    onGroupSize: (n: number) => void;
    onStatus: (s: Props['targetStatus']) => void;
    onPulsed: (v: boolean) => void;
    onFullArmor: (v: boolean) => void;
  }

  let { groupSize, targetStatus, targetPulsed, fullArmor, onGroupSize, onStatus, onPulsed, onFullArmor }: Props = $props();
  let lang = $derived(langState.current);

  const STATUSES: Array<{ id: Props['targetStatus']; en: string; ru: string; color: string; icon: string }> = [
    { id: 'none', en: 'None', ru: 'Нет', color: '#666', icon: '—' },
    { id: 'burning', en: 'Burning', ru: 'Горит', color: '#ff6a00', icon: '🔥' },
    { id: 'bleeding', en: 'Bleeding', ru: 'Кровотеч.', color: '#ef5350', icon: '🩸' },
    { id: 'shocked', en: 'Shocked', ru: 'Шок', color: '#42a5f5', icon: '⚡' },
    { id: 'poisoned', en: 'Poisoned', ru: 'Отравл.', color: '#4caf50', icon: '☠' },
    { id: 'blinded', en: 'Blinded', ru: 'Слеп', color: '#ffd84a', icon: '✦' },
  ];

  function statusLabel(s: typeof STATUSES[number]) {
    void lang;
    return lang === 'en' ? s.en : s.ru;
  }
</script>

<section class="panel cond">
  <div class="panel-title"><span>{lang === 'en' ? 'Combat Conditions' : 'Условия боя'}</span></div>

  <div class="row">
    <div class="label">{lang === 'en' ? 'Group size' : 'Группа'}</div>
    <div class="group-btns">
      {#each [1, 2, 3, 4] as n (n)}
        <button
          class="btn small"
          class:active={groupSize === n}
          onclick={() => onGroupSize(n)}
        >{n === 1 ? (lang === 'en' ? 'Solo' : 'Соло') : `${n}`}</button>
      {/each}
    </div>
    {#if groupSize > 1}
      <span class="hint-green">+{(groupSize - 1) * 5}% WD</span>
    {/if}
  </div>

  <div class="row">
    <div class="label">{lang === 'en' ? 'Target status' : 'Статус цели'}</div>
    <div class="status-btns">
      {#each STATUSES as s (s.id)}
        <button
          class="status-btn"
          class:active={targetStatus === s.id}
          style:--sc={s.color}
          onclick={() => onStatus(s.id)}
        >
          <span class="si">{s.icon}</span>
          <span>{statusLabel(s)}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="row toggles">
    <label class="tog">
      <input type="checkbox" checked={targetPulsed} onchange={(e) => onPulsed((e.currentTarget as HTMLInputElement).checked)} />
      <span>{lang === 'en' ? 'Target pulsed' : 'Цель отмечена'}</span>
    </label>
    <label class="tog">
      <input type="checkbox" checked={fullArmor} onchange={(e) => onFullArmor((e.currentTarget as HTMLInputElement).checked)} />
      <span>{lang === 'en' ? 'Full armor' : 'Полная броня'}</span>
    </label>
  </div>
</section>

<style>
  .cond { margin-top: 8px; }
  .row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .label { font: 700 10px/1 var(--f-display); letter-spacing: .12em; text-transform: uppercase; color: var(--orange); min-width: 90px; }
  .group-btns { display: flex; gap: 3px; }
  .status-btns { display: flex; gap: 3px; flex-wrap: wrap; }
  .status-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 8px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--text-dim);
    border-radius: var(--r-sm);
    cursor: pointer;
    font: 700 10px/1 var(--f-display); letter-spacing: .06em;
    text-transform: uppercase;
  }
  .status-btn:hover { border-color: var(--border-hi); }
  .status-btn.active {
    border-color: var(--sc, var(--orange));
    background: color-mix(in oklab, var(--sc) 15%, var(--bg-2));
    color: var(--sc, var(--orange));
  }
  .si { font-size: 12px; }
  .toggles { gap: 16px; }
  .tog { display: flex; align-items: center; gap: 6px; cursor: pointer; font: 700 10px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); }
  .tog input { accent-color: var(--orange); }
  .hint-green { font: 700 10px/1 var(--f-mono); color: var(--green); padding: 4px 8px; background: rgba(1,254,144,.08); border-radius: 999px; }
</style>
