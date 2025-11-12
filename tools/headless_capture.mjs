#!/usr/bin/env node
// tools/headless_capture.mjs
// Load a page with Puppeteer, capture console messages, page errors and network failures.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const OUT_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = path.join(OUT_DIR, `console-${Date.now()}.log`);
const url = process.argv[2] || 'http://127.0.0.1:8000/';
const timeout = Number(process.argv[3]) || 20000; // ms to wait and capture

(async () => {
  const out = fs.createWriteStream(OUT_FILE, { flags: 'a' });
  function write(...args) {
    const line = `[${new Date().toISOString()}] ` + args.join(' ') + '\n';
    process.stdout.write(line);
    out.write(line);
  }

  write('Starting headless capture for', url, 'timeout(ms)=', timeout);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    const args = msg.args();
    Promise.all(args.map(a => a.jsonValue().catch(() => a.toString())))
      .then(values => write('CONSOLE', msg.type().toUpperCase(), values.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(' ')));
  });

  page.on('pageerror', err => write('PAGEERROR', err.stack || err.message || String(err)));
  page.on('error', err => write('ERROR', err.stack || err.message || String(err)));

  page.on('requestfailed', req => write('REQUESTFAILED', req.url(), req.failure() && req.failure().errorText));

  // capture network responses with non-2xx
  page.on('response', async res => {
    try {
      const status = res.status();
      if (status >= 400) {
        write('BADRESPONSE', status, res.url());
      }
    } catch (e) { /* ignore */ }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    write('PAGE_LOADED', url);
  } catch (e) {
    write('GOTO_ERROR', e.message || String(e));
  }

  // wait and capture
  write('Capturing logs for', timeout, 'ms...');
  await new Promise(r => setTimeout(r, timeout));

  write('Done capturing, closing browser. Log file at', OUT_FILE);
  await browser.close();
  out.end();
})();
