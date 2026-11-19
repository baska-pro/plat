'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePlate, parseExpiry, summarize } = require('../js/parser.js');
const Data = require('../js/data.js');
const Series = require('../js/series.js');

/* ---------------------------------------------------------- Kasus utama */
test('D 5002 FA -> Kota Bandung, sepeda motor', () => {
  const r = parsePlate('D 5002 FA');
  assert.equal(r.ok, true);
  assert.equal(r.display, 'D 5002 FA');
  assert.equal(r.prefix, 'D');
  assert.equal(r.number, 5002);
  assert.equal(r.series, 'FA');
  assert.equal(r.region.key, 'kotaBandung');
  assert.equal(r.letterInfo.confidence, 'tinggi');
  assert.equal(r.vehicle.key, 'motor');
  assert.equal(r.area.province, 'Jawa Barat');
});

test('input fleksibel: huruf kecil, tanpa spasi, tanda hubung', () => {
  for (const s of ['d5002fa', 'D-5002-FA', '  d   5002  fa ', 'D.5002.FA']) {
    const r = parsePlate(s);
    assert.equal(r.ok, true, s);
    assert.equal(r.display, 'D 5002 FA', s);
  }
});

/* ---------------------------------------------------- Pemetaan wilayah D */
test('setiap huruf A-Z terpetakan ke wilayah', () => {
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    assert.ok(Data.LETTER_MAP[l], 'huruf ' + l + ' belum terpetakan');
    assert.ok(Data.REGIONS[Data.LETTER_MAP[l].region], 'region tidak valid untuk ' + l);
  }
});

test('Kota Bandung: A-P dan R', () => {
  for (const l of 'ABCDEFGHIJKLMNOPR') {
    const r = parsePlate('D 1234 ' + l + 'A');
    assert.equal(r.region.key, 'kotaBandung', l);
    assert.equal(r.letterInfo.confidence, 'tinggi', l);
  }
});

test('KBB: U dan X (keyakinan tinggi)', () => {
  for (const l of 'UX') {
    const r = parsePlate('D 4392 ' + l + 'A');
    assert.equal(r.region.key, 'kbb', l);
    assert.equal(r.letterInfo.confidence, 'tinggi', l);
  }
});

test('Cimahi: S dan T (keyakinan sedang)', () => {
  for (const l of 'ST') {
    const r = parsePlate('D 1143 ' + l + 'A');
    assert.equal(r.region.key, 'cimahi', l);
    assert.equal(r.letterInfo.confidence, 'sedang', l);
  }
});

test('Kabupaten Bandung: V dan Y (keyakinan sedang)', () => {
  for (const l of 'VY') {
    const r = parsePlate('D 3281 ' + l + 'A');
    assert.equal(r.region.key, 'kabBandung', l);
    assert.equal(r.letterInfo.confidence, 'sedang', l);
  }
});

test('W dan Z ambigu: dua kandidat, Samsat gabungan', () => {
  for (const l of 'WZ') {
    const r = parsePlate('D 1000 ' + l + 'A');
    assert.equal(r.letterInfo.confidence, 'rendah', l);
    assert.equal(r.regionCandidates.length, 2, l);
    const keys = r.regionCandidates.map((x) => x.key).sort();
    assert.deepEqual(keys, ['kabBandung', 'kbb'], l);
    const regions = new Set(r.samsat.map((s) => s.regionKey));
    assert.ok(regions.has('kabBandung') && regions.has('kbb'), l);
  }
});

test('wilayah ditentukan huruf PERTAMA seri, bukan yang lain', () => {
  assert.equal(parsePlate('D 1 AU').region.key, 'kotaBandung'); // bukan KBB
  assert.equal(parsePlate('D 1111 UA').region.key, 'kbb');
  assert.equal(parsePlate('D 1111 SAB').region.key, 'cimahi');
});

test('seri 1, 2, dan 3 huruf semuanya didukung', () => {
  assert.equal(parsePlate('D 1234 A').series, 'A');
  assert.equal(parsePlate('D 1234 AB').series, 'AB');
  assert.equal(parsePlate('D 1234 ABC').series, 'ABC');
  assert.equal(parsePlate('D 1234 ABC').region.key, 'kotaBandung');
});

