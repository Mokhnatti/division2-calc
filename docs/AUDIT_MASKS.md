# Audit: Mask Items — Division 2 Calc
Date: 2026-04-25

## Summary
- Game named masks: 5 (Nightwatcher, Chill Out, Visionario, The Hollow Man, Punch Drunk)
- Game exotic masks: 6 equippable + 1 April Fools non-equippable (Dogface — excluded)
- Our DB masks: 11 total (5 without `isExotic`, 6 with `isExotic: true`)

## Check 1: Wrong Exotic Classification (Mask Slot)

All 5 named masks and 6 exotic masks in DB are classified correctly for masks specifically.

No issues found for mask-slot items.

> Note: Two NON-mask items in DB have wrong classification:
>
> | DB ID | DB slot | DB flag | Game File | Issue |
> |---|---|---|---|---|
> | `contractor_s_gloves` | gloves | `isExotic: true` | gear_named.json → `player_gear_gloves_d_named_01` | Named item marked as exotic |
> | `fox_s_prayer` | kneepads | `isExotic: true` | gear_named.json → `player_gear_kneepads_f_named_01` | Named item marked as exotic |
>
> These are named items in the game data (`myIsNamed: true`), NOT exotic (`myIsExotic` absent). DB incorrectly marks them `isExotic: true`.

## Check 2: Missing Items in DB

### Named masks present in game files but NOT in DB
All 5 named masks are in the DB. No missing named masks.

### Exotic masks present in game files but NOT in DB

| Game ID | Name | Game File | Note |
|---|---|---|---|
| `player_gear_mask_exotic_01_aprilfools` | Dogface | gear_exotic.json | April Fools item, `myIsEquippableFlag: false` — intentionally excluded, OK |

All 6 real equippable exotic masks are in DB. No genuinely missing exotics.

## Check 3: Orphan Items in DB (Mask Slot)

No mask items in DB are absent from the game files. All 11 DB mask items have matching entries in gear_named.json or gear_exotic.json.

## Check 4: Wrong fixedAttrs (Mask Slot)

### Named masks — fixedAttrs check

Named masks in game files have NO bonuses sections (no `bonuses` array). The gear_mask.json only has Temperature Rating bonuses on cosmetic/vanity masks. Our DB values for named masks come from external game knowledge, not the pipeline files.

| DB ID | DB fixedAttrs | Note |
|---|---|---|
| `punch_drunk` | `hsd: 20` | Cannot verify from pipeline files — no bonuses in source |
| `nightwatcher` | `[]` (empty) | Cannot verify — no bonuses in source |
| `chill_out` | `[]` (empty) | Cannot verify — no bonuses in source |
| `visionario` | `[]` (empty) | Cannot verify — no bonuses in source |
| `the_hollow_man` | `health: 14` | Cannot verify — no bonuses in source |

**Conclusion:** The pipeline files (`gear_named.json`, `gear_mask.json`) do not contain gameplay attribute bonuses for named items. Verification of fixedAttrs requires a different data source (e.g., in-game inspection or community wiki).

### Exotic masks — fixedAttrs check

Exotic masks in game files also have NO bonuses sections. Same limitation applies.

| DB ID | DB fixedAttrs | Note |
|---|---|---|
| `coyotes_mask` | `chc:15, chd:15, hsd:15` | Not verifiable from pipeline |
| `vile` | `chc:10, wd:15, hsd:15` | Not verifiable from pipeline |
| `catharsis` | `chc:10, chd:15, hsd:15` | Not verifiable from pipeline |
| `the_catalyst` | `chc:10, hsd:15, handling:10` | Not verifiable from pipeline |
| `tinkerer` | `chc:10, wd:10, handling:15` | Not verifiable from pipeline |
| `investor` | `chc:15, chd:15, wd:15` | Not verifiable from pipeline |

## Check 5: Wrong Brand (Mask Slot)

Brand info is not directly stored in game pipeline files (gear_named.json / gear_exotic.json). However, the visual model name in the game files can be cross-referenced against base mask model names in gear_mask.json to infer expected brand:

| DB ID | DB Brand | Visual Model (game) | Base mask model matches | Assessment |
|---|---|---|---|---|
| `nightwatcher` | `gila_guard` | `ps_gm_pal_a1` | `player_gear_mask_b_01` (Javelina Mask = Gila Guard) | CORRECT |
| `chill_out` | `gila_guard` | `ps_gm_FROST_a1` | Frost seasonal model — no base mask with this model | UNVERIFIABLE from pipeline |
| `visionario` | `legatus_s_p_a` | `ps_gm_wyv_a1` | `player_gear_mask_d1_01` (Bauta Mask = Wyvern Wear base) | Wyvern model → Legatus is plausible (Legatus uses wyv visual models) — likely CORRECT |
| `the_hollow_man` | `yaahl_gear` | `ps_gm_yaa_a1` | `player_gear_mask_dz_01` (Cascades Mask = Yaahl Gear) | CORRECT |
| `punch_drunk` | `douglas_harding` | `ps_gm_dou_c1` | `player_gear_mask_i_01` (Lomond Breather = Douglas & Harding) | CORRECT |

3 out of 5 named mask brands confirmed correct from pipeline. `chill_out` is unverifiable (unique seasonal model). `visionario` brand assignment is consistent with game conventions.

---

## Additional Issues Found (Not Mask Slot — for Reference)

### Duplicate item IDs (different DB entries for same game item)

| Issue | IDs | Slot | Impact |
|---|---|---|---|
| Duplicate Centurion's Scabbard | `centurion_scabbard` (empty fixedAttrs) + `centurions_scabbard` (full fixedAttrs) | holster | One entry has no stats — calculator shows wrong values |
| Duplicate Birdie's Quick Fix Pack | `birdie_s_quick_fix_pack` (empty fixedAttrs, `core:skill_tier`) + `birdies_quick_fix_pack` (full fixedAttrs, `core:armor`) | backpack | Conflicting core stat and missing attrs in one entry |
| Duplicate Pícaro's Holster | `picaros_holster` (has brand + fixedAttrs) + `picaro_s_holster` (no brand, no fixedAttrs) | holster | One entry incomplete |

### Wrong exotic classification (non-mask)

| DB ID | DB Slot | DB Flag | Correct Classification |
|---|---|---|---|
| `contractor_s_gloves` | gloves | `isExotic: true` | Named (game: `myIsNamed: true`, NOT `myIsExotic`) |
| `fox_s_prayer` | kneepads | `isExotic: true` | Named (game: `myIsNamed: true`, NOT `myIsExotic`) |

---

## Visionario Anomaly

In `gear_named.json`, `player_gear_mask_d1_01_named` (Visionario) is missing the `myIsNamed: true` attribute that all other named items carry. However, it appears in both `gear_named.json` AND `gear_mask.json` with the `_named` suffix, and has a tooltip, confirming it is a named item. The missing flag appears to be a data quirk in the pipeline export.

---

## Recommendations

1. **Fix `contractor_s_gloves` and `fox_s_prayer`**: Remove `isExotic: true` — these are named items.
2. **Fix duplicate holster entries**: Merge `centurion_scabbard` → `centurions_scabbard` (keep the one with stats), same for `picaro_s_holster` → `picaros_holster`.
3. **Fix duplicate backpack entry**: `birdie_s_quick_fix_pack` (incomplete) should be removed or merged into `birdies_quick_fix_pack`.
4. **fixedAttrs for named masks**: Cannot be verified from pipeline files — requires in-game inspection or wiki cross-reference for `punch_drunk` (hsd:20) and `the_hollow_man` (health:14).
