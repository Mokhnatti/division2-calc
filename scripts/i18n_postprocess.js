// Post-processor: convert RU-generated HTML to EN version
// Uses LABELS dictionary + item's name_en/name_ru fields

const LABELS = require('./i18n_labels');
const path = require('path');
const fs = require('fs');

// Load UI translations for text replacement
let UI_TR = null;
function getUiTr() {
  if (UI_TR) return UI_TR;
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'ui_translations.json'), 'utf8');
    const d = JSON.parse(raw);
    UI_TR = d.ru_to_en || d;
  } catch(e) { UI_TR = {}; }
  return UI_TR;
}

// Phrases/labels used in generated static pages (hardcoded RU → EN replacements)
const STATIC_REPLACEMENTS = [
  // Page structure
  ['<html lang="ru">', '<html lang="en">'],
  // Nav
  ['<a class="logo" href="/">', '<a class="logo" href="/en/">'],
  ['<a href="/exotic/">Экзотики</a>', '<a href="/en/exotic/">Exotics</a>'],
  ['<a href="/named/">Именные</a>', '<a href="/en/named/">Named</a>'],
  ['<a href="/set/">Комплекты</a>', '<a href="/en/set/">Sets</a>'],
  ['<a href="/brand/">Бренды</a>', '<a href="/en/brand/">Brands</a>'],
  ['<a class="calc-btn" href="/">🔢 Калькулятор</a>', '<a class="calc-btn" href="/en/">🔢 Calculator</a>'],
  ['<a href="/">divcalc.xyz</a> — калькулятор DPS для Tom Clancy\'s The Division 2',
    '<a href="/en/">divcalc.xyz</a> — DPS calculator for Tom Clancy\'s The Division 2'],
  ['Данные актуальны для Title Update 21 (Year 9)', 'Data accurate for Title Update 22 (Year 8 Season 1 «Rise Up»)'],
  ['Данные актуальны для Title Update 22 (Year 8 Season 1)', 'Data accurate for Title Update 22 (Year 8 Season 1 «Rise Up»)'],
  // Breadcrumb
  ['<a href="/">Главная</a>', '<a href="/en/">Home</a>'],
  ['<a href="/exotic/">Экзотики</a> <span>›</span>', '<a href="/en/exotic/">Exotics</a> <span>›</span>'],
  ['<a href="/named/">Именные</a> <span>›</span>', '<a href="/en/named/">Named</a> <span>›</span>'],
  ['<a href="/set/">Комплекты</a> <span>›</span>', '<a href="/en/set/">Sets</a> <span>›</span>'],
  ['<a href="/brand/">Бренды</a> <span>›</span>', '<a href="/en/brand/">Brands</a> <span>›</span>'],
  // Section headers
  ['>Характеристики<', '>Stats<'],
  ['>Пиковые характеристики<', '>Peak stats<'],
  ['>Максимальный урон (со стаками/условием)<', '>Max damage (with stacks/condition)<'],
  ['>Талант:', '>Talent:'],
  ['>Синергии<', '>Synergies<'],
  ['>Синергии и рекомендуемые билды<', '>Synergies & recommended builds<'],
  ['>Другие экзотики<', '>Other exotics<'],
  ['>Другие комплекты<', '>Other sets<'],
  ['>Другие бренды<', '>Other brands<'],
  ['>Похожие именные<', '>Similar named<'],
  ['>Бонусы комплекта<', '>Set bonuses<'],
  ['>Талант нагрудника<', '>Chest talent<'],
  ['>Талант рюкзака<', '>Backpack talent<'],
  ['>Бонусы бренда<', '>Brand bonuses<'],
  ['>📍 Где добыть<', '>📍 Where to farm<'],
  ['<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">✓ Подтверждённые источники</h3>',
    '<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">✓ Confirmed sources</h3>'],
  ['<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">Возможно также</h3>',
    '<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">Possibly also</h3>'],
  ['<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">Источники</h3>',
    '<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">Sources<h3>'],
  ['🌍 Общий мировой дроп (любой пул оружия / контейнер)', '🌍 General world drop (any weapon pool / container)'],
  // Stats table rows
  ['<tr><td>Урон (базовый)</td>', '<tr><td>Base damage</td>'],
  ['<tr><td>Скорострельность</td>', '<tr><td>RPM</td>'],
  ['<tr><td>Магазин</td>', '<tr><td>Magazine</td>'],
  ['<tr><td>Перезарядка</td>', '<tr><td>Reload</td>'],
  ['<tr><td>Тип оружия</td>', '<tr><td>Weapon type</td>'],
  ['<tr><td>Тип</td>', '<tr><td>Type</td>'],
  ['<tr><td>Тип снаряжения</td>', '<tr><td>Gear slot</td>'],
  ['<tr><td>Атрибуты</td>', '<tr><td>Attributes</td>'],
  ['<tr><td>Бренд</td>', '<tr><td>Brand</td>'],
  ['<tr><td>Источник</td>', '<tr><td>Source</td>'],
  ['<tr><td>Бонус</td>', '<tr><td>Bonus</td>'],
  ['<tr><td>Где добыть</td>', '<tr><td>Where to farm</td>'],
  ['<tr><td>Источник получения</td>', '<tr><td>Source</td>'],
  ['<tr><td>Главный атрибут</td>', '<tr><td>Main attribute</td>'],
  ['<tr><td>Основной атрибут</td>', '<tr><td>Core attribute</td>'],
  // Badges
  ['>Экзотик<', '>Exotic<'],
  ['>Именное<', '>Named<'],
  ['>Комплект<', '>Gear Set<'],
  ['>Бренд<', '>Brand<'],
  ['>Урон<', '>Damage<'],
  ['>Броня<', '>Armor<'],
  ['>Навыки<', '>Skills<'],
  [' патронов<', ' rounds<'],
  [' сек<', ' sec<'],
  // Source type labels (localized in sources)
  [' Миссия</b>', ' Mission</b>'],
  [' Именной NPC</b>', ' Named NPC</b>'],
  [' Именной босс</b>', ' Named Boss</b>'],
  [' Контейнер</b>', ' Chest</b>'],
  [' Экзотик-тайник</b>', ' Exotic Cache</b>'],
  [' Ивент</b>', ' Event</b>'],
  [' Ивентовый тайник</b>', ' Event Cache</b>'],
  [' Сезонная награда</b>', ' Season Reward</b>'],
  [' Боевой пропуск</b>', ' Battle Pass</b>'],
  [' Рейд</b>', ' Raid</b>'],
  [' Охота</b>', ' Manhunt</b>'],
  [' Крафт-торговец</b>', ' Craft Vendor</b>'],
  [' Торговец</b>', ' Vendor</b>'],
  [' Тёмная зона</b>', ' Dark Zone</b>'],
  [' Саммит</b>', ' Summit</b>'],
  [' Спуск</b>', ' Descent</b>'],
  [' Проект</b>', ' Project</b>'],
  [' Контракт</b>', ' Bounty</b>'],
  [' Прочее</b>', ' Other</b>'],
  [' Другое</b>', ' Other</b>'],
  [' Подземелье</b>', ' Dungeon</b>'],
  // Category page titles
  ['— Division 2 экзотик', '— Division 2 exotic'],
  ['— Division 2 экзотик ', '— Division 2 exotic '],
  ['— Division 2 именное оружие', '— Division 2 named weapon'],
  ['— Division 2 именное снаряжение', '— Division 2 named gear'],
  ['— Division 2 комплект снаряжения', '— Division 2 gear set'],
  ['— Division 2 бренд снаряжения', '— Division 2 gear brand'],
  ['— Division 2', '— Division 2'],
  ['Division 2 экзотик', 'Division 2 exotic'],
  ['— экзотическое оружие Division 2', '— exotic weapon for Division 2'],
  ['— экзотическое снаряжение Division 2', '— exotic gear for Division 2'],
  ['— именное оружие Division 2', '— named weapon for Division 2'],
  ['— именное снаряжение Division 2', '— named gear for Division 2'],
  ['— комплект снаряжения Division 2', '— gear set for Division 2'],
  ['— бренд снаряжения Division 2', '— gear brand for Division 2'],
  // Descriptions / meta
  ['Урон ', 'Damage '],
  ['скорострельность ', 'RPM '],
  ['магазин ', 'magazine '],
  ['Талант: ', 'Talent: '],
  ['Статы, гайд, лучшие билды.', 'Stats, guide, best builds.'],
  ['Статы и лучшие билды.', 'Stats and best builds.'],
  ['Бонусы, статы и билды.', 'Bonuses, stats and builds.'],
  ['Таланты, синергии, лучшие билды.', 'Talents, synergies, best builds.'],
  ['Бонусы: ', 'Bonuses: '],
  ['Статы, именные предметы, лучшие билды.', 'Stats, named items, best builds.'],
  ['Подбери оптимальный билд для', 'Build the optimal loadout for'],
  ['Подбери оптимальный билд с', 'Build the optimal loadout with'],
  ['с помощью ', 'with the '],
  ['калькулятора DPS divcalc.xyz', 'divcalc.xyz DPS calculator'],
  ['калькуляторе DPS divcalc.xyz', 'divcalc.xyz DPS calculator'],
  ['калькуляторе divcalc.xyz', 'divcalc.xyz calculator'],
  ['Рассчитай DPS билда с', 'Calculate DPS of a build with'],
  ['Рассчитай DPS и подбери снаряжение для комплекта', 'Calculate DPS and build gear for the set'],
  ['Подбери оптимальное сочетание брендов в', 'Build the optimal brand combination in'],
  [' Проверь синергии с ', ' Check synergies with '],
  [' Проверь совместимость с ', ' Check compatibility with '],
  [' Смотри также ', ' See also '],
  ['комплектами снаряжения', 'gear sets'],
  ['комплектами', 'sets'],
  ['экзотическим оружием', 'exotic weapons'],
  ['именным оружием', 'named weapons'],
  ['именное снаряжение', 'named gear'],
  ['брендами', 'brands'],
  ['другие предметы бренда', 'other items of brand'],
  ['Бренд снаряжения', 'Gear brand'],
  // JSON-LD breadcrumb (leave "name":"Главная" etc)
  ['"name":"Главная"', '"name":"Home"'],
  ['"name":"Экзотики"', '"name":"Exotics"'],
  ['"name":"Именные"', '"name":"Named"'],
  ['"name":"Комплекты"', '"name":"Sets"'],
  ['"name":"Бренды"', '"name":"Brands"'],
];

