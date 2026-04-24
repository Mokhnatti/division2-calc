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
  | 'handling'
  | 'status_effects'
  | 'burn_duration';

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

// Default attr rolls for REGULAR (non-prototype) gear items — TU22.1 verified via user screenshots.
// Prototype items have higher caps (15/25/25) but most players use regular gear.
const ATTR_DEFAULTS: Record<AttrStat, number> = {
  chc: 6,
  chd: 12,
  hsd: 12,
  wd: 8,
  dta: 12,
  dth: 12,
  ooc: 12,
  handling: 8,
  mag: 21,
  reload: 10,
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
  /** Weapon classes player invested talent points into (+15% WD each, max 3). */
  let specClassPicks: string[] = $state([]);
  /** Unlocked MMR/Rifle HSD tier (+45% HSD to MMR & Rifle) — only for Sharpshooter/Survivalist. */
  let specMmrRifleHsd: boolean = $state(false);
  /** Active spec tree perks (by id — see SPECS[].treePerks). */
  let activeSpecPerks: string[] = $state([]);
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
  /** Exotic gear talent active (per slot). */
  let exoticActive: Record<string, boolean> = $state({});
  /** Input mode: 'gear' — auto from gear, 'stats' — user enters raw % */
  const DEFAULT_STATS = {
    wd: 90, chc: 60, chd: 150, hsd: 50,
    rof: 0, mag: 0, reload: 0, ooc: 0,
    dta: 15, dth: 15,
    amp: 0,
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
  /** Recombinator: 3 free slots where user sets (stat, percent) directly. */
  const DEFAULT_REC: Array<{ stat: AttrStat | null; value: number }> = [
    { stat: null, value: 0 },
    { stat: null, value: 0 },
    { stat: null, value: 0 },
  ];
  let recombinator: Array<{ stat: AttrStat | null; value: number }> = $state((() => {
    if (typeof localStorage === 'undefined') return DEFAULT_REC.map(x => ({ ...x }));
    try {
      const raw = localStorage.getItem('divcalc:rec-stats');
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length === 3) return parsed; }
    } catch { /* ignore */ }
    return DEFAULT_REC.map(x => ({ ...x }));
  })());

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
    get specClassPicks() { return specClassPicks; },
    toggleSpecClassPick(cls: string) {
      if (specClassPicks.includes(cls)) {
        specClassPicks = specClassPicks.filter((c) => c !== cls);
      } else if (specClassPicks.length < 3) {
        specClassPicks = [...specClassPicks, cls];
      }
    },
    get specMmrRifleHsd() { return specMmrRifleHsd; },
    set specMmrRifleHsd(v: boolean) { specMmrRifleHsd = v; },
    get activeSpecPerks() { return activeSpecPerks; },
    toggleSpecPerk(id: string) {
      activeSpecPerks = activeSpecPerks.includes(id)
        ? activeSpecPerks.filter(p => p !== id)
        : [...activeSpecPerks, id];
    },
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
    get exoticActive() { return exoticActive; },
    setExoticActive(slot: string, v: boolean) {
      exoticActive = { ...exoticActive, [slot]: v };
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
    get recombinator() { return recombinator; },
    setRecombinatorSlot(idx: number, stat: AttrStat | null, value: number) {
      if (idx < 0 || idx > 2) return;
      const next = [...recombinator];
      next[idx] = { stat, value: Math.max(0, value) };
      recombinator = next;
      try { localStorage.setItem('divcalc:rec-stats', JSON.stringify(recombinator)); } catch { /* ignore */ }
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
      specClassPicks = [];
      specMmrRifleHsd = false;
      groupSize = 1;
      targetStatus = 'none';
      targetPulsed = false;
      fullArmor = true;
      setStacks = {};
      setChestTalent = {};
      setBpTalent = {};
      exoticActive = {};
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
  /** Burn damage (DoT) for weapons that apply burn status (Iron Lung, Pyromaniac, etc). */
  burn?: {
    dpsPerTick: number;
    duration: number;
    totalPerApplication: number;
    statusEffectsPct: number;
    burnDurationPct: number;
  };
}

// Base Burn DPS coefficient at level 40 (max WT).
// Formula from game data (attribute_dictionary.mdict):
//   Burn_DPS = SkillCurveFinal × 40 × (1 + Status_Effects%)
//   Burn_Duration = 5 + (5 × Burn_Duration%)
// SkillCurveFinal at level 40 ≈ 300 (community-verified).
const SKILL_CURVE_LVL40 = 300;
const BURN_BASE_COEFF = 40;
const BURN_BASE_DURATION = 5;

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
  // Weapon-class-specific damage bonuses (matched to weapon category in computeBuild)
  'wd_ar', 'wd_smg', 'wd_lmg', 'wd_mmr', 'wd_rifle', 'wd_shotgun', 'wd_pistol',
]);

