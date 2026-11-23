'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { build, OUT } = require('../scripts/build-data.js');

test('data/plat.json sinkron dengan kode (jalankan npm run build:data kalau gagal)', () => {
  const onDisk = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  assert.deepEqual(onDisk, JSON.parse(JSON.stringify(build())));
});

test('data/plat.json: bentuk sesuai skema dan konsisten', () => {
  const d = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  assert.equal(d.codes.length, 60);
  const seen = new Set();
  for (const c of d.codes) {
    assert.match(c.code, /^[A-Z]{1,2}$/);
    assert.ok(!seen.has(c.code), 'kode ganda ' + c.code);
    seen.add(c.code);
    assert.equal(c.detailed, Object.keys(c.letters).length > 0);
    for (const [letter, e] of Object.entries(c.letters)) {
      assert.match(letter, /^[A-Z]$/);
      assert.ok(e.areas.length >= 1);
      assert.ok(['tinggi', 'sedang', 'rendah'].includes(e.confidence), c.code + letter);
      // setiap daerah yang disebut huruf harus ada di daftar daerah kode itu
      for (const a of e.areas) assert.ok(c.areas.some((x) => x.name === a), c.code + letter + ' ' + a);
    }
    if (c.verification) assert.match(c.verification.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.deepEqual(d.codes.filter((c) => !c.detailed).map((c) => c.code).sort(), ['PS', 'PT', 'PY']);
});
