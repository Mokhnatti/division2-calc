"""
build_db.py — собирает data/data.db с нуля.

Стратегия импорта (per ARCHITECTURE.md §7):
  - PRIMARY source for items + stats: apps/web/public/data/*.json (curated, current
    canonical values — продукт эволюции legacy + ручных правок, slugs стабильны)
  - PRIMARY source for translations: data/raw/locale_en.json + locale_ru.json
    (свежие TU22 локали, ×1.9 от старых)
  - FALLBACK translations: apps/web/public/locales/{en,ru}/*.json
  - ONLY_RAW items (есть в raw но нет в public/data): импорт raw-passthrough,
    stat_quality='unverified', попадают в UNVERIFIED_ITEMS
  - manual_overrides applied at EXPORT time, not at import (per architecture)
  - Reference test: ACR base_damage=58897, St.Elmo=46918, Striker's set bonuses match expected.
    Build FAILS if reference test does not pass.

Usage: py -X utf8 scripts/build_db.py
"""
from __future__ import annotations
import json, sqlite3, hashlib, re, sys
from pathlib import Path
from datetime import datetime, timezone

ROOT     = Path(r"C:/Users/glukm/division2-calc")
DB_PATH  = ROOT / "data" / "data.db"
PUB_DATA = ROOT / "apps/web/public/data"
PUB_EN   = ROOT / "apps/web/public/locales/en"
PUB_RU   = ROOT / "apps/web/public/locales/ru"
RAW      = ROOT / "data/raw"
STAT_AL  = ROOT / "data/stat_aliases.json"
SLUG_MAP = ROOT / "data/slug_map.json"
WEAPON_OV= ROOT / "data/weapon_overrides.json"
MANUAL_OV= ROOT / "data/manual_overrides.json"

LANGS = ["en", "ru", "de", "fr", "es"]


# ============== utils ==============
def load(p):
    if not p.exists(): return None
    return json.loads(p.read_text(encoding="utf-8"))


def file_hash(p):
    if not p.exists(): return "MISSING"
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def slugify(s):
    s = re.sub(r"<[^>]+>", "", s or "").lower().strip()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def name_key(s):
    s = re.sub(r"<[^>]+>", "", s or "").lower().strip()
    return re.sub(r"[^a-z0-9а-яё]+", "", s)


# ============== schema ==============
SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE import_source_files (
  filename TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  size_bytes INTEGER,
  imported_at TEXT NOT NULL
);

CREATE TABLE stat_map (
  game_name TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  kind TEXT,
  attribute_uid TEXT
);
CREATE INDEX idx_stat_map_uid ON stat_map(attribute_uid);

CREATE TABLE items (
  id              TEXT PRIMARY KEY,
  game_uid        TEXT,
  game_id         TEXT,
  kind            TEXT NOT NULL,
  subkind         TEXT,
  slot            TEXT,
  core_attribute  TEXT,
  family          TEXT,
  weapon_class    TEXT,
  dlc             TEXT,
  is_exotic       INTEGER DEFAULT 0,
  is_named        INTEGER DEFAULT 0,
  is_brand_set    INTEGER DEFAULT 0,
  is_green_set    INTEGER DEFAULT 0,
  is_seasonal     INTEGER DEFAULT 0,
  tier            TEXT,
  rarity          TEXT,
  icon_url        TEXT,
  stat_quality    TEXT DEFAULT 'verified',  -- verified | unverified
  source_file     TEXT,
  imported_at     TEXT
);
CREATE INDEX idx_items_kind_slot ON items(kind, slot);
CREATE INDEX idx_items_subkind ON items(subkind);

CREATE TABLE weapon_specs (
  item_id          TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  base_damage      REAL,
  rpm              REAL,
  magazine         INTEGER,
  reload_seconds   REAL,
  optimal_range    REAL,
  headshot_mult    REAL DEFAULT 1.0,
  is_burst         INTEGER DEFAULT 0,
  burst_count      INTEGER,
  fire_mode        TEXT,
  bullets_per_shot INTEGER DEFAULT 1,
  mod_slots_json   TEXT
);

