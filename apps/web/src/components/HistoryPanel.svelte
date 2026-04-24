<script lang="ts">
  import type { BuildState } from '../build-state.svelte.js';
  import { loadHistory, saveBuildToHistory, loadBuildFromHistory, deleteBuildFromHistory, type SavedBuild } from '../build-history.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    build: BuildState;
    onLoad: () => void;
  }

  let { build, onLoad }: Props = $props();
  let lang = $derived(langState.current);

  let list = $state<SavedBuild[]>(loadHistory());
  let newName = $state('');
  let showAll = $state(false);

  function save() {
    const name = newName.trim() || `Build ${new Date().toLocaleTimeString()}`;
    list = saveBuildToHistory(build, name);
    newName = '';
  }
  function load(entry: SavedBuild) {
    loadBuildFromHistory(build, entry);
    onLoad();
  }
  function del(name: string) {
    list = deleteBuildFromHistory(name);
  }
</script>

<section class="panel hist">
  <div class="panel-title">
    <span>{lang === 'ru' ? 'Сохранённые билды' : 'Saved builds'}</span>
    {#if list.length > 0}
      <button class="toggle" onclick={() => (showAll = !showAll)}>
        {showAll ? (lang === 'ru' ? 'Скрыть' : 'Hide') : (lang === 'ru' ? `Показать (${list.length})` : `Show (${list.length})`)}
      </button>
    {/if}
  </div>

  <div class="save-row">
    <input
      class="input"
      type="text"
      placeholder={lang === 'ru' ? 'Имя билда' : 'Build name'}
      bind:value={newName}
    />
    <button class="btn small" onclick={save}>💾 {lang === 'ru' ? 'Сохранить' : 'Save'}</button>
  </div>

  {#if showAll && list.length > 0}
    <ul class="h-list">
      {#each list as s (s.name)}
        <li>
          <button class="load-btn" onclick={() => load(s)}>
            <span class="l-name">{s.name}</span>
            <span class="l-date">{new Date(s.at).toLocaleDateString()}</span>
          </button>
          <button class="del-btn" onclick={() => del(s.name)} title={lang === 'ru' ? 'Удалить' : 'Delete'}>×</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .hist { margin-top: 8px; }
  .toggle { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 3px 10px; border-radius: 999px; cursor: pointer; font: 700 9px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; }
  .toggle:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .save-row { display: grid; grid-template-columns: 1fr 100px; gap: 6px; align-items: center; }
  .save-row .input { padding: 6px 10px; font-size: 12px; }
  .h-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; max-height: 200px; overflow-y: auto; }
  .h-list li { display: flex; gap: 3px; }
  .load-btn { flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-2); border: 1px solid var(--border); color: var(--text); border-radius: var(--r-sm); cursor: pointer; font-size: 11px; }
  .load-btn:hover { background: rgba(254,175,16,.08); border-color: rgba(254,175,16,.3); color: var(--orange-hi); }
  .l-name { font-weight: 600; }
  .l-date { font-size: 9px; color: var(--muted); font-family: var(--f-mono); }
  .del-btn { padding: 0 8px; background: transparent; border: 1px solid var(--border); color: var(--red); cursor: pointer; border-radius: var(--r-sm); }
  .del-btn:hover { background: rgba(255,94,98,.1); border-color: var(--red); }
</style>
