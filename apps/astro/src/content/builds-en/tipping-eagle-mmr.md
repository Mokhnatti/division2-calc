---
title: "Tipping Scales × Eagle Bearer — One-Shot MMR Build"
description: "Eagle Bearer paired with Tipping Scales 4pc and Headhunter chest delivers capped per-shot damage that one-shots raid bosses and legendary directive named enemies."
pubDate: 2026-04-25
---

## At a Glance

This is the build that exists to break specific encounters. Tipping Scales provides a stacking +200% Critical Hit Damage ceiling once fully ramped, and Headhunter provides a stored-damage release mechanic that caps at eight times your weapon's base damage. Layer these on Eagle Bearer's already-elite per-shot output and you have a marksman build that does not aim for sustained DPS — it aims for a single trigger pull that removes a named enemy from the encounter before they take a step.

The use case is narrow but powerful: raid boss execution windows, legendary directive named-spawn one-shots, and clutch revives where one shot has to count. In sustained-DPS scenarios it is outclassed by Strikers or Heartbreaker builds, and in clear-speed runs you will be slower than an LMG carry. But the moment a Bulwark Drone Operator spawns at the back of a room with a critical objective, this build deletes them in a single click.

The build asks a lot of the player. You need to land headshot kills consistently to power Headhunter, you need to maintain the Tipping Scales stack ramp without dying, and you need to know exactly when to release the stored shot. Done correctly, this is the most satisfying single-target build in the game's current state.

[Open in Calculator — Tipping Eagle MMR](/calc?weapon=eaglebearer&set=tipping-scales)

## Stats Priority

Marksman builds historically chased Headshot Damage as the dominant attribute, but this specific build inverts that. Headshot Damage is still important, but Critical Hit Damage scales harder once Tipping Scales is fully stacked, and the Headhunter cap calculation has a specific interaction with HSD that we want to engineer carefully.

### Primary stats (in order)

1. **Critical Hit Damage** — primary attribute. Target ceiling around +110% to +120% from gear, plus the +200% from full Tipping Scales stacks gives you an effective ~310% to 320% CHD at peak.
2. **Critical Hit Chance** — target +50% to +60%. You need crit reliability on the headshot kill that loads Headhunter, and the released shot also needs to crit.
3. **Headshot Damage** — target +85% to +100%. The trick: keep HSD above 150% total (including base weapon HSD multiplier from MMR class) to push the Headhunter cap multiplier from x8 to x12.5.
4. **Weapon Damage %** — secondary, target +30% to +45%. Eagle Bearer's base of 70k is the foundation that everything multiplies, so even modest WD% rolls translate into large absolute numbers.
5. **Damage to Targets Out of Cover** — opportunistic. Most named bosses are not in cover at execution time.

### The Headshot Damage threshold

The Headhunter cap formula in TU22 reads:

```
Cap = WeaponBase × 8       if HSD% < 150%
Cap = WeaponBase × 12.5    if HSD% >= 150%
```

Eagle Bearer base is 70,000. So:

- Below 150% HSD: cap = 560,000
- At or above 150% HSD: cap = 875,000

The marksman class talent contributes a base headshot multiplier (~+25% for Sharpshooter spec), and the MMR weapon class itself adds headshot damage on the weapon sheet. Combined with +85% to +100% from gear, you should comfortably crest 150% total and unlock the higher cap.

This single threshold is the most important number in the build. Falling under 150% HSD costs you 56% of your stored damage. Push past it and the build comes online.

### Mods

