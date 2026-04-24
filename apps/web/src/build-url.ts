import type { BuildState, SlotKey } from './build-state.svelte.js';
import type { ModSlot } from './data/weapon-mods.js';

const SLOT_KEYS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];
const MOD_SLOTS: ModSlot[] = ['optic', 'muzzle', 'underbarrel', 'magazine'];

export function encodeBuild(b: BuildState): string {
  const params = new URLSearchParams();
  if (b.weaponId) params.set('w', b.weaponId);
  if (b.weaponTalentActive) params.set('wt', '1');
  if (b.customWeaponTalentId) params.set('wtal', b.customWeaponTalentId);
  for (const k of SLOT_KEYS) {
    const slot = b.gear[k];
    const parts = [slot.brandId ?? '', slot.setId ?? '', slot.coreStat, slot.attr1 ?? '', slot.attr2 ?? '', slot.modAttr ?? ''];
    if (parts.some((p) => p)) params.set(k, parts.join(','));
  }
  if (b.chestTalentId) {
    params.set('ct', b.chestTalentId + (b.chestTalentActive ? ',1' : ',0'));
  }
  if (b.backpackTalentId) {
    params.set('bt', b.backpackTalentId + (b.backpackTalentActive ? ',1' : ',0'));
  }
  if (b.shdWatchActive) params.set('shd', '1');
  if (b.specializationId) params.set('spec', b.specializationId);
  if (b.expertiseGrade > 0) params.set('exp', String(b.expertiseGrade));
  if (b.headshotChancePct > 0) params.set('hs', String(b.headshotChancePct));
  if (!b.fullArmor) params.set('fa', '0'); // default true, only encode if false
  if (b.targetStatus !== 'none') params.set('ts', b.targetStatus);
  if (b.targetPulsed) params.set('tp', '1');
  if (b.groupSize && b.groupSize !== 1) params.set('gs', String(b.groupSize));
  // Set stacks
  const stackKeys = Object.keys(b.setStacks ?? {});
  if (stackKeys.length) {
    const parts = stackKeys.map((k) => `${k}:${b.setStacks[k]}`).join(';');
    if (parts) params.set('ss', parts);
  }
  const chestTal = Object.entries(b.setChestTalent ?? {}).filter(([, v]) => v).map(([k]) => k).join(';');
  if (chestTal) params.set('sct', chestTal);
  const bpTal = Object.entries(b.setBpTalent ?? {}).filter(([, v]) => v).map(([k]) => k).join(';');
  if (bpTal) params.set('sbt', bpTal);
  for (const ms of MOD_SLOTS) {
    const mid = b.weaponMods[ms];
    if (mid) params.set('m_' + ms, mid);
  }
  return params.toString();
}

export function applyUrlToBuild(b: BuildState, params: URLSearchParams): void {
  const w = params.get('w');
  if (w) b.weaponId = w;
  if (params.get('wt') === '1') b.weaponTalentActive = true;
  const wtal = params.get('wtal');
  if (wtal) b.customWeaponTalentId = wtal;

  for (const k of SLOT_KEYS) {
    const raw = params.get(k);
    if (!raw) continue;
    const [brand, set, core, a1, a2, mod] = raw.split(',');
    if (brand) b.setSlotBrand(k, brand);
    if (set) b.setSlotSet(k, set);
    if (core) b.setSlotCore(k, core as 'wd' | 'armor' | 'skill_tier');
    if (a1) b.setSlotAttr(k, 'attr1', a1 as never);
    if (a2) b.setSlotAttr(k, 'attr2', a2 as never);
    if (mod) b.setSlotAttr(k, 'modAttr', mod as never);
  }

  const ct = params.get('ct');
  if (ct) {
    const [id, active] = ct.split(',');
    b.chestTalentId = id ?? null;
    b.chestTalentActive = active === '1';
  }
  const bt = params.get('bt');
  if (bt) {
    const [id, active] = bt.split(',');
    b.backpackTalentId = id ?? null;
    b.backpackTalentActive = active === '1';
  }
  if (params.get('shd') === '1') b.shdWatchActive = true;
  const spec = params.get('spec');
  if (spec) b.specializationId = spec;
  const exp = params.get('exp');
  if (exp) b.expertiseGrade = parseInt(exp, 10) || 0;
  const hs = params.get('hs');
  if (hs) b.headshotChancePct = parseInt(hs, 10) || 0;
  if (params.get('fa') === '0') b.fullArmor = false;
  const ts = params.get('ts');
  if (ts) b.targetStatus = ts as typeof b.targetStatus;
  if (params.get('tp') === '1') b.targetPulsed = true;
  const gs = params.get('gs');
  if (gs) b.groupSize = (parseInt(gs, 10) || 1) as typeof b.groupSize;
  const ss = params.get('ss');
  if (ss) {
    for (const part of ss.split(';')) {
      const [k, v] = part.split(':');
      if (k && v) b.setSetStacks(k, parseInt(v, 10) || 0);
    }
  }
  const sct = params.get('sct');
  if (sct) {
    for (const id of sct.split(';')) if (id) b.setSetChestTalent(id, true);
  }
  const sbt = params.get('sbt');
  if (sbt) {
    for (const id of sbt.split(';')) if (id) b.setSetBpTalent(id, true);
  }
  for (const ms of MOD_SLOTS) {
    const mid = params.get('m_' + ms);
    if (mid) b.setWeaponMod(ms, mid);
  }
}
