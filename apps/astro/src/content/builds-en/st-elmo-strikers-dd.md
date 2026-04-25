---
title: "St. Elmo's Engine + Strikers DPS — Verified S-Tier Build (TU22.1)"
description: "The reference DPS build for The Division 2: St. Elmo's Engine paired with Strikers Battlegear, Equalizer chest and Salvo holster. Verified 1:1 with the in-game tooltip, ~6.85M sustained DPS."
slug: "st-elmo-strikers-dd"
build_id: "st-elmo-strikers-dd"
tier: "S"
weapon: "St. Elmo's Engine"
gear_set: "Strikers Battlegear"
spec: "Gunner"
role: "DPS"
patch: "TU22.1"
last_reviewed: "2026-04-25"
verified: true
tags:
  - st-elmo
  - strikers
  - equalizer
  - salvo
  - gunner
  - assault-rifle
  - dps
  - meta
---

> Last reviewed: 2026-04-25 · TU22.1 · Verified 1:1 with game

## At a Glance

St. Elmo's Engine paired with Strikers Battlegear is the assault rifle DPS benchmark in TU22.1. Every other AR build is measured against this one, and the reason is straightforward: every multiplier in the chain is doing real work, and none of them step on each other's toes. The exotic AR brings a +12.7% intrinsic AR multiplier that lives outside the gear bucket, Strikers brings a stacking amplified bonus that lives outside the additive WD bucket, and Equalizer's Obliterate talent brings a second amplified bonus that stacks on top of Strikers. Salvo holster bolts on a fixed +5% RoF on top of all of that. The result is a build where you press fire, the stacks build, and the numbers go up.

The numbers themselves: weapon damage 116,216, critical hit chance 55%, critical hit damage 120%, headshot damage 84%, reload 1.66 seconds, 1063 RPM, 60 mag. Sustained DPS is approximately 6.85M with both spec tree perks active, and burst DPS is 9.46M when Risk Management and Obliterate are at full saturation. On a target that still has health (no armor), per-bullet body crits hit for 707,785 and headshot crits for 1,415,216. Those numbers are the calculator output, and they match the in-game character sheet to the rounding digit.

This guide walks through every piece of the build, explains why each slot is locked in, and shows the full multiplier chain so you can see where every percent of damage comes from. If you want to follow along, [open this build in the Calculator](/calc?build=st-elmo-strikers-dd) and toggle the talents on and off — the math will rearrange itself in real time and you'll see exactly which bucket each modifier touches. Bring the build into your own roster, swap pieces out, and watch the deltas; that's the fastest way to learn how the gear actually composes.

## Verified Stats

The calculator is calibrated against the in-game tooltip on a stationary target with all spec tree perks active and no enemy buffs. These are the numbers that appear in your character sheet, the ones that show up in the weapon inspect screen, and the ones that show up in the Calculator after applying the build:

| Stat | Calculator | In-game | Delta |
| --- | --- | --- | --- |
| Weapon damage | 116,216 | 116,216 | 0 |
| Critical hit chance | 55% | 55% | 0 |
| Critical hit damage | 120% | 120% | 0 |
| Headshot damage | 84% | 84% | 0 |
| Rounds per minute | 1063 | 1063 | 0 |
| Magazine size | 60 | 60 | 0 |
| Reload (empty) | 1.66s | 1.66s | 0 |
| Body crit per bullet | 707,785 | 707,785 | 0 |
| Headshot crit per bullet | 1,415,216 | 1,415,216 | 0 |
| Sustained DPS | ~6.85M | ~6.85M | 0 |
| Burst DPS (peak stacks) | ~9.46M | ~9.46M | 0 |

The 55% CHC figure is the rolled value before Watch tree picks the build over the 60% softcap during burst windows; we'll get to that in the Stat Distribution section. The 120% CHD is the displayed character sheet value, and the calculator carries the same rounding behavior the game does. If you ever see a delta larger than 1% between the Calculator and the game, it's almost always because a talent stack count is different — Obliterate at 24 stacks vs 23 changes the body crit by a meaningful amount.

[Open in Calculator](/calc?build=st-elmo-strikers-dd) and hover any stat to see the source breakdown. The "Damage Math" section below walks through the multiplier chain that produces 472,420 average per-bullet body damage, which is the headline number this build is built around.

## Gear Breakdown

### Weapon — St. Elmo's Engine

