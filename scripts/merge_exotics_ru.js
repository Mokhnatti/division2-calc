#!/usr/bin/env node
/**
 * Мерджит русские имена и таланты из exotics_from_screens.json
 * в data/exotic_weapons.json:
 *   - Переименовывает английские ключи на русские (Bighorn → Толсторог...)
 *   - Добавляет tal_name_ru, tal_desc_ru, name_ru
 *   - НЕ трогает числовые статы (dmg/rpm/mag) — они базовые, без модов игрока
 */
const fs = require("fs");
const path = require("path");

const SCREENS = "D:/ClaudHorizont/DivCalc/exotics_from_screens.json";
const DB = path.resolve(__dirname, "../data/exotic_weapons.json");

const screens = JSON.parse(fs.readFileSync(SCREENS, "utf8"));
const db = JSON.parse(fs.readFileSync(DB, "utf8"));

const keyMap = {
  "Bighorn": "Толсторог (MMR)",
  "Liberty": "Свобода",
  "Lullaby": "Колыбельная",
  "Merciless": "Беспощадный",
  "Overlord": "Владыка",
  "Ruthless": "Безжалостный",
  "St Elmo's Engine": "Мотор святого Эльма",
  "Sweet Dreams": "Сладкий сон",
  "The Bighorn - Semi-Auto Mode": "Толсторог (полуавто)",
  "The Bighorn Full-Auto Mode": "Толсторог (авто)",
  "Железный Лёгкий": "Железный лун",
  "Горькая Радость": "Горькая радость",
  "Домашний Доктор": "Домашний доктор",
  "Орлиное Знамя": "Орлиное знамя",
  "Синий Экран": "Синий экран",
  "Суровый Приговор": "Суровый приговор",
  "Трудолюбивая Пчёлка": "Трудолюбивая пчёлка",
  "Обратный Удар": "Обратный удар",
};

const screenAlias = {
  "Трудолюбивая пчелка": "Трудолюбивая пчёлка",
  "Толсторог": "Толсторог (полуавто)",
};

const norm = (s) => (s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

function findInScreens(ruName) {
  const n = norm(ruName);
  return screens.find((s) => norm(s.name_ru) === n);
}

const out = {};
let renamed = 0, enriched = 0, skipped = 0;

for (const [oldKey, entry] of Object.entries(db)) {
  const newKey = keyMap[oldKey] || oldKey;
  if (newKey !== oldKey) renamed++;
  const screenData = findInScreens(newKey);
  const merged = { ...entry };
  if (screenData) {
    merged.name_ru = screenData.name_ru;
    merged.tal_name_ru = screenData.talent_name;
    merged.tal_desc_ru = screenData.talent_desc;
    enriched++;
  } else {
    skipped++;
  }
  out[newKey] = merged;
}

for (const s of screens) {
  const resolvedKey = screenAlias[s.name_ru] || s.name_ru;
  if (out[resolvedKey] && !out[resolvedKey].tal_desc_ru) {
    out[resolvedKey].name_ru = s.name_ru;
    out[resolvedKey].tal_name_ru = s.talent_name;
    out[resolvedKey].tal_desc_ru = s.talent_desc;
    enriched++;
    continue;
  }
  const key = resolvedKey;
  if (!out[key]) {
    out[key] = {
      en: key,
      cat: s.cat,
      dmg: 0,
      rpm: s.rpm,
      mag: s.mag,
      reload: 2.0,
      tal: s.talent_name,
      tal_desc: s.talent_desc,
      name_ru: s.name_ru,
      tal_name_ru: s.talent_name,
      tal_desc_ru: s.talent_desc,
      _new_from_screen: true,
    };
  }
}

fs.writeFileSync(DB, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Renamed: ${renamed}, enriched: ${enriched}, skipped: ${skipped}`);
console.log(`Total exotics now: ${Object.keys(out).length}`);

const notMatched = screens.filter((s) => !out[s.name_ru] || !out[s.name_ru].name_ru);
if (notMatched.length) {
  console.log(`\nНе сматчено со скринов (${notMatched.length}):`);
  notMatched.forEach((s) => console.log(`  - ${s.name_ru} (${s.cat})`));
}
