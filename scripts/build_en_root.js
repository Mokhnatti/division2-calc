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

fs.writeFileSync(path.join(ROOT, 'en', 'index.html'), out);
console.log('✓ Wrote en/index.html');
