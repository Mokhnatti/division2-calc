<script lang="ts">
  import type { GameData } from '../data.js';
  import type { SlotKey, GearSlot, AttrStat } from '../build-state.svelte.js';
  import { MOD_SLOT_KEYS } from '../build-state.svelte.js';
  import { GEAR_MODS, CATEGORY_LABELS } from '../data/gear-mods.js';
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';
  import GearPickerModal from './GearPickerModal.svelte';

  interface Props {
    slot: SlotKey;
    slotState: GearSlot;
    data: GameData;
    onBrandChange: (id: string | null) => void;
    onSetChange: (id: string | null) => void;
    onNamedChange: (id: string | null) => void;
    onCoreChange: (stat: GearSlot['coreStat']) => void;
    onAttrChange: (which: 'attr1' | 'attr2', stat: AttrStat | null) => void;
    onModChange: (id: string | null) => void;
    // Talent (chest/backpack only)
    talentId?: string | null;
    talentActive?: boolean;
    onTalentChange?: (id: string | null) => void;
    onTalentActiveChange?: (v: boolean) => void;
    talentOptions?: Array<{ id: string; name: string; note: string }>;
    talentLocked?: boolean;
    inputMode?: 'gear' | 'stats';
    exoticTalentActive?: boolean;
    onExoticTalentToggle?: (v: boolean) => void;
  }

  let { slot, slotState: s, data, onBrandChange, onSetChange, onNamedChange, onCoreChange, onAttrChange, onModChange,
        talentId, talentActive, onTalentChange, onTalentActiveChange, talentOptions, talentLocked, inputMode = 'gear',
        exoticTalentActive = false, onExoticTalentToggle }: Props = $props();
  let statsMode = $derived(inputMode === 'stats');
  let lang = $derived(langState.current);

  let pickerOpen = $state(false);

  // Derived kind (for styling + conditional UI): which group is currently selected.
  type Group = 'brand' | 'set' | 'named';
  let group: Group = $derived(
    s.namedId ? 'named' : s.setId ? 'set' : 'brand'
  );

  let brandOptions = $derived.by(() => {
    void lang;
    return [...data.brands]
      .map((b) => ({ id: b.id, name: i18next.t(b.id, { ns: 'brands', defaultValue: b.id }) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  let setOptions = $derived.by(() => {
    void lang;
    return [...data.sets]
      .map((s) => ({ id: s.id, name: i18next.t(s.id, { ns: 'gear-sets', defaultValue: s.id }) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  let namedOptions = $derived.by(() => {
    void lang;
    return data.namedGear
      .filter((n) => n.slot === slot)
      .map((n) => ({ id: n.id, name: i18next.t(n.id, { ns: 'named-gear', defaultValue: n.id }) as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Gear attribute pool (from game data gear_attribute_pool.json, TU22.1).
  // All 13 attrs available per slot — player picks any 2 for brand/set gear.
  // mag/reload are NOT gear attrs (they're weapon mod stats), so excluded here.
  const ATTR_KEYS: AttrStat[] = ['chc', 'chd', 'hsd', 'wd', 'dta', 'dth', 'ooc', 'handling'];

  let attrOptions = $derived.by(() => {
    void lang;
    return ATTR_KEYS.map((k) => ({
      key: k,
      name: i18next.t(k, { ns: 'stats', defaultValue: k }) as string,
    }));
  });

  let namedBonus = $derived.by(() => {
    void lang;
    if (!s.namedId) return '';
    if (!i18next.exists(s.namedId, { ns: 'named-bonus' })) return '';
    return i18next.t(s.namedId, { ns: 'named-bonus', defaultValue: '' }) as string;
  });

  const SLOT_ICONS: Record<SlotKey, string> = {
    chest: '🦺', backpack: '🎒', gloves: '🧤', mask: '😷', holster: '🔫', kneepads: '🦵',
  };

  let hasTalent = $derived(slot === 'chest' || slot === 'backpack');
  let hasModSlot = $derived(MOD_SLOT_KEYS.has(slot));

  let coreColorClass = $derived('core-' + s.coreStat);

  let currentLabel = $derived(
    group === 'named' && s.namedId
      ? (namedOptions.find((n) => n.id === s.namedId)?.name ?? s.namedId)
      : group === 'set' && s.setId
      ? (setOptions.find((opt) => opt.id === s.setId)?.name ?? s.setId)
      : group === 'brand' && s.brandId
      ? (brandOptions.find((b) => b.id === s.brandId)?.name ?? s.brandId)
      : ''
  );
  let currentBadge = $derived(
    s.namedId ? 'NAMED' : s.setId ? 'SET' : s.brandId ? 'BRAND' : ''
  );
</script>

<div class="gslot">
  <div class="gslot-title">
    <span class="ico">{SLOT_ICONS[slot]}</span>
    <span class="slot-label">{t('ui', slot)}</span>
    {#if currentBadge}<span class="kind-badge kind-{group}">{currentBadge}</span>{/if}
  </div>

  <div class="gslot-row row-1">
    <button type="button" class="input sel group-sel picker-btn kind-{group}" onclick={() => (pickerOpen = true)}>
      {currentLabel || (lang === 'ru' ? '— Выбрать —' : '— Pick —')} <span class="caret">▼</span>
    </button>
    {#if !statsMode}
      {#if group === 'named' && s.namedId}
        <div class="core-locked">🔒</div>
      {:else}
        <select
          class="input {coreColorClass}"
          value={s.coreStat}
          onchange={(e) => onCoreChange((e.currentTarget as HTMLSelectElement).value as GearSlot['coreStat'])}
        >
          <option value="wd">WD</option>
          <option value="armor">ARM</option>
          <option value="skill_tier">SKL</option>
        </select>
      {/if}
    {/if}
  </div>

  {#if group === 'named' && s.namedId}
    {@const ng = data.namedGear.find((n) => n.id === s.namedId)}
    {#if namedBonus}<div class="named-bonus">🔒 {namedBonus}</div>{/if}
    {#if ng?.isExotic && ng.activeBonuses && ng.activeBonuses.length > 0 && onExoticTalentToggle}
      <label class="exotic-toggle">
        <input type="checkbox" checked={exoticTalentActive} onchange={(e) => onExoticTalentToggle((e.currentTarget as HTMLInputElement).checked)} />
        <span>⚡ {lang === 'ru' ? 'Талант активен' : 'Talent active'}</span>
        <span class="exo-bonus">
          {#each ng.activeBonuses as b, i (i)}{i > 0 ? ' · ' : ''}+{b.value}% {i18next.t(b.stat, { ns: 'stats', defaultValue: b.stat })}{#if b.amp} (amp){/if}{/each}
        </span>
      </label>
    {/if}
    <a class="named-info" href={`#item=${encodeURIComponent(s.namedId)}`}>📄 {lang === 'ru' ? 'Детали · где взять' : 'Details · where to get'} ↗</a>
  {/if}

  {#if !statsMode}
    {#if group === 'named' && s.namedId}
      {@const ng = data.namedGear.find((n) => n.id === s.namedId)}
      {@const fixed = ng?.fixedAttrs ?? []}
      <div class="gslot-row attr-row named-locked-row">
        {#if fixed.length > 0}
          <div class="locked-attr">
            🔒 +{fixed[0].value}% {i18next.t(fixed[0].stat, { ns: 'stats', defaultValue: fixed[0].stat })}
          </div>
        {:else}
          <select
            class="input sel attr"
            value={s.attr1 ?? ''}
            onchange={(e) => onAttrChange('attr1', ((e.currentTarget as HTMLSelectElement).value || null) as AttrStat | null)}
          >
            <option value="">— attr1 —</option>
            {#each attrOptions as a (a.key)}
              <option value={a.key}>{a.name}</option>
            {/each}
          </select>
        {/if}
        {#if fixed.length > 1}
          <div class="locked-attr">
            🔒 +{fixed[1].value}% {i18next.t(fixed[1].stat, { ns: 'stats', defaultValue: fixed[1].stat })}
          </div>
        {:else}
          <select
            class="input sel attr"
            value={s.attr2 ?? ''}
            onchange={(e) => onAttrChange('attr2', ((e.currentTarget as HTMLSelectElement).value || null) as AttrStat | null)}
          >
            <option value="">— attr2 —</option>
            {#each attrOptions as a (a.key)}
              <option value={a.key}>{a.name}</option>
            {/each}
          </select>
        {/if}
      </div>
    {:else if group === 'set'}
      <!-- Set gear: only 1 attribute slot (2nd slot reserved for set bonus) -->
      <div class="gslot-row attr-row set-attrs">
        <select
          class="input sel attr"
          value={s.attr1 ?? ''}
          onchange={(e) => onAttrChange('attr1', ((e.currentTarget as HTMLSelectElement).value || null) as AttrStat | null)}
        >
          <option value="">— attr —</option>
          {#each attrOptions as a (a.key)}
            <option value={a.key}>{a.name}</option>
          {/each}
        </select>
        <div class="set-slot-info">🟢 {lang === 'ru' ? 'Бонус сета' : 'Set bonus'}</div>
      </div>
    {:else}
      <!-- Brand gear: 2 attribute slots -->
      <div class="gslot-row attr-row">
        <select
          class="input sel attr"
          value={s.attr1 ?? ''}
          onchange={(e) => onAttrChange('attr1', ((e.currentTarget as HTMLSelectElement).value || null) as AttrStat | null)}
        >
          <option value="">— attr1 —</option>
          {#each attrOptions as a (a.key)}
            <option value={a.key}>{a.name}</option>
          {/each}
        </select>
        <select
          class="input sel attr"
          value={s.attr2 ?? ''}
          onchange={(e) => onAttrChange('attr2', ((e.currentTarget as HTMLSelectElement).value || null) as AttrStat | null)}
        >
          <option value="">— attr2 —</option>
          {#each attrOptions as a (a.key)}
            <option value={a.key}>{a.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  {/if}

  {#if hasTalent && talentOptions && onTalentChange && group !== 'named'}
    <div class="gslot-row tal-row">
      <span class="tal-label">🎯 TALENT</span>
      {#if talentLocked}
        <div class="tal-locked">
          <span class="lock">🔒</span>
          <span class="tal-name">{talentId ?? '—'}</span>
        </div>
      {:else}
        <select
          class="input sel"
          value={talentId ?? ''}
          onchange={(e) => onTalentChange((e.currentTarget as HTMLSelectElement).value || null)}
        >
          <option value="">— —</option>
          {#each talentOptions as tl (tl.id)}
            <option value={tl.id}>{tl.name}</option>
          {/each}
        </select>
      {/if}
      {#if talentId && !talentLocked && onTalentActiveChange}
        <label class="tal-toggle">
          <input type="checkbox" checked={talentActive} onchange={(e) => onTalentActiveChange((e.currentTarget as HTMLInputElement).checked)} />
          <span>on</span>
        </label>
      {:else}
        <span></span>
      {/if}
    </div>
  {/if}

  {#if hasModSlot && !statsMode}
    <div class="gslot-row mod-row">
      <span class="mod-label">Mod</span>
      <select
        class="input sel attr"
        value={s.modAttr ?? ''}
        onchange={(e) => onModChange((e.currentTarget as HTMLSelectElement).value || null)}
      >
        <option value="">— {langState.current === 'ru' ? 'вставка' : 'gear mod'} —</option>
        <optgroup label="{langState.current === 'ru' ? CATEGORY_LABELS.offense.ru : CATEGORY_LABELS.offense.en}">
          {#each GEAR_MODS.filter((m) => m.category === 'offense') as m (m.id)}
            <option value={m.id}>{langState.current === 'ru' ? m.name.ru : m.name.en} +{m.value}%</option>
          {/each}
        </optgroup>
        <optgroup label="{langState.current === 'ru' ? CATEGORY_LABELS.defense.ru : CATEGORY_LABELS.defense.en}">
          {#each GEAR_MODS.filter((m) => m.category === 'defense') as m (m.id)}
            <option value={m.id}>{langState.current === 'ru' ? m.name.ru : m.name.en}</option>
          {/each}
        </optgroup>
        <optgroup label="{langState.current === 'ru' ? CATEGORY_LABELS.skill.ru : CATEGORY_LABELS.skill.en}">
          {#each GEAR_MODS.filter((m) => m.category === 'skill') as m (m.id)}
            <option value={m.id}>{langState.current === 'ru' ? m.name.ru : m.name.en} +{m.value}%</option>
          {/each}
        </optgroup>
      </select>
    </div>
  {/if}
</div>

{#if pickerOpen}
  <GearPickerModal
    {data}
    availableNamed={data.namedGear.filter((n) => n.slot === slot)}
    currentBrandId={s.brandId}
    currentSetId={s.setId}
    currentNamedId={s.namedId}
    onPickBrand={onBrandChange}
    onPickSet={onSetChange}
    onPickNamed={onNamedChange}
    onClose={() => (pickerOpen = false)}
  />
{/if}

<style>
  .picker-btn { cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; }
  .picker-btn:hover { border-color: var(--border-hi); }
  .picker-btn .caret { color: var(--muted); font-size: 9px; margin-left: 6px; }
  .gslot { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r); padding: 8px 10px; }
  .gslot-title {
    display: flex; align-items: center; gap: 6px;
    font: 700 10px/1 var(--f-display); letter-spacing: .14em;
    text-transform: uppercase; color: var(--orange);
    margin-bottom: 6px;
  }
  .gslot-title .ico { font-size: 12px; }
  .slot-label { flex: 1; }
  .gslot-row { display: grid; grid-template-columns: 1fr 1fr 60px; gap: 4px; }
  .row-1 { grid-template-columns: 1fr 60px; }
  .attr-row { grid-template-columns: 1fr 1fr; margin-top: 4px; }
  .tal-row {
    grid-template-columns: 80px 1fr 40px;
    margin-top: 4px; padding-top: 4px;
    border-top: 1px dashed var(--border);
    align-items: center;
  }
  .mod-row {
    grid-template-columns: 40px 1fr;
    margin-top: 4px; padding-top: 4px;
    border-top: 1px dashed var(--border);
    align-items: center;
  }
  .mod-label { font: 700 9px/1 var(--f-display); letter-spacing: .14em; text-transform: uppercase; color: var(--blue); text-align: center; }
  .sel { padding: 5px 6px; font-size: 11px; }
  .attr { font-size: 10px; color: var(--text-dim); }
  .tal-label { font: 700 10px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--orange); }
  .tal-locked { display: flex; align-items: center; gap: 6px; padding: 5px 8px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-sm); color: var(--named); font-size: 11px; }
  .lock { font-size: 10px; }
  .tal-name { font: 700 10px/1 var(--f-display); letter-spacing: .04em; }
  .tal-toggle { display: flex; align-items: center; gap: 3px; font: 700 9px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); cursor: pointer; justify-content: center; }
  .tal-toggle input { accent-color: var(--orange); }
  .named-bonus { font-size: 10px; color: var(--named); background: rgba(254,175,16,.06); padding: 4px 8px; margin-top: 4px; border-radius: 3px; border-left: 2px solid var(--named); font-style: italic; }
  .exotic-toggle { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 10px; color: var(--exotic, #ff6b00); cursor: pointer; padding: 4px 8px; background: rgba(255,107,0,.08); border: 1px solid rgba(255,107,0,.3); border-radius: 3px; flex-wrap: wrap; }
  .exotic-toggle input { accent-color: var(--exotic, #ff6b00); }
  .exotic-toggle .exo-bonus { color: var(--green); font-family: var(--f-mono); font-size: 9px; }
  .named-info { display: inline-block; margin-top: 4px; font-size: 10px; color: var(--blue); text-decoration: none; padding: 3px 8px; background: rgba(88,169,255,.08); border: 1px solid rgba(88,169,255,.3); border-radius: 3px; }
  .named-locked-row { grid-template-columns: 1fr 1fr; }
  .locked-attr {
    font-size: 10px; color: var(--named, #b19cd9);
    padding: 5px 8px;
    background: rgba(177,156,217,.08);
    border: 1px dashed rgba(177,156,217,.3);
    border-radius: 3px;
    display: flex; align-items: center; gap: 4px;
    font-style: italic;
  }
  .core-locked {
    display: flex; align-items: center; justify-content: center;
    padding: 5px 4px; font-size: 12px; color: var(--named, #b19cd9);
    background: rgba(177,156,217,.08);
    border: 1px dashed rgba(177,156,217,.3); border-radius: 3px;
  }
  .kind-badge {
    font: 700 9px/1 var(--f-display); letter-spacing: .12em;
    padding: 3px 6px; border-radius: 3px;
    margin-left: auto;
  }
  .kind-badge.kind-brand { background: rgba(88,169,255,.12); color: var(--blue); }
  .kind-badge.kind-set { background: rgba(1,254,144,.12); color: var(--green); }
  .kind-badge.kind-named { background: rgba(177,156,217,.15); color: var(--named, #b19cd9); }
  .picker-btn.kind-brand { border-left: 2px solid rgba(88,169,255,.4); }
  .picker-btn.kind-set { border-left: 2px solid rgba(1,254,144,.4); }
  .picker-btn.kind-named { border-left: 2px solid rgba(177,156,217,.4); }
  .set-attrs { grid-template-columns: 1fr 1fr; }
  .set-slot-info {
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--green); font-style: italic;
    padding: 5px 8px;
    background: rgba(1,254,144,.06);
    border: 1px dashed rgba(1,254,144,.3); border-radius: 3px;
  }
  .named-info:hover { background: rgba(88,169,255,.18); }
</style>