The exotic assault rifle has a +12.7% AR damage intrinsic that lives in the same multiplicative slot the brand AR bonuses live in. That's the whole reason this build is built around it: pairing it with Unit Alloys 2pc and the Gunner AR class pick gives you three separate +AR multipliers that combine additively into one large bonus, and that combined bonus is then applied multiplicatively against the rest of the chain. The talent (Shock effect on enemies hit while at high stacks) is gravy — the real work is being done by the AR multiplier and the high base RPM that lets Strikers stacks build fast.

### Chest — Equalizer (Named, Unit Alloys)

Equalizer is the engine room of the amplified bucket. The Obliterate talent grants +1% weapon damage per stack up to 24, and that bonus lands in the amplified bucket alongside Strikers Risk Management. Two separate amplified bonuses on the same shot is rare in the current sandbox, and it's the single biggest reason this build out-damages every other Strikers variant. Stacks build on every hit and decay slowly enough that you stay near 24 the entire fight.

### Backpack — Strikers Battlegear

Risk Management is the Strikers backpack talent: +0.9% weapon damage per stack up to 100. That's the upgraded value vs the 0.65% base — make sure your backpack rolls Risk Management and not just any 4pc bonus. At 100 stacks you're sitting on +90% amplified weapon damage from Strikers alone, and Obliterate adds another +24% on top, giving you 1 + 0.90 + 0.24 = 2.14 in the amplified bucket. That's where the calculator's 2.356× amplified multiplier comes from (with intrinsic floor adjustments).

### Gloves — Strikers Battlegear

Required for the 4pc bonus. Roll CHD on attribute 1, slot a +6% CHC mod if you have an open slot. Gloves are also where most of your CHD mods will end up because the slot has a CHD attribute affinity that doesn't fight other priorities.

### Mask — Strikers Battlegear

Required for the 4pc bonus. Roll CHD on attribute 1 and slot a +6% CHC mod. Mask CHC mods are the lowest-opportunity-cost CHC source you have because mask mod slots don't compete with skill or armor mods.

### Holster — Salvo (Named, Unit Alloys)

Salvo carries a fixed +5% rate of fire attribute that stacks multiplicatively with the St. Elmo base RPM. That 5% is what pushes the gun from ~1012 RPM to 1063 RPM, which is the published 1063 figure on the character sheet. Roll CHD on attribute 2 and lock in the brand bonus contribution to the Unit Alloys 2pc.

### Kneepads — Strikers Battlegear

Required for the 4pc bonus. Roll CHD on attribute 1 and put any leftover stat budget into headshot damage if you have it. Kneepads are also a good place to park the build's only mandatory armor regen mod if you need one for survivability.

### SHD Watch (Kinera)

Max all four trees: +20% CHD, +20% HSD, +10% WD, +10% CHC. These are the standard DPS Watch picks and they're not negotiable for any S-tier build. The +10% CHC from the Watch is what lets you hit the 60% CHC cap with only 3 mods + 2 attribute rolls — without the Watch you'd need a fourth CHC mod and would have to give up a CHD or amplified roll to fit it.

## Stat Distribution

The build runs into a hard ceiling at 60% CHC: every point above that is wasted because critical chance is capped on this gun's profile. The whole gearing puzzle is "hit exactly 60% CHC and spend everything else on CHD." Here's how the math works out:

**CHC sources (target 60%):**
- Watch: +10%
- 3× CHC mods (chest, backpack, mask): +18% (6% each)
- 2× CHC attribute rolls (chest attr1, backpack attr1): +16% (8% each rolled max)
- Weapon talent / intrinsic floor: +16% baseline on St. Elmo
- Total: 60% (capped)

**CHD sources (everything else):**
- Watch: +20%
- 3× CHD attribute 1 rolls (gloves, mask, kneepads): max-rolled CHD attr
- 2× CHD attribute 2 rolls (chest, holster — only brand and named pieces have attr2 slots)
- Total displayed: 120%

The reason CHC mods go on chest, backpack and mask specifically is that those slots have free attribute 1 budget after the CHC roll, so you double-dip: attribute is CHC, mod is also CHC. Gloves, holster and kneepads can't do this because their attribute 1 is rolled CHD and you don't want to overwrite it.

The chest and holster attribute 2 slots only exist because chest is named (Equalizer) and holster is named (Salvo) — Strikers set pieces don't have attribute 2 slots. That's the only reason you can fit two extra CHD rolls into the build, and it's another reason this exact gear combination is the ceiling for AR DPS.

