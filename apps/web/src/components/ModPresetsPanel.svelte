<script lang="ts">
  import { MOD_PRESETS, findModPreset } from '../data/gear-mods.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    onApply: (chestMod: string, backpackMod: string, maskMod: string) => void;
  }

  let { onApply }: Props = $props();
  let lang = $derived(langState.current);

  function apply(presetId: string) {
    const p = findModPreset(presetId);
    if (!p) return;
    onApply(p.mods[0], p.mods[1], p.mods[2]);
  }
</script>

<section class="panel presets">
  <div class="panel-title">
    <span>{lang === 'en' ? 'Mod Presets' : 'Пресеты вставок'}</span>
  </div>
  <div class="preset-grid">
    {#each MOD_PRESETS as p (p.id)}
      <button class="preset" onclick={() => apply(p.id)}>
        <div class="p-name">{langState.current === 'en' ? p.name.en : p.name.ru}</div>
        <div class="p-desc">{langState.current === 'en' ? p.description.en : p.description.ru}</div>
      </button>
    {/each}
  </div>
  <div class="note">
    {lang === 'en'
      ? 'Applies to Chest + Backpack + Mask mod slots in one click.'
      : 'Применяет пресет в слоты Бронежилет + Рюкзак + Маска одним кликом.'}
  </div>
</section>

<style>
  .presets { margin-top: 8px; }
  .preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; }
  .preset {
    padding: 7px 10px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    color: var(--text);
    cursor: pointer;
    text-align: left;
    transition: background .12s, border-color .12s;
  }
  .preset:hover {
    background: rgba(254,175,16,.08);
    border-color: rgba(254,175,16,.4);
  }
  .p-name { font: 700 10px/1 var(--f-display); letter-spacing: .08em; color: var(--orange); text-transform: uppercase; margin-bottom: 3px; }
  .p-desc { font-size: 10px; color: var(--text-dim); line-height: 1.3; }
  .note { margin-top: 8px; font-size: 10px; color: var(--muted); font-style: italic; }
</style>
