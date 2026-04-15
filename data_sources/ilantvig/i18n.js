import { createI18n } from "vue-i18n";

const messages = {
  en: {
    attributeLabelSet: "Set attribute values or",
    attributeLabelSelect: "Select attributes or",
    attributeButtonTextSet: "Set attributes",
    attributeButtonTextSelect: "Select attributes",

    WD_base: "Base weapon damage",
    WD: "Weapon damage (WD)",
    WD_type: "Weapon type damage",
    WD_other: "Weapon damage (other)",
    TWD_increaser: "Total WD increaser",
    TWD_amplifier: "Total WD amplifier",
    D_to_health: "Damage to Health",
    D_to_armor: "Damage to Armor",
    D_to_toc: "Damage to Target Out of Cover",
    crit_hit_chance: "Critical Hit Chance",
    crit_hit_damage: "Critical Hit Damage",
    headshot_damage: "Headshot Damage",
    D_additional: "Additional damage",
    D_multiplier: "Damage multiplier",

    hasArmor: "Target has Armor",
    isOutOfCover: "Target is Out of Cover",
    IsCriticalHit: "Critical Hit",
    isAvarageDamage: "Avarage Crit. Damage",

    result: {
      head: "Head",
      body: "Body",
      WD: "Weapon damage",
    },
  },
  ru: {
    attributeLabelSet: "Введите значения или",
    attributeLabelSelect: "Выберите опции или",
    attributeButtonTextSet: "Введите значения",
    attributeButtonTextSelect: "Выберите опции",

    WD_base: "Базовый урон оружия",
    WD: "Урон оружия (УО)",
    WD_type: "Урон выбр. типа оружия",
    WD_other: "Урон оружия (прочее)",
    TWD_increaser: "Увеличение общего УО",
    TWD_amplifier: "Увеличение всего УО",
    D_to_health: "Урон здоровью",
    D_to_armor: "Урон броне",
    D_to_toc: "Урон цели вне укрытия",
    crit_hit_chance: "Шанс крит. попаданий",
    crit_hit_damage: "Урон от крит. попаданий",
    headshot_damage: "Урон от выстрела в голову",
    D_additional: "Доп. урон (слагаемое)",
    D_multiplier: "Доп. урон (множитель)",

    hasArmor: "У цели есть броня",
    isOutOfCover: "Цель вне укрытия",
    IsCriticalHit: "Крит. пападание",
    isAvarageDamage: "Усреднённый крит. урон",

    result: {
      head: "В голову",
      body: "В тело",
      WD: "Урон оружия",
    },
  },
};

const i18n = createI18n({
  locale: "en", // set current locale
  fallbackLocale: "en",
  messages,
});

export default i18n;
