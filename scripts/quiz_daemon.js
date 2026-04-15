#!/usr/bin/env node
// Quiz daemon — runs forever, polls Telegram, saves answers, auto-commits.
// Designed to run as systemd service on VPS.
//
// Features:
// - Long-polling for callback_query and messages
// - Saves answers to data_sources/quiz_answers.json
// - Auto-commits and pushes every N answers (or timer)
// - Multi-user: tracks per-user responses (for friend forwarding)
// - /start, /progress, /stats commands
// - Handles /translate requests to find Russian names
//
// Env vars (optional):
//   BOT_TOKEN — override default bot token
//   TELEGRAM_CHAT_ID — default chat to send new questions

const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const BOT_TOKEN = process.env.BOT_TOKEN || '8331760919:AAEC5-sqK3pd7kqikLNNkZxzgAMBl7VOWCI';
const CHAT_ID = parseInt(process.env.TELEGRAM_CHAT_ID || '398299572');
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const REPO_ROOT = path.join(__dirname, '..');
const QUESTIONS_FILE = path.join(REPO_ROOT, 'data_sources', 'quiz_questions.json');
const ANSWERS_FILE = path.join(REPO_ROOT, 'data_sources', 'quiz_answers.json');
const STATE_FILE = path.join(REPO_ROOT, 'data_sources', 'quiz_state.json');
const LOG_FILE = '/var/log/quiz_daemon.log';

// Commit settings
const AUTO_COMMIT_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const AUTO_COMMIT_BATCH_SIZE = 3; // commit after 3 answers

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* non-fatal */ }
}

