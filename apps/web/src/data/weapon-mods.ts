export type ModSlot = 'optic' | 'muzzle' | 'underbarrel' | 'magazine';

export interface WeaponMod {
  id: string;
  slot: ModSlot;
  stat: string | null;
  value: number;
  rawStat?: string | null;
  weaponClasses?: string[];
}

export const MOD_SLOTS: ModSlot[] = ['optic', 'muzzle', 'underbarrel', 'magazine'];

export let WEAPON_MODS: WeaponMod[] = [];

export async function loadWeaponMods(): Promise<WeaponMod[]> {
  if (WEAPON_MODS.length > 0) return WEAPON_MODS;
  try {
    const r = await fetch('/data/weapon-mods.json');
    if (!r.ok) return [];
    const j = await r.json() as { mods: WeaponMod[] };
    WEAPON_MODS = j.mods || [];
  } catch {
    WEAPON_MODS = [];
  }
  return WEAPON_MODS;
}

export function findMod(id: string): WeaponMod | undefined {
  return WEAPON_MODS.find((m) => m.id === id);
}

export function modsForSlot(slot: ModSlot): WeaponMod[] {
  return WEAPON_MODS.filter((m) => m.slot === slot);
}