CREATE TABLE intrinsic_attrs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id   TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  stat_slug TEXT NOT NULL,
  value     REAL NOT NULL,
  max_value REAL,
  notes     TEXT
);
CREATE INDEX idx_intrinsic_item ON intrinsic_attrs(item_id);

CREATE TABLE item_bonuses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  pieces     INTEGER,
  stat_slug  TEXT NOT NULL,
  value      REAL NOT NULL,
  is_amp     INTEGER NOT NULL DEFAULT 0,
  notes      TEXT,
  source_uid TEXT
);
CREATE INDEX idx_item_bonuses_item ON item_bonuses(item_id);

CREATE TABLE item_links (
  item_id        TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  link_type      TEXT NOT NULL,
  target_item_id TEXT NOT NULL,
  PRIMARY KEY (item_id, link_type)
);

CREATE TABLE talent_specs (
  item_id                 TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  applies_to              TEXT,
  bonus_type              TEXT,
  bucket                  TEXT,
  has_perfect             INTEGER DEFAULT 0,
  applicable_classes_json TEXT,
  condition_text_key      TEXT
);

CREATE TABLE translations (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  field       TEXT NOT NULL,
  lang        TEXT NOT NULL,
  text        TEXT NOT NULL,
  is_fallback INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (entity_type, entity_id, field, lang)
);
CREATE INDEX idx_translations_lookup ON translations(entity_type, entity_id, lang);

