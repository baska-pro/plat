/*
 * Parser plat nomor Indonesia.
 * Format UMD: window.PlatParser (browser) atau require('./parser.js') (Node).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.PlatParser = factory(root.PlatData);
})(typeof self !== 'undefined' ? self : this, function (Data) {
  'use strict';

  var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /** Rapikan input: huruf besar, spasi tunggal. */
  function clean(raw) {
    return String(raw == null ? '' : raw).toUpperCase().replace(/[^A-Z0-9\s\-.]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Tampilan standar: "D 5002 FA". */
  function format(prefix, number, series) {
    return [prefix, number, series].filter(Boolean).join(' ');
  }

  function vehicleByNumber(n) {
    for (var i = 0; i < Data.NUMBER_RANGES.length; i++) {
      var r = Data.NUMBER_RANGES[i];
      if (n >= r.from && n <= r.to) return r;
    }
    return null;
  }

  /**
   * Parse masa berlaku di plat, format "MM.YY" (mis. "05.27").
   * Plat hanya menampilkan bulan dan tahun; masa berlaku 5 tahun.
   */
  function parseExpiry(raw, now) {
    if (!raw) return null;
    var m = String(raw).trim().match(/^(0?[1-9]|1[0-2])\s*[.\-/ ]?\s*(\d{2})$/);
    if (!m) return { valid: false };
    var month = parseInt(m[1], 10);
    var year = 2000 + parseInt(m[2], 10);
    var ref = now || new Date();
    // berlaku sampai akhir bulan tersebut
    var endOfMonth = new Date(year, month, 0, 23, 59, 59);
    var diffMonths = (year - ref.getFullYear()) * 12 + (month - (ref.getMonth() + 1));
    return {
      valid: true,
      month: month,
      year: year,
      label: MONTHS[month - 1] + ' ' + year,
      expired: endOfMonth < ref,
      monthsLeft: diffMonths
    };
  }

  function base(raw) {
    return {
      ok: false,
      input: raw,
      kind: 'unknown',
      display: '',
      prefix: '',
      number: null,
      series: '',
      area: null,
      origin: null,
      region: null,
      letterInfo: null,
      vehicle: null,
      color: null,
      usage: null,
      expiry: null,
      samsat: [],
      samsatNote: '',
      samsatRefs: [],
      errors: [],
      warnings: [],
      notes: []
    };
  }

  /**
   * @param {string} raw     teks yang diketik pengguna
   * @param {object} [opts]  { color: 'putih'|..., expiry: 'MM.YY', now: Date }
   */
  function parsePlate(raw, opts) {
    opts = opts || {};
    var out = base(raw);
    var text = clean(raw);

    if (!text) {
      out.errors.push('Masukkan nomor plat, misalnya "D 5002 FA".');
      return out;
    }

    var tokens = text.split(/[\s\-.]+/).filter(Boolean);
    var compact = tokens.join('');

    // ---- Plat diplomatik / konsuler: "CD 12 34", "CC 03 01"
    var dip = compact.match(/^(CD|CC)(\d{2,6})$/);
    if (dip) {
      var digits = dip[2];
      var country, serial;
      if (tokens.length >= 3 && /^\d+$/.test(tokens[1]) && /^\d+$/.test(tokens[2])) {
        country = tokens[1];
        serial = tokens[2];
      } else {
        country = digits.slice(0, 2);
        serial = digits.slice(2);
      }
      out.ok = true;
      out.kind = dip[1] === 'CD' ? 'diplomatik' : 'konsuler';
      out.prefix = dip[1];
      out.display = dip[1] + ' ' + country + (serial ? ' ' + serial : '');
      out.area = {
        code: dip[1],
        title: dip[1] === 'CD' ? 'Korps Diplomatik' : 'Korps Konsuler',
        province: 'Perwakilan asing',
        areas: 'Kendaraan perwakilan ' + (dip[1] === 'CD' ? 'diplomatik' : 'konsuler') +
          ' asing atau organisasi internasional.'
      };
      out.notes.push('Kode negara/organisasi: ' + country + (serial ? ', nomor urut: ' + serial : '') +
        '. Daftar kode negara tidak dimuat di aplikasi ini.');
      if (serial === '1' || serial === '01') out.notes.push('Nomor 01 umumnya dipakai kepala perwakilan (duta besar).');
      return finalize(out, opts);
    }

    // ---- Presiden / Wakil Presiden: "RI 1", "RI 2"
    var ri = compact.match(/^RI([12])$/);
    if (ri) {
      out.ok = true;
      out.kind = 'pejabat-negara';
      out.prefix = 'RI';
      out.number = parseInt(ri[1], 10);
      out.display = 'RI ' + ri[1];
      out.area = {
        code: 'RI',
        title: ri[1] === '1' ? 'Presiden Republik Indonesia' : 'Wakil Presiden Republik Indonesia',
        province: 'Pejabat negara',
        areas: 'Plat khusus kepala negara/wakil kepala negara, tanpa huruf seri.'
      };
      return finalize(out, opts);
    }

    // ---- Plat reguler: [1-2 huruf][1-4 angka][0-3 huruf]
    var m = compact.match(/^([A-Z]{1,2})(\d+)([A-Z]{0,3})$/);
    if (!m) {
      out.errors.push('Format tidak dikenali. Pola yang benar: kode wilayah (1-2 huruf), nomor (1-4 angka), seri (0-3 huruf), contoh "D 5002 FA".');
      return out;
    }

    var prefix = m[1];
    var numStr = m[2];
    var series = m[3];

    if (numStr.length > 4) {
      out.errors.push('Nomor registrasi maksimal 4 angka (1-9999).');
      out.prefix = prefix;
      return out;
    }
    if (numStr.charAt(0) === '0') {
      out.errors.push('Nomor registrasi tidak diawali angka 0.');
      out.prefix = prefix;
      return out;
    }

    var number = parseInt(numStr, 10);
    out.ok = true;
    out.kind = 'reguler';
    out.prefix = prefix;
    out.number = number;
    out.series = series;
    out.display = format(prefix, numStr, series);

    // ---- Kode wilayah
    var area = Data.PREFIXES[prefix];
    if (area) {
      out.area = area;
    } else {
      out.warnings.push('Kode wilayah "' + prefix + '" tidak ada di basis data aplikasi ini.');
    }

    // ---- Jenis kendaraan dari rentang nomor
    var veh = vehicleByNumber(number);
    if (veh) out.vehicle = veh;

    // ---- Pejabat: nomor kecil tanpa seri
    if (!series && number <= 99) {
      out.notes.push('Nomor kecil tanpa huruf seri biasanya plat khusus pejabat (TNKB Khusus), bukan kendaraan biasa.');
    }
    if (!series && number > 99) {
      out.warnings.push('Tidak ada huruf seri. Plat reguler umumnya memiliki 1-3 huruf di belakang.');
    }

    // ---- Seri ZZ
    if (series === 'ZZ') {
      out.notes.push('Seri ZZ dilaporkan dipakai plat dinas pejabat sejak Oktober 2023 (sumber: Wikipedia, perlu diverifikasi).');
    }

    // ---- Asal daerah dari huruf pertama seri (semua kode yang punya rincian)
    if (Data.hasDetail(prefix)) {
      if (series) {
        var org = Data.lookupOrigin(prefix, series.charAt(0));
        if (org) out.origin = org;
        else out.warnings.push('Huruf seri "' + series.charAt(0) + '" belum tercatat di tabel kode ' + prefix +
          '. Daerah asal tidak bisa ditentukan, hanya provinsinya.');
      } else if (prefix !== 'D' && Data.SERIES_INDEX[prefix]) {
        out.warnings.push('Tanpa huruf seri, daerah asal di dalam kode ' + prefix + ' tidak bisa ditentukan.');
      }
    }

    // ---- Samsat untuk daerah di luar Bandung Raya (hanya yang punya sumber alamat)
    if (prefix !== 'D' && out.origin) {
      out.origin.candidates.forEach(function (c) {
        var g = Data.SAMSAT_AREA[prefix + '|' + c.name];
        if (!g) return;
        if (!out.samsatNote) out.samsatNote = g.note;
        g.src.forEach(function (id) {
          if (!out.samsatRefs.some(function (x) { return x.url === Data.SOURCES[id].url; })) {
            out.samsatRefs.push({ label: Data.SOURCES[id].title, url: Data.SOURCES[id].url });
          }
        });
        g.offices.forEach(function (o) {
          var key = o.name + '|' + o.address;
          if (out.samsat.some(function (x) { return x.name + '|' + x.address === key; })) return;
          out.samsat.push(Object.assign({ regionName: c.name }, o));
        });
      });
    }

    // ---- Sub-wilayah khusus plat D (Bandung Raya): Samsat
    if (prefix === 'D' && series) {
      var first = series.charAt(0);
      var info = Data.LETTER_MAP[first];
      if (info) {
        out.letterInfo = info;
        out.region = Data.REGIONS[info.region];
        out.regionCandidates = info.candidates
          ? info.candidates.map(function (k) { return Data.REGIONS[k]; })
          : null;
        // Daftar Samsat: gabungan semua kandidat jika ambigu
        var keys = info.candidates || [info.region];
        out.samsat = [];
        out.samsatNote = Data.SAMSAT_NOTE;
        keys.forEach(function (k) {
          (Data.SAMSAT[k] || []).forEach(function (s) {
            out.samsat.push(Object.assign({ regionKey: k, regionName: Data.REGIONS[k].name }, s));
          });
        });
      }
    } else if (prefix === 'D' && !series) {
      out.warnings.push('Tanpa huruf seri, wilayah di dalam Bandung Raya tidak bisa ditentukan.');
    }

    return finalize(out, opts);
  }

  function finalize(out, opts) {
    // ---- Warna plat (opsional)
    if (opts.color && Data.COLORS[opts.color]) {
      out.color = Data.COLORS[opts.color];
      out.usage = out.color.usage;
      if (out.kind === 'reguler' && out.vehicle && opts.color === 'kuning' && out.vehicle.key === 'khusus') {
        out.warnings.push('Kombinasi plat kuning dan kendaraan khusus jarang ditemui. Pastikan nomor dan warna sudah benar.');
      }
    }

    // ---- Masa berlaku (opsional)
    if (opts.expiry) {
      out.expiry = parseExpiry(opts.expiry, opts.now);
      if (out.expiry && !out.expiry.valid) {
        out.warnings.push('Format masa berlaku tidak valid. Gunakan "BB.TT", contoh "05.27".');
      }
    }
    return out;
  }

  /** Ringkasan satu baris, dipakai untuk riwayat & ekspor. */
  function summarize(r) {
    if (!r.ok) return r.errors[0] || '';
    if (r.kind !== 'reguler') return (r.area && r.area.title) || r.kind;
    var parts = [];
    if (r.origin) {
      var names = r.origin.candidates.map(function (c) { return c.name; }).join(' / ');
      parts.push(names + (r.origin.candidates.length > 1 ? ' (ambigu)' : '') +
        (r.origin.candidates[0].province ? ', ' + r.origin.candidates[0].province : ''));
    } else if (r.region) {
      parts.push(r.regionCandidates && r.regionCandidates.length > 1
        ? r.regionCandidates.map(function (x) { return x.name; }).join(' / ') + ' (ambigu)'
        : r.region.name);
    } else if (r.area) {
      parts.push(r.area.province);
    }
    if (r.vehicle) parts.push(r.vehicle.label);
    if (r.usage) parts.push(r.usage);
    return parts.join(' - ');
  }

  return {
    parsePlate: parsePlate,
    parseExpiry: parseExpiry,
    summarize: summarize,
    clean: clean,
    format: format
  };
});
