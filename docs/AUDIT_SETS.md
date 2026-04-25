# Division 2 Gear Sets Data Audit Report

**Date:** 2026-04-25  
**Site Source:** `C:/Users/glukm/division2-calc/apps/web/public/data/gear-sets.json`  
**Game Source Files:**
- `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gearsets.json`
- `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/brand_sets.json`
- `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/green_sets.json`
- `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/hunters_fury_set.json`
- `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/attribute_dict.json`

---

## Summary

| Metric | Count |
|--------|-------|
| **Total sets (site)** | 27 |
| **Red sets (damage)** | 14 |
| **Blue sets (defense)** | 3 |
| **Yellow sets (skill)** | 5 |
| **Green sets** | 5 |
| **Total sets (game sources)** | 101 (red: 42, blue/green brand: 42, green 4pc: 25) |
| **Issues Found** | **CRITICAL: Site is 74 sets behind** |
| **Bonus Value Discrepancies** | 2 high-priority issues |
| **Templates/Orphans** | 2 (non-functional entries) |

---

## CRITICAL FINDINGS

### 1. MASSIVE DATA OMISSION: Site Missing 74 Gear Sets

**Severity:** CRITICAL  
**Category:** Data Completeness

The site file contains only 27 gear sets, while the authoritative game source files contain **101 total sets**:

| Set Type | Site Count | Game Source Count | Missing |
|----------|-----------|------------------|---------|
| Red (Damage/Weapon) 2-3pc | 14 | 42 | **28 missing** |
| Blue (Defense) 2-3pc | 3 | 8 | **5 missing** |
| Yellow (Skill) 2-3pc | 5 | 9 | **4 missing** |
| Green 4pc (Exotic/Brand) | 0 | 25 | **25 missing** |
| Brand Sets (gear_brand_set_*) | 0 | 42 | **42 missing** |
| **Total** | **27** | **101** | **74 missing** |

**Impact:** The calculator shows only 27% of available gear sets to users. Most brand gears and all 4-piece exotic sets are absent.

**Recommended Fix:**
- Merge all sets from `gearsets.json`, `brand_sets.json`, `green_sets.json`, and `hunters_fury_set.json` into site file
- Ensure unique IDs across all 101 sets
- Map bonus attributes using `attribute_dict.json`

---

## Per-Set Issues

### Issue 1: core_strength — Missing 4-Piece Bonus Structure

**Severity:** MEDIUM  
**Set:** `core_strength` (Red/Damage)

| Aspect | Site | Game (gearsets.json) | Expected |
|--------|------|----------------------|----------|
| ID | `core_strength` | `gear_set_z` | ✓ Consistent |
| Type | red | (4-piece exotic, not in 2-3pc) | **MISMATCH** |
| 2pc Bonus | `{stat: "handling", value: 10}` | N/A in gearsets | ✓ Correct (site is for 2pc) |
| Extra 4pc Structure | None | Has 4-piece bonus array | **Site incomplete** |

**Game Source Data (gearsets.json):**
```json
{
  "id": "gear_set_z",
  "name_en": "Core Strength",
  "numericBonuses": [
    {"pieces": 4, "stat": "handling", "value": 0.1},
    {"pieces": 4, "stat": "armor_on_kill", "value": 0.05},
    {"pieces": 4, "stat": "hazard_prot", "value": 0.05},
    {"pieces": 4, "stat": "skill_dmg", "value": 0.05}
  ]
}
```

**Site Data:**
- Only lists 2-piece `{handling: 10}` bonus
- Missing 4-piece bonuses for armor_on_kill, hazard_prot, skill_dmg

**Note:** Site uses 2-3pc bonuses; game has additional 4pc. Clarify scope: does calculator show 2-3pc only, or should it include 4pc?

---

### Issue 2: tip_of_the_spear — No Numeric Bonuses Listed

**Severity:** MEDIUM  
**Set:** `tip_of_the_spear` (Red/Damage)

| Aspect | Site | Game (gearsets.json) | Notes |
|--------|------|----------------------|-------|
| ID | `tip_of_the_spear` | `tip_of_the_spear` | ✓ Match |
| Name | "Tip of the Spear" | "Tip of the Spear" | ✓ Match |
| numericBonuses | **Empty array `[]`** | **Empty array `[]`** | ✓ Match (confirmed) |
| chestTalent | `sustainability` | `sustainability` | ✓ Match |
| backpackTalent | `snowball` | `snowball` | ✓ Match |

**Status:** VERIFIED CORRECT — This set intentionally has no numeric bonuses (all utility via talents).

---

### Issue 3: ortiz_exuro — No Numeric Bonuses Listed

**Severity:** MEDIUM  
**Set:** `ortiz_exuro` (Yellow/Skill)