// Named gear talent bonuses at PEAK (v1-style "full stacks" display).
// Equalizer: "Versatile" — crit hits grant +1% WD for 10s, up to 100 stacks → +100% WD amplified.
// Deathgrips: +8% DtA + +8% DtH + crit talent.
// Ceska Claws: +20% CHD.
// etc. Mirror v1 peak values.
const NAMED_TALENT_BONUSES: Record<string, Array<{ stat: string; value: number; amp?: boolean }>> = {
  // Equalizer — "Идеальное тотальное уничтожение" (Perfect Obliterate):
  // Crit hits +1% WD for 10s, stacks up to 24. At peak = +24% WD AMPLIFIED (own multiplier).
  // Verified: with amp — matches in-game bullet damage 1:1 (St. Elmo + Strikers 4pc).
  equalizer: [{ stat: 'wd', value: 24, amp: true }],
  deathgrips: [{ stat: 'dta', value: 8 }, { stat: 'dth', value: 8 }],
  contractor_s_gloves: [{ stat: 'wd', value: 15 }],
  fox_s_prayer: [{ stat: 'ooc', value: 8 }],
  the_chatterbox: [{ stat: 'rof', value: 20 }],
  ninjabike_messenger_kneepads: [{ stat: 'wd', value: 10 }],
  hollow_man: [{ stat: 'wd', value: 25, amp: true }],
  wyvern_wear_mask: [{ stat: 'chd', value: 20 }],
  picaro_s_holster: [{ stat: 'wd', value: 15 }],
};

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

  // Dynamic talent-stack WD (Equalizer Obliterate, etc.) — NOT shown in weapon stat panel,
  // only applied to DPS calc. Game separates these from gear stats.
  let talentStackWd = 0;

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
    const typeWd = weapon ? (ms as Record<string, number>)[`wd_${weapon.category}`] ?? 0 : 0;
    const ampPct = (ms as Record<string, number>).amp ?? 0;
    const magSm = (1 + additive.mag / 100);
    const reloadSm = 1 / (1 + additive.reload / 100);
    const dpsInput: DpsInput = {
      weapon: weapon
        ? {
            baseDamage: weapon.baseDamage,
            rpm: weapon.rpm * (1 + additive.rof / 100),
            magazine: Math.max(1, Math.round(weapon.magazine * magSm)),
            reloadSeconds: Math.max(0.1, weapon.reloadSeconds * reloadSm),
            headshotMultiplier: weapon.headshotMultiplier,
          }
        : { baseDamage: 0, rpm: 0, magazine: 1, reloadSeconds: 1, headshotMultiplier: 1.5 },
      additive: { weaponDamagePct: additive.wd, weaponTypeDamagePct: typeWd, additiveTalentsPct: 0 },
      amplified: { multipliers: ampPct > 0 ? [ampPct] : [] },
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
        // Named/Exotic active talent bonuses — auto-on (peak). User can't toggle in v2 because
        // calculator always shows FULL power (like v1 peak DPS).
        if (ng.activeBonuses) {
          for (const b of ng.activeBonuses) {
            if (b.amp) {
              amplifiedMultipliers.push(b.value);
            } else {
              (additive as Record<string, number>)[b.stat] =
                ((additive as Record<string, number>)[b.stat] || 0) + b.value;
            }
          }
        }
        // Named talent stacks (Equalizer Obliterate = +24% WD at peak) — DYNAMIC stacks,
        // NOT shown in game's "Weapon damage" stat panel, only active during combat.
        // We track them separately in talentStackWd to apply only in DPS calc.
        const extra = NAMED_TALENT_BONUSES[ng.id];
        if (extra) {
          for (const b of extra) {
            if (b.amp) amplifiedMultipliers.push(b.value);
            else if (b.stat === 'wd') {
              talentStackWd += b.value;
            } else {
              (additive as Record<string, number>)[b.stat] =
                ((additive as Record<string, number>)[b.stat] || 0) + b.value;
            }
          }
        }
      }
    }
    if (slot.coreStat === 'wd') additive.wd += 15;

    // Attribute rolls (max values by default).
    // Named gear: fixedAttrs replace the corresponding slot — don't double-count.
    // Set gear: only ONE attribute slot (attr2 is reserved for the set bonus).
    const namedFixedCount = slot.namedId ? (data.byId.namedGear.get(slot.namedId)?.fixedAttrs.length ?? 0) : 0;
    const attr1Locked = namedFixedCount >= 1;
    const attr2Locked = namedFixedCount >= 2;
    if (slot.attr1 && !attr1Locked) {
      additive[slot.attr1] = (additive[slot.attr1] || 0) + ATTR_DEFAULTS[slot.attr1];
    }
    if (slot.attr2 && !attr2Locked && !slot.setId) {
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

  // Weapon intrinsic attributes — every weapon in D2 has 3 baked-in attrs (e.g. +12.7% AR,
  // +17.5% DtH, +9% HSD for St. Elmo's). These are part of the base weapon, not gear.
  if (weapon && Array.isArray((weapon as Record<string, unknown>).intrinsicAttrs)) {
    const intrinsic = (weapon as unknown as {
      intrinsicAttrs: Array<{ stat: string; value: number }>
    }).intrinsicAttrs;
    for (const a of intrinsic) {
      (additive as Record<string, number>)[a.stat] =
        ((additive as Record<string, number>)[a.stat] || 0) + a.value;
    }
  }

  // Exotic weapons have BUILT-IN mods (Проводник/Изоляция/Перезаряд). Player cannot change them
  // like on base/named weapons. Auto-apply as if equipped.
  if (weapon && weapon.kind === 'exotic' && Array.isArray((weapon as Record<string, unknown>).builtInMods)) {
    const builtIn = (weapon as unknown as {
      builtInMods: Array<{ slot: string; stat: string; value: number }>
    }).builtInMods;
    for (const b of builtIn) {
      if (b.stat === 'mag_add') {
        (additive as Record<string, number>).mag_flat =
          ((additive as Record<string, number>).mag_flat || 0) + b.value;
      } else {
        (additive as Record<string, number>)[b.stat] =
          ((additive as Record<string, number>)[b.stat] || 0) + b.value;
      }
    }
  }

  // Weapon talent application
  // For named/exotic weapons: use weapon.talentId (locked)
  // For base weapons: use state.customWeaponTalentId (user-chosen)
  // Auto-activate at peak: named/exotic talents apply automatically, base only if user picked a talent.
  const effectiveTalentId = weapon?.kind === 'base' ? state.customWeaponTalentId : weapon?.talentId;
  const weaponTalentOn = !!effectiveTalentId && (weapon?.kind !== 'base' || state.weaponTalentActive);
  if (effectiveTalentId && weaponTalentOn) {
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
  // Auto-max stacks — calculator always shows PEAK DPS (with talent at full).
  if (weapon && weaponTalentOn && weapon.talType && typeof weapon.talBonus === 'number') {
    const talType = weapon.talType;
    const talBonus = weapon.talBonus;
    const talMax = weapon.talMax || 1;
    const stacks = talMax;

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

  // Gear talents (chest + backpack). Auto-active when id is set — calculator shows peak.
  const applyGearTalent = (id: string | null) => {
    if (!id) return;
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
  applyGearTalent(state.chestTalentId);
  applyGearTalent(state.backpackTalentId);

  // Base game values shown in weapon stat panel (every player has these by default):
  //   Base CHC = 0% (no hidden baseline)
  //   Base CHD = 25% (all players have this regardless of gear)
  // User verified via in-game screenshot: Богомол sniper with only Watch (+20 CHD) shows 45% CHD total.
  additive.chd += 25;

  // SHD Watch: +10% WD, +10% CHC (capped 60), +10% CHD at 1000+ SHD
  if (state.shdWatchActive) {
    additive.wd += 10;
    additive.chc += 10;
    additive.chd += 10;
  }

  // SHD Watch (Часы Кинера) — 4 trees (120 points each, 20/attr max) from shd_watch.json:
  //   Offensive: WD +10%, CHC +10%, CHD +20%, HSD +20%, OoC +10%, Explosive +15%
  //   Handling: Accuracy +15%, Stability +15%, ReloadSpeed +10%, WeaponHandling +10%, Range +10%, SwapSpeed +30%
  //   Skill:    SkillDmg +10%, SkillHaste +10%, SkillRepair +10%, SkillHealth +10%, SkillDur +10%
  //   Defensive: Armor +10%, Health +10%, IncomingRepair +50%, ExplResist +20%, etc.
  // For max-level player DPS builds we assume these maxed:
  additive.wd += 10;
  additive.chc += 10;
  additive.chd += 20;
  additive.hsd += 20;
  (additive as Record<string, number>).handling = ((additive as Record<string, number>).handling || 0) + 10; // Watch WeaponHandling
  additive.reload += 10; // Watch ReloadSpeed

  // Recombinator: user-entered 3 stat bonuses (freeform, no module simulation)
  for (const slot of state.recombinator) {
    if (!slot.stat || slot.value === 0) continue;
    (additive as Record<string, number>)[slot.stat] =
      ((additive as Record<string, number>)[slot.stat] || 0) + slot.value;
  }

  // Group size does NOT affect player damage in Division 2.
  // It only scales enemy HP/armor (used separately in TTK calculations).

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
  // Auto-detect chest talent: if the chest slot itself carries the set (not named/brand) → set's
  // chest talent is available → cap raised to maxChest (200 for Striker, etc.).
  const chestSlotSetId = state.gear.chest.setId;
  for (const [setId, count] of Object.entries(setCounts)) {
    if (count < 4) continue;
    const meta = findSet4pc(setId);
    if (!meta) continue;
    // Set talents auto-activate ONLY if the set piece itself is equipped in that slot.
    // Strikers chest talent (200 cap) works only when chest IS a Strikers piece.
    // Strikers backpack talent (Risk Management, 0.9%/stack) only when backpack IS Strikers.
    const hasChestT = chestSlotSetId === setId;
    const hasBpT = state.gear.backpack.setId === setId;
    const maxStacks = hasChestT && meta.maxChest ? meta.maxChest : meta.maxBase;
    // Auto-max: calculator always shows PEAK DPS with full stacks.
    const effectiveStacks = maxStacks;
    const perStackList = hasBpT && meta.perStackBp ? meta.perStackBp : meta.perStack;
    for (const { stat, value } of perStackList) {
      const totalPct = effectiveStacks * value;
      if (stat === 'wd') {
        // WD bucket: amplified (own multiplier) vs additive based on set data.
        // TU22.1: Striker is ADDITIVE in WD pool (inherited from Striker's Gamble).
        // Hunter's Fury, Negotiator's Dilemma, Future Initiative — AMPLIFIED (per research).
        if (meta.wdAmplified) {
          amplifiedMultipliers.push(totalPct);
        } else {
          additive.wd += totalPct;
        }
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

  // Weapon mods (new schema: { stat, value }).
  // Special cases (stat=null): rawStat "Rounds" / "rounds" → flat magazine bonus (mag_flat).
  //                            rawStat "Rate of Fire" → rof%.
  for (const slot of MOD_SLOTS) {
    const modId = state.weaponMods[slot];
    if (!modId) continue;
    const mod = findMod(modId);
    if (!mod || !mod.value) continue;
    if (mod.stat) {
      (additive as Record<string, number>)[mod.stat] =
        ((additive as Record<string, number>)[mod.stat] || 0) + mod.value;
    } else if (mod.rawStat) {
      const raw = (mod as unknown as { rawStat: string }).rawStat.toLowerCase();
      if (raw === 'rounds') {
        (additive as Record<string, number>).mag_flat =
          ((additive as Record<string, number>).mag_flat || 0) + mod.value;
      } else if (raw === 'rate of fire') {
        additive.rof += mod.value;
      }
    }
  }

  // Specialization — unique passives (HSD, skill power, etc.)
  let reloadEvery3rd50 = false;
  if (state.specializationId) {
    const spec = findSpec(state.specializationId);
    if (spec) {
      for (const { stat, value } of spec.uniqueBonus) {
        (additive as Record<string, number>)[stat] =
          ((additive as Record<string, number>)[stat] || 0) + value;
      }
      // Tree perks — applied only when user toggled them active
      if (spec.treePerks) {
        for (const perk of spec.treePerks) {
          if (!state.activeSpecPerks.includes(perk.id)) continue;
          if (perk.stat === 'reload_every_3rd_50pct') {
            reloadEvery3rd50 = true;
          } else {
            (additive as Record<string, number>)[perk.stat] =
              ((additive as Record<string, number>)[perk.stat] || 0) + perk.value;
          }
        }
      }
    }
  }
  // Spec skill-tree: +15% WD per picked weapon class (up to 3)
  if (state.specClassPicks.length > 0 && weapon) {
    for (const cls of state.specClassPicks) {
      const key = `wd_${cls}`;
      (additive as Record<string, number>)[key] =
        ((additive as Record<string, number>)[key] || 0) + 15;
    }
  }

  // Map weapon-class-specific WD to weaponTypeDamagePct (stacks additively with wd)
  let weaponTypeDamagePct = 0;
  if (weapon) {
    const catKey = `wd_${weapon.category}` as keyof typeof additive;
    const classWd = (additive as Record<string, number>)[catKey as string];
    if (typeof classWd === 'number') weaponTypeDamagePct += classWd;
  }

  // Apply weapon-stat bonuses: RoF → RPM, magazine (flat+%), reload %.
  // Handling (эргономика) adds 1:1 to reload speed (game formula).
  // Base reload = empty-mag reload (game UI uses this, not tactical).
  // Example: St. Elmo empty=2.4s with Watch reload +10 + handling 35% (Watch 10 + Strikers 2pc 15 + grip 10):
  //   bonus = 45% → 2.4/1.45 = 1.655s ≈ 1.66s in game ✓
  const rofMul = 1 + (additive.rof || 0) / 100;
  const magFlat = (additive as Record<string, number>).mag_flat || 0;
  const magMul = 1 + (additive.mag || 0) / 100;
  const handlingVal = (additive as Record<string, number>).handling || 0;
  const reloadPct = (additive.reload || 0) + handlingVal;
  let reloadMul = 1 / (1 + reloadPct / 100);
  // Spec tree perk: every 3rd reload is 50% faster. Amortize: avg = (2×full + 1×half)/3 = 5/6.
  if (reloadEvery3rd50) reloadMul = reloadMul * (5 / 6);

  const dpsInput: DpsInput = {
    weapon: weapon
      ? {
          baseDamage: weapon.baseDamage,
          rpm: weapon.rpm * rofMul,
          magazine: Math.max(1, Math.round((weapon.magazine + magFlat) * magMul)),
          reloadSeconds: weapon.reloadSeconds * reloadMul,
          headshotMultiplier: weapon.headshotMultiplier,
        }
      : { baseDamage: 0, rpm: 0, magazine: 1, reloadSeconds: 1, headshotMultiplier: 1.5 },
    additive: {
      // WD for DPS includes talent stacks (Obliterate etc.) at peak.
      // Weapon stat display uses `additive.wd` only (without stacks).
      weaponDamagePct: additive.wd + talentStackWd,
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
  // Headhunter is a CHEST talent (TU22.1 verified, not backpack as before).
  // Formula: stored = killing_shot_dmg × 1.25 (Perfect/Chainkiller: 1.50)
  //          cap = weapon_base × 8 (×12.5 if HSD > 150%)
  //          next_hit = own_hit + min(stored, cap) — CONSUMED once.
  const hhChestId = state.chestTalentId;
  const isHeadhunter = hhChestId === 'gt_headhunter' || hhChestId === 'gt_perfect_headhunter';
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

  // Burn DPS (DoT). Applied by Iron Lung (Ardent talent fire bullets), Pyromaniac AR,
  // Firestarter, etc. Independent of weapon damage — uses Status Effects % stat only.
  const appliesBurn = !!(weapon as unknown as { appliesBurn?: boolean })?.appliesBurn;
  let burnSummary: BuildSummary['burn'];
  if (appliesBurn) {
    const statusEffectsPct = (additive as Record<string, number>).status_effects || 0;
    const burnDurationPct = (additive as Record<string, number>).burn_duration || 0;
    const dpsPerTick = SKILL_CURVE_LVL40 * BURN_BASE_COEFF * (1 + statusEffectsPct / 100);
    const duration = BURN_BASE_DURATION * (1 + burnDurationPct / 100);
    burnSummary = {
      dpsPerTick,
      duration,
      totalPerApplication: dpsPerTick * duration,
      statusEffectsPct,
      burnDurationPct,
    };
  }

  return {
    dps,
    dpsInput,
    additive,
    setCounts,
    brandCounts,
    ramp,
    burn: burnSummary,
  };
}
