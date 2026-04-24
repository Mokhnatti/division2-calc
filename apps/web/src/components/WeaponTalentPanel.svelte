<script lang="ts">
  import type { GameData } from '../data.js';
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';

  interface Props {
    data: GameData;
    weaponId: string | null;
    active: boolean;
    stacks: number;
    onToggle: (v: boolean) => void;
    onStacksChange: (n: number) => void;
    /** For base weapons: user-selected talent id */
    customTalentId?: string | null;
    onCustomTalentChange?: (id: string | null) => void;
  }

  let { data, weaponId, active, stacks, onToggle, onStacksChange, customTalentId, onCustomTalentChange }: Props = $props();
  let lang = $derived(langState.current);

  let weapon = $derived(weaponId ? data.byId.weapon.get(weaponId) : null);
  let isBase = $derived(weapon?.kind === 'base');
  // Named/Exotic: use weapon.talentId (locked). Base: use customTalentId chosen by user.
  let effectiveTalentId = $derived(isBase ? customTalentId : weapon?.talentId);
  let talent = $derived(effectiveTalentId ? data.byId.talent.get(effectiveTalentId) : null);

  let weaponTalentOpts = $derived.by(() => {
    void lang;
    if (!weapon) return [] as Array<{ id: string; name: string }>;
    const cat = weapon.category;
    return data.talents
      .filter((t) => t.kind === 'weapon')
      .filter((t) => !t.applicableWeaponClasses?.length || t.applicableWeaponClasses.some((c) => c.toLowerCase() === cat || c.toLowerCase() === cat.toUpperCase()))
      .map((t) => ({ id: t.id, name: i18next.t(t.id, { ns: 'talents', defaultValue: t.id }) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  const TAL_TYPE_DESC: Record<string, { en: string; ru: string }> = {
    amp: { en: 'Constant bonus when active', ru: 'Постоянный бонус при активации' },
    swap_in: { en: 'Active for 20s after swap', ru: 'Активен 20с после свапа' },
    stacks: { en: 'Stacks per shot/hit', ru: 'Стакается за выстрел/попадание' },
    kill: { en: 'Stacks per kill (~0.33/s)', ru: 'Стак за убийство (~0.33/с)' },
    hs_kill: { en: 'Stacks per headshot kill', ru: 'Стак за хедшот-убийство' },
    shot_cover: { en: 'Stacks in cover (linear)', ru: 'Стаки в укрытии (линейно)' },
    conditional: { en: 'Only active at peak state', ru: 'Только в пиковом состоянии' },
    no_reload: { en: 'No reload animation', ru: 'Без перезарядки' },
  };

  let stacksSupported = $derived(
    weapon?.talType && ['kill', 'stacks', 'shot_cover', 'hs_kill'].includes(weapon.talType)
  );

  function effectiveBonus(): number {
    if (!weapon || !weapon.talType || typeof weapon.talBonus !== 'number') return 0;
    if (['amp', 'swap_in', 'conditional'].includes(weapon.talType)) return weapon.talBonus;
    if (stacksSupported) {
      const max = weapon.talMax || 1;
      return Math.min(stacks, max) / max * weapon.talBonus;
    }
    return 0;
  }
  let currentBonus = $derived(effectiveBonus());

  let talentName = $derived.by(() => {
    void lang;
    if (!talent) return '';
    return i18next.t(talent.id, { ns: 'talents', defaultValue: talent.id }) as string;
  });
  let talentDesc = $derived.by(() => {
    void lang;
    if (!talent) return '';
    if (!i18next.exists(talent.id, { ns: 'talent-desc' })) return '';
    return i18next.t(talent.id, { ns: 'talent-desc', defaultValue: '' }) as string;
  });

  let bonusSummary = $derived.by(() => {
    void lang;
    if (!talent) return '';
    return talent.bonuses
      .map((b) => `+${b.value}% ${i18next.t(b.stat, { ns: 'stats', defaultValue: b.stat })}`)
      .join(' · ');
  });
</script>

{#if weapon && isBase}
  <div class="wtp">
    <div class="wtp-head">
      <span class="wtp-picker-label">🎯 {lang === 'en' ? 'Talent' : 'Талант'}:</span>
      <select
        class="input wtp-picker"
        value={customTalentId ?? ''}
        onchange={(e) => onCustomTalentChange?.(((e.currentTarget as HTMLSelectElement).value || null))}
      >
        <option value="">— {lang === 'en' ? 'none' : 'нет'} —</option>
        {#each weaponTalentOpts as t (t.id)}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
      {#if customTalentId}
        <label class="wtp-toggle">
          <input type="checkbox" checked={active} onchange={(e) => onToggle((e.currentTarget as HTMLInputElement).checked)} />
          <span>{t('ui', 'apply')}</span>
        </label>
      {/if}
    </div>
    {#if talentDesc}
      <div class="wtp-desc">{talentDesc}</div>
    {/if}
  </div>
{/if}

{#if weapon && !isBase && talent}
  <div class="wtp">
    <div class="wtp-head">
      <span class="dot {weapon.kind}"></span>
      <span class="wtp-name" class:named={weapon.kind === 'named'} class:exotic={weapon.kind === 'exotic'}>
        {talentName}
      </span>
      {#if weapon.talType}
        <span class="wtp-type" title={lang === 'en' ? TAL_TYPE_DESC[weapon.talType]?.en : TAL_TYPE_DESC[weapon.talType]?.ru}>
          {weapon.talType}
        </span>
      {:else}
        <span class="wtp-type">{talent.bonusType}</span>
      {/if}
      <label class="wtp-toggle">
        <input type="checkbox" checked={active} onchange={(e) => onToggle((e.currentTarget as HTMLInputElement).checked)} />
        <span>{t('ui', 'apply')}</span>
      </label>
    </div>

    {#if stacksSupported && weapon.talMax && weapon.talMax > 1}
      <div class="wtp-stacks">
        <div class="ws-label">
          {lang === 'en' ? 'Stacks' : 'Стаки'}: <b class="num">{Math.min(stacks, weapon.talMax)}/{weapon.talMax}</b>
        </div>
        <input
          type="range"
          min="0"
          max={weapon.talMax}
          value={stacks}
          oninput={(e) => onStacksChange(parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0)}
        />
        <button class="btn-max" onclick={() => onStacksChange(weapon?.talMax ?? 0)}>MAX</button>
      </div>
    {/if}

    {#if active && currentBonus > 0}
      <div class="wtp-bonus">+{currentBonus.toFixed(1)}% WD</div>
    {:else if bonusSummary}
      <div class="wtp-bonus">{bonusSummary}</div>
    {/if}

    {#if weapon.talType && TAL_TYPE_DESC[weapon.talType]}
      <div class="wtp-note">
        ⚡ {lang === 'en' ? TAL_TYPE_DESC[weapon.talType].en : TAL_TYPE_DESC[weapon.talType].ru}
      </div>
    {/if}

    {#if talentDesc}
      <div class="wtp-desc">{talentDesc}</div>
    {/if}
  </div>
{/if}

<style>
  .wtp {
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--orange);
    border-radius: var(--r);
    padding: 8px 10px;
    margin-top: 8px;
  }
  .wtp-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .wtp-picker-label { font: 700 10px/1 var(--f-display); letter-spacing: .1em; color: var(--orange); text-transform: uppercase; }
  .wtp-picker { flex: 1; min-width: 140px; padding: 6px 8px; font-size: 12px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; }
  .dot.base { background: var(--muted); }
  .dot.named { background: var(--named); }
  .dot.exotic { background: var(--exotic); }
  .wtp-name { font: 700 12px/1 var(--f-display); letter-spacing: .08em; color: var(--orange); flex: 1; }
  .wtp-name.named { color: var(--named); }
  .wtp-name.exotic { color: var(--exotic); }
  .wtp-type {
    font: 700 9px/1 var(--f-display); text-transform: uppercase;
    padding: 2px 6px; border-radius: 999px;
    background: var(--raised); color: var(--muted); letter-spacing: .08em;
  }
  .wtp-toggle { display: flex; align-items: center; gap: 4px; font: 700 10px/1 var(--f-display); letter-spacing: .08em; text-transform: uppercase; color: var(--text-dim); cursor: pointer; }
  .wtp-toggle input { accent-color: var(--orange); }
  .wtp-stacks { display: grid; grid-template-columns: auto 1fr 50px; gap: 6px; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); }
  .ws-label { font-size: 10px; color: var(--text-dim); font-family: var(--f-mono); white-space: nowrap; }
  .wtp-stacks input[type="range"] { accent-color: var(--orange); }
  .btn-max { padding: 3px 8px; background: var(--raised); border: 1px solid var(--border); color: var(--orange); border-radius: 3px; cursor: pointer; font: 700 9px/1 var(--f-display); letter-spacing: .1em; }
  .btn-max:hover { background: rgba(254,175,16,.15); border-color: var(--orange); }
  .wtp-note { margin-top: 4px; font-size: 10px; color: var(--blue); font-style: italic; }

  .wtp-bonus {
    margin-top: 6px; font-size: 11px; color: var(--green);
    font-family: var(--f-mono);
  }
  .wtp-desc {
    margin-top: 4px; font-size: 10px; color: var(--text-dim);
    line-height: 1.4; max-height: 60px; overflow: auto;
  }
</style>
