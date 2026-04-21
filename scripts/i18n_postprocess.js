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
  ['<a class="logo" href="/ru/">', '<a class="logo" href="/en/">'],
  ['<a href="/ru/exotic/">Экзотики</a>', '<a href="/en/exotic/">Exotics</a>'],
  ['<a href="/ru/named/">Именные</a>', '<a href="/en/named/">Named</a>'],
  ['<a href="/ru/set/">Комплекты</a>', '<a href="/en/set/">Sets</a>'],
  ['<a href="/ru/brand/">Бренды</a>', '<a href="/en/brand/">Brands</a>'],
  ['<a class="calc-btn" href="/">🔢 Калькулятор</a>', '<a class="calc-btn" href="/">🔢 Calculator</a>'],
  ['<a href="/ru/">divcalc.xyz</a> — калькулятор DPS для Tom Clancy\'s The Division 2',
    '<a href="/en/">divcalc.xyz</a> — DPS calculator for Tom Clancy\'s The Division 2'],
  ['Данные актуальны для Title Update 21 (Year 9)', 'Data accurate for Title Update 22 (Year 8 Season 1 «Rise Up»)'],
  ['Данные актуальны для Title Update 22 (Year 8 Season 1)', 'Data accurate for Title Update 22 (Year 8 Season 1 «Rise Up»)'],
  // Breadcrumb
  ['<a href="/ru/">Главная</a>', '<a href="/en/">Home</a>'],
  ['<a href="/ru/exotic/">Экзотики</a> <span>›</span>', '<a href="/en/exotic/">Exotics</a> <span>›</span>'],
  ['<a href="/ru/named/">Именные</a> <span>›</span>', '<a href="/en/named/">Named</a> <span>›</span>'],
  ['<a href="/ru/set/">Комплекты</a> <span>›</span>', '<a href="/en/set/">Sets</a> <span>›</span>'],
  ['<a href="/ru/brand/">Бренды</a> <span>›</span>', '<a href="/en/brand/">Brands</a> <span>›</span>'],
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
    '<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">Sources</h3>'],
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
  // Gear slot types (item.g field)
  ['>Бронежилет<', '>Chest<'],
  ['>Рюкзак<', '>Backpack<'],
  ['>Наколенники<', '>Kneepads<'],
  ['>Перчатки<', '>Gloves<'],
  ['>Маска<', '>Mask<'],
  ['>Кобура<', '>Holster<'],
  ['>Штурмовые винтовки<', '>Assault Rifles<'],
  ['>Пистолеты-пулемёты<', '>SMGs<'],
  ['>Пулемёты<', '>LMGs<'],
  ['>Ручные пулемёты<', '>LMGs<'],
  ['>Снайперские винтовки<', '>Marksman Rifles<'],
  ['>Дробовики<', '>Shotguns<'],
  ['>Пистолеты<', '>Pistols<'],
  ['>Винтовки<', '>Rifles<'],
  // Source labels in tables (show up as plain text)
  ['Запечатанный тайник', 'Sealed Cache'],
  ['Экзотик-тайник', 'Exotic Cache'],
  ['Именной босс-', 'Named Boss-'],
  ['Именной босс', 'Named Boss'],
  ['Именной NPC', 'Named NPC'],
  ['Награда сезона', 'Season Reward'],
  ['Сезонная награда', 'Season Reward'],
  ['Боевой пропуск', 'Battle Pass'],
  ['Крафт-торговец', 'Craft Vendor'],
  ['Мировой дроп', 'World Drop'],
  ['Ивентовый тайник', 'Event Cache'],
  ['Глоб. событие', 'Global Event'],
  ['Тёмная зона', 'Dark Zone'],
  ['Обратный отсчёт', 'Countdown'],
  // Talent prefix
  ['⭐ СОВЕРШЕННЫЙ', '⭐ PERFECT'],
  ['Идеальный', 'Perfect'],
  ['летие игры', 'anniversary event'],
  ['Кэмп Уайт Оук', 'Camp White Oak'],
  ['Прочее', 'Other'],
  // Brand attribute labels
  ['Боезапас', 'Ammo capacity'],
  ['Точность', 'Accuracy'],
  ['Прочность объектов навыков', 'Skill object durability'],
  ['от выстрелов в голову', 'from headshots'],
  ['от навыков', 'from skills'],
  ['Восстановление брони', 'Armor regen'],
  ['этого бренда', 'of this brand'],
  // Raid-related
  ['Толсторог', 'Bighorn'],
  ['этаж 100', 'floor 100'],
  ['Прохождение', 'Completion'],
  // meta field values (come after " · ")
  [' · Ручные пулемёты<', ' · LMGs<'],
  // meta field values (come after " · ")
  [' · Бронежилет<', ' · Chest<'],
  [' · Рюкзак<', ' · Backpack<'],
  [' · Наколенники<', ' · Kneepads<'],
  [' · Перчатки<', ' · Gloves<'],
  [' · Маска<', ' · Mask<'],
  [' · Кобура<', ' · Holster<'],
  [' · Штурмовые винтовки<', ' · Assault Rifles<'],
  [' · Пистолеты-пулемёты<', ' · SMGs<'],
  [' · Пулемёты<', ' · LMGs<'],
  [' · Снайперские винтовки<', ' · Marksman Rifles<'],
  [' · Дробовики<', ' · Shotguns<'],
  [' · Пистолеты<', ' · Pistols<'],
  [' · Винтовки<', ' · Rifles<'],
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

