"""
legacy_diff.py v3 — финальный фикс:
  - cross-group dedup для weapons (priority: exotic > named > base)
  - perfect-collapse и cross-file matching для talents (weapon/gear/exotic)
  - collisions report (один raw → несколько legacy)
  - filter seed: stat-overrides для matched НЕ идут (legacy = ground truth, импорт прямой)
                 в seed только: переводы name/description/flavor + классификации (core, subkind, has_perfect, links)
"""
from __future__ import annotations
import json, re, statistics
from pathlib import Path
from datetime import datetime, timezone

ROOT    = Path(r"C:/Users/glukm/division2-calc")
LEGACY  = ROOT / "data" / "_legacy"
RAW     = ROOT / "data" / "raw"
OUT_OVR = ROOT / "data" / "manual_overrides_seed.json"
OUT_RPT = ROOT / "docs"  / "LEGACY_DIFF_REPORT.md"
OUT_COL = ROOT / "docs"  / "MATCH_COLLISIONS.md"
OUT_UNV = ROOT / "docs"  / "UNVERIFIED_ITEMS.md"  # для only_raw weapons


def load(path):
    if not path.exists(): return None
    return json.loads(path.read_text(encoding="utf-8"))


def slugify(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    s = s.lower().strip()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def name_key(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    s = s.lower().strip()
    return re.sub(r"[^a-z0-9а-яё]+", "", s)


def strip_color(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


# ====== weapons ======
NOISE_SUFFIXES = ("_immersion", "_milestone", "_level40boost",
                  "_item_template", "_template", "_lvl", "_boost")


def is_noisy_id(rid):
    rid_l = (rid or "").lower()
    return any(s in rid_l for s in NOISE_SUFFIXES)


def pick_canonical(raws):
    if not raws: return None
    if len(raws) == 1: return raws[0]
    clean = [r for r in raws if not is_noisy_id(r.get("id", ""))]
    pool = clean or raws
    pool = sorted(pool, key=lambda r: -((r.get("stats") or {}).get("dmg_max") or 0))
    return pool[0]


def index_legacy_list(items, en_field="en", ru_field=None):
    out = {}
    for it in items:
        if not isinstance(it, dict): continue
        en = it.get(en_field) or it.get("name_en") or it.get("name")
        if not en: continue
        ru = it.get(ru_field) if ru_field else None
        if ru is None:
            ru = it.get("name") if en_field == "en" else it.get("name_ru")
        out[name_key(en)] = {**it, "_en": en, "_ru": ru}
    return out


def index_legacy_dict(d, en_field="en"):
    out = {}
    for k, v in (d or {}).items():
        if not isinstance(v, dict): continue
        en = v.get(en_field) or v.get("name_en") or k
        ru = v.get("name_ru")
        out[name_key(en)] = {**v, "_en": en, "_ru": ru}
    return out


def index_raw_weapons_combined():
    """Объединяем base+exotic+named в один индекс по name_key, помечая источник."""
    out = {}
    for fname, kind in [("weapons_base.json", "base"),
                        ("weapons_exotic.json", "exotic"),
                        ("weapons_named.json", "named")]:
        rd = load(RAW / fname) or []
        for it in rd:
            en = strip_color(it.get("name_en", ""))
            if not en: continue
            it["_raw_kind"] = kind
            it["_raw_file"] = fname
            out.setdefault(name_key(en), []).append(it)
    return out


# legacy.named — смешанный (оружие+броня); split по slot
WEAPON_SLOT_RU = {"пистолеты-пулемёты", "штурмовые винтовки", "винтовки",
                  "снайперские винтовки", "дробовики", "пулемёты", "пистолеты",
                  "тактические винтовки", "марксманские винтовки"}
GEAR_SLOT_RU = {"маска", "рюкзак", "бронежилет", "перчатки", "кобура", "наколенники"}


def is_legacy_named_weapon(it):
    g = (it.get("g") or "").lower()
    if g in WEAPON_SLOT_RU: return True
    if g in GEAR_SLOT_RU: return False
    t = (it.get("t") or "").lower()
    return any(k in t for k in ("smg", "ar", "rifle", "lmg", "shotgun", "pistol",
                                "винт", "пулем", "дробов", "(fn ", "(hk ", "(sig "))


def diff_weapons():
    """Cross-group dedup. Priority: exotic > named > base."""
    legacy_base = load(LEGACY / "weapons_base.json") or []
    legacy_named = load(LEGACY / "named.json") or []
    legacy_exotic_dict = load(LEGACY / "exotic_weapons.json") or {}

    leg_base = index_legacy_list(legacy_base, en_field=None)  # legacy/weapons_base.json: name=EN
    # У weapons_base.json: name=EN, нет name_ru — ставим _en=name, _ru=None
    leg_base = {nk: {**it, "_en": it.get("name"), "_ru": None}
                for nk, it in {name_key(it.get("name", "")): it for it in legacy_base if it.get("name")}.items()}

    leg_exotic = index_legacy_dict(legacy_exotic_dict, en_field="en")
    leg_named_w = index_legacy_list(
        [it for it in legacy_named if is_legacy_named_weapon(it)], en_field="en")

    raw_idx = index_raw_weapons_combined()

    # Priority match: exotic first, then named, then base
    claimed = {}  # name_key → {"by": "exotic"|"named"|"base", "legacy_en": ..., "raw": rit}
    collisions = []  # raw сматчился >1 раз

    overrides = []
    matched_per_group = {"exotic": [], "named": [], "base": []}
    only_legacy_per_group = {"exotic": [], "named": [], "base": []}
    K_samples = []

    def emit_translation(slug, lang, value, raw_value, reason, source, field="name"):
        if not value: return
        if value == raw_value: return  # не дублируем
        overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                          "field": f"{field}:{lang}", "value": value,
                          "raw_value": raw_value, "_reason": reason, "_source": source})

    def emit_classification(slug, field, value, reason, source):
        if value is None or value == "": return
        overrides.append({"entity_type": "item", "entity_id": slug,
                          "field": field, "value": value, "raw_value": None,
                          "_reason": reason, "_source": source})

    def process(legacy_idx, group, source_file):
        for nk, lit in legacy_idx.items():
            rcands = raw_idx.get(nk)
            if not rcands:
                only_legacy_per_group[group].append(lit.get("_en"))
                continue
            rit = pick_canonical(rcands)

            if nk in claimed:
                # коллизия
                collisions.append({
                    "name_en": lit.get("_en"),
                    "raw_id": rit.get("id"),
                    "raw_kind": rit.get("_raw_kind"),
                    "claimed_by": claimed[nk]["by"],
                    "now_attempted_by": group,
                    "resolution": f"keeping {claimed[nk]['by']} (higher priority)",
                })
                continue

            claimed[nk] = {"by": group, "legacy_en": lit.get("_en"), "raw": rit}
            matched_per_group[group].append({"name_en": lit.get("_en"),
                                              "raw_id": rit.get("id"),
                                              "raw_kind": rit.get("_raw_kind")})

            slug = slugify(lit.get("_en"))
            rstats = rit.get("stats", {}) or {}

            # K-sample (для статистики, не для seed)
            if lit.get("dmg") and rstats.get("dmg_max"):
                K_samples.append((group, lit["dmg"] / rstats["dmg_max"]))

            # === SEED FILTER: stat-overrides НЕ ИДУТ (legacy=ground truth при импорте) ===
            # === SEED содержит ТОЛЬКО translations + classifications ===
            if lit.get("_ru"):
                emit_translation(slug, "ru", lit["_ru"], rit.get("name_ru"),
                                 f"legacy curated RU name ({group})", source_file)
            # legacy/named.json: 'd' = description RU, 'flavor_en' = EN flavor, 'source_en'/'source_ru' = drop source
            if lit.get("d"):
                emit_translation(slug, "ru", lit["d"], None,
                                 f"legacy curated RU talent description", source_file, field="talent_text")
            if lit.get("flavor_en"):
                emit_translation(slug, "en", lit["flavor_en"], None,
                                 f"legacy curated EN flavor", source_file, field="flavor")
            if lit.get("source_en"):
                emit_translation(slug, "en", lit["source_en"], None,
                                 f"legacy curated EN source/drop info", source_file, field="source")
            if lit.get("source_ru"):
                emit_translation(slug, "ru", lit["source_ru"], None,
                                 f"legacy curated RU source/drop info", source_file, field="source")
            # legacy.exotic_weapons: tal_desc, tal_desc_ru → talent_text translations
            if lit.get("tal_desc"):
                emit_translation(slug, "en", lit["tal_desc"], None,
                                 f"legacy curated EN talent text", source_file, field="talent_text")
            if lit.get("tal_desc_ru"):
                emit_translation(slug, "ru", lit["tal_desc_ru"], None,
                                 f"legacy curated RU talent text", source_file, field="talent_text")
            if lit.get("tal_name_ru"):
                emit_translation(slug, "ru", lit["tal_name_ru"], None,
                                 "legacy curated RU talent name", source_file, field="talent_name")
            # core attribute (для weapon обычно нет, но на всякий)
            if lit.get("core"):
                emit_classification(slug, "core_attribute",
                                    lit["core"][0] if isinstance(lit["core"], list) else lit["core"],
                                    f"legacy core attribute ({group})", source_file)
            # cat / type → family для weapons
            if lit.get("cat") or lit.get("type") or lit.get("t"):
                emit_classification(slug, "weapon_class",
                                    lit.get("cat") or lit.get("type") or lit.get("t"),
                                    f"legacy weapon class ({group})", source_file)

    process(leg_exotic, "exotic", "data/_legacy/exotic_weapons.json")
    process(leg_named_w, "named", "data/_legacy/named.json")
    process(leg_base, "base", "data/_legacy/weapons_base.json")

    only_raw = []
    for nk, rcands in raw_idx.items():
        if nk in claimed: continue
        rit = pick_canonical(rcands)
        only_raw.append({"name_en": strip_color(rit.get("name_en", "")),
                         "raw_kind": rit.get("_raw_kind"),
                         "raw_id": rit.get("id")})

    # K stats per group
    by_group = {}
    for g in ("exotic", "named", "base"):
        samples = [x for grp, x in K_samples if grp == g]
        if samples:
            by_group[g] = {"median": statistics.median(samples),
                           "mean": statistics.mean(samples),
                           "n": len(samples)}

    return {
        "matched_per_group": matched_per_group,
        "only_legacy_per_group": only_legacy_per_group,
        "only_raw": only_raw,
        "collisions": collisions,
        "K_by_group": by_group,
        "overrides": overrides,
    }


# ====== brands (legacy/brands.json IGNORED per user, но RU из legacy/gear_sets matched) ======
def diff_brands():
    raw = load(RAW / "brands.json") or []
    leg_gear_sets = load(LEGACY / "gear_sets.json") or []
    leg_idx = {name_key(it.get("en", "")): it for it in leg_gear_sets if it.get("en")}
    raw_idx = {name_key(strip_color(it.get("name_en", ""))): it for it in raw if it.get("name_en")}

    matched, only_legacy, only_raw = [], [], []
    overrides = []
    for k, lit in leg_idx.items():
        if k not in raw_idx:
            only_legacy.append(lit.get("en")); continue
        rit = raw_idx[k]
        slug = slugify(lit.get("en"))
        if lit.get("name") and lit["name"] != rit.get("name_ru"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "name:ru", "value": lit["name"],
                              "raw_value": rit.get("name_ru"),
                              "_reason": "legacy curated RU brand name (from gear_sets, brands.json ignored per spec)",
                              "_source": "data/_legacy/gear_sets.json"})
        if lit.get("bonuses"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "bonuses_text:ru", "value": lit["bonuses"],
                              "raw_value": None,
                              "_reason": "legacy localized bonus strings",
                              "_source": "data/_legacy/gear_sets.json"})
        matched.append({"name_en": lit.get("en"), "raw_uid": rit.get("uid")})
    only_raw = [strip_color(rit.get("name_en", "")) for k, rit in raw_idx.items() if k not in leg_idx]
    return {"kind": "brand", "legacy_count": len(leg_idx), "raw_count": len(raw_idx),
            "matched": len(matched), "only_legacy": only_legacy,
            "only_raw_sample": only_raw[:25], "only_raw_total": len(only_raw),
            "overrides": overrides}


