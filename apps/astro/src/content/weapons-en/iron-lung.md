## At a Glance

Iron Lung is a scrappy 800 RPM exotic LMG that turns into an incendiary flamethrower once you've dumped about half a magazine, applying Burn DoT that scales with Status Effects and Burn Duration stats rather than weapon damage.

- **What makes it special:** built-in heat meter at 50% of mag size — past that threshold every bullet ignites, stacking massive Burn DoT independent of your red-core build
- **Who it's for:** status-effect builders, hybrid yellow/blue setups, players who hate single-stat scaling and want a weapon that rewards utility rolls
- **Key highlights:** 800 RPM, 50 base mag (85 with Bellows mod), 35m optimal range, 1.65× headshot, three built-in named mods baked into the base weapon
- **DPS model:** hybrid — direct bullet damage + Burn DoT layered on top once the heat meter is full

## Full Stats

| Stat | Value |
|---|---|
| Base Damage | 54,322 |
| RPM | 800 |
| Magazine | 50 (85 with Bellows) |
| Reload | 2.96s |
| Optimal Range | 35m |
| Headshot Multiplier | 1.65× |
| Damage Type | Physical → Fire (after heat meter) |

### Intrinsic Attributes

- **Ardent talent:** built-in, cannot be re-rolled or removed
- **Heat meter mechanic:** equivalent to 50% of standard magazine size before bullets become incendiary
- **Decay rate:** stacks drop at 12/sec when idle, reloading, or swapping weapons

### Built-in Mods (cannot be swapped)

| Slot | Mod Name | Stat | Value |
|---|---|---|---|
| Scope | Dragon Horns (Рога дракона) | Critical Hit Chance | +10% |
| Underbarrel | Scales (Чешуя) | Critical Hit Damage | +20% |
| Magazine | Bellows (Меха) | Magazine Size | +35 rounds |

These three slots are locked. You cannot replace the scope with a 4× sight or swap the mag for an extended one — what you see is what you get. The good news: Bellows pushes the effective mag to 85, which is critical for the talent to function (more on that below).

## Weapon Talent

> **Ardent (Пылкость):** Shooting heats up the weapon, filling up the heat meter. The meter is equivalent to 50% of the weapon's standard magazine size. Once full, rounds shot by the weapon will ignite enemies. Idle/reload/swap drops stacks at 12/sec.

The mechanic is straightforward but the implementation is where most players misunderstand the gun. The heat meter fills as you shoot — every bullet adds a stack, and once you've fired roughly 43 shots out of an 85-round mag (50% of the *standard* 50-round mag, not the modded 85), every subsequent bullet ignites the target with a Burn DoT.

That means in a single mag dump you get:

- **Shots 1–43:** standard physical damage at 54,322 base damage per bullet, 800 RPM (13.33 shots/sec)
- **Shots 44–85:** same physical damage *plus* Burn application on every hit
- **Reload 2.96s:** heat decays at 12 stacks/sec → you lose ~35 stacks during reload, dropping you below the threshold

So the rhythm is: empty the mag, eat a few seconds of "cold" shots on the next mag, then return to fire mode for the back half. The full cycle is roughly 9.36 seconds (6.4s shooting + 2.96s reload).

The decay rate is the forgiving part. As long as you keep pulling the trigger you stay topped up. The penalty for swapping weapons is real but not catastrophic — about 4 seconds off-weapon and you've lost half your meter.

## Burn DPS — the actual reason you bring this gun

Iron Lung's bullet damage is fine but unremarkable. The reason it's an S-tier weapon in the right build is the Burn DoT, which scales with stats most LMGs ignore.

### Burn formula

Burn DoT is calculated as: `300 × 40 × (1 + StatusEffects%)` per tick, multiplied by duration. Burn ticks have a base duration of 5 seconds.

### Scaling examples (numbers from calculator)

- **+50% Status Effects, +0% Burn Duration:** 18,000 DPS per tick × 5s = **90,000 damage per ignite**
- **+100% Status Effects, +100% Burn Duration:** 24,000 DPS per tick × 10s = **240,000 damage per ignite, AoE**

That's per ignite. Iron Lung ignites with *every* bullet past the threshold, so on a single hot mag you can stack burn applications on multiple enemies, refreshing the duration on each hit.

### Direct bullet DPS (Status Effects build)

Don't sleep on the bullet damage either. With the typical Status Effects setup:

- 54,322 per bullet × 13.33 shots/sec = solid baseline damage
- Add the +10% CHC and +20% CHD from built-in mods, plus whatever you stack on gear, and the bullet portion is competitive with other 800 RPM exotic LMGs even before burn kicks in

