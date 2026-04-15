#!/usr/bin/env node
// Merge external data sources into translations_en.json and optionally index.html items.
// Takes a prepared external_data.json with new items and updates our base.
//
// external_data.json format:
// {
//   "sources": [{"name":"Ubisoft TU20","url":"..."}],
//   "named": [{"name":"Exact English Name","talent":"Perfect X","description":"..."}],
//   "exotics": [...],
//   "sets": [...],
//   "brands": [...]
// }
//
// Usage: node scripts/merge_external.js <path_to_external_data.json>

const fs = require("fs");
const path = require("path");

const EXT = process.argv[2];
if (!EXT) {
  console.error("Usage: node scripts/merge_external.js <external_data.json>");
  process.exit(1);
}

const TRANSLATIONS_FILE = path.join(__dirname, "..", "translations_en.json");

function loadJson(p, fallback = {}) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

const ext = loadJson(EXT);
const trans = loadJson(TRANSLATIONS_FILE, { sets: {}, brands: {}, exotics: {}, named: {} });

let added = { sets: 0, brands: 0, exotics: 0, named: 0 };
let overwritten = 0;

function upsert(bucket, name, data) {
  if (!trans[bucket]) trans[bucket] = {};
  const existing = trans[bucket][name];
  if (existing) {
    // Overwrite only if existing data appears to be machine-translated (no source marker)
    if (!existing.source || existing.source === "google-translate") {
      trans[bucket][name] = { ...existing, ...data, source: data.source || "external" };
      overwritten++;
    }
  } else {
    trans[bucket][name] = { ...data, source: data.source || "external" };
    added[bucket] = (added[bucket] || 0) + 1;
  }
}

// Process each bucket from external data
for (const type of ["sets", "brands", "exotics", "named"]) {
  const items = ext[type] || [];
  for (const item of items) {
    const key = item.en || item.name;
    if (!key) continue;
    const data = {
      name: item.name || key,
      en: key,
      source: item.source || (ext.sources && ext.sources[0] ? ext.sources[0].name : "external"),
    };
    if (item.description) data.d = item.description;
    if (item.talent) data.tal = item.talent;
    if (item.bonuses) data.bonuses = item.bonuses;
    if (item.chest) data.chest = item.chest;
    if (item.bp) data.bp = item.bp;
    upsert(type, key, data);
  }
}

// Update meta
trans.meta = trans.meta || {};
trans.meta.last_merge = new Date().toISOString();
trans.meta.sources = [...(trans.meta.sources || []), ...(ext.sources || [])].slice(-10);

saveJson(TRANSLATIONS_FILE, trans);

console.log(`Merged: ${JSON.stringify(added)}`);
console.log(`Overwritten machine translations: ${overwritten}`);
console.log("Saved: " + TRANSLATIONS_FILE);
