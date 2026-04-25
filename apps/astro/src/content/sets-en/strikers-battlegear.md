## At a Glance

Striker's Battlegear is the king of red/DPS gear sets in The Division 2 and the default build target for every sustained-fire weapon in the game. The 4-piece bonus, **Striker's Gamble**, turns every bullet that lands into a permanent-feeling damage multiplier: each weapon hit adds +0.65% Total Weapon Damage (or +0.9% with the Risk Management backpack), capped at 100 stacks (200 with the chest talent). At full saturation that translates to **+90% to +180% amplified weapon damage** on every shot — bigger than any single brand-set bonus and bigger than most exotic talents.

- BiS (Best in Slot) gear set for **LMGs, ARs, and SMGs** — anything that holds the trigger and refreshes stacks faster than the decay timer drains them.
- Two key talents are mandatory: **Press the Advantage** (chest, raises cap to 200) and **Risk Management** (backpack, raises perStack from 0.65% → 0.9%).
- Top builds in TU22.1: **St. Elmo's Engine + Strikers DD** (S-tier verified), **Big Alejandro × Strikers LMG** (S-tier OoC), **Iron Lung × Strikers** (status hybrid).
- Stacks decay 1/sec at 0–50, 2/sec at 51–100, 3/sec at 101–200 — the cost of stopping shooting scales with how strong you've ramped.
- Not a beginner set — missed shots, reloads, and movement all bleed your DPS. Reward: the highest theoretical sustained DPS of any non-Heartbreaker red build.

## Set Bonuses Detail

### 2-Piece — +15% Weapon Handling

A flat handling buff covering recoil, accuracy, stability, reload speed and weapon swap. Cheap and universally useful — even when you only run two pieces of Strikers as a "splash" for a hybrid build, you get a tangible feel improvement on every gun. On top of brand handling rolls (Wyvern Wear, Walker Harris) you can hit ~80% handling without a single attribute roll, which is what lets ARs and LMGs stay on-target during the long burn cycles Strikers needs.

### 3-Piece — +15% Rate of Fire

Strikers turns RoF into a **double scaling stat**: faster fire rate means more bullets per second, which means more stacks per second, which means a faster ramp to peak DPS *and* higher sustained DPS once you're there. This is why the set lives and dies with rapid-fire weapons. A 750 RPM LMG becomes 862 RPM. A 900 RPM AR becomes 1035 RPM. Slow-firing rifles, MMRs, and shotguns barely benefit from the second-order scaling and can't refresh stacks fast enough to fight decay.

### 4-Piece — Striker's Gamble (the main event)

> **Striker's Gamble** — Weapon hits gain +0.65% Total Weapon Damage per stack. Stacks decay over time when you stop shooting.