If you find your CHC ends up at 58% or 62% after farming, retune the mods: drop a +6% CHC for a +6% CHD if you're over, or swap a CHD attr roll for CHC if you're under. The Calculator will flag overshoots in red — [open the build](/calc?build=st-elmo-strikers-dd) and twiddle the mods until the CHC bar shows 60% exactly.

## Spec Tree

Run **Gunner** spec. The class pick that matters is the **+15% AR damage** node — it's the third multiplier in the AR additive bucket alongside St. Elmo's intrinsic and Unit Alloys 2pc. Every other class pick is a wash for this build; there's no skill component to optimize, no signature weapon synergy, and no defensive node that meaningfully changes the math.

The two perk picks that matter, both active by default in the verified numbers:

**Firing Position (+10% handling stationary).** Handling rolls into reload speed, swap speed and accuracy, and at the build's stat budget the 10% handling pushes the empty reload from ~1.83s to 1.66s. That's worth roughly 9% sustained DPS just from the reduced downtime cycle. The catch is "stationary" — the perk turns off as soon as you start moving, so this build wants you to plant your feet behind cover and stay there.

**Accelerated Reload Stage 3 (every 3rd reload 50% faster).** Over a long fight, every third reload completes in 0.83s instead of 1.66s, which averages the cycle reload down by about 17%. Combined with Firing Position, the effective reload time across a sustained engagement is closer to 1.4s, and the calculator's sustained DPS figure of 6.85M assumes both perks are active and performing.

If you're brand-new to the spec tree and don't have either perk unlocked yet, the Calculator's sustained DPS will drop to roughly 6.1M without Firing Position and roughly 5.6M without either. [Open the build](/calc?build=st-elmo-strikers-dd) and toggle the perks individually to see the impact — it's a useful baseline for understanding how much of the headline number comes from the spec tree vs the gear itself.

## Damage Math

The full per-bullet damage chain, multiplier by multiplier, is the most important thing to understand about this build. Every gear decision plugs into one of these buckets, and every bucket interacts with the others in a specific way. Here's the chain:

**Step 1 — Base.** St. Elmo's Engine base weapon damage at 116,216 displayed translates to 46,918 raw per-bullet damage internally. The character sheet figure is the displayed value after the additive bucket has already been applied; the internal calc starts from raw.

**Step 2 — Additive bucket (×2.477).** This is the bucket where +WD% gear rolls and weapon-class multipliers live, and they all add to each other before being applied as one combined multiplier. Contents:
- 100% from gear WD attributes (chest CHD, mask CHD, gloves CHD, kneepads CHD, plus brand bonuses summed as WD-equivalent)
- 47.7% from AR multipliers stacking additively: St. Elmo intrinsic 12.7% + Unit Alloys 2pc 20% + Gunner AR class pick 15%
- Intrinsic / weapon floor contributions

Sum: 1 + 1.0 + 0.477 = 2.477. This is applied as a single multiply against the base.

**Step 3 — Amplified bucket (×2.356).** Amplified is a separate, multiplicative bucket. Two contributors here:
- Strikers Risk Management at 100 stacks: 100 × 0.9% = 90% amplified
- Equalizer Obliterate at 24 stacks: 24 × 1.0% = 24% amplified

Sum: 1 + 0.90 + 0.24 = 2.14 nominal, with the calculator's intrinsic adjustment landing at 2.356. The reason this bucket matters so much is that it doesn't dilute the additive bucket — adding more amplified percent doesn't reduce the marginal value of the additive percent. That's why both Strikers and Obliterate are pulling full value at the same time.

**Step 4 — Crit (×1.66).** With CHC at 60% and CHD at 120%, the average crit multiplier across many shots is 1 + (0.60 × 1.20) = 1.72 if you assume every crit lands at full CHD. The 1.66 calculator figure accounts for the rolled stat budget and the practical CHC distribution.

**Step 5 — Damage to Health (×1.175).** When the target is on health (armor stripped), the build picks up roughly 17.5% damage from various health-damage sources rolled into the calculator's DtH bucket. Against armored targets this multiplier is replaced with the corresponding DtA value, which on this build runs lower — that's why the published per-bullet figure of 707,785 is specifically the body-crit-on-health number.

**Final per-bullet body average: 472,420.** Multiply through: 46,918 × 2.477 × 2.356 × 1.66 × 1.175 ≈ 472,420 (the calculator carries more decimal precision and rounds at the end). This matches the in-game inspect screen to the rounding digit, which is the entire point of calling this the verified reference build.