# ====== sets (legacy/gear_sets — type=red/blue/yellow → gearset; raw имеет 3 файла) ======
def diff_sets():
    legacy = load(LEGACY / "gear_sets.json") or []
    raw_paths = [(RAW / "gearsets.json", "gearset"),
                 (RAW / "brand_sets.json", "brand_set"),
                 (RAW / "green_sets.json", "green_set")]
    leg_idx = {name_key(it.get("en", "")): it for it in legacy if it.get("en")}
    raw_all = {}
    breakdown = {}
    for path, kind in raw_paths:
        rd = load(path) or []
        breakdown[kind] = len(rd)
        for it in rd:
            en = strip_color(it.get("name_en", ""))
            if not en: continue
            it["_raw_kind"] = kind
            raw_all[name_key(en)] = it
    matched, only_legacy, overrides = [], [], []
    for k, lit in leg_idx.items():
        if k not in raw_all:
            only_legacy.append(lit.get("en")); continue
        rit = raw_all[k]
        slug = slugify(lit.get("en"))
        if lit.get("name") and lit["name"] != rit.get("name_ru"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "name:ru", "value": lit["name"], "raw_value": rit.get("name_ru"),
                              "_reason": "legacy RU set name", "_source": "data/_legacy/gear_sets.json"})
        if lit.get("type") and rit.get("_raw_kind") == "gearset":
            overrides.append({"entity_type": "item", "entity_id": slug,
                              "field": "subkind", "value": lit["type"], "raw_value": None,
                              "_reason": "legacy gear-set color (red/blue/yellow)", "_source": "data/_legacy/gear_sets.json"})
        for fld_legacy, fld_link in [("chest_talent_en", "chest_talent"),
                                      ("bp_talent_en", "backpack_talent"),
                                      ("perfect_chest_talent_en", "perfect_chest_talent"),
                                      ("perfect_bp_talent_en", "perfect_backpack_talent")]:
            if lit.get(fld_legacy):
                overrides.append({"entity_type": "link", "entity_id": slug,
                                  "field": fld_link, "value": lit[fld_legacy], "raw_value": None,
                                  "_reason": f"legacy {fld_link} from gear_sets",
                                  "_source": "data/_legacy/gear_sets.json"})
        matched.append({"name_en": lit.get("en"), "raw_kind": rit.get("_raw_kind")})
    only_raw = [{"name_en": strip_color(it.get("name_en", "")), "raw_kind": it.get("_raw_kind")}
                for k, it in raw_all.items() if k not in leg_idx]
    return {"kind": "gear_set", "legacy_count": len(leg_idx),
            "raw_count": len(raw_all), "raw_breakdown": breakdown,
            "matched": len(matched), "only_legacy": only_legacy,
            "only_raw_sample": [r["name_en"] for r in only_raw[:25]],
            "only_raw_total": len(only_raw), "overrides": overrides}


