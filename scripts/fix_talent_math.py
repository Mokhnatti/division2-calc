"""Fix 'Perfect Perfect X' bug in talent_math.json.

For each 'Perfect Perfect X':
- Values are the correct Perfect-variant values from game.
- Overwrite 'Perfect X' with these values.
- Add regular 'X' with values derived from description/desc_ru of regular (non-perfect) talent.
- Delete 'Perfect Perfect X'.

Special cases handled per PP_MAP.
"""
import json
import re
from pathlib import Path
from collections import OrderedDict

ROOT = Path(r"C:/Users/glukm/division2-calc/data")

# (pp_key, target_perfect_key, base_key_or_None, base_entry)
# If base_key_or_None is None -> do NOT add a base (talent only exists as Perfect/Perfectly variant).
# base_entry is a dict for the base (regular) variant, or None if no base to add.
PP_MAP = [
    # WD stacking crit => base 20% (20 stacks x 1%), Perfect 24% (24 stacks x 1%) per desc_ru, PP says 25%
    ("Perfect Perfect Obliterate", "Perfect Obliterate", "Obliterate",
     {"wd": 20, "conditional": True, "note": "Critical hits increase weapon damage by 1% for 5s, stacking up to 20%."}),

    # Intimidate: 35% base, 40% perfect (PP). base uses 9 stacks x 4% = 36 (description says +35% to enemies within 10m)
    ("Perfect Perfect Intimidate", "Perfect Intimidate", "Intimidate",
     {"wd": 35, "conditional": True, "note": "+35% weapon damage to enemies within 10m while you have bonus armor."}),

    # Spark: base 15% (description), Perfect 20%
    ("Perfect Perfect Spark", "Perfect Spark", "Spark",
     {"wd": 15, "conditional": True, "note": "Applying a status effect grants +15% weapon damage for 15s."}),

    # Glass Cannon: base 25%, perfect 30%
    ("Perfect Perfect Glass Cannon", "Perfect Glass Cannon", "Glass Cannon",
     {"wd": 25, "conditional": True, "note": "All damage amplified by 25%. All damage taken amplified by 50%."}),

    # Gunslinger: base 23% (desc), perfect 28%
    ("Perfect Perfect Gunslinger", "Perfect Gunslinger", "Gunslinger",
     {"wd": 23, "conditional": True, "note": "Weapon swapping increases total weapon damage by 23% for 5s. Lost for 5s if you swap again."}),

    # Vanguard: utility (not DPS), WD=0
    ("Perfect Perfect Vanguard", "Perfect Vanguard", "Vanguard",
     {"wd": 0, "conditional": True, "note": "Deploying a shield makes it invulnerable for 5s and grants 45% armor as bonus armor to allies for 20s."}),

    # Spotter: base 15%, perfect 20%
    ("Perfect Perfect Spotter", "Perfect Spotter", "Spotter",
     {"wd": 15, "conditional": True, "note": "+15% weapon and skill damage to pulsed enemies."}),

    # Overwatch: base 12%, perfect 14% (per desc_ru) but PP says 20 with stacks mechanic. Keep PP value for Perfect.
    ("Perfect Perfect Overwatch", "Perfect Overwatch", "Overwatch",
     {"wd": 12, "conditional": True, "note": "After staying in cover for 10s, increase your and all allies' total weapon and skill damage by 12% as long as you remain in cover."}),

    # Headhunter: conditional headshot, keep hsd-based, base 15% hsd
    ("Perfect Perfect Headhunter", "Perfect Headhunter", "Headhunter",
     {"hsd": 15, "conditional": True, "note": "After a headshot kill, your next weapon hit within 30s deals 125% of that killing blow's damage."}),

    # Trauma: status effects, not direct DPS, hsd=15 base
    ("Perfect Perfect Trauma", "Perfect Trauma", "Trauma",
     {"hsd": 10, "conditional": True, "note": "Headshots apply blind. Chest shots apply bleed. Cooldown: 30s."}),

    # Companion: base 15% (same as perfect value already used)
    ("Perfect Perfect Companion", "Perfect Companion", "Companion",
     {"wd": 15, "conditional": True, "note": "While within 5m of an ally or skill, total weapon damage +15%."}),

    # Perfectly Explosive Delivery: only exists as Perfectly-variant; no base
    ("Perfect Perfectly Explosive Delivery", "Perfectly Explosive Delivery", None, None),

    # Perfectly Mad Bomber: grenades, no DPS. The base is Mad Bomber already exists.
    ("Perfect Perfectly Mad Bomber", "Perfectly Mad Bomber", "Mad Bomber",
     {"wd": 0, "conditional": True, "note": "Grenade radius increased by 50%. Grenades that kill are refunded. Can be cooked."}),

    # Braced: handling bonus; no direct DPS. Add base 45% handling, Perfect 50%.
    ("Perfect Perfect Braced", "Perfect Braced", "Braced",
     {"handling": 45, "conditional": True, "note": "While in cover weapon handling is increased by 45%."}),

    # Focus: base up to 50% stacks, Perfect up to 60% per desc. PP says 50%.
    ("Perfect Perfect Focus", "Perfect Focus", "Focus",
     {"wd": 50, "conditional": True, "note": "+5% WD per second while aiming with 8x+ scope, up to 50%."}),

    # Perfectly Skilled: skill talent, not WD. Base=Skilled (cooldown reset), not DPS.
    ("Perfect Perfectly Skilled", "Perfectly Skilled", "Skilled",
     {"wd": 0, "conditional": True, "note": "Skill kills have 25% chance to reset skill cooldowns."}),

    # Vigilance: base 25% desc, perfect 25% same value (per desc_ru 3s vs 4s disable) - PP says 30%
    ("Perfect Perfect Vigilance", "Perfect Vigilance", "Vigilance",
     {"wd": 25, "conditional": True, "note": "+25% weapon damage. Taking damage disables this for 4s."}),

    # Composure: base 15%, perfect 20%
    ("Perfect Perfect Composure", "Perfect Composure", "Composure",
     {"wd": 15, "conditional": True, "note": "+15% weapon damage while in cover."}),

    # Clutch: self-sustain, not pure DPS. Base: crit restore 2% armor.
    ("Perfect Perfect Clutch", "Perfect Clutch", "Clutch",
     {"chc": 0, "conditional": True, "note": "Critical hits restore 2% armor when under 15% armor."}),

    # Concussion: base 10% hsd (5 stacks x 10%), perfect 15% per PP (5 x 15%)
    ("Perfect Perfect Concussion", "Perfect Concussion", "Concussion",
     {"hsd": 10, "conditional": True, "note": "Headshots grant +10% HSD for 10s, stacking up to 5 times."}),

    # Perfectly Wicked: base=Wicked (18% per desc), but PP=25%, so Perfectly Wicked should be 25%.
    ("Perfect Perfectly Wicked", "Perfectly Wicked", "Wicked",
     {"wd": 18, "conditional": True, "note": "+18% weapon damage for 20s after applying a status effect."}),

    # Perfectly Unstoppable Force: PP=30 total (cap). Base Unstoppable Force: 25% (5x5%) via desc.
    ("Perfect Perfectly Unstoppable Force", "Perfectly Unstoppable Force", "Unstoppable Force",
     {"wd": 25, "conditional": True, "note": "Kills grant +5% weapon damage for 15s, stacking up to 5."}),

    # Versatile: base 35%, Perfect up to 45% desc_ru - PP says 45
    ("Perfect Perfect Versatile", "Perfect Versatile", "Versatile",
     {"wd": 35, "conditional": True, "note": "Weapon swap amplifies weapon damage based on weapon type for 10s."}),

    # Shock and Awe: talent only exists as Perfect variant. No base.
    ("Perfect Perfect Shock and Awe", "Perfect Shock and Awe", None, None),

    # Creeping Death: status spread utility, not DPS. PP keeps wd=15 per PP note.
    ("Perfect Perfect Creeping Death", "Perfect Creeping Death", "Creeping Death",
     {"wd": 0, "conditional": True, "note": "Applied status effects spread to all enemies within 8m. Cooldown 15s."}),

    # Leadership: base Rubberband armor, WD for allies after kill. Keep PP for Perfect.
    ("Perfect Perfect Leadership", "Perfect Leadership", "Leadership",
     {"wd": 0, "conditional": True, "note": "Cover-to-cover grants 15% armor as bonus armor to self and allies for 10s."}),

    # Adrenaline Rush: bonus armor, no DPS
    ("Perfect Perfect Adrenaline Rush", "Perfect Adrenaline Rush", "Adrenaline Rush",
     {"wd": 0, "conditional": True, "note": "Within 10m of enemy: +20% bonus armor for 5s, stacks x3. Cooldown 5s."}),

    # Combined Arms: skill damage, not WD. Base=25% skill damage for 3s.
    ("Perfect Perfect Combined Arms", "Perfect Combined Arms", "Combined Arms",
     {"wd": 0, "conditional": True, "note": "Shooting an enemy +25% skill damage for 3s."}),

    # Energize: +1 Skill Tier from armor kit, not WD
    ("Perfect Perfect Energize", "Perfect Energize", "Energize",
     {"wd": 0, "conditional": True, "note": "Armor kit grants +1 skill tier for 15s. Cooldown 60s."}),

    # Perfectly Tamper Proof: base=Tamper Proof (shock enemies near skills)
    ("Perfect Perfectly Tamper Proof", "Perfectly Tamper Proof", "Tamper Proof",
     {"wd": 0, "conditional": True, "note": "Enemies within 3m of hive/turret/remote pulse/decoy are shocked. Cooldown 10s per skill."}),

    # Perfectly Opportunistic: base=Opportunistic (shotguns/MMR amplify +10%)
    ("Perfect Perfectly Opportunistic", "Perfectly Opportunistic", "Opportunistic",
     {"wd": 10, "conditional": True, "note": "Shotgun/MMR hits amplify damage enemy takes by +10% for 5s."}),

    # Overclock: base 25% reload/CD reduce, Perfect 30% per PP
    ("Perfect Perfect Overclock", "Perfect Overclock", "Overclock",
     {"reload": 25, "conditional": True, "note": "Allies within 7m of deployed skills: +25% reload speed and -0.2s active CD per second."}),
]


