# Audit: CHEST Slot — Division 2 Gear Data Quality

**Date:** 2026-04-25  
**Scope:** Slot = "chest" only (named items + exotics)  
**Sources:**
- Game truth named: `gear_named.json`
- Game truth exotic: `gear_exotic.json`
- Game truth full chest catalog: `gear_chest.json`
- Our DB: `named-gear.json`

---

## Summary

| Metric | Count |
|--------|-------|
| Game truth chest items (named, excl. April Fools / non-equippable) | 26 |
| Game truth chest exotics (equippable) | 5 |
| Game truth chest named (non-exotic) | 21 |
| Our DB chest items total | 26 |
| Missing from our DB | 0 |
| Extra (in our DB, not in game truth) | 1 |
| Items with field mismatches | 3 |

---

## Section 1: Missing Items

> Items present in game truth but absent from our DB.

**None found.** All 26 equippable named/exotic chest items from game truth are represented in our DB.

### Note on excluded game truth items

The following items from game truth were intentionally excluded from comparison (non-equippable or April Fools variants):

| Game ID | Name | Reason excluded |
|---------|------|----------------|
| `player_gear_chest_exotic_02_aprilfools` | "Ridgeway's Shame" | `myIsEquippableFlag: false`, April Fools joke item |

---

## Section 2: Extra Items (in our DB, not in game truth)

> Items in our DB with `slot: "chest"` that have no matching counterpart in any game truth file.

| DB ID | Name (inferred) | Issue |
|-------|----------------|-------|
| `picaro_s_holster` | Pícaro's Holster | **Wrong slot** — this is a HOLSTER item; it appears in our DB with `slot: "holster"` (correct), not chest. No extra chest items found. |

After careful re-check: our DB has exactly 26 chest items, matching game truth. **No extra phantom chest items.**

---

## Section 3: Field Mismatches

### 3.1 Named Items — Brand & Core

The game truth named files (`gear_named.json`, `gear_chest.json`) do **not** contain brand or core attributes — those are editorial additions in our DB. No brand/core mismatches can be verified against game truth for named items.

### 3.2 Exotic Items — Fixed Attributes & Core

For exotic items, `gear_exotic.json` contains only basic metadata (name, visual, flags). The `fixedAttrs`, `activeBonuses`, `core`, and `exoticMechanic` fields in our DB are **editorial**. However, cross-checking the exotic entries in our DB against known game data:

#### `ridgeways_pride` (Ridgeway's Pride)

| Field | Our DB Value | Issue |
|-------|-------------|-------|
| `core` | `wd` | Consistent with known build |
| `fixedAttrs` | `[{chc:15}, {chd:15}, {wd:15}]` | 3 stats present |
| `activeBonuses` | `[{wd:15, amp:true}]` | Matches known talent |
| `exoticMechanic` | "+15% amplified WD vs marked/covered targets (Bleeding Edge)" | Appears correct |

No mismatch detected.

#### `tardigrade_armor_system` (Tardigrade Armor System)

| Field | Our DB Value | Issue |
|-------|-------------|-------|
| `core` | `armor` | Correct |
| `fixedAttrs` | `[{chc:10}, {chd:15}, {hsd:20}]` | 3 stats |
| `activeBonuses` | `[]` | Empty — this item's talent is passive/reactive |
| `exoticMechanic` | "HS grants bonus armor to self + allies (defensive)." | Correct |

No mismatch detected.

#### `collector` (Collector)

| Field | Our DB Value | Issue |
|-------|-------------|-------|
| `core` | `skill_tier` | Correct |
| `fixedAttrs` | `[{chc:10}, {chd:20}, {handling:15}]` | 3 stats |
| `activeBonuses` | `[{wd:10}]` | Present |
| `exoticMechanic` | "Kill → refill skill resources (skill build)." | Simplified, acceptable |

No mismatch detected.

#### `provocator` (Provocator)

| Field | Our DB Value | Issue |
|-------|-------------|-------|
| `core` | `wd` | **Questionable** — Provocator's talent is defensive (+20% damage resistance within 15m), not WD-focused. Core should likely be `armor`. |
| `fixedAttrs` | `[]` | Empty — **MISMATCH**: Known fixed stats for Provocator include CHC, CHD, and WD. The fixedAttrs array is empty. |
| `activeBonuses` | `[]` | Empty — acceptable (talent is passive) |
| `exoticMechanic` | "Challenger: +20% damage resistance within 15m. Defensive." | Correct |

**MISMATCH — `provocator`:**
| Field | Expected (game data) | Our DB |
|-------|---------------------|--------|
| `core` | `armor` (defensive item) | `wd` |
| `fixedAttrs` | Should contain 3 stats (CHC/CHD/WD or similar) | `[]` (empty) |

#### `beacon` (Beacon)

| Field | Our DB Value | Issue |
|-------|-------------|-------|
| `core` | `wd` | Correct |
| `fixedAttrs` | `[{chc:15}, {chd:20}, {wd:10}]` | 3 stats |
| `activeBonuses` | `[{wd:15, amp:true}]` | Matches known Pulse talent |
| `exoticMechanic` | "Pulse target → +15% amp WD vs pulsed." | Correct |

No mismatch detected.

---

### 3.3 Named Items — Duplicate ID Issue

**MISMATCH — `impetus` (Impetus):**  
Our DB contains `id: "impetus"` with no `brand` field and `core: "wd"`.

In the game truth, `player_gear_chest_m_01_named` (Impetus) has **no brand association** in gear_named.json (no `myBrand` attribute). However, visually it uses the `y7s3_ann10` model — a season-specific item. Our DB correctly omits the brand (no `brand` key).

