#!/usr/bin/env node
/**
 * Обновляет поле `d` (описание таланта на русском) в exotics.json
 * полными текстами из exotics_from_screens.json.
 * Матчится по name (русскому имени).
 */
const fs = require("fs");
const path = require("path");

const SCREENS = "D:/ClaudHorizont/DivCalc/exotics_from_screens.json";
const DB = path.resolve(__dirname, "../data/exotics.json");

const screens = JSON.parse(fs.readFileSync(SCREENS, "utf8"));
const db = JSON.parse(fs.readFileSync(DB, "utf8"));

const norm = (s) => (s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
const byName = {};
screens.forEach((s) => (byName[norm(s.name_ru)] = s));

let updated = 0, missing = [];
for (const e of db) {
  const m = byName[norm(e.name)];
  if (m) {
    e.tal_ru = m.talent_name;
    e.d = m.talent_desc;
    updated++;
  } else {
    missing.push(e.name);
  }
}

fs.writeFileSync(DB, JSON.stringify(db, null, 2) + "\n", "utf8");
console.log(`Updated: ${updated}/${db.length}`);
if (missing.length) {
  console.log(`\nНет в скринах (${missing.length}):`);
  missing.forEach((n) => console.log(`  - ${n}`));
}