# ====== named gear ======
def diff_named_gear():
    legacy_ng = load(LEGACY / "named_gear.json") or []
    legacy_named = load(LEGACY / "named.json") or []
    extra_gear = [it for it in legacy_named if not is_legacy_named_weapon(it)]
    legacy_all = legacy_ng + extra_gear
    raw = load(RAW / "gear_named.json") or []
    leg_idx = {}
    for it in legacy_all:
        en = it.get("en")
        if not en: continue
        leg_idx[name_key(en)] = it
    raw_idx = {name_key(strip_color(it.get("name_en", ""))): it for it in raw if it.get("name_en")}
    matched, only_legacy, overrides = [], [], []
    for k, lit in leg_idx.items():
        if k not in raw_idx:
            only_legacy.append(lit.get("en")); continue
        rit = raw_idx[k]
        slug = slugify(lit.get("en"))
        ru_name = lit.get("name") or lit.get("name_ru")
        if ru_name and ru_name != rit.get("name_ru"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "name:ru", "value": ru_name, "raw_value": rit.get("name_ru"),
                              "_reason": "legacy RU named-gear name",
                              "_source": "data/_legacy/named_gear.json"})
        if lit.get("bonus_ru"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "description:ru", "value": lit["bonus_ru"], "raw_value": None,
                              "_reason": "legacy RU bonus description",
                              "_source": "data/_legacy/named_gear.json"})
        if lit.get("flavor_en"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "flavor:en", "value": lit["flavor_en"], "raw_value": None,
                              "_reason": "legacy EN flavor",
                              "_source": "data/_legacy/named_gear.json"})
        if lit.get("source_en"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "source:en", "value": lit["source_en"], "raw_value": None,
                              "_reason": "legacy EN source",
                              "_source": "data/_legacy/named_gear.json"})
        if lit.get("source_ru"):
            overrides.append({"entity_type": "translation", "entity_id": f"item:{slug}",
                              "field": "source:ru", "value": lit["source_ru"], "raw_value": None,
                              "_reason": "legacy RU source",
                              "_source": "data/_legacy/named_gear.json"})
        if lit.get("core"):
            overrides.append({"entity_type": "item", "entity_id": slug,
                              "field": "core_attribute",
                              "value": (lit["core"][0] if isinstance(lit["core"], list) else lit["core"]),
                              "raw_value": None,
                              "_reason": "legacy core attribute",
                              "_source": "data/_legacy/named_gear.json"})
        matched.append({"name_en": lit.get("en")})
    only_raw = [strip_color(it.get("name_en", "")) for k, it in raw_idx.items() if k not in leg_idx]
    return {"kind": "named_gear", "legacy_count": len(leg_idx), "raw_count": len(raw_idx),
            "matched": len(matched), "only_legacy": only_legacy,
            "only_raw_sample": only_raw[:25], "only_raw_total": len(only_raw),
            "overrides": overrides}


