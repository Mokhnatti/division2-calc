#!/usr/bin/env node
// Static page generator for divcalc.xyz
// Generates: /exotic/, /named/, /set/, /brand/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── Transliteration ───────────────────────────────────────────────────────

const TRANSLIT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
  'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
  'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu',
  'я':'ya',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh',
  'З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O',
  'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts',
  'Ч':'Ch','Ш':'Sh','Щ':'Shch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu',
  'Я':'Ya',
};

function slugify(str) {
  if (!str) return '';
  // Use English name if available (passed separately), otherwise transliterate
  return str
    .split('').map(c => TRANSLIT[c] !== undefined ? TRANSLIT[c] : c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugifyEn(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// prefer English slug when available
function makeSlug(nameRu, nameEn) {
  if (nameEn) return slugifyEn(nameEn);
  return slugify(nameRu);
}

// ─── HTML helpers ──────────────────────────────────────────────────────────

const GA_CODE = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-DC8DWMXX3Z"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-DC8DWMXX3Z');</script>`;

const YM_CODE = `<script type="text/javascript">(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(108598463,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});</script>`;

function nav() {
  return `<nav class="site-nav">
  <a class="logo" href="/">divcalc.xyz</a>
  <div class="nav-links">
    <a href="/exotic/">Экзотики</a>
    <a href="/named/">Именные</a>
    <a href="/set/">Комплекты</a>
    <a href="/brand/">Бренды</a>
  </div>
  <a class="calc-btn" href="/">🔢 Калькулятор</a>
</nav>`;
}

function footer() {
  return `<footer>
  <p><a href="/">divcalc.xyz</a> — калькулятор DPS для Tom Clancy's The Division 2 · <a href="/exotic/">Экзотики</a> · <a href="/set/">Комплекты</a> · <a href="/named/">Именные</a></p>
  <p style="margin-top:6px">Данные актуальны для Title Update 21 (Year 9)</p>
</footer>`;
}

function adSlot(cls) {
  return `<div class="ad-slot ${cls}"></div>`;
}

function escape(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Load sources_compact.json + known_sources.json once for item source lookups
let _SOURCES_CACHE = null;
let _KNOWN_CACHE = null;
function loadSources() {
  if (_SOURCES_CACHE) return _SOURCES_CACHE;
  const p = path.join(ROOT, 'data/sources_compact.json');
  try { _SOURCES_CACHE = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch(e) { _SOURCES_CACHE = {}; }
  return _SOURCES_CACHE;
}
function loadKnownSources() {
  if (_KNOWN_CACHE) return _KNOWN_CACHE;
  const p = path.join(ROOT, 'data/known_sources.json');
  try { _KNOWN_CACHE = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch(e) { _KNOWN_CACHE = []; }
  return _KNOWN_CACHE;
}

// Render "Where to get" HTML block for item page (RU) — v4 sources with direct/tag
function renderSourcesHtml(nameEn) {
  if (!nameEn) return '';
  const key = String(nameEn).toLowerCase().trim();
  const sources = loadSources();
  const known = loadKnownSources();
  const knownMatches = known.filter(k => (k.name_en||'').toLowerCase() === key);
  const knownSources = knownMatches.map(k => ({
    type: k.source_type || 'other',
    name_en: k.source_name_en || '',
    name_ru: k.source_name_ru || '',
    match: 'direct',
    is_curated: true,
    details: k.details || ''
  }));
  const autoData = sources[key];
  const autoSources = (autoData && autoData.sources) ? autoData.sources : [];
  if (!knownSources.length && !autoSources.length) {
    return `<section class="sources" style="margin-top:14px">
      <h2>📍 Где добыть</h2>
      <p style="color:var(--muted);font-size:13px">🌍 Общий мировой дроп (любой пул оружия / контейнер)</p>
    </section>`;
  }
  // Merge: known first (priority), then auto minus duplicates
  const mergedSources = [...knownSources, ...autoSources.filter(a => !knownSources.some(k => k.type === a.type && (k.name_en||'').toLowerCase() === (a.name_en||'').toLowerCase()))];
  const data = { sources: mergedSources };
  const typeLbl = {raid:'Рейд',mission:'Миссия',darkzone:'Тёмная зона',dz_landmark:'Точка DZ',bounty:'Контракт',named_drop:'Именной NPC',named_npc:'Именной NPC',named_boss:'Именной босс',manhunt:'Охота',dungeon:'Подземелье',project:'Проект',vendor:'Торговец',vendor_craft:'Крафт-торговец',chest:'Контейнер',exotic_cache:'Экзотик-тайник',world_drop:'Мировой дроп',incursion:'Вторжение',global_event:'Глобальное событие',event:'Ивент',event_cache:'Ивентовый тайник',season_reward:'Награда сезона',battlepass:'Боевой пропуск',descent:'Спуск',summit:'Саммит',countdown:'Обратный отсчёт',odd:'Прочее',other:'Другое'};
  const iconMap = {raid:'👥',mission:'🎯',darkzone:'⚠',dz_landmark:'⚠',bounty:'💀',named_drop:'🎖',named_npc:'🎖',named_boss:'🎖',manhunt:'🔫',dungeon:'🗡',project:'📋',vendor:'💰',vendor_craft:'🛠',chest:'📦',exotic_cache:'🎁',world_drop:'🌍',incursion:'⚡',global_event:'🎉',event:'🎉',event_cache:'🎁',season_reward:'🏆',battlepass:'🎖',descent:'🏗',summit:'🏢',countdown:'⏱',odd:'✨',other:'✨'};

  function makeSection(arr, title) {
    if (!arr.length) return '';
    const byType = {};
    for (const s of arr) {
      const t = s.type || 'other';
      (byType[t] = byType[t] || []).push(s);
    }
    const rows = Object.entries(byType).map(([t, xs]) => {
      const icon = iconMap[t] || '•';
      const lbl = typeLbl[t] || t;
      const names = [...new Set(xs.map(s => s.name_ru || s.name_en || ''))].filter(x => x && !x.toLowerCase().startsWith('lt'));
      const namesStr = names.length ? names.slice(0, 5).map(escape).join(', ') : lbl;
      const details = [...new Set(xs.filter(s => s.is_curated && s.details).map(s => s.details))];
      const detailsHtml = details.length ? `<div style="font-size:11px;color:var(--muted);font-style:italic;margin-top:3px">${details.map(escape).join(' · ')}</div>` : '';
      return `<tr><td style="padding:6px;border-bottom:1px solid var(--border)"><b>${icon} ${lbl}</b></td><td style="padding:6px;border-bottom:1px solid var(--border)">${namesStr}${detailsHtml}</td></tr>`;
    }).join('');
    return `<h3 style="font-size:14px;margin-top:12px;margin-bottom:6px">${title}</h3>
      <table class="stats-table"><tbody>${rows}</tbody></table>`;
  }

  const direct = data.sources.filter(s => s.match === 'direct');
  const tag = data.sources.filter(s => s.match !== 'direct');
  return `<section class="sources" style="margin-top:14px">
    <h2>📍 Где добыть</h2>
    ${makeSection(direct, '✓ Подтверждённые источники')}
    ${makeSection(tag, direct.length ? 'Возможно также' : 'Источники')}
  </section>`;
}

// BreadcrumbList JSON-LD (Schema.org) — crumbs: [{name, url}, ...]
function breadcrumbJsonLd(crumbs) {
  const items = crumbs.map((c, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": c.name,
    "item": c.url
  }));
  return `<script type="application/ld+json">
${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":items})}
</script>`;
}

// ─── Exotic Weapons ────────────────────────────────────────────────────────

function generateExoticWeapon(key, item, allExotics) {
  const slug = makeSlug(item.name_ru, item.en);
  const nameRu = item.name_ru || key;
  const nameEn = item.en || key;
  const cat = item.cat || '';
  const dmg = item.dmg ? item.dmg.toLocaleString('ru-RU') : '—';
  const rpm = item.rpm || '—';
  const mag = item.mag || '—';
  const reload = item.reload || '—';
  const talNameRu = item.tal_name_ru || item.tal || '';
  const talDescRu = item.tal_desc_ru || item.tal_desc || '';

  const peakBlock = item.peak_bonus ? `
  <section class="peak-bonus">
    <h2>Пиковые характеристики</h2>
    <div class="talent-block" style="border-left-color:#58a6ff">
      <h3>Максимальный урон (со стаками/условием)</h3>
      <p>${escape(item.peak_bonus.note || '')}</p>
    </div>
  </section>` : '';

  // Related: 4 other exotic weapons (different from current)
  const otherKeys = Object.keys(allExotics).filter(k => k !== key).slice(0, 4);
  const relatedCards = otherKeys.map(k => {
    const o = allExotics[k];
    const s = makeSlug(o.name_ru, o.en);
    return `<a class="related-card" href="/exotic/${s}">
        <div class="rc-name">${escape(o.name_ru || k)}</div>
        <div class="rc-meta">${escape(o.en || '')} · ${escape(o.cat || '')}</div>
      </a>`;
  }).join('\n      ');

  const title = `${escape(nameRu)} (${escape(nameEn)}) — Division 2 экзотик ${escape(cat)} | divcalc.xyz`;
  const desc = `${escape(nameRu)} (${escape(nameEn)}) — экзотическое оружие Division 2. Урон ${dmg}, скорострельность ${rpm} RPM, магазин ${mag}. Талант: ${escape(talNameRu)}. Статы, гайд, лучшие билды.`;
  const canonical = `https://divcalc.xyz/exotic/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameRu)} — Division 2 экзотик">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${escape(nameRu)}","alternateName":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Экзотики',url:'https://divcalc.xyz/exotic/'},
  {name:nameRu,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/exotic/">Экзотики</a> <span>›</span>
  ${escape(nameRu)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameRu)}</h1>
      <div class="en-name">${escape(nameEn)}</div>
      <div class="badges">
        <span class="badge badge-exotic">Экзотик</span>
        <span class="badge badge-cat">${escape(cat)}</span>
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Характеристики</h2>
    <table class="stats-table">
      <tr><td>Урон (базовый)</td><td>${dmg}</td></tr>
      <tr><td>Скорострельность</td><td>${rpm} RPM</td></tr>
      <tr><td>Магазин</td><td>${mag} патронов</td></tr>
      <tr><td>Перезарядка</td><td>${reload} сек</td></tr>
      <tr><td>Тип оружия</td><td>${escape(cat)}</td></tr>
      ${item.source_ru ? `<tr><td>Где добыть</td><td>${escape(item.source_ru)}</td></tr>` : ''}
    </table>
  </section>

  <section class="talent">
    <h2>Талант: ${escape(talNameRu)}</h2>
    <div class="talent-block">
      <h3>${escape(talNameRu)} (${escape(item.tal || '')})</h3>
      <p>${escape(talDescRu)}</p>
    </div>
  </section>

  ${peakBlock}

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии</h2>
    <p>Подбери оптимальный билд для <strong>${escape(nameRu)}</strong> с помощью <a href="/">калькулятора DPS divcalc.xyz</a>. Проверь синергии с <a href="/set/">комплектами снаряжения</a> и <a href="/named/">именным оружием</a>.</p>
  </section>

  <section class="related">
    <h2>Другие экзотики</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Exotic Gear ────────────────────────────────────────────────────────────

function generateExoticGear(idx, item, allItems) {
  const slug = makeSlug(item.name, item.en);
  const nameRu = item.name || '';
  const nameEn = item.en || '';
  const gearType = item.g || item.t || '';
  const talNameRu = item.tal_ru || item.tal || '';
  const talDescRu = item.d || '';

  const otherItems = allItems.filter((_, i) => i !== idx).slice(0, 4);
  const relatedCards = otherItems.map(o => {
    const s = makeSlug(o.name, o.en);
    return `<a class="related-card" href="/exotic/${s}">
        <div class="rc-name">${escape(o.name || '')}</div>
        <div class="rc-meta">${escape(o.en || '')} · ${escape(o.g || '')}</div>
      </a>`;
  }).join('\n      ');

  const title = `${escape(nameRu)} (${escape(nameEn)}) — Division 2 экзотик | divcalc.xyz`;
  const desc = `${escape(nameRu)} (${escape(nameEn)}) — экзотическое снаряжение Division 2. Тип: ${escape(gearType)}. Талант: ${escape(talNameRu)}. Статы, гайд, лучшие билды.`;
  const canonical = `https://divcalc.xyz/exotic/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameRu)} — Division 2 экзотик">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${escape(nameRu)}","alternateName":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Экзотики',url:'https://divcalc.xyz/exotic/'},
  {name:nameRu,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/exotic/">Экзотики</a> <span>›</span>
  ${escape(nameRu)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameRu)}</h1>
      <div class="en-name">${escape(nameEn)}</div>
      <div class="badges">
        <span class="badge badge-exotic">Экзотик</span>
        <span class="badge badge-cat">${escape(gearType)}</span>
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Характеристики</h2>
    <table class="stats-table">
      <tr><td>Тип снаряжения</td><td>${escape(gearType)}</td></tr>
      ${item.stats_ru ? `<tr><td>Атрибуты</td><td>${escape(item.stats_ru)}</td></tr>` : ''}
      ${item.source_ru ? `<tr><td>Источник получения</td><td>${escape(item.source_ru)}</td></tr>` : ''}
    </table>
  </section>

  <section class="talent">
    <h2>Талант: ${escape(talNameRu)}</h2>
    <div class="talent-block">
      <h3>${escape(talNameRu)}</h3>
      <p>${escape(talDescRu)}</p>
    </div>
  </section>

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии</h2>
    <p>Подбери оптимальный билд с <strong>${escape(nameRu)}</strong> в <a href="/">калькуляторе DPS divcalc.xyz</a>. Смотри также <a href="/set/">комплекты снаряжения</a>.</p>
  </section>

  <section class="related">
    <h2>Другие экзотики</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Named Weapon ──────────────────────────────────────────────────────────

function generateNamed(idx, item, allItems) {
  const slug = makeSlug(item.name, item.en);
  const nameRu = item.name || '';
  const nameEn = item.en || '';
  const gType = item.g || '';
  const tType = item.t || '';
  const brand = item.brand || '';
  const talNameRu = item.tal_ru || item.tal || '';
  const talDescRu = item.d || '';
  const dmg = item.dmg ? item.dmg.toLocaleString('ru-RU') : null;
  const rpm = item.rpm || null;
  const mag = item.mag || null;
  const reload = item.reload || null;

  const statsRows = [
    dmg ? `<tr><td>Урон (базовый)</td><td>${dmg}</td></tr>` : '',
    rpm ? `<tr><td>Скорострельность</td><td>${rpm} RPM</td></tr>` : '',
    mag ? `<tr><td>Магазин</td><td>${mag} патронов</td></tr>` : '',
    reload ? `<tr><td>Перезарядка</td><td>${reload} сек</td></tr>` : '',
    gType ? `<tr><td>Тип</td><td>${escape(tType || gType)}</td></tr>` : '',
    brand ? `<tr><td>Бренд</td><td><a href="/brand/${slugifyEn(brand)}">${escape(brand)}</a></td></tr>` : '',
    item.source_ru ? `<tr><td>Источник</td><td>${escape(item.source_ru)}</td></tr>` : '',
  ].filter(Boolean).join('\n      ');

  const otherItems = allItems.filter((_, i) => i !== idx && i < idx + 10).slice(0, 4);
  const relatedCards = otherItems.map(o => {
    const s = makeSlug(o.name, o.en);
    return `<a class="related-card" href="/named/${s}">
        <div class="rc-name">${escape(o.name || '')}</div>
        <div class="rc-meta">${escape(o.en || '')} · ${escape(o.g || '')}</div>
      </a>`;
  }).join('\n      ');

  const title = `${escape(nameRu)} (${escape(nameEn)}) — Division 2 именное оружие | divcalc.xyz`;
  const desc = `${escape(nameRu)} (${escape(nameEn)}) — именное оружие Division 2. Тип: ${escape(gType)}${dmg ? `, урон ${dmg}` : ''}. Талант: ${escape(talNameRu)}. Статы и лучшие билды.`;
  const canonical = `https://divcalc.xyz/named/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameRu)} — Division 2">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${escape(nameRu)}","alternateName":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Именные',url:'https://divcalc.xyz/named/'},
  {name:nameRu,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/named/">Именные</a> <span>›</span>
  ${escape(nameRu)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameRu)}</h1>
      <div class="en-name">${escape(nameEn)}</div>
      <div class="badges">
        <span class="badge badge-named">Именное</span>
        <span class="badge badge-cat">${escape(gType)}</span>
        ${brand ? `<span class="badge badge-brand">${escape(brand)}</span>` : ''}
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Характеристики</h2>
    <table class="stats-table">
      ${statsRows}
    </table>
  </section>

  ${talNameRu ? `<section class="talent">
    <h2>Талант: ${escape(talNameRu)}</h2>
    <div class="talent-block">
      <h3>${escape(talNameRu)}</h3>
      <p>${escape(talDescRu)}</p>
    </div>
  </section>` : ''}

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии</h2>
    <p>Рассчитай DPS билда с <strong>${escape(nameRu)}</strong> в <a href="/">калькуляторе divcalc.xyz</a>. Проверь совместимость с <a href="/set/">комплектами</a> и <a href="/brand/">брендами</a>.</p>
  </section>

  <section class="related">
    <h2>Похожие именные</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Named Gear ─────────────────────────────────────────────────────────────

function generateNamedGear(idx, item, allItems) {
  const slug = makeSlug(item.name, item.en);
  const nameRu = item.name || '';
  const nameEn = item.en || '';
  const gType = item.g || item.t || '';
  const brand = item.brand || '';

  const statsRows = [
    gType ? `<tr><td>Тип снаряжения</td><td>${escape(gType)}</td></tr>` : '',
    brand ? `<tr><td>Бренд</td><td><a href="/brand/${slugifyEn(brand)}">${escape(brand)}</a></td></tr>` : '',
    item.bonus_ru ? `<tr><td>Бонус</td><td>${escape(item.bonus_ru)}</td></tr>` : '',
    item.source_ru ? `<tr><td>Источник</td><td>${escape(item.source_ru)}</td></tr>` : '',
  ].filter(Boolean).join('\n      ');

  const otherItems = allItems.filter((_, i) => i !== idx).slice(0, 4);
  const relatedCards = otherItems.map(o => {
    const s = makeSlug(o.name, o.en);
    return `<a class="related-card" href="/named/${s}">
        <div class="rc-name">${escape(o.name || '')}</div>
        <div class="rc-meta">${escape(o.en || '')} · ${escape(o.g || '')}</div>
      </a>`;
  }).join('\n      ');

  const title = `${escape(nameRu)} (${escape(nameEn)}) — Division 2 именное снаряжение | divcalc.xyz`;
  const desc = `${escape(nameRu)} (${escape(nameEn)}) — именное снаряжение Division 2. Тип: ${escape(gType)}${brand ? `, бренд ${escape(brand)}` : ''}. Бонусы, статы и билды.`;
  const canonical = `https://divcalc.xyz/named/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameRu)} — Division 2">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${escape(nameRu)}","alternateName":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Именные',url:'https://divcalc.xyz/named/'},
  {name:nameRu,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/named/">Именные</a> <span>›</span>
  ${escape(nameRu)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameRu)}</h1>
      <div class="en-name">${escape(nameEn)}</div>
      <div class="badges">
        <span class="badge badge-named">Именное</span>
        <span class="badge badge-cat">${escape(gType)}</span>
        ${brand ? `<span class="badge badge-brand">${escape(brand)}</span>` : ''}
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Характеристики</h2>
    <table class="stats-table">
      ${statsRows}
    </table>
  </section>

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии</h2>
    <p>Рассчитай DPS билда с <strong>${escape(nameRu)}</strong> в <a href="/">калькуляторе divcalc.xyz</a>. Смотри также <a href="/brand/${slugifyEn(brand || '')}">другие предметы бренда ${escape(brand)}</a>.</p>
  </section>

  <section class="related">
    <h2>Похожие именные</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Gear Set ──────────────────────────────────────────────────────────────

function generateSet(key, item, allSets) {
  const slug = makeSlug(item.name, item.en);
  const nameRu = item.name || key;
  const nameEn = item.en || key;
  const bonuses = item.bonuses || [];
  const setType = item.type || '';

  const bonusRows = bonuses.map(b => `<tr><td>${escape(b)}</td></tr>`).join('\n      ');

  const chestBlock = item.chest_ru ? `
  <section class="talent">
    <h2>Талант нагрудника</h2>
    <div class="talent-block">
      <h3>${escape(item.chest || '')}</h3>
      <p>${escape(item.chest_ru)}</p>
    </div>
  </section>` : '';

  const bpBlock = item.bp_ru ? `
  <section class="talent">
    <h2>Талант рюкзака</h2>
    <div class="talent-block">
      <h3>${escape(item.bp || '')}</h3>
      <p>${escape(item.bp_ru)}</p>
    </div>
  </section>` : '';

  const otherKeys = Object.keys(allSets).filter(k => k !== key).slice(0, 4);
  const relatedCards = otherKeys.map(k => {
    const o = allSets[k];
    const s = makeSlug(o.name, o.en);
    return `<a class="related-card" href="/set/${s}">
        <div class="rc-name">${escape(o.name || k)}</div>
        <div class="rc-meta">${escape(o.en || '')}</div>
      </a>`;
  }).join('\n      ');

  const aliases = item.aliases_ru ? item.aliases_ru.join(', ') : '';
  const title = `${escape(nameRu)} (${escape(nameEn)}) — Division 2 комплект снаряжения | divcalc.xyz`;
  const desc = `${escape(nameRu)} (${escape(nameEn)}) — комплект снаряжения Division 2. Бонусы: ${bonuses.slice(0,2).map(b => escape(b)).join('; ')}. Таланты, синергии, лучшие билды.`;
  const canonical = `https://divcalc.xyz/set/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameRu)} — Division 2 комплект">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"${escape(nameRu)}","alternateName":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Комплекты',url:'https://divcalc.xyz/set/'},
  {name:nameRu,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/set/">Комплекты</a> <span>›</span>
  ${escape(nameRu)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameRu)}</h1>
      <div class="en-name">${escape(nameEn)}</div>
      <div class="badges">
        <span class="badge badge-set">Комплект</span>
        ${setType === 'red' ? '<span class="badge badge-cat">Урон</span>' : setType === 'blue' ? '<span class="badge badge-cat">Броня</span>' : setType === 'yellow' ? '<span class="badge badge-cat">Навыки</span>' : ''}
        ${aliases ? `<span class="badge badge-cat" style="font-size:11px">${escape(aliases)}</span>` : ''}
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Бонусы комплекта</h2>
    <table class="stats-table">
      ${bonusRows}
      ${item.main_ru ? `<tr><td>Главный атрибут</td><td>${escape(item.main_ru)}</td></tr>` : ''}
      ${item.source_ru ? `<tr><td>Источник получения</td><td>${escape(item.source_ru)}</td></tr>` : ''}
    </table>
  </section>

  ${chestBlock}
  ${bpBlock}

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии и рекомендуемые билды</h2>
    <p>Рассчитай DPS и подбери снаряжение для комплекта <strong>${escape(nameRu)}</strong> в <a href="/">калькуляторе divcalc.xyz</a>. Проверь совместимость с <a href="/exotic/">экзотическим оружием</a>.</p>
  </section>

  <section class="related">
    <h2>Другие комплекты</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Brand ─────────────────────────────────────────────────────────────────

function generateBrand(idx, key, item, allBrands) {
  const slug = slugifyEn(key);
  const nameEn = item.name_full_en || key;
  const bonuses = item.bonuses || [];

  const bonusRows = bonuses.map(b => `<tr><td>${escape(b)}</td></tr>`).join('\n      ');

  const otherKeys = Object.keys(allBrands).filter(k => k !== key).slice(0, 4);
  const relatedCards = otherKeys.map(k => {
    const o = allBrands[k];
    const s = slugifyEn(k);
    return `<a class="related-card" href="/brand/${s}">
        <div class="rc-name">${escape(o.name_full_en || k)}</div>
        <div class="rc-meta">${escape(o.bonuses ? o.bonuses[0] : '')}</div>
      </a>`;
  }).join('\n      ');

  const coreAttr = item.core_en || '';
  const title = `${escape(nameEn)} — Division 2 бренд снаряжения | divcalc.xyz`;
  const desc = `${escape(nameEn)} — бренд снаряжения Division 2. Бонусы бренда: ${bonuses.slice(0,2).map(b => escape(b)).join('; ')}. Статы, именные предметы, лучшие билды.`;
  const canonical = `https://divcalc.xyz/brand/${slug}`;

  return { slug, html: `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(nameEn)} — Division 2 бренд">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Brand","name":"${escape(nameEn)}","description":"${desc}","url":"${canonical}"}
</script>
${breadcrumbJsonLd([
  {name:'Главная',url:'https://divcalc.xyz/'},
  {name:'Бренды',url:'https://divcalc.xyz/brand/'},
  {name:nameEn,url:canonical}
])}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/brand/">Бренды</a> <span>›</span>
  ${escape(nameEn)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">IMG</div>
    <div>
      <h1>${escape(nameEn)}</h1>
      <div class="en-name">Бренд снаряжения</div>
      <div class="badges">
        <span class="badge badge-brand">Бренд</span>
        ${coreAttr ? `<span class="badge badge-cat">${escape(coreAttr)}</span>` : ''}
      </div>
    </div>
  </div>

  ${adSlot('ad-top')}

  <section class="stats">
    <h2>Бонусы бренда</h2>
    <table class="stats-table">
      ${bonusRows}
      ${coreAttr ? `<tr><td>Основной атрибут</td><td>${escape(coreAttr)}</td></tr>` : ''}
    </table>
  </section>

  ${adSlot('ad-mid')}

  ${renderSourcesHtml(nameEn)}

  <section class="synergy">
    <h2>Синергии</h2>
    <p>Подбери оптимальное сочетание брендов в <a href="/">калькуляторе DPS divcalc.xyz</a>. Смотри также <a href="/named/">именное снаряжение</a> этого бренда.</p>
  </section>

  <section class="related">
    <h2>Другие бренды</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </section>

  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>` };
}

// ─── Category index pages ──────────────────────────────────────────────────

function generateCategoryIndex(dir, titleRu, badge, items) {
  const title = `${titleRu} — Division 2 | divcalc.xyz`;
  const desc = `Все ${titleRu.toLowerCase()} в Tom Clancy's The Division 2. Статы, таланты, лучшие билды. Рассчитай DPS на divcalc.xyz.`;
  const canonical = `https://divcalc.xyz/${dir}/`;
  const cards = items.map(({ slug, nameRu, nameEn, meta }) =>
    `<a class="related-card" href="/${dir}/${slug}">
      <div class="rc-name">${escape(nameRu)}</div>
      <div class="rc-meta">${escape(nameEn)}${meta ? ' · ' + escape(meta) : ''}</div>
    </a>`
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  ${titleRu}
</div>
<main class="item-page">
  <h1>${titleRu}</h1>
  <p style="color:var(--muted);margin:8px 0 24px">Все предметы категории «${titleRu}» в The Division 2. Нажми на предмет чтобы увидеть полные статы и гайд.</p>
  ${adSlot('ad-top')}
  <div class="related-grid" style="margin-top:20px">
    ${cards}
  </div>
  ${adSlot('ad-bottom')}
</main>
${footer()}
</body>
</html>`;
}

// ─── Sitemap ────────────────────────────────────────────────────────────────

function generateSitemap(urls) {
  const today = new Date().toISOString().split('T')[0];
  const entries = urls.map(({ loc, priority, freq }) =>
    `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq || 'monthly'}</changefreq>
    <priority>${priority || '0.6'}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://divcalc.xyz/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${entries}
</urlset>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const exoticWeapons = require(path.join(ROOT, 'data/exotic_weapons.json'));
  const exoticGearRaw = require(path.join(ROOT, 'data/exotics.json'));
  // Build source lookup: en_name → source_ru
  const exoticSourceMap = {};
  exoticGearRaw.forEach(i => { if (i.en && i.source_ru) exoticSourceMap[i.en] = i.source_ru; });
  const exoticGear = exoticGearRaw;
  const namedWeapons = require(path.join(ROOT, 'data/named.json'));
  const namedGear = require(path.join(ROOT, 'data/named_gear.json'));
  const gearSets = require(path.join(ROOT, 'data/gear_sets.json'));
  const brands = require(path.join(ROOT, 'data/brands.json'));

  const sitemapUrls = [];
  const slugsSeen = new Set();
  let total = 0;

  // — Exotic weapons —
  const exoticWeaponItems = [];
  for (const [key, item] of Object.entries(exoticWeapons)) {
    if (!item.source_ru && exoticSourceMap[item.en]) item.source_ru = exoticSourceMap[item.en];
    const { slug, html } = generateExoticWeapon(key, item, exoticWeapons);
    if (slugsSeen.has(`exotic/${slug}`)) { console.warn(`Dup exotic-weapon slug: ${slug}`); continue; }
    slugsSeen.add(`exotic/${slug}`);
    writeFile(path.join(ROOT, 'exotic', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/exotic/${slug}`, priority: '0.7', freq: 'monthly' });
    exoticWeaponItems.push({ slug, nameRu: item.name_ru || key, nameEn: item.en || '', meta: item.cat });
    total++;
  }

  // — Exotic gear —
  const exoticGearItems = [];
  for (let i = 0; i < exoticGear.length; i++) {
    const item = exoticGear[i];
    const { slug, html } = generateExoticGear(i, item, exoticGear);
    if (slugsSeen.has(`exotic/${slug}`)) { console.warn(`Dup exotic-gear slug: ${slug}`); continue; }
    slugsSeen.add(`exotic/${slug}`);
    writeFile(path.join(ROOT, 'exotic', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/exotic/${slug}`, priority: '0.7', freq: 'monthly' });
    exoticGearItems.push({ slug, nameRu: item.name || '', nameEn: item.en || '', meta: item.g });
    total++;
  }

  // — Named weapons —
  const namedWeaponItems = [];
  for (let i = 0; i < namedWeapons.length; i++) {
    const item = namedWeapons[i];
    const { slug, html } = generateNamed(i, item, namedWeapons);
    if (slugsSeen.has(`named/${slug}`)) { console.warn(`Dup named-weapon slug: ${slug}`); continue; }
    slugsSeen.add(`named/${slug}`);
    writeFile(path.join(ROOT, 'named', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/named/${slug}`, priority: '0.6', freq: 'monthly' });
    namedWeaponItems.push({ slug, nameRu: item.name || '', nameEn: item.en || '', meta: item.g });
    total++;
  }

  // — Named gear —
  const namedGearItems = [];
  for (let i = 0; i < namedGear.length; i++) {
    const item = namedGear[i];
    if (!item.name && !item.en) continue;
    const { slug, html } = generateNamedGear(i, item, namedGear);
    if (slugsSeen.has(`named/${slug}`)) { console.warn(`Dup named-gear slug: ${slug}`); continue; }
    slugsSeen.add(`named/${slug}`);
    writeFile(path.join(ROOT, 'named', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/named/${slug}`, priority: '0.6', freq: 'monthly' });
    namedGearItems.push({ slug, nameRu: item.name || '', nameEn: item.en || '', meta: item.g });
    total++;
  }

  // — Gear sets —
  const setItems = [];
  for (const [key, item] of Object.entries(gearSets)) {
    const { slug, html } = generateSet(key, item, gearSets);
    if (slugsSeen.has(`set/${slug}`)) { console.warn(`Dup set slug: ${slug}`); continue; }
    slugsSeen.add(`set/${slug}`);
    writeFile(path.join(ROOT, 'set', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/set/${slug}`, priority: '0.75', freq: 'monthly' });
    setItems.push({ slug, nameRu: item.name || key, nameEn: item.en || '', meta: '' });
    total++;
  }

  // — Brands —
  const brandItems = [];
  for (const [key, item] of Object.entries(brands)) {
    const { slug, html } = generateBrand(0, key, item, brands);
    if (slugsSeen.has(`brand/${slug}`)) { console.warn(`Dup brand slug: ${slug}`); continue; }
    slugsSeen.add(`brand/${slug}`);
    writeFile(path.join(ROOT, 'brand', `${slug}.html`), html);
    sitemapUrls.push({ loc: `https://divcalc.xyz/brand/${slug}`, priority: '0.65', freq: 'monthly' });
    brandItems.push({ slug, nameRu: item.name_full_en || key, nameEn: item.name_full_en || key, meta: item.core_en });
    total++;
  }

  // — Category index pages —
  const allExoticItems = [...exoticWeaponItems, ...exoticGearItems];
  writeFile(path.join(ROOT, 'exotic', 'index.html'),
    generateCategoryIndex('exotic', 'Экзотики', 'badge-exotic', allExoticItems));
  sitemapUrls.push({ loc: 'https://divcalc.xyz/exotic/', priority: '0.8', freq: 'weekly' });

  const allNamedItems = [...namedWeaponItems, ...namedGearItems];
  writeFile(path.join(ROOT, 'named', 'index.html'),
    generateCategoryIndex('named', 'Именное снаряжение', 'badge-named', allNamedItems));
  sitemapUrls.push({ loc: 'https://divcalc.xyz/named/', priority: '0.8', freq: 'weekly' });

  writeFile(path.join(ROOT, 'set', 'index.html'),
    generateCategoryIndex('set', 'Комплекты снаряжения', 'badge-set', setItems));
  sitemapUrls.push({ loc: 'https://divcalc.xyz/set/', priority: '0.8', freq: 'weekly' });

  writeFile(path.join(ROOT, 'brand', 'index.html'),
    generateCategoryIndex('brand', 'Бренды снаряжения', 'badge-brand', brandItems));
  sitemapUrls.push({ loc: 'https://divcalc.xyz/brand/', priority: '0.75', freq: 'weekly' });

  // — Sitemap —
  writeFile(path.join(ROOT, 'sitemap.xml'), generateSitemap(sitemapUrls));

  console.log(`✓ Generated ${total} pages`);
  console.log(`  exotic weapons: ${exoticWeaponItems.length}`);
  console.log(`  exotic gear:    ${exoticGearItems.length}`);
  console.log(`  named weapons:  ${namedWeaponItems.length}`);
  console.log(`  named gear:     ${namedGearItems.length}`);
  console.log(`  sets:           ${setItems.length}`);
  console.log(`  brands:         ${brandItems.length}`);
  console.log(`  sitemap URLs:   ${sitemapUrls.length}`);
}

main();
