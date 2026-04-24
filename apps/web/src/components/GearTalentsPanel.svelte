<script lang="ts">
  import { SPECS, WEAPON_CLASSES, SPEC_CLASS_MAX_PICKS } from '../data/specializations.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    shdActive: boolean;
    specId: string | null;
    classPicks: string[];
    mmrRifleHsd?: boolean;  // deprecated, kept for compat
    onShdActiveChange: (v: boolean) => void;
    onSpecChange: (id: string | null) => void;
    onClassPickToggle: (cls: string) => void;
    onMmrRifleHsdChange: (v: boolean) => void;
  }

  let { shdActive, specId, classPicks, mmrRifleHsd = false,
        onShdActiveChange, onSpecChange, onClassPickToggle, onMmrRifleHsdChange }: Props = $props();
  // Silence unused
  void mmrRifleHsd; void onMmrRifleHsdChange;
  let lang = $derived(langState.current);
  let spec = $derived(specId ? SPECS.find((s) => s.id === specId) : null);
</script>

<section class="panel gtp">
  <div class="panel-title"><span>{lang === 'ru' ? 'Общее' : 'Global'}</span></div>

  <div class="row">
    <div class="slot-lbl">🎖 Spec</div>
    <select
      class="input"
      value={specId ?? ''}
      onchange={(e) => onSpecChange((e.currentTarget as HTMLSelectElement).value || null)}
    >
      <option value="">— —</option>
      {#each SPECS as s (s.id)}
        <option value={s.id}>{langState.current === 'ru' ? s.name.ru : s.name.en}</option>
      {/each}
    </select>
    <span></span>
  </div>
  {#if spec}
    <div class="note active">{langState.current === 'ru' ? spec.note.ru : spec.note.en}</div>

    <div class="subrow">
      <div class="sub-label">
        {lang === 'ru' ? 'Прокачать классы (+15% WD каждый)' : 'Invested classes (+15% WD each)'}
        <span class="picks-count num">{classPicks.length}/{SPEC_CLASS_MAX_PICKS}</span>
      </div>
      <div class="chip-row">
        {#each WEAPON_CLASSES as c (c.id)}
          {@const on = classPicks.includes(c.id)}
          {@const disabled = !on && classPicks.length >= SPEC_CLASS_MAX_PICKS}
          <button
            type="button"
            class="chip"
            class:on
            class:disabled
            onclick={() => !disabled && onClassPickToggle(c.id)}
          >{lang === 'ru' ? c.label_ru : c.label_en}{#if on} ✓{/if}</button>
        {/each}
      </div>
    </div>

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
  .subrow { margin: 6px 0 6px 96px; }
  .sub-label { font-size: 10px; color: var(--text-dim); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .picks-count { font-size: 9px; color: var(--muted); background: var(--raised); padding: 2px 6px; border-radius: 999px; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    padding: 4px 9px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--muted);
    cursor: pointer;
    font: 700 9px/1 var(--f-display);
    letter-spacing: .08em;
    transition: all .12s;
  }
  .chip:hover:not(.disabled) { border-color: var(--border-hi); color: var(--text-dim); }
  .chip.on { background: rgba(254,175,16,.15); border-color: rgba(254,175,16,.5); color: var(--orange); }
  .chip.disabled { opacity: .3; cursor: not-allowed; }
  .tree-toggle { display: inline-flex; align-items: center; gap: 6px; margin: 4px 0 6px 96px; font-size: 10px; color: var(--text-dim); cursor: pointer; }
  .tree-toggle input { accent-color: var(--orange); }
</style>
