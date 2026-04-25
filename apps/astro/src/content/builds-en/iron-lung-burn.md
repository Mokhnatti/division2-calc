---
title: "Iron Lung Burn Build — Status Master DPS"
description: "Iron Lung exotic LMG burn build that turns every magazine into a wall of fire. Status Effects scaling, Burn Duration stacking, and AOE ignition for solo legendary content."
pubDate: 2026-04-25
---

## At a Glance

The Iron Lung Burn build is a hybrid status/DPS hybrid that weaponizes the Ardent talent to convert every shot fired during Bellows windows into a guaranteed Burn application. Where most LMG builds chase pure bullet DPS and treat status as a side dish, this build treats the bullet as the delivery mechanism and the Burn DoT as the meal. The result is a layered damage profile that punches well above its bullet sheet number, especially in rooms full of mid-tier elites where the AoE spread keeps multiple targets cooking at once.

The headline trick is simple: Iron Lung's 85-round Bellows magazine, paired with its 800 RPM cyclic rate, lets you blanket an entire encounter with a sustained two-second status spray. Stack Status Effects to north of +100% and Burn Duration past +100% and you are looking at single-target ignite tick values that rival a full Strikers build's bullet sheet, with the added bonus that the burn keeps ticking after you reload, swap targets, or take cover. Add Eclipse Protocol's transferable hazard logic and one ignited red-bar effectively becomes a walking grenade that ignites the rest of the pack on death.

If you have ever felt that pure-DPS LMG builds turn every fight into a bullet sponge contest, this build is the antidote. You stop trying to outshoot the enemy health pool and start tagging targets so the environment kills them for you.

[Open in Calculator — Iron Lung Burn](/calc?weapon=ironlung&set=ongoing-directive)

## Stats Priority

The build lives or dies on two attributes that most DPS hunters never even glance at: Status Effects and Status Effect Duration. Both roll from the same primary stat slots, both scale multiplicatively into the burn formula, and both are the difference between an ignite that tickles and one that erases.

### Primary stats (in order)

1. **Status Effects %** — primary attribute on Offensive slots. Target ceiling is +90% to +110% from gear alone, plus 1pc brand contributions stacking up to roughly +135% before mods.
2. **Status Effect Duration %** — utility attribute. Target +75% to +100%. Doubles the bleed window without changing tick rate, so it is effectively a multiplicative damage line.
3. **Weapon Damage %** — keep at least 30%. The bullet still has to land and apply, and Iron Lung's bullet damage is not nothing — roughly 3-4M sheet DPS even on a status-focused chassis.
4. **Critical Hit Chance** — secondary, target around 35-40%. Cheaper to roll than CHD on this build because we do not need crit cap.
5. **Critical Hit Damage** — opportunistic. Anything past 60% is gravy. This is not a crit build.
6. **Armor on Kill or Health on Kill** — survivability glue. Iron Lung pulls you out of cover often enough that passive regen alone is shaky in the harder directives.

### Mods

Run Status Effects mods on every slot that accepts them. Burn Duration mods on duration-friendly slots. Weapon mods on the LMG itself prioritize stability and reload speed — magazine size is already at 85 with Bellows so a magazine mod is wasted unless you specifically dislike the Bellows mechanic and want a flat 100-round mag with a different talent profile.

[Open in Calculator — Status Stack Sheet](/calc?weapon=ironlung&stat=status)

## Gear Loadout

Three core sets compete for the chest piece, and your choice frames the entire playstyle.

### Option A — Ongoing Directive (4pc, recommended for solo)

Ongoing Directive is the workhorse pick. The 4pc bonus converts a portion of your magazine into status ammo (burn or bleed depending on weapon), and Iron Lung's already-burning bullets stack with this for what amounts to a guaranteed Burn application on every fourth-ish shot regardless of Status Effect resistance from the target. Combined with the 4pc reload-while-holstered, you essentially never reload your sidearm.

- 1pc: Ongoing Directive backpack (Status Effects)
- 2pc: Ongoing Directive chest with Vigilance or Headhunter talent
- 3pc: Ongoing Directive gloves (Weapon Damage)
- 4pc: Ongoing Directive mask (CHC or CHD)

The remaining two pieces flex into brand 1pc bonuses for status. Golan Gear knee pad and Empress holster is the standard cookie-cutter — both deliver a flat +10% Status Effects from a single piece, and Empress also gives you skill duration for the Firestarter Chem Launcher synergy if you go that route.

