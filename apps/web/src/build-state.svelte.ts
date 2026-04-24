import type { GameData } from './data.js';
import { calculateDps, type DpsInput, type DpsOutput } from '@divcalc/formulas';
import { findGearTalentBonus } from './data/gear-talent-bonuses.js';
import { findMod, MOD_SLOTS, type ModSlot } from './data/weapon-mods.js';
import { findSpec } from './data/specializations.js';
import { findSet4pc } from './data/set-4pc-bonuses.js';
import { findGearMod } from './data/gear-mods.js';
import { applyHeadhunterCap } from '@divcalc/formulas';

export type SlotKey = 'chest' | 'backpack' | 'gloves' | 'mask' | 'holster' | 'kneepads';

export type AttrStat =
  | 'chc'
  | 'chd'
  | 'hsd'
  | 'dta'
  | 'dth'
  | 'ooc'
  | 'wd'
  | 'mag'
  | 'reload'
  | 'handling';

// Gear mod is a separate value from attrs — stores the full mod id
export type GearModId = string;

export interface GearSlot {
  brandId: string | null;
  setId: string | null;
  /** If set, this slot holds a Named gear item (mutually exclusive with brand/set) */
  namedId: string | null;
  coreStat: 'wd' | 'armor' | 'skill_tier';
  attr1: AttrStat | null;
  attr2: AttrStat | null;
  modAttr: GearModId | null;
}

export const SLOT_KEYS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];

export const MOD_SLOT_KEYS: Set<SlotKey> = new Set(['chest', 'backpack', 'mask']);

const ATTR_DEFAULTS: Record<AttrStat, number> = {
  chc: 6,
  chd: 12,
  hsd: 12,
  dta: 15,
  dth: 15,
  ooc: 15,
  wd: 9,
  mag: 21,
  reload: 10,
  handling: 9,
};

function emptySlot(): GearSlot {
  return { brandId: null, setId: null, namedId: null, coreStat: 'wd', attr1: null, attr2: null, modAttr: null };
}