/* ------------------------------------------------------ Jenis kendaraan */
test('rentang nomor -> jenis kendaraan', () => {
  const cases = [
    [1, 'mobil'], [1999, 'mobil'],
    [2000, 'motor'], [6999, 'motor'],
    [7000, 'bus'], [7999, 'bus'],
    [8000, 'barang'], [8999, 'barang'],
    [9000, 'khusus'], [9999, 'khusus']
  ];
  for (const [n, key] of cases) {
    assert.equal(parsePlate('D ' + n + ' AB').vehicle.key, key, String(n));
  }
});

/* ------------------------------------------------------------- Validasi */
test('input kosong dan format salah ditolak dengan pesan', () => {
  for (const s of ['', '   ', 'ABC', '1234', 'D', 'D ABC', '???']) {
    const r = parsePlate(s);
    assert.equal(r.ok, false, JSON.stringify(s));
    assert.ok(r.errors.length > 0, JSON.stringify(s));
  }
});

test('nomor lebih dari 4 angka atau diawali 0 ditolak', () => {
  assert.equal(parsePlate('D 12345 AB').ok, false);
  assert.equal(parsePlate('D 0123 AB').ok, false);
  assert.equal(parsePlate('D 0 AB').ok, false);
});

test('seri lebih dari 3 huruf ditolak', () => {
  assert.equal(parsePlate('D 1234 ABCD').ok, false);
});

test('tanpa seri: valid tetapi diberi peringatan/catatan', () => {
  const big = parsePlate('D 1234');
  assert.equal(big.ok, true);
  assert.ok(big.warnings.length > 0);
  assert.equal(big.region, null);

  const small = parsePlate('D 1');
  assert.equal(small.ok, true);
  assert.ok(small.notes.some((n) => /pejabat/i.test(n)));
});

test('kode wilayah tak dikenal tetap di-parse dengan peringatan', () => {
  const r = parsePlate('QQ 1234 AB');
  assert.equal(r.ok, true);
  assert.equal(r.area, null);
  assert.ok(r.warnings.some((w) => /QQ/.test(w)));
});

/* ----------------------------------------------- Kode wilayah non-Bandung */
test('plat luar Bandung: provinsi tampil, tanpa sub-wilayah D', () => {
  const r = parsePlate('B 1234 ABC');
  assert.equal(r.ok, true);
  assert.equal(r.area.province, 'DKI Jakarta (dan sekitarnya)');
  assert.equal(r.region, null);
  assert.equal(r.samsat.length, 0);

  assert.equal(parsePlate('AB 1234 XY').area.province, 'DI Yogyakarta');
  assert.equal(parsePlate('DK 77 A').area.province, 'Bali');
  assert.equal(parsePlate('BL 1234 AB').area.province, 'Aceh');
});

test('seluruh kode wilayah punya data lengkap', () => {
  assert.equal(Data.PREFIX_ROWS.length, 55);
  const seen = new Set();
  for (const [code, prov, areas] of Data.PREFIX_ROWS) {
    assert.match(code, /^[A-Z]{1,2}$/);
    assert.ok(prov && areas, code);
    assert.ok(!seen.has(code), 'duplikat ' + code);
    seen.add(code);
  }
});

/* ------------------------------------------------------- Plat khusus */
test('CD dan CC dikenali', () => {
  const cd = parsePlate('CD 12 34');
  assert.equal(cd.kind, 'diplomatik');
  assert.equal(cd.display, 'CD 12 34');

  const cc = parsePlate('CC 03 01');
  assert.equal(cc.kind, 'konsuler');

  const amb = parsePlate('CD 66 01');
  assert.ok(amb.notes.some((n) => /duta besar/i.test(n)));
});

test('RI 1 dan RI 2', () => {
  assert.match(parsePlate('RI 1').area.title, /^Presiden/);
  assert.match(parsePlate('ri2').area.title, /^Wakil Presiden/);
});

test('seri ZZ memberi catatan plat dinas', () => {
  const r = parsePlate('B 1234 ZZ');
  assert.ok(r.notes.some((n) => /ZZ/.test(n)));
});

/* ------------------------------------------------------------ Warna */
test('warna plat menentukan penggunaan', () => {
  assert.equal(parsePlate('D 5002 FA', { color: 'putih' }).usage, 'Pribadi');
  assert.equal(parsePlate('D 5002 FA', { color: 'kuning' }).usage, 'Umum / angkutan umum');
  assert.equal(parsePlate('D 5002 FA', { color: 'merah' }).usage, 'Dinas pemerintah');
  assert.equal(parsePlate('D 5002 FA').usage, null);
  assert.equal(parsePlate('D 5002 FA', { color: 'tidak-ada' }).color, null);
});

