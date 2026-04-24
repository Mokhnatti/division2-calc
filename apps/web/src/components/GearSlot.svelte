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
  }

  let { slot, slotState: s, data, onBrandChange, onSetChange, onNamedChange, onCoreChange, onAttrChange, onModChange,
        talentId, talentActive, onTalentChange, onTalentActiveChange, talentOptions, talentLocked, inputMode = 'gear' }: Props = $props();
  let statsMode = $derived(inputMode === 'stats');
  let lang = $derived(langState.current);

  let pickerOpen = $state(false);
  let pickerMode = $state<'brand' | 'set' | 'named'>('brand');

  function openPicker(m: 'brand' | 'set' | 'named') {
    pickerMode = m;
    pickerOpen = true;
  }

  // Group toggle: BRAND | SET | NAMED (mutually exclusive)
  type Group = 'brand' | 'set' | 'named';
  let group: Group = $state((s.namedId ? 'named' : s.setId ? 'set' : 'brand'));

  $effect(() => {
    // Sync group when state changes externally (e.g. reset, load)
    const shouldBe: Group = s.namedId ? 'named' : s.setId ? 'set' : 'brand';
    if (shouldBe !== group) group = shouldBe;
  });

  function pickGroup(g: Group) {
    group = g;
    // Clear others to enforce mutually exclusive
    if (g === 'brand') { onSetChange(null); onNamedChange(null); }
    if (g === 'set')   { onBrandChange(null); onNamedChange(null); }
    if (g === 'named') { onBrandChange(null); onSetChange(null); }
  }

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

  const ATTR_KEYS: AttrStat[] = ['chc', 'chd', 'hsd', 'dta', 'dth', 'ooc', 'wd', 'mag', 'reload', 'handling'];

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
</script>

<div class="gslot">
  <div class="gslot-title">
    <span class="ico">{SLOT_ICONS[slot]}</span>
    <span class="slot-label">{t('ui', slot)}</span>
    <div class="group-toggle" role="radiogroup" aria-label="Gear group">
      <button type="button" role="radio" aria-checked={group === 'brand'} class="gt" class:on={group === 'brand'} onclick={() => pickGroup('brand')}>BRAND</button>
      <button type="button" role="radio" aria-checked={group === 'set'} class="gt" class:on={group === 'set'} onclick={() => pickGroup('set')}>SET</button>
      {#if namedOptions.length > 0}
        <button type="button" role="radio" aria-checked={group === 'named'} class="gt" class:on={group === 'named'} onclick={() => pickGroup('named')}>NAMED</button>
      {/if}
    </div>
  </div>

  <div class="gslot-row row-1">
    {#if group === 'brand'}
      {@const brandName = s.brandId ? (brandOptions.find((b) => b.id === s.brandId)?.name ?? s.brandId) : ''}
      <button type="button" class="input sel group-sel picker-btn" onclick={() => openPicker('brand')}>
        {s.brandId ? brandName : (lang === 'en' ? '— Pick brand —' : '— Выбрать бренд —')} <span class="caret">▼</span>
      </button>
    {:else if group === 'set'}
      {@const setName = s.setId ? (setOptions.find((opt) => opt.id === s.setId)?.name ?? s.setId) : ''}
      <button type="button" class="input sel group-sel picker-btn" onclick={() => openPicker('set')}>
        {s.setId ? setName : (lang === 'en' ? '— Pick set —' : '— Выбрать сет —')} <span class="caret">▼</span>
      </button>
    {:else}
      {@const namedName = s.namedId ? (namedOptions.find((n) => n.id === s.namedId)?.name ?? s.namedId) : ''}
      <button type="button" class="input sel group-sel named picker-btn" onclick={() => openPicker('named')}>
        {s.namedId ? namedName : (lang === 'en' ? '— Pick named —' : '— Выбрать именное —')} <span class="caret">▼</span>
      </button>
    {/if}
    {#if !statsMode}
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
  </div>

  {#if group === 'named' && s.namedId}
    {#if namedBonus}<div class="named-bonus">🔒 {namedBonus}</div>{/if}
    <a class="named-info" href={`#item=${encodeURIComponent(s.namedId)}`}>📄 {lang === 'en' ? 'Details · where to get' : 'Детали · где взять'} ↗</a>
  {/if}

  {#if !statsMode}
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

  {#if hasTalent && talentOptions && onTalentChange}
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
        <option value="">— {langState.current === 'en' ? 'gear mod' : 'вставка'} —</option>
        <optgroup label="{langState.current === 'en' ? CATEGORY_LABELS.offense.en : CATEGORY_LABELS.offense.ru}">
          {#each GEAR_MODS.filter((m) => m.category === 'offense') as m (m.id)}
            <option value={m.id}>{langState.current === 'en' ? m.name.en : m.name.ru} +{m.value}%</option>
          {/each}
        </optgroup>
        <optgroup label="{langState.current === 'en' ? CATEGORY_LABELS.defense.en : CATEGORY_LABELS.defense.ru}">
          {#each GEAR_MODS.filter((m) => m.category === 'defense') as m (m.id)}
            <option value={m.id}>{langState.current === 'en' ? m.name.en : m.name.ru}</option>
          {/each}
        </optgroup>
        <optgroup label="{langState.current === 'en' ? CATEGORY_LABELS.skill.en : CATEGORY_LABELS.skill.ru}">
          {#each GEAR_MODS.filter((m) => m.category === 'skill') as m (m.id)}
            <option value={m.id}>{langState.current === 'en' ? m.name.en : m.name.ru} +{m.value}%</option>
          {/each}
        </optgroup>
      </select>
    </div>
  {/if}
</div>

{#if pickerOpen}
  <GearPickerModal
    mode={pickerMode}
    {data}
    current={pickerMode === 'brand' ? s.brandId : pickerMode === 'set' ? s.setId : s.namedId}
    availableNamed={data.namedGear.filter((n) => n.slot === slot)}
    onPick={(id) => {
      if (pickerMode === 'brand') onBrandChange(id);
      else if (pickerMode === 'set') onSetChange(id);
      else onNamedChange(id);
    }}
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
  .named-info { display: inline-block; margin-top: 4px; font-size: 10px; color: var(--blue); text-decoration: none; padding: 3px 8px; background: rgba(88,169,255,.08); border: 1px solid rgba(88,169,255,.3); border-radius: 3px; }
  .named-info:hover { background: rgba(88,169,255,.18); }
</style>