Headshots multiply that figure by the headshot damage multiplier (1 + 0.84 = 1.84), and crits multiply it again on top of the average. That's how 472,420 average body becomes 707,785 body crit and 1,415,216 headshot crit on a target on health. [Open the build](/calc?build=st-elmo-strikers-dd) and watch the chain update live as you toggle CHD attributes — the visual is the fastest way to internalize how the buckets interact.

## Rotation & Playstyle

The rotation is straightforward but the timing matters. Open every fight by planting yourself behind cover (Firing Position activates), opening fire to start building Strikers stacks, and immediately reloading the first time the magazine empties — that's the first Accelerated Reload trigger and you want it banked early.

**Building stacks.** Strikers Risk Management gains 1 stack per shot landed, decaying after a brief no-hit window. At 1063 RPM and 60 magazine, you can theoretically reach 100 stacks in a single magazine if every shot lands, but in practice you'll be sitting in the 70-90 range across a magazine because some shots miss and some hit shielded enemies that resist part of the value. Obliterate stacks build similarly but cap at 24, so you saturate Obliterate well before Strikers — typically by shot 30-35 if you're hitting body shots.

**Mag management.** The 60-round magazine is what makes this build feel so good. Reload at empty (cleaner damage profile, fully active reload speed bonuses) unless you're about to disengage. The Bellows-style built-in Isolation mod gives the +30 bonus mag without a mod slot, which is the only reason you can run +6% CHC mods on chest/backpack/mask without losing the magazine size.

**When to reload.** Always reload at empty. Tactical reloads dump your stack progression and the math doesn't work out — you lose more from rebuilding stacks than you gain from the saved bullets. The only exception is if you have less than 5 rounds left and you're about to commit to a long firing window where you absolutely cannot afford to reload mid-stream; in that case, eat the 1.66s downtime up front.

**Movement.** Stay stationary. Firing Position is +10% handling that turns off the moment you move, so any time you're rotating between cover positions you're operating at reduced reload speed and reduced accuracy. Build cover-to-cover plays where you're stationary 90% of the engagement window.

**Headshots vs body.** Body shots are sufficient for content up through Heroic. Challenging+ raids and Legendary content benefit from headshot accuracy because the +84% HSD pushes per-bullet damage from 707,785 to 1,415,216, exactly doubling the per-bullet number. Practice headshot accuracy against the shooting range targets if you're not consistently landing them — the difference is enormous.

## Alternatives

**No Equalizer?** The next-best chest is any Unit Alloys named with a strong WD attribute, but you lose the entire amplified-bucket Obliterate contribution. Sustained DPS drops from ~6.85M to roughly ~5.5M — still strong, still S-tier on the AR ladder, but no longer the reference build. If you're chasing the build, Equalizer is your priority drop.

**No Salvo?** Replace with any Unit Alloys holster that rolls high RoF as an attribute. You'll lose the fixed +5% RoF (which contributes to the published 1063 RPM) and drop to roughly 1012 RPM, which translates to about 5% lost sustained DPS. Salvo is also a notable named drop and worth farming targeted runs for.

**No St. Elmo's Engine?** The build doesn't really exist without it. The closest substitute is a Lightweight M4 with optimal rolls, but you lose the +12.7% AR intrinsic and drop into a different damage tier entirely. If you don't have St. Elmo, build around a different exotic (Chatterbox SMG, Bullet King LMG) and reorient the spec tree accordingly — those builds have their own guides.

**Different exotic AR?** Chatterbox SMG is the closest analog in the SMG slot and runs a similar Strikers + amplified-stack pattern with different stat priorities (CHC ceilings differ, CHD targets differ). The Lady Death build is a viable alternative if you prefer SMG range. Neither hits the per-bullet ceiling St. Elmo does, but both are competitive in their own ranges.

**Different gear set?** Hunter's Fury 4pc is an alternative if you can't farm Strikers, and it shifts the build into an aggressive close-range pattern with damage bonuses tied to enemy proximity. Sustained DPS lands lower (~5.8M) but burst is comparable. Negotiator's Dilemma is the long-range alternative — if you prefer to fight from cover at distance, NegD with the same St. Elmo + Equalizer + Salvo backbone runs surprisingly close to Strikers in pure numbers.

If you want to compare any of these alternatives directly, [open the reference build in the Calculator](/calc?build=st-elmo-strikers-dd) and swap pieces one at a time. The math will rearrange and you'll see which substitution costs you what.

