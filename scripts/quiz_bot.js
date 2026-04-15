#!/usr/bin/env node
// Quiz bot for resolving data conflicts via Telegram
// Sends inline-keyboard questions to user, polls for answers, saves to quiz_answers.json
//
// Usage:
//   node scripts/quiz_bot.js send   — send all unanswered questions to Telegram
//   node scripts/quiz_bot.js poll   — long-poll for answers (60s timeout)
//   node scripts/quiz_bot.js status — show answered/pending counts

const fs = require('fs');
const https = require('https');
const path = require('path');

const BOT_TOKEN = '8331760919:AAEC5-sqK3pd7kqikLNNkZxzgAMBl7VOWCI'; // @Mokhnatticlaud_bot
const CHAT_ID = 398299572;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

const QUESTIONS_FILE = path.join(__dirname, '..', 'data_sources', 'quiz_questions.json');
const ANSWERS_FILE = path.join(__dirname, '..', 'data_sources', 'quiz_answers.json');

// Default conflicts list (updated programmatically by finder later)
const DEFAULT_QUESTIONS = [
  {
    id: 'trapper_max',
    category: 'Prototype Augment',
    question: 'Trapper augment — макс значение на 10-м уровне?',
    options: [
      { label: '14% (Reddit datamine + BDDFr)', value: 14, source: 'reddit_bddfr' },
      { label: '22% (div2hub/data CSV)', value: 22, source: 'div2hub' },
    ],
    field: 'PROTOTYPE_AUGMENTS.trapper.max',
  },
  {
    id: 'shd_chd',
    category: 'SHD Watch',
    question: 'SHD Watch Critical Damage — макс на 50 очков?',
    options: [
      { label: '20% (BDDFr montre.jsonc, ratio 0.4)', value: 20, source: 'bddfr' },
      { label: '30% (моё предположение)', value: 30, source: 'hand' },
    ],
    field: 'shd-chd',
  },
  {
    id: 'shd_hsd',
    category: 'SHD Watch',
    question: 'SHD Watch Headshot Damage — макс на 50 очков?',
    options: [
      { label: '20% (BDDFr, ratio 0.4)', value: 20, source: 'bddfr' },
      { label: '10% (моё предположение)', value: 10, source: 'hand' },
    ],
    field: 'shd-hsd',
  },
  {
    id: 'escalation_t10_hp',
    category: 'Escalation Tier 10',
    question: 'Escalation Tier 10 — множитель HP врагов?',
    options: [
      { label: '800% (Reddit TU28 datamine)', value: 800, source: 'reddit' },
      { label: '700% (мой текущий код после -100%)', value: 700, source: 'hand' },
      { label: '900% (Ubisoft PTS)', value: 900, source: 'ubisoft' },
    ],
    field: 'ESCALATION_TIERS.10.hp',
  },
  {
    id: 'weapon_dmg_cap',
    category: 'DPS Math',
    question: 'Weapon Damage bucket soft cap (до HSD > 150%)?',
    options: [
      { label: '800% (из Reddit community consensus)', value: 800, source: 'reddit' },
      { label: '1250% (с HSD > 150%)', value: 1250, source: 'reddit2' },
      { label: 'Нет cap (unlimited stacking)', value: 0, source: 'none' },
    ],
    field: 'note_only',
  },
];

function fetchJson(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method,
      headers: {},
    };
    if (body) {
      const json = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(json);
    }
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function loadQuestions() {
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(DEFAULT_QUESTIONS, null, 2), 'utf8');
    console.log('Initialized quiz_questions.json with defaults');
  }
  return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
}

