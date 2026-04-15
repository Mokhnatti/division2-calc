#!/usr/bin/env node
// Apply quiz answers (majority votes) to actual code in index.html
// Reads quiz_answers.json + quiz_questions.json, computes majority for each question,
// patches index.html accordingly. Skips "dunno" votes.
//
// Usage:
//   node scripts/apply_quiz_answers.js          — apply all answered questions
//   node scripts/apply_quiz_answers.js --dry    — show what would change without writing

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const QUESTIONS_FILE = path.join(ROOT, 'data_sources', 'quiz_questions.json');
const ANSWERS_FILE = path.join(ROOT, 'data_sources', 'quiz_answers.json');

const dryRun = process.argv.includes('--dry');

const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
const answers = fs.existsSync(ANSWERS_FILE) ? JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8')) : {};
let html = fs.readFileSync(HTML_PATH, 'utf8');

let applied = 0;
let skipped = 0;
let changed = 0;
const log = [];

for (const q of questions) {
  const a = answers[q.id];
  if (!a || !a.responses || !a.responses.length) {
    skipped++;
    continue;
  }
  // Compute majority excluding "dunno" votes
  const valid = a.responses.filter((r) => r.chosen_value !== 'dunno');
  if (!valid.length) { skipped++; continue; }
  const votes = {};
  for (const r of valid) {
    const k = String(r.chosen_value);
    votes[k] = (votes[k] || 0) + 1;
  }
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const winnerVal = sorted[0][0];
  const winnerCount = sorted[0][1];
  const totalValid = valid.length;

  // Only apply if 50%+ majority
  if (winnerCount / totalValid < 0.5) {
    log.push(`⚠ ${q.id}: no majority (${winnerCount}/${totalValid}), skipping`);
    skipped++;
    continue;
  }

  // Apply based on field
  const field = q.field;
  if (!field || field === 'note_only') {
    log.push(`ℹ ${q.id}: note-only field, skipping write (winner: ${winnerVal})`);
    applied++;
    continue;
  }

  // Pattern-based replacement
  let newHtml = html;
  let didChange = false;

  // PROTOTYPE_AUGMENTS.<key>.max
  let m = /^PROTOTYPE_AUGMENTS\.(\w+)\.(init|max|per)$/.exec(field);
  if (m) {
    const [, key, prop] = m;
    const re = new RegExp(`(${key}:\\{[^}]*\\b${prop}:)([\\d.]+)`, 'g');
    const replaced = html.replace(re, (full, prefix, oldVal) => {
      if (parseFloat(oldVal) !== parseFloat(winnerVal)) {
        log.push(`✏ ${q.id}: ${field} ${oldVal} → ${winnerVal}`);
        didChange = true;
      }
      return prefix + winnerVal;
    });
    if (didChange) newHtml = replaced;
  }

  // shd-<stat> input default value
  m = /^shd-(\w+)$/.exec(field);
  if (m) {
    const id = field;
    const re = new RegExp(`(<input id="${id}" value=")([^"]+)(")`, 'g');
    const replaced = html.replace(re, (full, prefix, oldVal, suffix) => {
      if (oldVal !== winnerVal) {
        log.push(`✏ ${q.id}: ${field} default ${oldVal} → ${winnerVal}`);
        didChange = true;
      }
      return prefix + winnerVal + suffix;
    });
    if (didChange) newHtml = replaced;
  }

  // ESCALATION_TIERS.<tier>.<prop>
  m = /^ESCALATION_TIERS\.(\d+)\.(\w+)$/.exec(field);
  if (m) {
    const [, tier, prop] = m;
    const re = new RegExp(`("${tier}":\\{[^}]*${prop}:)(\\d+)`, 'g');
    const replaced = html.replace(re, (full, prefix, oldVal) => {
      if (oldVal !== winnerVal) {
        log.push(`✏ ${q.id}: ${field} ${oldVal} → ${winnerVal}`);
        didChange = true;
      }
      return prefix + winnerVal;
    });
    if (didChange) newHtml = replaced;
  }

  // WPNS_BASE.<weapon name>.dmg
  m = /^WPNS_BASE\.(.+)\.dmg$/.exec(field);
  if (m) {
    const wname = m[1];
    // Match {id:"...",name:"<wname>",...,dmg:NUMBER
    const re = new RegExp(`(\\{id:"[^"]+",name:"${wname.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"[^}]*?dmg:)(\\d+)`, 'g');
    const replaced = html.replace(re, (full, prefix, oldVal) => {
      if (oldVal !== winnerVal) {
        log.push(`✏ ${q.id}: ${wname} damage ${oldVal} → ${winnerVal}`);
        didChange = true;
      }
      return prefix + winnerVal;
    });
    if (didChange) newHtml = replaced;
  }

  if (didChange) {
    html = newHtml;
    changed++;
  }
  applied++;
}

console.log(log.join('\n'));
console.log(`\nProcessed: ${applied} applied, ${skipped} skipped, ${changed} actual writes`);

if (dryRun) {
  console.log('(dry run — no file changes)');
} else if (changed > 0) {
  fs.writeFileSync(HTML_PATH, html, 'utf8');
  console.log(`Written ${HTML_PATH}`);
}