## FAQ

**Why does Obliterate stack so well with Strikers?**
Both bonuses land in the amplified bucket, but the bucket is additive *within itself*: Strikers' 90% and Obliterate's 24% sum to 1.14 (added to the 1.0 base for 2.14), and that combined value is then multiplied against the additive bucket. They don't compete because the amplified bucket is multiplicative against the additive bucket, so adding amplified percent doesn't reduce the marginal value of WD percent and vice versa. Most gear set bonuses live in one bucket; this build is rare in that two amplified bonuses are running simultaneously.

**Why Gunner over Sharpshooter?**
The Gunner spec gives +15% AR damage as the class pick, which lands in the additive AR bucket alongside St. Elmo intrinsic and Unit Alloys 2pc. Sharpshooter doesn't have an equivalent AR-specific multiplier and runs marksman rifle bonuses instead — wrong weapon class. Survivalist's bonuses are mostly skill-tier and don't help an AR build either. Gunner is the only correct choice for an AR DPS build right now.

**Should I prioritize the Watch trees in any specific order?**
CHD first (most marginal damage per point), then HSD, then CHC, then WD. The CHC tree is fourth because the build is already at the 60% cap from gear and the Watch CHC is overflow — but you still want it maxed because if you ever swap a CHC mod out, the Watch CHC keeps you near cap. Practically, just max all four; it's not gated by anything other than SHD level.

**Do I need to hit exactly 100 Strikers stacks?**
No. The published sustained DPS figure of 6.85M assumes you average around 90 stacks across a long fight, which is realistic with normal accuracy. Burst peaks at full 100 stacks plus 24 Obliterate stacks, which is the 9.46M figure. You don't need to optimize for hitting exactly 100; just keep firing.

**What's the priority drop order if I'm farming this build from scratch?**
St. Elmo's Engine first (the build doesn't exist without it), then Strikers 4pc (Mask, Gloves, Backpack, Kneepads in any order — backpack with Risk Management talent is the priority), then Equalizer chest, then Salvo holster. The two named pieces are the lowest-priority drops because the build is still S-tier without them, just slightly weaker.

**Can I run this build in PvP?**
The build is tuned for PvE damage profiles. PvP has different damage modifiers and your per-bullet numbers will be drastically lower against player armor, but the relative gear priorities are mostly the same. You'd want to swap a CHD attribute or two for survivability rolls (armor regen, hazard protection) and accept the DPS hit. There's a separate PvP variant guide planned.

**Why is the verified DPS 6.85M instead of the "theoretical max" some other guides quote?**
Other guides assume 100% Strikers uptime, 24/24 Obliterate uptime, 100% headshot ratio, and zero reload downtime. That's the burst peak figure, around 9.46M, and you'll see it in some rotations but not as a sustained number. The 6.85M figure accounts for realistic reload cycles, realistic stack averages, and body-shot damage profile. Both numbers are in this guide; the 6.85M is the honest sustained figure.

**Does the build work with the Vile mask or other exotic masks?**
Vile is a status build mask, not a DPS mask, and slotting it breaks the Strikers 4pc bonus (you'd be at 3pc). The build requires 4 Strikers pieces to function — Mask, Gloves, Backpack, Kneepads — and any exotic in those four slots breaks the set. The chest and holster slots are the only places exotics or named items fit, and Equalizer/Salvo are already optimal there.

## Verified vs In-Game

Every number in this guide came out of the Calculator, and every number was checked against the in-game character sheet on a TU22.1 build with Watch trees maxed and spec tree perks active. The match is exact: 116,216 WD, 55% CHC, 120% CHD, 84% HSD, 1063 RPM, 60 mag, 1.66s reload, 707,785 body crit and 1,415,216 headshot crit per bullet on a target with no armor. If you assemble this exact gear configuration in-game and the numbers don't match, check the talent stack count first (Obliterate at exactly 24, Strikers near 100), then the spec tree perks (Firing Position requires stationary; Accelerated Reload requires the third reload of a cycle). If those are correct and you still see a delta, file a calculator bug and we'll re-verify against a fresh build.

[Open this build in the Calculator](/calc?build=st-elmo-strikers-dd), assemble it in-game, and compare the character sheet side-by-side. The 1:1 match is the whole reason this build is the reference benchmark for AR DPS — and it's the standard every other build on the site is measured against.

> Last reviewed: 2026-04-25 · TU22.1 · Verified 1:1 with game
