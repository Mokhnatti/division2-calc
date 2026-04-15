#!/usr/bin/env node
// Translator — uses free Google Translate endpoint to translate all Russian
// item descriptions to English. Output: translations_en.json.
// Idempotent: existing translations in the cache file are kept (re-run safely).
// Run: node scripts/translate_items.js

const fs = require("fs");
const https = require("https");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const SLEEP_MS = 120; // rate limit

const CACHE_FILE = path.join(__dirname, "..", "translations_en.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function gtranslate(text, source = "ru", target = "en") {
  return new Promise((resolve, reject) => {
    if (!text || !text.trim()) return resolve(text);
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      source +
      "&tl=" +
      target +
      "&dt=t&q=" +
      encodeURIComponent(text);
    https
      .get(url, { headers: { "User-Agent": UA } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(d);
            // Structure: [[[translated, original, null, null, n], ...], null, source_lang]
            if (!Array.isArray(j) || !Array.isArray(j[0])) return resolve(null);
            const out = j[0].map((seg) => (seg && seg[0]) || "").join("");
            resolve(out);
          } catch (e) {
            resolve(null);
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// Parse an array literal from JS source — returns array of objects with name/en/bonuses/etc
function extractArray(html, varName) {
  const re = new RegExp("const\\s+" + varName + "\\s*=\\s*\\[([\\s\\S]*?)^\\];", "m");
  const m = re.exec(html);
  if (!m) return [];
  const body = m[1];
  // Match top-level object literals
  const objs = [];
  let depth = 0,
    start = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        objs.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objs;
}

function getField(objSrc, key) {
  const re = new RegExp('\\b' + key + ':\\s*"([^"]*?)"');
  const m = re.exec(objSrc);
  return m ? m[1] : null;
}

function getArrayField(objSrc, key) {
  const re = new RegExp('\\b' + key + ':\\s*\\[([^\\]]*)\\]');
  const m = re.exec(objSrc);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

async function main() {
  const htmlPath = path.join(__dirname, "..", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  // Load existing cache
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    } catch (e) {
      cache = {};
    }
  }
  cache.sets = cache.sets || {};
  cache.brands = cache.brands || {};
  cache.exotics = cache.exotics || {};
  cache.named = cache.named || {};
  cache.talents = cache.talents || {};
  cache.meta = {
    generated: new Date().toISOString(),
    source: "translate.googleapis.com",
  };

  // Extract items
  const sets = extractArray(html, "G");
  const brands = extractArray(html, "B");
  const exotics = extractArray(html, "E");
  const named = extractArray(html, "N");

  console.log("Items: sets=" + sets.length + " brands=" + brands.length + " exotics=" + exotics.length + " named=" + named.length);

  let translated = 0,
    cached = 0,
    failed = 0;

  const tr = async (key, ruText) => {
    if (!ruText) return null;
    if (cache.__texts && cache.__texts[ruText]) {
      cached++;
      return cache.__texts[ruText];
    }
    if (!cache.__texts) cache.__texts = {};
    const result = await gtranslate(ruText);
    if (result) {
      cache.__texts[ruText] = result;
      translated++;
      await sleep(SLEEP_MS);
      return result;
    } else {
      failed++;
      return null;
    }
  };

  // Sets
  for (const src of sets) {
    const en = getField(src, "en");
    const name = getField(src, "name");
    if (!en) continue;
    const entry = cache.sets[en] || { name, en };
    const bonuses = getArrayField(src, "bonuses");
    const chest = getField(src, "chest");
    const bp = getField(src, "bp");
    if (bonuses) {
      entry.bonuses = [];
      for (const b of bonuses) {
        const t = await tr("bonus", b);
        entry.bonuses.push(t || b);
      }
    }
    if (chest) entry.chest = (await tr("chest", chest)) || chest;
    if (bp) entry.bp = (await tr("bp", bp)) || bp;
    cache.sets[en] = entry;
    global.process.stdout.write("set " + en + " -> ok\n");
    // Save incrementally in case of crash
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  }

  // Brands
  for (const src of brands) {
    const name = getField(src, "name");
    if (!name) continue;
    const entry = cache.brands[name] || { name };
    const bonuses = getArrayField(src, "bonuses");
    if (bonuses) {
      entry.bonuses = [];
      for (const b of bonuses) {
        const t = await tr("bbonus", b);
        entry.bonuses.push(t || b);
      }
    }
    cache.brands[name] = entry;
    global.process.stdout.write("brand " + name + " -> ok\n");
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  }

  // Exotics
  for (const src of exotics) {
    const en = getField(src, "en");
    if (!en) continue;
    const entry = cache.exotics[en] || { en };
    entry.name = getField(src, "name");
    const tal = getField(src, "tal");
    const d = getField(src, "d");
    if (tal) entry.tal = (await tr("tal", tal)) || tal;
    if (d) entry.d = (await tr("d", d)) || d;
    cache.exotics[en] = entry;
    global.process.stdout.write("exotic " + en + " -> ok\n");
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  }

  // Named
  for (const src of named) {
    const en = getField(src, "en");
    if (!en) continue;
    const entry = cache.named[en] || { en };
    entry.name = getField(src, "name");
    const tal = getField(src, "tal");
    const d = getField(src, "d");
    if (tal) entry.tal = (await tr("tal", tal)) || tal;
    if (d) entry.d = (await tr("d", d)) || d;
    cache.named[en] = entry;
    global.process.stdout.write("named " + en + " -> ok\n");
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  }

  // Authoritative talents from faildruid/division-2-db (official in-game texts)
  global.process.stdout.write("\nFetching authoritative talents from faildruid...\n");
  try {
    const seedRaw = await new Promise((res, rej) => {
      https
        .get(
          "https://raw.githubusercontent.com/faildruid/division-2-db/develop/seed/seed.json",
          { headers: { "User-Agent": UA } },
          (r) => {
            let d = "";
            r.on("data", (c) => (d += c));
            r.on("end", () => res(d));
            r.on("error", rej);
          }
        )
        .on("error", rej);
    });
    const seed = JSON.parse(seedRaw);
    const auth = {};
    seed
      .filter((r) => r.model === "division_core.geartalent")
      .forEach((t) => {
        const n = t.fields.talent_name;
        const d = t.fields.talent_description;
        if (n) auth[n] = { tal: n, d: d || "" };
      });
    cache.talents_authoritative = auth;
    if (!cache.meta) cache.meta = {};
    cache.meta.authoritative_source = "faildruid/division-2-db";
    cache.meta.authoritative_count = Object.keys(auth).length;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
    global.process.stdout.write("Authoritative talents: " + Object.keys(auth).length + " merged\n");
  } catch (e) {
    global.process.stdout.write("Authoritative fetch failed: " + e.message + "\n");
  }

  console.log("\nDone. translated=" + translated + " cached=" + cached + " failed=" + failed);
  console.log("Output: " + CACHE_FILE);
}

main().catch((e) => {
  console.error(e);
  global.process.exit(1);
});
