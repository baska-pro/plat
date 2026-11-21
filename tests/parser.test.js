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
  assert.equal(Data.PREFIX_ROWS.length, 60);
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

test('kode tanpa rincian (PS, kode baru 2024) tetap ok tanpa origin', () => {
  const r = parsePlate('PS 1234 AB');
  assert.equal(r.ok, true);
  assert.equal(r.origin, null);
  assert.equal(r.area.province, 'Papua Selatan');
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
  // 57 dari 60 kode punya rincian; PS, PT, PY (kode baru 2024) baru tingkat provinsi
  const detailed = Data.PREFIX_ROWS.filter(([c]) => Data.hasDetail(c)).map(([c]) => c);
  assert.equal(detailed.length, Data.PREFIX_ROWS.length - 3);
  for (const c of ['PS', 'PT', 'PY']) assert.ok(!detailed.includes(c), c);
  for (const c of ['KU', 'DP', 'DW']) assert.ok(detailed.includes(c), c);
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

/* ============================================================ Verifikasi silang */
const Verify = require('../js/verify.js');

test('KU, DP, DW sekarang punya rincian huruf', () => {
  assert.deepEqual(names('KU 1234 GA'), ['Kota Tarakan']);
  assert.deepEqual(names('KU 1234 AB'), ['Kabupaten Bulungan']);
  assert.deepEqual(names('KU 1234 SA'), ['Kabupaten Malinau']);
  assert.equal(origin('KU 1234 GA').confidence, 'sedang'); // satu sumber
  assert.deepEqual(names('DP 1234 AA'), ['Kota Parepare']);
  assert.deepEqual(names('DW 1234 YA'), ['Kabupaten Soppeng']);
});

test('setiap hasil membawa tanggal cek, status, dan rujukan', () => {
  for (const [plate, status] of [['B 1234 SKA', 'cocok'], ['N 1234 LA', 'konflik'], ['KU 1234 GA', 'tanpa-pembanding'], ['D 5002 FA', 'cocok']]) {
    const o = origin(plate);
    assert.match(o.checked, /^\d{4}-\d{2}-\d{2}$/, plate);
    assert.equal(o.status, status, plate);
    assert.ok(Array.isArray(o.refs), plate);
  }
  assert.ok(origin('B 1234 SKA').refs.length > 0);
});

test('plat N: huruf yang diperdebatkan jadi ambigu dengan dua kandidat', () => {
  assert.deepEqual(names('N 1234 LA'), ['Kota Batu', 'Kabupaten Probolinggo']);
  assert.equal(origin('N 1234 LA').confidence, 'rendah');
  assert.deepEqual(names('N 1234 UA'), ['Kabupaten Lumajang', 'Kabupaten Pasuruan']);
  // huruf yang kedua versi sepakati tidak berubah
  assert.deepEqual(names('N 1234 AA'), ['Kota Malang']);
  assert.notEqual(origin('N 1234 AA').confidence, 'rendah');
});

test('EA: huruf yang tidak ada di tabel utama tetapi ada di halaman Moladin EA ditandai ambigu', () => {
  const o = origin('EA 1234 FA');
  assert.deepEqual(o.candidates.map((c) => c.name), ['Kabupaten Dompu']);
  assert.equal(o.confidence, 'rendah');
});

test('BB dan BH: huruf yang ditukar pembanding ditandai ambigu', () => {
  assert.deepEqual(names('BB 1234 MA'), ['Kota Sibolga', 'Kabupaten Tapanuli Tengah']);
  assert.deepEqual(names('BH 1234 HA'), ['Kabupaten Muaro Jambi', 'Kota Jambi']);
});

test('Papua: PA/PB lama diberi catatan pemekaran, kode baru dikenali', () => {
  assert.match(origin('PA 1234 GA').note, /PS|PT/);
  assert.equal(origin('PA 1234 GA').confidence, 'sedang');
  assert.match(origin('PB 1234 SA').note, /PY/);
  for (const c of ['PS', 'PT', 'PY']) assert.ok(Data.PREFIXES[c], c);
});

test('semua nama di overlay ada di tabel kodenya, dan semua rujukan valid', () => {
  for (const [prefix, byLetter] of Object.entries(Verify.LETTERS)) {
    const known = new Set((Series.RAW[prefix] || []).map((r) => r[0]));
    for (const [letter, spec] of Object.entries(byLetter)) {
      assert.match(letter, /^[A-Z]$/);
      for (const n of spec.names || []) assert.ok(known.has(n), prefix + ' ' + letter + ' ' + n);
      assert.ok(['tinggi', 'sedang', 'rendah'].includes(spec.conf), prefix + letter);
      assert.ok(spec.note, prefix + letter);
    }
  }
  for (const [code, v] of Object.entries(Verify.CODES)) {
    assert.ok(Data.PREFIXES[code], 'kode tidak dikenal ' + code);
    assert.ok(['tinggi', 'sedang'].includes(v.conf), code);
    assert.ok(['cocok', 'sebagian', 'konflik', 'tanpa-pembanding'].includes(v.status), code);
    for (const k of v.refs) {
      assert.ok(Verify.REFS[k], code + ' ' + k);
      assert.match(Verify.REFS[k][1], /^https:\/\//);
    }
    assert.ok(v.note, code);
  }
  // setiap kode yang punya rincian harus punya catatan verifikasi
  for (const [code] of Data.PREFIX_ROWS) {
    if (Data.hasDetail(code)) assert.ok(Verify.CODES[code], 'belum ada catatan verifikasi: ' + code);
  }
});

test('status "cocok" selalu punya rujukan nyata (kecuali L)', () => {
  for (const [code, v] of Object.entries(Verify.CODES)) {
    if (v.status === 'cocok' && code !== 'L') assert.ok(v.refs.length > 0, code);
  }
});

test('Samsat Jakarta: induk dan gerai, tanpa telepon karangan', () => {
  const r = parsePlate('B 1234 SKA');
  assert.ok(r.samsat.some((s) => /Induk Jakarta Selatan/.test(s.name)));
  assert.ok(r.samsatRefs.length >= 1);
  for (const s of r.samsat) assert.equal(s.phone, '');
  const utara = parsePlate('B 1234 UA').samsat.map((s) => s.name);
  assert.ok(utara.includes('Samsat Induk Jakarta Pusat dan Utara'));
  // daerah tanpa sumber alamat tidak mendapat Samsat
  assert.equal(parsePlate('H 1234 AB').samsat.length, 0);
});

test('Surabaya: nama Samsat saja, alamat dibiarkan kosong', () => {
  const r = parsePlate('L 1234 AB');
  assert.equal(r.samsat.length, 4);
  for (const s of r.samsat) assert.equal(s.address, '');
});

test('plat D tetap memakai Samsat Bandung Raya dan catatannya', () => {
  const r = parsePlate('D 5002 FA');
  assert.equal(r.samsat.length, 3);
  assert.match(r.samsatNote, /Bandung|Samsat/);
});

/* ============================================================ Kuis */
const Quiz = require('../js/quiz.js');

test('kuis: kumpulan soal hanya dari huruf yakin tinggi dan tepat satu daerah', () => {
  const pool = Quiz.pool();
  assert.ok(pool.length > 300);
  for (const it of pool) {
    const o = Data.lookupOrigin(it.prefix, it.letter);
    assert.equal(o.confidence, 'tinggi', it.prefix + it.letter);
    assert.equal(o.candidates.length, 1, it.prefix + it.letter);
    assert.equal(o.candidates[0].name, it.area);
  }
  assert.ok(!pool.some((p) => p.prefix === 'L'));
});

test('kuis: soal valid, jawaban benar sesuai aplikasi, pengecoh tidak ikut benar', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const rng = Quiz.seeded(seed);
    for (const q of Quiz.makeRound(10, rng)) {
      assert.equal(q.options.length, 4, q.plate);
      assert.equal(new Set(q.options.map((o) => o.name)).size, 4, q.plate);
      assert.ok(q.answer >= 0 && q.answer < 4);
      const parsed = parsePlate(q.plate);
      assert.ok(parsed.ok, q.plate);
      // jawaban benar harus sama dengan hasil parser
      assert.equal(parsed.origin.candidates[0].name, q.options[q.answer].name, q.plate);
      assert.equal(parsed.origin.confidence, 'tinggi', q.plate);
      // pengecoh bukan daerah yang juga memakai huruf itu
      q.options.forEach((o, i) => {
        if (i === q.answer) return;
        const areas = Data.areasOfPrefix(q.prefix).filter((a) => a.name === o.name);
        for (const a of areas) assert.ok(!a.letters.includes(q.letter), q.plate + ' ' + o.name);
        assert.ok(!/sebagian/.test(o.name));
      });
    }
  }
});

test('kuis: satu putaran punya 10 soal dengan kode yang bervariasi', () => {
  const round = Quiz.makeRound(10, Quiz.seeded(42));
  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((q) => q.prefix)).size, 10);
  assert.deepEqual(Quiz.makeRound(10, Quiz.seeded(42)).map((q) => q.plate), round.map((q) => q.plate)); // deterministik
});

/* ============================================================ Kanal resmi pajak */
test('kanal resmi: SIGNAL, URL provinsi https, nama provinsi dikenal', () => {
  assert.match(Data.TAX_SIGNAL.url, /^https:\/\//);
  const provs = new Set(Data.PREFIX_ROWS.map((r) => r[1].replace(/\s*\(.*\)\s*$/, '')));
  for (const [prov, [url]] of Object.entries(Data.TAX_SITES)) {
    assert.ok(provs.has(prov), prov);
    if (url) assert.match(url, /^https:\/\//, prov);
  }
  const jkt = Data.taxChannels('DKI Jakarta (dan sekitarnya)');
  assert.equal(jkt.province, 'DKI Jakarta');
  assert.ok(jkt.site);
  // provinsi tanpa URL terverifikasi jatuh ke pencarian, bukan alamat karangan
  const sumsel = Data.taxChannels('Sumatera Selatan');
  assert.equal(sumsel.site, '');
  assert.match(sumsel.searchUrl, /^https:\/\/www\.google\.com\/search\?q=/);
});
