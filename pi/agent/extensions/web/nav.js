#!/usr/bin/env node
const { chromium } = require('playwright-core');
const { readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const url = process.argv[2];
  if (!url) throw new Error('Usage: nav.js <url>');

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  const pages = context.pages();
  const page = pages[pages.length - 1] || await context.newPage();
  try {
    const { width, height } = JSON.parse(readFileSync(join(tmpdir(), 'pi-browser-state.json'), 'utf8'));
    if (Number.isFinite(width) && Number.isFinite(height)) {
      await page.setViewportSize({ width, height });
    }
  } catch {}

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`Navigated: ${page.url()}`);
  await browser.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
