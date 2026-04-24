<script lang="ts">
  import type { BuildState, SlotKey } from '../build-state.svelte.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    build: BuildState;
  }

  let { build }: Props = $props();
  let lang = $derived(langState.current);

  const SLOTS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];

  interface Preset {
    id: string;
    name_en: string;
    name_ru: string;
    desc_en: string;
    desc_ru: string;
    color?: string;
    /** Brand id per slot (for 3+3 or 2+2+2 builds) */
    brands?: Partial<Record<SlotKey, string>>;
    /** Set id per slot */
    sets?: Partial<Record<SlotKey, string>>;
    /** Core stat per slot */
    cores?: Partial<Record<SlotKey, 'wd' | 'armor' | 'skill_tier'>>;
    /** Attr1/attr2 */
    attrs?: Partial<Record<SlotKey, { a1?: string; a2?: string }>>;
  }

  const PRESETS: Preset[] = [
    {
      id: 'crit_dps_generic',
      name_en: 'Crit DPS (3+3)',
      name_ru: 'Крит DPS (3+3)',
      desc_en: '3pc Providence + 3pc Airaldi Holdings — HSD + CHC + CHD',
      desc_ru: '3шт Providence + 3шт Airaldi Holdings — HSD + CHC + CHD',
      color: 'orange',
      brands: {
        chest: 'providence_defense', backpack: 'providence_defense', gloves: 'providence_defense',
        mask: 'airaldi_holdings', holster: 'airaldi_holdings', kneepads: 'airaldi_holdings',
      },
      cores: {
        chest: 'wd', backpack: 'wd', gloves: 'wd',
        mask: 'wd', holster: 'wd', kneepads: 'wd',
      },
      attrs: {
        chest: { a1: 'chd', a2: 'chd' },
        backpack: { a1: 'chd', a2: 'chd' },
        gloves: { a1: 'chc', a2: 'chd' },
        mask: { a1: 'hsd', a2: 'chd' },
        holster: { a1: 'chc', a2: 'chd' },
        kneepads: { a1: 'chc', a2: 'chd' },
      },
    },
    {
      id: 'striker_4pc',
      name_en: 'Striker 4pc + 2 brand',
      name_ru: 'Страйкер 4шт + 2 бренд',
      desc_en: '4pc Striker\'s Battlegear (RoF + stacks) + 2pc Providence',
      desc_ru: '4шт Страйкер (RoF + стаки) + 2шт Providence',
      color: 'red',
      sets: {
        chest: 'striker_s_battlegear', backpack: 'striker_s_battlegear',
        gloves: 'striker_s_battlegear', mask: 'striker_s_battlegear',
      },
      brands: {
        holster: 'providence_defense', kneepads: 'providence_defense',
      },
      cores: {
        chest: 'wd', backpack: 'wd', gloves: 'wd',
        mask: 'wd', holster: 'wd', kneepads: 'wd',
      },
      attrs: {
        chest: { a1: 'chd', a2: 'chd' },
        backpack: { a1: 'chd', a2: 'chd' },
        gloves: { a1: 'chc', a2: 'chd' },
        mask: { a1: 'hsd', a2: 'chd' },
        holster: { a1: 'chc', a2: 'chd' },
        kneepads: { a1: 'chc', a2: 'chd' },
      },
    },
    {
      id: 'tipping_scales_4pc',
      name_en: 'Tipping Scales 4pc (MMR)',
      name_ru: 'Tipping Scales 4шт (MMR)',
      desc_en: '4pc Tipping Scales + 2pc Airaldi — for Headhunter MMR 1-shot',
      desc_ru: '4шт Tipping Scales + 2шт Airaldi — под Headhunter MMR',
      color: 'blue',
      sets: {
        chest: 'tipping_scales', backpack: 'tipping_scales',
        gloves: 'tipping_scales', mask: 'tipping_scales',
      },
      brands: {
        holster: 'airaldi_holdings', kneepads: 'airaldi_holdings',
      },
      cores: {
        chest: 'wd', backpack: 'wd', gloves: 'wd',
        mask: 'wd', holster: 'wd', kneepads: 'wd',
      },
      attrs: {
        chest: { a1: 'hsd', a2: 'hsd' },
        backpack: { a1: 'hsd', a2: 'chd' },
        gloves: { a1: 'chc', a2: 'hsd' },
        mask: { a1: 'hsd', a2: 'chd' },
        holster: { a1: 'hsd', a2: 'chd' },
        kneepads: { a1: 'chc', a2: 'hsd' },
      },
    },
    {
      id: 'heartbreaker_4pc',
      name_en: 'Heartbreaker 4pc (Burst)',
      name_ru: 'Разбиватель Сердец 4шт',
      desc_en: '4pc Heartbreaker + 2pc Providence — Burst 100% CHC',
      desc_ru: '4шт Heartbreaker + 2шт Providence — Burst 100% CHC',
      color: 'red',
      sets: {
        chest: 'heartbreaker', backpack: 'heartbreaker',
        gloves: 'heartbreaker', mask: 'heartbreaker',
      },
      brands: {
        holster: 'providence_defense', kneepads: 'providence_defense',
      },
      cores: {
        chest: 'wd', backpack: 'wd', gloves: 'wd',
        mask: 'wd', holster: 'wd', kneepads: 'wd',
      },
      attrs: {
        chest: { a1: 'chd', a2: 'chd' },
        backpack: { a1: 'chd', a2: 'chd' },
        gloves: { a1: 'chd', a2: 'hsd' },
        mask: { a1: 'hsd', a2: 'chd' },
        holster: { a1: 'chd', a2: 'chd' },
        kneepads: { a1: 'chd', a2: 'hsd' },
      },
    },
  ];

  function apply(preset: Preset) {
    for (const slot of SLOTS) {
      build.setSlotBrand(slot, null);
      build.setSlotSet(slot, null);
      build.setSlotNamed(slot, null);
      if (preset.sets?.[slot]) build.setSlotSet(slot, preset.sets[slot]!);
      else if (preset.brands?.[slot]) build.setSlotBrand(slot, preset.brands[slot]!);
      if (preset.cores?.[slot]) build.setSlotCore(slot, preset.cores[slot]!);
      if (preset.attrs?.[slot]) {
        const { a1, a2 } = preset.attrs[slot]!;
        if (a1) build.setSlotAttr(slot, 'attr1', a1 as never);
        if (a2) build.setSlotAttr(slot, 'attr2', a2 as never);
      }
    }
  }
