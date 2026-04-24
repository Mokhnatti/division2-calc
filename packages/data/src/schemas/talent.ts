import { Type, type Static } from '@sinclair/typebox';
import { NumericBonus, StatKey } from './stat.js';

export const TalentKind = Type.Union([
  Type.Literal('weapon'),
  Type.Literal('chest'),
  Type.Literal('backpack'),
  Type.Literal('gloves'),
]);

export const TalentBonusType = Type.Union([
  Type.Literal('additive'),
  Type.Literal('amplified'),
  Type.Literal('conditional'),
]);

export const TalentSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  kind: TalentKind,
  bonusType: TalentBonusType,
  bonuses: Type.Array(NumericBonus),
  applicableWeaponClasses: Type.Optional(Type.Array(Type.String())),
  triggersOn: Type.Optional(Type.String()),
  durationSeconds: Type.Optional(Type.Number()),
  hasPerfectVariant: Type.Boolean({ default: false }),
  perfectBonuses: Type.Optional(Type.Array(NumericBonus)),
  stackable: Type.Optional(Type.Object({
    stat: StatKey,
    maxStacks: Type.Integer(),
    perStack: Type.Number(),
  })),
});

export type Talent = Static<typeof TalentSchema>;

export const TalentsFile = Type.Object({
  version: Type.String(),
  gameVersion: Type.String(),
  talents: Type.Array(TalentSchema),
});

export type TalentsFile = Static<typeof TalentsFile>;
