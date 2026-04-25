# AUDIT: KNEEPADS — Division 2 Gear Data Quality

**Date:** 2026-04-25  
**Slot:** KNEEPADS only  
**Game truth:** `gear_named.json` + `gear_exotic.json` + `gear_kneepads.json`  
**Our DB:** `named-gear.json`

---

## SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 1 | Wrong classification (named vs exotic) |
| 🟠 ORPHAN | 1 | DB entry has no game-truth counterpart |
| 🟡 UNVERIFIABLE | 4 | Stats not in source JSONs, need in-game check |
| ✅ OK | 9 | Correctly classified, present, no issues |

---

## 🔴 CRITICAL — Classification Mismatch

### `fox_s_prayer` / "Fox's Prayer" / "Окопная молитва"

**DB says:** `isExotic: true` with `activeBonuses` and `exoticMechanic`  
**Game truth says:** `myIsNamed: true` (NOT exotic)

**Evidence:**
- `gear_named.json` → `player_gear_kneepads_f_named_01` → `"myIsNamed": true`
- `gear_kneepads.json` → same entry → `"myIsNamed": true`, NO `myIsExotic`
- `gear_exotic.json` → **NO ENTRY** for Fox's Prayer anywhere

**Current DB entry (WRONG):**
```json
{
  "id": "fox_s_prayer",
  "slot": "kneepads",
  "brand": "overlord_armaments",
  "core": "wd",
  "fixedAttrs": [{ "stat": "ooc", "value": 8 }],
  "isExotic": true,
  "activeBonuses": [{ "stat": "wd", "value": 8, "amp": true }],
  "exoticMechanic": "+8% amplified damage while out of cover."
}
```

**What needs to happen:**
- Remove `isExotic: true`
- Remove `activeBonuses`
- Remove `exoticMechanic`
- Brand `overlord_armaments` is consistent with visual model `pf_k_ove_b1` (same as Dingson Protection Pads → Overlord) — **keep**
- `fixedAttrs: [{stat: ooc, value: 8}]` — may be the named item's fixed talent; needs in-game verification but the field itself is not inherently wrong
- `core: wd` — needs in-game verification

**After fix, entry should look like:**
```json
{
  "id": "fox_s_prayer",
  "slot": "kneepads",
  "brand": "overlord_armaments",
  "core": "wd",
  "fixedAttrs": [{ "stat": "ooc", "value": 8 }]
}
```
(verify fixedAttrs in-game — ooc bonus may be a named talent, not an exotic mechanic)

---

## 🟠 ORPHAN — Entry Has No Game-Truth Counterpart

### `acosta_kneepads`

**Problem:** This ID does not correspond to any item in `gear_named.json`, `gear_exotic.json`, or `gear_kneepads.json`.  
The real exotic is `acostas_kneepads` (with `'s`).

**Current orphan entry:**
```json
{
  "id": "acosta_kneepads",
  "slot": "kneepads",
  "core": "wd",
  "fixedAttrs": []
}
```
— No brand, no `isExotic`, wrong core (wd vs skill_tier), empty fixedAttrs.

**Correct entry (already exists):**
```json
{
  "id": "acostas_kneepads",
  "slot": "kneepads",
  "core": "skill_tier",
  "fixedAttrs": [
    { "stat": "chc", "value": 10 },
    { "stat": "chd", "value": 15 },
    { "stat": "handling", "value": 10 }
  ],
  "isExotic": true,
  "exoticMechanic": "Group skill bonus + healing (utility)."
}
```

**Action:** Delete `acosta_kneepads`. Keep `acostas_kneepads`.

---

## 🟡 UNVERIFIABLE — Source JSONs Contain No Raw Stats

These entries cannot be verified from the pipeline JSON files alone (game truth only has visual/drop data, not stats). Require in-game or wiki verification.

### `grease` — fixedAttrs + core + brand

| Field | DB value | Verifiable? |
|-------|----------|-------------|
| brand | `shiny_monkey` | ⚠️ Visual model `pf_k_gol_a1` — no brand→visual map in source files |
| core | `skill_tier` | ⚠️ Needs in-game check |
| fixedAttrs | `[{stat: status_effects, value: 16}]` | ⚠️ No stat data in source JSONs |

### `emperor_s_guard` — fixedAttrs

