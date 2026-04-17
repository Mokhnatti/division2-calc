#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const D = path.join(__dirname, "..", "data");
const DS = path.join(__dirname, "..", "data_sources");

const namedGear = require(path.join(DS, "mikeree/namedGear.json"));
const existingNamed = require(path.join(D, "named.json"));

// Создаём lookup по RU названиям (из named.json)
const ruLookup = {};
existingNamed.forEach(item => {
  ruLookup[item.name.toLowerCase()] = item;
});

// Создаём lookup по EN названиям из Mikeree
const enLookup = {};
namedGear.forEach(item => {
  enLookup[item.name.toLowerCase()] = item;
});

// Маппинг RU → EN (для тех, которые мы уже знаем)
const ruToEn = {
  "перчатки подрядчика": "Contractor's Gloves",
  "хватка смерти": "Deathgrips",
  "крепкое рукопожатие": "Firm Handshake",
  "материнская любовь": "Motherly Love",
  "орлиная хватка": "Eagles Grasp",
  "окровавленные костяшки": "Bloody Knuckles",
  "перчатки btsu": "BTSU Datagloves",
  "перчатки exodus": "Exodus Gloves",
  "передозировка": "Overdogs",
  "прочные рукавицы": "Rugged Gauntlets",
};

const merged = existingNamed.map(item => {
  const enName = ruToEn[item.name.toLowerCase()];
  if (enName && enLookup[enName.toLowerCase()]) {
    const gear = enLookup[enName.toLowerCase()];
    return {
      name: item.name,
      en: gear.name, // обновляем EN имя
      g: item.g,
      t: item.t || "",
      brand: gear.brand || item.brand || "",
      tal: item.tal || "",
      d: item.d || "",
      core: gear.core ? gear.core[0] : undefined,
      attr1: gear.attribute1 && Object.keys(gear.attribute1).length > 0 ? gear.attribute1 : undefined,
      attr2: gear.attribute2 && Object.keys(gear.attribute2).length > 0 ? gear.attribute2 : undefined,
    };
  }
  return {
    ...item,
    brand: item.brand || "",
  };
});

// Добавляем отсутствующие именные вещи из Mikeree (которые не в named.json)
const existingEn = new Set(existingNamed.map(i => i.en?.toLowerCase()));
namedGear.forEach(gear => {
  if (!existingEn.has(gear.name.toLowerCase())) {
    // Только добавляем перчатки/gear, которые популярны
    if (gear.type !== "kneepads" && gear.type !== "mask") {
      merged.push({
        name: `[ПЕРЕВОД НУЖЕН] ${gear.name}`,
        en: gear.name,
        g: gear.type === "gloves" ? "Перчатки" :
           gear.type === "chest" ? "Броня" :
           gear.type === "backpack" ? "Рюкзак" :
           gear.type === "holster" ? "Кобура" : gear.type,
        t: "",
        brand: gear.brand || "",
        tal: gear.talent ? gear.talent.join(", ") : "",
        d: "",
        core: gear.core ? gear.core[0] : undefined,
        attr1: gear.attribute1 && Object.keys(gear.attribute1).length > 0 ? gear.attribute1 : undefined,
        attr2: gear.attribute2 && Object.keys(gear.attribute2).length > 0 ? gear.attribute2 : undefined,
      });
    }
  }
});

// Очищаем undefined
const cleanMerged = merged.map(item =>
  Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined))
);

fs.writeFileSync(path.join(D, "named.json"), JSON.stringify(cleanMerged, null, 2) + "\n");

console.log(`=== NAMED ITEMS MERGED ===`);
console.log(`Updated: ${merged.filter(m => m.core || m.attr1 || m.attr2).length} items with stats`);
console.log(`Added missing: ${merged.filter(m => m.name?.includes("[ПЕРЕВОД")).length} items`);
console.log(`Total: ${merged.length} items`);