### Option B — Hunter's Fury (4pc, melee burn hybrid)

Hunter's Fury repositions you as a melee-first aggressor who uses the LMG to soften and ignite. The 4pc grants pulse, damage, and movement bonuses on shotgun-range melee hits, but the underrated piece is the way pulse marks targets — pulsed enemies take amplified status duration in this build's interaction. You give up a chunk of the safety blanket from Ongoing Directive's auto-reload but gain the ability to bowl into a pack, melee an elite, and watch the entire room ignite from spread.

This is the high-skill, high-reward path. In open Dark Zone or rooftop Manhunt encounters where you can engage from above and crash into the pack, it is the strongest of the three. In choke-point legendaries like Capitol it falls off because you cannot consistently land the melee proc.

### Option C — Eclipse Protocol (3pc + flex)

Eclipse Protocol's signature interaction is hazard transfer — when an enemy with a status effect dies, that status spreads to nearby enemies with refreshed duration. With Iron Lung priming the entire pack on burn, a single elite death cascades into a chain ignition that can wipe an entire patrol group with zero additional shots fired.

The 3pc version of Eclipse Protocol is preferred here because the 4pc bonus (status amplification on hazard kills) is a feedback loop that stops mattering once everyone is already burning. Three pieces give you the spread mechanic and free up two slots for higher-value brand 1pcs.

- 3pc Eclipse Protocol (chest, backpack, mask)
- 1pc Murakami (knee pad) for +15% Status Effects
- 1pc Electrique (gloves) for +10% Status Effects
- 1pc Empress (holster) for +10% Status Effects

Total status from brand 1pcs alone: +35%. Combined with attribute rolls, you crest +130% Status Effects on the sheet.

### Brand recommendations summary

| Brand | 1pc Bonus | Notes |
|-------|-----------|-------|
| Golan Gear | +10% Status Effects | Cheapest source, common drop |
| Empress International | +10% Status Effects, +5% Skill Duration | Best dual-purpose brand |
| Electrique | +10% Status Effects | Pairs well with Empress |
| Murakami Industries | +15% Status Effects | Highest single-piece value |

### Weapon slot

- **Primary:** Iron Lung (Ardent talent — non-negotiable, this is the build)
- **Secondary:** Eagle Bearer if you have one, otherwise a high-base Marksman like SOCOM Mk20 SSR with Boomerang for the panic burst against named bosses where burn ramp-up is too slow
- **Sidearm:** Liberty for the EMP shock interaction with status, or a base D50 with whatever mods. The sidearm rarely fires.

[Open in Calculator — Full Gear Sheet](/calc?weapon=ironlung&loadout=ongoing-directive)

## Specialization

Demolitionist remains the surprise pick despite its grenade focus. The reason is the +25% Burn damage active perk in the Demo tree, which scales the entire DoT formula multiplicatively. Survivalist is the second choice for Mender Mine synergy and the +10% Status Effect duration node, which is functionally another duration roll without occupying a gear slot. Firewall rounds out the trio for the chest plate active mitigation when you commit to Hunter's Fury and play closer to the action.

The LMG specialization tree node grants +15% LMG weapon damage and is mandatory regardless of which spec you pick — it stacks with the spec choice and rolls into the bullet portion of the build separately from the burn calculation.

## The Math Behind the Burn

This is where the build justifies itself. The Division 2 burn formula simplifies to:

```
Tick Damage = Base × Status Multiplier
Total Burn  = Tick Damage × Tick Count
Tick Count  = Floor(Duration × 2)  // 2 ticks per second
```

Iron Lung's burn base resolves to roughly 12,000 per tick before scaling. Numbers below assume ten ticks of a five-second duration before duration scaling — the actual game engine ticks twice per second.

### Baseline (no investment)

- Status Effects: +0%
- Burn Duration: +0%
- Per tick: 12,000
- Five-second duration, ten ticks: 120,000 total per ignite
- Bullets per second applying burn: ~3 (refresh, not stack)
- Effective burn DPS: 24,000

This is what an unoptimized Iron Lung does. It is a chip-damage afterthought.

### Soft target — moderate investment

- Status Effects: +50%
- Burn Duration: +50%
- Per tick: 18,000
- Duration: 7.5 seconds, fifteen ticks
- Total per ignite: 270,000
- Effective single-target burn DPS: 36,000 (refresh-limited)

Already double the baseline and competitive with mid-tier red builds for AoE clearing.

