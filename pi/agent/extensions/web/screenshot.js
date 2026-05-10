#!/usr/bin/env node
const { readFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname, resolve } = require('node:path');
const { chromium } = require('playwright-core');

(async () => {
  const outArg = process.argv[2];
  if (!outArg) throw new Error('Usage: screenshot.js <path>');
  const outPath = resolve(outArg);

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

  mkdirSync(dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath });
  console.log(outPath);
  await browser.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
