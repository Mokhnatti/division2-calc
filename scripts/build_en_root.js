// Generates en/index.html from root index.html with EN meta/lang swaps.
// Keeps the SAME JS/CSS (SPA auto-detects currentLang from URL prefix /en/).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let out = src
  .replace('<html lang="ru">', '<html lang="en">')
  // Title + description
  .replace(
    /<title>Division 2 Калькулятор[^<]*<\/title>/,
    '<title>Division 2 Calculator — Builds, Weapons, Talents | divcalc.xyz</title>'
  )
  .replace(
    /<meta name="description" content="Полный калькулятор Division 2[^"]*"/,
    '<meta name="description" content="Full Division 2 build calculator. 238 named weapons with stats, 86 exotics, 304 talents, 26 gear sets, 36 brands, mods, expertise, TTK on 5 difficulties."'
  )
  .replace(
    /<meta name="keywords" content="Division 2, калькулятор[^"]*"/,
    '<meta name="keywords" content="Division 2, calculator, build, weapons, talents, DPS, TTK, named items, exotics, brands, gear sets, Heroic, Legendary, mods, expertise"'
  )
  // Canonical + og:url
  .replace(/<link rel="canonical" href="https:\/\/divcalc\.xyz\/">/, '<link rel="canonical" href="https://divcalc.xyz/en/">')
  .replace(/<meta property="og:url" content="https:\/\/divcalc\.xyz\/"/, '<meta property="og:url" content="https://divcalc.xyz/en/"')
  // OG title + description
  .replace(
    /<meta property="og:title" content="divcalc\.xyz — Калькулятор Division 2 на русском"/,
    '<meta property="og:title" content="divcalc.xyz — Division 2 Build Calculator"'
  )
  .replace(
    /<meta property="og:description" content="238 именных оружий со статами[^"]*"/,
    '<meta property="og:description" content="238 named weapons with stats · 86 exotics · 26 gear sets · 36 brands · 304 talents · DPS calculator · TTK on 5 difficulties. Community build sharing."'
  )
  .replace(/<meta property="og:locale" content="ru_RU">/, '<meta property="og:locale" content="en_US">')
  .replace(/<meta property="og:locale:alternate" content="en_US">/, '<meta property="og:locale:alternate" content="ru_RU">')
  // Twitter
  .replace(
    /<meta name="twitter:title" content="divcalc\.xyz — Калькулятор Division 2 на русском"/,
    '<meta name="twitter:title" content="divcalc.xyz — Division 2 Build Calculator"'
  )
  .replace(
    /<meta name="twitter:description" content="238 именных со статами[^"]*"/,
    '<meta name="twitter:description" content="238 named with stats · 86 exotics · DPS · TTK · community builds — all in English."'
  )
  // JSON-LD @id root + name (WebApplication)
  .replace(/"@id":\s*"https:\/\/divcalc\.xyz\/#webapp"/, '"@id": "https://divcalc.xyz/en/#webapp"')
  .replace(/"name":\s*"Division 2 Калькулятор"/, '"name": "Division 2 Build Calculator"')
  // Asset paths — make absolute so they work from /en/
  .replace(/href="css\//g, 'href="/css/')
  .replace(/href="favicon/g, 'href="/favicon')
  .replace(/href="apple-touch-icon/g, 'href="/apple-touch-icon')
  .replace(/src="js\//g, 'src="/js/')
  .replace(/src="data\//g, 'src="/data/');

// Translate visible UI strings (nav, buttons, section headings, labels)
// Comprehensive dict — pulled from static HTML by frequency/impact.
const UI = [
  // Top frequency
  ['>— нет —<', '>— none —<'],
  ['>— пусто —<', '>— empty —<'],
  ['>— не выбран —<', '>— not selected —<'],
  ['>— выбери оружие —<', '>— pick a weapon —<'],
  ['>— пересечения<', '>— intersections<'],
  ['>— любое<', '>— any<'],
  ['>авто<', '>auto<'],
  ['>ИЛИ<', '>OR<'],
  ['>макс 10<', '>max 10<'],
  ['>макс 20<', '>max 20<'],
  ['>макс 30<', '>max 30<'],
  ['>шт<', '>pcs<'],
  ['>сек<', '>sec<'],
  ['>Стат<', '>Stat<'],
  ['>Вес<', '>Weight<'],
  ['>Патроны<', '>Rounds<'],
  // Nav/header
  ['🐛 Баг-репорт', '🐛 Bug report'],
  ['👤 Войти', '👤 Log in'],
  ['📦 Мои билды', '📦 My builds'],
  ['🚪 Выйти', '🚪 Log out'],
  ['🏆 Сообщество', '🏆 Community'],
  ['🏆 Топ', '🏆 Top'],
  ['⚡ Скиллы', '⚡ Skills'],
  ['🛡 Танк', '🛡 Tank'],
  ['🔧 Моды', '🔧 Mods'],
  ['🛠 Скиллы/гир', '🛠 Skill gear'],
  ['⭐ Экспертиза', '⭐ Expertise'],
  ['📐 Формулы', '📐 Formulas'],
  ['❓ Справка', '❓ Help'],
  ['⚡ Итог билда', '⚡ Build total'],
  // Slot names
  ['>Маска<', '>Mask<'],
  ['>Нагрудник<', '>Chest<'],
  ['>Рюкзак<', '>Backpack<'],
  ['>Перчатки<', '>Gloves<'],
  ['>Кобура<', '>Holster<'],
  ['>Наколенники<', '>Kneepads<'],
  ['>Оружие<', '>Weapon<'],
  // Group size / player count
  ['>1 — соло<', '>1 — solo<'],
  ['>2 игрока<', '>2 players<'],
  ['>3 игрока<', '>3 players<'],
  ['>4 игрока<', '>4 players<'],
  // Counter badges
  ['>Сеты 26<', '>Sets 26<'],
  ['>Бренды 36<', '>Brands 36<'],
  ['>Экзотики ~70<', '>Exotics ~70<'],
  ['>Именные ~96<', '>Named ~96<'],
  // Weapon stats
  ['>Базовый урон пули<', '>Base bullet damage<'],
  ['>RPM (скорострельность)<', '>RPM (rate of fire)<'],
  ['>Размер магазина<', '>Magazine size<'],
  ['>Время перезарядки<', '>Reload time<'],
  ['>Урон оружием (один бакет, складываются)<', '>Weapon damage (single bucket, additive)<'],
  ['>Общий урон оружием (<', '>Total weapon damage (<'],
  ['>Урон типа оружия (ШВ/ПП/LMG..)<', '>Weapon type damage (AR/SMG/LMG..)<'],
  ['>= итого множитель<', '>= total multiplier<'],
  ['>Критический удар<', '>Critical hit<'],
  ['>Шанс крита (<', '>Crit chance (<'],
  ['>Урон крита (<', '>Crit damage (<'],
  ['>Средний множитель крита<', '>Average crit multiplier<'],
  ['>Шанс крит. попадания<', '>Crit chance<'],
  ['>Урон крит. попадания<', '>Crit damage<'],
  ['>Урон в голову<', '>Headshot damage<'],
  ['>Эргономика<', '>Ergonomics<'],
  ['>Точность<', '>Accuracy<'],
  ['>Управление оружием<', '>Weapon handling<'],
  // Section headings
  ['>ОРУЖИЕ — выбор из базы<', '>WEAPON — pick from database<'],
  ['>ОРУЖИЕ<', '>WEAPON<'],
  ['>Оружие<', '>Weapon<'],
  ['>СНАРЯЖЕНИЕ — 6 СЛОТОВ<', '>GEAR — 6 SLOTS<'],
  ['>БОНУСЫ СЕТОВ / БРЕНДОВ / ИМЕННЫХ<', '>SET / BRAND / NAMED BONUSES<'],
  ['>СТАТЫ ГИРА (РУЧНОЙ ВВОД)<', '>GEAR STATS (MANUAL INPUT)<'],
  ['>ТАНКОВАНИЕ / БРОНЯ<', '>TANK / ARMOR<'],
  ['>СКИЛЛ-БИЛДЫ<', '>SKILL BUILDS<'],
  ['>ЭКСПЕРТИЗА<', '>EXPERTISE<'],
  ['>ФОРМУЛЫ<', '>FORMULAS<'],
  ['>МОДЫ ОРУЖИЯ<', '>WEAPON MODS<'],
  ['>МОДЫ НАВЫКОВ<', '>SKILL MODS<'],
  ['>ТАЛАНТЫ НАГРУДНИКА И РЮКЗАКА<', '>CHEST AND BACKPACK TALENTS<'],
  ['>Талант нагрудника<', '>Chest talent<'],
  ['>Талант рюкзака<', '>Backpack talent<'],
  ['>Талант оружия:<', '>Weapon talent:<'],
  // Target / faction
  ['>Любая<', '>Any<'],
  ['>Охотники<', '>Hunters<'],
  ['>Чистильщики<', '>Cleaners<'],
  ['>Изгои<', '>Outcasts<'],
  ['>Чёрный клык<', '>Black Tusk<'],
  ['>Истинные сыны<', '>True Sons<'],
  ['>Тип цели (фракция)<', '>Target type (faction)<'],
  ['>Состав группы<', '>Group composition<'],
  ['>Цель под негативным эффектом<', '>Target under negative status<'],
  ['>Активировать «цель со статусом»<', '>Activate "target with status"<'],
  ['>Игроков в группе:<', '>Players in group:<'],
  // Status types
  ['>Любой эффект<', '>Any effect<'],
  ['>Горение<', '>Burn<'],
  ['>Кровотечение<', '>Bleed<'],
  ['>Шок<', '>Shock<'],
  ['>Ослепление<', '>Blind<'],
  ['>Отравление<', '>Poison<'],
  ['>Дезориентация<', '>Disrupt<'],
  ['>Растерянность<', '>Confuse<'],
  ['>Отмечен<', '>Marked<'],
  ['>Прилипание<', '>Ensnare<'],
  ['>Импульс<', '>Pulse<'],
  // Auto-sum area
  ['>Автосумма →<', '>Auto-sum →<'],
  ['>Ручной ввод →<', '>Manual input →<'],
  ['>Автосумма<', '>Auto-sum<'],
  ['>Ручной ввод<', '>Manual input<'],
  // Buttons
  ['>Сохранить билд<', '>Save build<'],
  ['>Загрузить билд<', '>Load build<'],
  ['>Поделиться<', '>Share<'],
  ['>Опубликовать<', '>Publish<'],
  ['>Сохранить<', '>Save<'],
  ['>Применить<', '>Apply<'],
  ['>Отмена<', '>Cancel<'],
  ['>Закрыть<', '>Close<'],
  ['>Очистить<', '>Clear<'],
  ['>Сбросить<', '>Reset<'],
  // Descriptions
  ['>пустые поля игнорируются<', '>empty fields are ignored<'],
  ['>Поиск по имени / авт<', '>Search by name / author<'],
  // TTK / Difficulty
  ['>Время до убийства (TTK)<', '>Time to kill (TTK)<'],
  ['>Сложность:<', '>Difficulty:<'],
  ['>Цель:<', '>Target:<'],
  ['>Нормальный<', '>Normal<'],
  ['>Сложный<', '>Hard<'],
  ['>Экстремальный<', '>Challenging<'],
  ['>Героический<', '>Heroic<'],
  ['>Легендарный<', '>Legendary<'],
  ['>Рядовой<', '>Soldier<'],
  ['>Элитный<', '>Elite<'],
  ['>Босс<', '>Boss<'],
  ['>Именной<', '>Named<'],
  // Weapon categories
  ['>Все типы<', '>All types<'],
  ['>Базовые<', '>Base<'],
  ['>Именные<', '>Named<'],
  ['>Экзотики<', '>Exotics<'],
  ['>Штурмовые винтовки<', '>Assault Rifles<'],
  ['>Пистолеты-пулемёты<', '>SMGs<'],
  ['>Пулемёты<', '>LMGs<'],
  ['>Ручные пулемёты<', '>LMGs<'],
  ['>Снайперские винтовки<', '>Marksman Rifles<'],
  ['>Винтовки<', '>Rifles<'],
  ['>Дробовики<', '>Shotguns<'],
  ['>Пистолеты<', '>Pistols<'],
  // Tooltip titles (common RU attribute values)
  ['title="Переключить на русский"', 'title="Switch to Russian"'],
  ['title="Switch language / Переключить язык"', 'title="Switch language"'],
  ['title="Сообщить об ошибке в данных или математике"', 'title="Report a bug in data or math"'],
  ['title="Открыть полный список с описанием"', 'title="Open full list with description"'],
  ['title="Поделиться билдом"', 'title="Share build"'],
  ['title="Опубликовать билд в сообщество"', 'title="Publish build to community"'],
  // Labels used in tooltip popovers (quick)
  ['>Стаки<', '>Stacks<'],
  ['>Момент<', '>Moment<'],
  ['>Множитель<', '>Multiplier<'],
  ['>Урон<', '>Damage<'],
  ['>Броня<', '>Armor<'],
  ['>Здоровье<', '>Health<'],
  ['>Магазин<', '>Magazine<'],
  ['>Перезарядка<', '>Reload<'],
  ['>Навыки<', '>Skills<'],
  ['>Поиск<', '>Search<'],
  ['>Загрузить<', '>Load<'],
  // Modal titles
  ['>Выбор предмета<', '>Choose item<'],
  ['>Выбор оружия<', '>Choose weapon<'],
  ['>Выбор таланта<', '>Choose talent<'],
  ['>Выбор таланта оружия<', '>Choose weapon talent<'],
  ['>Сообщить о баге<', '>Report a bug<'],
  ['>Вход<', '>Log in<'],
  ['>Регистрация<', '>Sign up<'],
  ['>Главная<', '>Home<'],
  ['>Калькулятор<', '>Calculator<'],
  ['>Сообщество<', '>Community<'],
  ['>Скиллы<', '>Skills<'],
  ['>Танк<', '>Tank<'],
  ['>Экспертиза<', '>Expertise<'],
  ['>Формулы<', '>Formulas<'],
  ['>Моды<', '>Mods<'],
  ['>Справка<', '>Help<'],
  // Tabs
  ['>Все<', '>All<'],
  ['>Сеты<', '>Sets<'],
  ['>Бренды<', '>Brands<'],
  // Placeholders
  ['placeholder="Поиск..."', 'placeholder="Search..."'],
  ['placeholder="Поиск — имя, бренд, талант..."', 'placeholder="Search — name, brand, talent..."'],
  ['placeholder="+ второе слово"', 'placeholder="+ second word"'],
  ['placeholder="Поиск — имя, бонус..."', 'placeholder="Search — name, bonus..."'],
  ['placeholder="авто"', 'placeholder="auto"'],
  ['placeholder="Поиск по имени / авт"', 'placeholder="Search by name / author"'],
  // Legacy keys kept at bottom in case we hit duplicates
  ['>🐛 Баг-репорт<', '>🐛 Bug report<'],
  ['>Войти<', '>Log in<'],
  ['>Мои билды<', '>My builds<'],
  ['>Выйти<', '>Log out<'],
  ['>Скиллы/гир<', '>Skills/gear<'],
  // Core stats
  ['>Шанс крит. удара<', '>Crit Chance<'],
  ['>Урон крит. удара<', '>Crit Damage<'],
  ['>Урон оружия<', '>Weapon Damage<'],
  ['>Скорострельность<', '>Rate of Fire<'],
  ['>Урон вне укрытия<', '>Damage out of cover<'],
  ['>Урон по броне<', '>Damage to Armor<'],
  ['>Урон по здоровью<', '>Damage to Health<'],
  // Bug report form labels
  ['>Что сломано?<', '>What\'s broken?<'],
  ['>URL страницы<', '>Page URL<'],
  ['>Описание<', '>Description<'],
  // Original — keep as fallback (these were in previous dict)
  ['placeholder="авто"', 'placeholder="auto"'],
];

for (const [ru, en] of UI) {
  out = out.split(ru).join(en);
}

// Apply full ui_translations.json dictionary used by SPA runtime — for visible text nodes + placeholders/titles
try {
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ui_translations.json'), 'utf8'));
  const dict = tr.ru_to_en || tr;
  // Sort by length desc so longer matches replace first (avoid partial overlaps)
  const entries = Object.entries(dict).filter(([k, v]) => k && v && !k.startsWith('_')).sort((a, b) => b[0].length - a[0].length);

  // 1) Replace text between tags: >RU<  →  >EN<
  //    Handle potential whitespace: >\s*RU\s*<
  for (const [ru, en] of entries) {
    if (ru.length < 2 || ru.length > 200) continue;
    // Escape regex special chars in RU
    const esc = ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('>\\s*' + esc + '\\s*<', 'g');
    out = out.replace(re, '>' + en + '<');
  }

  // 2) Replace common attribute values (title, placeholder, aria-label, alt)
  //    Use plain string replacement (split/join) — avoids regex escape pitfalls
  for (const [ru, en] of entries) {
    if (ru.length < 2 || ru.length > 300) continue;
    const enEsc = en.replace(/"/g, '&quot;');
    for (const attr of ['title', 'placeholder', 'aria-label', 'alt']) {
      const needle = `${attr}="${ru}"`;
      const replace = `${attr}="${enEsc}"`;
      if (out.includes(needle)) out = out.split(needle).join(replace);
    }
  }
} catch (e) {
  console.warn('ui_translations apply skipped:', e.message);
}

// Strip FAQPage JSON-LD block (it's fully Russian — EN equivalent would need full rewrite)
// Google can still use other schema blocks (WebApplication, Organization)
out = out.replace(/<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"FAQPage"[\s\S]*?<\/script>/g, '');

// Clean up noscript/comment/data-ru leftover RU (safe because SPA re-renders)
out = out
  .replace(/<!-- Webmaster verification placeholders — заменить на реальные коды после регистрации -->/g,
           '<!-- Webmaster verification placeholders — replace with real codes after registration -->')
  .replace(/<!-- Множители наглядно -->/g, '<!-- Multipliers visualized -->')
  .replace(/value="Division 2 Calc — баг-репорт"/g, 'value="Division 2 Calc — bug report"');

// Язык-переключатель JS обновляет при загрузке

fs.writeFileSync(path.join(ROOT, 'en', 'index.html'), out);
console.log('✓ Wrote en/index.html');