| Field | DB value | Verifiable? |
|-------|----------|-------------|
| brand | `murakami_industries` | ✅ Visual `pf_k_mur_a1` matches Murakami (Suneate Knee Braces = same model, same brand) |
| core | `skill_tier` | ⚠️ Needs in-game check |
| fixedAttrs | `[{stat: armor_regen, value: 1}]` | ⚠️ No stat data in source JSONs |

### `cloak` — brand

| Field | DB value | Verifiable? |
|-------|----------|-------------|
| brand | `imminence_armaments` | ⚠️ Visual `pf_k_gru_a1` — `gru` prefix not definitively mapped to Imminence from source files |
| core | `wd` | ⚠️ Needs in-game check |
| fixedAttrs | `[]` | ✅ Empty is safe |

---

## ✅ OK — Correctly Classified

### Named Kneepads (all present, all `myIsNamed: true` in game truth)

| DB id | Name | Brand | Core | Brand verified? |
|-------|------|-------|------|-----------------|
| `grease` | Grease / Смазка | shiny_monkey | skill_tier | ⚠️ see above |
| `cloak` | Cloak / Маскировщики | imminence_armaments | wd | ⚠️ see above |
| `turmoil` | Turmoil / Сумятица | ceska_vyroba_s_r_o | wd | ✅ visual `ces_a1` = Ceska |
| `emperor_s_guard` | Emperor's Guard / Охрана императора | murakami_industries | skill_tier | ✅ visual `mur_a1` = Murakami |
| `snow_machine` | Snow Machine / Снежная машина | electrique | wd | ✅ visual `pal_a1` = Electrique |

### Exotic Kneepads (all present, all `myIsExotic: true` in game truth)

| DB id | Name | isExotic | fixedAttrs | Status |
|-------|------|----------|------------|--------|
| `sawyers_kneepads` | Sawyer's Kneepads | ✅ | chc/chd/handling | ✅ |
| `ninjabike_messenger_kneepads` | NinjaBike Messenger Kneepads | ✅ | chc/chd/handling | ✅ |
| `acostas_kneepads` | Acosta's Kneepads | ✅ | chc/chd/handling | ✅ |
| `blacklisters` | Blacklisters | ✅ | chc/hsd/wd | ✅ |

---

## COMPLETENESS CHECK

### Named (game truth → DB)

| Game truth ID | Name (EN) | In DB? |
|---------------|-----------|--------|
| `player_gear_kneepads_e1_01_named` | Grease | ✅ `grease` |
| `player_gear_kneepads_f1_01_named` | Cloak | ✅ `cloak` |
| `player_gear_kneepads_f_named_01` | Fox's Prayer | ✅ `fox_s_prayer` (wrong class) |
| `player_gear_kneepads_l_01_named` | Turmoil | ✅ `turmoil` |
| `player_gear_kneepads_s_named_01` | Emperor's Guard | ✅ `emperor_s_guard` |
| `player_gear_kneepads_z_01_named` | Snow Machine | ✅ `snow_machine` |

**Missing named items: NONE**

### Exotic (game truth → DB)

| Game truth ID | Name (EN) | In DB? |
|---------------|-----------|--------|
| `player_gear_kneepads_exotic_01` | Sawyer's Kneepads | ✅ `sawyers_kneepads` |
| `player_gear_kneepads_exotic_02` | NinjaBike Messenger Kneepads | ✅ `ninjabike_messenger_kneepads` |
| `player_gear_kneepads_exotic_03` | Acosta's Kneepads | ✅ `acostas_kneepads` |
| `player_gear_kneepads_exotic_04` | Blacklisters | ✅ `blacklisters` |

_Note: `player_gear_kneepads_exotic_02_aprilfools` (BikeNinja, `myIsEquippableFlag: false`) excluded — not a real loot item._

**Missing exotic items: NONE**

---

## ACTION PLAN

| Priority | Item | Action |
|----------|------|--------|
| 🔴 1 | `fox_s_prayer` | Remove `isExotic`, `activeBonuses`, `exoticMechanic`. Verify `fixedAttrs` ooc:8 in-game. |
| 🟠 2 | `acosta_kneepads` | Delete entire entry (orphan). |
| 🟡 3 | `grease` | Verify brand, core, fixedAttrs in-game. |
| 🟡 4 | `emperor_s_guard` | Verify core, fixedAttrs in-game. |
| 🟡 5 | `cloak` | Verify brand `imminence_armaments` in-game. |
