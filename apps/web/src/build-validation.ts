import type { BuildState, BuildSummary, SlotKey } from './build-state.svelte.js';
import type { GameData } from './data.js';

export type WarnLevel = 'info' | 'warn' | 'error';

export interface BuildWarning {
  level: WarnLevel;
  message: { en: string; ru: string };
}

const SLOT_KEYS: SlotKey[] = ['chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads'];

export function validateBuild(
  state: BuildState,
  summary: BuildSummary,
  data: GameData
): BuildWarning[] {
  const warns: BuildWarning[] = [];

  // CHC > 60% hard cap
  if (summary.additive.chc > 60) {
    const excess = summary.additive.chc - 60;
    warns.push({
      level: 'warn',
      message: {
        en: `CHC ${Math.round(summary.additive.chc)}% exceeds 60% cap. Wasting ${Math.round(excess)}% CHC — reroll to CHD/WD/HSD.`,
        ru: `CHC ${Math.round(summary.additive.chc)}% превышает cap 60%. Теряется ${Math.round(excess)}% CHC — переброс в CHD/WD/HSD.`,
      },
    });
  }

  // Empty gear slots
  const emptySlots: SlotKey[] = [];
  for (const k of SLOT_KEYS) {
    const s = state.gear[k];
    if (!s.brandId && !s.setId) emptySlots.push(k);
  }
  if (emptySlots.length > 0) {
    warns.push({
      level: 'info',
      message: {
        en: `${emptySlots.length} gear slot(s) empty: ${emptySlots.join(', ')}. You're missing core/attribute bonuses.`,
        ru: `${emptySlots.length} слот(ов) брони пусто: ${emptySlots.join(', ')}. Теряешь бонусы core/атрибутов.`,
      },
    });
  }

  // Set piece count analysis
  for (const [setId, count] of Object.entries(summary.setCounts)) {
    const setName =
      data.byId.set.get(setId)?.id ?? setId;
    if (count === 1) {
      warns.push({
        level: 'warn',
        message: {
          en: `1pc ${setName} — no set bonuses active. Either go 4pc or remove.`,
          ru: `1 шт ${setName} — бонусы сета не работают. Собирай 4шт или убирай.`,
        },
      });
    } else if (count === 2) {
      warns.push({
        level: 'info',
        message: {
          en: `2pc ${setName} — only 2pc bonus active. 4pc gives full set talent.`,
          ru: `2 шт ${setName} — работает только 2шт бонус. 4шт даёт полный сет-талант.`,
        },
      });
    } else if (count === 3) {
      warns.push({
        level: 'info',
        message: {
          en: `3pc ${setName} — missing 4pc for set talent (stacks, big bonus).`,
          ru: `3 шт ${setName} — не хватает 4шт для сет-таланта (стаки, большой бонус).`,
        },
      });
    }
  }

  // Brand stacking check (4+ brand pieces wasteful)
  for (const [, count] of Object.entries(summary.brandCounts)) {
    if (count > 3) {
      warns.push({
        level: 'warn',
        message: {
          en: `${count}pc of same brand — bonuses cap at 3pc. Extra pieces give no brand bonus.`,
          ru: `${count} шт одного бренда — бонусы работают до 3шт. Лишние части не дают бренд-бонус.`,
        },
      });
    }
  }

  // Total piece count
  const totalPieces =
    Object.values(summary.setCounts).reduce((a, b) => a + b, 0) +
    Object.values(summary.brandCounts).reduce((a, b) => a + b, 0);
  if (totalPieces > 0 && totalPieces < 6 && totalPieces + emptySlots.length !== 6) {
    warns.push({
      level: 'info',
      message: {
        en: `Only ${totalPieces} of 6 armor pieces placed.`,
        ru: `Размещено ${totalPieces} из 6 частей брони.`,
      },
    });
  }

  // Headshot chance 0 but HSD high
  if (summary.additive.hsd > 50 && state.headshotChancePct === 0) {
    warns.push({
      level: 'info',
      message: {
        en: `+${summary.additive.hsd}% HSD but HS% = 0. Set HS% to benefit from headshot damage.`,
        ru: `+${summary.additive.hsd}% HSD но HS% = 0. Укажи % попаданий в голову чтобы HSD работал.`,
      },
    });
  }

  // No weapon
  if (!state.weaponId) {
    warns.push({
      level: 'info',
      message: {
        en: 'Pick a weapon to calculate DPS.',
        ru: 'Выбери оружие для расчёта DPS.',
      },
    });
  }

  // Stacking sets suggestion when 4+ pieces
  const STACKING_SETS = new Set(['striker_s_battlegear', 'tipping_scales', 'umbra_initiative', 'punto_de_ruptura', 'hunter_s_fury']);
  const filledCount = 6 - emptySlots.length;
  const hasStackSet = Object.entries(summary.setCounts).some(([id, c]) => c >= 4 && STACKING_SETS.has(id));
  if (filledCount >= 4 && !hasStackSet && totalPieces >= 4) {
    warns.push({
      level: 'info',
      message: {
        en: 'No stacking sets (Striker, Tipping Scales, Umbra…). Consider for DPS ramp-up.',
        ru: 'Нет стак-сетов (Страйкер, Tipping Scales, Умбра…). Для роста DPS во времени.',
      },
    });
  }

  // Weapon type mismatch with set bonuses (e.g., set +AR dmg but weapon is SMG)
  if (state.weaponId) {
    const weapon = data.byId.weapon.get(state.weaponId);
    if (weapon) {
      const TYPE_MAP: Record<string, string[]> = {
        heartbreaker: ['ar', 'lmg'],
        ongoing_directive: ['ar', 'lmg'],
        the_flawless: ['mmr', 'rifle'],
        tipping_scales: ['mmr', 'rifle'],
      };
      for (const [setId, count] of Object.entries(summary.setCounts)) {
        if (count < 2) continue;
        const expectedCats = TYPE_MAP[setId];
        if (expectedCats && !expectedCats.includes(weapon.category)) {
          warns.push({
            level: 'warn',
            message: {
              en: `Set bonus expects ${expectedCats.join('/').toUpperCase()}, weapon is ${weapon.category.toUpperCase()} — type bonus inactive.`,
              ru: `Бонус сета даёт урон по ${expectedCats.join('/').toUpperCase()}, у тебя ${weapon.category.toUpperCase()} — тип-бонус не работает.`,
            },
          });
        }
      }
    }
  }

  // Talent requirements (Perfect variants need specific cores/attrs)
  const offensiveCores = Object.values(state.gear).filter((g) => g.coreStat === 'wd').length;
  const defensiveCores = Object.values(state.gear).filter((g) => g.coreStat === 'armor').length;
  const skillCores = Object.values(state.gear).filter((g) => g.coreStat === 'skill_tier').length;
  // Count attrs: offensive stats on gear = wd, chc, chd, hsd, dta, dth
  const OFFENSIVE_ATTRS = new Set(['chc', 'chd', 'hsd', 'dta', 'dth', 'wd', 'ooc']);
  const DEFENSIVE_ATTRS = new Set(['armor', 'health', 'armor_regen']);
  let offensiveAttrs = 0, defensiveAttrs = 0;
  for (const s of Object.values(state.gear)) {
    for (const a of [s.attr1, s.attr2]) {
      if (a && OFFENSIVE_ATTRS.has(a)) offensiveAttrs++;
      if (a && DEFENSIVE_ATTRS.has(a)) defensiveAttrs++;
    }
  }
  offensiveAttrs += offensiveCores;

  const PERFECT_REQS: Record<string, { check: () => boolean; msg_en: string; msg_ru: string }> = {
    perfect_glass_cannon: {
      check: () => offensiveCores >= 2,
      msg_en: `Perfect Glass Cannon needs 2+ red cores (you have ${offensiveCores})`,
      msg_ru: `Perfect Glass Cannon нужно 2+ красных core (у тебя ${offensiveCores})`,
    },
    perfect_obliterate: {
      check: () => offensiveAttrs >= 7,
      msg_en: `Perfect Obliterate needs 7 offensive attrs (you have ${offensiveAttrs})`,
      msg_ru: `Perfect Obliterate нужно 7 offensive атрибутов (у тебя ${offensiveAttrs})`,
    },
    perfect_wicked: {
      check: () => offensiveAttrs >= 7,
      msg_en: `Perfect Wicked needs 7 offensive attrs (you have ${offensiveAttrs})`,
      msg_ru: `Perfect Wicked нужно 7 offensive атрибутов (у тебя ${offensiveAttrs})`,
    },
    perfect_focus: {
      check: () => offensiveAttrs >= 6 && (state.weaponId ? ['mmr', 'rifle'].includes(data.byId.weapon.get(state.weaponId)?.category ?? '') : true),
      msg_en: `Perfect Focus: 6+ offensive attrs + MMR/Rifle only`,
      msg_ru: `Perfect Focus: 6+ offensive атрибутов + только MMR/Rifle`,
    },
    perfect_entrench: {
      check: () => defensiveCores >= 2,
      msg_en: `Perfect Entrench needs 2+ blue cores (you have ${defensiveCores})`,
      msg_ru: `Perfect Entrench нужно 2+ синих core (у тебя ${defensiveCores})`,
    },
    perfect_bloodsucker: {
      check: () => defensiveAttrs + defensiveCores >= 7,
      msg_en: `Perfect Bloodsucker needs 7 defensive attrs`,
      msg_ru: `Perfect Bloodsucker нужно 7 defensive атрибутов`,
    },
    perfect_combined_arms: {
      check: () => skillCores >= 2,
      msg_en: `Perfect Combined Arms needs 2+ yellow cores (you have ${skillCores})`,
      msg_ru: `Perfect Combined Arms нужно 2+ жёлтых core (у тебя ${skillCores})`,
    },
    perfect_galvanize: {
      check: () => skillCores >= 2,
      msg_en: `Perfect Galvanize needs 2+ yellow cores`,
      msg_ru: `Perfect Galvanize нужно 2+ жёлтых core`,
    },
  };
  for (const talentId of [state.chestTalentId, state.backpackTalentId, state.customWeaponTalentId]) {
    if (!talentId) continue;
    const req = PERFECT_REQS[talentId];
    if (req && !req.check()) {
      warns.push({ level: 'warn', message: { en: req.msg_en, ru: req.msg_ru } });
    }
  }

  // All good
  if (filledCount === 6 && state.weaponId && warns.filter((w) => w.level === 'warn' || w.level === 'error').length === 0) {
    warns.push({
      level: 'info',
      message: {
        en: '✓ Build complete, no critical warnings. Ready to share.',
        ru: '✓ Билд собран, критичных замечаний нет. Можно делиться.',
      },
    });
  }

  return warns;
}
