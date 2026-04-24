<script lang="ts">
  import { SPECS } from '../data/specializations.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    shdActive: boolean;
    specId: string | null;
    onShdActiveChange: (v: boolean) => void;
    onSpecChange: (id: string | null) => void;
  }

  let { shdActive, specId, onShdActiveChange, onSpecChange }: Props = $props();
  let lang = $derived(langState.current);
</script>

<section class="panel gtp">
  <div class="panel-title"><span>{lang === 'en' ? 'Global' : 'Общее'}</span></div>

  <div class="row">
    <div class="slot-lbl">🎖 Spec</div>
    <select
      class="input"
      value={specId ?? ''}
      onchange={(e) => onSpecChange((e.currentTarget as HTMLSelectElement).value || null)}
    >
      <option value="">— —</option>
      {#each SPECS as s (s.id)}
        <option value={s.id}>{langState.current === 'en' ? s.name.en : s.name.ru}</option>
      {/each}
    </select>
    <span></span>
  </div>
  {#if specId}
    {@const spec = SPECS.find((s) => s.id === specId)}
    {#if spec}
      <div class="note active">{langState.current === 'en' ? spec.note.en : spec.note.ru}</div>
    {/if}
  {/if}

  <div class="row shd-row">
    <div class="slot-lbl">🏅 SHD 1000+</div>
    <div class="shd-desc">+10% WD · +10% CHC · +10% CHD</div>
    <label class="toggle">
      <input type="checkbox" checked={shdActive} onchange={(e) => onShdActiveChange((e.currentTarget as HTMLInputElement).checked)} />
      <span>on</span>
    </label>
  </div>
</section>

<style>
  .gtp { margin-top: 8px; }
  .row { display: grid; grid-template-columns: 90px 1fr 60px; gap: 6px; align-items: center; margin-bottom: 4px; }
  .slot-lbl { font: 700 10px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--orange); }
  .input { padding: 5px 8px; font-size: 11px; }
  .toggle { display: flex; align-items: center; gap: 4px; font: 700 9px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); cursor: pointer; justify-content: center; }
  .toggle input { accent-color: var(--orange); }
  .note {
    font-size: 10px; color: var(--muted);
    padding: 4px 8px; margin: 2px 0 8px 96px;
    border-left: 2px solid var(--border);
  }
  .note.active { color: var(--green); border-left-color: var(--green); background: rgba(1,254,144,.05); }
  .shd-row { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); }
  .shd-desc { font-size: 10px; color: var(--green); font-family: var(--f-mono); }
</style>
