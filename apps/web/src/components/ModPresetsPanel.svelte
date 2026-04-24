<script lang="ts">
  import type { BuildState, SlotKey, AttrStat } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    build: BuildState;
    data: GameData;
  }
  let { build, data }: Props = $props();
  let lang = $derived(langState.current);

  const SLOTS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];
  const MOD_SLOTS: SlotKey[] = ['chest', 'backpack', 'mask'];

  // Regular (non-prototype) gear — TU22.1 verified via screenshots.
  const CHC_PER_ATTR = 6;
  const CHC_CAP = 60;

  interface Preset {
    id: string;
    name: { en: string; ru: string };
    description: { en: string; ru: string };
    /** core for all 6 gear pieces */
    core: 'wd' | 'armor' | 'skill_tier';
    /** primary offensive stat to pair with CHC — everything past CHC cap overflows to this */
    primary: AttrStat;
    /** secondary stat for attr2 (brand only — set has 1 attr). Falls back to primary if null */
    secondary?: AttrStat;
    /** gear mod id for chest/backpack/mask (from gear-mods.ts) */
    modId: string;
  }

  const PRESETS: Preset[] = [
    {
      id: 'dd',
      name: { en: 'DD (Crit Damage)', ru: 'ДД (Урон крита)' },
      description: { en: 'CHC to 60%, rest → CHD. Cores: WD. Mods: CHD.', ru: 'CHC до 60%, остальное → CHD. Ядра: WD. Моды: CHD.' },
      core: 'wd',
      primary: 'chd',
      secondary: 'chd',
      modId: 'gm_chd',
    },
    {
      id: 'sniper',
      name: { en: 'Sniper (Headshot)', ru: 'Снайпер (В голову)' },
      description: { en: 'CHC up to 60%, rest HSD. Cores: WD. Mods: HSD.', ru: 'CHC до 60%, остаток в HSD. Ядра: WD. Моды: HSD.' },
      core: 'wd',
      primary: 'hsd',
      secondary: 'hsd',
      modId: 'gm_hsd',
    },
    {
      id: 'crit',
      name: { en: 'Pure Crit (CHC focus)', ru: 'Чистый крит (CHC)' },
      description: { en: 'All CHC (caps at 60%), overflow CHD. Cores: WD. Mods: CHC.', ru: 'Все CHC (до cap 60%), остаток CHD. Ядра: WD. Моды: CHC.' },
      core: 'wd',
      primary: 'chd',
      secondary: 'chc',
      modId: 'gm_chc',
    },
    {
      id: 'armor_dmg',
      name: { en: 'vs Armor (DtA)', ru: 'По броне (DtA)' },
      description: { en: 'CHC up to 60%, rest DtA. Cores: WD. Mods: CHD.', ru: 'CHC до 60%, остаток DtA. Ядра: WD. Моды: CHD.' },
      core: 'wd',
      primary: 'dta',
      secondary: 'dta',
      modId: 'gm_chd',
    },
    {
      id: 'health_dmg',
      name: { en: 'vs Health (DtH)', ru: 'По здоровью (DtH)' },
      description: { en: 'CHC up to 60%, rest DtH. Cores: WD. Mods: CHD.', ru: 'CHC до 60%, остаток DtH. Ядра: WD. Моды: CHD.' },
      core: 'wd',
      primary: 'dth',
      secondary: 'dth',
      modId: 'gm_chd',
    },
    {
      id: 'skill',
      name: { en: 'Skill Build', ru: 'Скилл-билд' },
      description: { en: 'Cores: Skill Tier. Attrs: Haste. Mods: Skill Haste.', ru: 'Ядра: Скилл-тир. Атрибуты: Ускорение. Моды: Скилл-ускорение.' },
      core: 'skill_tier',
      primary: 'handling', // skill_haste not a gear attr — use handling as placeholder
      secondary: 'handling',
      modId: 'gm_skill_haste',
    },
    {
      id: 'tank',
      name: { en: 'Tank', ru: 'Танк' },
      description: { en: 'Cores: Armor. Attrs: DtH. Mods: Elites Protect.', ru: 'Ядра: Броня. Атрибуты: DtH. Моды: Защита от элит.' },
      core: 'armor',
      primary: 'dth',
      secondary: 'dth',
      modId: 'gm_protection_elites',
    },
  ];

  // STEP 1: compute baseline CHC/CHD/HSD from GUARANTEED (non-roll) sources.
  // These include: weapon intrinsic attrs, weapon built-in mods (exotic) or user-selected mods,
  // SHD Watch (hardcoded in computeBuild: +10 CHC, +20 CHD, +20 HSD, +10 WD), brand/set bonuses.
  function computeBaseline(): { chc: number; chd: number; hsd: number } {
    const b = { chc: 0, chd: 0, hsd: 0 };

    // SHD Watch (must match computeBuild hardcoded values)
    b.chc += 10;
    b.chd += 20;
    b.hsd += 20;

    const weapon = build.weaponId ? data.byId.weapon.get(build.weaponId) : null;

    // Weapon intrinsic attributes (3 baked-in stats)
    if (weapon) {
      const intrinsic = (weapon as unknown as { intrinsicAttrs?: Array<{ stat: string; value: number }> }).intrinsicAttrs;
      if (Array.isArray(intrinsic)) {
        for (const a of intrinsic) {
          if (a.stat === 'chc') b.chc += a.value;
          if (a.stat === 'chd') b.chd += a.value;
          if (a.stat === 'hsd') b.hsd += a.value;
        }
      }
    }

    // Weapon mods: exotic = built-in; non-exotic = user-selected
    if (weapon?.kind === 'exotic') {
      const built = (weapon as unknown as { builtInMods?: Array<{ stat: string; value: number }> }).builtInMods;
      if (Array.isArray(built)) {
        for (const m of built) {
          if (m.stat === 'chc') b.chc += m.value;
          if (m.stat === 'chd') b.chd += m.value;
          if (m.stat === 'hsd') b.hsd += m.value;
        }
      }
    }
    // TODO non-exotic weapon mods (build.weaponMods) — add when UI supports

    // Brand bonuses from currently equipped items
    const brandCounts: Record<string, number> = {};
    for (const slot of SLOTS) {
      const s = build.gear[slot];
      if (s.brandId) brandCounts[s.brandId] = (brandCounts[s.brandId] || 0) + 1;
      if (s.namedId) {
        const ng = data.byId.namedGear.get(s.namedId);
        if (ng?.brand) brandCounts[ng.brand] = (brandCounts[ng.brand] || 0) + 1;
      }
    }
    for (const [brandId, count] of Object.entries(brandCounts)) {
      const br = data.byId.brand.get(brandId);
      if (!br) continue;
      for (const { pieces, bonus } of br.bonuses) {
        if (count < pieces) continue;
        if (bonus.stat === 'chc') b.chc += bonus.value;
        if (bonus.stat === 'chd') b.chd += bonus.value;
        if (bonus.stat === 'hsd') b.hsd += bonus.value;
      }
    }

    // Set bonuses (numericBonuses only, not stacks)
    const setCounts: Record<string, number> = {};
    for (const slot of SLOTS) {
      const s = build.gear[slot];
      if (s.setId) setCounts[s.setId] = (setCounts[s.setId] || 0) + 1;
    }
    for (const [setId, count] of Object.entries(setCounts)) {
      const gs = data.byId.set.get(setId);
      if (!gs) continue;
      for (const { pieces, bonus } of gs.numericBonuses) {
        if (count < pieces) continue;
        if (bonus.stat === 'chc') b.chc += bonus.value;
        if (bonus.stat === 'chd') b.chd += bonus.value;
        if (bonus.stat === 'hsd') b.hsd += bonus.value;
      }
    }

    return b;
  }

  // Helper: count free attr slots on each gear piece (set=1, brand/named=2, minus fixed).
  const namedFixedCount = (namedId: string | null): number => {
    if (!namedId) return 0;
    const ng = data.byId.namedGear.get(namedId);
    return ng?.fixedAttrs?.length ?? 0;
  };

  function apply(p: Preset) {
    // STEP 0 — Cores only (no spec, no talents — user picks those manually)
    for (const slot of SLOTS) build.setSlotCore(slot, p.core);

    // STEP 1 — count free slots in current gear layout
    interface SlotInfo { slot: SlotKey; attr1Free: boolean; attr2Free: boolean; modFree: boolean; attr1Locked: AttrStat | null }
    const infos: SlotInfo[] = [];
    for (const slot of SLOTS) {
      const s = build.gear[slot];
      const fixed = namedFixedCount(s.namedId);
      const attr1Free = fixed < 1;
      const attr2Free = !s.setId && fixed < 2; // set has 1 attr slot, no attr2
      const modFree = MOD_SLOTS.includes(slot);
      // Read locked attr1 stat (for uniqueness rule)
      let attr1Locked: AttrStat | null = null;
      if (!attr1Free) {
        const ng = s.namedId ? data.byId.namedGear.get(s.namedId) : null;
        const fa = ng?.fixedAttrs?.[0];
        attr1Locked = (fa?.stat as AttrStat) ?? null;
      }
      infos.push({ slot, attr1Free, attr2Free, modFree, attr1Locked });
    }
    const totalAttrSlots = infos.reduce((sum, i) => sum + (i.attr1Free ? 1 : 0) + (i.attr2Free ? 1 : 0), 0);
    const totalModSlots = infos.filter((i) => i.modFree).length;

    // STEP 2 — baseline (guaranteed non-roll sources)
    const baseline = computeBaseline();

    // STEP 3 — figure out exact split:
    // CHC target = 60%. Minimize overkill. gear mod CHC = +6%, attr CHC = +6%.
    const chcGap = Math.max(0, CHC_CAP - baseline.chc);

    // Need `chcGap / 6` slots total (mods + attrs). Use floor() to avoid overkill.
    const chcSlotsNeeded = Math.floor(chcGap / 6);
    // Fill mods first (up to totalModSlots), then attrs.
    const chcModsPlanned = Math.min(chcSlotsNeeded, totalModSlots);
    const chcAttrsPlanned = Math.min(chcSlotsNeeded - chcModsPlanned, totalAttrSlots);

    // STEP 4 — assign mods
    let chcModsPlaced = 0;
    const modAssignments: Record<SlotKey, string | null> = {
      chest: null, backpack: null, gloves: null, mask: null, holster: null, kneepads: null,
    };
    for (const info of infos) {
      if (!info.modFree) continue;
      if (chcModsPlaced < chcModsPlanned) {
        modAssignments[info.slot] = 'gm_chc';
        chcModsPlaced++;
      } else {
        modAssignments[info.slot] = p.modId;
      }
    }

    // STEP 5 — assign attrs (attr1 first, attr2 after). Respect uniqueness.
    let chcAttrsPlaced = 0;
    for (const info of infos) {
      const { slot, attr1Free, attr2Free, attr1Locked } = info;
      let attr1Val: AttrStat | null = attr1Locked;

      if (attr1Free) {
        if (chcAttrsPlaced < chcAttrsPlanned) {
          attr1Val = 'chc';
          chcAttrsPlaced++;
        } else {
          attr1Val = p.primary;
        }
        build.setSlotAttr(slot, 'attr1', attr1Val);
      }

      if (build.gear[slot].setId) {
        build.setSlotAttr(slot, 'attr2', null);
      } else if (attr2Free) {
        // Uniqueness: attr1 != attr2 on same item (mods don't count)
        let attr2Val: AttrStat;
        if (chcAttrsPlaced < chcAttrsPlanned && attr1Val !== 'chc') {
          attr2Val = 'chc';
          chcAttrsPlaced++;
        } else if (p.primary !== attr1Val) {
          attr2Val = p.primary;
        } else {
          // Conflict on primary — try secondary, else HSD fallback
          const sec = p.secondary;
          attr2Val = (sec && sec !== attr1Val) ? sec : (attr1Val === 'hsd' ? 'chd' : 'hsd');
        }
        build.setSlotAttr(slot, 'attr2', attr2Val);
      }
    }

    // STEP 6 — apply mod assignments
    for (const slot of MOD_SLOTS) {
      build.setSlotAttr(slot, 'modAttr', modAssignments[slot] as unknown as AttrStat);
    }
  }
</script>

<section class="panel presets">
  <div class="panel-title">
    <span>{lang === 'ru' ? 'Пресеты билда' : 'Build Presets'}</span>
  </div>
  <div class="preset-grid">
    {#each PRESETS as p (p.id)}
      <button class="preset" onclick={() => apply(p)}>
        <div class="p-name">{lang === 'ru' ? p.name.ru : p.name.en}</div>
        <div class="p-desc">{lang === 'ru' ? p.description.ru : p.description.en}</div>
      </button>
    {/each}
  </div>
  <div class="note">
    {lang === 'ru'
      ? 'Заполняет только ядра, атрибуты и вставки. Следит за cap шанса крита (60%). Спек, таланты, бренды/сеты выбираешь сам.'
      : 'Fills only cores, attrs, and mods. Respects CHC 60% cap. Spec, talents, brands/sets are user picks.'}
  </div>
</section>

<style>
  .presets { margin-top: 8px; }
  .preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 4px; }
  .preset {
    padding: 8px 10px;
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