export function createBuildState() {
  let weaponId: string | null = $state(null);
  let weaponTalentActive = $state(false);
  let weaponTalentStacks = $state(0);
  let customWeaponTalentId: string | null = $state(null);
  let gear: Record<SlotKey, GearSlot> = $state({
    chest: emptySlot(),
    backpack: emptySlot(),
    gloves: emptySlot(),
    mask: emptySlot(),
    holster: emptySlot(),
    kneepads: emptySlot(),
  });
  let chestTalentId: string | null = $state(null);
  let chestTalentActive = $state(false);
  let backpackTalentId: string | null = $state(null);
  let backpackTalentActive = $state(false);
  let shdWatchActive = $state(false);
  let weaponMods: Record<ModSlot, string | null> = $state({
    optic: null,
    muzzle: null,
    underbarrel: null,
    magazine: null,
  });
  let specializationId: string | null = $state(null);
  let groupSize = $state(1);
  let targetStatus: 'none' | 'burning' | 'bleeding' | 'shocked' | 'poisoned' | 'blinded' = $state('none');
  let targetPulsed = $state(false);
  let fullArmor = $state(true);
  /** Active stacks of 4pc set bonuses (keyed by setId). */
  let setStacks: Record<string, number> = $state({});
  /** Set chest talent equipped per set (raises maxChest cap). */
  let setChestTalent: Record<string, boolean> = $state({});
  /** Set backpack talent equipped per set (switches perStack → perStackBp). */
  let setBpTalent: Record<string, boolean> = $state({});
  /** Input mode: 'gear' — auto from gear, 'stats' — user enters raw % */
  const DEFAULT_STATS = {
    wd: 90, chc: 60, chd: 150, hsd: 50,
    rof: 0, mag: 0, reload: 0, ooc: 0,
    dta: 15, dth: 15,
    wd_ar: 0, wd_smg: 0, wd_lmg: 0, wd_mmr: 0,
    wd_rifle: 0, wd_shotgun: 0, wd_pistol: 0,
  };
  let inputMode: 'gear' | 'stats' = $state((() => {
    if (typeof localStorage === 'undefined') return 'gear';
    try { return (localStorage.getItem('divcalc:input-mode') as 'gear' | 'stats') || 'gear'; } catch { return 'gear'; }
  })());
  let manualStats = $state((() => {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_STATS };
    try {
      const raw = localStorage.getItem('divcalc:manual-stats');
      if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_STATS };
  })());
  let expertiseGrade = $state(0);
  let headshotChancePct = $state(0);

  return {
    get weaponId() {
      return weaponId;
    },
    set weaponId(v: string | null) {
      weaponId = v;
      weaponTalentActive = false;
      customWeaponTalentId = null;
    },
    get weaponTalentActive() {
      return weaponTalentActive;
    },
    set weaponTalentActive(v: boolean) {
      weaponTalentActive = v;
    },
    get weaponTalentStacks() {
      return weaponTalentStacks;
    },
    set weaponTalentStacks(v: number) {
      weaponTalentStacks = Math.max(0, v);
    },
    get customWeaponTalentId() {
      return customWeaponTalentId;
    },
    set customWeaponTalentId(v: string | null) {
      customWeaponTalentId = v;
    },
    get gear() {
      return gear;
    },
    get expertiseGrade() {
      return expertiseGrade;
    },
    set expertiseGrade(v: number) {
      expertiseGrade = Math.max(0, Math.min(30, v));
    },
    get headshotChancePct() {
      return headshotChancePct;
    },
    set headshotChancePct(v: number) {
      headshotChancePct = Math.max(0, Math.min(100, v));
    },
    setSlotBrand(slot: SlotKey, brandId: string | null) {
      gear[slot] = { ...gear[slot], brandId, setId: brandId ? null : gear[slot].setId, namedId: brandId ? null : gear[slot].namedId };
    },
    setSlotSet(slot: SlotKey, setId: string | null) {
      gear[slot] = { ...gear[slot], setId, brandId: setId ? null : gear[slot].brandId, namedId: setId ? null : gear[slot].namedId };
    },
    setSlotNamed(slot: SlotKey, namedId: string | null) {
      gear[slot] = { ...gear[slot], namedId, brandId: namedId ? null : gear[slot].brandId, setId: namedId ? null : gear[slot].setId };
    },
    setSlotCore(slot: SlotKey, coreStat: GearSlot['coreStat']) {
      gear[slot] = { ...gear[slot], coreStat };
    },
    setSlotAttr(slot: SlotKey, which: 'attr1' | 'attr2' | 'modAttr', stat: AttrStat | null) {
      gear[slot] = { ...gear[slot], [which]: stat };
    },
    get chestTalentId() { return chestTalentId; },
    set chestTalentId(v: string | null) {
      chestTalentId = v;
      if (!v) chestTalentActive = false;
    },
    get chestTalentActive() { return chestTalentActive; },
    set chestTalentActive(v: boolean) { chestTalentActive = v; },
    get backpackTalentId() { return backpackTalentId; },
    set backpackTalentId(v: string | null) {
      backpackTalentId = v;
      if (!v) backpackTalentActive = false;
    },
    get backpackTalentActive() { return backpackTalentActive; },
    set backpackTalentActive(v: boolean) { backpackTalentActive = v; },
    get shdWatchActive() { return shdWatchActive; },
    set shdWatchActive(v: boolean) { shdWatchActive = v; },
    get weaponMods() { return weaponMods; },
    setWeaponMod(slot: ModSlot, id: string | null) {
      weaponMods = { ...weaponMods, [slot]: id };
    },
    get specializationId() { return specializationId; },
    set specializationId(v: string | null) { specializationId = v; },
    get groupSize() { return groupSize; },
    set groupSize(v: number) { groupSize = Math.max(1, Math.min(4, v)); },
    get targetStatus() { return targetStatus; },
    set targetStatus(v: typeof targetStatus) { targetStatus = v; },
    get targetPulsed() { return targetPulsed; },
    set targetPulsed(v: boolean) { targetPulsed = v; },
    get fullArmor() { return fullArmor; },
    set fullArmor(v: boolean) { fullArmor = v; },
    get setStacks() { return setStacks; },
    setSetStacks(setId: string, n: number) {
      setStacks = { ...setStacks, [setId]: Math.max(0, n) };
    },
    get setChestTalent() { return setChestTalent; },
    setSetChestTalent(setId: string, v: boolean) {
      setChestTalent = { ...setChestTalent, [setId]: v };
    },
    get setBpTalent() { return setBpTalent; },
    setSetBpTalent(setId: string, v: boolean) {
      setBpTalent = { ...setBpTalent, [setId]: v };
    },
    get inputMode() { return inputMode; },
    set inputMode(v: 'gear' | 'stats') {
      inputMode = v;
      try { localStorage.setItem('divcalc:input-mode', v); } catch { /* ignore */ }
    },
    get manualStats() { return manualStats; },
    setManualStat(key: keyof typeof manualStats, v: number) {
      manualStats = { ...manualStats, [key]: Math.max(0, v) };
      try { localStorage.setItem('divcalc:manual-stats', JSON.stringify(manualStats)); } catch { /* ignore */ }
    },
    reset() {
      weaponId = null;
      weaponTalentActive = false;
      weaponTalentStacks = 0;
      customWeaponTalentId = null;
      for (const k of SLOT_KEYS) gear[k] = emptySlot();
      chestTalentId = null;
      chestTalentActive = false;
      backpackTalentId = null;
      backpackTalentActive = false;
      shdWatchActive = false;
      weaponMods = { optic: null, muzzle: null, underbarrel: null, magazine: null };
      specializationId = null;
      groupSize = 1;
      targetStatus = 'none';
      targetPulsed = false;
      fullArmor = true;
      setStacks = {};
      setChestTalent = {};
      setBpTalent = {};
      expertiseGrade = 0;
      headshotChancePct = 0;
      // inputMode and manualStats preserved intentionally — user preference
    },
  };
}

