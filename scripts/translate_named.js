#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const D = path.join(__dirname, "..", "data");

// Словарь переводов
const translations = {
  "Liquid Engineer": "Жидкий инженер",
  "Hermano": "Эрмано",
  "Anarchist's Cookbook": "Поваренная книга анархиста",
  "Matador": "Матадор",
  "The Gift": "Подарок",
  "Devil's Due": "Долг дьявола",
  "Battery Pack": "Энергоблок",
  "The Setup": "Ловушка",
  "Force Multiplier": "Усилитель силы",
  "Festive Delivery": "Праздничная доставка",
  "Everyday Carrier": "Ежедневный переносчик",
  "Pointman": "Острие",
  "Vedmedytsya Vest": "Жилет ведмедицы",
  "Zero F's": "Без забот",
  "Door-Kicker's Knock": "Удар крушителя",
  "Caesar's Guard": "Охрана цезаря",
  "Bober": "Бобёр",
  "Collector": "Коллекционер",
  "Provocator": "Провокатор",
  "Beacon": "Маяк",
  "Tardigrade Armor System": "Броня тардиграда",
  "Ridgeway's Pride": "Гордость Риджвея",
  "Ammo Dump": "Боеприпас",
  "Picaros Holster": "Кобура пикаро",
  "Acosta's Go-Bag": "Боевой рюкзак Акосты",
  "Birdie's Quick Fix Pack": "Аптечка Бёрди",
  "Memento": "Реликвия",
  "NinjaBike Messenger Backpack": "Рюкзак NinjaBike",
  "Centurion Scabbard": "Ножны центуриона",
  "Dodge City Gunslinger's Holster": "Кобура скорострела",
  "Imperial Dynasty": "Имперская династия",
  "Shocker Punch": "Шокирующий удар",
  "Waveform": "Волновая форма",
  "Nimble Holster": "Ловкая кобура",
};

const named = require(path.join(D, "named.json"));

const updated = named.map(item => {
  if (item.name.includes("[ПЕРЕВОД НУЖЕН]")) {
    const en = item.en;
    const ru = translations[en] || en;
    return {
      ...item,
      name: ru,
    };
  }
  return item;
});

fs.writeFileSync(path.join(D, "named.json"), JSON.stringify(updated, null, 2) + "\n");

console.log(`=== TRANSLATIONS APPLIED ===`);
const translated = updated.filter(i => i.name && !i.name.includes("[ПЕРЕВОД")).length;
console.log(`Translated: ${translated} items`);
