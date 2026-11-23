'use strict';
// Membuat ikon PNG dan screenshot manifest dari icons/icon.svg dan aplikasi itu sendiri.
// Butuh Playwright (devDependency): npm run build:icons
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'icons', 'icon.svg'), 'utf8');
const SIZES = { 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512, 'apple-touch-icon.png': 180, 'favicon-32.png': 32 };

(async () => {
  const browser = await chromium.launch();
  for (const [name, size] of Object.entries(SIZES)) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent('<style>html,body{margin:0}svg{display:block;width:' + size + 'px;height:' + size + 'px}</style>' + svg);
    await page.screenshot({ path: path.join(ROOT, 'icons', name), omitBackground: false });
    await page.close();
  }

  const server = spawn(process.execPath, [path.join(__dirname, 'serve.js')], { env: { ...process.env, PORT: '8767' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve) => server.stdout.on('data', (d) => String(d).includes('berjalan') && resolve()));
  for (const [name, w, h] of [['shot-wide.png', 1280, 720], ['shot-narrow.png', 540, 960]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('http://localhost:8767/?plat=D+5002+FA');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.slip');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ROOT, 'icons', name) });
    await page.close();
  }
  server.kill();
  await browser.close();
})();
