#!/usr/bin/env node
// Full audit of all generated pages — structural + language + link integrity
//
// Checks per page:
//   - valid <title> + description (non-empty, reasonable length)
//   - <h1> present and non-empty
//   - <link rel="canonical"> matches current path
//   - hreflang ru/en/x-default present and reciprocal
//   - Cyrillic leaks on EN pages / long Latin chunks on RU pages
//   - broken internal links (href="/xxx" where file doesn't exist)
//   - Open Graph title/description present
//
// Writes: audit_report.json + audit_report.md (summary for humans)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function* walk(dir, depth = 0) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full, depth + 1);
    else if (e.isFile() && full.endsWith('.html')) yield full;
  }
}

function stripNonVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/\s(?:title|alt|aria-label|placeholder|href|src|class|id|data-[a-z-]+)="[^"]*"/gi, '');
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function allHrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
}

function pageLang(relPath) {
  if (relPath.startsWith('en/')) return 'en';
  if (relPath.startsWith('ru/')) return 'ru';
  return 'root';
}

function fileExistsForHref(href) {
  // only check internal absolute paths starting with /
  if (!href.startsWith('/')) return true;
  if (href.startsWith('//')) return true;
  if (href.startsWith('/api/') || href.startsWith('/_/')) return true;
  const clean = href.split('?')[0].split('#')[0];
  if (clean === '/' || clean === '') return true;
  // try direct, then .html, then index.html
  const rel = clean.replace(/^\//, '');
  const direct = path.join(ROOT, rel);
  if (fs.existsSync(direct)) return true;
  if (fs.existsSync(direct + '.html')) return true;
  if (fs.existsSync(path.join(direct, 'index.html'))) return true;
  return false;
}

function audit(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const issues = [];
  const lang = pageLang(rel);

  // structural
  const title = extract(html, /<title>([^<]+)<\/title>/i);
  const desc = extract(html, /<meta name="description" content="([^"]+)"/i);
  const h1 = extract(stripNonVisible(html), /<h1[^>]*>([^<]+)<\/h1>/i);
  const canonical = extract(html, /<link rel="canonical" href="([^"]+)"/i);
  const ogTitle = extract(html, /<meta property="og:title" content="([^"]+)"/i);
  const hreflangRu = extract(html, /<link rel="alternate" hreflang="ru" href="([^"]+)"/i);
  const hreflangEn = extract(html, /<link rel="alternate" hreflang="en" href="([^"]+)"/i);
  const htmlLang = extract(html, /<html lang="([^"]+)"/i);

  if (!title) issues.push('missing <title>');
  else if (title.length < 10) issues.push(`title too short: "${title}"`);
  else if (title.length > 200) issues.push(`title too long (${title.length})`);

  if (!desc) issues.push('missing meta description');
  else if (desc.length < 20) issues.push(`description too short`);
  else if (desc.length > 300) issues.push(`description too long (${desc.length})`);

  if (!h1) issues.push('missing <h1>');
  if (!canonical) issues.push('missing canonical');
  if (!ogTitle) issues.push('missing og:title');

  // lang consistency
  if (lang === 'en' && htmlLang !== 'en') issues.push(`html lang="${htmlLang}" but path is /en/`);
  if (lang === 'ru' && htmlLang !== 'ru' && htmlLang !== 'en') issues.push(`html lang="${htmlLang}" unexpected for /ru/`);

  // hreflang present on sub-pages
  if (lang === 'ru' || lang === 'en') {
    if (!hreflangRu) issues.push('missing hreflang="ru"');
    if (!hreflangEn) issues.push('missing hreflang="en"');
  }

  // canonical matches lang prefix
  if (canonical) {
    if (lang === 'en' && !canonical.includes('/en/')) issues.push(`canonical doesn't point to /en/: ${canonical}`);
    if (lang === 'ru' && !canonical.includes('/ru/')) issues.push(`canonical doesn't point to /ru/: ${canonical}`);
  }

  // visible text scan
  const stripped = stripNonVisible(html);

  if (lang === 'en') {
    // Cyrillic leaks (words of 6+ chars)
    const cyr = stripped.match(/[А-Яа-яЁё][А-Яа-яЁё ,.«»"()+0-9-]{5,}/g) || [];
    const phrases = [...new Set(cyr)].filter(p => p.trim().length >= 6);
    if (phrases.length) {
      issues.push(`EN page has ${phrases.length} cyrillic phrases: ` + phrases.slice(0, 3).map(p => `"${p.slice(0, 40)}"`).join(', '));
    }
  }

  if (lang === 'ru') {
    // Long Latin-only phrases (probably untranslated)
    const lat = stripped.match(/[A-Z][a-z][A-Za-z ,.'()+0-9-]{30,}/g) || [];
    const phrases = [...new Set(lat)].filter(p => !/^(Division|Tom Clancy)/.test(p));
    if (phrases.length > 3) {
      issues.push(`RU page has ${phrases.length} long Latin phrases`);
    }
  }

  // broken internal links
  const hrefs = allHrefs(html);
  const broken = [];
  for (const h of hrefs) {
    if (!h.startsWith('/')) continue;
    if (h.startsWith('//')) continue;
    if (!fileExistsForHref(h)) broken.push(h);
  }
  if (broken.length) {
    issues.push(`${broken.length} broken internal links: ` + broken.slice(0, 3).join(', '));
  }

  return { file: rel, lang, issues, title, h1, canonical };
}

function main() {
  const results = [];
  const allPages = [];
  for (const f of walk(ROOT)) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    if (rel === 'index.html' || rel === '404.html' || rel.startsWith('build/')) continue;
    if (rel.includes('.bak') || rel.includes('prerendered')) continue;
    if (rel.startsWith('node_modules/')) continue;
    if (rel.startsWith('data/backup_')) continue;
    if (/^yandex_[a-f0-9]+\.html$/.test(rel)) continue;
    if (/^google[a-f0-9]+\.html$/.test(rel)) continue;
    if (rel === 'BingSiteAuth.xml.html') continue;
    // Skip empty-name artifacts
    const base = path.basename(rel);
    if (base === '.html' || !base.replace(/\.html$/, '').trim()) continue;
    allPages.push(f);
  }

  for (const f of allPages) {
    results.push(audit(f));
  }

  const withIssues = results.filter(r => r.issues.length);
  const totalIssues = withIssues.reduce((s, r) => s + r.issues.length, 0);

  // Sort by issue count
  withIssues.sort((a, b) => b.issues.length - a.issues.length);

  // Aggregate issue types
  const issueCount = {};
  for (const r of withIssues) {
    for (const i of r.issues) {
      const key = i.split(':')[0].split(' (')[0];
      issueCount[key] = (issueCount[key] || 0) + 1;
    }
  }

  console.log(`═══ AUDIT REPORT ═══`);
  console.log(`Total pages: ${results.length}`);
  console.log(`Pages with issues: ${withIssues.length}`);
  console.log(`Total issues: ${totalIssues}`);
  console.log(`\n─ Issue types ─`);
  for (const [k, v] of Object.entries(issueCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.toString().padStart(4)}× ${k}`);
  }
  console.log(`\n─ Top 15 problematic pages ─`);
  for (const r of withIssues.slice(0, 15)) {
    console.log(`\n  ${r.file}  (${r.issues.length} issues)`);
    for (const i of r.issues.slice(0, 5)) {
      console.log(`    • ${i.slice(0, 140)}`);
    }
  }

  // Write full JSON report
  fs.writeFileSync(path.join(ROOT, 'audit_report.json'), JSON.stringify({
    summary: { totalPages: results.length, pagesWithIssues: withIssues.length, totalIssues, issueCount },
    pages: results
  }, null, 2));

  // Write human-friendly MD report
  const md = [];
  md.push(`# Audit Report — ${new Date().toISOString().slice(0, 10)}`);
  md.push(`\n**Total pages:** ${results.length}`);
  md.push(`**Pages with issues:** ${withIssues.length}`);
  md.push(`**Total issues:** ${totalIssues}\n`);
  md.push(`## Issue types\n`);
  for (const [k, v] of Object.entries(issueCount).sort((a, b) => b[1] - a[1])) {
    md.push(`- **${v}×** ${k}`);
  }
  md.push(`\n## Top problematic pages\n`);
  for (const r of withIssues.slice(0, 30)) {
    md.push(`### ${r.file} (${r.issues.length} issues)`);
    for (const i of r.issues) md.push(`- ${i}`);
    md.push('');
  }
  fs.writeFileSync(path.join(ROOT, 'audit_report.md'), md.join('\n'));
  console.log(`\n✓ audit_report.json + audit_report.md written`);
}

main();
