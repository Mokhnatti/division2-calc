import json
import sys
import time
from pathlib import Path

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("deep_translator not installed; run: pip install deep_translator", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
NAMED = ROOT / "data" / "named.json"
DICT_PATH = Path("D:/ClaudHorizont/DivCalc/_en_ru_name_dict.json")

with open(NAMED, "r", encoding="utf-8") as f:
    data = json.load(f)

ru2en_dict = {}
if DICT_PATH.exists():
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        d = json.load(f)
    for en, v in d.items():
        ru = (v.get("name_ru") or "").strip()
        if ru:
            ru2en_dict[ru] = en

missing = [i for i, item in enumerate(data) if not (item.get("en") or "").strip()]
print(f"missing en: {len(missing)} of {len(data)}")

tr = GoogleTranslator(source="ru", target="en")

filled_dict = 0
filled_translate = 0
errors = 0

for idx in missing:
    item = data[idx]
    name_ru = (item.get("name") or "").strip()
    if not name_ru:
        continue
    if name_ru in ru2en_dict:
        item["en"] = ru2en_dict[name_ru]
        filled_dict += 1
        continue
    try:
        en = tr.translate(name_ru)
        if en and en.strip() and en.strip().lower() != name_ru.lower():
            item["en"] = en.strip()
            filled_translate += 1
            print(f"  translated: {name_ru!r} -> {en!r}")
        else:
            errors += 1
            print(f"  empty translation for {name_ru!r}", file=sys.stderr)
        time.sleep(0.05)
    except Exception as e:
        errors += 1
        print(f"  error for {name_ru!r}: {e}", file=sys.stderr)

print(f"\nfilled_dict: {filled_dict}")
print(f"filled_translate: {filled_translate}")
print(f"errors: {errors}")

with open(NAMED, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f"saved {NAMED}")