Critical Hit Damage mods on every offensive slot. Critical Hit Chance mods on the chest and gloves. Magazine size on the weapon (Eagle Bearer's 30-round mag is plenty for a marksman cycle but a +5 round mod gives you breathing room). The remaining utility slots take Skill Haste for hive uptime if you run Reviver.

[Open in Calculator — MMR Stat Sheet](/calc?weapon=eaglebearer&stat=crit)

## Gear Loadout

The gear set is locked: 4pc Tipping Scales is the entire premise of the build. The flex pieces are the chest and backpack, where talents matter more than brand bonuses.

### Tipping Scales 4pc

The 4pc bonus stacks +1% Critical Hit Damage per stack, with a maximum of 200 stacks reached through sustained marksman fire on the same target. The stacks build slowly — roughly one stack per shot landed on a single target — so you need a ramp window before any execution attempt.

- 1pc: Tipping Scales mask (CHC)
- 2pc: Tipping Scales gloves (CHD)
- 3pc: Tipping Scales backpack (CHD or talent slot)
- 4pc: Tipping Scales knee pad (CHC)

This leaves chest and holster open.

### Chest — Headhunter (mandatory)

Headhunter is the entire point of the holster swap. The talent stores the damage of your last headshot kill and applies it to your next non-killing hit at a 1.25x multiplier (1.50x if Perfect-rolled). The combination with Eagle Bearer's per-shot output produces the capped 875,000 damage release that defines the build.

Chest brand does not matter as long as the talent is Headhunter or Perfect Headhunter. Run whatever brand provides Critical Hit Damage on the chest core attribute.

### Holster — flex

The holster is where you tune the build for the encounter:

- **Vigilance holster** for solo runs — adds +25% weapon damage when armor is intact, which it usually is during MMR play
- **Obliterate holster** for raid runs — adds +25% damage to elites, stacks multiplicatively with Tipping Scales
- **Spotter holster** for situations where pulse uptime matters — modest +10% damage to pulsed enemies but pulse synergy with Headhunter is excellent

### Brand 1pc bonuses

The two non-Tipping slots typically resolve to a chest with Headhunter and a holster from one of the above. There is no brand 1pc that competes with the talent value, so brand is irrelevant outside of the core attribute roll.

### Weapon slot

- **Primary:** Eagle Bearer (Iconic raid drop). The 70,000 base is what makes the cap multiplier worth chasing — every other MMR caps lower because their base is lower. With a Tardigrade Armor Kit or White Death substitute, the build still functions but loses 30-40% of its execution damage.
- **Secondary:** A high-roll AR like the Eagle Bearer's family AR (the M1A) for stack-building when targets are at medium range and the marksman scope is impractical.
- **Sidearm:** D50 Magnum with Sadist for utility damage application or Liberty for the EMP shock interaction.

[Open in Calculator — Tipping Loadout](/calc?weapon=eaglebearer&loadout=tipping-headhunter)

## Specialization

Sharpshooter is the only correct specialization. The +25% headshot damage active perk pushes you cleanly over the 150% HSD threshold for the higher Headhunter cap, the magazine perk gives you mag size on the MMR, and the spec-specific tools (drone, Tactician's Authority synergy) are all marksman-relevant.

The Sharpshooter signature weapon (50-cal sniper) is a fine panic button if Eagle Bearer goes empty and you cannot reload in time. The spec tree's headshot-damage and crit nodes are mandatory unlocks before any other tree investment.

If you do not have Sharpshooter unlocked or want to experiment, Gunner with the AR talent is a distant second — it gives sustained DPS for stack-building Tipping Scales but loses the HSD threshold and drops your cap to x8.

## The Math Behind the One-Shot

Numbers below assume Eagle Bearer with full gear investment, Sharpshooter spec, and the build operating at peak.

### Per-shot calculation, body shot with crit

```
Base shot:        70,000
Weapon Damage:    × 1.40    → 98,000
Crit on body:     × (1 + CHD)
                  CHD before stacks: 110%
                  CHD with full stacks: 110% + 200% = 310%
Crit body shot:   98,000 × 4.10 = 401,800
```

This is the loading shot — the headshot kill that powers Headhunter. In practice we want headshots, not bodyshots, so:

### Per-shot calculation, headshot with crit

```
Base shot:        70,000
Weapon Damage:    × 1.40    → 98,000
Headshot mult:    × 2.50    (base MMR HSD multiplier 100% + gear 100% + spec 25% + class 25%)
                  98,000 × 2.50 = 245,000
Crit:             × (1 + CHD effective with stacks)
                  Effective CHD on headshot: ~310%
Crit headshot:    245,000 × 4.10 = 1,004,500
```

So a single fully-stacked headshot crit on a non-armored body lands at roughly 1,000,000 damage. This is enough to one-shot most red and yellow elites in heroic, and on legendary directives one-shots all standard reds and most yellows.

### Headhunter storage and release

Headhunter stores the *damage of the killing shot*. So when our headshot crit kills a target, we store 1,004,500. The release applies that stored value to the next non-killing hit at 1.5x (Perfect Headhunter):

```
Stored:           1,004,500
Multiplier:       × 1.50
Released raw:     1,506,750
Cap (HSD ≥ 150%): 875,000
Released actual:  875,000
```

Now the released hit also lands as its own shot, which carries its own headshot crit calculation. So the actual damage of the release trigger is:

```
Own hit:          ~1,000,000 (assuming the release hit is also a headshot crit)
Released bonus:   875,000 (capped)
Total single shot: ~1,875,000
```

This is the one-shot. Against a raid boss segment with around 1.5M HP per phase, this evaporates the segment in a single trigger pull. Against a legendary directive named enemy with around 1.8M HP, it removes the entire elite in one shot.

### Ramp time analysis

Tipping Scales does not start at 200 stacks. You need to ramp:

- ~1 stack per shot landed on the same target
- 30-round magazine landed cleanly: 30 stacks
- Two clean magazines without target swap: 60 stacks
- Stacks decay if you stop firing on that target for ~6 seconds

The realistic ramp window is two to three sustained magazines on a tanky target. For raid use, this means lighting up a raid trash add or a non-priority boss segment for the first 30-45 seconds of the encounter to build stacks, then transitioning to the priority target with full stacks loaded.

For directive use, the ramp is harder because targets die before you can stack on them. The workaround: tag a Bulwark or armored elite as a stack battery, build to 200 stacks while keeping it alive, then transition to the actual priority target.

### Why Eagle Bearer specifically

The cap is `WeaponBase × 12.5`. Eagle Bearer's 70k base produces an 875k cap. Compare to:

- Tac-50 base ~50k → cap 625k
- White Death base ~45k → cap 562k
- Mantis base ~62k → cap 775k

Eagle Bearer is the only MMR with a base high enough to fully utilize the cap against high-HP raid bosses. The build degrades 25-35% in execution damage with any other MMR.

[Open in Calculator — One-Shot Math](/calc?weapon=eaglebearer&compare=oneshot)

## Rotation

The rotation is more like a setup-and-execute pattern than a continuous loop.

### Phase 1 — Stack building (15-45 seconds)

1. Identify a stack-battery target — ideally a yellow-bar Bulwark or armored elite that will not die to your sustained fire alone
2. Open with sustained Eagle Bearer headshot fire, focusing on stack accumulation rather than damage
3. Watch the Tipping Scales stack indicator climb. By 200 stacks the screen has a subtle visual shift indicating max stacks.
4. Do not target-swap during this phase. Stack ramp is per-target relative.

### Phase 2 — Headhunter loading

1. With full stacks, transition to a low-HP target — a red-bar in the same encounter is ideal
2. Land a clean headshot kill on the red. The killing shot's damage is now stored in Headhunter.
3. Confirm Headhunter active via the chest talent indicator

### Phase 3 — Execution

1. Acquire the priority target — the raid boss segment, the legendary directive named, the encounter-priority elite
2. Aim for the head, hold breath, fire a single shot
3. The combined own-shot plus Headhunter release lands as a single damage instance of approximately 1.8M
4. The target either dies outright or enters a low-HP execution window where one follow-up Eagle Bearer shot finishes them

### Reload and cycle

After the execution shot, Headhunter is consumed. The Tipping Scales stacks remain (they decay only on no-fire windows, not on target swap). To re-enter the cycle:

1. Find another stack-battery target if needed (Tipping decays if you stop firing for 6+ seconds)
2. Land another headshot kill to reload Headhunter
3. Repeat

The realistic encounter cadence is one execution shot every 30-60 seconds depending on availability of priority targets.

## Alternatives and Sidegrades

### Without Eagle Bearer

The closest substitute is White Death or Mantis with similar base damage. Both work, both lose 25-30% execution damage compared to the named-Iconic version. Run the same gear set.

A more accessible option: Mantis with the Premeditated talent (storage mechanic similar to Headhunter) gives a self-contained version of the build at 70-75% of full Eagle Bearer effectiveness. Single-piece swap — much easier to acquire.

### Without Tipping Scales 4pc

The build is functionally not the same build, but you can run a CHD-stacked build with Heartbreaker 4pc for roughly 70% of the execution damage. Heartbreaker's 4pc damage amp on armored enemies stacks with the Headhunter release, and the gear is significantly easier to farm.

### Sidegrade — Bullet Storm AR

If MMR play is not your style but the Headhunter mechanic appeals, an AR build with Tipping Scales 4pc and Headhunter chest works. AR sustained fire builds Tipping stacks faster than MMR, but per-shot damage is much lower and Headhunter releases at lower cap because AR base damage is lower. Useful for content where you need both ramp speed and execution.

### Encounter-specific swaps

- **Multiple priority targets** (Wave-style legendaries): Sniper specialization is too slow. Swap to AR with same gear set.
- **Ambush-heavy content** (Manhunt invasions): Build is too setup-dependent. Swap to a sustained-DPS build.
- **Boss-rush raids** (Iron Horse, Dark Hours full clear): Build is at peak. Run as listed.

[Open in Calculator — MMR Variants](/calc?weapon=eaglebearer&compare=variants)

## FAQ

**Is Perfect Headhunter required, or does standard Headhunter work?**
Standard Headhunter gives 1.25x release multiplier vs Perfect's 1.50x. Standard caps at the same 875k under HSD ≥ 150%, so the practical difference at the cap is zero. Standard works fine.

**What happens if I land a non-headshot kill while Headhunter is loading?**
The kill still loads Headhunter, but the stored damage is the body-shot value (~400k instead of ~1M). The released cap is unaffected because the cap is based on weapon base, not stored value, but the released shot only delivers up to the stored amount. So a body-shot load gives a ~400k release, which is far below the 875k cap.

**Does the released shot apply Tipping Scales stacks to the target?**
Yes, the released shot is treated as a normal weapon hit for stack purposes. So the execution shot also adds 1 stack toward the next ramp.

**Do I need to maintain Tipping stacks between executions?**
Yes. The stacks decay on no-fire windows. If you go more than ~6 seconds without firing on any target, stacks reset. In a raid encounter with constant trash spawns this is rarely a problem, but in a slow legendary directive with long pauses between rooms, you may need to re-ramp.

**Can I run this with the Memento backpack instead of Tipping for the stacking damage talent?**
Memento gives a flat damage buff at 5 trophies, but it does not stack with Tipping's CHD ramp the same way — the math comes out 30-40% weaker. Tipping is the build, Memento is a different build entirely.

**Is Eagle Bearer's signature talent (heal on hit) important here?**
The heal is incidental. The build's value is per-shot damage, and the heal is a fringe survivability bonus. You will not notice it.

**How does this interact with the Reviver hive?**
Reviver hive operates independently of the build. Run it for solo legendary survivability — the build's positioning makes you a sniper-camping target and Reviver covers panic moments.

**What about pairing with a Crusader Shield specialization?**
Crusader is incompatible. The shield blocks scope use and the build is melee-vulnerable. Sharpshooter's drone is the right tactical pair.

[Open in Calculator — FAQ Variants](/calc?weapon=eaglebearer&compare=tactical)

## Closing Notes

The Tipping Scales × Eagle Bearer MMR build is a specialist tool. It will not carry sustained content, it will not melt waves, and it will not feel "fun" in the way a Strikers LMG feels fun. What it will do is delete the right target at the right moment, and that capacity is irreplaceable in raid execution windows and legendary directive panic moments.

Three pieces of advice from extended raid use:

- Practice the ramp. The build's biggest failure mode is firing the execution shot before stacks are full. Use a stack-battery target for the first 30 seconds of every encounter, every time, even if it feels slow.
- Do not skimp on the HSD threshold. The 150% breakpoint is 56% of your execution damage. A roll that gets you to 145% is functionally a different, weaker build.
- Coordinate with your team. In a raid, the rest of the squad will see your damage numbers as outliers — but they will also see the boss segment vanish in a single trigger pull. Communicate when you have Headhunter loaded so the team plans burn windows around your execution shots.

When the build clicks, the moment is unmistakable: the entire room is mid-firefight, you sight in on the priority target across thirty meters, hold breath, fire once, and the target simply ceases to exist. Everything else in the encounter recalibrates around that single removed threat.

Last reviewed: 2026-04-25 · TU22.1 · Verified vs in-game

[Open in Calculator — Final Loadout](/calc?weapon=eaglebearer&set=tipping-scales&final=true)
