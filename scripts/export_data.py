"""
export_data.py — экспортирует data/data.db в формат для фронта (per ARCHITECTURE.md §7.7):

  apps/web/public/data/<lang>/
    items.json     — все items с подставленными переводами для <lang>
    talents.json   — все таланты с переводами
    bonuses.json   — все item_bonuses + item_links
    stats.json     — словарь stat_slug → label (для UI лейблов)

Применяет manual_overrides поверх импорта (per architecture).

Usage: py -X utf8 scripts/export_data.py
"""
from __future__ import annotations
import json, sqlite3
from pathlib import Path
from collections import defaultdict

ROOT    = Path(r"C:/Users/glukm/division2-calc")
DB_PATH = ROOT / "data" / "data.db"
OUT     = ROOT / "apps/web/public/data"
LANGS   = ["en", "ru", "de", "fr", "es"]


def main():
    if not DB_PATH.exists():
        raise SystemExit("data.db not found — run build_db.py first")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # ---- load all data into memory ----
    items = list(conn.execute("SELECT * FROM items").fetchall())
    weapon_specs = {r["item_id"]: dict(r) for r in conn.execute("SELECT * FROM weapon_specs")}
    intrinsic = defaultdict(list)
    for r in conn.execute("SELECT * FROM intrinsic_attrs"):
        intrinsic[r["item_id"]].append(dict(r))
    bonuses = defaultdict(list)
    for r in conn.execute("SELECT * FROM item_bonuses"):
        bonuses[r["item_id"]].append(dict(r))
    links = defaultdict(list)
    for r in conn.execute("SELECT * FROM item_links"):
        links[r["item_id"]].append(dict(r))
    talent_specs = {r["item_id"]: dict(r) for r in conn.execute("SELECT * FROM talent_specs")}

    # translations indexed by (entity_type, entity_id, lang) → {field: text}
    trans = defaultdict(dict)
    for r in conn.execute("SELECT entity_type, entity_id, field, lang, text FROM translations"):
        trans[(r["entity_type"], r["entity_id"], r["lang"])][r["field"]] = r["text"]

    # active overrides indexed by (entity_type, entity_id) → list of {field, value}
    overrides_idx = defaultdict(list)
    for r in conn.execute(
        "SELECT entity_type, entity_id, field, value FROM manual_overrides WHERE active=1"):
        try:
            value = json.loads(r["value"])
        except Exception:
            value = r["value"]
        overrides_idx[(r["entity_type"], r["entity_id"])].append(
            {"field": r["field"], "value": value})

    # stat_map for UI
    stat_map = {r["slug"]: dict(r) for r in conn.execute("SELECT * FROM stat_map")}

    # ---- export per language ----
    for lang in LANGS:
        outdir = OUT / lang
        outdir.mkdir(parents=True, exist_ok=True)

        items_out = []
        for it in items:
            d = dict(it)
            iid = d["id"]
            tr = trans.get(("item", iid, lang), {})
            tr_en = trans.get(("item", iid, "en"), {})

            def t(field, fallback_en=True):
                v = tr.get(field)
                if v: return v
                if fallback_en:
                    return tr_en.get(field)
                return None

            d["name"] = t("name")
            d["description"] = t("description")
            d["flavor"] = t("flavor")
            d["source"] = t("source")
            d["talent_text"] = t("talent_text")
            d["bonuses_text"] = t("bonuses_text") or t("bonus_text")

            # weapon-specific
            if d["kind"] == "weapon":
                spec = weapon_specs.get(iid, {})
                d["base_damage"] = spec.get("base_damage")
                d["rpm"] = spec.get("rpm")
                d["magazine"] = spec.get("magazine")
                d["reload_seconds"] = spec.get("reload_seconds")
                d["optimal_range"] = spec.get("optimal_range")
                d["headshot_mult"] = spec.get("headshot_mult")
                d["is_burst"] = bool(spec.get("is_burst"))
                d["burst_count"] = spec.get("burst_count")
                d["fire_mode"] = spec.get("fire_mode")
                d["bullets_per_shot"] = spec.get("bullets_per_shot")
                try:
                    d["mod_slots"] = json.loads(spec.get("mod_slots_json") or "[]")
                except Exception:
                    d["mod_slots"] = []
                d["intrinsic_attrs"] = [
                    {"stat": ia["stat_slug"], "value": ia["value"], "max": ia["max_value"]}
                    for ia in intrinsic.get(iid, [])]

            # talent-specific
            if d["kind"] == "talent":
                ts = talent_specs.get(iid, {})
                d["applies_to"] = ts.get("applies_to")
                d["bonus_type"] = ts.get("bonus_type")
                d["bucket"] = ts.get("bucket")
                d["has_perfect"] = bool(ts.get("has_perfect"))
                try:
                    d["applicable_classes"] = json.loads(ts.get("applicable_classes_json") or "[]")
                except Exception:
                    d["applicable_classes"] = []

            # bonuses (uniform for brand/gear_set/named/talent)
            if d["kind"] in ("brand", "gear_set", "named_gear", "talent"):
                d["bonuses"] = [
                    {"pieces": b["pieces"], "stat": b["stat_slug"], "value": b["value"],
                     "is_amp": bool(b["is_amp"]), "notes": b["notes"]}
                    for b in bonuses.get(iid, [])]

            # links
            d["links"] = [{"type": l["link_type"], "target": l["target_item_id"]}
                          for l in links.get(iid, [])]

            # apply manual overrides
            for ov in overrides_idx.get(("item", iid), []):
                f = ov["field"]
                d[f] = ov["value"]
            for ov in overrides_idx.get(("translation", f"item:{iid}"), []):
                f, v = ov["field"], ov["value"]
                if ":" in f:
                    field, lng = f.split(":", 1)
                    if lng == lang:
                        d[field] = v
                    elif lng == "en" and not d.get(field):
                        d[field] = v

            # mark fallback if no native translation
            d["_translated"] = lang in [k[2] for k in trans if k[1] == iid and k[0] == "item"]

            # cleanup internal columns
            d.pop("imported_at", None)
            d.pop("source_file", None)

            items_out.append(d)

        # split for export
        items_only = [d for d in items_out if d["kind"] != "talent"]
        talents_only = [d for d in items_out if d["kind"] == "talent"]

        (outdir / "items.json").write_text(
            json.dumps({"_lang": lang, "_count": len(items_only), "items": items_only},
                       ensure_ascii=False, indent=2), encoding="utf-8")
        (outdir / "talents.json").write_text(
            json.dumps({"_lang": lang, "_count": len(talents_only), "talents": talents_only},
                       ensure_ascii=False, indent=2), encoding="utf-8")

        # bonuses (separate, useful for cross-lookups)
        bonuses_export = []
        for it in items_out:
            for b in it.get("bonuses") or []:
                bonuses_export.append({"item_id": it["id"], **b})
        (outdir / "bonuses.json").write_text(
            json.dumps({"_lang": lang, "_count": len(bonuses_export), "bonuses": bonuses_export},
                       ensure_ascii=False, indent=2), encoding="utf-8")

        # stats labels for UI
        stats_out = {}
        for slug in stat_map:
            stat_tr = trans.get(("stat", slug, lang), {})
            stat_tr_en = trans.get(("stat", slug, "en"), {})
            label = stat_tr.get("name") or stat_tr_en.get("name") or slug
            stats_out[slug] = {"label": label, "category": stat_map[slug].get("category"),
                               "kind": stat_map[slug].get("kind")}
        (outdir / "stats.json").write_text(
            json.dumps({"_lang": lang, "stats": stats_out}, ensure_ascii=False, indent=2),
            encoding="utf-8")

    # ---- LEGACY-FORMAT EXPORT (frontend compat shim) ----
    # apps/web SPA reads flat files in old shape. Regenerate from data.db.extra_json.
    LOC_OUT_EN = ROOT / "apps/web/public/locales/en"
    LOC_OUT_RU = ROOT / "apps/web/public/locales/ru"

    def items_with_extra(kind):
        """Yield {**extra_json record, plus injected db fields if extra is missing}"""
        rows = conn.execute(
            "SELECT id, extra_json FROM items WHERE kind=? AND stat_quality='verified' ORDER BY id",
            (kind,)).fetchall()
        out = []
        for r in rows:
            if r["extra_json"]:
                try:
                    out.append(json.loads(r["extra_json"]))
                except Exception:
                    pass
        return out

    legacy_weapons  = items_with_extra("weapon")
    legacy_brands   = items_with_extra("brand")
    legacy_sets     = items_with_extra("gear_set")
    legacy_named    = items_with_extra("named_gear")
    legacy_talents  = items_with_extra("talent")

    meta_keys = {r["key"]: r["value"] for r in conn.execute("SELECT * FROM meta").fetchall()}
    legacy_envelope = {"version": "2.0.0", "gameVersion": meta_keys.get("game_version", "TU22")}

    (OUT / "weapons.json").write_text(json.dumps(
        {**legacy_envelope, "weapons": legacy_weapons}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    (OUT / "brands.json").write_text(json.dumps(
        {**legacy_envelope, "brands": legacy_brands}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    (OUT / "gear-sets.json").write_text(json.dumps(
        {**legacy_envelope, "sets": legacy_sets}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    (OUT / "named-gear.json").write_text(json.dumps(
        {**legacy_envelope, "items": legacy_named}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    (OUT / "talents.json").write_text(json.dumps(
        {**legacy_envelope, "talents": legacy_talents}, ensure_ascii=False, indent=2),
        encoding="utf-8")

    # legacy locales: flat slug→string per category
    def export_locale(out_path, entity_filter, field):
        """Write {slug: text} for items matching filter."""
        out_path.parent.mkdir(parents=True, exist_ok=True)
        for lng, base_dir in (("en", LOC_OUT_EN), ("ru", LOC_OUT_RU)):
            d = {}
            for r in conn.execute("""
                SELECT t.entity_id, t.text
                FROM translations t JOIN items i ON i.id = t.entity_id
                WHERE t.entity_type='item' AND t.lang=? AND t.field=?
                  AND i.kind IN (%s)""" % ",".join(f"'{k}'" for k in entity_filter),
                (lng, field)):
                d[r["entity_id"]] = r["text"]
            (base_dir / out_path.name).write_text(
                json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    # Per-category locales (flat slug → name dict)
    export_locale(Path("weapons.json"),    ["weapon"],     "name")
    export_locale(Path("brands.json"),     ["brand"],      "name")
    export_locale(Path("gear-sets.json"),  ["gear_set"],   "name")
    export_locale(Path("named-gear.json"), ["named_gear"], "name")
    export_locale(Path("talents.json"),    ["talent"],     "name")
    # talent descriptions
    export_locale(Path("talent-desc.json"), ["talent"], "description")
    # weapon source/drop info
    export_locale(Path("weapon-source.json"), ["weapon"], "source")
    # named bonuses + sources
    export_locale(Path("named-bonus.json"), ["named_gear"], "description")
    export_locale(Path("named-source.json"), ["named_gear"], "source")
    # set bonuses descriptions
    export_locale(Path("set-bonuses.json"), ["gear_set"], "set_bonuses")
    export_locale(Path("set-chest.json"),   ["gear_set"], "chest_text")
    export_locale(Path("set-backpack.json"),["gear_set"], "backpack_text")
    # brand bonuses
    export_locale(Path("brand-bonuses.json"), ["brand"], "bonus_text")
    # stats
    for lng, base_dir in (("en", LOC_OUT_EN), ("ru", LOC_OUT_RU)):
        d = {}
        for r in conn.execute(
            "SELECT entity_id, text FROM translations WHERE entity_type='stat' AND field='name' AND lang=?",
            (lng,)):
            d[r["entity_id"]] = r["text"]
        (base_dir / "stats.json").write_text(
            json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    # meta
    meta = {r["key"]: r["value"] for r in conn.execute("SELECT * FROM meta").fetchall()}
    (OUT / "meta.json").write_text(
        json.dumps({"meta": meta, "langs": LANGS,
                    "exported_at": __import__("datetime").datetime.utcnow().isoformat() + "Z"},
                   ensure_ascii=False, indent=2), encoding="utf-8")

    # summary
    total_size = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(f"OK")
    for lang in LANGS:
        ipath = OUT / lang / "items.json"
        if ipath.exists():
            print(f"  {lang}: items={ipath.stat().st_size//1024}KB, "
                  f"talents={(OUT/lang/'talents.json').stat().st_size//1024}KB, "
                  f"bonuses={(OUT/lang/'bonuses.json').stat().st_size//1024}KB")
    print(f"  total exported: {total_size/1024/1024:.1f}MB")

    conn.close()


if __name__ == "__main__":
    main()