// Simple replacement (escape regex meta)
function applyReplacements(html) {
  let out = html;
  for (const [ru, en] of STATIC_REPLACEMENTS) {
    out = out.split(ru).join(en);
  }
  return out;
}

// Rewrite all internal /exotic/, /named/, /set/, /brand/ links to /en/... (for EN page)
function rewriteInternalLinks(html) {
  return html
    .replace(/href="\/exotic\//g, 'href="/en/exotic/')
    .replace(/href="\/named\//g, 'href="/en/named/')
    .replace(/href="\/set\//g, 'href="/en/set/')
    .replace(/href="\/brand\//g, 'href="/en/brand/')
    .replace(/href="\/"/g, 'href="/en/"');
}

// Update canonical + OG URL from /exotic/x to /en/exotic/x
function rewriteCanonicalToEn(html) {
  return html
    .replace(/<link rel="canonical" href="https:\/\/divcalc\.xyz\//g, '<link rel="canonical" href="https://divcalc.xyz/en/')
    .replace(/<meta property="og:url" content="https:\/\/divcalc\.xyz\//g, '<meta property="og:url" content="https://divcalc.xyz/en/')
    // Update JSON-LD URL fields (Product.url etc.)
    .replace(/"url":"https:\/\/divcalc\.xyz\/(exotic|named|set|brand)\//g, '"url":"https://divcalc.xyz/en/$1/');
}

// Inject hreflang tags into <head>
// ruPath: "/exotic/foo" (without leading slash? — should always have /)
function hreflangBlock(ruPath) {
  const ru = `https://divcalc.xyz${ruPath}`;
  const en = `https://divcalc.xyz/en${ruPath}`;
  return `<link rel="alternate" hreflang="ru" href="${ru}">
<link rel="alternate" hreflang="en" href="${en}">
<link rel="alternate" hreflang="x-default" href="${en}">`;
}

// Inject hreflang before </head>
function injectHreflang(html, ruPath) {
  const block = hreflangBlock(ruPath);
  return html.replace(/<\/head>/i, block + '\n</head>');
}

// Inject language switcher button into <body> at the top (before <nav>)
function injectLangSwitcher(html, lang, ruPath) {
  const targetUrl = lang === 'ru' ? `/en${ruPath}` : ruPath;
  const label = lang === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU';
  const titleAttr = lang === 'ru' ? 'Switch to English' : 'Переключить на русский';
  const btn = `<a href="${targetUrl}" style="position:fixed;top:10px;right:10px;background:rgba(0,0,0,.75);color:#fff;padding:6px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;z-index:9999;border:1px solid rgba(255,255,255,.2)" title="${titleAttr}">${label}</a>`;
  return html.replace(/<body>/i, `<body>\n${btn}`);
}

/**
 * Main entry: given RU-generated HTML + item + ruPath, produce EN version.
 */
function translateHtmlToEn(ruHtml, item, ruPath, itemType) {
  let html = ruHtml;

  // Swap item-specific RU text with EN equivalents
  // (item.name or item.name_ru → item.en or item.name_en)
  const ruName = item.name_ru || item.name || '';
  const enName = item.en || item.name_en || item.name_full_en || '';

  if (ruName && enName && ruName !== enName) {
    // Replace h1 and visible headings
    html = html.split(`>${escape(ruName)}<`).join(`>${escape(enName)}<`);
    // But keep EN subtitle shown on RU version
    html = html.split(`class="en-name">${escape(enName)}<`).join(`class="en-name" style="display:none"><`);
  }

  // Swap RU description/talent description if EN exists
  const ruDesc = item.tal_desc_ru || item.d || item.bonus_ru || '';
  const enDesc = item.tal_desc || item.d_en || item.bonus_short_en || '';
  if (ruDesc && enDesc && ruDesc !== enDesc) {
    html = html.split(escape(ruDesc)).join(escape(enDesc));
  }

  // Apply static dictionary
  html = applyReplacements(html);

  // Rewrite internal links to /en/*
  html = rewriteInternalLinks(html);

  // Rewrite canonical + og:url
  html = rewriteCanonicalToEn(html);

  // Inject hreflang
  html = injectHreflang(html, ruPath);

  // Inject language switcher
  html = injectLangSwitcher(html, 'en', ruPath);

  return html;
}

/**
 * For RU version: just inject hreflang + lang switcher (no text swap).
 */
function enhanceRuHtml(ruHtml, ruPath) {
  let html = injectHreflang(ruHtml, ruPath);
  html = injectLangSwitcher(html, 'ru', ruPath);
  return html;
}

// HTML escape (same as generate_pages.js)
function escape(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { translateHtmlToEn, enhanceRuHtml, hreflangBlock };
