#!/usr/bin/env node
// Language leak checker
// EN pages: find any cyrillic text (ignoring data attrs, conditional RU banner in JS)
// RU pages: find long latin phrases (ignoring EN names, URLs, script/style blocks)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && full.endsWith('.html')) yield full;
  }
}

// Strip <script>, <style>, <meta>, comments, and attribute values
// (attributes like title=".." are not visible text content)
function stripNonVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/\s(?:title|alt|aria-label|placeholder|href|src|class|id|data-[a-z-]+)="[^"]*"/gi, '');
}

// Allow common EN brand/weapon names that may appear on RU pages as secondary text
const IGNORE_LATIN_PATTERNS = [
  /^(Division|RPM|DPS|EXOTIC|NAMED|BRAND|SET|AR|SMG|LMG|MMR|SG|DMR)$/i,
];

function checkEn(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const stripped = stripNonVisible(raw);
  const matches = [];
  const re = /[А-Яа-яЁё][А-Яа-яЁё ,.«»"()+0-9-]{5,}/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const txt = m[0].trim();
    if (txt.length < 6) continue;
    matches.push(txt);
  }
  return [...new Set(matches)];
}

function checkRu(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const stripped = stripNonVisible(raw);
  // Long latin phrases (5+ words) — likely EN leak on RU page
  const matches = [];
  const re = /[A-Za-z][A-Za-z ,.'()+0-9-]{30,}/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const txt = m[0].trim();
    if (IGNORE_LATIN_PATTERNS.some(p => p.test(txt))) continue;
    if (/^https?:/.test(txt)) continue;
    if (/^(img|src|alt|href|url|data)/i.test(txt)) continue;
    matches.push(txt);
  }
  return [...new Set(matches)];
}

function main() {
  const enDir = path.join(ROOT, 'en');
  const ruDir = path.join(ROOT, 'ru');
  const enReport = {};
  const ruReport = {};

  for (const f of walk(enDir)) {
    const leaks = checkEn(f);
    if (leaks.length) enReport[path.relative(ROOT, f).replace(/\\/g, '/')] = leaks;
  }
  for (const f of walk(ruDir)) {
    const leaks = checkRu(f);
    if (leaks.length) ruReport[path.relative(ROOT, f).replace(/\\/g, '/')] = leaks;
  }

  // Aggregate top RU phrases leaking into EN
  const enPhraseCount = {};
  for (const leaks of Object.values(enReport)) {
    for (const p of leaks) enPhraseCount[p] = (enPhraseCount[p] || 0) + 1;
  }
  const topEnLeaks = Object.entries(enPhraseCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  console.log('\n═══ EN pages with Cyrillic (top 30 files) ═══');
  const enSorted = Object.entries(enReport).sort((a, b) => b[1].length - a[1].length);
  console.log(`Total EN pages with leaks: ${enSorted.length}/${Object.keys(enReport).length + (walkCount(enDir) - Object.keys(enReport).length)}`);
  for (const [f, leaks] of enSorted.slice(0, 30)) {
    console.log(`\n  ${f}  (${leaks.length} leaks)`);
    for (const p of leaks.slice(0, 5)) console.log(`    - ${p.slice(0, 90)}`);
  }

  console.log('\n═══ Top Cyrillic phrases leaking across EN pages ═══');
  for (const [p, cnt] of topEnLeaks) {
    console.log(`  ${cnt}×  ${p.slice(0, 90)}`);
  }

  console.log('\n═══ RU pages with long Latin phrases (top 10) ═══');
  const ruSorted = Object.entries(ruReport).sort((a, b) => b[1].length - a[1].length);
  for (const [f, leaks] of ruSorted.slice(0, 10)) {
    console.log(`\n  ${f}  (${leaks.length} leaks)`);
    for (const p of leaks.slice(0, 3)) console.log(`    - ${p.slice(0, 90)}`);
  }

  fs.writeFileSync(path.join(ROOT, 'leak_report_en.json'), JSON.stringify(enReport, null, 2));
  fs.writeFileSync(path.join(ROOT, 'leak_report_ru.json'), JSON.stringify(ruReport, null, 2));
  console.log(`\n✓ Wrote leak_report_en.json (${Object.keys(enReport).length} files)`);
  console.log(`✓ Wrote leak_report_ru.json (${Object.keys(ruReport).length} files)`);
}

function walkCount(dir) {
  let n = 0;
  for (const _ of walk(dir)) n++;
  return n;
}

main();