/* ------------------------------------------------------ Masa berlaku */
test('masa berlaku MM.YY', () => {
  const now = new Date(2026, 10, 19); // 19 Nov 2026
  const ok = parseExpiry('05.27', now);
  assert.equal(ok.valid, true);
  assert.equal(ok.month, 5);
  assert.equal(ok.year, 2027);
  assert.equal(ok.expired, false);
  assert.equal(ok.monthsLeft, 6);

  const cur = parseExpiry('11.26', now); // bulan berjalan: belum habis
  assert.equal(cur.expired, false);

  const old = parseExpiry('10.26', now);
  assert.equal(old.expired, true);

  assert.equal(parseExpiry('5 27', now).valid, true);
  assert.equal(parseExpiry('13.27', now).valid, false);
  assert.equal(parseExpiry('abc', now).valid, false);
  assert.equal(parseExpiry('', now), null);
});

test('masa berlaku tidak valid memberi peringatan', () => {
  const r = parsePlate('D 5002 FA', { expiry: '99.99' });
  assert.ok(r.warnings.some((w) => /masa berlaku/i.test(w)));
});

/* ----------------------------------------------------------- Ringkasan */
test('summarize', () => {
  assert.equal(
    summarize(parsePlate('D 5002 FA', { color: 'putih' })),
    'Kota Bandung, Jawa Barat - Sepeda motor - Pribadi'
  );
  assert.match(summarize(parsePlate('D 1000 WA')), /ambigu/);
  assert.match(summarize(parsePlate('')), /Masukkan/);
});

/* ------------------------------------------------------------- Samsat */
test('Samsat tersedia untuk setiap wilayah dan lengkap', () => {
  for (const key of Object.keys(Data.REGIONS)) {
    const list = Data.SAMSAT[key];
    assert.ok(list && list.length > 0, key);
    for (const s of list) {
      assert.ok(s.name && s.address && s.phone && s.hours, key + ' ' + s.name);
    }
  }
  assert.equal(Data.SAMSAT.kotaBandung.length, 3);
});

