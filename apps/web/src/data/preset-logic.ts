import type { BuildState, SlotKey, AttrStat } from '../build-state.svelte.js';
import type { GameData } from '../data.js';

export interface Preset {
  id: string;
  core: 'wd' | 'armor' | 'skill_tier';
  primary: AttrStat;
  secondary?: AttrStat;
  modId: string;
}

export const PRESETS_MAP: Record<string, Preset> = {
  dd:        { id: 'dd',        core: 'wd',         primary: 'chd',  secondary: 'chd',  modId: 'gm_chd' },
  sniper:    { id: 'sniper',    core: 'wd',         primary: 'hsd',  secondary: 'hsd',  modId: 'gm_hsd' },
  crit:      { id: 'crit',      core: 'wd',         primary: 'chd',  secondary: 'chc',  modId: 'gm_chc' },
  armor_dmg: { id: 'armor_dmg', core: 'wd',         primary: 'dta',  secondary: 'dta',  modId: 'gm_chd' },
  health_dmg:{ id: 'health_dmg',core: 'wd',         primary: 'dth',  secondary: 'dth',  modId: 'gm_chd' },
  skill:     { id: 'skill',     core: 'skill_tier', primary: 'handling', secondary: 'handling', modId: 'gm_skill_haste' },
  tank:      { id: 'tank',      core: 'armor',      primary: 'dth',  secondary: 'dth',  modId: 'gm_protection_elites' },
};

const SLOTS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];
const MOD_SLOTS: SlotKey[] = ['chest', 'backpack', 'mask'];
const CHC_PER_ATTR = 6;
const CHC_CAP = 60;

function computeBaseline(build: BuildState, data: GameData): { chc: number; chd: number; hsd: number } {
  const b = { chc: 0, chd: 0, hsd: 0 };
  // SHD Watch
  b.chc += 10;
  b.chd += 20;
  b.hsd += 20;
  const weapon = build.weaponId ? data.byId.weapon.get(build.weaponId) : null;
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
  // Brands
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
  // Sets
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

function namedFixedCount(namedId: string | null, data: GameData): number {
  if (!namedId) return 0;
  const ng = data.byId.namedGear.get(namedId);
  return ng?.fixedAttrs?.length ?? 0;
}

export function applyPreset(presetId: string, build: BuildState, data: GameData): void {
  const p = PRESETS_MAP[presetId];
  if (!p) return;
  for (const slot of SLOTS) build.setSlotCore(slot, p.core);

  interface SlotInfo { slot: SlotKey; attr1Free: boolean; attr2Free: boolean; modFree: boolean; attr1Locked: AttrStat | null }
  const infos: SlotInfo[] = [];
  for (const slot of SLOTS) {
    const s = build.gear[slot];
    const fixed = namedFixedCount(s.namedId, data);
    const attr1Free = fixed < 1;
    const attr2Free = !s.setId && fixed < 2;
    const modFree = MOD_SLOTS.includes(slot);
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

  const baseline = computeBaseline(build, data);
  const chcGap = Math.max(0, CHC_CAP - baseline.chc);
  const chcSlotsNeeded = Math.floor(chcGap / CHC_PER_ATTR);
  const chcModsPlanned = Math.min(chcSlotsNeeded, totalModSlots);
  const chcAttrsPlanned = Math.min(chcSlotsNeeded - chcModsPlanned, totalAttrSlots);

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
      let attr2Val: AttrStat;
      if (chcAttrsPlaced < chcAttrsPlanned && attr1Val !== 'chc') {
        attr2Val = 'chc';
        chcAttrsPlaced++;
      } else if (p.primary !== attr1Val) {
        attr2Val = p.primary;
      } else {
        const sec = p.secondary;
        attr2Val = (sec && sec !== attr1Val) ? sec : (attr1Val === 'hsd' ? 'chd' : 'hsd');
      }
      build.setSlotAttr(slot, 'attr2', attr2Val);
    }
  }

  for (const slot of MOD_SLOTS) {
    build.setSlotAttr(slot, 'modAttr', modAssignments[slot] as unknown as AttrStat);
  }
}
