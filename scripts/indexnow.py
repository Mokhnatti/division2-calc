#!/usr/bin/env python3
"""
IndexNow ping for divcalc.xyz.

Notifies Bing/Yandex/Naver/Seznam (single endpoint api.indexnow.org fans out)
about changed URLs after deploy. Usage:

    py -X utf8 scripts/indexnow.py --all
    py -X utf8 scripts/indexnow.py --urls https://divcalc.xyz/weapons/iron-lung https://divcalc.xyz/weapons/eagle-bearer
    py -X utf8 scripts/indexnow.py --since-commit HEAD~1   # diff-driven

Key file (must be reachable at https://divcalc.xyz/<key>.txt):
    /var/www/divcalc/astro/<key>.txt
The key is read from environment INDEXNOW_KEY or scripts/.indexnow.key
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from pathlib import Path

HOST = "divcalc.xyz"
ENDPOINT = "https://api.indexnow.org/indexnow"
ROOT = Path(__file__).resolve().parent.parent
ASTRO_PUBLIC = ROOT / "apps" / "astro" / "public"
KEY_FILE = ROOT / "scripts" / ".indexnow.key"
SITEMAP_URL = f"https://{HOST}/sitemap-0.xml"


def load_key() -> str:
    key = os.environ.get("INDEXNOW_KEY")
    if key:
        return key.strip()
    if KEY_FILE.exists():
        return KEY_FILE.read_text(encoding="utf-8").strip()
    sys.exit(
        "INDEXNOW_KEY not set. Generate (uuid4 hex, 8-128 chars), put it in "
        f"{KEY_FILE} AND deploy as {ASTRO_PUBLIC}/<key>.txt with body=<key>."
    )


def collect_all_urls() -> list[str]:
    """Pull every URL out of the deployed sitemap."""
    import re
    try:
        with urllib.request.urlopen(SITEMAP_URL, timeout=15) as r:
            body = r.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError as e:
        sys.exit(f"failed to fetch sitemap: {e}")
    return re.findall(r"<loc>([^<]+)</loc>", body)


def collect_changed_since(commit: str) -> list[str]:
    """Map changed Astro pages and content files to public URLs."""
    try:
        out = subprocess.check_output(
            ["git", "diff", "--name-only", commit, "HEAD"],
            cwd=ROOT, encoding="utf-8",
        )
    except subprocess.CalledProcessError as e:
        sys.exit(f"git diff failed: {e}")

    urls: set[str] = set()
    for path in out.splitlines():
        path = path.strip()
        if not path:
            continue
        if path.startswith("apps/astro/src/pages/"):
            rel = path[len("apps/astro/src/pages/"):]
            if rel.endswith(".astro"):
                rel = rel[:-len(".astro")]
            if rel.endswith("/index"):
                rel = rel[:-len("/index")]
            elif rel == "index":
                rel = ""
            if "[" in rel:
                continue  # dynamic route, can't map without data
            urls.add(f"https://{HOST}/{rel}".rstrip("/"))
        elif path.startswith("apps/astro/src/content/"):
            parts = path.split("/")
            if len(parts) >= 5:
                kind = parts[3].split("-")[0]  # weapons-en -> weapons
                slug = parts[4].rsplit(".", 1)[0]
                lang = "ru/" if parts[3].endswith("-ru") else ""
                urls.add(f"https://{HOST}/{lang}{kind}/{slug}")
    return sorted(urls)


def submit(urls: list[str], key: str) -> None:
    if not urls:
        print("no URLs to submit")
        return
    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": urls,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT, data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow {r.status}: submitted {len(urls)} URLs")
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTP {e.code}: {e.read().decode('utf-8', 'ignore')}")
        sys.exit(1)
    except urllib.error.URLError as e:
        sys.exit(f"IndexNow request failed: {e}")


def main() -> None:
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--all", action="store_true", help="submit every URL from sitemap")
    g.add_argument("--urls", nargs="+", help="explicit URLs")
    g.add_argument("--since-commit", help="diff against a commit-ish (e.g. HEAD~1)")
    args = p.parse_args()

    key = load_key()
    if args.all:
        urls = collect_all_urls()
    elif args.urls:
        urls = args.urls
    else:
        urls = collect_changed_since(args.since_commit)

    print(f"submitting {len(urls)} URL(s)")
    for u in urls[:10]:
        print(f"  {u}")
    if len(urls) > 10:
        print(f"  ... +{len(urls) - 10} more")
    submit(urls, key)


if __name__ == "__main__":
    main()