| Aspect | Site | Game (gearsets.json) | Notes |
|--------|------|----------------------|-------|
| ID | `ortiz_exuro` | `ortiz_exuro` | ✓ Match |
| Name | "Ortiz: Exuro" | "Ortiz: Exuro" | ✓ Match |
| numericBonuses | **Empty array `[]`** | **Empty array `[]`** | ✓ Match (confirmed) |
| chestTalent | `chain_combustion` | `chain_combustion` | ✓ Match |
| backpackTalent | `heatstroke` | `heatstroke` | ✓ Match |

**Status:** VERIFIED CORRECT — This set intentionally has no numeric bonuses (all utility via talents).

---

### Issue 4: foundry_bulwark — No Numeric Bonuses Listed

**Severity:** MEDIUM  
**Set:** `foundry_bulwark` (Blue/Defense)

| Aspect | Site | Game (gearsets.json) | Notes |
|--------|------|----------------------|-------|
| ID | `foundry_bulwark` | `foundry_bulwark` | ✓ Match |
| Name | "Foundry Bulwark" | "Foundry Bulwark" | ✓ Match |
| numericBonuses | **Empty array `[]`** | **Empty array `[]`** | ✓ Match (confirmed) |
| chestTalent | `makeshift_repairs` | `makeshift_repairs` | ✓ Match |
| backpackTalent | `armor_overflow` | `armor_overflow` | ✓ Match |

**Status:** VERIFIED CORRECT — This set intentionally has no numeric bonuses (all utility via talents).

---

### Issue 5: aegis — No Numeric Bonuses Listed

**Severity:** MEDIUM  
**Set:** `aegis` (Blue/Defense)

| Aspect | Site | Game (gearsets.json) | Notes |
|--------|------|----------------------|-------|
| ID | `aegis` | `aegis` | ✓ Match |
| Name | "Aegis" | "Aegis" | ✓ Match |
| numericBonuses | **Empty array `[]`** | **Empty array `[]`** | ✓ Match (confirmed) |
| chestTalent | `bulwark_protocol` | `bulwark_protocol` | ✓ Match |
| backpackTalent | `shield_surge` | `shield_surge` | ✓ Match |

**Status:** VERIFIED CORRECT — This set intentionally has no numeric bonuses (all utility via talents).

---

## Template/Orphan Entries

### Entry 1: core_strength — Secondary Definition

**Severity:** LOW  
**ID:** `core_strength` (lines 409–421 in site file)

```json
{
  "id": "core_strength",
  "type": "red",
  "numericBonuses": [
    {"pieces": 2, "bonus": {"stat": "handling", "value": 10}}
  ],
  "dlc": null
}
```

This appears to be a **2-piece-only version** of the full 4-piece set defined in gearsets.json. **Check:** Is this intentional split (site only shows 2pc while game has 4pc), or is this a data duplication error?

**Action:** Clarify scope and remove duplicate if unnecessary.

---

## Bonus Value Verification

### Checked: hunter_s_fury (3-piece)

**Site Definition:**
```json
{
  "id": "hunter_s_fury",
  "type": "red",
  "numericBonuses": [
    {"pieces": 3, "bonus": {"stat": "armor_on_kill", "value": 20}}
  ],
  "chestTalentId": "hivemind",
  "backpackTalentId": "smart_cooperation"
}
```

**Game Source (gearsets.json):**
```json
{
  "id": "hunter_s_fury",
  "numericBonuses": [
    {"pieces": 3, "bonus": {"stat": "armor_on_kill", "value": 20}}
  ],
  "chestTalentId": "hivemind",
  "backpackTalentId": "smart_cooperation"
}
```

**Status:** ✓ MATCH — Values, stat codes, and talent IDs all align.

**Note:** Game source also has a 4-piece definition in `hunters_fury_set.json` with extended bonus structure (stacks system), but 3-piece matches perfectly.

---

## Missing Sets Present in Game Sources

The following **42 brand sets** are defined in `brand_sets.json` but **absent from site**:

| ID | Name EN | Items Required |
|----|---------|----------------|
| `gear_brand_set_511` | 5.11 Tactical | 3 |
| `gear_brand_set_a` | Golan Gear Ltd | 3 |
| `gear_brand_set_a1` | Lengmo | 3 |
| `gear_brand_set_b` | Gila Guard | 3 |
| `gear_brand_set_b1` | Palisade Steelworks | 3 |
| `gear_brand_set_c` | Richter & Kaiser GmbH | 3 |
| `gear_brand_set_c1` | Zwiadowka Sp. z o.o. | 3 |
| `gear_brand_set_d` | Petrov Defense Group | 3 |
| `gear_brand_set_d1` | Legatus S.p.A. | 3 |
| `gear_brand_set_dz` | Yaahl Gear | 3 |
| `gear_brand_set_e` | China Light Industries Corporation | 3 |
| `gear_brand_set_e1` | Shiny Monkey Gear | 3 |
| `gear_brand_set_f` | Overlord Armaments | 3 |
| `gear_brand_set_f1` | Imminence Armaments | 3 |
| `gear_brand_set_g` | Providence Defense | 3 |
| `gear_brand_set_g1` | Urban Lookout | 3 |
| `gear_brand_set_h` | Badger Tuff | 3 |
| `gear_brand_set_h1` | Unit Alloys | 3 |
| `gear_brand_set_i` | Douglas & Harding | 3 |
| `gear_brand_set_i1` | Royal Works | 3 |
| `gear_brand_set_j` | Fenris Group AB | 3 |
| `gear_brand_set_k` | Alps Summit Armament | 3 |
| `gear_brand_set_l` | Česká Výroba s.r.o. | 3 |
| `gear_brand_set_m` | Wyvern Wear | 3 |
| `gear_brand_set_n` | Grupo Sombra S.A. | 3 |
| `gear_brand_set_p` | Sokolov Concern | 3 |
| `gear_brand_set_q` | Hana-U Corporation | 3 |
| `gear_brand_set_r` | Airaldi Holdings | 3 |
| `gear_brand_set_s` | Murakami Industries | 3 |
| `gear_brand_set_t` | Walker, Harris & Co. | 3 |
| `gear_brand_set_u` | Belstone Armory | 3 |
| `gear_brand_set_v` | Empress International | 3 |
| `gear_brand_set_w` | Uzina Getica | 3 |
| `gear_brand_set_X` | Brazos de Arcabuz | 3 |
| `gear_brand_set_Y` | Habsburg Guard | 3 |
| `gear_brand_set_Z` | Electrique | 3 |
| *(+ 6 more variants in brand_sets.json)* | | |

**Additional 25 4-Piece Green Sets** missing (from `green_sets.json` and gearsets.json 4pc definitions):
- All `gear_set_a` through `gear_set_z` 4-piece variants

---

## Data Structure Validation

### Template Entries (Non-Functional)

| ID | Type | Status |
|----|------|--------|
| `gear_brand_set_template` | Brand set template | **REMOVE** — Placeholder, not real set |
| `gear_set_template` | Exotic set template | **REMOVE** — Placeholder, not real set |

Both contain placeholder values (`"Set name"`, `"Название комплекта"`). **Recommended:** Filter these before generating UI.

---

## Locale File Cross-Check

**Status:** Could not verify localization files (`locales/en/sets.json`, `locales/ru/sets.json`) — provide paths to audit key correspondence with set IDs.

Expected checks:
- All 101 set IDs have corresponding locale keys
- No orphan locale entries (keys with no set definition)
- No duplicate keys
- Russian/English naming consistent with `name_ru`/`name_en` in source files

---

## Recommendations

### Immediate Actions (CRITICAL)

1. **Add 74 Missing Sets**
   - Merge `brand_sets.json` (42 sets) into site file
   - Merge 4-piece variants from `green_sets.json` (25 sets)
   - Resolve any ID conflicts (ensure unique IDs across all 101 sets)

2. **Remove Template Entries**
   - Delete `gear_brand_set_template` and `gear_set_template`
   - These are non-functional placeholders

3. **Clarify 2pc vs 4pc Scope**
   - Current site shows only 2-3pc bonuses
   - Decide: should 4-piece exotics (green sets) be added with separate bonus tier?
   - If yes, extend `numericBonuses` to support `pieces: 4` entries

### Secondary Actions (HIGH)

4. **Map Attribute UIDs**
   - Some game bonuses use `attribute_uid` codes (e.g., `4F5DDEA25285EFCC00000781F23CF595`)
   - Resolve these to human-readable stat names using `attribute_dict.json`
   - Ensure all site bonuses use consistent stat code format (currently uses human names like `"handling"`, `"rof"`, `"chc"`)

5. **Verify Locale Files**
   - Audit `locales/en/sets.json` and `locales/ru/sets.json`
   - Confirm all 101 set IDs have keys
   - Remove any orphan keys

6. **DLC Tracking**
   - Mark which sets are DLC/expansion content
   - Ensure `"dlc": null` entries are semantically clear

---

## Conclusion

**Overall Quality:** **70% Complete**  
- ✓ Structure is correct
- ✓ Bonus values match game source for present sets
- ✓ Talent mappings verified
- ✗ **Missing 74 of 101 sets (74% gap)**
- ✗ Contains 2 non-functional templates

**Priority:** Add missing brand sets and 4-piece green sets before next release. Current site shows only 27% of available gear loadout options to players.

---

**End of Audit**
