#!/usr/bin/env node
// Community builds static page generator for divcalc.xyz
// Run hourly via cron on VPS: node /var/www/divcalc/scripts/generate_builds.js

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const PB_URL = 'http://127.0.0.1:8090/api/collections/builds/records';
const BUILD_DIR = path.join(ROOT, 'build');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');

// ─── HTTP helper ────────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

async function fetchAllBuilds() {
  const builds = [];
  let page = 1;
  while (true) {
    const url = `${PB_URL}?perPage=200&page=${page}&sort=-likes`;
    const data = await fetchJson(url);
    const items = data.items || [];
    builds.push(...items);
    if (builds.length >= (data.totalItems || 0) || items.length === 0) break;
    page++;
  }
  return builds;
}

// ─── Build hash decoder ─────────────────────────────────────────────────────

function decodeBuildHash(hash) {
  try {
    return JSON.parse(Buffer.from(hash, 'base64').toString('utf8'));
  } catch (e) { return null; }
}

// ─── HTML helpers ────────────────────────────────────────────────────────────

function escape(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
  <p><a href="/">divcalc.xyz</a> — калькулятор DPS для Tom Clancy's The Division 2 · <a href="/exotic/">Экзотики</a> · <a href="/set/">Комплекты</a></p>
  <p style="margin-top:6px">Данные актуальны для Title Update 21 (Year 9)</p>
</footer>`;
}

const SLOT_NAMES = { mask:'Маска', chest:'Нагрудник', bp:'Рюкзак', gloves:'Перчатки', holster:'Кобура', knees:'Наколенники' };
const STAT_NAMES = { chc:'Шанс крита', chd:'Урон крита', hsd:'Урон в голову', wd:'Урон оружием', rof:'Скорострельность', reload:'Перезарядка', dta:'Урон по броне', ooc:'Урон вне укрытия', amp:'Усиленный урон', mag:'Доп. патроны' };
const CAT_NAMES = { AR:'Штурмовая винтовка', LMG:'Ручной пулемёт', SMG:'Пистолет-пулемёт', MMR:'Снайперская', Rifle:'Винтовка', SG:'Дробовик', Pistol:'Пистолет' };

function formatDPS(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function buildDate(iso) {
  try { return new Date(iso).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }); }
  catch (e) { return ''; }
}

function generateBuildPage(b) {
  const state = decodeBuildHash(b.build_hash);
  const buildName = b.name || 'Билд Division 2';
  const author = b.author || 'Аноним';
  const weaponName = b.weapon_name || (state && state.cw && state.cw.cat ? `Custom ${state.cw.cat}` : '');
  const weaponCat = b.weapon_cat || (state && state.cw && state.cw.cat) || '';
  const peakDps = formatDPS(b.peak_dps);
  const likes = b.likes || 0;
  const dateStr = buildDate(b.created);

  // Gear slots
  let slotsHtml = '';
  if (state && state.slots) {
    slotsHtml = `<table class="stats-table">`;
    for (const [slot, val] of Object.entries(state.slots)) {
      const slotLabel = SLOT_NAMES[slot] || slot;
      const itemName = val && val.n ? val.n : '—';
      const itemKind = val && val.k ? val.k : '';
      const kindColor = itemKind === 'exotic' ? 'var(--accent)' : itemKind === 'named' ? '#58a6ff' : itemKind === 'green' ? '#3fb950' : 'var(--text)';
      slotsHtml += `<tr><td>${slotLabel}</td><td style="color:${kindColor}">${escape(itemName)}</td></tr>`;
    }
    slotsHtml += `</table>`;
  }

  // Stats
  let statsHtml = '';
  if (state && state.b) {
    const stats = state.b;
    const rows = Object.entries(STAT_NAMES)
      .filter(([k]) => stats[k] && stats[k] !== 0)
      .map(([k, label]) => `<tr><td>${label}</td><td>${stats[k]}%</td></tr>`)
      .join('');
    if (rows) statsHtml = `<table class="stats-table">${rows}</table>`;
  }

  const openUrl = `https://divcalc.xyz/#b=${b.build_hash}`;
  const canonical = `https://divcalc.xyz/build/${b.id}`;
  const catLabel = CAT_NAMES[weaponCat] || weaponCat;

  const title = `${escape(buildName)} — Division 2 билд ${escape(weaponCat)} | divcalc.xyz`;
  const desc = `${escape(buildName)} — билд Division 2 для ${escape(catLabel || 'оружия')}${weaponName ? ` (${escape(weaponName)})` : ''}. DPS: ${peakDps}. Автор: ${escape(author)}. Открой в калькуляторе divcalc.xyz.`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${escape(buildName)} — Division 2 билд">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="divcalc.xyz">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","name":"${escape(buildName)}","description":"${desc}","url":"${canonical}","author":{"@type":"Person","name":"${escape(author)}"},"datePublished":"${b.created||''}"}
</script>
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  <a href="/?cat=community">Сообщество</a> <span>›</span>
  ${escape(buildName)}