def main() -> None:
    path = ROOT / "talent_math.json"
    data = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=OrderedDict)

    pp_deleted = 0
    perfect_updated = 0
    base_added = 0
    before_after = []

    for pp_key, perfect_key, base_key, base_entry in PP_MAP:
        if pp_key not in data:
            print(f"WARN: missing PP key {pp_key!r}")
            continue

        pp_val = data[pp_key]

        # Capture before snapshot
        before = {
            "pp": dict(pp_val),
            "perfect": dict(data.get(perfect_key, {})) if perfect_key in data else None,
            "base": dict(data.get(base_key, {})) if base_key and base_key in data else None,
        }

        # Overwrite / create Perfect variant with PP values
        data[perfect_key] = OrderedDict(pp_val)
        perfect_updated += 1

        # Add base if specified and not present
        if base_key and base_entry is not None:
            data[base_key] = OrderedDict(base_entry)
            base_added += 1

        # Delete PP key
        del data[pp_key]
        pp_deleted += 1

        after = {
            "perfect": dict(data[perfect_key]),
            "base": dict(data[base_key]) if base_key and base_key in data else None,
        }
        before_after.append((pp_key, perfect_key, base_key, before, after))

    # Write back, preserving insertion order (new base keys appended at end, Perfect keys keep their original position since they were mutated in place)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n=== SUMMARY ===")
    print(f"PP keys deleted:  {pp_deleted}")
    print(f"Perfect updated:  {perfect_updated}")
    print(f"Base keys added:  {base_added}")

    print(f"\n=== SAMPLE BEFORE/AFTER (first 10) ===")
    for pp_key, perfect_key, base_key, before, after in before_after[:10]:
        print(f"\n--- {pp_key} ---")
        print(f"  before PP:      {before['pp']}")
        if before["perfect"] is not None:
            print(f"  before Perfect: {before['perfect']}")
        print(f"  after  Perfect({perfect_key}): {after['perfect']}")
        if base_key:
            print(f"  after  Base({base_key}):    {after['base']}")


if __name__ == "__main__":
    main()
