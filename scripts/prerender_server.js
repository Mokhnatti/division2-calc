#!/usr/bin/env node
/**
 * Bot prerender service for divcalc.xyz SPA.
 *
 * Caddy matches Googlebot/Bingbot/YandexBot/etc by UA on /spa/* and reverse-proxies
 * here. We launch headless Chrome via Puppeteer, wait for SPA to settle, return HTML.
 * Cached on disk for 24h.
 *
 * Run on VPS:
 *   pm2 start scripts/prerender_server.js --name prerender
 * Listens on 127.0.0.1:3001.
 *
 * Deps (install on VPS): npm i express puppeteer
 */
import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = parseInt(process.env.PRERENDER_PORT || '3001', 10);
const ORIGIN = process.env.PRERENDER_ORIGIN || 'https://divcalc.xyz';
const CACHE_DIR = process.env.PRERENDER_CACHE || '/var/cache/prerender';
const TTL_MS = 24 * 60 * 60 * 1000;
const NAV_TIMEOUT = 15000;
const SETTLE_MS = 800;

await fs.mkdir(CACHE_DIR, { recursive: true });

let browser;
async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  }
  return browser;
}

function cachePath(url) {
  const h = crypto.createHash('sha1').update(url).digest('hex');
  return path.join(CACHE_DIR, `${h}.html`);
}

async function fromCache(url) {
  try {
    const p = cachePath(url);
    const stat = await fs.stat(p);
    if (Date.now() - stat.mtimeMs > TTL_MS) return null;
    return await fs.readFile(p, 'utf8');
  } catch { return null; }
}

async function saveCache(url, html) {
  try { await fs.writeFile(cachePath(url), html, 'utf8'); }
  catch (e) { console.error('cache write failed:', e.message); }
}

async function render(url) {
  const cached = await fromCache(url);
  if (cached) return { html: cached, cached: true };

  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setUserAgent('divcalc-prerender/1.0 (+https://divcalc.xyz)');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const t = req.resourceType();
      if (t === 'image' || t === 'media' || t === 'font') req.abort();
      else req.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    const html = await page.content();
    await saveCache(url, html);
    return { html, cached: false };
  } finally {
    await page.close();
  }
}

const app = express();

app.get('/healthz', (_req, res) => res.json({ ok: true, cached_dir: CACHE_DIR }));

app.get(/.*/, async (req, res) => {
  const url = `${ORIGIN}${req.originalUrl}`;
  console.log(`[prerender] ${url}`);
  try {
    const { html, cached } = await render(url);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Prerender-Cache', cached ? 'HIT' : 'MISS');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(html);
  } catch (e) {
    console.error(`[prerender] failed ${url}:`, e.message);
    res.status(502).send(`<!doctype html><title>prerender error</title><p>${e.message}</p>`);
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`prerender listening on 127.0.0.1:${PORT} → ${ORIGIN}`);
});

process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit(0);
});
