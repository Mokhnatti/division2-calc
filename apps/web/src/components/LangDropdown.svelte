<script lang="ts">
  import type { Locale } from '../i18n.js';

  interface Props {
    current: Locale;
    onPick: (l: Locale) => void;
  }

  let { current, onPick }: Props = $props();
  let open = $state(false);
  let triggerEl: HTMLButtonElement | undefined = $state(undefined);
  let listPos = $state({ top: 0, left: 0 });

  function updatePos() {
    if (!triggerEl) return;
    const r = triggerEl.getBoundingClientRect();
    listPos = { top: r.bottom + 6, left: r.left };
  }

  interface LangInfo {
    code: Locale;
    short: string;
    label: string;
    native: string;
    available: boolean;
  }

  const LANGS: LangInfo[] = [
    { code: 'en', short: 'EN', label: 'English', native: 'English', available: true },
    { code: 'ru', short: 'RU', label: 'Русский', native: 'Русский', available: true },
  ];

  let currentLang = $derived(LANGS.find((l) => l.code === current) ?? LANGS[0]);

  function pick(code: Locale) {
    onPick(code);
    open = false;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.lang-dd')) open = false;
  }

  $effect(() => {
    if (open) {
      updatePos();
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  });
</script>

<div class="lang-dd">
  <button
    class="lang-trigger"
    class:open
    bind:this={triggerEl}
    onclick={(e) => {
      e.stopPropagation();
      open = !open;
    }}
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <span class="code">{currentLang?.short}</span>
    <span class="chev" class:open>▾</span>
  </button>

  {#if open}
    <ul class="lang-list" role="listbox" style="top: {listPos.top}px; left: {listPos.left}px;">
      {#each LANGS as l (l.code)}
        <li>
          <button
            class="lang-opt"
            class:active={l.code === current}
            class:na={!l.available}
            disabled={!l.available}
            onclick={(e) => {
              e.stopPropagation();
              if (l.available) pick(l.code);
            }}
          >
            <span class="opt-code">{l.short}</span>
            <span class="opt-label">{l.native}</span>
            {#if !l.available}
              <span class="opt-badge">soon</span>
            {:else if l.code === current}
              <span class="opt-check">✓</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .lang-dd {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 500;
  }
  .lang-trigger {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px 7px 12px;
    background: rgba(88,169,255,.08);
    border: 1px solid rgba(88,169,255,.35);
    border-radius: var(--r);
    color: var(--blue);
    cursor: pointer;
    font: 700 11px/1 var(--f-display);
    letter-spacing: .18em;
    text-transform: uppercase;
    transition: background .15s, border-color .15s, box-shadow .15s;
  }
  .lang-trigger:hover,
  .lang-trigger.open {
    background: rgba(88,169,255,.2);
    border-color: var(--blue);
    box-shadow: 0 0 12px rgba(88,169,255,.2);
  }
  .lang-trigger .code { min-width: 22px; text-align: center; }
  .lang-trigger .chev {
    font-size: 10px;
    transition: transform .15s;
    color: rgba(88,169,255,.7);
    margin-left: 2px;
  }
  .lang-trigger .chev.open { transform: rotate(180deg); }

  .lang-list {
    position: fixed;
    min-width: 200px;
    max-height: 360px;
    overflow-y: auto;
    background: #0c0f18;
    border: 1px solid var(--border-hi);
    border-radius: var(--r);
    box-shadow:
      0 0 0 1px rgba(88,169,255,.1) inset,
      0 24px 48px rgba(0,0,0,.7),
      0 0 20px rgba(88,169,255,.08);
    padding: 4px;
    margin: 0;
    list-style: none;
    z-index: 9999;
  }

  .lang-opt {
    display: flex; align-items: center; gap: 10px;
    width: 100%;
    padding: 8px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    color: var(--text);
    cursor: pointer;
    font: 500 12px/1 var(--f-body);
    text-align: left;
    transition: background .12s, color .12s, border-color .12s;
  }
  .lang-opt:hover:not(:disabled) {
    background: rgba(254,175,16,.1);
    color: var(--orange-hi);
    border-color: rgba(254,175,16,.25);
  }
  .lang-opt.active {
    background: rgba(254,175,16,.12);
    border-color: rgba(254,175,16,.4);
    color: var(--orange);
  }
  .lang-opt.na { opacity: .4; cursor: not-allowed; }

  .opt-code {
    font: 700 10px/1 var(--f-display);
    letter-spacing: .14em;
    padding: 4px 7px;
    border-radius: 3px;
    background: var(--raised);
    color: var(--text-dim);
    min-width: 32px;
    text-align: center;
  }
  .lang-opt.active .opt-code {
    background: rgba(254,175,16,.18);
    color: var(--orange);
  }

  .opt-label { flex: 1; }

  .opt-badge {
    font: 700 8px/1 var(--f-display);
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(109,116,136,.2);
    color: var(--muted);
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .opt-check {
    color: var(--orange);
    font-weight: 700;
  }
</style>
