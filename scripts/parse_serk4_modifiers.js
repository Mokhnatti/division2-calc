#!/usr/bin/env node
// Parse Serk4's Recombinant TypeScript file and output JS-compatible data object
// For integration into index.html's Recombinator section

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'data_sources', 'serk4_recombinant_modifiers.ts');
const src = fs.readFileSync(srcPath, 'utf8');

// Extract each modifier object — they look like `{ id: '...', name: '...', ... }`
// Find all blocks between `{` and matching `}` that contain `id:`
const blocks = [];
let depth = 0;
let start = -1;
for (let i = 0; i < src.length; i++) {
  const c = src[i];
  if (c === '{') {
    if (depth === 0) start = i;
    depth++;
  } else if (c === '}') {
    depth--;
    if (depth === 0 && start >= 0) {
      const body = src.slice(start, i + 1);
      if (/id:\s*'\w+'/.test(body) && /name:\s*'/.test(body) && /category:\s*'/.test(body)) {
        blocks.push(body);
      }
      start = -1;
    }
  }
}

console.log(`Found ${blocks.length} modifier blocks`);

// Parse each block into JS object
const modifiers = [];
for (const block of blocks) {
  const obj = {};
  const id = /id:\s*'([^']+)'/.exec(block);
  const name = /name:\s*'([^']+)'/.exec(block);
  const category = /category:\s*'([^']+)'/.exec(block);
  const description = /description:\s*'([^']+)'/.exec(block);
  const effectDesc = /effectDescription:\s*'([^']+)'/.exec(block);
  const effectType = /effectType:\s*'([^']+)'/.exec(block);
  const icon = /icon:\s*'([^']+)'/.exec(block);

  if (!id || !name) continue;
  obj.id = id[1];
  obj.name = name[1];
  obj.category = category ? category[1] : '';
  obj.description = description ? description[1] : '';
  obj.effectDesc = effectDesc ? effectDesc[1] : '';
  obj.effectType = effectType ? effectType[1] : 'none';
  obj.icon = icon ? icon[1] : '';

  // Parse stackChanges: array of {category, amount}
  const stackMatch = /stackChanges:\s*\[([\s\S]*?)\]/m.exec(block);
  if (stackMatch) {
    const entries = [...stackMatch[1].matchAll(/\{\s*category:\s*'(\w+)'\s*,\s*amount:\s*(-?\d+)\s*\}/g)];
    obj.stackChanges = entries.map((m) => ({ cat: m[1], amount: parseInt(m[2]) }));
  }

  // Parse stats: array of {stat, baseValue, synergyBonus}
  const statsMatch = /stats:\s*\[([\s\S]*?)\]/m.exec(block);
  if (statsMatch) {
    const entries = [...statsMatch[1].matchAll(/\{\s*stat:\s*'(\w+)'\s*,\s*baseValue:\s*([\d.]+)\s*,\s*synergyBonus:\s*([\d.]+)/g)];
    obj.stats = entries.map((m) => ({ stat: m[1], base: parseFloat(m[2]), synergy: parseFloat(m[3]) }));
  }

  // Parse synergyWith: array of strings
  const synMatch = /synergyWith:\s*\[([^\]]*)\]/m.exec(block);
  if (synMatch) {
    obj.synergy = [...synMatch[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
  }

  modifiers.push(obj);
}

console.log(`Parsed ${modifiers.length} modifiers`);
// Group by category
const byCat = {};
modifiers.forEach((m) => { byCat[m.category] = (byCat[m.category] || 0) + 1; });
console.log('By category:', byCat);

// Save as JS const for pasting into index.html
const outPath = path.join(__dirname, '..', 'data_sources', 'gen_RECOMBINATOR.js');
const jsLines = ['// Serk4 Recombinant modifiers — generated from serk4_recombinant_modifiers.ts'];
jsLines.push('const RECOMBINATOR_MODIFIERS=' + JSON.stringify(modifiers, null, 2) + ';');
fs.writeFileSync(outPath, jsLines.join('\n'), 'utf8');
console.log(`Saved: ${outPath}`);

// Also save raw JSON for programmatic use
fs.writeFileSync(
  path.join(__dirname, '..', 'data_sources', 'serk4_modifiers.json'),
  JSON.stringify(modifiers, null, 2),
  'utf8'
);
