#!/usr/bin/env node
// Reverse i18n audit: launch each panel in RU mode, find visible English sentences

const puppeteer = require('puppeteer');

const ROUTES = [
  { name: 'Home/Community', btn: null },
  { name: 'BUILD', btn: 'build' },
  { name: 'DPS', btn: 'dps' },
  { name: 'Top', btn: 'top' },
  { name: 'Skills', btn: 'skills' },
  { name: 'Tank', btn: 'tank' },
  { name: 'Help', btn: 'help' },
  { name: 'Expertise', btn: 'expertise' },
  { name: 'Mods', btn: 'mods' },
  { name: 'Sets', btn: 'sets' },
  { name: 'Brands', btn: 'brands' },
  { name: 'Exotics', btn: 'exotics' },
  { name: 'Named', btn: 'named' }
];

// Allowed English tokens/terms that are OK in RU mode (game jargon + abbreviations)
const ALLOWED_TOKENS = new Set([
  'DPS','DPM','TTK','TTD','HP','EHP','WD','CHC','CHD','HSD','DtA','OoC','Amp','Crit',
  'SHD','RPM','LMG','AR','SMG','MMR','LMB','PvP','PvE','NPC','CD','UI','AI','API',
  'DNA','BSP','ACR','MPX','M60','AK','AKM','G36','M4','M1A','SCAR','PP','ATK','DEF','UTIL',
  'GitHub','Telegram','Discord','Reddit','YouTube','IndexNow','Yandex','Bing','Google',
  'Division','The','Tom','Clancy','Ubisoft','Massive','PocketBase','Caddy','OK','Y8S1','Y9',
  'URL','HTTP','HTTPS','JSON','DNS','CDN','DOM','CSR','SSR','SPA','DB','SQL','NOT',
  'BURST','BUFF','DOT','AOE','Cooldown','Reload','Ammo','Mag','mag','Pulse','Stacks',
  'GPU','CPU','NGE','BPS','Pro','Max','Mod','mods','Y8S1','Bug','bug'
]);

async function extractEnglish(page) {
  return await page.evaluate((allowedTokens) => {
    const result = [];
    const allowed = new Set(allowedTokens);
    // Pure English text (no cyrillic chars, at least 3 English words)
    const CYR = /[а-яА-ЯёЁ]/;
    // "English sentence" = 3+ words with only latin letters/digits/punctuation, no cyrillic
    function isPureEnglishSentence(s) {
      if (CYR.test(s)) return false;
      // Must have at least 10 chars and 3 words or 1 long word
      if (s.length < 10) return false;
      const words = s.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
      if (words.length < 2) return false;
      // Check if ALL significant words are in allowed tokens list — if yes, it's just game jargon
      const longWords = words.filter(w => w.length >= 3);
      if (longWords.length === 0) return false;
      const allAllowed = longWords.every(w => {
        const clean = w.replace(/[^a-zA-Z]/g,'');
        return allowed.has(clean) || clean.length < 3;
      });
      if (allAllowed) return false;
      return true;
    }
    function walk(el) {
      if (!el) return;
      if (el.nodeType === 3) {
        const t = (el.textContent || '').trim();
        if (t && isPureEnglishSentence(t)) {
          const parent = el.parentElement;
          if (parent && parent.offsetParent === null && parent.tagName !== 'OPTION') return;
          if (parent) {
            const tag = parent.tagName.toLowerCase();
            if (['script','style','noscript','iframe'].includes(tag)) return;
          }
          result.push(t.slice(0, 250));
        }
        return;
      }
      if (el.nodeType !== 1) return;
      const tag = el.tagName.toLowerCase();
      if (['script','style','noscript','iframe'].includes(tag)) return;
      if (el.placeholder && isPureEnglishSentence(el.placeholder.trim())) {
        result.push('[placeholder] ' + el.placeholder.trim());
      }
      for (const c of el.childNodes) walk(c);
    }
    walk(document.body);
    return result;
  }, [...ALLOWED_TOKENS]);
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Set lang=ru (default, but just to be explicit)
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('d2calc_lang', 'ru'); } catch(e) {}
  });

  await page.goto('https://divcalc.xyz/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  const allFindings = {};

  for (const route of ROUTES) {
    try {
      if (route.btn) {
        await page.evaluate((cat) => {
          if (typeof setActiveCat === 'function') setActiveCat(cat);
        }, route.btn);
        await new Promise(r => setTimeout(r, 1500));
      }
      const enStrings = await extractEnglish(page);
      const unique = [...new Set(enStrings)];
      allFindings[route.name] = unique;
      console.log(`\n=== ${route.name} === (${unique.length} EN sentences in RU mode)`);
      unique.slice(0, 20).forEach(s => console.log('  - ' + s));
      if (unique.length > 20) console.log(`  ... and ${unique.length - 20} more`);
    } catch (e) {
      console.log(`\n=== ${route.name} === ERROR: ${e.message}`);
    }
  }

  const fs = require('fs');
  fs.writeFileSync('i18n_audit_en_result.json', JSON.stringify(allFindings, null, 2), 'utf-8');
  console.log('\n\nFull result saved to i18n_audit_en_result.json');

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