// Rewrite /ru/... → /en/... in all href + JSON-LD item URLs
function rewriteInternalLinks(html) {
  return html.replace(/href="\/ru\//g, 'href="/en/');
}

// Update canonical + OG URL from /ru/... to /en/...
function rewriteCanonicalToEn(html) {
  return html
    .replace(/<link rel="canonical" href="https:\/\/divcalc\.xyz\/ru\//g, '<link rel="canonical" href="https://divcalc.xyz/en/')
    .replace(/<meta property="og:url" content="https:\/\/divcalc\.xyz\/ru\//g, '<meta property="og:url" content="https://divcalc.xyz/en/')
    .replace(/"url":"https:\/\/divcalc\.xyz\/ru\//g, '"url":"https://divcalc.xyz/en/')
    .replace(/"item":"https:\/\/divcalc\.xyz\/ru\//g, '"item":"https://divcalc.xyz/en/');
}

// Inject hreflang tags into <head>
// ruPath: "/ru/exotic/foo" — full path including /ru/ prefix
function hreflangBlock(ruPath) {
  const enPath = ruPath.replace(/^\/ru\//, '/en/');
  const ru = `https://divcalc.xyz${ruPath}`;
  const en = `https://divcalc.xyz${enPath}`;
  return `<link rel="alternate" hreflang="ru" href="${ru}">
<link rel="alternate" hreflang="en" href="${en}">
<link rel="alternate" hreflang="x-default" href="${en}">`;
}

function injectHreflang(html, ruPath) {
  const block = hreflangBlock(ruPath);
  return html.replace(/<\/head>/i, block + '\n</head>');
}

// Inject language switcher: on RU page, link to EN equivalent; on EN page, link to RU equivalent
function injectLangSwitcher(html, lang, ruPath) {
  const enPath = ruPath.replace(/^\/ru\//, '/en/');
  const targetUrl = lang === 'ru' ? enPath : ruPath;
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
  const ruName = item.name_ru || item.name || '';
  const enName = item.en || item.name_en || item.name_full_en || '';

  if (ruName && enName && ruName !== enName) {
    // Hide EN subtitle on EN page (it'd be duplicate of h1 now)
    html = html.split(`class="en-name">${escape(enName)}<`).join(`class="en-name" style="display:none"><`);
    // Replace ALL occurrences of the RU name (escaped) with EN name
    // This covers: <title>, meta content, og, JSON-LD, h1, breadcrumb, synergy strong tags, etc.
    html = html.split(escape(ruName)).join(escape(enName));
    // Collapse "Name (Name)" → "Name" — появляется в <title>Name (Name) — ...</title>
    const esc = escape(enName);
    const re = new RegExp('\\b' + esc.replace(/[.*+?^${}()|[\\\\]/g, '\\\\$&') + '\\s*\\(\\s*' + esc.replace(/[.*+?^${}()|[\\\\]/g, '\\\\$&') + '\\s*\\)', 'g');
    html = html.replace(re, esc);
  }

  // Swap talent RU name → EN name (prefer explicit tal_name_en, then tal for weapons, then keep tal_ru)
  const ruTalName = item.tal_name_ru || item.tal_ru || '';
  const enTalName = item.tal_name_en || item.tal_en || item.tal || '';
  if (ruTalName && enTalName && ruTalName !== enTalName && enTalName.length > 0) {
    html = html.split(escape(ruTalName)).join(escape(enTalName));
  }

  // Swap RU talent/flavor description if EN exists
  const ruDesc = item.tal_desc_ru || item.d || item.bonus_ru || '';
  const enDesc = item.tal_desc || item.d_en || item.bonus_short_en || '';
  if (ruDesc && enDesc && ruDesc !== enDesc) {
    html = html.split(escape(ruDesc)).join(escape(enDesc));
  }

  // Hide/remove source_ru rows on EN — no EN translation exists, RU leak looks bad
  if (item.source_ru) {
    const escaped = escape(item.source_ru);
    html = html.replace(new RegExp(`\\s*<tr><td>[^<]+</td><td>${escapeRegex(escaped)}</td></tr>`, 'g'), '');
  }

  // Hide stats_ru row (attributes) — no EN equivalent in data
  if (item.stats_ru) {
    const escaped = escape(item.stats_ru);
    html = html.replace(new RegExp(`\\s*<tr><td>[^<]+</td><td>${escapeRegex(escaped)}</td></tr>`, 'g'), '');
  }
  // Hide mods_ru row
  if (item.mods_ru) {
    const escaped = escape(item.mods_ru);
    html = html.replace(new RegExp(`\\s*<tr><td>[^<]+</td><td>${escapeRegex(escaped)}</td></tr>`, 'g'), '');
  }

  // Swap related-card RU name with EN name (rc-name is RU, rc-meta starts with EN)
  // On EN page: put EN as primary title, drop RU name from meta, keep only category.
  html = html.replace(
    /<div class="rc-name">([^<]+)<\/div>\s*<div class="rc-meta">([^<]+)<\/div>/g,
    (m, ruN, metaLine) => {
      const ruTrim = ruN.trim();
      const parts = metaLine.split('·').map(s => s.trim());
      const enN = parts[0] || '';
      const rest = parts.slice(1);
      if (!enN || enN === ruTrim) return m;
      const newMeta = rest.join(' · ');
      return `<div class="rc-name">${enN}</div>\n      <div class="rc-meta">${newMeta}</div>`;
    }
  );

  // Category index: replace intro paragraph content
  html = html.replace(
    /<p class="cat-intro"[^>]*>Все предметы категории «([^»]+)» в The Division 2\. Нажми на предмет чтобы увидеть полные статы и гайд\.<\/p>/g,
    (m, titleRu) => `<p class="cat-intro" style="color:var(--muted);margin:8px 0 24px">All items in the category in The Division 2. Click an item to see full stats and guide.</p>`
  );

  // Hide peak_bonus section if present — note is RU-only, looks bad on EN page
  html = html.replace(/<section class="peak-bonus">[\s\S]*?<\/section>/g, '');

  // Final sweep: hide elements whose visible text is predominantly cyrillic.
  // These represent data fields that don't yet have EN equivalents.
  // Targets: <p>, <li>, <div>, <td> whose innerText is >=60% cyrillic and >=20 chars.
  const EN_PLACEHOLDER = '<em style="color:var(--muted);font-size:11px">Translation coming soon</em>';
  html = html.replace(/<(p|li|td)([^>]*)>([^<]{20,})<\/\1>/g, (m, tag, attrs, txt) => {
    const cyr = (txt.match(/[А-Яа-яЁё]/g) || []).length;
    const total = txt.replace(/\s/g, '').length;
    if (total > 0 && cyr / total >= 0.5) {
      return `<${tag}${attrs}>${EN_PLACEHOLDER}</${tag}>`;
    }
    return m;
  });

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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
