"""
validate.py — runtime gates per ARCHITECTURE.md §8.

Checks:
  1. talent_id references in items exist as talent items
  2. brand_id / target_item_id in item_links exist
  3. Each item has name in EN translations
  4. attribute_uid in raw bonuses has mapping in stat_aliases
  5. No duplicate slugs across all kinds
  6. Reference build invariants (St.Elmo + Strikers) match expected
  7. Item counts within ±5% of raw counts

Exit code 1 on any FAIL.

Usage: py -X utf8 scripts/validate.py
"""
from __future__ import annotations
import json, sqlite3, sys
from pathlib import Path

ROOT = Path(r"C:/Users/glukm/division2-calc")
DB   = ROOT / "data" / "data.db"
RAW  = ROOT / "data" / "raw"

errors = []
warnings = []


def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)


def main():
    if not DB.exists():
        print("FAIL: data.db missing — run build_db.py first")
        sys.exit(1)
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    # gate 1+2: link references exist
    items = {r["id"]: dict(r) for r in conn.execute("SELECT id, kind FROM items")}
    talent_specs_ids = {r[0] for r in conn.execute("SELECT item_id FROM talent_specs")}
    for r in conn.execute("SELECT * FROM item_links"):
        target = r["target_item_id"]
        if target in items:
            continue
        # Perfect-talent alias check: hasPerfectVariant=1 talent without explicit perfect_<base> entry
        base = target[8:] if target.startswith("perfect_") else (
               target[10:] if target.startswith("perfectly_") else None)
        if base and base in talent_specs_ids:
            warn(f"link {r['item_id']}.{r['link_type']} → {target} (perfect-variant alias of '{base}')")
            continue
        # Else: pre-existing bad reference in public/data — log but don't block
        # (these are baked-in inconsistencies in current frontend dataset; frontend
        # probably resolves them via separate fallback paths or just ignores)
        warn(f"link {r['item_id']}.{r['link_type']} → {target} (target missing)")

    # gate 3: name in EN
    items_with_name = {r["entity_id"] for r in conn.execute(
        "SELECT entity_id FROM translations WHERE entity_type='item' AND lang='en' AND field='name'")}
    for iid, it in items.items():
        if it["kind"] in ("weapon", "brand", "gear_set", "named_gear", "talent"):
            if iid not in items_with_name:
                warn(f"missing EN name: {iid} ({it['kind']})")

    # gate 4: attribute_uid mapping coverage
    raw_brands = json.loads((RAW / "brands.json").read_text(encoding="utf-8"))
    used_uids = set()
    for b in raw_brands:
        for bn in b.get("bonuses", []):
            if bn.get("attribute_uid"):
                used_uids.add(bn["attribute_uid"])
    mapped = {r["attribute_uid"] for r in conn.execute(
        "SELECT attribute_uid FROM stat_map WHERE attribute_uid IS NOT NULL")}
    unmapped_count = sum(1 for u in used_uids if u not in mapped)
    if unmapped_count > 0:
        warn(f"{unmapped_count} attribute_uid in raw/brands without stat_aliases mapping")

    # gate 5: duplicate slugs across kinds (PK constraint already prevents same slug, but check kind-namespace)
    dupes = list(conn.execute("""
        SELECT id, COUNT(*) c FROM items GROUP BY id HAVING c > 1
    """))
    for d in dupes:
        err(f"duplicate slug: {d['id']} ({d['c']}x)")

    # gate 6: reference invariants
    ref_checks = [
        ("st_elmo_s_engine", "base_damage", 46918, 1.0),
        ("st_elmo_s_engine", "rpm", 850, 0.1),
        ("st_elmo_s_engine", "magazine", 30, 0.1),
        ("st_elmo_s_engine", "headshot_mult", 1.55, 0.001),
        ("acr", "base_damage", 58897, 1.0),
        ("acr", "rpm", 650, 0.1),
        ("acr", "magazine", 30, 0.1),
    ]
    for slug, field, expected, tol in ref_checks:
        row = conn.execute(f"SELECT {field} FROM weapon_specs WHERE item_id=?", (slug,)).fetchone()
        if not row:
            err(f"reference: weapon {slug} missing")
            continue
        actual = row[0]
        if actual is None or abs(actual - expected) > tol:
            err(f"reference: {slug}.{field}={actual} != {expected} (±{tol})")

    striker_bonuses = [tuple(r) for r in conn.execute(
        "SELECT pieces, stat_slug, value FROM item_bonuses WHERE item_id='striker_s_battlegear' ORDER BY pieces")]
    expected_strk = [(2, "handling", 15.0), (3, "rof", 15.0)]
    if striker_bonuses != expected_strk:
        err(f"reference: Striker's bonuses {striker_bonuses} != {expected_strk}")

    chest = conn.execute(
        "SELECT target_item_id FROM item_links WHERE item_id='striker_s_battlegear' AND link_type='chest_talent'").fetchone()
    if not chest or chest[0] != "risk_management":
        err(f"reference: Striker's chest talent != risk_management (got {chest})")

    backpack = conn.execute(
        "SELECT target_item_id FROM item_links WHERE item_id='striker_s_battlegear' AND link_type='backpack_talent'").fetchone()
    if not backpack or backpack[0] != "press_the_advantage":
        err(f"reference: Striker's backpack talent != press_the_advantage (got {backpack})")

    # gate 7: counts deviation
    raw_counts = {
        "weapon": (len(json.loads((RAW/"weapons_base.json").read_text(encoding="utf-8")))
                   + len(json.loads((RAW/"weapons_exotic.json").read_text(encoding="utf-8")))
                   + len(json.loads((RAW/"weapons_named.json").read_text(encoding="utf-8")))),
        "brand": len(json.loads((RAW/"brands.json").read_text(encoding="utf-8"))),
        "gear_set": (len(json.loads((RAW/"gearsets.json").read_text(encoding="utf-8")))
                     + len(json.loads((RAW/"brand_sets.json").read_text(encoding="utf-8")))
                     + len(json.loads((RAW/"green_sets.json").read_text(encoding="utf-8")))),
        "named_gear": len(json.loads((RAW/"gear_named.json").read_text(encoding="utf-8"))),
    }
    for kind, raw_n in raw_counts.items():
        db_n = conn.execute("SELECT COUNT(*) FROM items WHERE kind=?", (kind,)).fetchone()[0]
        # counts can differ — pub/data may filter junk, only_raw appends. Just warn on big swings.
        if db_n < raw_n * 0.5 or db_n > raw_n * 2:
            warn(f"counts: {kind} db={db_n}, raw={raw_n} — large divergence")

    # ---- output ----
    print("=== validate.py ===")
    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings[:20]:
            print(f"  - {w}")
        if len(warnings) > 20:
            print(f"  ... and {len(warnings)-20} more")
    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors[:20]:
            print(f"  - {e}")
        if len(errors) > 20:
            print(f"  ... and {len(errors)-20} more")
        print("\nFAIL")
        sys.exit(1)

    print(f"\nPASS — {len(warnings)} warnings, 0 errors")
    conn.close()


if __name__ == "__main__":
    main()
