# Audit: GLOVES slot — named-gear.json vs game truth

**Date:** 2026-04-25  
**Sources:**
- Game named: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_named.json`
- Game exotic: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_exotic.json`
- Game gloves full: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/gear_gloves.json`
- Our DB: `C:/Users/glukm/division2-calc/apps/web/public/data/named-gear.json`

---

## Inventory

### Named gloves (game source → our DB)

| Game ID | Name | myIsNamed | DB id | In DB |
|---|---|---|---|---|
| player_gear_gloves_511_named_01 | Deathgrips | ✓ | `deathgrips` | ✓ |
| player_gear_gloves_c1_01_named | Eagle's Grasp | ⚠ missing flag | `eagles_grasp` | ✓ |
| player_gear_gloves_d_named_01 | Contractor's Gloves | ✓ | `contractor_s_gloves` | ✓ **MISCLASSIFIED** |
| player_gear_gloves_p_named_01 | Firm Handshake | ✓ | `firm_handshake` | ✓ |
| player_gear_gloves_k_01_named_spec | Motherly Love | ✓ | `motherly_love` | ✓ |
| player_gear_gloves_named_ldee_01 | Hydden Gloves | — (dev item) | `hydden_gloves` | ✓ |

### Exotic gloves (game source → our DB)

| Game ID | Name | myIsExotic | DB id | In DB |
|---|---|---|---|---|
| player_gear_gloves_exotic_01 | BTSU Datagloves | ✓ | `btsu_datagloves` | ✓ |
| player_gear_gloves_exotic_02 | Rathbone's Gloves | ✓ | `rathbones_gloves` | ✓ |
| player_gear_gloves_exotic_03 | Bloody Knuckles | ✓ | `bloody_knuckles` | ✓ |
| player_gear_gloves_exotic_03_aprilfools | Burly Knuckles | ✓ (not equippable) | — | ✓ excluded |
| player_gear_gloves_exotic_04 | Rugged Gauntlets | ✓ | `rugged_gauntlets` | ✓ |
| player_gear_gloves_exotic_05 | Exodus Gloves | ✓ | `exodus_gloves` | ✓ |
| player_gear_gloves_exotic_06 | Overdogs | ✓ | `overdogs` | ✓ |

**Coverage:** 6/6 named + 6/6 exotic. No missing items. No orphans.

---

## CRITICAL — must fix

### BUG-1: `contractor_s_gloves` classified as exotic (it's NAMED)

**File:** `named-gear.json` line ~328

```json
{
  "id": "contractor_s_gloves",
  "slot": "gloves",
  "brand": "petrov",
  "core": "wd",
  "fixedAttrs": [
    { "stat": "wd",  "value": 15 },
    { "stat": "chc", "value": 10 },
    { "stat": "hsd", "value": 20 }
  ],
  "isExotic": true,               // ← WRONG
  "activeBonuses": [],            // ← WRONG (named items don't have this)
  "exoticMechanic": "+20% grenade damage, +50% radius (not regular weapons)."  // ← WRONG
}
```

**Game source:** `gear_named.json` → `player_gear_gloves_d_named_01` has `myIsNamed: true`, NOT exotic.

**What's wrong:**
- `isExotic: true` — must be removed (or set `false`/omitted)
- `activeBonuses: []` — field is for exotics only, must be removed
- `exoticMechanic` — field is for exotics only, must be removed
- `fixedAttrs` with 3 damage stats — named items have 1 talent-type fixed attr, not 3 exotic-style stats; these values appear fabricated

**Expected shape:**
```json
{
  "id": "contractor_s_gloves",
  "slot": "gloves",
  "brand": "petrov",
  "core": "wd",           // verify vs in-game brand bonus tab
  "fixedAttrs": [
    { "stat": "??", "value": ?? }  // actual named talent — verify in-game
  ]
}
```

The grenade mechanic ("+20% damage, +50% radius") is a named item talent, not an exoticMechanic — it should be encoded as a single fixedAttr entry if it maps to a stat key, or dropped to `fixedAttrs: []` pending proper stat ID.

---

## WARNING — verify manually

### WARN-1: `eagles_grasp` brand may be wrong

```json
"brand": "zwiadowka_sp_z_o_o"
```

**Evidence:**
- Game model path for Eagle's Grasp: `pm_g_wal_a1` (`_wal_` suffix)
- Base item `player_gear_gloves_c1_01` ("Lucznik Gloves") uses the same `_wal_` model
- "Lucznik" = Polish for "archer" → Zwiadowka naming convention
- BUT other confirmed Zwiadowka items (e.g. Bober chest) also use `_wal_` models in the pipeline
- Cross-brand model reuse confirmed → brand cannot be determined from model path alone

**Verdict:** Cannot confirm wrong or right from pipeline data alone. Verify the in-game brand-set bonus tab for Eagle's Grasp gloves. Should be either `walker_harris_co` or `zwiadowka_sp_z_o_o`.

---

### WARN-2: `eagles_grasp` missing `myIsNamed` in source pipeline

`player_gear_gloves_c1_01_named` in `gear_named.json` and `gear_gloves.json` has the `<color name="legendary_orange">` name but **no `myIsNamed: true` attribute**.

- Our DB correctly treats it as named (no `isExotic` flag) — DB is fine
- Source pipeline inconsistency — flag for hunter pipeline review if needed

---

## OK — no issues

| DB id | Classification | Brand | Core | fixedAttrs | verdict |
|---|---|---|---|---|---|
| `deathgrips` | named | 5_11_tactical | armor | [{armor_on_kill, 10}] | ✓ |
| `motherly_love` | named | alps_summit_armament | skill_tier | [{health, 25}] | ✓ |
| `firm_handshake` | named | sokolov_concern | wd | [{status_effects, 16}] | ✓ |
| `hydden_gloves` | special | — | wd | [] | ✓ dev/no-drop item |
| `btsu_datagloves` | exotic | — | skill_tier | [{chc,15},{chd,25},{hsd,25}] | ✓ |
| `rathbones_gloves` | exotic | — | wd | [{chc,15},{chd,20},{hsd,20}] | ✓ |
| `bloody_knuckles` | exotic | — | wd | [{chc,15},{wd,10},{hsd,20}] | ✓ |
| `rugged_gauntlets` | exotic | — | armor | [{chc,10},{chd,15},{hsd,10}] | ✓ |
| `exodus_gloves` | exotic | — | wd | [{chc,15},{chd,20},{wd,10}] | ✓ |
| `overdogs` | exotic | — | wd | [{chc,10},{wd,15},{handling,15}] | ✓ |

---

## Summary

| Severity | Count | Items |
|---|---|---|
| CRITICAL | 1 | `contractor_s_gloves` — wrong class + wrong attrs + wrong fields |
| WARNING | 2 | `eagles_grasp` brand unverified; Eagle's Grasp missing source flag |
| OK | 10 | All other gloves items |

**No missing items. No orphans. No duplicate IDs.**
