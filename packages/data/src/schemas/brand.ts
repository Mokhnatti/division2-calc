import { Type, type Static } from '@sinclair/typebox';
import { NumericBonus } from './stat.js';

export const BrandSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  bonuses: Type.Array(
    Type.Object({
      pieces: Type.Integer({ minimum: 1, maximum: 3 }),
      bonus: NumericBonus,
    })
  ),
  core: Type.String(),
  dlc: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type Brand = Static<typeof BrandSchema>;

export const BrandsFile = Type.Object({
  version: Type.String(),
  gameVersion: Type.String(),
  brands: Type.Array(BrandSchema),
});

export type BrandsFile = Static<typeof BrandsFile>;