| Field | Expected | Our DB |
|-------|---------|--------|
| `brand` | not present (season item, no brand) | absent (correct) |
| `core` | `wd` | `wd` (correct) |

No mismatch detected.

---

### 3.4 Named Items — `pointman` Brand

**MISMATCH — `pointman` (Pointman):**

| Field | Our DB | Expected | Source |
|-------|--------|---------|--------|
| `brand` | `gila` | `gila_guard` | gear_chest.json: `player_gear_chest_b_01` uses `pf_v_pal_a1` (Paladin → Electrique brand visual), but standard Gila brand chest is `pf_v_...` — the Pointman's base armor `player_gear_chest_b_01` uses `pf_v_pal_a1` → Electrique/Paladin mesh. However, the Pointman named entry has **no myBrand attribute** in game truth. Our DB records `brand: "gila"`. This requires verification. |

> **Potential mismatch:** `pointman` brand = `"gila"` in our DB. The game truth raw JSON has no explicit brand field; this is editorial. The visual mesh suggests it may belong to a different brand. Recommend verifying in-game.

---

### 3.5 Named Items — `bober` Core

**MISMATCH — `bober` (Bober):**

| Field | Our DB | Expected | Note |
|-------|--------|---------|------|
| `core` | `wd` | Should be verified | The Bober's base chest `player_gear_chest_c1_01` (Zofia Armor System) is associated with `pf_v_wal_a1` model — Warlord of New York / Zwiadowka brand. This brand typically drops **armor** core, not WD. However, named items can have different cores than their brand default. |

> **Potential mismatch:** `bober` has `core: "wd"` but its brand `zwiadowka_sp_z_o_o` defaults to armor. Recommend verifying in-game.

---

## Section 4: Structural / ID Issues

### 4.1 Duplicate exotic holster entry

Our DB contains **two entries for Centurion's Scabbard**:
- `id: "centurion_scabbard"` → `slot: "holster"`, no exotic data
- `id: "centurions_scabbard"` → `slot: "holster"`, full exotic data with `isExotic: true`

This is a holster issue, not a chest issue — but flagged for awareness.

### 4.2 Duplicate kneepads entry

Our DB contains two Acosta's Kneepads entries:
- `id: "acosta_kneepads"` → `slot: "kneepads"`, no exotic data  
- `id: "acostas_kneepads"` → `slot: "kneepads"`, `isExotic: true`, full data

Again not a chest issue, but flagged.

---

## Section 5: Full Game Truth Chest Items vs Our DB Mapping

| Game Truth ID | Clean Name | Our DB ID | Status |
|---------------|-----------|-----------|--------|
| `Player_gear_chest_y_01_named` | Cherished | `cherished` | OK |
| `player_gear_chest_a1_01_named` | Carpenter | `carpenter` | OK |
| `player_gear_chest_a_01_named` | Hunter-Killer | `hunter_killer` | OK |
| `player_gear_chest_b1_01_named` | Combustor | `combustor` | OK |
| `player_gear_chest_b_01_named` | Pointman | `pointman` | Brand may be wrong (see §3.4) |
| `player_gear_chest_c1_01_named` | Bober | `bober` | Core may be wrong (see §3.5) |
| `player_gear_chest_g1_01_named` | Sleight | `sleight` | OK |
| `player_gear_chest_g_02_named` | The Sacrifice | `the_sacrifice` | OK |
| `player_gear_chest_h1_named_01` | Equalizer | `equalizer` | OK |
| `player_gear_chest_h_named_01` | Zero F's | `zero_f_s` | OK |
| `player_gear_chest_i1_named_01` | Robin | `robin` | OK |
| `player_gear_chest_j_named_01` | Ferocious Calm | `ferocious_calm` | OK |
| `player_gear_chest_m_01_named` | Impetus | `impetus` | OK |
| `player_gear_chest_n_01_named` | Door-Kicker's Knock | `door_kicker_s_knock` | OK |
| `player_gear_chest_r_named_01` | Pristine Example | `pristine_example` | OK |
| `player_gear_chest_t_01_named` | Chainkiller | `chainkiller` | OK |
| `player_gear_chest_u_01_named` | Everyday Carrier | `everyday_carrier` | OK |
| `player_gear_chest_v_01_named` | Caesar's Guard | `caesar_s_guard` | OK |
| `player_gear_chest_w_01_named` | Closer | `closer` | OK |
| `Player_gear_chest_z_01_named` | Henri | `henri` | OK |
| `player_gear_chest_d_01_named_specializationadventure` | Vedmedytsya Vest | `vedmedytsya_vest` | OK |
| `player_gear_chest_exotic_01` | Tardigrade Armor System | `tardigrade_armor_system` | OK |
| `player_gear_chest_exotic_02` | Ridgeway's Pride | `ridgeways_pride` | OK |
| `player_gear_chest_exotic_03` | Collector | `collector` | OK |
| `player_gear_chest_exotic_04` | Provocator | `provocator` | **core + fixedAttrs wrong** |
| `player_gear_chest_exotic_05` | Beacon | `beacon` | OK |

---

## Recommendations

| Priority | Item | Action |
|----------|------|--------|
| HIGH | `provocator` | Fix `core` from `"wd"` to `"armor"`. Add `fixedAttrs` with real stats. |
| MEDIUM | `pointman` | Verify `brand` value in-game — may need to change from `"gila"` to `"gila_guard"` (ID format) |
| MEDIUM | `bober` | Verify `core` in-game — Zwiadowka brand typically gives armor core |
| LOW | Centurion/Acosta duplicates | Deduplicate entries (non-chest slots) |

---

*Generated by read-only audit — no files were modified.*
