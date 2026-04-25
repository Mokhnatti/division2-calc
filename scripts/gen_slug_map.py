"""
gen_slug_map.py — извлечь канонический мост slug → name_en/name_ru
из ТЕКУЩИХ apps/web/public/data/*.json и apps/web/public/locales/{en,ru}/*.json.

Это нужно для сохранения существующих URL-ов / SEO. Новые сущности (after TU22)
получат slug = slugify(name_en).

Output: data/slug_map.json — индекс по name_en (lowercase, normalized) → slug + kind.
"""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT   = Path(r"C:/Users/glukm/division2-calc")
PUB    = ROOT / "apps/web/public/data"
LOC_EN = ROOT / "apps/web/public/locales/en"
LOC_RU = ROOT / "apps/web/public/locales/ru"
OUT    = ROOT / "data/slug_map.json"

KIND_FILES = {
    "weapon":     ("weapons.json",    "weapons"),
    "brand":      ("brands.json",     "brands"),
    "gear_set":   ("gear-sets.json",  "sets"),
    "named_gear": ("named-gear.json", "items"),
    "talent":     ("talents.json",    "talents"),
}

LOC_FILES = {
    "weapon":     "weapons.json",
    "brand":      "brands.json",
    "gear_set":   "gear-sets.json",
    "named_gear": "named-gear.json",
    "talent":     "talents.json",
}


def name_key(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    s = s.lower().strip()
    return re.sub(r"[^a-z0-9а-яё]+", "", s)


def load(p):
    if not p.exists(): return None
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    by_kind = {k: {} for k in KIND_FILES}
    by_name_en = {}  # name_key(en) → list of {slug, kind}
    by_name_ru = {}

    for kind, (fname, list_key) in KIND_FILES.items():
        public = load(PUB / fname)
        if not public: continue
        items = public.get(list_key) or public.get("items") or []
        loc_en = load(LOC_EN / LOC_FILES[kind]) or {}
        loc_ru = load(LOC_RU / LOC_FILES[kind]) or {}
        for it in items:
            slug = it.get("id")
            if not slug: continue
            name_en = loc_en.get(slug) or slug
            name_ru = loc_ru.get(slug)
            entry = {"slug": slug, "kind": kind,
                     "name_en": name_en, "name_ru": name_ru,
                     "subkind": it.get("type") or it.get("kind") or it.get("category"),
                     "slot": it.get("slot")}
            by_kind[kind][slug] = entry
            if name_en:
                by_name_en.setdefault(name_key(name_en), []).append(entry)
            if name_ru:
                by_name_ru.setdefault(name_key(name_ru), []).append(entry)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "_doc": "Slug map: existing public-data slugs → name_en/name_ru. Used by build_db to preserve URL-stable identifiers. New entities (post-TU22) get slugify(name_en).",
        "_generated_at": __import__("datetime").datetime.now().isoformat(),
        "_counts": {k: len(v) for k, v in by_kind.items()},
        "by_kind": by_kind,
        "by_name_en": by_name_en,
        "by_name_ru": by_name_ru,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK: {OUT}")
    for k, v in by_kind.items():
        print(f"  {k}: {len(v)}")


if __name__ == "__main__":
    main()