function loadAnswers() {
  if (!fs.existsSync(ANSWERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8'));
}

function saveAnswers(a) {
  fs.writeFileSync(ANSWERS_FILE, JSON.stringify(a, null, 2), 'utf8');
}

async function send() {
  const questions = loadQuestions();
  const answers = loadAnswers();
  let sent = 0;
  for (const q of questions) {
    if (answers[q.id]) continue;
    const kb = {
      inline_keyboard: q.options.map((opt, i) => [{
        text: opt.label,
        callback_data: `q:${q.id}:${i}`,
      }]),
    };
    const text = `🧪 <b>Спорное значение</b>\n\n<b>${q.category}</b>\n\n${q.question}\n\n<i>Жми правильный вариант 👇</i>`;
    const r = await fetchJson(`${API_BASE}/sendMessage`, 'POST', {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: kb,
    });
    if (r.ok) {
      sent++;
      console.log(`✓ Sent: ${q.id}`);
      answers[q.id] = { message_id: r.result.message_id, status: 'pending' };
    } else {
      console.log(`✗ Failed: ${q.id}`, r);
    }
  }
  saveAnswers(answers);
  console.log(`\nTotal sent: ${sent}. Run 'node scripts/quiz_bot.js poll' to collect answers.`);
}

async function poll() {
  const questions = loadQuestions();
  const answers = loadAnswers();
  const qMap = Object.fromEntries(questions.map((q) => [q.id, q]));

  let offset = answers.__offset || 0;
  const endTime = Date.now() + 120000; // 2 min timeout
  console.log('Polling for answers (up to 2 min)...');

  while (Date.now() < endTime) {
    const r = await fetchJson(
      `${API_BASE}/getUpdates?offset=${offset}&timeout=10`,
      'GET'
    );
    if (!r.ok) {
      console.log('Error:', r);
      break;
    }
    for (const u of r.result) {
      offset = u.update_id + 1;
      if (u.callback_query) {
        const cq = u.callback_query;
        const data = cq.data || '';
        const m = /^q:([^:]+):(\d+)$/.exec(data);
        if (m) {
          const [, qid, optIdx] = m;
          const q = qMap[qid];
          if (q && q.options[optIdx]) {
            const chosen = q.options[optIdx];
            answers[qid] = {
              ...(answers[qid] || {}),
              status: 'answered',
              chosen_index: parseInt(optIdx),
              chosen_value: chosen.value,
              chosen_source: chosen.source,
              answered_at: new Date().toISOString(),
            };
            console.log(`✓ ${qid} → ${chosen.label}`);
            // Confirm to user
            await fetchJson(`${API_BASE}/answerCallbackQuery`, 'POST', {
              callback_query_id: cq.id,
              text: '✓ Принято: ' + chosen.label,
            });
            // Edit original message
            if (answers[qid].message_id) {
              await fetchJson(`${API_BASE}/editMessageText`, 'POST', {
                chat_id: CHAT_ID,
                message_id: answers[qid].message_id,
                text: `✅ <b>${q.category}</b>\n\n${q.question}\n\n<b>Ответ:</b> ${chosen.label}`,
                parse_mode: 'HTML',
              });
            }
          }
        }
      }
    }
    answers.__offset = offset;
    saveAnswers(answers);
    // Check if all answered
    const pending = questions.filter((q) => (answers[q.id] || {}).status !== 'answered');
    if (pending.length === 0) {
      console.log('All questions answered!');
      break;
    }
  }

  const answered = questions.filter((q) => (answers[q.id] || {}).status === 'answered').length;
  console.log(`\nStatus: ${answered}/${questions.length} answered`);
}

function status() {
  const questions = loadQuestions();
  const answers = loadAnswers();
  for (const q of questions) {
    const a = answers[q.id];
    if (a && a.status === 'answered') {
      console.log(`✓ ${q.id}: ${a.chosen_value} (${a.chosen_source})`);
    } else {
      console.log(`○ ${q.id}: pending`);
    }
  }
  const answered = questions.filter((q) => (answers[q.id] || {}).status === 'answered').length;
  console.log(`\n${answered}/${questions.length} answered`);
}

const cmd = process.argv[2];
if (cmd === 'send') send();
else if (cmd === 'poll') poll();
else if (cmd === 'status') status();
else {
  console.log('Usage: node scripts/quiz_bot.js [send|poll|status]');
}