function loadJson(p, def) {
  if (!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return def; }
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function httpReq(url, method = 'GET', body = null) {
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
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false, error: e.message }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let state = loadJson(STATE_FILE, { offset: 0, last_commit: 0, uncommitted_count: 0 });
let pendingCommit = false;
let lastCommitTime = Date.now();

function gitCommit() {
  if (pendingCommit) return;
  pendingCommit = true;
  try {
    const hasChanges = execSync('git -C ' + REPO_ROOT + ' status --porcelain data_sources/quiz_answers.json', { encoding: 'utf8' }).trim();
    if (!hasChanges) {
      log('gitCommit: no changes');
      pendingCommit = false;
      return;
    }
    execSync(`git -C "${REPO_ROOT}" add data_sources/quiz_answers.json`, { stdio: 'pipe' });
    execSync(`git -C "${REPO_ROOT}" -c user.name=quiz-bot -c user.email=bot@divcalc.xyz commit -m "Quiz answers auto-commit [skip ci]"`, { stdio: 'pipe' });
    execSync(`git -C "${REPO_ROOT}" push origin master`, { stdio: 'pipe' });
    log('gitCommit: pushed');
    state.last_commit = Date.now();
    state.uncommitted_count = 0;
    saveJson(STATE_FILE, state);
  } catch (e) {
    log('gitCommit ERROR: ' + e.message);
  }
  pendingCommit = false;
}

function buildMessage(q) {
  const optDetails = q.options.map((o, i) => {
    const detail = o.detail ? `\n<i>   ${o.detail}</i>` : '';
    return `${i + 1}️⃣ <b>${o.label}</b>${detail}`;
  }).join('\n\n');
  return `${q.category}\n\n${q.question}\n\n${optDetails}\n\n<i>Жми правильный вариант кнопкой 👇</i>`;
}

function buildKeyboard(q) {
  return {
    inline_keyboard: q.options.map((opt, i) => [{
      text: `${i + 1}️⃣ ${opt.label.slice(0, 60)}`,
      callback_data: `q:${q.id}:${i}`,
    }]),
  };
}

async function handleCallback(cq) {
  const data = cq.data || '';
  const m = /^q:([^:]+):(\d+)$/.exec(data);
  if (!m) {
    // Unknown callback
    await httpReq(`${API}/answerCallbackQuery`, 'POST', {
      callback_query_id: cq.id,
      text: 'Неизвестная команда',
    });
    return;
  }

  const [, qid, optIdx] = m;
  const questions = loadJson(QUESTIONS_FILE, []);
  const q = questions.find((x) => x.id === qid);
  if (!q) {
    await httpReq(`${API}/answerCallbackQuery`, 'POST', {
      callback_query_id: cq.id,
      text: 'Вопрос устарел',
    });
    return;
  }

  const chosen = q.options[parseInt(optIdx)];
  if (!chosen) {
    await httpReq(`${API}/answerCallbackQuery`, 'POST', {
      callback_query_id: cq.id,
      text: 'Неверный вариант',
    });
    return;
  }

  const answers = loadJson(ANSWERS_FILE, {});
  const userId = cq.from.id;
  const userName = cq.from.first_name || cq.from.username || String(userId);

  // Multi-user tracking: store all responses per question
  if (!answers[qid]) answers[qid] = { responses: [] };
  if (!Array.isArray(answers[qid].responses)) answers[qid].responses = [];

  // Check if this user already answered
  const existing = answers[qid].responses.find((r) => r.user_id === userId);
  if (existing) {
    existing.chosen_index = parseInt(optIdx);
    existing.chosen_value = chosen.value;
    existing.chosen_source = chosen.source;
    existing.answered_at = new Date().toISOString();
  } else {
    answers[qid].responses.push({
      user_id: userId,
      user_name: userName,
      chosen_index: parseInt(optIdx),
      chosen_value: chosen.value,
      chosen_source: chosen.source,
      answered_at: new Date().toISOString(),
    });
  }

  // Calculate majority (most-voted value)
  const votes = {};
  for (const r of answers[qid].responses) {
    const key = r.chosen_value;
    votes[key] = (votes[key] || 0) + 1;
  }
  const majorityValue = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  answers[qid].majority_value = majorityValue ? parseFloat(majorityValue[0]) : null;
  answers[qid].majority_votes = majorityValue ? majorityValue[1] : 0;
  answers[qid].total_votes = answers[qid].responses.length;
  answers[qid].status = 'answered';
  if (cq.message && cq.message.message_id) {
    answers[qid].message_id = cq.message.message_id;
  }

  saveJson(ANSWERS_FILE, answers);
  log(`answer: ${qid} → ${chosen.label} by ${userName} (${answers[qid].total_votes} votes)`);

  // Acknowledge to user
  await httpReq(`${API}/answerCallbackQuery`, 'POST', {
    callback_query_id: cq.id,
    text: '✓ Принято: ' + chosen.label.slice(0, 60),
  });

  // Edit message to show result
  if (cq.message && cq.message.message_id) {
    const voteText = answers[qid].responses.map((r) => {
      const opt = q.options[r.chosen_index];
      return `  ${r.user_name}: ${opt ? opt.label : '?'}`;
    }).join('\n');
    const text = `${q.category}\n\n${q.question}\n\n<b>Голоса (${answers[qid].total_votes}):</b>\n${voteText}\n\n<i>Можно сменить ответ — кнопки ниже 👇</i>`;
    await httpReq(`${API}/editMessageText`, 'POST', {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      text,
      parse_mode: 'HTML',
      reply_markup: buildKeyboard(q),
    });
  }

  state.uncommitted_count++;
  saveJson(STATE_FILE, state);
  if (state.uncommitted_count >= AUTO_COMMIT_BATCH_SIZE) {
    setImmediate(gitCommit);
  }
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim();
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || msg.from.username || '';

  if (text === '/start') {
    const welcomeText = `👋 Привет, ${userName}!\n\n` +
      `Это <b>Division 2 Calc Quiz Bot</b>.\n\n` +
      `Помоги разрешить спорные значения данных в калькуляторе <a href="https://divcalc.xyz">divcalc.xyz</a>.\n\n` +
      `Команды:\n` +
      `• /questions — все активные вопросы\n` +
      `• /progress — сколько отвечено\n` +
      `• /new — новые вопросы`;
    await httpReq(`${API}/sendMessage`, 'POST', {
      chat_id: chatId, text: welcomeText, parse_mode: 'HTML',
    });
    return;
  }

  if (text === '/progress' || text === '/stats') {
    const questions = loadJson(QUESTIONS_FILE, []);
    const answers = loadJson(ANSWERS_FILE, {});
    const answered = questions.filter((q) => (answers[q.id] || {}).status === 'answered').length;
    const lines = questions.map((q) => {
      const a = answers[q.id];
      if (a && a.status === 'answered') {
        const winner = q.options.find((o) => o.value === a.majority_value);
        return `✅ ${q.id}: ${winner ? winner.label.slice(0, 50) : a.majority_value} (${a.total_votes} голос)`;
      }
      return `○ ${q.id}: pending`;
    });
    await httpReq(`${API}/sendMessage`, 'POST', {
      chat_id: chatId,
      text: `<b>Прогресс: ${answered}/${questions.length}</b>\n\n${lines.join('\n')}`,
      parse_mode: 'HTML',
    });
    return;
  }

  if (text === '/questions' || text === '/new') {
    const questions = loadJson(QUESTIONS_FILE, []);
    const answers = loadJson(ANSWERS_FILE, {});
    let sent = 0;
    for (const q of questions) {
      // Check if THIS user already voted
      const existing = answers[q.id] && answers[q.id].responses && answers[q.id].responses.find((r) => r.user_id === msg.from.id);
      if (existing) continue;
      await httpReq(`${API}/sendMessage`, 'POST', {
        chat_id: chatId,
        text: buildMessage(q),
        parse_mode: 'HTML',
        reply_markup: buildKeyboard(q),
      });
      sent++;
    }
    if (sent === 0) {
      await httpReq(`${API}/sendMessage`, 'POST', {
        chat_id: chatId,
        text: '✓ Ты ответил на все вопросы. Спасибо!',
      });
    } else {
      log(`sent ${sent} questions to ${userName}`);
    }
    return;
  }

  // Fallback: short help
  if (text.startsWith('/')) {
    await httpReq(`${API}/sendMessage`, 'POST', {
      chat_id: chatId,
      text: 'Команды: /start, /questions, /progress',
    });
  }
}

async function pollLoop() {
  log('Quiz daemon started. Offset: ' + state.offset);
  while (true) {
    try {
      const r = await httpReq(`${API}/getUpdates?offset=${state.offset}&timeout=30`, 'GET');
      if (!r.ok) {
        log('getUpdates error: ' + JSON.stringify(r).slice(0, 200));
        await new Promise((res) => setTimeout(res, 5000));
        continue;
      }
      for (const u of r.result) {
        state.offset = u.update_id + 1;
        if (u.callback_query) {
          await handleCallback(u.callback_query);
        } else if (u.message) {
          await handleMessage(u.message);
        }
      }
      saveJson(STATE_FILE, state);

      // Periodic commit
      if (state.uncommitted_count > 0 && Date.now() - lastCommitTime > AUTO_COMMIT_INTERVAL_MS) {
        gitCommit();
        lastCommitTime = Date.now();
      }
    } catch (e) {
      log('pollLoop error: ' + e.message);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('SIGINT received, committing...');
  gitCommit();
  process.exit(0);
});
process.on('SIGTERM', () => {
  log('SIGTERM received, committing...');
  gitCommit();
  process.exit(0);
});

pollLoop().catch((e) => {
  log('FATAL: ' + e.stack);
  process.exit(1);
});
