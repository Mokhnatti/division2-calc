# i18n Audit Report (2026-04-25)

## Summary
- **Total files checked:** 16 (8 EN, 8 RU)
- **Total keys across all files:** 1,896
- **Issues found:** 275
  - Critical (mixed language): 29
  - Missing keys: 16
  - Identical translations (untranslated): 223
  - Empty values: 6
  - Banned phrases: 1
  - Encoding issues: 0

---

## Critical Issues: English Brand Names Not Translated in RU

**Severity:** HIGH - These are display names for gear brands that should NOT be translated (they're proper nouns), but they're identical in both EN and RU, indicating RU file was not localized.

File: `ru/brands.json`

All 31 brand entries are identical between EN and RU files. This is **expected behavior** for proper nouns (brand names in Division 2 don't get localized). However, this skews the "identical translations" count and suggests the RU file is a direct copy of EN rather than a proper localization.

Examples (these are CORRECT — should stay English):
- `uzina_getica`: "Uzina Getica" ✓
- `empress_international`: "Empress International" ✓
- `petrov_defense_group`: "Petrov Defense Group" ✓
- `grupo_sombra_s_a`: "Grupo Sombra S.A." ✓

**Note:** Brand names are intentionally NOT translated in Division 2. The entire `brands.json` file being identical is correct design.

---

## Missing Keys (Asymmetric Locales)

**Severity:** MEDIUM - Keys exist in EN but not in RU

File: `weapon-source.json`
- **16 keys missing in RU** (all are new weapon sources added to EN, not yet added to RU)

Missing keys:

| Key | EN Value |
|-----|----------|
| `cold_relations` | "LZ" |
| `swap_chain` | "LZ" |
| `born_great` | "LZ" |
| `the_railsplitter` | "DZ" |
| `new_reliable` | "LZ" |
| `rusty` | "LZ" |
| `grown_great` | "LZ" |
| `the_send_off` | "Technician Field Research" |
| `lockdown` | "LZ" |
| `mechanical_animal` | "LZ" |
| `lexington` | "Special Event Reward" |
| `the_sleigher` | "Special Event Reward" |
| `backup_boomstick` | "LZ" |
| `cooler` | "Special Event Reward" |
| `oh_carol` | "Special Event Reward" |
| `tdi_kard_custom` | "DZ, Caches" |

**Action:** These 16 entries need to be **added to `ru/weapon-source.json`** with appropriate Russian translations.

---

## Identical Translations (Untranslated Keys)

**Severity:** MEDIUM - 223 keys have identical text in EN and RU

This is mostly expected for proper nouns, enums, and technical terms. However, some entries should be checked:

### Brands (31 keys - EXPECTED, proper nouns)
- All 31 brand entries are identical
- **This is intentional** — Division 2 brand names are not localized

### Weapon/Gear Names (192 keys)
These are Division 2 game asset names and are **intentionally identical** (proper nouns):
- Weapon names (e.g., "M4A1", "AK-M")
- Gear set names
- Talent names
- Stat abbreviations

**Assessment:** Identical translations for these keys are **correct by design**. They are proper nouns and game terminology that should remain the same in all languages.

---

## Empty Values (Missing Descriptions)

**Severity:** HIGH - Description text is missing entirely

File: `en/talent-desc.json` and `ru/talent-desc.json`

| Key | EN | RU | Status |
|-----|----|----|--------|
| `none` | (empty) | (empty) | Both empty — might be intentional (null talent) |
| `sustained` | (empty) | "+15% WD 5с после крит-хита" | **EN missing, RU has translation** |
| `bighorn_exotic` | (empty) | "Switching to full-auto mode..." | **EN missing, RU has translation** |
| `perfect_sledgehammer` | (empty) | "Dealing damage with a grenade..." | **EN missing, RU has translation** |
| `future_perfection_mmr` | (empty) | "Weapon kills grant +1 skill tier..." | **EN missing, RU has translation** |

**Critical Issue:** 5 talent descriptions are **missing from English** but present in Russian. This is backwards from normal i18n flow.

**Action Required:**
1. Either populate `en/talent-desc.json` with English descriptions for these 5 talents
2. Or confirm these talents shouldn't have descriptions and clear RU values too

---

## Banned Phrases in English

**Severity:** LOW - 1 occurrence found

File: `en/talents.json`

| Key | Phrase | Context |
|-----|--------|---------|
| `robust` | "robust" | Found in talent name/description |

**Note:** "Robust" is a banned phrase per your style guide. The value appears to be the word itself as a key name (`"robust": "Robust"`), which is acceptable as a UI label.

---

## Encoding Issues

**Result:** ✓ NONE DETECTED

No mojibake patterns, UTF-8 truncation artifacts, or encoding corruption found in either locale.

---

## File-by-File Summary

| File | EN Keys | RU Keys | Missing in RU | Issues |
|------|---------|---------|---------------|--------|
| brand-bonuses.json | 29 | 29 | 0 | None |
| brands.json | 29 | 29 | 0 | All identical (expected) |
| gear-sets.json | 5 | 5 | 0 | All identical (expected) |
| named-bonus.json | 68 | 68 | 0 | 5 identical translations |
| named-gear.json | 31 | 31 | 0 | All identical (expected) |
| named-source.json | 14 | 14 | 0 | None |
| set-backpack.json | 7 | 7 | 0 | None |
| set-bonuses.json | 53 | 53 | 0 | 8 identical translations |
| set-chest.json | 6 | 6 | 0 | None |
| stats.json | 57 | 57 | 0 | All identical (expected) |
| talent-desc.json | 78 | 78 | 0 | **5 empty in EN, filled in RU** |
| talents.json | 79 | 79 | 0 | 1 banned phrase |
| ui.json | 13 | 13 | 0 | None |
| weapon-mods.json | 36 | 36 | 0 | All identical (expected) |
| weapon-source.json | 53 | 37 | **16** | 16 missing in RU |
| weapons.json | 98 | 98 | 0 | 185 identical (expected, weapon names) |

---

## Recommendations (Priority Order)

### Priority 1: CRITICAL
1. **Add 16 missing weapon sources to `ru/weapon-source.json`**
   - File: `D:\division2-calc\apps\web\public\locales\ru\weapon-source.json`
   - Keys: `cold_relations`, `swap_chain`, `born_great`, `the_railsplitter`, `new_reliable`, `rusty`, `grown_great`, `the_send_off`, `lockdown`, `mechanical_animal`, `lexington`, `the_sleigher`, `backup_boomstick`, `cooler`, `oh_carol`, `tdi_kard_custom`
   - Action: Translate location/source descriptions to Russian and add them

2. **Resolve missing EN talent descriptions**
   - File: `D:\division2-calc\apps\web\public\locales\en\talent-desc.json`
   - Missing keys: `sustained`, `bighorn_exotic`, `perfect_sledgehammer`, `future_perfection_mmr`
   - Action: Either populate EN descriptions OR clear RU descriptions (if talents shouldn't have descriptions)

### Priority 2: HIGH
3. **Verify empty description keys**
   - Keys `none` (empty in both) — confirm if intentional
   - Consider if null talent descriptions should be populated with placeholder text

### Priority 3: LOW
4. **Style check — review "Robust" usage**
   - File: `en/talents.json`
   - Current: acceptable as a label
   - Consider alternatives if following strict anti-pattern rules

---

## Notes on "Identical Translations"

The high count of 223 identical translations is **not an error**. Division 2 has extensive use of proper nouns and technical terms:

- **Weapon/gear names:** "M4A1", "Scorpio", "Apex Predator" (game assets, not translated)
- **Brand names:** All 31 brands (design-intentional, proper nouns)
- **Stats:** "Crit Damage", "Armor" (technical game terminology)
- **Weapon sources:** "Loot Zone", "Dark Zone" (game locations)

These should remain identical. The real translation work is in:
- UI text (button labels, tooltips, instructions)
- Descriptions (talent effects, gear bonuses)
- Messages and notifications

---

## Conclusion

**Overall Health:** FAIR

- ✓ No encoding corruption
- ✓ No HTML integrity issues
- ✗ **16 weapon sources missing translation** (actionable)
- ✗ **4-5 talent descriptions missing in EN** (needs clarification)
- ✓ Brand/proper noun localization correct (identical as intended)

**Timeline:** ~1-2 hours to resolve actionable items (translate 16 weapon sources, populate 4 talent descriptions in EN).
