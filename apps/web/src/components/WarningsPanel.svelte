<script lang="ts">
  import type { BuildWarning } from '../build-validation.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    warnings: BuildWarning[];
  }

  let { warnings }: Props = $props();
  let lang = $derived(langState.current);

  function msg(w: BuildWarning): string {
    void lang;
    return lang === 'ru' ? w.message.ru : w.message.en;
  }
</script>

{#if warnings.length > 0}
  <section class="panel warnings">
    <div class="panel-title">
      <span>{lang === 'ru' ? 'Советы по билду' : 'Build hints'}</span>
      <span class="count num">{warnings.length}</span>
    </div>
    <ul>
      {#each warnings as w, i (i)}
        <li class="warn-item" data-level={w.level}>
          <span class="icon">
            {#if w.level === 'error'}✕
            {:else if w.level === 'warn'}⚠
            {:else}ⓘ
            {/if}
          </span>
          <span class="text">{msg(w)}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .warnings { margin-top: 8px; }
  .count { font-size: 11px; color: var(--muted); background: var(--raised); padding: 2px 8px; border-radius: 999px; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .warn-item {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 6px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    border-left: 3px solid var(--muted);
    border-radius: var(--r-sm);
    font-size: 11px; line-height: 1.4;
  }
  .warn-item[data-level="info"] { border-left-color: var(--blue); color: var(--text-dim); }
  .warn-item[data-level="warn"] { border-left-color: var(--orange); color: var(--orange-hi); background: rgba(254,175,16,.05); }
  .warn-item[data-level="error"] { border-left-color: var(--red); color: var(--red); background: rgba(255,94,98,.05); }
  .icon { font-size: 12px; flex-shrink: 0; }
  .text { flex: 1; }
</style>