test('semua rujukan sumber valid', () => {
  for (const c of Object.values(Data.COLORS)) assert.ok(Data.SOURCES[c.source], c.key);
  for (const c of Data.SPECIAL_CODES) assert.ok(Data.SOURCES[c.source], c.code);
  for (const s of Object.values(Data.SOURCES)) assert.match(s.url, /^https:\/\//);
});

/* ============================================================ Huruf seri semua kode */
const origin = (plate) => parsePlate(plate).origin;
const names = (plate) => origin(plate).candidates.map((c) => c.name);

test('plat B: huruf pertama seri menentukan kota/kabupaten', () => {
  const cases = {
    'B 1234 BKA': 'Kota Adm. Jakarta Barat',
    'B 1234 PKA': 'Kota Adm. Jakarta Pusat',
    'B 1234 SKA': 'Kota Adm. Jakarta Selatan',
    'B 1234 TKA': 'Kota Adm. Jakarta Timur',
    'B 1234 UKA': 'Kota Adm. Jakarta Utara',
    'B 1234 KKA': 'Kota Bekasi',
    'B 1234 FKA': 'Kabupaten Bekasi',
    'B 1234 EKA': 'Kota Depok',
    'B 1234 ZKA': 'Kota Depok',
    'B 1234 CKA': 'Kota Tangerang',
    'B 1234 VKA': 'Kota Tangerang',
    'B 1234 WKA': 'Kota Tangerang Selatan',
    'B 1234 GKA': 'Kabupaten Tangerang',
    'B 1234 NKA': 'Kabupaten Tangerang'
  };
  for (const [plate, area] of Object.entries(cases)) {
    assert.deepEqual(names(plate), [area], plate);
    assert.equal(origin(plate).confidence, 'tinggi', plate);
  }
});

test('plat B: provinsi mengikuti daerah, bukan kode (Bekasi=Jabar, Tangerang=Banten)', () => {
  assert.equal(origin('B 1 SA').candidates[0].province, 'DKI Jakarta');
  assert.equal(origin('B 1 KA').candidates[0].province, 'Jawa Barat');
  assert.equal(origin('B 1 EA').candidates[0].province, 'Jawa Barat');
  assert.equal(origin('B 1 WA').candidates[0].province, 'Banten');
});

test('plat B: huruf yang tidak ada di tabel -> peringatan, bukan tebakan', () => {
  const r = parsePlate('B 1234 QKA'); // Q tidak dipakai di tabel B
  assert.equal(r.ok, true);
  assert.equal(r.origin, null);
  assert.ok(r.warnings.some((w) => /Q/.test(w)));
});

test('H, AB, E, F, Z, DK: contoh daerah', () => {
  assert.deepEqual(names('H 1234 AB'), ['Kota Semarang']);
  assert.deepEqual(names('H 1234 DB'), ['Kabupaten Kendal']);
  assert.equal(origin('H 1234 AB').confidence, 'tinggi');
  assert.deepEqual(names('AB 1234 EA'), ['Kabupaten Sleman']);
  assert.deepEqual(names('E 1234 AA'), ['Kota Cirebon']);
  assert.deepEqual(names('F 1234 FA'), ['Kabupaten Bogor']);
  assert.deepEqual(names('Z 1234 DA'), ['Kabupaten Garut']);
  assert.deepEqual(names('DK 1234 AA'), ['Kota Denpasar']);
  assert.deepEqual(names('BK 1234 AA'), ['Kota Medan']);
  assert.deepEqual(names('KT 1234 BA'), ['Kota Samarinda']);
});

test('huruf yang tercatat untuk >1 daerah ditandai ambigu', () => {
  const t = origin('T 1234 TA'); // T-Z: Subang atau Bekasi (sebagian)
  assert.equal(t.confidence, 'rendah');
  assert.equal(t.candidates.length, 2);
  const bm = origin('BM 1234 XA'); // X: Kuantan Singingi atau Kep. Meranti
  assert.equal(bm.confidence, 'rendah');
  assert.equal(bm.candidates.length, 2);
});

test('kode L selalu Kota Surabaya', () => {
  assert.deepEqual(names('L 1234 AB'), ['Kota Surabaya']);
  assert.deepEqual(names('L 1234 ZZ'), ['Kota Surabaya']);
});

test('kode tanpa rincian (KU) tetap ok tanpa origin', () => {
  const r = parsePlate('KU 1234 AB');
  assert.equal(r.ok, true);
  assert.equal(r.origin, null);
  assert.equal(r.area.province, 'Kalimantan Utara');
});

test('plat D lewat jalur origin: kandidat & Samsat konsisten', () => {
  const f = origin('D 5002 FA');
  assert.deepEqual(f.candidates.map((c) => c.name), ['Kota Bandung']);
  assert.ok(f.candidates[0].letters.includes('F'));
  const w = origin('D 1000 WA');
  assert.equal(w.candidates.length, 2);
  assert.equal(w.confidence, 'rendah');
});

test('integritas tabel seri', () => {
  for (const [prefix, rows] of Object.entries(Series.RAW)) {
    assert.ok(Data.PREFIXES[prefix], 'kode tidak dikenal: ' + prefix);
    const seen = new Set();
    for (const [name, letters] of rows) {
      assert.ok(name && letters, prefix);
      assert.match(letters, /^[A-Z]+$/, prefix + ' ' + name);
      assert.equal(new Set(letters).size, letters.length, 'huruf ganda di ' + prefix + ' ' + name);
      assert.ok(!seen.has(name), 'nama ganda ' + prefix + ' ' + name);
      seen.add(name);
    }
  }
  // 54 dari 55 kode punya rincian (D lewat LETTER_MAP, L lewat WHOLE, KU belum ada data)
  const detailed = Data.PREFIX_ROWS.filter(([c]) => Data.hasDetail(c)).map(([c]) => c);
  assert.equal(detailed.length, Data.PREFIX_ROWS.length - 1);
  assert.ok(!detailed.includes('KU'));
});

test('pencarian balik: daerah -> kode + huruf', () => {
  const cimahi = Data.searchAreas('cimahi');
  assert.ok(cimahi.some((a) => a.prefix === 'D' && a.letters.includes('S')));
  const jaksel = Data.searchAreas('jakarta selatan');
  assert.deepEqual(jaksel.map((a) => [a.prefix, a.letters.join('')]), [['B', 'S']]);
  const bali = Data.searchAreas('DK');
  assert.equal(bali.length, 9);
  assert.deepEqual(Data.searchAreas(''), []);
});

test('ringkasan menyebut daerah spesifik', () => {
  assert.equal(summarize(parsePlate('B 1234 SKA')), 'Kota Adm. Jakarta Selatan, DKI Jakarta - Mobil penumpang');
});
