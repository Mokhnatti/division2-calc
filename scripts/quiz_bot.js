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
    category: '🧪 Prototype Augment',
    question: 'Аугмент <b>Trapper</b> — увеличивает длительность статус-эффектов.\n\nЕсть расхождение в источниках какое макс значение на 10-м уровне прокачки:',
    options: [
      { label: '14% макс (5% → 14% шагом 1%)', value: 14, source: 'reddit_bddfr', detail: 'Reddit TU28 datamine + BDDFr talents-prototypes.jsonc' },
      { label: '22% макс (4% → 22% шагом 1.8%)', value: 22, source: 'div2hub', detail: 'div2hub/data augments.csv (апрель 2026)' },
      { label: 'Другое значение', value: 0, source: 'other' },
    ],
    field: 'PROTOTYPE_AUGMENTS.trapper.max',
  },
  {
    id: 'shd_chd',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Crit Damage</b> атрибут.\n\nСколько максимум % даёт полностью прокачанный CHD-узел в часах (50/50 очков)?',
    options: [
      { label: '20% макс (step 0.4%, 50 × 0.4)', value: 20, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.4' },
      { label: '30% макс (моя оценка из памяти)', value: 30, source: 'hand', detail: 'Моё предположение, может быть устаревшее' },
      { label: 'Что-то другое', value: 0, source: 'other' },
    ],
    field: 'shd-chd',
  },
  {
    id: 'shd_hsd',
    category: '⌚ SHD Watch',
    question: 'Часы SHD — <b>Headshot Damage</b> атрибут.\n\nСколько максимум % даёт полностью прокачанный HSD-узел (50/50)?',
    options: [
      { label: '20% макс (step 0.4%, 50 × 0.4)', value: 20, source: 'bddfr', detail: 'BDDFr montre.jsonc — ratio 0.4' },
      { label: '10% макс (step 0.2%, 50 × 0.2)', value: 10, source: 'hand', detail: 'Моё старое значение' },
      { label: 'Что-то другое', value: 0, source: 'other' },
    ],
    field: 'shd-hsd',
  },
  {
    id: 'escalation_t10_hp',
    category: '⚔ Escalation Tier 10',
    question: 'Новый режим <b>Escalation</b> в Y8S1 — максимальный Tier 10.\n\nНа сколько % увеличено HP врагов на 10-м тире?',
    options: [
      { label: '+700% (800% от базы)', value: 700, source: 'reddit', detail: 'Reddit TU28 datamine — таблица из r/thedivision' },
      { label: '+800% (900% от базы)', value: 800, source: 'reddit2', detail: 'Альтернативное значение' },
      { label: '+600% (700% от базы)', value: 600, source: 'hand', detail: 'Старое значение до datamine' },
    ],
    field: 'ESCALATION_TIERS.10.hp',
  },
  {
    id: 'weapon_dmg_cap',
    category: '📊 DPS Математика',
    question: 'Какой soft cap на <b>Weapon Damage bucket</b> в игре?\n\n(Общая сумма всех WD-бонусов — бренды + атрибуты + SHD + таланты)',
    options: [
      { label: '+800% cap (без хедшот-бонуса)', value: 800, source: 'reddit', detail: 'Community consensus — от reddit дискуссий' },
      { label: '+1250% cap (при HSD > 150%)', value: 1250, source: 'reddit2', detail: 'С Perfect Headhunter — особое условие' },
      { label: 'Нет soft cap', value: 0, source: 'none', detail: 'Стекается бесконечно' },
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

function buildMessage(q) {
  const optDetails = q.options.map((o, i) => {
    const detail = o.detail ? `\n<i>   ${o.detail}</i>` : '';
    return `${i + 1}️⃣ <b>${o.label}</b>${detail}`;
  }).join('\n\n');
  return `${q.category}\n\n${q.question}\n\n${optDetails}\n\n<i>Жми правильный вариант кнопкой 👇</i>`;
}

async function send() {
  // Force refresh DEFAULT_QUESTIONS to file
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(DEFAULT_QUESTIONS, null, 2), 'utf8');
  const questions = loadQuestions();
  const answers = loadAnswers();
  let sent = 0;
  let edited = 0;
  for (const q of questions) {
    const kb = {
      inline_keyboard: q.options.map((opt, i) => [{
        text: `${i + 1}️⃣ ${opt.label.slice(0, 60)}`,
        callback_data: `q:${q.id}:${i}`,
      }]),
    };
    const text = buildMessage(q);
    const existing = answers[q.id];
    if (existing && existing.message_id && existing.status !== 'answered') {
      // Edit existing pending message
      const r = await fetchJson(`${API_BASE}/editMessageText`, 'POST', {
        chat_id: CHAT_ID,
        message_id: existing.message_id,
        text,
        parse_mode: 'HTML',
        reply_markup: kb,
      });
      if (r.ok) {
        edited++;
        console.log(`✎ Edited: ${q.id}`);
      } else {
        // If edit fails (message too old etc), send new
        const r2 = await fetchJson(`${API_BASE}/sendMessage`, 'POST', {
          chat_id: CHAT_ID, text, parse_mode: 'HTML', reply_markup: kb,
        });
        if (r2.ok) {
          sent++;
          console.log(`✓ Sent new (edit failed): ${q.id}`);
          answers[q.id] = { message_id: r2.result.message_id, status: 'pending' };
        }
      }
    } else if (!existing || existing.status !== 'answered') {
      const r = await fetchJson(`${API_BASE}/sendMessage`, 'POST', {
        chat_id: CHAT_ID, text, parse_mode: 'HTML', reply_markup: kb,
      });
      if (r.ok) {
        sent++;
        console.log(`✓ Sent: ${q.id}`);
        answers[q.id] = { message_id: r.result.message_id, status: 'pending' };
      } else {
        console.log(`✗ Failed: ${q.id}`, r);
      }
    }
  }
  saveAnswers(answers);
  console.log(`\nSent: ${sent}, Edited: ${edited}. Run 'node scripts/quiz_bot.js poll' to collect answers.`);
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