The hybrid model is what makes the gun. Red-only LMGs scale one stat. Iron Lung scales red (bullets), yellow (skill tier doesn't matter but Status Effects often comes from gear sets that overlap), and blue/burn-duration rolls all at once.

## Top Builds

### Iron Lung × Burn Status — S-tier

The flagship build. Stack Status Effects to +100%, Burn Duration to +100%, run a chest with Glass Cannon or Obliterate, and watch entire packs melt from a single sustained burst. The 240,000-per-ignite number above assumes this exact setup. Targeting AoE burn spread is the whole point. → [/builds/iron-lung-burn](/builds/iron-lung-burn)

### Iron Lung × Hunter's Fury — PvP/Melee Hybrid

PvP-focused. Hunter's Fury 4-piece bonus turns melee hits into damage amps, and Iron Lung's burn lets you tag a target, close distance, and finish in melee while the DoT ticks. Niche but vicious in DZ skirmishes.

### Iron Lung × Ongoing Directive — Double DoT

Ongoing Directive applies Bleed via hollow-point ammo. Stacking Bleed (physical DoT) on top of Burn (fire DoT) means two independent damage-over-time channels ticking simultaneously. Both scale with Status Effects, so one stat boosts both. Check the build page for the gear breakpoints.

## PvE vs PvP

In PvE, Iron Lung is a top-3 LMG and a top-10 weapon overall right now in TU22.1. The 35m optimal range covers most legendary missions and incursion engagements, the heat meter cycle aligns nicely with elite spawn waves, and Burn DoT eats through armor on red bars and chunks heroics. The only PvE knock is range — past 35m the damage falloff plus burn application reliability drops noticeably.

PvP is more complicated. The bullet damage is honest, the headshot multiplier of 1.65× is competitive, and Burn DoT does work against squishy DZ targets. But 50 base mag against a moving player who breaks line of sight constantly means you rarely hit the heat threshold before you're forced to swap or reload. Iron Lung in PvP is fine but not meta — Big Alejandro's flat +100% out of cover is more reliable in 1v1 trades.

The verdict: PvE flagship, PvP situational.

## Pros & Cons

| Pros | Cons |
|---|---|
| Hybrid damage scales with Status Effects, Burn Duration, *and* weapon damage | Built-in scope is locked at low magnification |
| Bellows mod pushes mag to 85, makes heat threshold reachable in normal play | Reload drops half your heat meter |
| Burn DoT is independent of armor — chunks armored elites | Wasted on red-only builds |
| AoE burn spread on packed enemies is filthy | 35m optimal range limits long engagements |
| Headshot multiplier 1.65× is high for an LMG | Heat meter pre-threshold = "cold" mag, no special damage |
| Three named built-in mods stack with gear bonuses | Cannot replace mods if you want different rolls |

## Comparison

| Weapon | Type | RPM | Mag | Notable |
|---|---|---|---|---|
| **Iron Lung** | Exotic LMG | 800 | 50 | Heat meter → fire bullets, applies Burn |
| Big Alejandro | Exotic LMG | 750 | 100 | +100% WD out of cover, no status |
| Bullet King | Exotic LMG | 750 | 100 | +mag rolls, sustained fire |
| Pyromaniac | Named AR | 850 | 30 | +30% WD vs burning targets |

Big Alejandro is the safer pick for raw damage if you're not building Status Effects — flat +100% weapon damage is hard to argue with and the 100-round mag means you almost never reload mid-fight. Bullet King is the sustained-fire option for groups and clearing waves. Pyromaniac isn't an LMG but deserves a mention here because the synergy is hilarious: ignite a target with Iron Lung, swap to Pyromaniac, eat a +30% weapon damage bonus on the burning target. That holster combo is genuinely meta in burn builds.

## FAQ

### Is Iron Lung still good in TU22?

Iron Lung is still S-tier in TU22.1 for any Status Effects build and remains a top LMG choice for PvE. Nothing in the recent patch nerfed Ardent or the burn scaling formula, and several gear sets that buff Status Effects got direct or indirect boosts.

### How do I farm Iron Lung?

Iron Lung drops from named bosses in specific Black Tusk strongholds and incursions, with elevated drop rates during seasonal manhunt targets. Check the targeted-loot rotation for LMGs in your map and run that zone with a high-difficulty filter. Exact source rotation changes per season — verify in-game on the activity menu.

### Iron Lung vs Big Alejandro, which is better?

Big Alejandro is better for pure damage builds with red-core gear, while Iron Lung wins for any build leveraging Status Effects, Burn Duration, or hybrid stat lines. If your gear has Status Effects rolls, you bring Iron Lung. If you're stacking weapon damage and out-of-cover bonuses, Big Alejandro pulls ahead.

### Does Burn from Iron Lung scale with Hazard Protection on enemies?

Burn DoT damage from Ardent ignores enemy armor but is mitigated by Hazard Protection, the same as any other status effect application. Heroic and legendary enemies have higher Hazard Protection, so factor that into your Status Effects ceiling — pushing past +100% helps overcome diminishing returns.

### Why does my heat meter fill so slowly?

The heat meter fills based on shots fired, not time, and the threshold is 50% of the *standard* 50-round magazine — about 25 shots from a cold start. If you're swapping weapons or reloading frequently the 12/sec decay catches up to you. Stay on the gun, mag-dump, and you'll hit fire mode reliably.

### Can I run Iron Lung without a Status Effects build?

You can, but you're leaving most of the weapon's damage on the table. The bullet portion alone is competitive with other 800 RPM LMGs, but the burn DoT is where the real numbers live. Without at least +50% Status Effects you're using Iron Lung as a slightly above-average LMG with no special talent value.

### What's the best holster weapon for Iron Lung?

Pyromaniac AR is the strongest holster choice — its +30% weapon damage vs burning targets means you tag with Iron Lung, swap, and finish with the AR for a damage spike. Other strong holsters include any high-headshot pistol for armor-break checks, or a Memento-buffed sidearm if you're already running that backpack.

### Does the heat meter persist between encounters?

The heat meter decays at 12 stacks per second when you're not shooting, so within ~4 seconds of going idle you've lost half your meter and within ~7 seconds it's gone. Fast travel, mission transitions, and going out-of-combat all reset it. Plan for a fresh ramp every fight.

## Verified vs In-Game

> Last reviewed: 2026-04-25 · TU22.1 · Verified vs in-game
> All DPS numbers calculated by [divcalc.xyz](https://divcalc.xyz/spa/index.html#build) — open in calculator to test custom builds.
