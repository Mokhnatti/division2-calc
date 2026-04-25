# AUDIT: Brands data

**Sources**
- Game truth: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/brands.json` (+ `attribute_dict.json`)
- Our DB:    `C:/Users/glukm/division2-calc/apps/web/public/data/brands.json` (version 2.0.0, gameVersion TU23.1)

**Scope:** 36 non-set brands (excluding gear sets and `Précision Défense` / `Exhausted Equipment` placeholders).

---

## Summary

| Status | Count | Brands |
|---|---|---|
| ✅ Complete (3/3 correct) | **1** | `providence_defense` |
| ⚠️ Stat-key inconsistency | **1** | `unit_alloys` (uses `wd_ar` instead of `ar_dmg`) |
| ⚠️ Partial (1–2 of 3) | **9** | `brazos_de_arcabuz`, `fenris_group_ab`, `murakami_industries`, `habsburg_guard_hg`, `ceska_vyroba_s_r_o`, `grupo_sombra_s_a`, `airaldi_holdings`, `sokolov_concern`, `royal_works` |
| ❌ Empty (0/3) | **25** | see list below |
| ➕ Missing in our DB | **0** | (Précision Défense / Exhausted Equipment in game are placeholders without bonuses — safe to ignore) |
| ➖ Orphan in our DB | **0** | all 36 IDs map to game brands |

**Bottom line: only 1 of 36 brands has all bonuses populated correctly.**

ID-name match: all 36 IDs resolve to correct game brands. Naming convention `lowercase_snake_case` of `name_en` is consistent.

---

## UID → schema-stat mapping (decoded for this audit)

| Game UID | Decoded name | Mapped schema key |
|---|---|---|
| `10E5BD55558185C100000891ED2BA4F1` | Headshot | `hsd` |
| `4F5DDEA253EB6DD100001F28FCDEFA52` | Crit | `chc` |
| `4F5DDEA253EB6DD100001F292673DC62` | CritDamage | `chd` |
| `43A2C97052209A23000004CDD0FB54EC` | Damage | `wd` |
| `43A2C97052209A23000004D8D5EC4528` | Stability | `stability` |
| `43A2C97052209A23000004DA32591EE2` | WeaponClipSizeModBonus | `mag` |
| `43A2C97052209A23000004DB8AF701B4` | Reload Speed | `reload` |
| `4F5DDEA253F8A5EA00000E15E4C7E82D` | (alt Reload Speed) | `reload` |
| `43A2C97052209A23000004DC3D85D0C7` | RPM | `rof` |
| `43A2C97052209FAE000004F9BA3A9FAA` | Optimal Range | `range` |
| `3797E3755BAE97C30002BED1E9D83E8B` | Weapon Handling | `handling` |
| `3797E3755C586D5B000327B8721BEF4D` | ArmorRegenFlatBonusModBonus | `armor_regen` |
| `4F5DDEA25410024900001B190DD20269` | Swap Speed | `swap_speed` |
| `4F5DDEA25284F3E00000062692378107` | AllAmmoModBonus | `ammo_capacity` |
| `4F5DDEA25285EFCC00000781F23CF595` | HealthModBonus | `health` |
| `4F5DDEA25333E552000007BA1FEBF73F` | BlastDamageMitigationPercentage | `explosive_resist` |
| `5D312600585001E10000A3345EA4FF51` | AllStatusResistancePercentageFlatBonus | `hazard_protection` |
| `1C021E955DBC3AA6000545F36FB05AB2` | AllStatusEffectsModBonus | `status_effects` |
| `F34855CA5BC757B600057D70CAB3DD2C` | (alt Status Effects) | `status_effects` |
| `1C021E955DBC3AA6000545F266703932` | BlastDamageModBonus | `explosive_dmg` |
| `10E5BD555538F576000007E5885A2D61` | (Burn Duration) | `burn_duration` |
| `5D4179F15996CE00000035FD0AA3A56A` | ArmorModBonus | `armor` |
| `5D4179F15BF55A5200032C69B6DF1572` | ArmorOnKillModBonus | `armor_on_kill` |
| `5D4179F15BF80F4E00032B980881308F` | SkillPowerFlatBonus (TU repurposed) | `skill_tier` (+1 at 1.0) |
| `5D4179F15BF8174500032BB71F9E39D3` | SkillHasteModBonus | `skill_haste` |
| `BFAAA1FC5F217966000364C26142FCAA` | (alt Skill Haste) | `skill_haste` |
| `F34855CA5BC757B600057D6FB9386EA1` | allskills_damage_mod_Bonus | `skill_dmg` |
| `F34855CA5BC757B600057D71F47C6DDA` | allskills_duration_mod_Bonus | `skill_duration` |
| `F34855CA5BC83C550002F18385E855C9` | allskills_healing_mod_Bonus | `skill_repair` |
| `544DB9085D88919C00034A9DF62337E2` | SkillPulseResistancePercentageFinal | `pulse_resist` |
| `5D4179F15BBCABF80002CFCC158C2A27` | RifleDamageModBonus (Rifle weapon class) | `rifle_dmg` |
| `5D31260057DBA943000093F79A124DE9` | AssaultRifleDamageModBonus | `ar_dmg` |
| `5D31260057DBA943000093F801EF3A02` | LMGDamageModBonus | `lmg_dmg` |
| `5D31260057DBA943000093F962E3FFF9` | MarksmanRifleDamageModBonus | `mr_dmg` |
| `5D31260057DBA943000093FA19FA4002` | PistolDamageModBonus | `pistol_dmg` |
| `5D31260057DBA943000093FB118F3BD1` | ShotgunDamageModBonus | `shotgun_dmg` |
| `5D31260057DBA943000093FC69C82CC8` | SMGDamageModBonus | `smg_dmg` |
| `4F5DDEA254886BEB00003ADA117FFB91` | (Pistol Headshot Damage) | `pistol_hsd` |
| `5D4179F15BF557AA00032C570AF8C977` | WeaponAccuracyModBonus | `accuracy` |
| `5D4179F15BF55AD400032C6E0119EB78` | (Damage to Health Mod) | `dth` |
| `5D4179F15BF55B2B00032C77D132BC4A` | (Damage to Armor Mod) | `dta` |

> Notes: `dth`, `dta`, `pistol_hsd`, `skill_tier`, the second `reload` UID, and the second `status_effects`/`skill_haste` UIDs are inferred by cross-referencing brand-by-brand against in-game tooltips. The dict labels them only as `New BonusAttributeRef (0)`. Confidence is high because every brand they appear in matches the published bonus values exactly.

---

## Per-brand audit (all 36)

Format: **expected (game)** → *current (DB)*. Empty list `[]` = bonuses not migrated.

### ✅ Complete

**1. providence_defense** — `wd` core
- 1pc `hsd 13` · 2pc `chc 8` · 3pc `chd 13` ✅ matches

### ⚠️ Stat-key naming inconsistency

**2. unit_alloys** — `wd` core — values OK, but key for AR damage uses non-canonical name
- Expected: 1pc `rof 5` · 2pc **`ar_dmg 20`** · 3pc `mag 50`
- Ours:     1pc `rof 5` · 2pc **`wd_ar 20`** · 3pc `mag 50`
- Fix: rename `wd_ar` → `ar_dmg` (other brands' AR bonuses, once filled, must use `ar_dmg`).

### ⚠️ Partial (1–2 of 3 bonuses present)

**3. brazos_de_arcabuz** — `armor` core
- Expected: 1pc `skill_haste 10` · 2pc `skill_tier +1` · 3pc `mag 50`
- Ours:                                                     3pc `mag 50` only
- Add: 1pc skill_haste 10 · 2pc skill_tier +1
- Note: `core: "armor"` looks wrong — Brazos is a skill-tier brand. Game core is **skill_tier**.

**4. fenris_group_ab** — `wd` core
- Expected: 1pc `ar_dmg 10` · 2pc `reload 30` · 3pc `stability 50`
- Ours:                       2pc `reload 30` only
- Add: 1pc ar_dmg 10 · 3pc stability 50

**5. murakami_industries** — `skill_tier` core
- Expected: 1pc `skill_duration 15` · 2pc `skill_repair 35` · 3pc `skill_dmg 18`
- Ours:                                                       3pc `skill_dmg 18` only
- Add: 1pc skill_duration 15 · 2pc skill_repair 35
- (User hint "burn_duration + status_effects" — incorrect; Murakami is a pure skill brand.)

**6. habsburg_guard_hg** — `armor` core
- Expected: 1pc `hsd 13` · 2pc `mr_dmg 20` · 3pc `status_effects 25`
- Ours:     1pc `hsd 13` only
- Add: 2pc mr_dmg 20 · 3pc status_effects 25
- Note: `core: "armor"` looks suspect — Habsburg Guard is a weapon-damage brand (give it `wd` core).

**7. ceska_vyroba_s_r_o** — `wd` core
- Expected: 1pc `chc 8` · 2pc `hazard_protection 20` · 3pc `health 90`
- Ours:     1pc `chc 8` only
- Add: 2pc hazard_protection 20 · 3pc health 90

**8. grupo_sombra_s_a** — `wd` core
- Expected: 1pc `chd 13` · 2pc `explosive_dmg 20` · 3pc `hsd 13`
- Ours:     1pc `chd 13` ·                          3pc `hsd 13`
- Add: 2pc explosive_dmg 20

**9. airaldi_holdings** — `wd` core
- Expected: 1pc `mr_dmg 10` · 2pc `hsd 13` · 3pc `dth 5`
- Ours:                       2pc `hsd 13` only
- Add: 1pc mr_dmg 10 · 3pc dth 5

**10. sokolov_concern** — `wd` core
- Expected: 1pc `smg_dmg 10` · 2pc `chd 13` · 3pc `chc 8`
- Ours:                        2pc `chd 13` · 3pc `chc 8`
- Add: 1pc smg_dmg 10

**11. royal_works** — `wd` core
- Expected: 1pc `handling 5` · 2pc `mag 32` · 3pc `chd 15`
- Ours:                                       3pc `chd 15` only
- Add: 1pc handling 5 · 2pc mag 32

### ❌ Empty (no bonuses migrated)

> All 25 brands below have `bonuses: []` in our DB. Game-truth values listed.

| # | Brand id | core | 1pc | 2pc | 3pc |
|---|---|---|---|---|---|
| 12 | `5_11_tactical` | armor | `health 30` | `reload 30` | `hazard_protection 30` |
| 13 | `golan_gear_ltd` | armor | `status_effects 10` | `armor_regen 1.5` | `armor 10` |
| 14 | `lengmo` | armor | `explosive_resist 20` | `status_effects 20` | `lmg_dmg 30` |
| 15 | `gila_guard` | armor | `armor 5` | `health 60` | `armor_regen 2` |
| 16 | `palisade_steelworks` | armor | `armor_on_kill 10` | `health 60` | `skill_tier +1` |
| 17 | `richter_kaiser_gmbh` | skill_tier | `reload 15` | `explosive_resist 40` | `skill_repair 52` |
| 18 | `zwiadowka_sp_z_o_o` | wd | `mag 15` | `rifle_dmg 20` | `handling 30` |
| 19 | `petrov_defense_group` | wd | `lmg_dmg 10` | `handling 15` | `ammo_capacity 50` |
| 20 | `legatus_s_p_a` | wd | `swap_speed 30` | `range 70` | `wd 15` |
| 21 | `yaahl_gear` | armor | `hazard_protection 10` | `wd 10` | `pulse_resist 40` |
| 22 | `china_light_industries_corporation` | skill_tier | `explosive_dmg 15` | `skill_haste 20` | `status_effects 25` |
| 23 | `shiny_monkey_gear` | skill_tier | `skill_duration 15` | `skill_haste 5` | `skill_repair 52` |
| 24 | `overlord_armaments` | wd | `rifle_dmg 10` | `accuracy 30` | `handling 30` |
| 25 | `imminence_armaments` | wd | `wd 5` | `pistol_hsd 100` | `pistol_dmg 60` |
| 26 | `urban_lookout` | wd | `accuracy 10` | `skill_duration 30` | `mr_dmg 30` |
| 27 | `badger_tuff` | armor | `shotgun_dmg 10` | `armor 5` | `explosive_resist 15` |
| 28 | `douglas_harding` | wd | `pistol_dmg 20` | `stability 30` | `accuracy 50` |
| 29 | `alps_summit_armaments` | skill_tier | `skill_repair 18` | `skill_duration 30` | `skill_haste 30` |
| 30 | `wyvern_wear` | skill_tier | `skill_dmg 8` | `status_effects 18` | `skill_duration 45` |
| 31 | `hana_u_corporation` | skill_tier | `skill_haste 10` | `skill_dmg 10` | `wd 15` |
| 32 | `walker_harris_co` | wd | `wd 5` | `dth 5` | `dta 10` |
| 33 | `belstone_armory` | armor | `armor_regen 1` | `armor_on_kill 10` | `reload 45` |
| 34 | `empress_international` | skill_tier | `status_effects 10` | `skill_dmg 10` | `skill_haste 8` |
| 35 | `uzina_getica` | armor | `armor 5` | `armor_on_kill 10` | `hazard_protection 30` |
| 36 | `electrique` | skill_tier | `status_effects 10` | `burn_duration 20` | `smg_dmg 30` |

---

## Other findings

### Suspect `core` values
- `brazos_de_arcabuz` — DB has `core: "armor"`, should be **`skill_tier`** (1pc skill_haste, 2pc +1 tier, 3pc mag).
- `habsburg_guard_hg` — DB has `core: "armor"`, more naturally **`wd`** (hsd / mr_dmg / status_effects). May be intentional armor-affinity DZ brand though — verify in-game.

(All other `core` assignments are consistent with the brand's bonus profile.)

### Brand IDs / names
- All 36 our-DB IDs map cleanly to game brands. No typos in IDs vs game data.
- `5_11_tactical` (vs game "5.11 Tactical"), `ceska_vyroba_s_r_o`, `zwiadowka_sp_z_o_o`, `legatus_s_p_a`, `grupo_sombra_s_a`, `hana_u_corporation`, `habsburg_guard_hg` — all reasonable transliterations.

### Game brands intentionally excluded (placeholders, no bonuses)
- `gearbrand_o` — *Précision Défense* (no bonuses in game data)
- `GearBrand_start` — *Exhausted Equipment* (default-tier placeholder)

These do **not** need to be added to our DB.

### Schema gaps to consider
Our existing populated entries already use `chc`, `chd`, `hsd`, `wd`, `wd_ar`, `mag`, `reload`, `rof`, `skill_dmg`. The full audit reveals we'll need additional schema keys to fully populate brands:

`armor`, `armor_regen`, `armor_on_kill`, `health`, `hazard_protection`, `explosive_resist`, `explosive_dmg`, `status_effects`, `burn_duration`, `accuracy`, `stability`, `handling`, `swap_speed`, `range`, `ammo_capacity`, `pulse_resist`, `skill_haste`, `skill_repair`, `skill_duration`, `skill_tier`, `pistol_dmg`, `pistol_hsd`, `smg_dmg`, `shotgun_dmg`, `lmg_dmg`, `mr_dmg`, `ar_dmg`, `rifle_dmg`, `dth`, `dta`.

Recommend defining the canonical schema set before bulk-filling the 25 empty brands so naming stays consistent (and rename `wd_ar` → `ar_dmg` in Unit Alloys at the same time).