export type BuildState = ReturnType<typeof createBuildState>;

export interface BuildSummary {
  dps: DpsOutput;
  dpsInput: DpsInput;
  additive: {
    wd: number;
    chc: number;
    chd: number;
    hsd: number;
    rof: number;
    mag: number;
    reload: number;
    ooc: number;
    dta: number;
    dth: number;
  };
  setCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  /** DPS simulated at time points (seconds) with stack ramp-up */
  ramp: Array<{ t: number; dps: number; stacks: Record<string, number> }>;
}

/** Simulate stack count at time t based on trigger type and cap. */
function stacksAtTime(trigger: string, maxStacks: number, t: number): number {
  // approximation (v1 uses more complex decay, this is simplified)
  const rate: Record<string, number> = {
    hit: 8,     // shots per sec approx for SMG/AR
    hs: 2,      // headshots per sec
    kill: 0.33,
    tempo: 20,
    proc: 1,
    shot_cover: 8,
    hs_kill: 0.15,
  };
  const r = rate[trigger] ?? 1;
  return Math.min(Math.floor(r * t), maxStacks);
}

const BRAND_STAT_KEYS = new Set<string>([
  'wd', 'chc', 'chd', 'hsd', 'rof', 'mag', 'reload', 'handling', 'ooc', 'dta', 'dth', 'armor',
  'armor_on_kill', 'health', 'skill_dmg', 'skill_haste', 'status_effects', 'elite',
]);