</script>

<section class="panel gp">
  <div class="panel-title">
    <span>🎒 {lang === 'ru' ? 'Пресеты брони' : 'Gear Presets'}</span>
  </div>
  <div class="gp-grid">
    {#each PRESETS as p (p.id)}
      <button class="gp-btn" data-color={p.color} onclick={() => apply(p)}>
        <div class="gp-name">{lang === 'ru' ? p.name_ru : p.name_en}</div>
        <div class="gp-desc">{lang === 'ru' ? p.desc_ru : p.desc_en}</div>
      </button>
    {/each}
  </div>
  <div class="gp-note">
    {lang === 'ru' ? 'Заполняет все 6 слотов сразу. Стартовая точка — допили по вкусу.' : 'Fills all 6 gear slots at once. Good starting point — tweak after.'}
  </div>
</section>

<style>
  .gp { max-width: 1100px; margin: 0 auto; }
  .gp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 6px; }
  .gp-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
    padding: 10px 12px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--orange);
    border-radius: var(--r-sm);
    cursor: pointer;
    text-align: left;
    transition: background .12s, border-color .12s;
  }
  .gp-btn[data-color="red"] { border-left-color: var(--red); }
  .gp-btn[data-color="blue"] { border-left-color: var(--blue); }
  .gp-btn:hover { background: var(--card-2); border-color: var(--border-hi); }
  .gp-name { font: 700 11px/1 var(--f-display); letter-spacing: .08em; color: var(--text); text-transform: uppercase; }
  .gp-desc { font-size: 10px; color: var(--text-dim); line-height: 1.4; }
  .gp-note { margin-top: 8px; font-size: 10px; color: var(--muted); font-style: italic; text-align: center; }
</style>
