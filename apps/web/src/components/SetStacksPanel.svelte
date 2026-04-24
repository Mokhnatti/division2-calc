<script lang="ts">
  import { findSet4pc } from '../data/set-4pc-bonuses.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    setCounts: Record<string, number>;
    stacks: Record<string, number>;
    chestTalent: Record<string, boolean>;
    bpTalent: Record<string, boolean>;
    onChange: (setId: string, n: number) => void;
    onChestTalent: (setId: string, v: boolean) => void;
    onBpTalent: (setId: string, v: boolean) => void;
  }

  let { setCounts, stacks, chestTalent, bpTalent, onChange, onChestTalent, onBpTalent }: Props = $props();
  let lang = $derived(langState.current);

  let fourPcSets = $derived.by(() => {
    void lang;
    return Object.entries(setCounts)
      .filter(([, count]) => count >= 4)
      .map(([id]) => findSet4pc(id))
      .filter((s): s is NonNullable<ReturnType<typeof findSet4pc>> => !!s);
  });

  function maxStacks(s: ReturnType<typeof findSet4pc>, hasChest: boolean): number {
    if (!s) return 0;
    return hasChest && s.maxChest ? s.maxChest : s.maxBase;
  }

  function bonusLine(s: ReturnType<typeof findSet4pc>, count: number, hasBp: boolean): string {
    if (!s) return '';
    const list = hasBp && s.perStackBp ? s.perStackBp : s.perStack;
    const parts: string[] = [];
    for (const b of list) {
      parts.push(`+${(count * b.value).toFixed(1)}% ${b.stat.toUpperCase()}`);
    }
    return parts.join(' · ');
  }
</script>

{#if fourPcSets.length > 0}
  <section class="panel stacks">
    <div class="panel-title"><span>{lang === 'ru' ? 'Стаки 4шт сета' : '4pc Set Stacks'}</span></div>
    {#each fourPcSets as s (s.setId)}
      {@const hasChest = !!chestTalent[s.setId]}
      {@const hasBp = !!bpTalent[s.setId]}
      {@const cap = maxStacks(s, hasChest)}
      {@const current = Math.min(stacks[s.setId] ?? 0, cap)}
      <div class="stack-row">
        <div class="s-head">
          <span class="s-name">{lang === 'ru' ? s.name.ru : s.name.en}</span>
          <span class="s-max num">{current} / {cap}</span>
        </div>
        <div class="s-trig">⚡ {lang === 'ru' ? s.triggerNote.ru : s.triggerNote.en}</div>
        <div class="slider-wrap">
          <input
            type="range"
            min="0"
            max={cap}
            value={current}
            oninput={(e) => onChange(s.setId, parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0)}
          />
          <input
            type="number"
            class="input num"
            min="0"
            max={cap}
            value={current}
            oninput={(e) => onChange(s.setId, parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0)}
          />
          <button class="btn small" onclick={() => onChange(s.setId, cap)}>MAX</button>
        </div>
        {#if s.maxChest || s.perStackBp}
          <div class="set-tal-row">
            {#if s.maxChest}
              <div class="tal-info" class:on={hasChest}>
                {hasChest ? '✅' : '⚪'}
                <span>{lang === 'ru' ? `Талант жилета (→ ${s.maxChest} cap) — авто от одежды` : `Chest talent (→ ${s.maxChest} cap) — auto`}</span>
              </div>
            {/if}
            {#if s.perStackBp}
              <div class="tal-info" class:on={hasBp}>
                {hasBp ? '✅' : '⚪'}
                <span>{lang === 'ru' ? 'Талант рюкзака (сильнее за стак) — авто от одежды' : 'Backpack talent (stronger per-stack) — auto'}</span>
              </div>
            {/if}
          </div>
        {/if}
        {#if current > 0}
          <div class="s-bonus">{bonusLine(s, current, hasBp)}</div>
        {/if}
      </div>
    {/each}
  </section>
{/if}

<style>
  .stacks { margin-top: 8px; }
  .stack-row { padding: 8px; background: var(--bg-2); border: 1px solid var(--border); border-left: 3px solid var(--green); border-radius: var(--r); margin-bottom: 6px; }
  .s-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .s-name { font: 700 11px/1 var(--f-display); letter-spacing: .06em; color: var(--green); }
  .s-max { font-size: 10px; color: var(--muted); }
  .s-trig { font-size: 10px; color: var(--text-dim); font-style: italic; margin-bottom: 6px; }
  .slider-wrap { display: grid; grid-template-columns: 1fr 60px 50px; gap: 6px; align-items: center; }
  .slider-wrap input[type="range"] { accent-color: var(--orange); }
  .slider-wrap .input { padding: 4px 6px; font-size: 11px; }
  .s-bonus { margin-top: 6px; font: 700 11px/1 var(--f-mono); color: var(--green); padding: 4px 8px; background: rgba(1,254,144,.08); border-radius: 3px; }
  .set-tal-row { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); }
  .tal-info { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--muted); }
  .tal-info.on { color: var(--green); }
</style>
