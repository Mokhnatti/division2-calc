import { Type, type Static } from '@sinclair/typebox';

export const WeaponCategory = Type.Union([
  Type.Literal('ar'),
  Type.Literal('smg'),
  Type.Literal('lmg'),
  Type.Literal('mmr'),
  Type.Literal('rifle'),
  Type.Literal('shotgun'),
  Type.Literal('pistol'),
]);

export type WeaponCategory = Static<typeof WeaponCategory>;

export const WeaponMod = Type.Union([
  Type.Literal('scope'),
  Type.Literal('muzzle'),
  Type.Literal('underbarrel'),
  Type.Literal('magazine'),
]);

export const WeaponKind = Type.Union([
  Type.Literal('base'),
  Type.Literal('named'),
  Type.Literal('exotic'),
]);

export const WeaponSchema = Type.Object({
  id: Type.String({ minLength: 1, description: 'Stable slug — language-agnostic' }),
  kind: WeaponKind,
  category: WeaponCategory,
  baseDamage: Type.Number({ minimum: 0 }),
  rpm: Type.Number({ minimum: 0 }),
  magazine: Type.Integer({ minimum: 1 }),
  reloadSeconds: Type.Number({ minimum: 0 }),
  optimalRange: Type.Optional(Type.Number()),
  headshotMultiplier: Type.Number({ minimum: 1, default: 1.5 }),
  talentId: Type.Optional(Type.String()),
  brandId: Type.Optional(Type.String()),
  modSlots: Type.Array(WeaponMod),
  dlc: Type.Optional(Type.String()),
});

export type Weapon = Static<typeof WeaponSchema>;

export const WeaponsFile = Type.Object({
  version: Type.String(),
  gameVersion: Type.String(),
  weapons: Type.Array(WeaponSchema),
});

export type WeaponsFile = Static<typeof WeaponsFile>;
