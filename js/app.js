(function () {
  'use strict';

  var D = window.PlatData;
  var P = window.PlatParser;

  /* ------------------------------------------------------------ util */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem('cekplat.' + key));
      localStorage.setItem('cekplat.' + key, JSON.stringify(val));
    } catch (e) { return null; }
    return val;
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function copy(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg || 'Tersalin'); } catch (e) { toast('Gagal menyalin'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || 'Tersalin'); }, fallback);
    } else { fallback(); }
  }

  function mapsUrl(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function telUrl(p) { return 'tel:' + p.replace(/[^\d+]/g, '').replace(/^0/, '+62'); }

  /* ----------------------------------------------------------- state */
  var state = {
    color: store('color') || '',
    history: store('history') || []
  };

  /* ------------------------------------------------------------ tema */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    $('#theme-icon').textContent = dark ? '☀' : '☾';
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0b1020' : '#2f6bff');
  }
  $('#theme-btn').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur === 'dark' || (cur === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    store('theme', next);
    try { localStorage.setItem('cekplat.theme', next); } catch (e) {}
    applyTheme(next);
  });
  applyTheme(document.documentElement.getAttribute('data-theme') || 'auto');

  /* ------------------------------------------------------------- tab */
  function showTab(name, focus) {
    $$('.tab').forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('.panel').forEach(function (p) {
      var on = p.id === 'panel-' + name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    if (name === 'ref') renderRef();
    if (name === 'info') renderInfo();
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    window.scrollTo({ top: 0 });
  }
  $$('.tab').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = all[(i + 1) % all.length];
      if (e.key === 'ArrowLeft') n = all[(i - 1 + all.length) % all.length];
      if (n) { e.preventDefault(); showTab(n.getAttribute('data-tab'), true); }
    });
  });

  /* --------------------------------------------------------- warna */
  function renderColorChips() {
    var box = $('#color-chips');
    var html = '<button type="button" class="chip" role="radio" data-color="" aria-checked="' + (state.color === '') + '">Tidak tahu</button>';
    Object.keys(D.COLORS).forEach(function (k) {
      var c = D.COLORS[k];
      html += '<button type="button" class="chip" role="radio" data-color="' + k + '" aria-checked="' + (state.color === k) + '">' +
        '<span class="dot" style="background:' + c.bg + '"></span>' + esc(c.label) + '</button>';
    });
    box.innerHTML = html;
  }
  $('#color-chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.color = b.getAttribute('data-color');
    store('color', state.color);
    renderColorChips();
    if ($('#plate-input').value.trim()) runSearch(false);
  });

  /* ------------------------------------------------------- render hasil */
  function confBadge(c) {
    if (c === 'tinggi') return '<span class="badge ok">Keyakinan tinggi</span>';
    if (c === 'sedang') return '<span class="badge mid">Keyakinan sedang</span>';
    return '<span class="badge warn">Ambigu / perlu verifikasi</span>';
  }

  function plateHtml(r) {
    var color = r.color || D.COLORS.putih;
    var num = r.number != null ? String(r.number) : '';
    var main;
    if (r.kind === 'reguler') {
      main = '<span>' + esc(r.prefix) + '</span><span>' + esc(num) + '</span>' + (r.series ? '<span>' + esc(r.series) + '</span>' : '');
    } else {
      main = '<span>' + esc(r.display) + '</span>';
    }
    var sub = r.expiry && r.expiry.valid ? String(('0' + r.expiry.month).slice(-2)) + '.' + String(r.expiry.year).slice(-2) : '';
    return '<div class="plate-wrap"><div class="plate" style="--plate-bg:' + color.bg + ';--plate-fg:' + color.fg + '" role="img" aria-label="Plat ' + esc(r.display) + '">' +
      '<div class="plate-main">' + main + '</div><div class="plate-sub">' + esc(sub) + '</div></div></div>';
  }

  function samsatHtml(r) {
    if (!r.samsat.length) return '';
    var ambiguous = r.regionCandidates && r.regionCandidates.length > 1;
    var cols = r.samsat.length > 1 ? ' cols' : '';
    var h = '<div class="card"><div class="section-title"><h2>Samsat yang melayani</h2></div>' +
      '<div class="callout info"><span class="ic">i</span><span>' + esc(D.SAMSAT_NOTE) + '</span></div>' +
      '<div class="samsat-list' + cols + '" style="margin-top:12px">';
    r.samsat.forEach(function (s) {
      h += '<div class="samsat">' +
        (ambiguous ? '<div class="tag">' + esc(s.regionName) + '</div>' : '') +
        '<div class="name">' + esc(s.name) + '</div>' +
        '<div class="meta">' + esc(s.address) + '</div>' +
        '<div class="meta">' + esc(s.phone) + ' &middot; ' + esc(s.hours) + '</div>' +
        (s.note ? '<div class="note">' + esc(s.note) + '</div>' : '') +
        '<div class="acts">' +
        '<a class="btn small" target="_blank" rel="noopener" href="' + mapsUrl(s.name.replace(/\s*\(.*\)/, '') + ' ' + s.address) + '">Buka peta</a>' +
        '<a class="btn small" href="' + telUrl(s.phone) + '">Telepon</a>' +
        '</div></div>';
    });
    return h + '</div></div>';
  }

  function resultHtml(r) {
    if (!r.ok) {
      return '<div class="callout err" role="alert"><span class="ic">!</span><span>' + esc(r.errors.join(' ')) + '</span></div>';
    }

    var title, sub = '', eyebrow = 'Asal kendaraan', badge = '';

    if (r.kind === 'reguler' && r.region) {
      title = r.region.name;
      badge = confBadge(r.letterInfo.confidence);
      sub = r.area.province + ' &middot; ibu kota ' + esc(r.region.capital);
    } else if (r.kind === 'reguler' && r.regionCandidates) {
      title = r.regionCandidates.map(function (x) { return x.name; }).join(' atau ');
    } else if (r.kind === 'reguler' && r.area) {
      title = r.area.province;
      sub = esc(r.area.areas);
    } else if (r.kind === 'reguler') {
      title = 'Kode wilayah tidak dikenal';
    } else {
      title = r.area.title;
      sub = esc(r.area.areas);
      eyebrow = r.area.province;
    }

    // wilayah ambigu: tampilkan kandidat
    if (r.kind === 'reguler' && r.letterInfo && r.letterInfo.confidence === 'rendah' && r.regionCandidates && r.regionCandidates.length > 1) {
      title = r.regionCandidates.map(function (x) { return x.name; }).join(' atau ');
      sub = r.area.province;
      badge = confBadge('rendah');
    }

    var facts = '';
    if (r.kind === 'reguler') {
      facts += '<div class="fact"><div class="k">Kode wilayah</div><div class="v">' + esc(r.prefix) + '</div>' +
        '<div class="d">' + (r.area ? esc(r.area.province) : 'Tidak ada di basis data') + '</div></div>';

      if (r.area) {
        facts += '<div class="fact"><div class="k">Cakupan kode ' + esc(r.prefix) + '</div><div class="v" style="font-size:.95rem">' + esc(r.area.areas) + '</div></div>';
      }

      if (r.series && r.prefix === 'D') {
        facts += '<div class="fact"><div class="k">Huruf seri</div><div class="v">' + esc(r.series) + '</div>' +
          '<div class="d">Huruf pertama "' + esc(r.series.charAt(0)) + '" menentukan wilayah</div></div>';
      } else if (r.series) {
        facts += '<div class="fact"><div class="k">Huruf seri</div><div class="v">' + esc(r.series) + '</div><div class="d">Pembeda antar kendaraan</div></div>';
      }

      if (r.vehicle) {
        facts += '<div class="fact"><div class="k">Jenis kendaraan (indikatif)</div><div class="v">' + esc(r.vehicle.label) + '</div>' +
          '<div class="d">Nomor ' + r.number + ' ada di rentang ' + r.vehicle.from + '-' + r.vehicle.to + '</div></div>';
      }

      if (r.usage) {
        facts += '<div class="fact"><div class="k">Penggunaan</div><div class="v">' + esc(r.usage) + '</div>' +
          '<div class="d">' + esc(r.color.label) + '</div></div>';
      } else {
        facts += '<div class="fact"><div class="k">Penggunaan</div><div class="v">Belum diketahui</div>' +
          '<div class="d">Pilih warna plat di "Opsi tambahan" untuk menentukan pribadi/umum/dinas</div></div>';
      }

      if (r.expiry && r.expiry.valid) {
        var e = r.expiry;
        var st = e.expired ? '<span class="badge bad">Sudah lewat</span>'
          : (e.monthsLeft <= 3 ? '<span class="badge warn">Segera habis</span>' : '<span class="badge ok">Masih berlaku</span>');
        facts += '<div class="fact"><div class="k">Masa berlaku plat</div><div class="v">' + esc(e.label) + '</div><div class="d">' + st + '</div></div>';
      }
    }

    var notes = '';
    r.warnings.forEach(function (w) { notes += '<div class="callout warn"><span class="ic">!</span><span>' + esc(w) + '</span></div>'; });
    r.notes.forEach(function (n) { notes += '<div class="callout info"><span class="ic">i</span><span>' + esc(n) + '</span></div>'; });
    if (r.letterInfo && r.letterInfo.note) {
      notes += '<div class="callout ' + (r.letterInfo.confidence === 'rendah' ? 'warn' : 'info') + '"><span class="ic">i</span><span>' + esc(r.letterInfo.note) + '</span></div>';
    }
    if (r.vehicle) {
      notes += '<div class="callout info"><span class="ic">i</span><span>' + esc(D.NUMBER_NOTE) + '</span></div>';
    }

    var left = '<div class="card answer">' + plateHtml(r) +
      '<div class="eyebrow">' + esc(eyebrow) + '</div>' +
      '<div class="big">' + esc(title) + '</div>' +
      '<div class="sub">' + sub + '</div>' +
      (badge ? '<div style="margin-top:10px">' + badge + '</div>' : '') +
      '<div class="actions">' +
      '<button class="btn small" type="button" id="act-copy">Salin ringkasan</button>' +
      '<button class="btn small" type="button" id="act-share">Bagikan</button>' +
      '</div></div>';

    var right = '<div class="card"><div class="section-title"><h2>Detail</h2></div><div class="facts">' + facts + '</div>' +
      (notes ? '<div style="margin-top:12px">' + notes + '</div>' : '') + '</div>';

    var html = '<div class="result two">' + left + '<div style="display:grid;gap:16px">' + right + samsatHtml(r) + '</div></div>';
    return html;
  }

  /* ---------------------------------------------------------- pencarian */
  var lastResult = null;

  function runSearch(pushHistory) {
    var input = $('#plate-input');
    var r = P.parsePlate(input.value, { color: state.color, expiry: $('#expiry-input').value });
    lastResult = r;
    var out = $('#result');
    out.innerHTML = resultHtml(r);

    var hint = $('#plate-hint');
    if (!r.ok) {
      hint.classList.add('is-error');
    } else {
      hint.classList.remove('is-error');
      input.value = r.display;
      if (pushHistory !== false) addHistory(r.display);
      var q = new URL(location.href);
      q.searchParams.set('plat', r.display);
      history.replaceState(null, '', q.pathname + q.search + location.hash);
    }

    var copyBtn = $('#act-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      copy(r.display + ': ' + P.summarize(r), 'Ringkasan disalin');
    });
    var shareBtn = $('#act-share');
    if (shareBtn) shareBtn.addEventListener('click', function () {
      var data = { title: 'CekPlat ' + r.display, text: r.display + ': ' + P.summarize(r), url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else copy(location.href, 'Tautan disalin');
    });
  }

  $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); runSearch(true); });
  $('#expiry-input').addEventListener('input', function () { if ($('#plate-input').value.trim()) runSearch(false); });

  $('#plate-input').addEventListener('input', function () {
    var v = this.value.toUpperCase();
    if (v !== this.value) this.value = v;
  });

  document.addEventListener('click', function (e) {
    var ex = e.target.closest('[data-example]');
    if (ex) {
      $('#plate-input').value = ex.getAttribute('data-example');
      runSearch(true);
    }
  });

  /* ---------------------------------------------------------- riwayat */
  function addHistory(p) {
    state.history = [p].concat(state.history.filter(function (x) { return x !== p; })).slice(0, 10);
    store('history', state.history);
    renderHistory();
  }
  function renderHistory() {
    var wrap = $('#history-wrap');
    wrap.hidden = state.history.length === 0;
    $('#history').innerHTML = state.history.map(function (p) {
      return '<button type="button" class="chip mono" data-hist="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
  }
  $('#history').addEventListener('click', function (e) {
    var b = e.target.closest('[data-hist]');
    if (!b) return;
    $('#plate-input').value = b.getAttribute('data-hist');
    runSearch(false);
  });
  $('#history-clear').addEventListener('click', function () {
    state.history = [];
    store('history', []);
    renderHistory();
  });

  /* ------------------------------------------------------------ cek banyak */
  var bulkRows = [];
  function csvCell(v) {
    v = String(v == null ? '' : v);
    // cegah formula injection di Excel/Sheets
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  $('#bulk-run').addEventListener('click', function () {
    var lines = $('#bulk-input').value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    var max = 500;
    var truncated = lines.length > max;
    lines = lines.slice(0, max);
    bulkRows = lines.map(function (line) {
      var r = P.parsePlate(line, { color: state.color });
      var wilayah = '';
      if (r.ok && r.kind === 'reguler') {
        if (r.regionCandidates && r.regionCandidates.length > 1) wilayah = r.regionCandidates.map(function (x) { return x.name; }).join(' / ') + ' (ambigu)';
        else if (r.region) wilayah = r.region.name;
        else if (r.area) wilayah = r.area.province;
      } else if (r.ok && r.area) wilayah = r.area.title;
      return {
        input: line,
        plat: r.ok ? r.display : '',
        wilayah: wilayah,
        provinsi: r.ok && r.area ? r.area.province : '',
        jenis: r.vehicle ? r.vehicle.label : '',
        penggunaan: r.usage || '',
        keyakinan: r.letterInfo ? r.letterInfo.confidence : '',
        status: r.ok ? 'OK' : r.errors[0]
      };
    });
    var box = $('#bulk-result');
    if (!bulkRows.length) {
      box.hidden = true;
      $('#bulk-count').textContent = 'Belum ada plat.';
      $('#bulk-copy').disabled = $('#bulk-csv').disabled = true;
      return;
    }
    var h = '<table><thead><tr><th>Plat</th><th>Wilayah</th><th>Jenis</th><th>Penggunaan</th><th>Status</th></tr></thead><tbody>';
    bulkRows.forEach(function (x) {
      h += '<tr><td class="mono">' + esc(x.plat || x.input) + '</td><td>' + esc(x.wilayah) + '</td><td>' + esc(x.jenis) + '</td><td>' + esc(x.penggunaan) + '</td><td>' +
        (x.status === 'OK' ? '<span class="badge ok">OK</span>' : '<span class="badge bad">' + esc(x.status) + '</span>') + '</td></tr>';
    });
    box.innerHTML = h + '</tbody></table>';
    box.hidden = false;
    var ok = bulkRows.filter(function (x) { return x.status === 'OK'; }).length;
    $('#bulk-count').textContent = ok + ' valid dari ' + bulkRows.length + ' baris' + (truncated ? ' (dibatasi ' + max + ')' : '');
    $('#bulk-copy').disabled = $('#bulk-csv').disabled = false;
  });
  var COLS = ['input', 'plat', 'wilayah', 'provinsi', 'jenis', 'penggunaan', 'keyakinan', 'status'];
  $('#bulk-copy').addEventListener('click', function () {
    var txt = COLS.join('\t') + '\n' + bulkRows.map(function (r) { return COLS.map(function (c) { return r[c]; }).join('\t'); }).join('\n');
    copy(txt, 'Hasil disalin (tempel ke Excel/Sheets)');
  });
  $('#bulk-csv').addEventListener('click', function () {
    var csv = '﻿' + COLS.join(',') + '\n' + bulkRows.map(function (r) { return COLS.map(function (c) { return csvCell(r[c]); }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'cekplat-hasil.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* ------------------------------------------------------------- referensi */
  var refDone = false;
  function renderRef() {
    if (refDone) return;
    refDone = true;
    var h = '';

    // Peta huruf D
    h += '<div class="card ref-block"><h2>Plat D: wilayah menurut huruf seri</h2>' +
      '<p>Huruf <b>pertama</b> seri menentukan wilayah. Contoh "D 5002 <b>F</b>A" &rarr; huruf F &rarr; Kota Bandung. Kotak bergaris putus-putus = sumber saling bertentangan.</p><div class="letter-grid">';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (l) {
      var info = D.LETTER_MAP[l];
      var reg = D.REGIONS[info.region];
      var short = { kotaBandung: 'Kota Bdg', cimahi: 'Cimahi', kabBandung: 'Kab. Bdg', kbb: 'KBB' }[info.region];
      if (info.candidates && info.candidates.length > 1) short = info.candidates.map(function (k) { return { kabBandung: 'Kab. Bdg', kbb: 'KBB' }[k]; }).join(' / ');
      h += '<div class="lt' + (info.confidence === 'rendah' ? ' low' : '') + '" style="--c:' + reg.color + '" title="' + esc(info.note) + '"><b>' + l + '</b><small>' + esc(short) + '</small></div>';
    });
    h += '</div><div class="legend">';
    Object.keys(D.REGIONS).forEach(function (k) {
      h += '<span style="--c:' + D.REGIONS[k].color + '"><i></i>' + esc(D.REGIONS[k].name) + '</span>';
    });
    h += '<span><i class="dash"></i>Ambigu</span></div></div>';

    // Samsat
    h += '<div class="card ref-block"><h2>Kantor Samsat Bandung Raya</h2><p>' + esc(D.SAMSAT_NOTE) + '</p><div class="samsat-list cols">';
    Object.keys(D.REGIONS).forEach(function (k) {
      D.SAMSAT[k].forEach(function (s) {
        h += '<div class="samsat"><div class="tag">' + esc(D.REGIONS[k].name) + '</div><div class="name">' + esc(s.name) + '</div><div class="meta">' + esc(s.address) + '</div><div class="meta">' + esc(s.phone) + '</div></div>';
      });
    });
    h += '</div></div>';

    // Rentang nomor
    h += '<div class="card ref-block"><h2>Rentang nomor &amp; jenis kendaraan</h2><p>' + esc(D.NUMBER_NOTE) + '</p><div class="table-wrap" style="margin:0"><table><thead><tr><th>Nomor</th><th>Jenis</th></tr></thead><tbody>';
    D.NUMBER_RANGES.forEach(function (r) { h += '<tr><td class="mono">' + r.from + ' - ' + r.to + '</td><td>' + esc(r.label) + '</td></tr>'; });
    h += '</tbody></table></div></div>';

    // Warna
    h += '<div class="card ref-block"><h2>Warna plat</h2><div class="samsat-list cols">';
    Object.keys(D.COLORS).forEach(function (k) {
      var c = D.COLORS[k];
      h += '<div class="samsat"><div style="display:flex;gap:12px;align-items:center"><span class="plate" style="--plate-bg:' + c.bg + ';--plate-fg:' + c.fg + ';min-width:0;padding:2px 10px;border-width:2px;font-weight:800;font-family:var(--mono)">D 1</span>' +
        '<div><div class="name">' + esc(c.usage) + '</div><div class="meta">' + esc(c.label) + '</div></div></div><div class="meta">' + esc(c.detail) + '</div></div>';
    });
    h += '</div></div>';

    // Kode khusus
    h += '<div class="card ref-block"><h2>Kode khusus</h2><div class="samsat-list cols">';
    D.SPECIAL_CODES.forEach(function (c) {
      h += '<div class="samsat"><div class="name mono">' + esc(c.code) + '</div><div class="tag">' + esc(c.title) + '</div><div class="meta">' + esc(c.text) + '</div></div>';
    });
    h += '</div></div>';

    // Semua kode wilayah
    h += '<div class="card ref-block"><h2>Seluruh kode wilayah (' + D.PREFIX_ROWS.length + ')</h2>' +
      '<input id="prefix-filter" class="text-input filter" type="search" placeholder="Cari kode atau daerah, mis. Bali, DK, Surabaya" style="font-family:var(--font)">' +
      '<div class="table-wrap" style="margin:0"><table><thead><tr><th>Kode</th><th>Provinsi</th><th>Cakupan</th></tr></thead><tbody id="prefix-body"></tbody></table></div></div>';

    $('#ref-content').innerHTML = h;

    function fill(q) {
      q = (q || '').toLowerCase().trim();
      var rows = D.PREFIX_ROWS.filter(function (r) { return !q || (r[0] + ' ' + r[1] + ' ' + r[2]).toLowerCase().indexOf(q) !== -1; });
      $('#prefix-body').innerHTML = rows.length ? rows.map(function (r) {
        return '<tr><td class="mono">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
      }).join('') : '<tr><td colspan="3" class="muted">Tidak ada yang cocok.</td></tr>';
    }
    fill('');
    $('#prefix-filter').addEventListener('input', function () { fill(this.value); });
  }

  /* ---------------------------------------------------------------- tentang */
  var infoDone = false;
  function renderInfo() {
    if (infoDone) return;
    infoDone = true;
    var srcs = Object.keys(D.SOURCES).map(function (k) {
      return '<li><a href="' + esc(D.SOURCES[k].url) + '" target="_blank" rel="noopener noreferrer">' + esc(D.SOURCES[k].title) + '</a></li>';
    }).join('');
    $('#info-content').innerHTML =
      '<div class="card prose">' +
      '<h2>Seberapa akurat?</h2>' +
      '<p>Tidak ada API resmi Polri atau Samsat untuk pembagian huruf seri plat. Aplikasi ini memakai data publik, dan setiap hasil diberi tingkat keyakinan:</p>' +
      '<ul>' +
      '<li><span class="badge ok">Tinggi</span> Seluruh sumber yang dibandingkan sepakat. Contoh: huruf A-R = Kota Bandung, U dan X = Bandung Barat.</li>' +
      '<li><span class="badge mid">Sedang</span> Mayoritas sumber sepakat, satu sumber berbeda. Contoh: S/T = Cimahi, V/Y = Kabupaten Bandung.</li>' +
      '<li><span class="badge warn">Ambigu</span> Sumber saling bertentangan, jadi aplikasi menampilkan semua kandidat. Contoh: huruf W dan Z.</li>' +
      '</ul>' +
      '<h2>Apa yang tidak bisa diketahui dari plat?</h2>' +
      '<ul>' +
      '<li><b>Kantor Samsat asal.</b> Plat tidak memuat kantor tertentu. Yang ditampilkan adalah kantor Samsat yang melayani wilayah tersebut.</li>' +
      '<li><b>Pribadi atau umum.</b> Ditentukan oleh warna plat, bukan angka/huruf. Pilih warna di Opsi tambahan.</li>' +
      '<li><b>Jenis kendaraan.</b> Berdasarkan rentang nomor awal. Nomor bisa dipakai ulang dengan seri berbeda, jadi sifatnya indikatif.</li>' +
      '<li><b>Pemilik, merek, tipe, dan status pajak.</b> Tidak tersedia secara publik. Untuk pajak, gunakan kanal resmi Bapenda Jawa Barat.</li>' +
      '</ul>' +
      '<h2>Privasi</h2>' +
      '<p>Semua pemrosesan berjalan di perangkat Anda. Tidak ada plat yang dikirim ke server. Riwayat disimpan lokal di browser dan bisa dihapus kapan saja.</p>' +
      '<h2>Sumber data</h2><ul class="src-list">' + srcs + '</ul>' +
      '</div>';
  }

  /* ------------------------------------------------------------- shortcut */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      showTab('cek');
      $('#plate-input').focus();
    }
  });

  /* ------------------------------------------------------------------- init */
  renderColorChips();
  renderHistory();

  var qp = new URL(location.href).searchParams.get('plat');
  var tab = location.hash.replace('#', '');
  if (['cek', 'banyak', 'ref', 'info'].indexOf(tab) > -1) showTab(tab);
  if (qp) {
    $('#plate-input').value = qp.slice(0, 14);
    runSearch(false);
  }

  /* ----------------------------------------------------------- service worker */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