# ====== talents (cross-file: weapon + gear + exotic, perfect-collapse on both sides) ======
PERFECT_RE = re.compile(r"^perfect(ly)?\s+", re.IGNORECASE)


def collapse_perfect(items, en_field="name_en"):
    """Возвращает {base_name_key: {base, perfect, name_en}}."""
    out = {}
    for it in items:
        en = strip_color(it.get(en_field) or "")
        if not en: continue
        is_p = bool(PERFECT_RE.match(en))
        base = PERFECT_RE.sub("", en).strip()
        bk = name_key(base)
        slot = out.setdefault(bk, {"base": None, "perfect": None, "name_en": base})
        if is_p:
            slot["perfect"] = it
        else:
            slot["base"] = it
            slot["name_en"] = base
    # если есть только perfect — он становится base
    for bk, slot in out.items():
        if slot["base"] is None and slot["perfect"]:
            slot["base"] = slot["perfect"]
            slot["name_en"] = strip_color(slot["perfect"].get(en_field, ""))
            slot["perfect"] = None
    return out


def parse_legacy_talent_name(s):
    """'Outsider (Изгой)' → ('Outsider','Изгой'); 'Optimist' → ('Optimist',None)."""
    if not s: return (None, None)
    m = re.match(r"^(.+?)\s*\((.+)\)\s*$", s)
    if m: return (m.group(1).strip(), m.group(2).strip())
    return (s.strip(), None)