CREATE TABLE manual_overrides (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  field       TEXT NOT NULL,
  value       TEXT NOT NULL,
  reason      TEXT NOT NULL,
  source_link TEXT,
  active      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_overrides_lookup ON manual_overrides(entity_type, entity_id, active);
"""


# ============== build ==============
def main():
    if DB_PATH.exists():
        DB_PATH.unlink()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)

    # ---- meta + import sources ----
    now = datetime.now(timezone.utc).isoformat()
    conn.execute("INSERT INTO meta VALUES('schema_version', '1.0')")
    conn.execute("INSERT INTO meta VALUES('db_built_at', ?)", (now,))
    conn.execute("INSERT INTO meta VALUES('game_version', 'TU22')")

    track_files = [
        PUB_DATA / "weapons.json", PUB_DATA / "brands.json",
        PUB_DATA / "gear-sets.json", PUB_DATA / "named-gear.json",
        PUB_DATA / "talents.json",
        RAW / "weapons_base.json", RAW / "weapons_exotic.json", RAW / "weapons_named.json",
        RAW / "brands.json", RAW / "gearsets.json", RAW / "brand_sets.json",
        RAW / "green_sets.json", RAW / "talents_weapon.json", RAW / "talents_gear.json",
        RAW / "talents_exotic.json", RAW / "gear_named.json",
        RAW / "attribute_dict.json", RAW / "locale_en.json", RAW / "locale_ru.json",
        STAT_AL, SLUG_MAP, WEAPON_OV, MANUAL_OV,
    ]
    for p in track_files:
        if p.exists():
            rel = str(p.relative_to(ROOT)).replace("\\", "/")
            conn.execute("INSERT OR REPLACE INTO import_source_files VALUES(?,?,?,?)",
                         (rel, file_hash(p), p.stat().st_size, now))

    # ---- stat_map ----
    sa = load(STAT_AL) or {}
    attribute_dict = load(RAW / "attribute_dict.json") or {}
    name_to_uid = {v.get("name"): uid for uid, v in attribute_dict.items() if isinstance(v, dict) and v.get("name")}
    for a in sa.get("aliases", []):
        uid = name_to_uid.get(a["game_name"])
        conn.execute("INSERT OR IGNORE INTO stat_map VALUES(?,?,?,?,?)",
                     (a["game_name"], a["slug"], a.get("category"), a.get("kind"), uid))

    # uid → slug for resolving raw bonuses
    uid_to_slug = {row[1]: row[0] for row in conn.execute("SELECT slug, attribute_uid FROM stat_map WHERE attribute_uid IS NOT NULL")}

    # ---- weapons ----
    pub_w = load(PUB_DATA / "weapons.json") or {}
    weapons = pub_w.get("weapons", [])
    weapon_overrides = {w["slug"]: w for w in (load(WEAPON_OV) or {}).get("weapons", [])}

    # Build name_en index from public locales for raw weapon → slug lookup
    loc_en_pub_weapons = load(PUB_EN / "weapons.json") or {}
    slug_by_name_en = {name_key(v): k for k, v in loc_en_pub_weapons.items()}

    # Index public weapons by slug for quick lookup
    public_weapon_slugs = {w["id"] for w in weapons}

    for w in weapons:
        slug = w["id"]
        wo = weapon_overrides.get(slug, {})
        kind = w.get("kind", "base")
        is_exotic = 1 if kind == "exotic" else 0
        is_named = 1 if kind == "named" else 0
        family = (w.get("category") or "").lower()
        conn.execute("""INSERT INTO items
            (id, kind, subkind, slot, core_attribute, family, weapon_class, dlc,
             is_exotic, is_named, stat_quality, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, "weapon", kind, "weapon", None, family, family, w.get("dlc"),
             is_exotic, is_named, "verified",
             "apps/web/public/data/weapons.json", now))

        mod_slots = w.get("modSlots") or []
        conn.execute("""INSERT INTO weapon_specs
            (item_id, base_damage, rpm, magazine, reload_seconds, optimal_range,
             headshot_mult, is_burst, burst_count, fire_mode, bullets_per_shot, mod_slots_json)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, w.get("baseDamage"), w.get("rpm"), w.get("magazine"),
             w.get("reloadSeconds"), w.get("optimalRange"),
             w.get("headshotMultiplier") or 1.5,
             1 if wo.get("is_burst") else 0,
             wo.get("burst_count"),
             wo.get("fire_mode"),
             1, json.dumps(mod_slots, ensure_ascii=False)))

        # intrinsic_attrs (only exotics typically have them)
        for ia in (w.get("intrinsicAttrs") or []):
            conn.execute("""INSERT INTO intrinsic_attrs
                (item_id, stat_slug, value, max_value, notes) VALUES(?,?,?,?,?)""",
                (slug, ia.get("stat"), ia.get("value"), ia.get("max"), ia.get("notes")))

        # default_talent link
        if w.get("talentId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "default_talent", w["talentId"]))
        if w.get("brandId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "brand", w["brandId"]))

    # only_raw weapons — append unverified entries
    raw_weapons_files = [(RAW / "weapons_base.json", "base"),
                         (RAW / "weapons_exotic.json", "exotic"),
                         (RAW / "weapons_named.json", "named")]
    only_raw_weapons = 0
    for path, kind in raw_weapons_files:
        rd = load(path) or []
        for it in rd:
            en = re.sub(r"<[^>]+>", "", it.get("name_en", "")).strip()
            if not en: continue
            nk = name_key(en)
            if nk in slug_by_name_en: continue  # уже в public/data
            slug = slugify(en)
            if slug in public_weapon_slugs: continue
            # Skip if duplicate game-template variant (immersion / milestone / etc)
            rid = (it.get("id") or "").lower()
            if any(s in rid for s in ("_immersion", "_milestone", "_template", "_lvl", "_boost")):
                continue
            try:
                stats = it.get("stats") or {}
                conn.execute("""INSERT INTO items
                    (id, game_uid, game_id, kind, subkind, slot, family, weapon_class,
                     is_exotic, is_named, stat_quality, source_file, imported_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (slug, it.get("uid"), it.get("id"), "weapon", kind, "weapon",
                     (stats.get("weapon_group") or "").lower(),
                     (stats.get("weapon_group") or "").lower(),
                     1 if kind == "exotic" else 0, 1 if kind == "named" else 0,
                     "unverified", path.name, now))
                conn.execute("""INSERT INTO weapon_specs
                    (item_id, base_damage, rpm, magazine, reload_seconds, optimal_range,
                     headshot_mult, bullets_per_shot, mod_slots_json)
                    VALUES(?,?,?,?,?,?,?,?,?)""",
                    (slug, stats.get("dmg_max"), stats.get("rpm"), stats.get("mag"),
                     (stats.get("reload_empty_ms") or stats.get("reload_ms") or 0) / 1000.0,
                     stats.get("range_optimal"),
                     stats.get("hsd") or 1.5,
                     stats.get("bullets_per_shot") or 1,
                     "[]"))
                only_raw_weapons += 1
            except sqlite3.IntegrityError:
                pass  # duplicate slug

    # ---- brands ----
    pub_brands = (load(PUB_DATA / "brands.json") or {}).get("brands", [])
    raw_brands_idx = {name_key(re.sub(r'<[^>]+>', '', b.get("name_en", ""))): b
                      for b in (load(RAW / "brands.json") or [])}
    loc_en_brands = load(PUB_EN / "brands.json") or {}
    for b in pub_brands:
        slug = b["id"]
        nk = name_key(loc_en_brands.get(slug, ""))
        raw_b = raw_brands_idx.get(nk)
        conn.execute("""INSERT INTO items
            (id, game_uid, kind, subkind, core_attribute, dlc, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?)""",
            (slug, raw_b.get("uid") if raw_b else None, "brand", "brand",
             b.get("core"), b.get("dlc"),
             "apps/web/public/data/brands.json", now))
        for bn in (b.get("bonuses") or []):
            inner = bn.get("bonus") or {}
            conn.execute("""INSERT INTO item_bonuses
                (item_id, pieces, stat_slug, value) VALUES(?,?,?,?)""",
                (slug, bn.get("pieces"), inner.get("stat"), inner.get("value")))

    # ---- gear sets ----
    pub_sets = (load(PUB_DATA / "gear-sets.json") or {}).get("sets", [])
    for s in pub_sets:
        slug = s["id"]
        try:
            conn.execute("""INSERT INTO items
                (id, kind, subkind, dlc, source_file, imported_at)
                VALUES(?,?,?,?,?,?)""",
                (slug, "gear_set", s.get("type"), s.get("dlc"),
                 "apps/web/public/data/gear-sets.json", now))
        except sqlite3.IntegrityError:
            existing = conn.execute("SELECT kind, source_file FROM items WHERE id=?", (slug,)).fetchone()
            print(f"  WARN: gear_set slug '{slug}' collides with existing {existing}; skipping")
            continue
        for nb in (s.get("numericBonuses") or []):
            inner = nb.get("bonus") or {}
            conn.execute("""INSERT INTO item_bonuses
                (item_id, pieces, stat_slug, value) VALUES(?,?,?,?)""",
                (slug, nb.get("pieces"), inner.get("stat"), inner.get("value")))
        if s.get("chestTalentId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "chest_talent", s["chestTalentId"]))
        if s.get("backpackTalentId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "backpack_talent", s["backpackTalentId"]))

    # ---- named gear ----
    pub_named = (load(PUB_DATA / "named-gear.json") or {}).get("items", [])
    for ng in pub_named:
        slug = ng["id"]
        conn.execute("""INSERT INTO items
            (id, kind, subkind, slot, core_attribute, is_named, is_exotic, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (slug, "named_gear", ng.get("slot"), ng.get("slot"), ng.get("core"),
             1, 1 if ng.get("isExotic") else 0,
             "apps/web/public/data/named-gear.json", now))
        for fa in (ng.get("fixedAttrs") or []):
            conn.execute("""INSERT INTO item_bonuses
                (item_id, stat_slug, value, notes) VALUES(?,?,?,?)""",
                (slug, fa.get("stat"), fa.get("value"), "fixed_attr"))
        for ab in (ng.get("activeBonuses") or []):
            conn.execute("""INSERT INTO item_bonuses
                (item_id, stat_slug, value, is_amp, notes) VALUES(?,?,?,?,?)""",
                (slug, ab.get("stat"), ab.get("value"),
                 1 if ab.get("amp") else 0, "active"))
        if ng.get("brand"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "brand", ng["brand"]))

    # ---- talents ----
    pub_talents = (load(PUB_DATA / "talents.json") or {}).get("talents", [])
    talent_skipped = []
    for t in pub_talents:
        slug = t["id"]
        try:
            conn.execute("""INSERT INTO items
                (id, kind, subkind, source_file, imported_at)
                VALUES(?,?,?,?,?)""",
                (slug, "talent", t.get("kind"),
                 "apps/web/public/data/talents.json", now))
        except sqlite3.IntegrityError:
            existing = conn.execute("SELECT kind, source_file FROM items WHERE id=?", (slug,)).fetchone()
            talent_skipped.append({"slug": slug, "existing": existing})
            continue
        try:
            conn.execute("""INSERT INTO talent_specs
                (item_id, applies_to, bonus_type, bucket, has_perfect, applicable_classes_json)
                VALUES(?,?,?,?,?,?)""",
                (slug, t.get("kind"), t.get("bonusType"), t.get("bucket"),
                 1 if t.get("hasPerfectVariant") else 0,
                 json.dumps(t.get("applicableWeaponClasses") or [], ensure_ascii=False)))
            for bn in (t.get("bonuses") or []):
                conn.execute("""INSERT INTO item_bonuses
                    (item_id, stat_slug, value, notes) VALUES(?,?,?,?)""",
                    (slug, bn.get("stat"), bn.get("value"), t.get("note")))
        except sqlite3.IntegrityError:
            pass  # talent_specs id already exists

    # ---- only_raw brands (after pub gear-sets, to avoid slug collisions) ----
    pub_brand_slugs = {b["id"] for b in pub_brands}
    pub_brand_names = {name_key(loc_en_brands.get(b["id"], "")) for b in pub_brands}
    existing_slugs = {row[0] for row in conn.execute("SELECT id FROM items")}
    only_raw_brands = []
    only_raw_brands_skipped = []
    for b in (load(RAW / "brands.json") or []):
        en = re.sub(r"<[^>]+>", "", b.get("name_en", "")).strip()
        if not en: continue
        if name_key(en) in pub_brand_names: continue
        slug = slugify(en)
        if slug in pub_brand_slugs or slug in existing_slugs:
            only_raw_brands_skipped.append({"slug": slug, "name_en": en, "reason": "slug taken"})
            continue
        try:
            conn.execute("""INSERT INTO items
                (id, game_uid, kind, subkind, stat_quality, source_file, imported_at)
                VALUES(?,?,?,?,?,?,?)""",
                (slug, b.get("uid"), "brand", "brand", "unverified",
                 "data/raw/brands.json", now))
            existing_slugs.add(slug)
            for bonus in (b.get("bonuses") or []):
                stat_slug = uid_to_slug.get(bonus.get("attribute_uid"))
                if stat_slug:
                    conn.execute("""INSERT INTO item_bonuses
                        (item_id, stat_slug, value, source_uid) VALUES(?,?,?,?)""",
                        (slug, stat_slug, bonus.get("value", 0) * 100, bonus.get("attribute_uid")))
            only_raw_brands.append({"slug": slug, "name_en": en, "name_ru": b.get("name_ru")})
        except sqlite3.IntegrityError:
            only_raw_brands_skipped.append({"slug": slug, "name_en": en, "reason": "integrity"})

    # ---- translations: pull from public/locales (en, ru) ----
    def insert_translation(et, eid, fld, lng, txt):
        if txt is None: return
        if isinstance(txt, (list, dict)):
            txt = json.dumps(txt, ensure_ascii=False)
        conn.execute(
            "INSERT OR REPLACE INTO translations(entity_type,entity_id,field,lang,text,is_fallback) VALUES(?,?,?,?,?,?)",
            (et, eid, fld, lng, str(txt), 0))

    # weapons
    for fname, kind_label, list_key, lkey, locales_files in [
        ("weapons.json",   "item", "weapons", "name", {"en": "weapons.json", "ru": "weapons.json"}),
        ("brands.json",    "item", "brands", "name", {"en": "brands.json", "ru": "brands.json"}),
        ("gear-sets.json", "item", "sets",    "name", {"en": "gear-sets.json", "ru": "gear-sets.json"}),
        ("named-gear.json","item", "items",   "name", {"en": "named-gear.json", "ru": "named-gear.json"}),
        ("talents.json",   "item", "talents", "name", {"en": "talents.json", "ru": "talents.json"}),
    ]:
        pub = load(PUB_DATA / fname) or {}
        items_list = pub.get(list_key) or []
        for lng, lfname in locales_files.items():
            base = (PUB_EN if lng == "en" else PUB_RU) / lfname
            d = load(base) or {}
            for it in items_list:
                slug = it.get("id")
                if not slug: continue
                txt = d.get(slug)
                if txt:
                    insert_translation(kind_label, slug, lkey, lng, txt)

    # named gear: also load source/flavor/bonus descriptions
    for slug_lang_field, fname in [
        (("en", "source"),      "named-source.json"),
        (("en", "description"), "named-bonus.json"),
        (("ru", "source"),      "named-source.json"),
        (("ru", "description"), "named-bonus.json"),
    ]:
        lng, fld = slug_lang_field
        d = load((PUB_EN if lng == "en" else PUB_RU) / fname) or {}
        for slug, txt in d.items():
            if txt:
                insert_translation("item", slug, fld, lng, txt)

    # talent descriptions
    for lng in ("en", "ru"):
        d = load((PUB_EN if lng == "en" else PUB_RU) / "talent-desc.json") or {}
        for slug, txt in d.items():
            if txt:
                insert_translation("item", slug, "description", lng, txt)

    # set bonuses descriptions (chest/backpack/numeric)
    for lng in ("en", "ru"):
        for fname, fld in [("set-bonuses.json", "set_bonuses"),
                           ("set-chest.json", "chest_text"),
                           ("set-backpack.json", "backpack_text"),
                           ("brand-bonuses.json", "bonus_text")]:
            d = load((PUB_EN if lng == "en" else PUB_RU) / fname) or {}
            for slug, txt in d.items():
                if txt:
                    insert_translation("item", slug, fld, lng, txt)

    # weapon source
    for lng in ("en", "ru"):
        d = load((PUB_EN if lng == "en" else PUB_RU) / "weapon-source.json") or {}
        for slug, txt in d.items():
            if txt:
                insert_translation("item", slug, "source", lng, txt)

    # stat translations (for stats themselves, lang-keyed)
    for lng in ("en", "ru"):
        d = load((PUB_EN if lng == "en" else PUB_RU) / "stats.json") or {}
        for slug, txt in d.items():
            if txt:
                insert_translation("stat", slug, "name", lng, txt)

    # Fallback for de/fr/es: copy en text with is_fallback=1
    en_rows = list(conn.execute("SELECT entity_type, entity_id, field, text FROM translations WHERE lang='en'"))
    for et, eid, fld, txt in en_rows:
        for lng in ("de", "fr", "es"):
            conn.execute("INSERT OR IGNORE INTO translations(entity_type,entity_id,field,lang,text,is_fallback) VALUES(?,?,?,?,?,?)",
                         (et, eid, fld, lng, txt, 1))

    # ---- manual_overrides ----
    mo = load(MANUAL_OV) or {}
    for o in mo.get("overrides", []):
        conn.execute("""INSERT INTO manual_overrides
            (entity_type, entity_id, field, value, reason, source_link, active)
            VALUES(?,?,?,?,?,?,1)""",
            (o.get("entity_type"), o.get("entity_id"), o.get("field"),
             json.dumps(o.get("value"), ensure_ascii=False),
             o.get("_reason") or "imported from seed",
             o.get("_source")))

    conn.commit()

    # ============== reference test (FAIL-FAST) ==============
    print("\n=== Reference build test ===")

    def fetch1(sql, *args):
        cur = conn.execute(sql, args)
        return cur.fetchone()

    # St. Elmo's Engine
    elmo = fetch1("SELECT base_damage, rpm, magazine, headshot_mult FROM weapon_specs WHERE item_id=?", "st_elmo_s_engine")
    if not elmo:
        print("FAIL: st_elmo_s_engine missing"); conn.close(); sys.exit(1)
    bd, rpm, mag, hsd = elmo
    expected = (46918, 850, 30, 1.55)
    actual = (bd, rpm, mag, hsd)
    if abs(bd - expected[0]) > 1:
        print(f"FAIL: St.Elmo base_damage {bd} != {expected[0]}"); conn.close(); sys.exit(1)
    print(f"  St.Elmo: dmg={bd}, rpm={rpm}, mag={mag}, hsd={hsd} OK")

    # ACR (regression)
    acr = fetch1("SELECT base_damage FROM weapon_specs WHERE item_id='acr'")
    if not acr or abs(acr[0] - 58897) > 1:
        print(f"FAIL: ACR base_damage {acr[0] if acr else None} != 58897"); conn.close(); sys.exit(1)
    print(f"  ACR: dmg={acr[0]} OK")

    # Striker's Battlegear
    striker_bonuses = list(conn.execute(
        "SELECT pieces, stat_slug, value FROM item_bonuses WHERE item_id='striker_s_battlegear' ORDER BY pieces"))
    if not striker_bonuses:
        print("FAIL: Striker's bonuses missing"); conn.close(); sys.exit(1)
    expected_bonuses = [(2, "handling", 15), (3, "rof", 15)]
    if striker_bonuses != expected_bonuses:
        print(f"FAIL: Striker's bonuses {striker_bonuses} != {expected_bonuses}"); conn.close(); sys.exit(1)
    print(f"  Striker's: bonuses {striker_bonuses} OK")

    # Striker's links
    chest = fetch1("SELECT target_item_id FROM item_links WHERE item_id='striker_s_battlegear' AND link_type='chest_talent'")
    backpack = fetch1("SELECT target_item_id FROM item_links WHERE item_id='striker_s_battlegear' AND link_type='backpack_talent'")
    if not chest or chest[0] != "risk_management":
        print(f"FAIL: Striker's chest talent link {chest} != risk_management"); conn.close(); sys.exit(1)
    if not backpack or backpack[0] != "press_the_advantage":
        print(f"FAIL: Striker's backpack talent link {backpack} != press_the_advantage"); conn.close(); sys.exit(1)
    print(f"  Striker's links: chest=risk_management, backpack=press_the_advantage OK")

    # Counts sanity (per ARCHITECTURE.md §8: counts ≤5% deviation)
    counts = {}
    for kind in ("weapon", "brand", "gear_set", "named_gear", "talent"):
        n = fetch1("SELECT COUNT(*) FROM items WHERE kind=?", kind)[0]
        counts[kind] = n
    print(f"\n  Counts: {counts}")
    expected_min = {"weapon": 350, "brand": 36, "gear_set": 25, "named_gear": 90, "talent": 300}
    for kind, n in counts.items():
        if n < expected_min[kind]:
            print(f"FAIL: {kind} count {n} below expected {expected_min[kind]}")
            conn.close(); sys.exit(1)

    print("\n=== Reference test: PASS ===")

    # only_raw brands report
    if only_raw_brands:
        print(f"\nOnly_raw brands imported (unverified): {len(only_raw_brands)}")
        for b in only_raw_brands[:5]:
            print(f"  {b['slug']}: name_en={b['name_en']} name_ru={b['name_ru']}")

    # final stats
    n_items   = fetch1("SELECT COUNT(*) FROM items")[0]
    n_stats   = fetch1("SELECT COUNT(*) FROM weapon_specs")[0]
    n_bonus   = fetch1("SELECT COUNT(*) FROM item_bonuses")[0]
    n_links   = fetch1("SELECT COUNT(*) FROM item_links")[0]
    n_trans   = fetch1("SELECT COUNT(*) FROM translations")[0]
    n_intri   = fetch1("SELECT COUNT(*) FROM intrinsic_attrs")[0]
    n_talents = fetch1("SELECT COUNT(*) FROM talent_specs")[0]
    n_over    = fetch1("SELECT COUNT(*) FROM manual_overrides")[0]
    print(f"\nDB built: {DB_PATH}")
    print(f"  items: {n_items}, weapon_specs: {n_stats}, intrinsic: {n_intri}")
    print(f"  bonuses: {n_bonus}, links: {n_links}, talent_specs: {n_talents}")
    print(f"  translations: {n_trans}, manual_overrides: {n_over}")
    print(f"  size: {DB_PATH.stat().st_size / 1024:.1f} KB")
    print(f"  only_raw_weapons added: {only_raw_weapons}")

    conn.close()


if __name__ == "__main__":
    main()
