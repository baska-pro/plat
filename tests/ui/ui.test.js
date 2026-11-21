'use strict';
/*
 * Tes antarmuka (Playwright + Chromium). Jalankan: npm run test:ui
 * Server statis dinyalakan otomatis di port 8765.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');

const PORT = 8765;
const BASE = 'http://localhost:' + PORT + '/';
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

async function open(width = 1280, height = 900, scheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
}

async function overflow(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.closest('.table-wrap') || el.closest('.tabs') || el.classList.contains('skip') || el.classList.contains('sr-only')) return;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > W + 1 || r.left < -1)) bad.push(el.tagName + '.' + el.className + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    });
    return bad.slice(0, 5);
  });
}

test('plat B: Jakarta Selatan, keyakinan tinggi, tautan koreksi tanpa nomor plat', async () => {
  const { ctx, page, errors } = await open();
  await page.fill('#plate-input', 'B 1234 SKA');
  await page.waitForSelector('.slip');
  const verdict = (await page.textContent('.verdict')).toLowerCase();
  assert.match(verdict, /jakarta selatan/);
  assert.equal(await page.locator('.stamp.tinggi').count(), 1);
  assert.match(await page.textContent('.ver'), /Dicek \d+ \w+ \d{4}/);
  const href = await page.getAttribute('#act-report', 'href');
  assert.match(href, /issues\/new\?template=koreksi-data\.yml/);
  assert.match(href, /kode=B/);
  assert.ok(!/1234/.test(href), 'nomor plat tidak boleh ikut terkirim');
  assert.ok(await page.locator('.samsat').count() >= 2, 'Samsat Jakarta tampil');
  assert.ok(await page.locator('text=Cek pajak lewat kanal resmi').count() >= 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('plat N huruf L: ambigu dengan dua kandidat', async () => {
  const { ctx, page } = await open();
  await page.fill('#plate-input', 'N 1234 LA');
  await page.waitForSelector('.slip');
  const verdict = (await page.textContent('.verdict')).toLowerCase();
  assert.match(verdict, /kota batu/);
  assert.match(verdict, /kabupaten probolinggo/);
  assert.equal(await page.locator('.stamp.rendah').count(), 1);
  await ctx.close();
});

test('plat D 5002 FA: Kota Bandung dengan tiga Samsat', async () => {
  const { ctx, page } = await open();
  await page.click('.ex[data-example="D 5002 FA"]');
  await page.waitForSelector('.slip');
  assert.match((await page.textContent('.verdict')).toLowerCase(), /kota bandung/);
  assert.equal(await page.locator('.slip-rest > section').filter({ has: page.locator('h2', { hasText: 'Samsat yang melayani' }) }).locator('.samsat').count(), 3);
  await ctx.close();
});

test('tautan ?plat= langsung menjalankan pengecekan', async () => {
  const { ctx, page } = await open();
  await page.goto(BASE + '?plat=AB+3456+EA');
  await page.waitForSelector('.slip');
  assert.match((await page.textContent('.verdict')).toLowerCase(), /sleman/);
  await ctx.close();
});

test('cari dari nama daerah lalu buka Peta huruf', async () => {
  const { ctx, page } = await open();
  await page.fill('#where-input', 'Cimahi');
  await page.waitForSelector('#where-out .found-row');
  assert.match(await page.textContent('#where-out'), /Kota Cimahi/);
  await page.click('#where-out .found-row');
  await page.waitForSelector('.atlas');
  assert.equal(await page.getAttribute('#tab-ref', 'aria-selected'), 'true');
  assert.match(await page.textContent('#readout'), /Cimahi/);
  await ctx.close();
});

test('mode banyak: tiga plat jadi tiga baris', async () => {
  const { ctx, page } = await open();
  await page.click('#tab-banyak');
  await page.fill('#bulk-input', 'D 5002 FA\nB 1234 SKA\nH 4821 AB');
  await page.click('#bulk-run');
  await page.waitForSelector('#bulk-result tbody tr');
  assert.equal(await page.locator('#bulk-result tbody tr').count(), 3);
  await ctx.close();
});

test('tab Akurasi memuat tabel status semua kode', async () => {
  const { ctx, page } = await open();
  await page.click('#tab-info');
  await page.waitForSelector('.vtable');
  assert.ok((await page.locator('.vtable tbody tr').count()) >= 50);
  await ctx.close();
});

test('kuis: 10 soal sampai skor akhir dan skor terbaik tersimpan', async () => {
  const { ctx, page, errors } = await open();
  await page.click('#open-game');
  await page.click('#g-start');
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.g-opt:not([disabled])');
    assert.equal(await page.locator('.g-opt').count(), 4);
    await page.click('.g-opt >> nth=0');
    await page.waitForSelector('#g-next');
    await page.click('#g-next');
  }
  assert.match(await page.textContent('.g-big'), /^\d+\/10$/);
  const best = await page.evaluate(() => localStorage.getItem('cekplat.best'));
  assert.ok(best !== null);
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const [w, h, scheme] of [[360, 740, 'dark'], [390, 844, 'light'], [768, 900, 'dark'], [1024, 800, 'light'], [1440, 900, 'light']]) {
  test(`tanpa overflow horizontal di ${w}px (${scheme})`, async () => {
    const { ctx, page, errors } = await open(w, h, scheme);
    for (const plate of ['B 1234 SKA', 'N 1234 LA', 'D 1234 WA', 'KU 1234 GA', 'L 1234 AB']) {
      await page.fill('#plate-input', plate);
      await page.waitForSelector('.slip');
      assert.deepEqual(await overflow(page), [], plate);
    }
    await page.click('#tab-ref'); await page.waitForSelector('.atlas');
    assert.deepEqual(await overflow(page), [], 'peta');
    await page.click('#tab-info'); await page.waitForSelector('.vtable');
    assert.deepEqual(await overflow(page), [], 'akurasi');
    await page.click('#tab-cek'); await page.click('#open-game'); await page.click('#g-start');
    assert.deepEqual(await overflow(page), [], 'kuis');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
