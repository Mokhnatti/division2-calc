# AUDIT: BACKPACK slot — named-gear.json vs game truth

**Date:** 2026-04-25  
**Sources:**
- Game truth named:   `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_named.json`
- Game truth exotic:  `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_exotic.json`
- Game truth back DB: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_back.json`
- Our DB:             `C:/Users/glukm/division2-calc/apps/web/public/data/named-gear.json`

---

## 1. Coverage Summary

### Named backpacks (gear_named.json → myIsNamed: true, id contains "back")
| Game item ID | Name | Present in DB | DB id |
|---|---|---|---|
| player_gear_back_a1_01_named | Backbone | ✅ | backbone |
| player_gear_back_a_01_named | Anarchist's Cookbook | ✅ | anarchist_s_cookbook |
| player_gear_back_b1_01_named | Proxy | ✅ | proxy |
| player_gear_back_d1_01_named | Vigil | ✅ | vigil |
| player_gear_back_e1_01_named | Axel | ✅ | axel |
| player_gear_back_e_named_01 | Strategic Alignment | ✅ | strategic_alignment |
| player_gear_back_f1_01_named | Cap'n | ✅ | cap_n |
| player_gear_back_g_named_02 | The Gift | ✅ | the_gift |
| player_gear_back_i1_named_01 | Bulldog | ✅ | bulldog |
| player_gear_back_k_named_01 | Percussive Maintenance | ✅ | percussive_maintenance |
| player_gear_back_l_01_named | Devil's Due | ✅ | devil_s_due |
| player_gear_back_n_01_named | Festive Delivery | ✅ | festive_delivery |
| player_gear_back_q_01_named | Force Multiplier | ✅ | force_multiplier |
| player_gear_back_t_01_named | Matador | ✅ | matador |
| player_gear_back_u_01_named | Liquid Engineer | ✅ | liquid_engineer |
| player_gear_back_v_01_named | Battery Pack | ✅ | battery_pack |
| player_gear_back_w_01_named | The Setup | ✅ | the_setup |
| player_gear_back_x_01_named | Hermano | ✅ | hermano |
| player_gear_back_y_01_named | The Courier | ✅ | the_courier |
| player_gear_back_z_01_named | Lavoisier | ✅ | lavoisier |

**Result: 20/20 named backpacks present. No missing named items.**

### Exotic backpacks (gear_exotic.json → myIsExotic: true, id contains "back")
| Game item ID | Name | myIsEquippableFlag | Present in DB | DB id | isExotic in DB |
|---|---|---|---|---|---|
| player_gear_back_exotic_01 | Acosta's Go-Bag | (true) | ✅ | acostas_go_bag | ✅ |
| player_gear_back_exotic_02 | Memento | (true) | ✅ | memento | ✅ |
| player_gear_back_exotic_02_aprilfools | Momento (April Fools) | **false** | ✅ excluded | — | — |
| player_gear_back_exotic_04 | Birdie's Quick Fix Pack | (true) | ⚠️ see §3 | see §3 | ⚠️ see §3 |
| player_gear_back_exotic_05 | Harrier Pride | (true) | ✅ | harrier_pride | ✅ |
| Player_gear_back_exotic_ninja | NinjaBike Messenger Backpack | (true) | ✅ | ninjabike_messenger_backpack | ❌ missing |

**Result: 5/5 equippable exotic backpacks present, but 2 have issues (NinjaBike, Birdie's).**

---

## 2. Classification Mismatches

### 2.1 — ninjabike_messenger_backpack: missing `isExotic: true`

**Severity: HIGH**

Game truth (`Player_gear_back_exotic_ninja`): `myIsExotic: true`

DB entry has `exoticMechanic` and `activeBonuses` but **no** `"isExotic": true` field:
```json
{
  "id": "ninjabike_messenger_backpack",
  "slot": "backpack",
  "core": "wd",
  "fixedAttrs": [{"stat": "wd", "value": 15}, {"stat": "chc", "value": 15}, {"stat": "chd", "value": 15}],
  "activeBonuses": [],
  "exoticMechanic": "Counts as any gear-set piece (utility, no damage)."
}
```

Without `isExotic: true` this item is invisible to any exotic-based filter in the app.

**Fix:** add `"isExotic": true`.

---

## 3. Duplicate / Orphan Entries

### 3.1 — Birdie's Quick Fix Pack: two records with different IDs

**Severity: CRITICAL**

**Entry A** — orphan / ghost (no isExotic, no brand, no fixedAttrs values):
```json
{
  "id": "birdie_s_quick_fix_pack",
  "slot": "backpack",
  "core": "skill_tier",
  "fixedAttrs": []
}
```

**Entry B** — correctly classified exotic:
```json
{
  "id": "birdies_quick_fix_pack",
  "slot": "backpack",
  "core": "armor",
  "fixedAttrs": [
    {"stat": "chc", "value": 10},
    {"stat": "chd", "value": 15},
    {"stat": "hsd", "value": 10}
  ],
  "isExotic": true,
  "activeBonuses": [],
  "exoticMechanic": "+80% Revive speed (utility)."
}
```

Game truth: single item `player_gear_back_exotic_04`, `myIsExotic: true`.

**Issues:**
- Entry A has no `isExotic`, no `brand`, empty `fixedAttrs` — it's a ghost that should not exist.
- Entry B is the canonical record but has the **wrong core** (see §4).
- ID inconsistency: `birdie_s_quick_fix_pack` vs `birdies_quick_fix_pack`.

**Fix:** remove Entry A (`birdie_s_quick_fix_pack`).

---

## 4. Wrong fixedAttrs / core

### 4.1 — birdies_quick_fix_pack: core `armor` should be `skill_tier`

**Severity: MEDIUM**

| Field | Entry A (orphan) | Entry B (canonical) | Correct |
|---|---|---|---|
| core | skill_tier | **armor** | **skill_tier** |

Birdie's Quick Fix Pack mechanic is "+80% Revive speed" — support/skill-build exotic. Core should be `skill_tier`, consistent with Entry A and Acosta's Go-Bag (same support category).

**Fix:** change `birdies_quick_fix_pack.core` from `"armor"` to `"skill_tier"`.

---

## 5. Brand Verification

All 20 named backpack brands were cross-checked against gear_back.json base items and cross-slot visual code patterns.

### 5.1 — Confirmed correct
| DB id | DB brand | Evidence |
|---|---|---|
| backbone | lengmo | Base item named "Lengmo Backpack" (exact match) |
| lavoisier | electrique | Base item named "Electrique Back" (exact match) |
| the_courier | habsburg_guard | Base item named "HG Backpack" (HG = Habsburg Guard) |
| proxy | palisade_steelworks | Base item "Steelwork Backpack" ≈ Palisade Steelworks |
| percussive_maintenance | alps_summit_armament | Base "Mountain Hiking Pack", visual `alp_d1` |
| devil_s_due | ceska_vyroba_s_r_o | Base "Guerilla Backpack", visual `ces_a1` (Ceska) |
| hermano | brazos_de_arcabuz | Base "Llave Backpack"; Pícaro's Holster (same brand) uses same ARC2 visual |
| force_multiplier | hana_u_corporation | Visual `han_a1`; confirmed cross-slot |
| matador | walker_harris_co | Visual `wal_a1`; confirmed cross-slot |
| vigil | legatus_s_p_a | Visual `wyv_a1`; Visionario mask (Legatus) also uses `wyv_a1` ✓ |
| axel | shiny_monkey | Visual `gol_a1`; Grease kneepads (Shiny Monkey) same visual — set pair ✓ |
| battery_pack | empress_international | Visual `mon_a1`; Caesar's Guard chest (Empress Int'l) same visual ✓ |
| the_setup | uzina_getica | Visual `DRA_a1`; Closer chest (Uzina Getica) same visual ✓ |
| bulldog | royal_works | Visual `fen_a1`; Robin chest (Royal Works) uses `fen_d1` ✓ |

### 5.2 — Unverifiable (low confidence, not proven wrong)
| DB id | DB brand | Reason |
|---|---|---|
| anarchist_s_cookbook | golan_gear | Base "Chemar Backpack" — doesn't reference Golan; visual `gol_a1` shared with Axel (Shiny Monkey) |
| festive_delivery | grupo_sombra_s_a | Seasonal item using Christmas `CHR_a1` visual (different from base n_01 `gru_a1`); brand may be N/A for holiday-exclusive |
| cap_n | imminence_armaments | Base "Mission Pack"; shares `gru_a1` visual with Festive Delivery's base (Grupo Sombra) — ambiguous |
| liquid_engineer | belstone_armory | Base "Cavalry TAC-Pack"; no naming match to Belstone |
| strategic_alignment | china_light_industries_corporation | Y5+ seasonal drop (`myValidDropTierMin: 3.5`); no base item in gear_back.json |
| the_gift | providence_defense | Visual `pro_f1`; but `pro` prefix is NOT brand-specific (Courier/Habsburg also uses `pro_a1`) |

---

## 6. Additional Observations

### 6.1 — April Fools variant correctly excluded
`player_gear_back_exotic_02_aprilfools` ("Momento", `myIsEquippableFlag: false`) is absent from DB. ✓

### 6.2 — No exotic flag on named items
All 20 named backpacks correctly have no `isExotic` field. ✓

### 6.3 — Festive Delivery: special drop mechanics
`myValidDropLevelMin: -1.0`, `myLevelCapMin: 30.799999` — holiday-exclusive, non-standard drop. Worth a UI note if this item appears in gear browser.

---

## 7. Action Items (Priority Order)

| # | Severity | File | Action |
|---|---|---|---|
| 1 | CRITICAL | named-gear.json | **Remove** entry `birdie_s_quick_fix_pack` (orphan: no isExotic, no brand, no fixedAttrs) |
| 2 | HIGH | named-gear.json | **Add** `"isExotic": true` to `ninjabike_messenger_backpack` |
| 3 | MEDIUM | named-gear.json | **Fix** `birdies_quick_fix_pack.core`: `"armor"` → `"skill_tier"` |
| 4 | LOW | named-gear.json | Verify `anarchist_s_cookbook` brand vs wiki (golan_gear unconfirmed from game files) |
| 5 | LOW | named-gear.json | Verify `cap_n` brand — imminence_armaments vs grupo_sombra ambiguous |
| 6 | LOW | named-gear.json | Consider whether `festive_delivery` should have a `brand` or null — seasonal item |

---

## 8. Summary

| Category | Result |
|---|---|
| Named backpacks present | **20 / 20** ✅ |
| Exotic backpacks present (equippable) | **5 / 5** ✅ |
| April Fools variants excluded | ✅ |
| Classification mismatches | **1** — NinjaBike missing `isExotic: true` |
| Orphan / duplicate entries | **1** — `birdie_s_quick_fix_pack` ghost entry |
| Wrong core value | **1** — `birdies_quick_fix_pack` armor→skill_tier |
| Confirmed brand errors | **0** |
| Unverifiable brand assignments | **6** (low-confidence, not proven wrong) |
