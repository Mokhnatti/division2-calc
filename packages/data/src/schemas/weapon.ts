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

export const WeaponSchema = Type.Object({
  id: Type.String({ minLength: 1, description: 'Stable English-derived ID, language-agnostic' }),
  category: WeaponCategory,
  baseDamage: Type.Number({ minimum: 0 }),
  rpm: Type.Number({ minimum: 0 }),
  magazine: Type.Integer({ minimum: 1 }),
  reloadSeconds: Type.Number({ minimum: 0 }),
  headshotMultiplier: Type.Number({ minimum: 1 }),
  talentId: Type.Optional(Type.String()),
  isExotic: Type.Boolean({ default: false }),
  isNamed: Type.Boolean({ default: false }),
});

export type Weapon = Static<typeof WeaponSchema>;

export const WeaponsFile = Type.Object({
  version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+' }),
  gameVersion: Type.String({ description: 'e.g. TU23.1' }),
  weapons: Type.Array(WeaponSchema),
});

export type WeaponsFile = Static<typeof WeaponsFile>;
