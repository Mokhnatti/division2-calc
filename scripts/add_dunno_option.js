#!/usr/bin/env node
// Add "Не знаю" option to all quiz questions (idempotent)
const fs = require('fs');
const path = require('path');

const QF = path.join(__dirname, '..', 'data_sources', 'quiz_questions.json');
const questions = JSON.parse(fs.readFileSync(QF, 'utf8'));

let added = 0;
for (const q of questions) {
  if (!q.options.some((o) => o.value === 'dunno')) {
    q.options.push({
      label: '🤷 Не знаю / пропустить',
      value: 'dunno',
      source: 'dunno',
      detail: 'Твой голос не учитывается в подсчёте',
    });
    added++;
  }
}

fs.writeFileSync(QF, JSON.stringify(questions, null, 2), 'utf8');
console.log(`Added "Не знаю" to ${added}/${questions.length} questions`);
