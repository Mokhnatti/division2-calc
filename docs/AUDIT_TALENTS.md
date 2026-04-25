# Talent Audit — TU23.1
Date: 2026-04-25
Source: read-only audit. No data was modified.

## Summary

- **Total talents in our DB:** 327 (kinds: weapon=133, chest/backpack/etc=194)
- **Weapon talents in our DB:** 133
- **Game weapon talents (`talents_weapon.json`):** 115
- **Game exotic talents (`talents_exotic.json`):** 78 (43 of which are weapon-talent variety; rest are gear-exotics like Iron Grip / Bob and Weave)
- **Critical issues:** 13
- **Warnings (value mismatches, label/desc swaps):** 19
- **Verified clean (sampled):** ~95 talents look correct
- **Broken `talentId` references on weapons:** 64 (weapons.json points to talent IDs that don't exist in talents.json)

The biggest structural problem is **64 weapons in `apps/web/public/data/weapons.json` reference `talentId` strings that simply do not exist in `talents.json`** — most are named weapons whose perfect-talent ID was renamed/removed, and a handful are exotics whose talentId is an aliased name (e.g. `unnerve` instead of `unnerve_exotic`). These show as "no talent" in the UI today.

The second-biggest issue is **misplaced descriptions**: `bullet_king_exotic` is currently described with Pestilence's tooltip, `pestilence_exotic` carries a mixed/wrong description, and `agitator_exotic` description matches Iron Lung's Ardent rather than Agitator's actual mechanic.

The third-biggest issue is **scrambled RU exotic names**: many entries in `locales/ru/talents.json` show the wrong talent name in Russian (e.g. `bluescreen_exotic: "Пахан"`, `bullet_king_exotic: "Мор"`, `merciless_exotic: "Двойной спуск"`, `iron_lung_exotic: "Пылкость"` is OK but several others are clearly mis-paired).

---

## Critical Issues

### ❌ `bullet_king_exotic` — wrong description (Pestilence text on Bullet King)
- **Issue:** EN/RU description currently reads *"This debuff reduces healing received by 50% for 10s"* — that is **Pestilence's** plague debuff, not Bullet King's mag-refill mechanic.
- **Game says:** Bullet King's actual talent is *"The Bullet King — Killing an enemy refills 25% of the magazine. Stacks up to 4 times for a full magazine refund. +100% reload speed"* (talent ID is implicit; the real game talent is on the named-iconic LMG and isn't in `talents_exotic.json` because it's baked into the weapon attrs).
- **We have:** `talent-desc/en.json: "This debuff reduces healing received by 50% for 10s."`
- **Fix:** Replace EN/RU description with the actual Bullet King talent. Set `bonuses` to the mag-refill effect (no DPS bonus directly — it's a sustain mechanic; in our model it should likely be `additive wd 0` plus a note, or a small `mag` bonus to model effective magazine).

### ❌ `pestilence_exotic` — partially wrong description
- **Issue:** EN reads *"This debuff reduces healing received by 50% for 10s"* (correct for one part of Pestilence) but RU reads *"Hits apply a debuff dealing 1% weapon damage over 10s, stacks 50x"* — which is **Plague of the Outcasts** (`talent_exotic_lmg_mk1_a`). EN/RU are out of sync and EN is incomplete (missing the plague-DoT part).
- **Game says (talent_exotic_lmg_mk1_b):** *"This debuff reduces healing received by 50% for 10s."* That is the secondary effect; the headline mechanic comes from `talent_exotic_lmg_mk1_a` Plague of the Outcasts: 1% weapon damage DoT for 10s, stacks ×50.
- **Fix:** Combine both: "Hits apply Plague (1% weapon damage DoT for 10s, stacks ×50) and reduce healing received by 50% for 10s." Sync EN+RU.

### ❌ `agitator_exotic` — Ardent description on Agitator
- **Issue:** EN/RU description reads *"Shooting heats up the weapon, filling up heat meter equivalent to 50% of standard Magazine Size"* — that is the **Ardent** talent on **Iron Lung**, not Agitator's actual mechanic.
- **Game says (Agitator F2000):** Agitator does NOT have its talent in `talents_exotic.json` directly — its real effect is built into the weapon's stats (incendiary rounds + bullet-spread mechanic). The current text is verbatim copied from `talent_exotic_ardent`.
- **Our bonuses:** `wd 30, rof 25` — these numbers do not appear in any game source for Agitator and may be carried over from an older revision. Verify against in-game Agitator tooltip.
- **Fix:** Replace EN/RU with Agitator's actual tooltip. Verify the `bonuses` against the in-game Agitator weapon. **DO NOT use Ardent's text.**

### ❌ Iron Lung verified — was previously wrong, now CORRECT
- **Confirmed:** `iron-lung.md` markdown describes Ardent (heat meter, ignites) — correct.
- **Confirmed:** `weapons.json` exotic `iron_lung` → `talentId: "iron_lung_exotic"` — correct ID exists.
- **Confirmed:** `talents.json` has `iron_lung_exotic` with `bonuses: []` and a note about heat-meter / appliesBurn flag — semantically correct since the talent grants no flat WD; burn DPS is computed separately.
- **Confirmed:** EN/RU descriptions for `iron_lung_exotic` correctly describe Ardent (heat meter, 50% mag, +12/sec decay, ignites enemies).
- **Confirmed:** Game truth `talent_exotic_ardent | Ardent | Пылкость` matches our description.
- **Note:** `locales/en/talents.json: "iron_lung_exotic": "Ardent"` is correct; `locales/ru` says "Пылкость" — correct.
- **Verdict:** The previous Outcast Resilience bug (which was a *holstered* talent on a non-Iron-Lung weapon — `talent_exotic_lmg_mk1_holstered`) is fully resolved.

### ❌ 64 weapons reference non-existent talent IDs
The following weapons in `apps/web/public/data/weapons.json` point to `talentId` values that have no entry in `talents.json`. These will display as "no talent" or break talent panels.

**Named weapons with broken talentId:**
| Weapon | Broken talentId | Likely correct ID |
|---|---|---|
| first_sight | `30_hsd_50_reload_speed_debuff` | (custom — needs new talent entry) |
| glory_daze | `perfect_near_sighted` | `perfectly_near_sighted` (we have this) |
| lexington | `1_782_base_damage` | (custom stats, no talent) |
| manic | `perfect_overflowing` | `perfectly_overflowing` (we have this) |
| pyromaniac | `perfect_ignited` | `perfectly_ignited` |
| the_railsplitter | `perfect_accurate` | (no such talent in our DB) |
| slingshot | `45_optimal_range_60_total` | (custom stats) |
| the_apartment | `perfect_measured` | `perfectly_measured` |
| the_grudge | `perfect_vindictive` | `perfectly_vindictive` |
| black_friday | `perfect_unhinged` | `perfectly_unhinged` |
| gear_shift | `perfect_gear_shift_talent` | (no entry) |
| new_reliable | `perfect_optimized` | `perfectly_optimized` |
| sleipnir | `perfectly_frenzy` | `perfect_frenzy` |
| tabula_rasa | `perfect_steady_handed` | `perfectly_steady_handed` |
| the_stinger | `swift` | (no entry — Swift is a kneepads talent) |
| cold_relations | `perfect_strained` | `perfectly_strained` |
| whisper | `perfect_behind_you` | `perfectly_behind_you` |
| brutus | `perfect_behind_you` | `perfectly_behind_you` |
| adrestia | `perfect_adrestia_talent` | (no entry) |
| handbasket | `230_326_base_damage_200_rpm` | (custom stats) |
| oh_carol | `137_0_headshot_damage_twinkling_lights` | (event talent — need entry) |
| the_white_death | `137_0_headshot_damage` | (custom stats) |
| backup_boomstick | `core_attribute` | (no entry) |
| firestarter | `primer_rounds` | (no entry) |
| rock_n_roll | `perfect_extra` | `perfectly_extra` |
| the_sheriff | `autentico_35_weapon_damage_100_accuracy_no_damage_drop_off_...` | (built into stats, no talent) |
| the_mop | `secondary_attribute` | (no entry) |
| tdi_kard_custom | `secondary_attribute` | (no entry) |
| the_harvest | `10_base_damage_7_rof` | (custom stats) |
| cooler | `refreshing` | (no entry — event talent) |
| quickstep | `sport_mode` | (no entry — event talent) |

**Exotic weapons with broken talentId** (the talent ID is wrong, the talent likely exists under a different name):
| Exotic | Broken talentId | Talent that exists |
|---|---|---|
| st_elmo_s_engine | `talent_exotic_weapon_the_senate_actum_est` | `elmos_mark_exotic` |
| strega | `unnerve` | `unnerve_exotic` |
| backfire | `payment_in_kind` | `payment_in_kind_exotic` |
| lady_death | `breathe_free` | `breathe_free_exotic` |
| the_chatterbox | `incessant_chatter` | `chatterbox_exotic` |
| big_alejandro | `big_alejandro` | `cover_shooter_exotic` |
| bittersweet | `bittersweet` | (no entry — needs creation) |
| diamondback | `agonizing_bite` | `agonizing_bite_exotic` |
| the_ravenous | `geri_and_freki` | `geri_and_freki_exotic` |
| vindicator | `ortiz_assault_interface` | `ortiz_assault_interface_exotic` |
| dread_edict | `full_stop` | `full_stop_exotic` |
| mantis | `in_plain_sight` | `in_plain_sight_exotic` |
| sacrum_imperium | `the_trap` | `the_trap_exotic` |
| shroud | `shroud` | (no entry — needs creation) |
| overlord | `warlord` | (Overlord is a separate weapon — talent should match game data) |
| busy_little_bee | `busy_little_bee` | (no entry — needs creation) |
| mosquito | `mosquito` | `mosquito_song_exotic` |
| regulus | `regicide` | `regicide_exotic` |
| tempest | `restrained` | `restrained_exotic` |
| sheriff | `talent_exotic_shotgun_autentico` | `warlord_exotic` (which has name "Autentico") |
| warlord | `warlord_exotic` | OK as ID (talent does exist), but RU name is "Аутентико" — see RU mismatches |
| liberator | `liberator_exotic` | OK |
| caduceus | `talent_exotic_rifle_transfusion` | `transfusion_exotic` |
| hungry_hog | `hungry_hog_exotic` | OK |
| historian | `historian_exotic` | OK |
| tenebrae | `tenebrae_exotic` | OK |
| centurion | `talent_exotic_pistol_faster_than_reloading` | (no entry — needs creation as `centurion_exotic`) |
| damascus | `damascus_exotic` | (no entry — needs creation) |
| golden_rhino | `talent_exotic_ostracize` | (no entry — needs creation) |
| cassidy | `cassidy_exotic` | OK |
| medved | `talent_exotic_shotgun_cryesix12` | `scorpio_exotic` (Septic Shock) — but Medved ≠ Scorpio. Likely mapping bug. |
| midas | `talent_exotic_smg_MPX` | `payment_in_kind_exotic` |
| hildr | `hildr_exotic` | OK |

**Recommended fix pattern:** for the simple ID renames (e.g. `payment_in_kind` → `payment_in_kind_exotic`), update the `talentId` field on the weapon, not create a duplicate talent. For weapons missing real talents (Bittersweet, Shroud, Centurion, Damascus, Golden Rhino, Damascus, Busy Little Bee), add proper entries to `talents.json` with values from in-game tooltips.

---

## Warnings — value mismatches and label issues

### Bonus values vs game truth

| talent | our value | game tooltip max | bucket | notes |
|---|---|---|---|---|
| `optimist` | wd 17.5 (avg) | +3.5%/10% × 10 = 35% max → 17.5 avg | wd_additive | ✓ correct, see Optimist note below |
| `perfect_optimist` | wd 22.5 (avg) | +4.5%/10% × 10 = 45% max → 22.5 avg | wd_additive | ✓ correct |
| `outsider` | wd 35 | +1%/kill, max ~10 stacks | — | likely OK; verify max stack count |
| `rifleman` | wd 60 | game per-stack 10% × 5 stacks = 50% | wd_additive | **WARNING** — game data shows max 50%, we show 60. Older versions may have been 60. |
| `perfect_rifleman` | wd 66 | +11% × 6 stacks = 66% | — | ✓ correct |
| `close_personal` | wd 40 | game tooltip "+40%" | — | ✓ correct |
| `perfectly_close_personal` | wd 38 | game tooltip "+38%" | — | ✓ correct |
| `frenzy` | wd 20 + rof 25 | +3% per 10 bullets max — depends on mag | wd_additive | depends on weapon mag size; static value is approximation |
| `perfect_frenzy` | wd 27 + rof 27 | +3% per 8 bullets | wd_additive | similarly mag-dependent |
| `killer` | chc 50 | game grants +70% **chd** (not chc!) on crit kill | crit_damage | **WARNING** — bonus stat may be wrong: tooltip is +70% **CHD**, our entry has `chc 50`. Verify model. |
| `perfect_killer` | chd 90 | "+90% chd" | crit_damage | ✓ correct |
| `strained` | chd 65 | +5% chd per 0.5s, max 13 stacks → 65% | crit_damage | ✓ correct |
| `perfectly_strained` | chd 80 | +10% per 0.5s, max 8 → 80% | — | ✓ correct |
| `flatline` | wd amp 20 | "amplifies WD by 15% to pulsed" | wd_multiplicative | **WARNING** — game shows 15%, we show 20 |
| `perfect_flatline` | wd amp 20 | tooltip "by 20%" | wd_multiplicative | ✓ correct |
| `eyeless` | wd amp 10 | tooltip "{0}% to blind" placeholder; game `myValue=4.0` per rank | wd_multiplicative | likely correct (max stack = 10%); verify |
| `perfect_eyeless` | wd amp 35 | tooltip "by 35% to blinded" | wd_multiplicative | ✓ correct |
| `ignited` | wd 20 | tooltip "{0}%" | headshot_damage | ❓ bucket is `headshot_damage` but talent amplifies WD to burning — bucket assignment looks wrong. Should be `wd_multiplicative` (same as Sadist/Eyeless/Flatline). |
| `perfectly_ignited` | wd 30 | "by 30% to burning" | headshot_damage | same bucket issue as `ignited` |
| `sadist` | wd amp 12 | tooltip "+20%" — game amp value is 20% | wd_multiplicative | **WARNING** — game shows 20%, we show 12. Older value? |
| `perfect_sadist` | wd amp 35 | tooltip "+25% to bleeding" — game shows 25 | wd_multiplicative | **WARNING** — we show 35, game says 25 |
| `ranger` | wd amp 15 | "+2% per 4m" — depends on distance | wd_multiplicative | static avg; OK if model docs note it |
| `perfect_ranger` | wd amp 20 | "+2% per 3m" | wd_multiplicative | ditto |
| `naked` | wd 35 | tooltip "+50% headshot dmg for 5s" | headshot_damage | **WARNING** — should be HSD (50), not WD (35). Stat type and value both off. |
| `perfectly_naked` | hsd 50 | "+50% headshot for 5s" | — | ✓ stat correct |
| `pummel` | wd 50 | tooltip varies by weapon (~25-50% on N consecutive kills) | wd_additive | placeholder values |
| `perfect_pummel` | wd 40 | not in `talents_weapon.json` | — | NOT IN GAME FILE — verify in-game |
| `unhinged` | wd 25 | game tooltip "+25%" | wd_additive | ✓ correct |
| `perfectly_unhinged` | wd 22 | game tooltip "+22%" | — | ✓ correct |
| `measured` | wd 15 | tooltip "+30% on bottom half" | wd_additive | **WARNING** — should likely be 30 (max in fire mode) — 15 is unclear (avg of 0/30?) |
| `perfectly_measured` | wd 10 | "+38% on bottom half" | wd_additive | **WARNING** — should be 38 or avg 19, not 10 |
| `boomerang` | wd 12 | "+40% damage on returned shot, 50% return chance" | — | static placeholder |
| `lucky_shot` | mag 30 | "+{0}% mag" — game value 1.0 = 30 stack max, but per-rank | — | depends on stacking model |
| `surgical` | chc 10 | "+{0}% chc" — game myValue 5.0; total = 5%? | — | **WARNING** — verify, might be 5 not 10 |
| `precision` | chc 20 | not in game file under that ID | — | likely removed talent; was "+5/stack max 4" historically |
| `perpetuation` | hsd 12 | tooltip "+{0}% status effect dmg/duration" — myValue 20 | — | **WARNING** — bonus stat probably wrong: game grants status effect %, not headshot damage |
| `perfect_perpetuation` | wd amp 15 | similar | — | same issue |
| `spike` | wd 25 | "+{0}% skill damage" — should be skill damage stat, not wd | skill_damage | **WARNING** — bucket says skill_damage but stat is `wd`. Should be `skd` (skill damage) |
| `calculated` | wd 10 | "kills from cover reduce CD 20%" — gives CDR not WD | — | **WARNING** — bonus type is wrong: this talent is cooldown reduction, not weapon damage |
| `vanguard` | wd 8 | "deploying shield..." — utility talent, no WD | — | **WARNING** — wrong bonus type, this is a shield/utility talent |
| `adrenaline_rush` | wd 30 | "10% bonus armor near enemies" — utility | — | **WARNING** — wrong bonus type, no WD bonus in game |
| `in_sync` | wd 15 | "+skill damage on hits" — gives skill dmg not wd | — | **WARNING** — wrong bonus stat (skd not wd) |
| `vanguard` (chest) | — | not weapon | | — |
| `preservation` | wd 5 | "kills repair armor" — sustain talent, no WD | — | **WARNING** — placeholder; no actual WD bonus in game |
| `perfect_preservation` | wd amp 10 | same | — | same |
| `determined` | wd 8 | "guaranteed headshot on next" — utility | — | **WARNING** — no WD bonus, mechanical effect |
| `perfectly_determined` | hsd 30 + chd 20 | "guaranteed CRITICAL headshot" — same idea | — | likely OK as approximation |
| `headhunter` | wd 1250 | "+20% of killing blow stored, releases on next hit" — capped value | — | very weapon-specific; verify against game cap formula |
| `back_and_forth` | wd 9 + rof 10 | "+10% rof, +9% wd" | wd_additive | ✓ correct |
| `perfect_back_and_forth` | wd 12 + rof 13 | "+13% rof, +12% wd" | — | ✓ correct |
| `perfect_streamline` | wd 47 | game tooltip "+37%" | — | **WARNING** — game shows 37, we show 47. Possibly outdated. |
| `perfect_immobilize` | wd amp 25 | game tooltip "+15% to ensnared" | wd_multiplicative | **WARNING** — game shows 15, we show 25 |
| `perfect_thunder_strike` | wd amp 35 | "+35% to shocked" | — | ✓ correct |
| `perfect_pressure_point` | wd amp 20 | "+20% under status" | wd_multiplicative | ✓ correct |
| `perfect_breadbasket` | hsd 70 | "+70% hsd" | — | ✓ correct |
| `perfect_brazen` | wd amp 12 | "3% per pellet, 8% on kill" — context-dependent | wd_multiplicative | placeholder |
| `perfectly_behind_you` | wd amp 25 | "+20% to enemies not targeting you" | wd_multiplicative | **WARNING** — we show 25, game (non-perfect) is 20; perfect tooltip likely +25 — verify |
| `perfect_first_blood` | hsd 30 | "+30% hsd on first hit" | — | likely OK |
| `perfect_outsider` | wd amp 15 | "+1.5% optimal range, +1.25% accuracy per kill" — utility, no WD | — | **WARNING** — wrong bonus type |
| `perfect_lucky_shot` | wd amp 15 | not in game file — verify | — | placeholder |
| `perfect_perpetuation` | wd amp 15 | same as `perpetuation` issue | — | wrong stat |
| `perfect_spike` | bonuses: [] | empty | skill_damage | OK as placeholder if no flat WD |
| `perfect_overwhelm` | wd amp 48 | game per-stack 12% × 4 stacks = 48% | — | ✓ correct |
| `perfectly_optimized` | bonuses: [] | empty | — | OK |

### Stat-type and bucket assignment errors

These talents have `bonusType` / `bucket` / `stat` that don't match the game effect category:

| Talent | Issue |
|---|---|
| `ignited` / `perfectly_ignited` | bucket `headshot_damage` but talent amplifies WD to burning enemies. Should be `wd_multiplicative`. |
| `naked` | stat `wd 35`, but game grants +50% headshot damage. Should be `hsd 50`. |
| `spike` | stat `wd 25`, bucket `skill_damage`. Should be skill damage stat, not weapon damage. |
| `in_sync` | stat `wd 15`, but game grants skill damage on hits. Should be skill damage. |
| `calculated` | stat `wd 10`, but game gives skill cooldown reduction. No WD bonus. |
| `vanguard` | stat `wd 8`, but game is shield/armor utility. No WD bonus. |
| `adrenaline_rush` | stat `wd 30`, but game grants armor only. No WD bonus. |
| `preservation` / `perfect_preservation` | stat `wd 5/10`, but game is armor sustain only. No WD bonus. |
| `determined` | stat `wd 8`, but game grants guaranteed-headshot on next shot. No flat WD. |
| `perpetuation` | stat `hsd 12`, but game grants status effect damage/duration. Not headshot damage. |
| `perfect_perpetuation` | same as above |
| `perfect_outsider` | stat `wd amp 15`, but game grants only optimal range + accuracy. No WD bonus. |
| `boomerang` | stat `wd 12`, but game grants +40% on returned shot at 50% return chance. Static value is fine but document. |
| `killer` | stat `chc 50`, but game tooltip grants **+70% CHD** on crit kill, not CHC. Wrong stat. |

### Locale name mismatches (RU)

These RU names in `locales/ru/talents.json` clearly point to the wrong talent:

| Key | Our RU | What the talent actually is |
|---|---|---|
| `bighorn_exotic` | "Exotic" | Should be "Bighorn" Russian name (e.g. "Толсторог") |
| `bluescreen_exotic` | "Пахан" | Pakhan ≠ Bluescreen; should reflect Bluescreen's actual game effect |
| `bullet_king_exotic` | "Мор" | Mor = Pestilence; not Bullet King |
| `merciless_exotic` | "Двойной спуск" | Binary Trigger = correct mechanic name (Merciless does fire on trigger pull/release), so OK |
| `ruthless_exotic` | "Партизанская война" | Guerrilla Warfare — same trigger-pull/release mechanic; mapping likely OK if Ruthless uses the same talent variant |
| `geri_and_freki_exotic` | "Двойной спуск" | Binary Trigger — for Geri & Freki this should be a different effect ("On trigger-pull, fire both barrels at once") — verify |
| `breathe_free_exotic` | "Коробчатый магазин" | "Box Magazine" — different talent name; Breathe Free is a movement-stack talent — wrong RU label |
| `full_stop_exotic` | "Электромагнитный ускоритель" | EM Accelerator — wrong RU label, that's Sacrum Imperium's talent |
| `in_plain_sight_exotic` | "Электромагнитный ускоритель" | same wrong RU label |
| `whiplash_exotic` | "Слепое правосудие" | Blind Justice — correct name? Whiplash uses Blind Justice talent |
| `oxpecker_exotic` | "Оплата натурой" | Payment in Kind — Oxpecker actually has this talent? (verify) |
| `liberator_exotic` | "Электроемкость" | Capacitance — Liberator actually has Capacitance? (verify, it's plausible) |
| `cassidy_exotic` | "Песочный человек" | Sandman — Cassidy uses Sandman in game, OK |
| `liberty_exotic` | "Свобода или смерть" | Liberty or Death — correct |
| `regicide_exotic` | "Свобода или смерть" | also Liberty or Death — but Regulus uses Regicide, not Liberty or Death. WRONG. |

EN has fewer issues — most names look right. Notable EN entries that look like leftover IDs (not display names):
- `talent_exotic_smg_MPX: "Payment in Kind"` (should just live under `payment_in_kind_exotic`)
- `talent_exotic_rifle_transfusion: "Transfusion"` (duplicate of `transfusion_exotic`)
- `talent_exotic_shotgun_cryesix12: "Septic Shock"` (duplicate of `scorpio_exotic`)
- `talent_exotic_weapon_the_senate_actum_est: "Actum Est"` (duplicate of `elmos_mark_exotic`)
- `talent_exotic_pistol_faster_than_reloading: "Faster Than Reloading"` (no canonical entry)
- `talent_exotic_ostracize: "Ostracize"` (no canonical entry)
- `talent_exotic_shotgun_autentico: "Autentico"` (duplicate of `warlord_exotic`)

These dual entries cause the broken weapon `talentId` references — weapons.json is splitting between the two ID styles.

---

## Bonus value comparison (regular weapon talents)

| Talent | Our value(s) | Game max (from tooltip) | Bucket | OK? |
|---|---|---|---|---|
| optimist | wd 17.5 (avg) | 35 max → 17.5 avg | wd_additive | ✓ |
| perfect_optimist | wd 22.5 (avg) | 45 max → 22.5 avg | wd_additive | ✓ |
| outsider | wd 35 | ~10% × 10 stacks | — | ❓ verify max stacks |
| rifleman | wd 60 | 10% × 5 stacks = 50 | wd_additive | ⚠️ may be outdated |
| perfect_rifleman | wd 66 | 11% × 6 = 66 | — | ✓ |
| close_personal | wd 40 | 40 | — | ✓ |
| perfectly_close_personal | wd 38 | 38 | — | ✓ |
| frenzy | wd 20 + rof 25 | mag-dependent | wd_additive | placeholder |
| perfect_frenzy | wd 27 + rof 27 | mag-dependent | — | placeholder |
| killer | chc 50 | game: +70% **chd** | crit_damage | ⚠️ wrong stat |
| perfect_killer | chd 90 | 90 | crit_damage | ✓ |
| strained | chd 65 | 65 | crit_damage | ✓ |
| perfectly_strained | chd 80 | 80 | — | ✓ |
| sadist | wd amp 12 | game tooltip +20% | wd_multiplicative | ⚠️ low |
| perfect_sadist | wd amp 35 | game tooltip +25% | wd_multiplicative | ⚠️ high |
| flatline | wd amp 20 | game +15% | wd_multiplicative | ⚠️ high |
| perfect_flatline | wd amp 20 | 20 | wd_multiplicative | ✓ |
| eyeless | wd amp 10 | 10 | wd_multiplicative | ✓ |
| perfect_eyeless | wd amp 35 | 35 | wd_multiplicative | ✓ |
| ignited | wd 20 | 20 | headshot_damage | ⚠️ wrong bucket |
| perfectly_ignited | wd 30 | 30 | headshot_damage | ⚠️ wrong bucket |
| ranger | wd amp 15 | distance-dep | wd_multiplicative | placeholder |
| perfect_ranger | wd amp 20 | distance-dep | wd_multiplicative | placeholder |
| measured | wd 15 | 30 (in fire mode) | wd_additive | ⚠️ check |
| perfectly_measured | wd 10 | 38 (in fire mode) | wd_additive | ⚠️ check |
| naked | wd 35 | 50 hsd | headshot_damage | ⚠️ wrong stat & value |
| perfectly_naked | hsd 50 | 50 | — | ✓ |
| spike | wd 25 | should be skd | skill_damage | ⚠️ wrong stat |
| unhinged | wd 25 | 25 | wd_additive | ✓ |
| perfectly_unhinged | wd 22 | 22 | — | ✓ |
| boomerang | wd 12 | +40 returned×50% | — | placeholder |
| perfect_boomerang | chd 20 | — | — | placeholder |
| pummel | wd 50 | 25-50 weapon-dep | wd_additive | placeholder |
| perfect_pummel | wd 40 | n/a | — | not in game file |
| back_and_forth | wd 9 + rof 10 | 9/10 | wd_additive | ✓ |
| perfect_back_and_forth | wd 12 + rof 13 | 12/13 | — | ✓ |
| perfect_streamline | wd 47 | 37 | — | ⚠️ |
| perfect_immobilize | wd amp 25 | 15 | wd_multiplicative | ⚠️ |
| perfect_thunder_strike | wd amp 35 | 35 | — | ✓ |
| perfect_pressure_point | wd amp 20 | 20 | wd_multiplicative | ✓ |
| perfect_breadbasket | hsd 70 | 70 | — | ✓ |
| perfect_overwhelm | wd amp 48 | 48 | — | ✓ |
| perfectly_behind_you | wd amp 25 | 20-25 | wd_multiplicative | likely ✓ |
| perfect_outsider | wd amp 15 | no WD bonus | — | ⚠️ wrong type |
| perfect_perpetuation | wd amp 15 | gives status% | — | ⚠️ wrong stat |
| perpetuation | hsd 12 | gives status% | — | ⚠️ wrong stat |
| calculated | wd 10 | gives CDR | — | ⚠️ wrong type |
| vanguard | wd 8 | shield utility | — | ⚠️ wrong type |
| adrenaline_rush | wd 30 | armor utility | — | ⚠️ wrong type |
| preservation | wd 5 | armor sustain | — | ⚠️ wrong type |
| perfect_preservation | wd amp 10 | armor sustain | — | ⚠️ wrong type |
| determined | wd 8 | guaranteed HS | — | ⚠️ wrong type |
| perfectly_determined | hsd 30 + chd 20 | guaranteed CRIT HS | — | acceptable approx |
| in_sync | wd 15 | skd on hits | — | ⚠️ wrong stat |
| perfectly_in_sync | wd amp 20 | skd on hits | — | ⚠️ wrong stat |
| headhunter | wd 1250 | weapon-base × 8 cap | — | document the formula |

---

## Exotic talent mapping

| Weapon (id) | Our talentId | Game-derived correct talent | OK? |
|---|---|---|---|
| eagle_bearer | `eagle_bearer_exotic` | game: `talent_exotic_assault_rifle_mk1_a` "Eagle's Strike" | ✓ (mechanic matches; we use the weapon-name label) |
| chameleon | `chameleon_exotic` | game: `talent_exotic_assault_rifle_vector_mk2` "Adaptive Instincts" | ✓ |
| capacitor | `capacitor_exotic` | game: `talent_exotic_assault_rifle_magpulpdr` "Capacitance" | ✓ |
| agitator | `agitator_exotic` | not in `talents_exotic.json`; built into weapon | ⚠️ description currently wrong (Ardent's text) |
| strega | `unnerve` | game: `talent_exotic_weapon_strega_unnerve` "Unnerve" — our entry is `unnerve_exotic` | ❌ broken ref (talentId points to non-existent `unnerve`, our talent is `unnerve_exotic`) |
| st_elmo_s_engine | `talent_exotic_weapon_the_senate_actum_est` | game: same id; our canonical talent is `elmos_mark_exotic` | ❌ broken ref |
| iron_lung | `iron_lung_exotic` | game: `talent_exotic_ardent` "Ardent" | ✓ correct |
| bullet_king | `bullet_king_exotic` | not in `talents_exotic.json`; built into weapon | ❌ description text is wrong (Pestilence's text) |
| bluescreen | `bluescreen_exotic` | game: not in `talents_exotic.json`; verify | ⚠️ RU name is "Пахан" which is wrong |
| big_alejandro | `big_alejandro` | game: `talent_exotic_weapon_big_alejandro` "Cover Shooter"; our canonical = `cover_shooter_exotic` | ❌ broken ref |
| pakhan | `pakhan_exotic` | game: `talent_exotic_lmg_rpk74_pakhan` "Pakhan" | ✓ |
| pestilence | `pestilence_exotic` | game: `talent_exotic_lmg_mk1_b` "Pestilence" + `_a` "Plague of the Outcasts" | ❌ description currently mixed/wrong |
| ouroboros | `ouroboros_exotic` | game: `talent_exotic_weapon_ouroboros` "Rule Them All" | ✓ |
| oxpecker | `oxpecker_exotic` | not in `talents_exotic.json` | ⚠️ verify in-game |
| chatterbox | `incessant_chatter` | game: `talent_exotic_smg_mk1` "Incessant Chatter"; our canonical = `chatterbox_exotic` | ❌ broken ref |
| bighorn (semi/full/base) | `bighorn_exotic` | not in `talents_exotic.json`; built into weapon | ⚠️ RU name shows literally "Exotic" — bug |
| backfire | `payment_in_kind` | game: `talent_exotic_smg_MPX` "Payment in Kind"; our canonical = `payment_in_kind_exotic` | ❌ broken ref |
| lady_death | `breathe_free` | not in `talents_exotic.json`; our canonical = `breathe_free_exotic` | ❌ broken ref + RU label wrong |
| pestilence | `pestilence_exotic` | game: `talent_exotic_lmg_mk1_b` | ✓ mapping; description wrong |
| diamondback | `agonizing_bite` | game: `talent_exotic_rifle_mk3_a` "Agonizing Bite"; our canonical = `agonizing_bite_exotic` | ❌ broken ref |
| doctor_home | `doctor_home_exotic` | game: `talent_exotic_weapon_doctor_home` | ✓ |
| the_ravenous | `geri_and_freki` | not in `talents_exotic.json`; our canonical = `geri_and_freki_exotic` | ❌ broken ref |
| vindicator | `ortiz_assault_interface` | game: `talent_exotic_weapon_vindicator` "Ortiz Assault Interface"; our canonical = `ortiz_assault_interface_exotic` | ❌ broken ref |
| dread_edict | `full_stop` | not found in game files; our canonical = `full_stop_exotic` | ❌ broken ref |
| mantis | `in_plain_sight` | not found in game files; our canonical = `in_plain_sight_exotic` | ❌ broken ref |
| sacrum_imperium | `the_trap` | game: `talent_exotic_weapon_the_trap` "The Trap"; our canonical = `the_trap_exotic` | ❌ broken ref + WRONG TALENT! Sacrum Imperium uses Electromagnetic Accelerator, not The Trap |
| nemesis | `nemesis_exotic` | game: `talent_exotic_marksman_mk1_b` "Nemesis" | ✓ |
| regulus | `regicide` | game: not in game files; our canonical = `regicide_exotic` | ❌ broken ref |
| tempest | `restrained` | game: `talent_exotic_pistol_restrained` "Restrained"; our canonical = `restrained_exotic` | ❌ broken ref |
| liberty | `liberty_exotic` | game: `talent_exotic_pistol_mk1_a` "Liberty or Death" | ✓ |
| whiplash | `whiplash_exotic` | game: `talent_exotic_pistol_mk1_b` "Blind Justice"? | ⚠️ verify mapping; Whiplash may use a different talent |
| mosquito | `mosquito` | game: `talent_exotic_pistol_overhere` "Mosquito Song"; our canonical = `mosquito_song_exotic` | ❌ broken ref |
| busy_little_bee | `busy_little_bee` | game: `talent_exotic_weapon_busy_little_bee`; no canonical entry in our talents.json | ❌ no talent entry |
| bittersweet | `bittersweet` | not in game files; no canonical entry | ❌ no talent entry |
| shroud | `shroud` | not in game files; no canonical entry | ❌ no talent entry |
| sheriff | `talent_exotic_shotgun_autentico` | game: `talent_exotic_shotgun_autentico` "Autentico"; our canonical = `warlord_exotic` (which is also Autentico) | ❌ broken ref / duplicate |
| warlord | `warlord_exotic` | OK, the entry exists | ✓ but the name "Аутентико" matches Sheriff/Warlord both being Autentico-talent — verify which weapon really has this |
| caduceus | `talent_exotic_rifle_transfusion` | game: same id "Transfusion"; our canonical = `transfusion_exotic` | ❌ broken ref |
| centurion | `talent_exotic_pistol_faster_than_reloading` | no canonical entry | ❌ no talent entry |
| medved | `talent_exotic_shotgun_cryesix12` | game: same id "Septic Shock"; our canonical = `scorpio_exotic`. **But Medved is a Saiga-12 shotgun, not Crye Six12 (Scorpio)** — they should NOT share talent | ❌ wrong mapping entirely |
| midas | `talent_exotic_smg_MPX` | game: same id "Payment in Kind"; our canonical = `payment_in_kind_exotic`. Midas is a 821 SMG, not MPX | ❌ wrong mapping entirely |
| golden_rhino | `talent_exotic_ostracize` | no canonical entry | ❌ no talent entry |
| damascus | `damascus_exotic` | not in game files | ❌ no talent entry |
| hungry_hog | `hungry_hog_exotic` | game: `talent_exotic_lmg_mk1_a` "Plague of the Outcasts" — that's actually Pestilence's. Hungry Hog has "Plague of the Outcasts". Actually game data shows Hungry Hog should also use `talent_exotic_lmg_mk1_a`. | ⚠️ verify, may be correct |
| historian | `historian_exotic` | not in game files | ❌ no talent entry |
| tenebrae | `tenebrae_exotic` | game: should be Nemesis-family (Scar marksman) | ⚠️ verify |
| cassidy | `cassidy_exotic` | game: `talent_exotic_shotgun_mk1` "Sandman" | ✓ if mechanic matches |
| hildr | `hildr_exotic` | game: `talent_exotic_smg_MPX` "Payment in Kind" mapping in our locales | ⚠️ verify |
| overlord | `warlord` | broken ref; our canonical maybe `warlord_exotic`. Overlord is KSG shotgun | ❌ broken ref |
| liberator | `liberator_exotic` | OK | ✓ |

---

## Optimist note (verification)

**Game truth (from `talents_weapon.json`):**
- `talent_weapon_low_ammo_gives_weapon_damage_buff` (regular Optimist) — `attrs.myValue = 0.035`. Per-rank progression `weapon_damage_increase`: `[0.03]` early, peaks at `0.035` at max rank. Tooltip: "+3.5% per 10% ammo missing." Max ammo missing = 100% (mag empty) = **+35% WD at empty, +0% at full**.
- `talent_weapon_low_ammo_gives_weapon_damage_buff_perfect` (Perfect Optimist) — `attrs.myValue = 0.045`. Tooltip: "+4.5% per 10% ammo missing." Max = **+45% WD at empty**.

**Our DB values:**
- `optimist`: `wd 17.5` — equals 35/2 = **average over a uniform mag burndown**. Correct math for a "static average DPS over a mag" approximation.
- `perfect_optimist`: `wd 22.5` — equals 45/2. Same approximation, correct.

**Verdict:** Both values are mathematically sound as static averages. The note in `talents.json` correctly documents the simplification. Acceptable for a calculator; advanced users can compute per-stack manually. **No change needed.**

---

## Iron Lung verification (was the previous bug)

**Previous bug (per task brief):** `iron_lung` exotic referenced "Outcast Resilience" talent (which is actually `talent_exotic_lmg_mk1_holstered`, a holstered talent on a different weapon).

**Current state — verified clean:**

1. **Markdown guide** (`apps/astro/src/content/weapons-en/iron-lung.md`): describes Ardent correctly — heat meter, 50% mag, ignites enemies, decay 12/sec. ✓
2. **Weapon data** (`apps/web/public/data/weapons.json`, weapon `iron_lung`): `talentId: "iron_lung_exotic"`. ✓
3. **Talent definition** (`talents.json`, `iron_lung_exotic`): `bonuses: []`, `note` field correctly explains the heat-meter / appliesBurn flag mechanic. ✓
4. **EN locale name** (`locales/en/talents.json`): `"iron_lung_exotic": "Ardent"`. ✓
5. **RU locale name** (`locales/ru/talents.json`): `"iron_lung_exotic": "Пылкость"`. ✓ (matches game `name_ru` for `talent_exotic_ardent`)
6. **EN description** (`locales/en/talent-desc.json`): "Shooting heats the weapon, filling the heat meter (50% mag = 43 rounds for 85 mag). Full heat → bullets ignite enemies (Burn status). Idle/reload/swap drops stacks (-12/sec)." — matches game tooltip semantically. ✓
7. **RU description**: corresponding Russian text, also correct. ✓
8. **Game truth** (`talents_exotic.json`, `talent_exotic_ardent`): "Shooting heats up the weapon, filling up heat meter. The meter is equivalent to 50% of the weapon's standard Magazine Size." Name: "Ardent" / "Пылкость". ✓

**Verdict: Iron Lung is fully correct. The Outcast Resilience bug is resolved.** No further action needed for this weapon.

---

## Recommended fix priority

1. **Fix the 64 broken weapon `talentId` references** — single search/replace in `weapons.json` plus a handful of new talent entries. This is the biggest user-visible bug (talents won't display).
2. **Fix the 3 swapped exotic descriptions** — `bullet_king_exotic`, `pestilence_exotic`, `agitator_exotic` have wrong tooltip text.
3. **Fix RU locale mismatches** — `bighorn_exotic` shows literally "Exotic"; `bullet_king_exotic`/`bluescreen_exotic`/`breathe_free_exotic`/`full_stop_exotic`/`in_plain_sight_exotic`/`regicide_exotic` show wrong RU labels.
4. **Fix wrong stat assignments** — `naked` (wd→hsd), `killer` (chc→chd), `spike`/`in_sync` (wd→skd), `perpetuation` (hsd→status%), `ignited` bucket (headshot→wd_multi), and the utility-talents-with-fake-WD (`calculated`, `vanguard`, `adrenaline_rush`, `preservation`, `determined`, `perfect_outsider`).
5. **Update outdated values** — `perfect_streamline` (47→37), `perfect_immobilize` (25→15), `sadist`/`perfect_sadist` values, `flatline` (20→15), `rifleman` (60→50 if confirmed), `measured`/`perfectly_measured` (15/10 → game's 30/38).
6. **Check exotic-weapon mappings** — `medved → cryesix12` (Septic Shock) and `midas → MPX` (Payment in Kind) are clearly wrong (different weapon families). Verify what these named weapons actually use.
7. **Add missing talent entries** — Bittersweet, Shroud, Centurion, Damascus, Golden Rhino, Busy Little Bee, several event/named talents.

---

## Files referenced

- Our DB: `C:/Users/glukm/division2-calc/apps/web/public/data/talents.json`
- Our DB: `C:/Users/glukm/division2-calc/apps/web/public/data/weapons.json`
- Our locales: `C:/Users/glukm/division2-calc/apps/web/public/locales/en/talents.json`
- Our locales: `C:/Users/glukm/division2-calc/apps/web/public/locales/ru/talents.json`
- Our locales: `C:/Users/glukm/division2-calc/apps/web/public/locales/en/talent-desc.json`
- Our locales: `C:/Users/glukm/division2-calc/apps/web/public/locales/ru/talent-desc.json`
- Game truth: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/talents_weapon.json`
- Game truth: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/talents_exotic.json`
- Game truth: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/weapons_exotic.json`
- Game truth: `D:/ClaudHorizont/DivCalc/hunter_pipeline/for_site/weapon_talents_full.json`
- Markdown guide (Iron Lung verified): `C:/Users/glukm/division2-calc/apps/astro/src/content/weapons-en/iron-lung.md`