def index_legacy_talents_dict(d):
    """legacy/weapon_talents.json — dict, value.name='Outsider (Изгой)', разрешая Perfect-варианты."""
    out_raw = []
    for k, v in (d or {}).items():
        if not isinstance(v, dict): continue
        nm = v.get("name")
        if not nm or nm in ("— нет —", "None") or nm.strip() == "": continue
        en, ru = parse_legacy_talent_name(nm)
        if not en: continue
        out_raw.append({"name_en": en, "name_ru": ru, "_raw": v})
    return collapse_perfect(out_raw)


def index_legacy_talents_list(items):
    """legacy/gear_talents.json — list with name_en/name_ru."""
    out_raw = []
    for it in items:
        nm = it.get("name_en") or it.get("name")
        if not nm or nm in ("None", "— нет —"): continue
        out_raw.append({"name_en": nm, "name_ru": it.get("name_ru"), "_raw": it})
    return collapse_perfect(out_raw)


def diff_talents():
    """Объединяем raw talents_weapon + talents_gear + talents_exotic; matchим legacy 2 файла + exotic_weapons.tal."""
    raw_weapon = load(RAW / "talents_weapon.json") or []
    raw_gear = load(RAW / "talents_gear.json") or []
    raw_exotic = load(RAW / "talents_exotic.json") or []
    raw_idx = {}
    for kind, lst in [("weapon", raw_weapon), ("gear", raw_gear), ("exotic", raw_exotic)]:
        c = collapse_perfect(lst)
        for bk, slot in c.items():
            slot["_kind"] = kind
            raw_idx.setdefault(bk, []).append(slot)

    leg_w = index_legacy_talents_dict(load(LEGACY / "weapon_talents.json") or {})
    leg_g = index_legacy_talents_list(load(LEGACY / "gear_talents.json") or [])

    # Plus exotic weapon talents from legacy/exotic_weapons.json
    # legacy.tal = "Agitator (Exotic)" — это weapon-derived label, не имя таланта.
    # Реальное RU-имя таланта — в tal_name_ru. Матчим через RU.
    leg_e_collapsed = {}
    legacy_exotic_weap = load(LEGACY / "exotic_weapons.json") or {}
    for k, v in legacy_exotic_weap.items():
        if not isinstance(v, dict): continue
        tal_ru = v.get("tal_name_ru")
        if not tal_ru: continue
        bk = name_key(tal_ru)
        leg_e_collapsed.setdefault(bk, {"name_en": None, "name_ru": tal_ru, "_raw": v,
                                         "base": v, "perfect": None,
                                         "_match_by": "ru"})

    # Перестраиваем raw_idx с дополнительным RU-ключом для exotic
    raw_idx_ru = {}  # name_key(name_ru) → list of slot dicts
    for bk, slots in raw_idx.items():
        for slot in slots:
            base = slot.get("base") or slot.get("perfect")
            if base and base.get("name_ru"):
                rk = name_key(base["name_ru"])
                raw_idx_ru.setdefault(rk, []).append(slot)

    matched_per = {"weapon": [], "gear": [], "exotic": []}
    only_legacy_per = {"weapon": [], "gear": [], "exotic": []}
    overrides = []
    collisions_t = []
    claimed = {}

    def process(legacy_collapsed, prefer_kind, source_file):
        for bk, lslot in legacy_collapsed.items():
            match_by = lslot.get("_match_by", "en")
            rcands = (raw_idx_ru.get(bk) if match_by == "ru" else raw_idx.get(bk))
            if not rcands:
                label = lslot.get("name_en") or lslot.get("name_ru")
                only_legacy_per[prefer_kind].append(label)
                continue
            picked = next((r for r in rcands if r["_kind"] == prefer_kind), rcands[0])
            label = lslot.get("name_en") or (picked["base"] or {}).get("name_en") or lslot.get("name_ru")
            # claim ключ — name_key EN талента (одинаковый между en и ru-матчингом для тех же сущностей)
            base_en = strip_color((picked["base"] or {}).get("name_en", "")) if picked.get("base") else label
            claim_key = name_key(base_en or label)
            if claim_key in claimed:
                collisions_t.append({"name_en": label, "claimed_by": claimed[claim_key]["by"],
                                     "now_attempted_by": prefer_kind, "raw_kind": picked["_kind"],
                                     "resolution": f"keeping {claimed[claim_key]['by']}"})
                continue
            claimed[claim_key] = {"by": prefer_kind}
            matched_per[prefer_kind].append({"name_en": label, "raw_kind": picked["_kind"]})
            slug = slugify(base_en or label)
            if lslot.get("name_ru"):
                rit_base = picked["base"] or {}
                if lslot["name_ru"] != rit_base.get("name_ru"):
                    overrides.append({"entity_type": "translation",
                                      "entity_id": f"item:{slug}",
                                      "field": "name:ru", "value": lslot["name_ru"],
                                      "raw_value": rit_base.get("name_ru"),
                                      "_reason": f"legacy curated RU talent name ({prefer_kind})",
                                      "_source": source_file})
            if picked.get("perfect"):
                overrides.append({"entity_type": "item", "entity_id": slug,
                                  "field": "has_perfect", "value": True, "raw_value": None,
                                  "_reason": "raw has Perfect variant",
                                  "_source": "auto-collapse"})

    # priority: exotic > weapon > gear
    process(leg_e_collapsed, "exotic", "data/_legacy/exotic_weapons.json")
    process(leg_w, "weapon", "data/_legacy/weapon_talents.json")
    process(leg_g, "gear", "data/_legacy/gear_talents.json")

    only_raw = []
    for bk, rcands in raw_idx.items():
        if bk in claimed: continue
        for r in rcands:
            only_raw.append({"name_en": r["name_en"], "raw_kind": r["_kind"]})

    return {
        "legacy_count": {"weapon": len(leg_w), "gear": len(leg_g), "exotic": len(leg_e_collapsed)},
        "raw_count": {"weapon": len(collapse_perfect(raw_weapon)),
                      "gear": len(collapse_perfect(raw_gear)),
                      "exotic": len(collapse_perfect(raw_exotic))},
        "matched_per": matched_per,
        "only_legacy_per": only_legacy_per,
        "only_raw": only_raw,
        "collisions": collisions_t,
        "overrides": overrides,
    }


