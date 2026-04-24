import { Type, type Static } from '@sinclair/typebox';

export const StatKey = Type.Union([
  Type.Literal('wd'),
  Type.Literal('chc'),
  Type.Literal('chd'),
  Type.Literal('hsd'),
  Type.Literal('rof'),
  Type.Literal('mag'),
  Type.Literal('reload'),
  Type.Literal('handling'),
  Type.Literal('accuracy'),
  Type.Literal('stability'),
  Type.Literal('range'),
  Type.Literal('ammo'),
  Type.Literal('armor'),
  Type.Literal('armor_on_kill'),
  Type.Literal('armor_regen'),
  Type.Literal('health'),
  Type.Literal('health_on_kill'),
  Type.Literal('hazard_prot'),
  Type.Literal('explosive_resist'),
  Type.Literal('skill_tier'),
  Type.Literal('skill_haste'),
  Type.Literal('skill_dmg'),
  Type.Literal('skill_duration'),
  Type.Literal('skill_health'),
  Type.Literal('skill_repair'),
  Type.Literal('status_effects'),
  Type.Literal('ooc'),
  Type.Literal('dta'),
  Type.Literal('dth'),
  Type.Literal('elite'),
  Type.Literal('wd_ar'),
  Type.Literal('wd_smg'),
  Type.Literal('wd_lmg'),
  Type.Literal('wd_mmr'),
  Type.Literal('wd_rifle'),
  Type.Literal('wd_shotgun'),
  Type.Literal('wd_pistol'),
  Type.Literal('ergo'),
]);

export type StatKey = Static<typeof StatKey>;

export const NumericBonus = Type.Object({
  stat: StatKey,
  value: Type.Number(),
});

export type NumericBonus = Static<typeof NumericBonus>;
