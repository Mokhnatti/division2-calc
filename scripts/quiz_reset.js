#!/usr/bin/env node
// Reset quiz state: delete all pending messages from Telegram, clear answers, start fresh
// Usage: node scripts/quiz_reset.js

const fs = require('fs');
const https = require('https');
const path = require('path');

const BOT_TOKEN = '8331760919:AAEC5-sqK3pd7kqikLNNkZxzgAMBl7VOWCI';
const CHAT_ID = 398299572;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ROOT = path.join(__dirname, '..');
const ANSWERS_FILE = path.join(ROOT, 'data_sources', 'quiz_answers.json');

function httpReq(url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers: {},
    };
    if (body) {
      const json = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(json);
    }
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false }); } });
    });
    req.on('error', () => resolve({ ok: false }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const answers = fs.existsSync(ANSWERS_FILE) ? JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8')) : {};
  // Collect all message_ids to delete
  const toDelete = new Set();
  for (const [qid, data] of Object.entries(answers)) {
    if (qid === '__offset') continue;
    if (data.message_id) toDelete.add(data.message_id);
    if (data.user_messages) {
      for (const mid of Object.values(data.user_messages)) toDelete.add(mid);
    }
  }

  console.log(`Deleting ${toDelete.size} messages from chat ${CHAT_ID}...`);
  let deleted = 0;
  for (const mid of toDelete) {
    const r = await httpReq(`${API}/deleteMessage`, 'POST', { chat_id: CHAT_ID, message_id: mid });
    if (r.ok) deleted++;
    // Small delay to avoid rate limit
    await new Promise((res) => setTimeout(res, 50));
  }
  console.log(`Deleted ${deleted}/${toDelete.size}`);

  // Clear answers (keep structure for current questions)
  fs.writeFileSync(ANSWERS_FILE, '{}', 'utf8');
  console.log('Cleared quiz_answers.json');
  console.log('Send /start in Telegram to begin fresh.');
}

main();