### Build target — fully invested

- Status Effects: +100%
- Burn Duration: +100%
- Per tick: 24,000
- Duration: 10 seconds, twenty ticks
- Total per ignite: 480,000

This is the number that breaks the math. Per ignite, on a single target, you deposit 480k damage that ticks regardless of cover, regardless of whether you keep firing. Now multiply by the AoE.

### AoE multiplication

Iron Lung's burn applies in a small radius around the impact point. In a tight pack of four to six red-bars, you typically light three to four simultaneously per second of sustained fire. With burn refreshing on each subsequent tag:

- Three concurrent burns at +100/+100: 72,000 DPS sustained
- Five concurrent burns: 120,000 DPS sustained
- Compare to bullet DPS on the same build: ~3.5M sheet, but realized DPS against actual targets accounting for movement, body shots, armor mitigation: ~1.8M to 2.4M

So burn realized DPS in a five-target encounter is sitting around 120k. That is well below the bullet sheet, but the bullet sheet is single-target instantaneous and the burn is multi-target sustained. The combined effective DPS against a pack — bullet on the priority target plus burn on the rest of the pack — comes out to roughly 4-5M effective when calibrated against a directives legendary stronghold encounter.

### Direct bullet DPS on the same chassis

Status-focused gear means bullet sheet drops compared to a Strikers or Tipping Scales chassis. Expect:

- Sheet DPS: ~3.0M to 3.8M
- Realized against named with Ardent active: ~2.5M to 3.0M

This is enough to pop yellow-bars cleanly without needing the burn stacks to do the work, and the burn handles trash and crowd density on its own.

### Why the build holds in legendaries

The hidden value is that legendary content scales enemy health far faster than enemy resistance. A red-bar in legendary has roughly 6x normal-difficulty health but only marginal status resistance. The 480k-per-ignite figure scales linearly into legendary content, while a Strikers bullet build sees its effective DPS hammered by both health scaling AND resistance scaling. By target HP roughly 1.4M for a legendary red-bar, a single full-stack ignite removes about 35% of an entire elite in a single tag.

[Open in Calculator — Burn Math Sheet](/calc?weapon=ironlung&compare=burn)

## Rotation

The rotation is forgiving compared to a high-DPS Strikers cycle, but it has an opener and a recovery phase that pay off heavily when executed well.

### Opening engagement (first 3 seconds)

1. Identify the densest cluster — usually three or more red-bars within five meters of each other
2. Open with a sustained spray across the cluster — do not single-target. The goal is to apply burn to as many bodies as possible before anyone moves
3. Bellows kicks in around shot 30, and your damage ramps with stack count
4. By second three you should have four to five concurrent burns ticking

### Sustain phase (seconds 3-10)

1. Walk shots between elites and remaining reds, refreshing burn on whoever is closest to the duration cap
2. Drop a Firestarter Chem Launcher if you brought it for the duration extension on existing burns
3. Reposition behind cover when armor dips below 60% — the burns continue ticking while you regen
4. Hunter's Fury players: this is the window to crash a melee on the most armored target

### Reload window

The 85-round magazine plus Bellows mechanic gives you two reload styles:

- **Empty reload:** ~3.2 seconds, full Bellows reset, full mag
- **Bellows refresh:** if you stop firing for two seconds, Bellows partially refreshes without a manual reload — useful when targets are already burning and you do not need active fire

Always default to the Bellows refresh during burn-tick coverage. Your ticks are already doing the work, and reloading is dead time.

### Closing

When the room is down to one or two named or yellow-bars, Iron Lung's bullet DPS finishes them. Burn alone will not finish a heavy with full armor in a reasonable window. Switch to single-target precision fire, lead the head, and the named drops within a magazine.

## Alternatives and Sidegrades

Not everyone has Iron Lung yet, and not every encounter benefits from the burn-spread approach.

### Without Iron Lung

The closest functional substitute is a high-roll Stop, Drop & Reload LMG with the Strained talent and incendiary mods. You lose the guaranteed Ardent burn application but gain raw bullet DPS. The build flips into roughly 60% of its damage being bullets and 40% being burn from incendiary mods, which is workable but distinctly weaker against packs.

A second option is the Bullet King with Adrenaline Rush — infinite mag means infinite bleed-mod uptime, and bleed scales off the same Status Effects investment as burn. Bleed ticks slightly weaker than burn but applies more reliably.

### Encounter-specific swaps

