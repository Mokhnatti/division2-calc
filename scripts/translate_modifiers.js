#!/usr/bin/env node
// Translate Serk4 modifier descriptions to Russian via Google Translate
const fs = require('fs');
const https = require('https');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data_sources', 'serk4_modifiers.json');
const OUT = path.join(__dirname, '..', 'data_sources', 'serk4_modifiers_bilingual.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0';

function gtranslate(text) {
  return new Promise((res) => {
    if (!text) return res('');
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=' + encodeURIComponent(text);
    https.get(url, { headers: { 'User-Agent': UA } }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        try {
          const j = JSON.parse(d);
          const out = j[0].map((s) => s[0] || '').join('');
          res(out);
        } catch (e) { res(''); }
      });
    }).on('error', () => res(''));
  });
}

async function main() {
  const mods = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  console.log('Translating ' + mods.length + ' modifiers...');
  for (const m of mods) {
    if (m.description) {
      m.description_ru = await gtranslate(m.description);
      console.log(`  ${m.id}: ${m.description_ru.slice(0, 60)}...`);
    }
    if (m.effectDesc) {
      m.effectDesc_ru = await gtranslate(m.effectDesc);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  fs.writeFileSync(OUT, JSON.stringify(mods, null, 2), 'utf8');
  console.log('Saved: ' + OUT);
}

main();