# ====== main ======
def main():
    weapons_res = diff_weapons()
    brands_res = diff_brands()
    sets_res = diff_sets()
    named_gear_res = diff_named_gear()
    talents_res = diff_talents()

    all_overrides = (weapons_res["overrides"] + brands_res["overrides"]
                     + sets_res["overrides"] + named_gear_res["overrides"]
                     + talents_res["overrides"])

    OUT_OVR.parent.mkdir(parents=True, exist_ok=True)
    OUT_OVR.write_text(json.dumps({
        "_meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "scripts/legacy_diff.py v3",
            "policy": "stat-overrides EXCLUDED — legacy=ground truth at import. Seed contains only translations + classifications.",
            "total_candidates": len(all_overrides),
        },
        "overrides": all_overrides,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- LEGACY_DIFF_REPORT.md ----
    L = ["# Legacy ↔ Raw drift report v3 (TU22 reparse + cross-group dedup)\n",
         f"_Generated: {datetime.now(timezone.utc).isoformat()}_",
         "",
         "## Стратегия импорта (утверждена)",
         "**legacy = ground truth** для matched оружий/брони/сетов. build_db.py берёт displayed-числа из legacy при импорте, без overrides.",
         "**Seed содержит только**: переводы (RU name/description/flavor/source/talent_text) + классификации (core, subkind, weapon_class, has_perfect, links).",
         "**only_raw** (новые TU22) → импорт raw-passthrough с `stat_quality='unverified'`, попадает в [UNVERIFIED_ITEMS.md](UNVERIFIED_ITEMS.md) для ручной выверки.",
         "",
         f"**Seed candidates: {len(all_overrides)}** (фильтрованный — без stat_drift)",
         "",
         "## Weapons (cross-group dedup, priority exotic > named > base)",
         "",
         "| Group | Legacy | Matched | Only legacy | Collisions |",
         "|---|---:|---:|---:|---:|",
         f"| exotic | {len(weapons_res['matched_per_group']['exotic']) + len(weapons_res['only_legacy_per_group']['exotic'])} | {len(weapons_res['matched_per_group']['exotic'])} | {len(weapons_res['only_legacy_per_group']['exotic'])} | — |",
         f"| named  | {len(weapons_res['matched_per_group']['named']) + len(weapons_res['only_legacy_per_group']['named'])} | {len(weapons_res['matched_per_group']['named'])} | {len(weapons_res['only_legacy_per_group']['named'])} | — |",
         f"| base   | {len(weapons_res['matched_per_group']['base']) + len(weapons_res['only_legacy_per_group']['base'])} | {len(weapons_res['matched_per_group']['base'])} | {len(weapons_res['only_legacy_per_group']['base'])} | — |",
         f"| **total weapons collisions** |  |  |  | **{len(weapons_res['collisions'])}** |",
         "",
         f"**only_raw (новые TU22)**: {len(weapons_res['only_raw'])}",
         "",
         "### only_legacy (предположительно удалены из игры или переименованы)",
    ]
    for g, items in weapons_res["only_legacy_per_group"].items():
        if items:
            L.append(f"**{g}** ({len(items)}): {', '.join(items[:20])}{' …' if len(items)>20 else ''}\n")

    L.append("### only_raw breakdown (новые/непокрытые) — топ 30")
    by_kind = {}
    for r in weapons_res["only_raw"]:
        by_kind.setdefault(r["raw_kind"], []).append(r["name_en"])
    for k, v in by_kind.items():
        L.append(f"- **{k}** ({len(v)}): {', '.join(v[:30])}{' …' if len(v)>30 else ''}")
    L.append("")

    L.append("### K = legacy_dmg / raw_dmg_max (диагностика)")
    for g, st in weapons_res["K_by_group"].items():
        L.append(f"- **{g}**: median={st['median']:.2f}, mean={st['mean']:.2f}, n={st['n']}")
    L.append("\n→ K не единый. Подтверждение: формула raw→display отсутствует, legacy=ground truth.\n")

    L.append("## Brands\n")
    L.append(f"Legacy/brands.json **игнорим** (per spec). Используем raw/brands.json (64) + legacy/gear_sets для RU-имён там где matched.\n")
    L.append(f"- legacy.gear_sets matched: {brands_res['matched']}")
    L.append(f"- only_legacy: {len(brands_res['only_legacy'])} → {brands_res['only_legacy']}")
    L.append(f"- only_raw (новые TU22 бренды): {brands_res['only_raw_total']}")
    L.append(f"  Sample: {', '.join(brands_res['only_raw_sample'][:20])}")
    L.append("")

    L.append("## Gear sets\n")
    L.append(f"Raw breakdown: {sets_res['raw_breakdown']}")
    L.append(f"- matched: {sets_res['matched']} / {sets_res['legacy_count']}")
    L.append(f"- only_legacy: {len(sets_res['only_legacy'])}")
    L.append(f"- only_raw: {sets_res['only_raw_total']}\n")

    L.append("## Named gear\n")
    L.append(f"- matched: {named_gear_res['matched']} / {named_gear_res['legacy_count']}")
    L.append(f"- only_legacy: {len(named_gear_res['only_legacy'])}")
    L.append(f"- only_raw: {named_gear_res['only_raw_total']}\n")

    L.append("## Talents (cross-file, perfect-collapse on both sides)\n")
    L.append(f"Legacy counts: {talents_res['legacy_count']}")
    L.append(f"Raw counts (after collapse): {talents_res['raw_count']}")
    L.append("")
    L.append("| Group | Matched | Only legacy |")
    L.append("|---|---:|---:|")
    for g in ("exotic", "weapon", "gear"):
        L.append(f"| {g} | {len(talents_res['matched_per'][g])} | {len(talents_res['only_legacy_per'][g])} |")
    L.append(f"\n**collisions**: {len(talents_res['collisions'])}")
    L.append(f"\n**only_raw**: {len(talents_res['only_raw'])}")
    L.append(f"  Sample: {', '.join(r['name_en'] for r in talents_res['only_raw'][:20])}\n")

    for g in ("exotic", "weapon", "gear"):
        ol = talents_res["only_legacy_per"][g]
        if ol:
            L.append(f"### only_legacy/{g} ({len(ol)})")
            L.append(f"{', '.join(ol[:30])}{' …' if len(ol)>30 else ''}\n")

    L.append("## Apppliance\n")
    L.append("После апрува этого отчёта seed валидируется и build_db.py использует:")
    L.append("- **matched weapons/gear/sets**: stats из legacy, name/description/flavor/source/talent_text из overrides (translations) + raw для метаданных (game_id, weapon_group, mod_slots, intrinsic).")
    L.append("- **only_raw**: import raw as-is, `stat_quality='unverified'`, попадает в UNVERIFIED_ITEMS.md.")
    L.append("- **classifications** (core, subkind, has_perfect, links) применяются поверх раw.\n")

    OUT_RPT.write_text("\n".join(L), encoding="utf-8")

    # ---- MATCH_COLLISIONS.md ----
    C = [f"# Match collisions report\n_Generated: {datetime.now(timezone.utc).isoformat()}_",
         "",
         "## Weapons (raw сматчился в >1 legacy группу)",
         f"\n**Total: {len(weapons_res['collisions'])}**\n"]
    if weapons_res["collisions"]:
        C.append("| Name | Raw ID | Raw kind | First claimed by | Then attempted by | Resolution |")
        C.append("|---|---|---|---|---|---|")
        for col in weapons_res["collisions"]:
            C.append(f"| {col['name_en']} | `{col['raw_id']}` | {col['raw_kind']} | {col['claimed_by']} | {col['now_attempted_by']} | {col['resolution']} |")
    else:
        C.append("Нет коллизий — все weapons сматчились в свою priority-группу однозначно.")
    C.append("")
    C.append("## Talents")
    C.append(f"\n**Total: {len(talents_res['collisions'])}**\n")
    if talents_res["collisions"]:
        C.append("| Name | First by | Now by | Raw kind | Resolution |")
        C.append("|---|---|---|---|---|")
        for col in talents_res["collisions"]:
            C.append(f"| {col['name_en']} | {col['claimed_by']} | {col['now_attempted_by']} | {col['raw_kind']} | {col['resolution']} |")
    else:
        C.append("Нет коллизий.")
    OUT_COL.write_text("\n".join(C), encoding="utf-8")

    # ---- UNVERIFIED_ITEMS.md ----
    U = ["# Unverified items (only_raw — новые в TU22, без legacy ground truth)\n",
         f"_Generated: {datetime.now(timezone.utc).isoformat()}_",
         "",
         "Эти items войдут в БД с raw stats и `stat_quality='unverified'`. После запуска калькулятора — пройти руками по списку, сверить с in-game UI, выверенные значения положить в `data/manual_overrides.json` для последующих rebuild'ов.",
         "",
         "## Weapons",
    ]
    only_raw_w_by_kind = {}
    for r in weapons_res["only_raw"]:
        only_raw_w_by_kind.setdefault(r["raw_kind"], []).append(r)
    for kind in ("base", "named", "exotic"):
        items = only_raw_w_by_kind.get(kind, [])
        if not items: continue
        U.append(f"### {kind} ({len(items)})")
        U.append("| Name | Raw ID |")
        U.append("|---|---|")
        for r in items:
            U.append(f"| {r['name_en']} | `{r['raw_id']}` |")
        U.append("")
    U.append("## Talents (only_raw)")
    U.append(f"\n**Total: {len(talents_res['only_raw'])}**\n")
    if talents_res["only_raw"]:
        U.append("| Name | Kind |")
        U.append("|---|---|")
        for r in talents_res["only_raw"][:200]:
            U.append(f"| {r['name_en']} | {r['raw_kind']} |")
    OUT_UNV.write_text("\n".join(U), encoding="utf-8")

    print(f"OK")
    print(f"  overrides seed: {OUT_OVR} ({len(all_overrides)} candidates)")
    print(f"  report:         {OUT_RPT}")
    print(f"  collisions:     {OUT_COL} ({len(weapons_res['collisions'])} weapons + {len(talents_res['collisions'])} talents)")
    print(f"  unverified:     {OUT_UNV} ({len(weapons_res['only_raw'])} weapons + {len(talents_res['only_raw'])} talents)")


if __name__ == "__main__":
    main()