- **Bosses with status immunity:** Iron Lung becomes a mediocre bullet weapon. Swap to Eagle Bearer or a Stinger Hive build for these.
- **Tight indoor encounters:** Hunter's Fury variant outperforms because melee-range is forced anyway.
- **Wide-open rooftop fights:** Ongoing Directive with a Marksman secondary becomes the right tool — burn for spread, marksman for picking off elevated snipers.

### Build sidegrade — Bleed Master

Switch Iron Lung for Stinger Hive plus a high-roll bleed sidearm and you get the bleed version of this build. Bleed has a slightly different scaling curve (longer base duration, slower tick rate) but inherits all the same gear. Useful for players who already burned their Ongoing Directive farm on a different build and have leftover Hunter's Fury pieces.

[Open in Calculator — Bleed Variant](/calc?weapon=stingerhive&set=hunters-fury)

## FAQ

**Does Status Effects from skill mods stack with gear-rolled Status Effects?**
Yes, but only the gear-rolled stat affects weapon-applied status. Skill-mod Status Effects only multiplies skill-applied status (Firestarter, Stinger). The build is built around the gear-rolled line.

**Why not run Tip of the Spear for the +15% weapon damage?**
Tip of the Spear's signature talent does not affect status damage scaling. The +15% bumps bullet sheet only, and we are not optimizing for bullet sheet. The brands listed above all give Status Effects, which scales burn linearly.

**Should I keep the Bellows mod or swap for raw mag size?**
Keep Bellows. The talent's damage ramp during sustained fire is the largest single multiplier on the bullet portion of the build. Swapping for mag size loses 15-25% bullet DPS during the sustain window where most kills happen.

**Iron Lung's Ardent applies on every shot — do I need an incendiary mag mod?**
No. Ardent overrides mag mods for status type and the application rate. The mag mod slot becomes a free slot for handling stat — stability or reload speed.

**Is this build viable in PvP?**
Limited. Status duration in PvP is reduced significantly, and most PvP players run with status resistance gear. Burn becomes chip damage. The bullet portion is fine but a pure DPS build does it better.

**How does Headhunter work with this build?**
It works but is not the priority. Headhunter triggers on headshot kills, which Iron Lung does not specifically optimize for. Run Vigilance or Perfect Vigilance on the chest instead — sustained-fire amp pairs better with the LMG playstyle.

**What about Future Initiative or Heartbreaker for healing or amplification?**
Heartbreaker's 4pc damage amp does not stack with Ardent's status application — they overlap mechanically. Future Initiative's heal-on-status synergy is interesting on paper but the 4pc loses you Ongoing Directive's status ammo, which is a net loss for burn application rate.

**Does Eclipse Protocol's hazard transfer carry duration stat from gear?**
Yes. The transferred status inherits the duration of the original application, so an Eclipse spread off a +100% Duration burn carries the full ten-second window into the next target.

[Open in Calculator — FAQ Build Variants](/calc?weapon=ironlung&compare=variants)

## Closing Notes

The Iron Lung Burn build is the answer to a specific problem: legendary directives where bullet-sponge enemies wear down a pure-DPS build before the build can wear down the room. By converting a portion of your damage into a sustained DoT that does not require continued ammo investment, you gain time and positioning options that no traditional bullet build can offer.

The build's weakness is single-target burst against status-immune named enemies — typically Black Tusk drones and certain Hyena heavies. For those windows, lean on the bullet portion of Iron Lung and the raw 800 RPM cyclic rate, or weapon-swap into a Marksman.

Three pieces of advice from extended runs:

- Do not chase 100% Critical Hit Chance. The build does not crit-cap and the gear slots needed to push past 50% CHC come at the cost of Status Effects rolls.
- Do not skip the Demolitionist or Survivalist tree. The +25% burn damage or +10% duration spec node is a free multiplier that no gear roll can replace.
- Do not waste reroll currency on Critical Hit Damage. Status Effects and Status Duration are the build, and rolling either of those onto a piece is a 4-7% total DPS gain. Rolling 10% more CHD is a sub-1% gain.

When the build clicks, you will notice a specific moment in every encounter: the room lights up with two or three burning targets, you reposition behind a barrier, the burn ticks tear through health bars while you reload, and the encounter is over before you re-engage. That is the build working as designed.

Last reviewed: 2026-04-25 · TU22.1 · Verified vs in-game

[Open in Calculator — Final Loadout](/calc?weapon=ironlung&set=ongoing-directive&final=true)