</div>
<main class="item-page">
  <div class="item-hero">
    <div class="item-icon">${escape(weaponCat||'?')}</div>
    <div>
      <h1>${escape(buildName)}</h1>
      <div class="en-name">${escape(weaponName)}${catLabel ? ' · ' + escape(catLabel) : ''}</div>
      <div class="badges">
        <span class="badge badge-cat">Билд сообщества</span>
        ${weaponCat ? `<span class="badge badge-cat">${escape(weaponCat)}</span>` : ''}
        <span class="badge badge-cat" style="color:var(--accent)">❤ ${likes}</span>
      </div>
    </div>
  </div>

  <div style="text-align:center;margin:16px 0">
    <a href="${openUrl}" style="display:inline-block;background:var(--accent);color:#0d1117;font-weight:700;padding:12px 28px;border-radius:8px;font-size:15px;text-decoration:none">🔢 Открыть в калькуляторе</a>
  </div>

  <div class="ad-slot ad-top"></div>

  <section class="stats">
    <h2>Основные характеристики</h2>
    <table class="stats-table">
      <tr><td>Оружие</td><td>${escape(weaponName)}</td></tr>
      <tr><td>Тип</td><td>${escape(catLabel)}</td></tr>
      <tr><td>Peak DPS</td><td style="color:var(--accent);font-weight:700">${peakDps}</td></tr>
      <tr><td>Автор</td><td>${escape(author)}</td></tr>
      <tr><td>Лайки</td><td>❤ ${likes}</td></tr>
      ${dateStr ? `<tr><td>Дата</td><td>${dateStr}</td></tr>` : ''}
      ${b.description ? `<tr><td>Описание</td><td>${escape(b.description)}</td></tr>` : ''}
    </table>
  </section>

  ${slotsHtml ? `<section class="slots"><h2>Снаряжение</h2>${slotsHtml}</section>` : ''}

  ${statsHtml ? `<section class="bstats"><h2>Статы билда</h2>${statsHtml}</section>` : ''}

  <div class="ad-slot ad-mid"></div>

  <section style="text-align:center;padding:20px 0">
    <h2>Хочешь попробовать этот билд?</h2>
    <p style="color:var(--muted);margin:8px 0 16px">Открой в калькуляторе, подправь под себя и рассчитай DPS</p>
    <a href="${openUrl}" style="display:inline-block;background:var(--accent);color:#0d1117;font-weight:700;padding:12px 28px;border-radius:8px;font-size:15px;text-decoration:none">🔢 Открыть в калькуляторе</a>
  </section>

  <div class="ad-slot ad-bottom"></div>
</main>
${footer()}
</body>
</html>`;
}

// ─── Sitemap update ──────────────────────────────────────────────────────────

function updateSitemap(buildIds) {
  let sitemap = '';
  try { sitemap = fs.readFileSync(SITEMAP_FILE, 'utf8'); } catch (e) { return; }
  const today = new Date().toISOString().split('T')[0];

  // Remove old build entries
  sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/divcalc\.xyz\/build\/[^<]+<\/loc>[\s\S]*?<\/url>/g, '');

  // Add new build entries before closing tag
  const newEntries = buildIds.map(id => `  <url>
    <loc>https://divcalc.xyz/build/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n');

  sitemap = sitemap.replace('</urlset>', newEntries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  console.log('Fetching builds from PocketBase...');
  let builds;
  try {
    builds = await fetchAllBuilds();
  } catch (e) {
    console.error('Failed to fetch builds:', e.message);
    process.exit(1);
  }
  console.log(`Got ${builds.length} builds`);

  // Generate pages for all builds
  let generated = 0;
  const ids = [];
  for (const b of builds) {
    if (!b.id) continue;
    const html = generateBuildPage(b);
    fs.writeFileSync(path.join(BUILD_DIR, `${b.id}.html`), html, 'utf8');
    ids.push(b.id);
    generated++;
  }

  // Generate index page
  const today = new Date().toISOString().split('T')[0];
  const indexCards = builds.slice(0, 100).map(b => {
    const catLabel = CAT_NAMES[b.weapon_cat] || b.weapon_cat || '';
    return `<a class="related-card" href="/build/${b.id}">
      <div class="rc-name">${escape(b.name || 'Билд')}</div>
      <div class="rc-meta">${escape(b.weapon_name || '')} · ${escape(catLabel)} · ❤ ${b.likes||0} · DPS ${formatDPS(b.peak_dps)}</div>
    </a>`;
  }).join('\n    ');

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Лучшие билды сообщества Division 2 | divcalc.xyz</title>
<meta name="description" content="Лучшие билды для Tom Clancy's The Division 2 от сообщества. Топ DPS, PvE, Heroic билды — открывай в калькуляторе divcalc.xyz.">
<link rel="canonical" href="https://divcalc.xyz/build/">
<link rel="stylesheet" href="/css/page.css">
${GA_CODE}
${YM_CODE}
</head>
<body>
${nav()}
<div class="breadcrumb">
  <a href="/">Главная</a> <span>›</span>
  Билды сообщества
</div>
<main class="item-page">
  <h1>Билды сообщества</h1>
  <p style="color:var(--muted);margin:8px 0 24px">Лучшие билды Division 2 от игроков. Нажми на билд чтобы открыть в калькуляторе.</p>
  <div class="ad-slot ad-top"></div>
  <div class="related-grid" style="margin-top:20px">
    ${indexCards}
  </div>
  <div class="ad-slot ad-bottom"></div>
</main>
<footer>
  <p><a href="/">divcalc.xyz</a> · Обновлено: ${today}</p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), indexHtml, 'utf8');

  // Update sitemap
  updateSitemap(ids);

  console.log(`✓ Generated ${generated} build pages + index`);
  console.log(`✓ Sitemap updated with ${ids.length} build URLs`);
}

main().catch(e => { console.error(e); process.exit(1); });
