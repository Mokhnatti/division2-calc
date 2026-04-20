#!/usr/bin/env node
// i18n audit: launch each panel in EN mode, find visible Russian strings

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
  { name: 'SkillMods', btn: 'skill-mods' },
  { name: 'Sets', btn: 'sets' },
  { name: 'Brands', btn: 'brands' },
  { name: 'Exotics', btn: 'exotics' },
  { name: 'Named', btn: 'named' }
];

async function extractRussian(page) {
  return await page.evaluate(() => {
    const result = [];
    const CYR = /[а-яА-ЯёЁ]/;
    function walk(el) {
      if (!el) return;
      if (el.nodeType === 3) {
        const t = (el.textContent || '').trim();
        if (t && CYR.test(t) && t.length >= 3) {
          const parent = el.parentElement;
          if (parent && parent.offsetParent === null && parent.tagName !== 'OPTION') return;
          if (parent) {
            const tag = parent.tagName.toLowerCase();
            if (['script','style','noscript','iframe'].includes(tag)) return;
          }
          result.push(t.slice(0, 200));
        }
        return;
      }
      if (el.nodeType !== 1) return;
      const tag = el.tagName.toLowerCase();
      if (['script','style','noscript','iframe'].includes(tag)) return;
      // Check placeholder
      if (el.placeholder) {
        const t = el.placeholder.trim();
        if (t && CYR.test(t)) result.push('[placeholder] ' + t);
      }
      for (const c of el.childNodes) walk(c);
    }
    walk(document.body);
    return result;
  });
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Set lang=en BEFORE navigation
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('d2calc_lang', 'en'); } catch(e) {}
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
      const ruStrings = await extractRussian(page);
      // dedup
      const unique = [...new Set(ruStrings)];
      allFindings[route.name] = unique;
      console.log(`\n=== ${route.name} === (${unique.length} RU strings)`);
      unique.slice(0, 30).forEach(s => console.log('  - ' + s));
      if (unique.length > 30) console.log(`  ... and ${unique.length - 30} more`);
    } catch (e) {
      console.log(`\n=== ${route.name} === ERROR: ${e.message}`);
    }
  }

  const fs = require('fs');
  fs.writeFileSync('i18n_audit_result.json', JSON.stringify(allFindings, null, 2), 'utf-8');
  console.log('\n\nFull result saved to i18n_audit_result.json');

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