This is the entire reason the set exists. Stacks are gained per bullet that connects (not per shot fired — misses don't count). The bonus is **Total Weapon Damage**, the same multiplicative bucket that Berserk, Glass Cannon, Big Alejandro's *The Big Show*, and Vigilance feed into — meaning Strikers stacks multiply on top of those, not against them.

### Chest Talent — Press the Advantage

Raises the maximum stack count from **100 → 200**. Mandatory. Without this talent the set caps at +65% TWD (or +90% with Risk Management backpack), which is competitive but no longer S-tier. With it, the cap doubles. There's no other reason to wear a Strikers chest piece — always slot Press the Advantage.

### Backpack Talent — Risk Management

Raises the per-stack damage from **0.65% → 0.9% TWD**. Also mandatory for any serious build. The combination of Press the Advantage + Risk Management is what produces the headline +180% amplified TWD number at full stacks; running Strikers without both talents leaves roughly 50% of the set's damage on the table.

## 4pc Mechanic Deep Dive

### Stack Generation

- One stack per bullet **hit** on an enemy.
- Bullets that miss, hit cover, or hit shields without penetrating do **not** generate stacks.
- Pellets from shotguns generate stacks per pellet (rarely useful — slow RoF, and Strikers isn't a shotgun set).
- Skill damage and grenade damage do **not** generate or consume stacks.

### Stack Decay (the Gamble)

Decay is non-linear — the higher you ramp, the faster you bleed:

| Stack range | Decay rate |
| --- | --- |
| 0 – 50 | 1 stack / second |
| 51 – 100 | 2 stacks / second |
| 101 – 200 | 3 stacks / second |

This is what gives the set its name: *gamble* on staying in the fight. A two-second pause to swap mags or vault cover at 200 stacks burns 6 stacks (–5.4% TWD instantly). A four-second skill rotation at the same stack count burns 12. A full reload on a slow LMG can cost you 15+ stacks.

This decay structure is also why Strikers is **not** a "press the button and run a rotation" set. It's a "hold the trigger and never stop" set.

### What Refreshes Decay

Any weapon hit pauses decay for that tick. So even one bullet per second is enough to hold stacks steady at the 0–50 band. At higher bands you need 2–3 hits per second just to break even, which is why low-RPM weapons can't sustain peak stacks even if they reach them.

## Math: Stacks → DPS

All numbers below assume **Press the Advantage + Risk Management** equipped and assume hits, not shots fired.

### Per-stack contribution

- Without Risk Management: 0.65% Total Weapon Damage per stack
- With Risk Management: 0.9% Total Weapon Damage per stack

### Total amplified Total Weapon Damage at common breakpoints

| Stacks | Without Risk Mgmt | With Risk Mgmt |
| --- | --- | --- |
| 25 | +16.25% TWD | +22.5% TWD |
| 50 | +32.5% TWD | +45% TWD |
| 100 | +65% TWD | **+90% TWD** |
| 150 | (cap) | +135% TWD |
| 200 | (cap, no PtA) | **+180% TWD** |

### Ramp time (typical 750 RPM LMG with +15% RoF = 862 RPM ≈ 14.4 hits/sec)

- 0 → 100 stacks: ~7 seconds of trigger-hold
- 100 → 200 stacks: ~7 more seconds (~14 seconds total from cold)
- 0 → 200 with St. Elmo's Engine (~875 RPM with talent procs): **~12–13 seconds**

### Practical takeaway

Strikers is a **ramp set**, not a burst set. First-magazine TTKs are pedestrian. Second magazine is where you start outpacing other red sets, and by the third magazine — assuming you maintain stacks through the reload window — you're sitting at peak DPS that no red set in the game matches. Any encounter that demands burst-and-reposition (clearing trash mobs, Hunter spawn waves) wastes the set's strength; sustained DPS on raid bosses, tank lieutenants, and Summit boss floors is where it pays.

## Best Weapons for Strikers

### Tier 1 — define the meta

- **St. Elmo's Engine** — High RoF AR with chained shock procs. Best DD (Damage Dealer) primary in the game on Strikers thanks to its massive crit chain and stack-refresh density. The S-tier verified pairing.
- **Big Alejandro** — Out-of-cover LMG with +100% TWD intrinsic. The Big Show's TWD multiplier stacks with Strikers' TWD bucket, producing the highest single-target sustained DPS achievable on any red build.
- **Iron Lung** — DMR with status-amp synergy. Slightly off-meta for pure DPS, but the status-effect hybrid layer (with Doctor Home's 5–6%) makes this the answer for content where bleed/shock uptime matters.

### Tier 2 — strong, situational

- **The Chatterbox** — RoF stacking SMG. The only SMG that genuinely competes with the Tier 1 picks; falls behind at long range.
- **Eagle Bearer** — Versatile AR with Eagle's Strike. Underrated on Strikers because the Eagle's Strike bullet refreshes work as quasi-stacks on top of Gamble.
- **Pestilence** — Plague-of-the-Outcasts LMG with bleed-on-kill. Slower RoF means slower ramp, but the bleed multiplier compensates in long fights.

### Avoid

Slow-RoF weapons (sniper rifles, single-shot DMRs that aren't Iron Lung, shotguns), and any weapon with a binary cooldown talent that punishes you for trigger-holding. If you'd swap weapons mid-fight, Strikers isn't the set — Future Initiative or Heartbreaker is.

## Builds

### Strikers DD (St. Elmo's Engine)

- Primary: **St. Elmo's Engine** with **Optimist** or **Vindictive** rolls
- Secondary: AR/LMG of choice
- Gear: 4× Strikers + 2× Wyvern Wear (or 2× Walker Harris)
- Mask attribute: Crit Hit Chance · Chest: Damage to Targets Out of Cover · Backpack: Damage to Health
- Talents: Press the Advantage + Risk Management
- Skills: Striker Drone + Reinforcer Chem Launcher (or Bulwark Shield)

S-tier verified for raids, Countdown, and Summit floor 100. Sustained DPS in the **9–11M** range with 200 stacks active.

### Strikers OoC LMG (Big Alejandro)

- Primary: **Big Alejandro**
- Secondary: AR for bridging
- Gear: 4× Strikers + 2× Hana-U (out-of-cover damage brand)
- Chest talent: Press the Advantage · Backpack talent: Risk Management
- Playstyle: out of cover at all times — the talent demands it

S-tier OoC. Peak DPS **12–15M** when the Big Show talent is active alongside full Strikers stacks. Highest theoretical DPS in the game for a non-skill build, balanced against the highest skill-floor.

### Strikers Status Hybrid (Iron Lung)

- Primary: **Iron Lung**
- Brand mix: 4× Strikers + 2× Empress International (or 2× Belstone Armory for status efficiency)
- Backpack: Risk Management · Chest: Press the Advantage
- Skills: Stinger Hive + Riot Foam Chem Launcher

Status uptime layered on top of Gamble. Roughly 8M sustained DPS but with permanent bleed/shock pressure that keeps elite enemies stun-locked.

## Pros & Cons

### Pros

- Highest sustained DPS ceiling of any red gear set
- Both bonus talents (PtA + Risk Mgmt) directly buff the same mechanic — no wasted slots
- Stacks survive across cover transitions, reloads (briefly), weapon swaps (briefly), and target swaps
- Scales multiplicatively with Total Weapon Damage exotics (Big Alejandro, Eagle Bearer)
- Universal — works on AR, LMG, SMG, even DMR with the right pick

### Cons

- High skill floor — every miss, reload, and skill rotation taxes your DPS
- Weak to mob-density encounters where target-switching prevents stack maintenance
- Slow ramp means short fights (Hunters, single-elite spawns) finish before you peak
- Mandatory chest + backpack talents lock those slots — no flex room for Vigilance, Obliterate, etc.
- Stacks are hidden from the HUD until you tab into the inventory — feel-based, not number-based, in combat

## FAQ

**Q: Do skill kills or grenade kills generate Strikers stacks?**
A: No. Only weapon hits on enemies generate stacks. Skill damage, grenades, and traps don't contribute.

**Q: Do stacks reset when I swap weapons?**
A: No. Stacks persist across weapon swaps — they only decay over time. Swapping is one of the standard ways to bridge a reload without losing stacks (your sidearm refreshes the decay timer mid-swap).

**Q: Does Press the Advantage work without Risk Management?**
A: Yes, but it's a major DPS loss. Without Risk Management you cap at 200 × 0.65% = +130% TWD. With it, you cap at 200 × 0.9% = +180% TWD. Always run both.

**Q: Is Strikers better than Heartbreaker for AR builds?**
A: Different niches. Heartbreaker has higher burst and easier maintenance (armor-on-kill triggers the bonus), so it wins for fast-paced content like Resistance and General Directives. Strikers wins for sustained encounters where you hold the trigger for 10+ seconds — raid bosses, named lieutenants, Summit elite floors.

**Q: Can I run Strikers with shotguns?**
A: Technically yes — pellets generate stacks per pellet — but the set's RoF bonus barely helps shotguns and the slow trigger pulls between shots can't fight decay above 50 stacks. Use a Heartbreaker or Memento build for shotguns instead.

**Q: How do I keep stacks during reloads?**
A: Three options: (1) pistol-swap to your sidearm and fire 2–3 shots, (2) reload-cancel via roll if you only need a partial mag, or (3) accept the loss — the 4.4s reload on a 100-round LMG only burns ~12 stacks at the top band, which is recoverable in 1–2 seconds of trigger-hold.

**Q: Does headshot damage matter on Strikers?**
A: Yes — headshots count as hits and generate one stack per hit, same as body shots, but the headshot multiplier still applies to the damage they do. Crit/headshot scaling is independent of the Gamble bonus.

**Q: What's the rotation in a long fight?**
A: Fire on a low-priority trash target to ramp to ~100 stacks (5–6 seconds), then swap to the elite/boss with stacks already up. Maintain trigger-hold; only stop shooting when you absolutely have to. Rebuild any time you drop below ~50 stacks rather than letting it bleed all the way to zero.

---

*Last reviewed: 2026-04-25 · TU22.1 · Verified vs in-game*
