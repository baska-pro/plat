'use strict';
/*
 * Mengekspor tabel huruf seri ke data/plat.json supaya bisa dipakai proyek lain tanpa menyentuh js/series.js.
 * Jalankan: npm run build:data   (tes memastikan berkas ini selalu sinkron dengan kode)
 */
const fs = require('node:fs');
const path = require('node:path');
const Data = require('../js/data.js');

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const OUT = path.join(__dirname, '..', 'data', 'plat.json');

function build() {
  const codes = Data.PREFIX_ROWS.map(function (row) {
    const code = row[0];
    const letters = {};
    const codeNote = (Data.verifyOf(code) || {}).note;
    LETTERS.forEach(function (letter) {
      const o = Data.lookupOrigin(code, letter);
      if (!o || !o.candidates.length) return;
      const entry = { areas: o.candidates.map(function (c) { return c.name; }), confidence: o.confidence };
      if (o.note && o.note !== codeNote) entry.note = o.note; // catatan tingkat kode ada di verification.note
      letters[letter] = entry;
    });
    const v = Data.verifyOf(code);
    const areas = Data.areasOfPrefix(code).map(function (a) {
      return { name: a.name, province: a.province, letters: a.letters.slice().sort() };
    });
    return {
      code: code,
      province: row[1],
      detailed: Object.keys(letters).length > 0,
      verification: v ? {
        status: v.status,
        checkedOn: v.checked,
        note: v.note || null,
        references: (v.refs || []).map(function (r) { return { label: r.label, url: r.url }; })
      } : null,
      areas: areas,
      letters: letters
    };
  });
  return {
    schema: 'plat.schema.json',
    description: 'Huruf seri plat nomor Indonesia -> kota/kabupaten, dengan tingkat keyakinan. Bukan data resmi; baca docs/AKURASI.md.',
    source: 'https://github.com/baska-pro/plat',
    codes: codes
  };
}

if (require.main === module) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(build(), null, 2) + '\n');
  console.log('Ditulis: ' + path.relative(process.cwd(), OUT));
}

module.exports = { build, OUT };
