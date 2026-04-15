#!/usr/bin/env node
// Wiki scraper — fetches English data from thedivision.fandom.com for all items.
// Output: wiki_en.json in project root.
// Run: node scripts/scrape_wiki.js

const fs = require("fs");
const https = require("https");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const SLEEP_MS = 300; // политный rate limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve(null);
        }
      });
      res.on("error", reject);
    });
  });
}

async function fetchWikitext(pageName) {
  const tries = [
    pageName,
    pageName + "_(The_Division_2)",
    pageName.replace(/_/g, " "),
  ];
  for (const title of tries) {
    const url = `https://thedivision.fandom.com/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&redirects=1`;
    const j = await fetchJson(url);
    const wt = j && j.parse && j.parse.wikitext && j.parse.wikitext["*"];
    if (wt) return { wikitext: wt, title: j.parse.title };
    await sleep(SLEEP_MS);
  }
  return null;
}

// Parse key-value pairs from {{WeaponBox|key = value|...}} template
function parseWeaponBox(wt) {
  const m = /\{\{WeaponBox([\s\S]*?)\}\}/.exec(wt);
  if (!m) return null;
  const body = m[1];
  const out = {};
  body.split("\n").forEach((line) => {
    const mm = /^\|\s*(\w+)\s*=\s*(.+?)\s*$/.exec(line);
    if (mm) out[mm[1]] = mm[2].replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1");
  });
  return Object.keys(out).length ? out : null;
}

// Parse set bonuses from "== Set Completion Bonus ==" section
function parseSetBonuses(wt) {
  const m = /==\s*Set\s+(?:Completion\s+)?Bonus(?:es)?\s*==([\s\S]*?)(?:==|$)/i.exec(wt);
  if (!m) return null;
  const body = m[1];
  const bonuses = [];
  body.split("\n").forEach((line) => {
    const mm = /^\s*\*\s*(.+?)\s*$/.exec(line);
    if (mm) {
      const cleaned = mm[1]
        .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (_, a, b) => (b ? b.slice(1) : a))
        .replace(/'''|''/g, "")
        .replace(/\{\{[^}]+\}\}/g, "")
        .trim();
      if (cleaned) bonuses.push(cleaned);
    }
  });
  return bonuses.length ? bonuses : null;
}

// Parse talent/effect from "== Talent ==" or first paragraph
function parseDescription(wt) {
  // Strip templates/wikilinks and keep first meaningful paragraph after boxes
  const afterBox = wt.replace(/\{\{[\s\S]*?\}\}/g, "").trim();
  const lines = afterBox.split("\n").filter((l) => l.trim() && !l.startsWith("==") && !l.startsWith("*"));
  if (lines.length === 0) return null;
  const first = lines
    .slice(0, 3)
    .join(" ")
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (_, a, b) => (b ? b.slice(1) : a))
    .replace(/'''|''/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return first.slice(0, 500);
}

function parseTalent(wt) {
  const m = /==\s*Talent\s*==([\s\S]*?)(?:==|$)/i.exec(wt);
  if (!m) return null;
  return m[1]
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (_, a, b) => (b ? b.slice(1) : a))
    .replace(/'''|''/g, "")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .slice(0, 400);
}

// Load item lists from index.html
function extractItems() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const items = { sets: [], brands: [], exotics: [], named: [] };

  // Gear sets
  const gMatch = /const\s+G\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
  if (gMatch) {
    const re = /\{name:"([^"]+)",en:"([^"]+)"/g;
    let m;
    while ((m = re.exec(gMatch[1]))) items.sets.push({ name: m[1], en: m[2] });
  }

  // Brands
  const bMatch = /const\s+B\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
  if (bMatch) {
    const re = /\{name:"([^"]+)"/g;
    let m;
    while ((m = re.exec(bMatch[1]))) items.brands.push({ name: m[1], en: m[1] });
  }

  // Exotics
  const eMatch = /const\s+E\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
  if (eMatch) {
    const re = /\{name:"([^"]+)",en:"([^"]+)"/g;
    let m;
    while ((m = re.exec(eMatch[1]))) items.exotics.push({ name: m[1], en: m[2] });
  }

  // Named
  const nMatch = /const\s+N\s*=\s*\[([\s\S]*?)^\];/m.exec(html);
  if (nMatch) {
    const re = /\{name:"([^"]+)",en:"([^"]+)"/g;
    let m;
    while ((m = re.exec(nMatch[1]))) items.named.push({ name: m[1], en: m[2] });
  }

  return items;
}

async function processItem(ruName, enName, type) {
  const pageName = enName.replace(/ /g, "_").replace(/'/g, "%27");
  const res = await fetchWikitext(pageName);
  if (!res) return { type, name: ruName, en: enName, found: false };

  const wt = res.wikitext;
  const out = { type, name: ruName, en: enName, title: res.title, found: true };

  if (type === "brand" || type === "set") {
    const bonuses = parseSetBonuses(wt);
    if (bonuses) out.bonuses = bonuses;
    const desc = parseDescription(wt);
    if (desc) out.description = desc;
  } else if (type === "exotic" || type === "named") {
    const box = parseWeaponBox(wt);
    if (box) out.weaponBox = box;
    const talent = parseTalent(wt);
    if (talent) out.talent = talent;
    const desc = parseDescription(wt);
    if (desc) out.description = desc;
  }
  return out;
}

async function main() {
  const items = extractItems();
  console.log(
    `Items loaded: ${items.sets.length} sets, ${items.brands.length} brands, ${items.exotics.length} exotics, ${items.named.length} named`
  );

  const out = { sets: {}, brands: {}, exotics: {}, named: {}, meta: { generated: new Date().toISOString(), source: "thedivision.fandom.com" } };
  let found = 0,
    total = 0;

  const walk = async (list, type, bucket) => {
    for (const it of list) {
      total++;
      global.process.stdout.write(`[${total}] ${type}: ${it.en} ... `);
      try {
        const res = await processItem(it.name, it.en, type);
        out[bucket][it.en] = res;
        if (res.found) {
          found++;
          console.log("OK");
        } else console.log("miss");
      } catch (e) {
        console.log("ERR", e.message);
      }
      await sleep(SLEEP_MS);
    }
  };

  await walk(items.sets, "set", "sets");
  await walk(items.brands, "brand", "brands");
  await walk(items.exotics, "exotic", "exotics");
  await walk(items.named, "named", "named");

  const outFile = path.join(__dirname, "..", "wiki_en.json");
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");
  console.log(`\nDone. ${found}/${total} items found. Written to ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
