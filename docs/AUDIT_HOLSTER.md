# AUDIT: HOLSTER slot — named-gear.json

**Date:** 2026-04-25  
**Game truth:** gear_named.json + gear_exotic.json + gear_holster.json  
**DB audited:** apps/web/public/data/named-gear.json (slot: holster)

---

## SUMMARY

| Category | Count |
|---|---|
| Named in game truth | 6 |
| Named in DB (correct) | 5 |
| Named in DB (wrong data) | 1 |
| Exotic in game truth | 6 |
| Exotic in DB (correct) | 6 |
| ORPHANS in DB | 2 |
| **Total issues** | **4** |

---

## CRITICAL ISSUES

### 1. ORPHAN — `picaro_s_holster` (wrong ID, duplicate)

**Problem:** Entry exists with wrong ID format — underscore instead of apostrophe normalization.

```json
{
  "id": "picaro_s_holster",
  "slot": "holster",
  "core": "wd",
  "fixedAttrs": []
}
```

**Game truth:** `player_gear_holster_x_01_named` → Pícaro's Holster, `myIsNamed: true`  
**Correct entry already exists:** `picaros_holster` (brand: brazos_de_arcabuz, fixedAttrs: [{wd:10}])  
**Action:** REMOVE `picaro_s_holster`

---

### 2. ORPHAN + WRONG CLASSIFICATION — `centurion_scabbard`

**Problem:** Entry is missing `isExotic: true`, missing `fixedAttrs`, no brand. In game truth this item is EXOTIC.

```json
{
  "id": "centurion_scabbard",
  "slot": "holster",
  "core": "wd",
  "fixedAttrs": []
}
```

**Game truth:** `player_gear_holster_exotic_05` → Centurion's Scabbard, `myIsExotic: true`  
**Correct entry already exists:** `centurions_scabbard` (isExotic: true, fixedAttrs: [{chc:15},{chd:20},{hsd:15}])  
**Action:** REMOVE `centurion_scabbard`

---

### 3. WRONG CORE — `picaros_holster`

**Problem:** `core: "armor"` — but Brazos de Arcabuz is a Weapon Damage brand. All other Brazos items in DB have WD core or match WD orientation.

```json
{
  "id": "picaros_holster",
  "slot": "holster",
  "brand": "brazos_de_arcabuz",
  "core": "armor",   ← WRONG
  "fixedAttrs": [{"stat": "wd", "value": 10}]
}
```

**Expected:** `core: "wd"`  
Evidence: fixedAttrs contains `wd` stat, Brazos de Arcabuz brand bonus is Weapon Damage.  
The duplicate orphan `picaro_s_holster` (which should be removed) also had `core: "wd"`, confirming the intent.  
**Action:** Change `core` from `"armor"` → `"wd"`

---

## MEDIUM ISSUES

### 4. SUSPICIOUS FIXEDATTRS VALUE — `forge`

**Problem:** `fixedAttrs: [{stat: "health", value: 50}]` — value 50 appears excessive.

```json
{
  "id": "forge",
  "slot": "holster",
  "brand": "richter_kaiser",
  "core": "skill_tier",
  "fixedAttrs": [{"stat": "health", "value": 50}]
}
```

Comparison: `motherly_love` (gloves, also named) has `{stat: "health", value: 25}`.  
A named holster with 50% health fixed bonus is double that amount — unusual.  
Brand (richter_kaiser), core (skill_tier) are **correct** based on visual `pf_t_ric_d1`.  
**Action:** Verify `health: 50` against in-game tooltip. Likely should be 25 or a different stat.

---

## CONFIRMED CORRECT

### Named Holsters (6 expected, 6 present)

| DB id | Name | Brand | Core | Brand verified by visual |
|---|---|---|---|---|
| `forge` | Forge | richter_kaiser | skill_tier | `pf_t_ric_d1` → ric = R&K ✓ |
| `ammo_dump` | Ammo Dump | badger_tuff | armor | `pf_t_bad_a1` → bad = Badger ✓ |
| `picaros_holster` | Pícaro's Holster | brazos_de_arcabuz | ~~armor~~ | `pf_t_ARC2_a1` → ARC2 = BdA ✓ |
| `spot_on` | Spot-on | urban_lookout | wd | `pf_t_mur_a1` → mur = UL (same as Sleight chest) ✓ |
| `salvo` | Salvo | unit_alloys | wd | `pf_t_han_y7s3_a1` → han = UA (same as Equalizer chest) ✓ |
| `claws_out` | Claws Out | wyvern_wear | skill_tier | `pf_t_wyv_b1` → wyv = WW ✓ |

### Exotic Holsters (6 expected, 6 present)

| DB id | Name | isExotic |
|---|---|---|
| `dodge_city_gunslingers_holster` | Dodge City Gunslinger's Holster | ✓ |
| `imperial_dynasty` | Imperial Dynasty | ✓ |
| `waveform` | Waveform | ✓ |
| `shocker_punch` | Shocker Punch | ✓ |
| `centurions_scabbard` | Centurion's Scabbard | ✓ |
| `nimble_holster` | Nimble Holster | ✓ |

**April Fools variant** (`player_gear_holster_exotic_01_aprilfools`, `myIsEquippableFlag: false`) — correctly absent from DB ✓

---

## CHANGES REQUIRED

```
REMOVE:  picaro_s_holster       (orphan duplicate, wrong ID)
REMOVE:  centurion_scabbard     (orphan, wrong classification — exotic w/o isExotic flag)
FIX:     picaros_holster        core: "armor" → "wd"
VERIFY:  forge                  fixedAttrs health:50 — suspicious, check in-game
```
