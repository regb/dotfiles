#!/usr/bin/env node
const { chromium } = require('playwright-core');

(async () => {
  const expr = process.argv[2];
  if (!expr) throw new Error("Usage: eval.js '<js>'");

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  const pages = context.pages();
  const page = pages[pages.length - 1] || await context.newPage();

  const value = await page.evaluate(async (code) => {
    return await (0, eval)(code);
  }, expr);

  console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  await browser.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
