import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMED = ROOT / "data" / "named.json"

with open(NAMED, "r", encoding="utf-8") as f:
    data = json.load(f)

fixed = 0
for item in data:
    if not (item.get("en") or "").strip():
        name = (item.get("name") or "").strip()
        if name:
            item["en"] = name
            fixed += 1
            print(f"  set en={name!r} (same as ru name, model already English)")

print(f"\nfixed: {fixed}")

with open(NAMED, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
