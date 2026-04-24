<script lang="ts">
  import { t } from '../lang-state.svelte.js';

  export type Tab = 'build' | 'catalog' | 'dps' | 'skills' | 'tank' | 'top' | 'community' | 'mods' | 'expertise' | 'recomb' | 'formulas' | 'help';

  interface Props {
    active: Tab;
    onPick: (tab: Tab) => void;
  }

  let { active, onPick }: Props = $props();

  const tabs: Array<{ id: Tab; labelKey: string; icon: string }> = [
    { id: 'build', labelKey: 'tab_build', icon: '⚙' },
    { id: 'catalog', labelKey: 'tab_catalog', icon: '📚' },
    { id: 'dps', labelKey: 'tab_dps', icon: '💥' },
    { id: 'skills', labelKey: 'tab_skills', icon: '⚡' },
    { id: 'tank', labelKey: 'tab_tank', icon: '🛡' },
    { id: 'top', labelKey: 'tab_top', icon: '🏆' },
    { id: 'community', labelKey: 'tab_community', icon: '👥' },
    { id: 'mods', labelKey: 'tab_mods', icon: '🔧' },
    { id: 'expertise', labelKey: 'tab_expertise', icon: '⭐' },
    { id: 'recomb', labelKey: 'tab_recomb', icon: '🧬' },
    { id: 'formulas', labelKey: 'tab_formulas', icon: '📐' },
    { id: 'help', labelKey: 'tab_help', icon: '❓' },
  ];
</script>

<nav class="tab-nav">
  {#each tabs as tab (tab.id)}
    <button
      class="tab-btn"
      class:active={active === tab.id}
      onclick={() => onPick(tab.id)}
    >
      <span class="ico">{tab.icon}</span>
      <span>{t('ui', tab.labelKey)}</span>
    </button>
  {/each}
</nav>

<style>
  .tab-nav {
    display: flex; gap: 6px;
    padding: 12px 18px 0;
    max-width: 1400px; margin: 0 auto;
    flex-wrap: wrap;
    justify-content: center;
  }
  @media (max-width: 900px) {
    .tab-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 200;
      max-width: none;
      margin: 0;
      padding: 8px 10px;
      background: #0c0f18;
      border-top: 1px solid var(--border);
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      justify-content: flex-start;
    }
    .tab-btn {
      flex-shrink: 0;
      padding: 8px 10px;
      font-size: 9px;
    }
  }
  .tab-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--text-dim);
    cursor: pointer;
    font: 700 11px/1 var(--f-display);
    letter-spacing: .12em;
    text-transform: uppercase;
    transition: transform .12s var(--ease), background .15s, border-color .15s, color .15s, box-shadow .15s;
  }
  .tab-btn:hover {
    border-color: var(--border-hi);
    color: var(--text);
    background: var(--card-2);
    transform: translateY(-1px);
  }
  .tab-btn.active {
    background: var(--orange) !important;
    color: #000 !important;
    border-color: var(--orange) !important;
    box-shadow: 0 0 0 1px rgba(255,255,255,.1) inset, 0 6px 18px -6px rgba(254,175,16,.6);
  }
  .ico { font-size: 14px; }
</style>
