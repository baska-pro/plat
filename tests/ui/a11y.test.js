'use strict';
/*
 * Tes aksesibilitas (axe-core + Playwright). Jalankan: npm run test:ui
 * Memeriksa WCAG 2.0/2.1 A dan AA di setiap tab, mode terang dan gelap, lebar ponsel dan desktop.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');

const PORT = 8768;
const BASE = 'http://localhost:' + PORT + '/';
const AXE = require.resolve('axe-core/axe.min.js');
let server, browser;

test.before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', '..', 'scripts', 'serve.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => { if (String(d).includes('berjalan')) resolve(); });
    server.on('error', reject);
    setTimeout(() => reject(new Error('server tidak naik')), 8000);
  });
  browser = await chromium.launch();
});

test.after(async () => {
  if (browser) await browser.close();
  if (server) server.kill();
});

async function audit(page) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  return res.violations.map((v) => v.id + ' (' + v.impact + '): ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | '));
}

const STATES = {
  'hasil plat D': async (p) => { await p.fill('#plate-input', 'D 5002 FA'); await p.waitForSelector('.slip'); },
  'hasil ambigu': async (p) => { await p.fill('#plate-input', 'D 1234 WA'); await p.waitForSelector('.slip'); },
  'hasil plat B': async (p) => { await p.fill('#plate-input', 'B 1234 SKA'); await p.waitForSelector('.slip'); },
  'banyak sekaligus': async (p) => { await p.click('#tab-banyak'); },
  'peta huruf': async (p) => { await p.click('#tab-ref'); },
  'soal akurasi': async (p) => { await p.click('#tab-info'); },
  'kuis': async (p) => { await p.click('#open-game'); await p.click('#g-start'); await p.click('.g-opt >> nth=0'); },
  'pencarian daerah': async (p) => { await p.fill('#where-input', 'bekasi'); await p.waitForSelector('#where-out *'); }
};

for (const [scheme, width, height] of [['light', 1280, 900], ['dark', 390, 844]]) {
  for (const [name, setup] of Object.entries(STATES)) {
    test('a11y: ' + name + ' (' + scheme + ', ' + width + 'px)', async () => {
      const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
      const page = await ctx.newPage();
      try {
        await page.goto(BASE);
        await page.evaluate(() => document.fonts.ready);
        await setup(page);
        await page.waitForTimeout(250);
        const violations = await audit(page);
        assert.deepEqual(violations, []);
      } finally {
        await ctx.close();
      }
    });
  }
}
