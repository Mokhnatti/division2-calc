import { Type, type Static } from '@sinclair/typebox';
import { NumericBonus } from './stat.js';

export const GearSetSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  type: Type.Union([
    Type.Literal('red'),
    Type.Literal('blue'),
    Type.Literal('yellow'),
    Type.Literal('purple'),
  ]),
  numericBonuses: Type.Array(
    Type.Object({
      pieces: Type.Integer({ minimum: 2, maximum: 4 }),
      bonus: NumericBonus,
    })
  ),
  chestTalentId: Type.Optional(Type.String()),
  backpackTalentId: Type.Optional(Type.String()),
  dlc: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type GearSet = Static<typeof GearSetSchema>;

export const GearSetsFile = Type.Object({
  version: Type.String(),
  gameVersion: Type.String(),
  sets: Type.Array(GearSetSchema),
});

export type GearSetsFile = Static<typeof GearSetsFile>;
