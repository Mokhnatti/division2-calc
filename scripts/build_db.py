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


def strip_color(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


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
  exotic_mechanic TEXT,                      -- named_gear: text describing exotic mechanic
  extra_json      TEXT,                      -- passthrough fields from public/data not in schema
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
  mod_slots_json   TEXT,
  built_in_mods_json TEXT,                  -- exotic weapons: pre-installed mods
  default_talent_id  TEXT,                   -- talentId from public/data (links table also has it but mirror here for export)
  tal_type           TEXT,                   -- talType: amp/kill/stacks/etc
  tal_bonus          REAL,                   -- talBonus magnitude
  tal_max            REAL                    -- talMax cap
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

    # ---- stat_map (3 lookup paths: by_text, by_game_name, by_uid) ----
    sa = load(STAT_AL) or {}
    by_text = sa.get("by_text", {})
    by_game_name = sa.get("by_game_name", {})

    attribute_dict = load(RAW / "attribute_dict.json") or {}
    # build by_uid: lookup uid → slug via attribute_dict's name field
    by_uid = dict(sa.get("by_uid", {}))
    for uid, v in attribute_dict.items():
        if isinstance(v, dict):
            game_name = v.get("name")
            if game_name and game_name in by_game_name:
                by_uid[uid] = by_game_name[game_name]
    # also: bonus_ref_names + all_ref_names linking uids to canonical name in attribute_dict
    for uid, v in attribute_dict.items():
        if not isinstance(v, dict): continue
        for ref_field in ("bonus_ref_names", "all_ref_names"):
            for ref_name in (v.get(ref_field) or []):
                if ref_name in by_game_name and uid not in by_uid:
                    by_uid[uid] = by_game_name[ref_name]

    # populate stat_map (informational, denormalized)
    inserted = set()
    for game_name, slug in by_game_name.items():
        uid = next((u for u, v in attribute_dict.items() if isinstance(v, dict) and v.get("name") == game_name), None)
        if (game_name, slug) not in inserted:
            try:
                conn.execute("INSERT OR IGNORE INTO stat_map VALUES(?,?,?,?,?)",
                             (game_name, slug, None, None, uid))
                inserted.add((game_name, slug))
            except Exception:
                pass

    def resolve_stat(*, text=None, game_name=None, uid=None):
        """Resolve any of (text/game_name/uid) → slug. Returns None if not found."""
        if uid and uid in by_uid: return by_uid[uid]
        if game_name and game_name in by_game_name: return by_game_name[game_name]
        if text:
            t = text.strip()
            if t in by_text: return by_text[t]
            # case-insensitive try
            for k, v in by_text.items():
                if k.lower() == t.lower(): return v
        return None

    uid_to_slug = by_uid  # alias for legacy usage

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
        # extra_json = COMPLETE source record (lossless passthrough)
        extra_json = json.dumps(w, ensure_ascii=False)

        conn.execute("""INSERT INTO items
            (id, kind, subkind, slot, core_attribute, family, weapon_class, dlc,
             is_exotic, is_named, stat_quality, extra_json, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, "weapon", kind, "weapon", None, family, family, w.get("dlc"),
             is_exotic, is_named, "verified", extra_json,
             "apps/web/public/data/weapons.json", now))

        mod_slots = w.get("modSlots") or []
        built_in = w.get("builtInMods") or []
        conn.execute("""INSERT INTO weapon_specs
            (item_id, base_damage, rpm, magazine, reload_seconds, optimal_range,
             headshot_mult, is_burst, burst_count, fire_mode, bullets_per_shot,
             mod_slots_json, built_in_mods_json, default_talent_id, tal_type, tal_bonus, tal_max)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, w.get("baseDamage"), w.get("rpm"), w.get("magazine"),
             w.get("reloadSeconds"), w.get("optimalRange"),
             w.get("headshotMultiplier") or 1.5,
             1 if wo.get("is_burst") else 0,
             wo.get("burst_count"),
             wo.get("fire_mode"),
             1, json.dumps(mod_slots, ensure_ascii=False),
             json.dumps(built_in, ensure_ascii=False) if built_in else None,
             w.get("talentId"), w.get("talType"), w.get("talBonus"), w.get("talMax")))

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
    # SOURCE OF TRUTH: text strings from public/locales/en/brand-bonuses.json
    # (raw/brands.json bonuses are EMPTY due to parser bug; public/data/brands.json
    # has wrong stat slugs in many records)
    pub_brands = (load(PUB_DATA / "brands.json") or {}).get("brands", [])
    raw_brands_idx = {name_key(re.sub(r'<[^>]+>', '', b.get("name_en", ""))): b
                      for b in (load(RAW / "brands.json") or [])}
    loc_en_brands = load(PUB_EN / "brands.json") or {}
    bonus_text_en = load(PUB_EN / "brand-bonuses.json") or {}
    bonus_text_ru = load(PUB_RU / "brand-bonuses.json") or {}

    # Regex: "1pc: +13% Headshot Damage" or "1шт: +13% Урон в голову" → (pieces, value, stat_text)
    BONUS_LINE_RE = re.compile(r"^\s*(\d)(?:pc|шт)\s*:\s*([+-]?[\d.]+)%?\s*(.+?)\s*$", re.IGNORECASE)

    def parse_bonus_lines(lines):
        """Returns list of (pieces, value, stat_text)."""
        out = []
        for line in (lines or []):
            m = BONUS_LINE_RE.match(line)
            if m:
                out.append((int(m.group(1)), float(m.group(2)), m.group(3).strip()))
        return out

    brand_bonus_resolution_log = []
    for b in pub_brands:
        slug = b["id"]
        nk = name_key(loc_en_brands.get(slug, ""))
        raw_b = raw_brands_idx.get(nk)
        conn.execute("""INSERT INTO items
            (id, game_uid, kind, subkind, core_attribute, dlc, extra_json, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (slug, raw_b.get("uid") if raw_b else None, "brand", "brand",
             b.get("core"), b.get("dlc"),
             json.dumps(b, ensure_ascii=False),
             "apps/web/public/data/brands.json", now))

        # Parse EN text → bonuses
        en_lines = bonus_text_en.get(slug)
        if isinstance(en_lines, str):
            try: en_lines = json.loads(en_lines)
            except Exception: en_lines = [en_lines]
        parsed = parse_bonus_lines(en_lines or [])

        if parsed:
            for pieces, value, stat_text in parsed:
                stat_slug = resolve_stat(text=stat_text)
                if not stat_slug:
                    brand_bonus_resolution_log.append(
                        f"{slug}: '{stat_text}' (pcs={pieces}, val={value}) → UNRESOLVED")
                    continue
                conn.execute("""INSERT INTO item_bonuses
                    (item_id, pieces, stat_slug, value, notes) VALUES(?,?,?,?,?)""",
                    (slug, pieces, stat_slug, value, f"parsed:{stat_text}"))
        else:
            # Fallback: use public/data structured bonuses (may be wrong but better than nothing)
            for bn in (b.get("bonuses") or []):
                inner = bn.get("bonus") or {}
                conn.execute("""INSERT INTO item_bonuses
                    (item_id, pieces, stat_slug, value, notes) VALUES(?,?,?,?,?)""",
                    (slug, bn.get("pieces"), inner.get("stat"), inner.get("value"),
                     "fallback:public/data"))

    # ---- gear sets ----
    # SOURCE OF TRUTH: raw/gearsets.json (has correct attribute_name + value)
    # Algorithm: bonuses[] in array order. ref="(0)" starts new pieces level (2,3,4...);
    # ref="(N>0)" attaches to current pieces level. attribute_name → slug via stat_aliases.
    pub_sets = (load(PUB_DATA / "gear-sets.json") or {}).get("sets", [])
    raw_sets_idx = {}
    for fname in ("gearsets.json", "brand_sets.json", "green_sets.json"):
        for it in (load(RAW / fname) or []):
            en = re.sub(r"<[^>]+>", "", it.get("name_en", "")).strip()
            if en:
                raw_sets_idx[name_key(en)] = it

    set_bonus_resolution_log = []

    def parse_raw_set_bonuses(raw_bonuses):
        """Apply ref(0)-starts-new-level algorithm. Returns list of (pieces, attr_name, value)."""
        out = []
        current_pieces = 1  # will increment to 2 on first ref(0)
        for bonus in (raw_bonuses or []):
            ref = bonus.get("ref", "")
            attr_name = bonus.get("attribute_name", "")
            value = bonus.get("value", 0)
            uid = bonus.get("attribute_uid")
            # ref="(0)" or first encounter → new pieces level
            if "(0)" in ref:
                current_pieces += 1
            out.append((current_pieces, attr_name, value, uid))
        return out

    for s in pub_sets:
        slug = s["id"]
        try:
            conn.execute("""INSERT INTO items
                (id, kind, subkind, dlc, extra_json, source_file, imported_at)
                VALUES(?,?,?,?,?,?,?)""",
                (slug, "gear_set", s.get("type"), s.get("dlc"),
                 json.dumps(s, ensure_ascii=False),
                 "apps/web/public/data/gear-sets.json", now))
        except sqlite3.IntegrityError:
            existing = conn.execute("SELECT kind, source_file FROM items WHERE id=?", (slug,)).fetchone()
            print(f"  WARN: gear_set slug '{slug}' collides with existing {existing}; skipping")
            continue

        # Resolve raw set
        en_name = (load(PUB_EN / "gear-sets.json") or {}).get(slug, "")
        raw_set = raw_sets_idx.get(name_key(en_name))
        used_raw = False
        if raw_set:
            parsed = parse_raw_set_bonuses(raw_set.get("bonuses") or [])
            if parsed:
                used_raw = True
                for pieces, attr_name, value_frac, uid in parsed:
                    stat_slug = resolve_stat(uid=uid, game_name=attr_name)
                    if not stat_slug:
                        set_bonus_resolution_log.append(
                            f"{slug}: pcs={pieces} attr_name='{attr_name}' uid={uid[:8] if uid else '?'}... → UNRESOLVED")
                        continue
                    conn.execute("""INSERT INTO item_bonuses
                        (item_id, pieces, stat_slug, value, notes, source_uid) VALUES(?,?,?,?,?,?)""",
                        (slug, pieces, stat_slug, round(value_frac * 100, 2),
                         f"raw:{attr_name}", uid))

        if not used_raw:
            # Fallback: public/data numericBonuses
            for nb in (s.get("numericBonuses") or []):
                inner = nb.get("bonus") or {}
                conn.execute("""INSERT INTO item_bonuses
                    (item_id, pieces, stat_slug, value, notes) VALUES(?,?,?,?,?)""",
                    (slug, nb.get("pieces"), inner.get("stat"), inner.get("value"),
                     "fallback:public/data"))

        # talent links (always from public/data)
        if s.get("chestTalentId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "chest_talent", s["chestTalentId"]))
        if s.get("backpackTalentId"):
            conn.execute("""INSERT OR IGNORE INTO item_links VALUES(?,?,?)""",
                         (slug, "backpack_talent", s["backpackTalentId"]))

    # ---- P2-2: import brand_sets (37) — kind='brand_set' + is_brand_set=1 ----
    # Slug = slugify(name_en) + '_set' to avoid collision with brand items.
    # Bonuses parsed via same ref(0)-pieces algorithm as gear-sets.
    raw_brand_sets = load(RAW / "brand_sets.json") or []
    brand_set_imported = 0
    for bs in raw_brand_sets:
        en = strip_color(bs.get("name_en", ""))
        if not en or en == "Set name": continue  # garbage entry
        slug = slugify(en) + "_set"
        try:
            conn.execute("""INSERT INTO items
                (id, game_uid, kind, subkind, is_brand_set, stat_quality,
                 extra_json, source_file, imported_at)
                VALUES(?,?,?,?,?,?,?,?,?)""",
                (slug, bs.get("uid"), "brand_set", "brand_set", 1, "verified",
                 json.dumps(bs, ensure_ascii=False),
                 "data/raw/brand_sets.json", now))
            # name translations
            insert_translation_immediate = lambda fld, lng, txt: conn.execute(
                "INSERT OR REPLACE INTO translations VALUES(?,?,?,?,?,?)",
                ("item", slug, fld, lng, txt, 0)) if txt else None
            insert_translation_immediate("name", "en", en)
            ru_name = strip_color(bs.get("name_ru") or "")
            if ru_name and ru_name != en:
                insert_translation_immediate("name", "ru", ru_name)
            # Parse bonuses with ref(0)-pieces algorithm
            parsed = parse_raw_set_bonuses(bs.get("bonuses") or [])
            for pieces, attr_name, val_frac, uid in parsed:
                stat = resolve_stat(uid=uid, game_name=attr_name)
                if stat:
                    conn.execute("""INSERT INTO item_bonuses
                        (item_id, pieces, stat_slug, value, notes, source_uid)
                        VALUES(?,?,?,?,?,?)""",
                        (slug, pieces, stat, round(val_frac * 100, 2),
                         f"raw:{attr_name}", uid))
            brand_set_imported += 1
        except sqlite3.IntegrityError:
            pass

    # ---- P2-2: green_sets — annotate existing gear_set items with is_green_set=1 ----
    raw_green = load(RAW / "green_sets.json") or []
    green_set_annotated = 0
    green_set_added = 0
    pub_set_en_idx = {name_key(v): k for k, v in (load(PUB_EN / "gear-sets.json") or {}).items()}
    for gs in raw_green:
        en = strip_color(gs.get("name_en", ""))
        if not en or en == "Set name": continue
        # Try to match existing gear_set slug via public locale
        existing_slug = pub_set_en_idx.get(name_key(en))
        if existing_slug:
            conn.execute("UPDATE items SET is_green_set=1 WHERE id=? AND kind='gear_set'", (existing_slug,))
            green_set_annotated += 1
        else:
            # New green_set not in current items
            slug = slugify(en) + "_green"
            try:
                conn.execute("""INSERT INTO items
                    (id, game_uid, kind, subkind, is_green_set, stat_quality,
                     extra_json, source_file, imported_at)
                    VALUES(?,?,?,?,?,?,?,?,?)""",
                    (slug, gs.get("uid"), "gear_set", "green_set", 1, "verified",
                     json.dumps(gs, ensure_ascii=False),
                     "data/raw/green_sets.json", now))
                # translations
                conn.execute("INSERT OR REPLACE INTO translations VALUES(?,?,?,?,?,?)",
                             ("item", slug, "name", "en", en, 0))
                ru_name = strip_color(gs.get("name_ru") or "")
                if ru_name and ru_name != en:
                    conn.execute("INSERT OR REPLACE INTO translations VALUES(?,?,?,?,?,?)",
                                 ("item", slug, "name", "ru", ru_name, 0))
                # bonuses
                parsed = parse_raw_set_bonuses(gs.get("bonuses") or [])
                for pieces, attr_name, val_frac, uid in parsed:
                    stat = resolve_stat(uid=uid, game_name=attr_name)
                    if stat:
                        conn.execute("""INSERT INTO item_bonuses
                            (item_id, pieces, stat_slug, value, notes, source_uid)
                            VALUES(?,?,?,?,?,?)""",
                            (slug, pieces, stat, round(val_frac * 100, 2),
                             f"raw:{attr_name}", uid))
                green_set_added += 1
            except sqlite3.IntegrityError:
                pass

    print(f"  brand_sets imported: {brand_set_imported}, "
          f"green_sets annotated: {green_set_annotated}, "
          f"green_sets added new: {green_set_added}")

    # ---- named gear ----
    pub_named = (load(PUB_DATA / "named-gear.json") or {}).get("items", [])
    for ng in pub_named:
        slug = ng["id"]
        extra_ng_json = json.dumps(ng, ensure_ascii=False)
        conn.execute("""INSERT INTO items
            (id, kind, subkind, slot, core_attribute, is_named, is_exotic,
             exotic_mechanic, extra_json, source_file, imported_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, "named_gear", ng.get("slot"), ng.get("slot"), ng.get("core"),
             1, 1 if ng.get("isExotic") else 0,
             ng.get("exoticMechanic"), extra_ng_json,
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
                (id, kind, subkind, extra_json, source_file, imported_at)
                VALUES(?,?,?,?,?,?)""",
                (slug, "talent", t.get("kind"),
                 json.dumps(t, ensure_ascii=False),
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

    # set/brand bonus_text translations:
    # EN — REGENERATE from item_bonuses (public/locales EN is stale/wrong for many sets/brands)
    # RU — keep curated from public/locales (verified correct per spot-check)
    # Stat slug → readable label (EN labels)
    SLUG_LABEL_EN = {v: k for k, v in by_text.items() if k[0].isupper()}
    # specific overrides for cleaner labels
    SLUG_LABEL_EN.update({
        "wd": "Weapon Damage", "chc": "Critical Hit Chance", "chd": "Critical Hit Damage",
        "hsd": "Headshot Damage", "rof": "Rate of Fire", "mag": "Magazine Size",
        "reload": "Reload Speed", "handling": "Weapon Handling",
        "skill_dmg": "Skill Damage", "skill_haste": "Skill Haste",
        "skill_tier": "Skill Tier", "skill_duration": "Skill Duration",
        "skill_repair": "Skill Repair", "status_effects": "Status Effects",
        "ooc": "Out of Cover Damage", "dta": "Damage to Armor",
        "dth": "Damage to Health", "dttooc": "Damage to Targets out of Cover",
        "armor": "Armor", "armor_regen": "Armor Regen", "armor_on_kill": "Armor on Kill",
        "life_on_kill": "Health on Kill", "explosive_dmg": "Explosive Damage",
        "explosive_resistance": "Explosive Resistance", "ammo_cap": "Ammo Capacity",
        "ar_dmg": "Assault Rifle Damage", "smg_dmg": "SMG Damage", "lmg_dmg": "LMG Damage",
        "shotgun_dmg": "Shotgun Damage", "mmr_dmg": "Marksman Rifle Damage",
        "pistol_dmg": "Pistol Damage", "rifle_dmg": "Rifle Damage",
        "pfe": "Protection from Elites", "hazard_protection": "Hazard Protection",
        "repair_skills": "Repair Skills", "healing": "Healing", "health": "Health",
    })

    def regenerate_bonus_text_en(item_id, kind):
        """Build EN bonus_text array from item_bonuses for a brand/gear_set."""
        rows = list(conn.execute(
            "SELECT pieces, stat_slug, value FROM item_bonuses WHERE item_id=? ORDER BY pieces, id",
            (item_id,)))
        if not rows: return None
        # Group by pieces
        by_pieces = {}
        for pcs, slug_, val in rows:
            if pcs is None: continue
            by_pieces.setdefault(pcs, []).append(f"+{val:g}% {SLUG_LABEL_EN.get(slug_, slug_)}")
        out = []
        for pcs in sorted(by_pieces):
            label = "pc" if kind == "brand" else "pc"
            parts = " & ".join(by_pieces[pcs])
            out.append(f"{pcs}{label}: {parts}")
        return out

    # Apply: regenerate EN bonus_text/set_bonuses from item_bonuses
    for slug, kind in conn.execute(
        "SELECT id, kind FROM items WHERE kind IN ('brand','gear_set')"):
        text_en = regenerate_bonus_text_en(slug, kind)
        if text_en:
            field = "bonus_text" if kind == "brand" else "set_bonuses"
            insert_translation("item", slug, field, "en",
                               json.dumps(text_en, ensure_ascii=False))

    # RU — from public/locales (curated)
    for fname, fld in [("set-bonuses.json", "set_bonuses"),
                       ("brand-bonuses.json", "bonus_text")]:
        d = load(PUB_RU / fname) or {}
        for slug, txt in d.items():
            if txt:
                insert_translation("item", slug, fld, "ru", txt)

    # set chest/backpack texts — both langs (these are talent names, usually stable)
    for lng in ("en", "ru"):
        for fname, fld in [("set-chest.json", "chest_text"),
                           ("set-backpack.json", "backpack_text")]:
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

    # ---- weapon stat_fixes (manual rpm/mag overrides for specific known-wrong items) ----
    weapon_overrides_full = load(WEAPON_OV) or {}
    for fx in (weapon_overrides_full.get("stat_fixes") or []):
        slug = fx.get("slug")
        if not slug: continue
        for col in ("rpm", "magazine", "base_damage", "reload_seconds", "optimal_range", "headshot_mult"):
            if col in fx:
                conn.execute(f"UPDATE weapon_specs SET {col}=? WHERE item_id=?", (fx[col], slug))
        conn.execute("""INSERT INTO manual_overrides
            (entity_type, entity_id, field, value, reason, source_link, active)
            VALUES('weapon_spec', ?, 'stat_fix', ?, ?, ?, 1)""",
            (slug, json.dumps({k: v for k, v in fx.items() if k not in ("slug", "_reason")}, ensure_ascii=False),
             fx.get("_reason", "manual stat fix"), "data/weapon_overrides.json"))

    # ---- weapon name_ru / source / talent_text from raw (P1 fixes) ----
    # Build raw weapon index by name_en (canonical match to public slug)
    raw_w_by_en = {}
    for fname in ("weapons_base.json", "weapons_exotic.json", "weapons_named.json"):
        for it in (load(RAW / fname) or []):
            en = re.sub(r"<[^>]+>", "", it.get("name_en", "")).strip()
            if not en: continue
            raw_w_by_en.setdefault(name_key(en), []).append(it)

    # public slug → name_en mapping
    pub_loc_en_w = load(PUB_EN / "weapons.json") or {}
    for slug, en_name in pub_loc_en_w.items():
        nk = name_key(en_name)
        cands = raw_w_by_en.get(nk)
        if not cands:
            # fuzzy: try with 'The ' prefix added
            cands = raw_w_by_en.get(name_key("The " + en_name))
        if not cands:
            # fuzzy: strip 'the ' from EN name when matching
            cands = raw_w_by_en.get(name_key(re.sub(r"^the\s+", "", en_name, flags=re.IGNORECASE)))
        if not cands: continue
        # pick canonical (no _immersion etc)
        clean = [c for c in cands if not any(s in (c.get("id") or "").lower() for s in ("_immersion","_milestone","_template","_lvl","_boost"))]
        rit = (clean or cands)[0]
        # name_ru from raw if real translation (differs from EN)
        ru = re.sub(r"<[^>]+>", "", rit.get("name_ru", "")).strip()
        if ru and ru != en_name and ru.lower() != en_name.lower():
            insert_translation("item", slug, "name", "ru", ru)
        # source[en] / source[ru] — from raw 'source' field if present
        src = rit.get("source")
        if src:
            insert_translation("item", slug, "source", "en", src)
        # tal_desc fields (en + ru) for exotic talent text → talent_text translation
        if rit.get("tal_desc"):
            insert_translation("item", slug, "talent_text", "en", rit["tal_desc"])
        if rit.get("tal_desc_ru"):
            insert_translation("item", slug, "talent_text", "ru", rit["tal_desc_ru"])

    # ---- weapon talent_text from linked talent description ----
    # Each weapon may link to its talent via 'default_talent' link. Copy the talent's
    # description into the weapon's talent_text (en+ru) so frontend can show without join.
    weapon_talent_links = list(conn.execute("""
        SELECT il.item_id, il.target_item_id
        FROM item_links il JOIN items i ON i.id = il.item_id
        WHERE il.link_type='default_talent' AND i.kind='weapon'"""))
    for weapon_slug, talent_slug in weapon_talent_links:
        for lng in ("en", "ru"):
            t = conn.execute(
                "SELECT text FROM translations WHERE entity_type='item' AND entity_id=? AND field='description' AND lang=?",
                (talent_slug, lng)).fetchone()
            if t and t[0]:
                insert_translation("item", weapon_slug, "talent_text", lng, t[0])

    # ---- P2-4: backfill talent description_en from legacy/exotic_weapons.tal_desc ----
    # For talents that link to an exotic weapon and lack EN description in DB.
    legacy_exotic_w = load(LEGACY_DIR := (ROOT / "data/_legacy/exotic_weapons.json"))
    if legacy_exotic_w:
        # Build map: weapon EN name → tal_desc
        legacy_weapon_to_tal_desc = {}
        for k, v in legacy_exotic_w.items():
            if not isinstance(v, dict): continue
            weapon_en = v.get("en")
            tal_desc = v.get("tal_desc")
            if weapon_en and tal_desc:
                legacy_weapon_to_tal_desc[name_key(weapon_en)] = {
                    "en": tal_desc, "ru": v.get("tal_desc_ru") or ""}
        # For each talent that's linked from a weapon, find the weapon EN name → match legacy
        for weapon_slug, talent_slug in conn.execute("""
            SELECT il.item_id, il.target_item_id FROM item_links il
            JOIN items i ON i.id = il.item_id
            WHERE il.link_type='default_talent' AND i.kind='weapon'""").fetchall():
            # Get the weapon EN name
            row = conn.execute(
                "SELECT text FROM translations WHERE entity_id=? AND field='name' AND lang='en'",
                (weapon_slug,)).fetchone()
            if not row: continue
            weapon_en = row[0]
            # Try several name_key variants
            candidate_keys = [name_key(weapon_en),
                              name_key("The " + weapon_en),
                              name_key(re.sub(r"^the\s+", "", weapon_en, flags=re.IGNORECASE))]
            tal_desc = None
            for ck in candidate_keys:
                if ck in legacy_weapon_to_tal_desc:
                    tal_desc = legacy_weapon_to_tal_desc[ck]; break
            if not tal_desc: continue
            # Insert into talent's description if missing
            existing_en = conn.execute(
                "SELECT text FROM translations WHERE entity_id=? AND field='description' AND lang='en'",
                (talent_slug,)).fetchone()
            if not existing_en or not existing_en[0]:
                if tal_desc.get("en"):
                    insert_translation("item", talent_slug, "description", "en", tal_desc["en"])
            existing_ru = conn.execute(
                "SELECT text FROM translations WHERE entity_id=? AND field='description' AND lang='ru'",
                (talent_slug,)).fetchone()
            # Replace RU also if RU mistakenly contains EN text (pre-existing locale bug)
            ru_is_actually_en = (existing_ru and existing_ru[0]
                                  and tal_desc.get("en")
                                  and existing_ru[0].strip()[:30] == tal_desc["en"].strip()[:30])
            if ((not existing_ru or not existing_ru[0]) or ru_is_actually_en) and tal_desc.get("ru"):
                insert_translation("item", talent_slug, "description", "ru", tal_desc["ru"])

    # ---- P2-5: backfill named_gear source_en/source_ru from legacy ----
    legacy_named_gear = load(ROOT / "data/_legacy/named_gear.json") or []
    legacy_named = load(ROOT / "data/_legacy/named.json") or []
    legacy_source_idx = {}
    for it in legacy_named_gear + legacy_named:
        en = it.get("en") or it.get("name_en")
        if not en: continue
        legacy_source_idx[slugify(en)] = {
            "en": it.get("source_en"), "ru": it.get("source_ru")}
    backfilled = 0
    missing_source = []
    for ng_slug in [r[0] for r in conn.execute("""
        SELECT i.id FROM items i WHERE i.kind='named_gear'
        AND NOT EXISTS (SELECT 1 FROM translations t WHERE t.entity_id=i.id
                        AND t.field='source' AND t.lang='en' AND t.text!='')""").fetchall()]:
        legacy = legacy_source_idx.get(ng_slug)
        if legacy and (legacy.get("en") or legacy.get("ru")):
            if legacy.get("en"):
                insert_translation("item", ng_slug, "source", "en", legacy["en"])
            if legacy.get("ru"):
                insert_translation("item", ng_slug, "source", "ru", legacy["ru"])
            backfilled += 1
        else:
            missing_source.append(ng_slug)
            # Mark in manual_overrides as known-missing
            conn.execute("""INSERT INTO manual_overrides
                (entity_type, entity_id, field, value, reason, source_link, active)
                VALUES('translation', ?, 'source:en', '""', '_missing_source: not in legacy or raw', NULL, 0)""",
                (f"item:{ng_slug}",))
    print(f"  named_gear source backfilled from legacy: {backfilled}, still missing: {len(missing_source)}")

    # ---- weapon source_fixes (P1 #5: fill empty source[en] for St.Elmo etc) ----
    for slug, srcs in (weapon_overrides_full.get("source_fixes") or {}).items():
        for lng, txt in srcs.items():
            if not txt: continue
            existing = conn.execute(
                "SELECT text FROM translations WHERE entity_type='item' AND entity_id=? AND field='source' AND lang=?",
                (slug, lng)).fetchone()
            if not existing or not existing[0]:
                insert_translation("item", slug, "source", lng, txt)

    # ---- talent_text from raw/talents_*.json with tooltip_*_filled ----
    raw_t_by_en = {}
    for fname in ("talents_weapon.json", "talents_gear.json", "talents_exotic.json"):
        for it in (load(RAW / fname) or []):
            en = re.sub(r"<[^>]+>", "", it.get("name_en", "")).strip()
            if not en: continue
            raw_t_by_en.setdefault(name_key(en), []).append(it)
    pub_loc_en_t = load(PUB_EN / "talents.json") or {}
    for slug, en_name in pub_loc_en_t.items():
        cands = raw_t_by_en.get(name_key(en_name))
        if not cands: continue
        rt = cands[0]
        en_text = rt.get("tooltip_en_filled") or rt.get("tooltip_en")
        ru_text = rt.get("tooltip_ru_filled") or rt.get("tooltip_ru")
        if en_text:
            insert_translation("item", slug, "description", "en", en_text)
        if ru_text:
            insert_translation("item", slug, "description", "ru", ru_text)

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