export function computeBuild(state: BuildState, data: GameData): BuildSummary {
  const additive = {
    wd: 0,
    chc: 0,
    chd: 0,
    hsd: 0,
    rof: 0,
    mag: 0,
    reload: 0,
    ooc: 0,
    dta: 0,
    dth: 0,
  } as BuildSummary['additive'] & Record<string, number>;

  const amplifiedMultipliers: number[] = [];

  const setCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};

  // STATS mode: user enters values directly, gear is ignored for DPS
  if (state.inputMode === 'stats') {
    const ms = state.manualStats;
    Object.assign(additive, {
      wd: ms.wd,
      chc: ms.chc,
      chd: ms.chd,
      hsd: ms.hsd,
      rof: ms.rof,
      mag: ms.mag,
      reload: ms.reload,
      ooc: ms.ooc,
      dta: ms.dta,
      dth: ms.dth,
    });

    const weapon = state.weaponId ? data.byId.weapon.get(state.weaponId) : null;
    // Weapon-type-specific damage from manual stats, matches current weapon class
    const typeWd = weapon ? (ms as Record<string, number>)[`wd_${weapon.category}`] ?? 0 : 0;
    const dpsInput: DpsInput = {
      weapon: weapon
        ? {
            baseDamage: weapon.baseDamage,
            rpm: weapon.rpm * (1 + additive.rof / 100),
            magazine: weapon.magazine,
            reloadSeconds: Math.max(0.1, weapon.reloadSeconds * (1 - additive.reload / 100)),
            headshotMultiplier: weapon.headshotMultiplier,
          }
        : { baseDamage: 0, rpm: 0, magazine: 1, reloadSeconds: 1, headshotMultiplier: 1.5 },
      additive: { weaponDamagePct: additive.wd, weaponTypeDamagePct: typeWd, additiveTalentsPct: 0 },
      amplified: { multipliers: [] },
      crit: { chcPct: additive.chc, chdPct: additive.chd, hsdPct: additive.hsd, headshotChancePct: state.headshotChancePct },
      target: { damageToArmorPct: additive.dta, damageToHealthPct: additive.dth, damageOutOfCoverPct: additive.ooc, fullArmor: state.fullArmor },
      expertise: { grade: state.expertiseGrade },
    };
    return {
      dps: calculateDps(dpsInput),
      dpsInput,
      additive,
      setCounts,
      brandCounts,
      ramp: [],
    };
  }

  for (const slotKey of SLOT_KEYS) {
    const slot = state.gear[slotKey];
    if (slot.setId) setCounts[slot.setId] = (setCounts[slot.setId] || 0) + 1;
    if (slot.brandId) brandCounts[slot.brandId] = (brandCounts[slot.brandId] || 0) + 1;
    // Named gear contributes via its brand + fixed attrs (locked)
    if (slot.namedId) {
      const ng = data.byId.namedGear.get(slot.namedId);
      if (ng) {
        if (ng.brand) brandCounts[ng.brand] = (brandCounts[ng.brand] || 0) + 1;
        for (const { stat, value } of ng.fixedAttrs) {
          (additive as Record<string, number>)[stat] = ((additive as Record<string, number>)[stat] || 0) + value;
        }
      }
    }
    if (slot.coreStat === 'wd') additive.wd += 15;

    // Attribute rolls (max values by default)
    if (slot.attr1) {
      additive[slot.attr1] = (additive[slot.attr1] || 0) + ATTR_DEFAULTS[slot.attr1];
    }
    if (slot.attr2) {
      additive[slot.attr2] = (additive[slot.attr2] || 0) + ATTR_DEFAULTS[slot.attr2];
    }
    if (slot.modAttr && MOD_SLOT_KEYS.has(slotKey)) {
      const mod = findGearMod(slot.modAttr);
      if (mod && (mod.stat === 'chc' || mod.stat === 'chd' || mod.stat === 'hsd' || mod.stat === 'skill_haste' || mod.stat === 'skill_duration' || mod.stat === 'repair_skills')) {
        (additive as Record<string, number>)[mod.stat] =
          ((additive as Record<string, number>)[mod.stat] || 0) + mod.value;
      }
    }
  }

  for (const [setId, count] of Object.entries(setCounts)) {
    const gs = data.byId.set.get(setId);
    if (!gs) continue;
    for (const { pieces, bonus } of gs.numericBonuses) {
      if (count >= pieces && BRAND_STAT_KEYS.has(bonus.stat)) {
        (additive as Record<string, number>)[bonus.stat] =
          ((additive as Record<string, number>)[bonus.stat] || 0) + bonus.value;
      }
    }
  }

  for (const [brandId, count] of Object.entries(brandCounts)) {
    const br = data.byId.brand.get(brandId);
    if (!br) continue;
    for (const { pieces, bonus } of br.bonuses) {
      if (count >= pieces && BRAND_STAT_KEYS.has(bonus.stat)) {
        (additive as Record<string, number>)[bonus.stat] =
          ((additive as Record<string, number>)[bonus.stat] || 0) + bonus.value;
      }
    }
  }

  const weapon = state.weaponId ? data.byId.weapon.get(state.weaponId) : null;

  // Weapon talent application
  // For named/exotic weapons: use weapon.talentId (locked)
  // For base weapons: use state.customWeaponTalentId (user-chosen)
  const effectiveTalentId = weapon?.kind === 'base' ? state.customWeaponTalentId : weapon?.talentId;
  if (effectiveTalentId && state.weaponTalentActive) {
    const talent = data.byId.talent.get(effectiveTalentId);
    if (talent) {
      for (const { stat, value } of talent.bonuses) {
        if (talent.bonusType === 'amplified') {
          amplifiedMultipliers.push(value);
        } else if (stat in additive) {
          (additive as Record<string, number>)[stat] =
            ((additive as Record<string, number>)[stat] || 0) + value;
        }
      }
    }
  }

  // Exotic weapon talent types (amp/kill/stacks/shot_cover/hs_kill/swap_in/conditional/no_reload)
  if (weapon && state.weaponTalentActive && weapon.talType && typeof weapon.talBonus === 'number') {
    const talType = weapon.talType;
    const talBonus = weapon.talBonus;
    const talMax = weapon.talMax || 1;
    const stacks = state.weaponTalentStacks;

    let appliedWd = 0;
    if (talType === 'amp' || talType === 'swap_in' || talType === 'conditional') {
      // Constant bonus when active
      appliedWd = talBonus;
    } else if (talType === 'kill' || talType === 'stacks' || talType === 'shot_cover' || talType === 'hs_kill') {
      // Per-stack scaling: stacks / max * tal_bonus (or stacks * per-stack if tal_max is large)
      const capped = Math.min(stacks, talMax);
      appliedWd = talMax > 0 ? (capped / talMax) * talBonus : 0;
    }
    if (appliedWd > 0) {
      additive.wd += appliedWd;
    }
  }

  // Exotic peak bonuses (exotic_peak_wd/chc/chd). If exotic_amp_type === 'amp' → additive, else peak-only
  if (weapon) {
    const isAmp = weapon.exoticAmpType === 'amp';
    if (isAmp) {
      if (typeof weapon.exoticPeakWd === 'number') additive.wd += weapon.exoticPeakWd;
      if (typeof weapon.exoticPeakChc === 'number') additive.chc += weapon.exoticPeakChc;
      if (typeof weapon.exoticPeakChd === 'number') additive.chd += weapon.exoticPeakChd;
    }
  }

  // Gear talents (chest + backpack)
  const applyGearTalent = (id: string | null, active: boolean) => {
    if (!id || !active) return;
    const t = findGearTalentBonus(id);
    if (!t) return;
    for (const { stat, value } of t.bonuses) {
      if (t.bonusType === 'amplified') {
        amplifiedMultipliers.push(value);
      } else {
        (additive as Record<string, number>)[stat] =
          ((additive as Record<string, number>)[stat] || 0) + value;
      }
    }
  };
  applyGearTalent(state.chestTalentId, state.chestTalentActive);
  applyGearTalent(state.backpackTalentId, state.backpackTalentActive);

  // SHD Watch: +10% WD, +10% CHC (capped 60), +10% CHD at 1000+ SHD
  if (state.shdWatchActive) {
    additive.wd += 10;
    additive.chc += 10;
    additive.chd += 10;
  }

  // Group size bonus: +5% WD per teammate (up to 3 allies = +15%)
  if (state.groupSize > 1) {
    additive.wd += (state.groupSize - 1) * 5;
  }

  // Target status / marker — named and exotic weapon specific bonuses
  if (weapon && (weapon.kind === 'named' || weapon.kind === 'exotic')) {
    // Pyromaniac AR (burning target): +30% WD, +10% CHC
    if (state.targetStatus === 'burning' && weapon.id === 'pyromaniac') {
      additive.wd += 30;
      additive.chc += 10;
    }
    // Scorpio: +30% WD vs bleeding/burning
    if ((state.targetStatus === 'bleeding' || state.targetStatus === 'burning') && weapon.id === 'scorpio') {
      additive.wd += 30;
    }
    // Razorback: +20% WD + +10% CHC vs any status
    if (state.targetStatus !== 'none' && weapon.id === 'razorback') {
      additive.wd += 20;
      additive.chc += 10;
    }
    // Diamondback: +20% CHD on marked target
    if (weapon.id === 'diamondback' && state.targetPulsed) {
      additive.chd += 20;
    }
    // Regulus: +100% CHD on HS kill marker (use targetPulsed as proxy for marker)
    if (weapon.id === 'regulus' && state.targetPulsed) {
      additive.chd += 100;
    }
  }

  // Generic: any status active gives +10% WD baseline (conservative approx)
  if (state.targetStatus !== 'none' && weapon?.kind !== 'named') {
    additive.wd += 10;
  }

  // Pulsed target: Spotter talent condition
  if (state.targetPulsed && state.backpackTalentId === 'gt_spotter' && state.backpackTalentActive) {
    // Already handled by Spotter amplified — this is a sanity flag
  }

  // Full armor: Vigilance condition
  if (state.fullArmor && state.backpackTalentId === 'gt_vigilance' && state.backpackTalentActive) {
    // Already handled — flag for UI feedback
  }

  // 4pc Set stacks: AMPLIFIED bucket (per v1 / mannequin measurements)
  // NOT additive with WD. Added as a separate multiplier.
  for (const [setId, count] of Object.entries(setCounts)) {
    if (count < 4) continue;
    const meta = findSet4pc(setId);
    if (!meta) continue;
    const stacks = state.setStacks[setId] ?? 0;
    if (stacks <= 0) continue;
    const hasChestT = !!state.setChestTalent[setId];
    const hasBpT = !!state.setBpTalent[setId];
    const maxStacks = hasChestT && meta.maxChest ? meta.maxChest : meta.maxBase;
    const effectiveStacks = Math.min(stacks, maxStacks);
    const perStackList = hasBpT && meta.perStackBp ? meta.perStackBp : meta.perStack;
    for (const { stat, value } of perStackList) {
      const totalPct = effectiveStacks * value;
      if (stat === 'wd') {
        // Amplified WD — separate multiplier
        amplifiedMultipliers.push(totalPct);
      } else if (stat === 'chc') {
        additive.chc += totalPct;
      } else if (stat === 'chd') {
        // CHD stacks go into CHD total (not amplified — it's a crit stat)
        additive.chd += totalPct;
      } else if (stat === 'hsd') {
        additive.hsd += totalPct;
      } else if (stat === 'rof') {
        additive.rof += totalPct;
      }
    }
  }

  // Weapon mods (new schema: { stat, value })
  for (const slot of MOD_SLOTS) {
    const modId = state.weaponMods[slot];
    if (!modId) continue;
    const mod = findMod(modId);
    if (!mod || !mod.stat || !mod.value) continue;
    (additive as Record<string, number>)[mod.stat] =
      ((additive as Record<string, number>)[mod.stat] || 0) + mod.value;
  }

  // Specialization (only applies if weapon class matches)
  if (state.specializationId) {
    const spec = findSpec(state.specializationId);
    if (spec) {
      for (const { stat, value } of spec.bonus) {
        (additive as Record<string, number>)[stat] =
          ((additive as Record<string, number>)[stat] || 0) + value;
      }
    }
  }

  // Map weapon-class-specific WD to weaponTypeDamagePct (stacks additively with wd)
  let weaponTypeDamagePct = 0;
  if (weapon) {
    const catKey = `wd_${weapon.category}` as keyof typeof additive;
    const classWd = (additive as Record<string, number>)[catKey as string];
    if (typeof classWd === 'number') weaponTypeDamagePct += classWd;
  }

  const dpsInput: DpsInput = {
    weapon: weapon
      ? {
          baseDamage: weapon.baseDamage,
          rpm: weapon.rpm,
          magazine: weapon.magazine,
          reloadSeconds: weapon.reloadSeconds,
          headshotMultiplier: weapon.headshotMultiplier,
        }
      : { baseDamage: 0, rpm: 0, magazine: 1, reloadSeconds: 1, headshotMultiplier: 1.5 },
    additive: {
      weaponDamagePct: additive.wd,
      weaponTypeDamagePct,
      additiveTalentsPct: 0,
    },
    amplified: { multipliers: amplifiedMultipliers },
    crit: {
      chcPct: additive.chc,
      chdPct: additive.chd,
      hsdPct: additive.hsd,
      headshotChancePct: state.headshotChancePct,
    },
    target: {
      damageToArmorPct: additive.dta,
      damageToHealthPct: additive.dth,
      damageOutOfCoverPct: additive.ooc,
      fullArmor: state.fullArmor,
    },
    expertise: { grade: state.expertiseGrade },
  };

  const dps = calculateDps(dpsInput);

  // Headhunter cap: if backpack talent id matches headhunter, cap bulletDamageCritHs
  const isHeadhunter = state.backpackTalentId === 'gt_headhunter' || state.chestTalentId === 'gt_headhunter';
  if (isHeadhunter && weapon) {
    dps.bulletDamageCritHs = applyHeadhunterCap(dps.bulletDamageCritHs, weapon.baseDamage, additive.hsd);
  }

  // DPS ramp-up simulation with stack accumulation
  const rampTimes = [0, 1, 2, 3, 5, 7, 10];
  const ramp = rampTimes.map((t) => {
    let wdExtra = 0;
    const stacks: Record<string, number> = {};
    // Set 4pc stacks accumulate over time
    for (const [setId, count] of Object.entries(setCounts)) {
      if (count < 4) continue;
      const meta = findSet4pc(setId);
      if (!meta) continue;
      const maxSt = meta.maxBase;
      const actualStacks = stacksAtTime(meta.trigger, maxSt, t);
      stacks[setId] = actualStacks;
      for (const { stat, value } of meta.perStack) {
        if (stat === 'wd') wdExtra += actualStacks * value;
      }
    }
    // Weapon talent stacks
    if (weapon?.talType && ['kill', 'stacks', 'shot_cover', 'hs_kill'].includes(weapon.talType)) {
      const max = weapon.talMax || 1;
      const bonus = weapon.talBonus || 0;
      const actualStacks = stacksAtTime(weapon.talType, max, t);
      stacks['_wpn_tal'] = actualStacks;
      if (max > 0) wdExtra += (actualStacks / max) * bonus;
    }
    // Compute DPS with extra WD
    const rampInput: DpsInput = {
      ...dpsInput,
      additive: {
        ...dpsInput.additive,
        weaponDamagePct: dpsInput.additive.weaponDamagePct + wdExtra,
      },
    };
    return { t, dps: calculateDps(rampInput).burstDps, stacks };
  });

  return {
    dps,
    dpsInput,
    additive,
    setCounts,
    brandCounts,
    ramp,
  };
}
