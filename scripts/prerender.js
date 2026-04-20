#!/usr/bin/env node
// Prerender divcalc.xyz homepage for search engine bots and AI crawlers
// Run: node scripts/prerender.js
// Output: index.prerendered.html (served by Caddy to bot UAs)

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.PRERENDER_URL || 'https://divcalc.xyz/';
const OUTPUT_FILE = path.join(__dirname, '..', 'index.prerendered.html');
const WAIT_MS = 8000;

async function main() {
  console.log(`[prerender] launching headless chrome...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (compatible; DivcalcPrerender/1.0)');

  console.log(`[prerender] GET ${TARGET_URL}`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  console.log(`[prerender] waiting ${WAIT_MS}ms for dynamic content (meta strip, community feed)...`);
  await new Promise(r => setTimeout(r, WAIT_MS));

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-prerendered', 'true');
    const items = [
      ...document.querySelectorAll('iframe'),
      ...document.querySelectorAll('script[src*="googletagmanager"]'),
      ...document.querySelectorAll('script[src*="mc.yandex"]')
    ];
    items.forEach(el => el.remove());
  });

  const html = await page.content();
  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  const sizeKb = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`[prerender] wrote ${OUTPUT_FILE} (${sizeKb} KB)`);

  await browser.close();
}

main().catch(err => {
  console.error(`[prerender] FAILED:`, err);
  process.exit(1);
});
