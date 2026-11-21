(function () {
  'use strict';

  var D = window.PlatData;
  var P = window.PlatParser;

  /* ------------------------------------------------------------------ util */
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
    t.textContent = msg; t.hidden = false;
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
  var REPO = 'https://github.com/baska-pro/plat';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function idDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : '';
  }
  var STATUS_TEXT = {
    'cocok': 'cocok dengan penerbit lain',
    'sebagian': 'cocok sebagian dengan penerbit lain',
    'konflik': 'ada penerbit lain yang berbeda',
    'tanpa-pembanding': 'belum ada pembanding'
  };
  var STATUS_SHORT = { 'cocok': 'cocok', 'sebagian': 'sebagian', 'konflik': 'berbeda', 'tanpa-pembanding': 'tanpa pembanding' };
  /** Tautan GitHub Issue dengan formulir terisi. Nomor plat TIDAK ikut dikirim, hanya kode dan huruf seri. */
  function issueUrl(f) {
    var q = new URLSearchParams({ template: 'koreksi-data.yml', title: 'Koreksi data: kode ' + f.kode + (f.huruf ? ' huruf ' + f.huruf : '') });
    ['kode', 'huruf', 'hasil', 'keyakinan'].forEach(function (k) { if (f[k]) q.set(k, f[k]); });
    return REPO + '/issues/new?' + q.toString();
  }
  function verifHtml(o) {
    if (!o || !o.checked) return '';
    return '<p class="ver"><span class="ver-dot ' + esc(o.status) + '"></span>Dicek ' + esc(idDate(o.checked)) + ' &middot; ' + esc(STATUS_TEXT[o.status] || '') + '</p>';
  }
  function refsHtml(refs) {
    return (refs || []).map(function (x) {
      return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.label) + '</a>';
    }).join('<br>');
  }
  function telUrl(p) { return 'tel:' + p.replace(/[^\d+]/g, '').replace(/^0/, '+62'); }
  function uniq(arr) { return arr.filter(function (x, i) { return x && arr.indexOf(x) === i; }); }

  /** "ABCDEFGHIJKLMNOPR" -> "A–P, R" (rentang berurutan >= 3 huruf diringkas) */
  function compress(letters) {
    var arr = (Array.isArray(letters) ? letters.slice() : String(letters).split('')).sort();
    var out = [], i = 0;
    while (i < arr.length) {
      var j = i;
      while (j + 1 < arr.length && arr[j + 1].charCodeAt(0) === arr[j].charCodeAt(0) + 1) j++;
      out.push(j - i >= 2 ? arr[i] + '–' + arr[j] : arr.slice(i, j + 1).join(', '));
      i = j + 1;
    }
    return out.join(', ');
  }

  var DEFAULT_PLATE = { bg: '#f4f1e8', fg: '#111111' };
  var state = { color: store('color') || '', history: store('history') || [] };

  /* ------------------------------------------------------------------ tema */
  function isDark(t) { return t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('#theme-label').textContent = isDark(t) ? 'Terang' : 'Gelap';
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark(t) ? '#131311' : '#ebe4d2');
  }
  $('#theme-btn').addEventListener('click', function () {
    var next = isDark(document.documentElement.getAttribute('data-theme')) ? 'light' : 'dark';
    try { localStorage.setItem('cekplat.theme', next); } catch (e) {}
    applyTheme(next);
  });
  applyTheme(document.documentElement.getAttribute('data-theme') || 'auto');

  /* ------------------------------------------------------------------- tab */
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
      p.hidden = !on; p.classList.toggle('is-active', on);
    });
    if (name === 'ref') renderRef();
    if (name === 'info') renderInfo();
    if (location.hash !== '#' + name) history.replaceState(null, '', location.pathname + location.search + '#' + name);
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

  /* ------------------------------------------------------------- warna plat */
  function paintPlate() {
    var c = state.color && D.COLORS[state.color] ? D.COLORS[state.color] : DEFAULT_PLATE;
    var box = $('#plate-box');
    box.style.setProperty('--pb', c.bg);
    box.style.setProperty('--pf', c.fg);
    $('#color-name').textContent = state.color
      ? D.COLORS[state.color].label + ': ' + D.COLORS[state.color].usage.toLowerCase() + '.'
      : 'Belum dipilih. Warna plat yang menentukan pribadi, umum, atau dinas.';
  }
  function renderSwatches() {
    var h = '<button type="button" class="sw" role="radio" data-color="" aria-label="Belum tahu" title="Belum tahu" aria-checked="' + (state.color === '') + '">?</button>';
    Object.keys(D.COLORS).forEach(function (k) {
      var c = D.COLORS[k];
      h += '<button type="button" class="sw" role="radio" data-color="' + k + '" aria-label="' + esc(c.label) + '" title="' + esc(c.label) + '" style="--c:' + c.bg + '" aria-checked="' + (state.color === k) + '"></button>';
    });
    $('#color-chips').innerHTML = h;
    paintPlate();
  }
  $('#color-chips').addEventListener('click', function (e) {
    var b = e.target.closest('.sw');
    if (!b) return;
    state.color = b.getAttribute('data-color');
    store('color', state.color);
    renderSwatches();
    if ($('#plate-input').value.trim()) runSearch(false, true);
  });

  /* -------------------------------------------------------------- hasil */
  function stampHtml(conf) {
    var m = { tinggi: ['tinggi', 'Keyakinan tinggi'], sedang: ['sedang', 'Keyakinan sedang'], rendah: ['rendah', 'Ambigu'], netral: ['netral', 'Tingkat provinsi'] }[conf];
    return m ? '<div class="stamp ' + m[0] + '">' + m[1] + '</div>' : '';
  }

  function originView(r) {
    var v = { kicker: 'Asal kendaraan', names: [], sub: '', stamp: '', long: false };
    if (r.kind !== 'reguler') {
      v.kicker = r.area.province;
      v.names = [r.area.title];
      v.sub = esc(r.area.areas);
      return v;
    }
    if (r.origin) {
      var cs = r.origin.candidates;
      v.names = cs.map(function (c) { return c.name; });
      var provs = uniq(cs.map(function (c) { return c.province; }));
      v.sub = '<b>' + esc(provs.join(' / ')) + '</b>';
      if (cs.length === 1 && cs[0].letters && cs[0].letters.length > 1 && cs[0].letters.length < 26) {
        v.sub += ' &middot; seluruh huruf seri daerah ini: <b>' + esc(compress(cs[0].letters)) + '</b>';
      }
      v.stamp = stampHtml(r.origin.confidence) + verifHtml(r.origin);
    } else if (r.area) {
      v.kicker = 'Baru sampai tingkat provinsi';
      v.names = [r.area.province];
      v.sub = D.hasDetail(r.prefix)
        ? 'Daerah di dalam kode ' + esc(r.prefix) + ' belum bisa ditentukan dari plat ini.'
        : 'Rincian huruf seri untuk kode ' + esc(r.prefix) + ' belum tersedia di data aplikasi ini.';
      v.stamp = stampHtml('netral');
    } else {
      v.kicker = 'Tidak dikenali';
      v.names = ['Kode wilayah tidak dikenal'];
    }
    v.long = v.names.some(function (n) { return n.length > 22; });
    return v;
  }

  function plateShowHtml(r) {
    var c = r.color || DEFAULT_PLATE;
    var main;
    if (r.kind === 'reguler') {
      main = '<span class="p-kode">' + esc(r.prefix) + '</span><span class="p-nomor">' + esc(r.number) + '</span>' +
        (r.series ? '<span class="p-seri">' + esc(r.series) + '</span>' : '');
    } else {
      main = '<span class="p-nomor">' + esc(r.display) + '</span>';
    }
    var sub = r.expiry && r.expiry.valid ? ('0' + r.expiry.month).slice(-2) + '.' + String(r.expiry.year).slice(-2) : '';
    return '<div class="plate-show-wrap"><div class="plate-show" style="--pb:' + c.bg + ';--pf:' + c.fg + '" role="img" aria-label="Plat ' + esc(r.display) + '">' +
      '<div class="plate-parts">' + main + '</div><div class="plate-foot">' + esc(sub) + '</div></div></div>';
  }

  function decoderHtml(r) {
    if (r.kind !== 'reguler') return '';
    var first = r.series ? r.series.charAt(0) : '';
    var province = r.origin ? uniq(r.origin.candidates.map(function (c) { return c.province; })).join(' / ') : (r.area ? r.area.province : '—');
    var seriVal = r.origin
      ? esc(first) + ' → ' + esc(r.origin.candidates.map(function (c) { return c.name; }).join(' / '))
      : '—';
    var seriSmall = r.series
      ? 'Huruf pertama setelah angka (<b>' + esc(first) + '</b>) yang menentukan daerah.'
      : 'Plat ini tidak punya huruf seri.';
    return '<div class="decoder">' +
      '<div class="cell kode"><span class="cell-token">' + esc(r.prefix) + '</span><div class="lbl">Kode wilayah</div><div class="val">' + esc(province) + '</div><div class="small">Huruf di depan angka.</div></div>' +
      '<div class="cell nomor"><span class="cell-token">' + esc(r.number) + '</span><div class="lbl">Nomor urut</div><div class="val">' + esc(r.vehicle ? r.vehicle.label : '—') + '</div>' +
      '<div class="small">' + (r.vehicle ? 'Rentang nomor ' + r.vehicle.from + '–' + r.vehicle.to + '.' : '') + '</div></div>' +
      '<div class="cell seri"><span class="cell-token">' + esc(r.series || '—') + '</span><div class="lbl">Seri huruf</div><div class="val">' + seriVal + '</div><div class="small">' + seriSmall + '</div></div>' +
      '</div>';
  }

  function keysHtml(r) {
    if (r.kind !== 'reguler' || !r.series || !D.hasDetail(r.prefix) || !r.origin) return '';
    var first = r.series.charAt(0);
    var own = {};
    r.origin.candidates.forEach(function (c) { (c.letters || []).forEach(function (l) { own[l] = 1; }); });
    var keys = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (l) {
      var o = D.lookupOrigin(r.prefix, l);
      var cls = l === first ? 'now' : (own[l] ? 'same' : (o ? 'map' : 'none'));
      var title = o ? l + ': ' + o.candidates.map(function (c) { return c.name; }).join(' / ') : l + ': tidak tercatat di tabel';
      keys += '<div class="key ' + cls + '" title="' + esc(title) + '">' + l + '</div>';
    });
    var names = r.origin.candidates.map(function (c) { return c.name; }).join(' / ');
    return '<div class="keys-wrap"><div class="keys-head"><h2>Deretan huruf kode ' + esc(r.prefix) + '</h2>' +
      '<p>Huruf <b>' + esc(first) + '</b> &rarr; ' + esc(names) + '</p></div>' +
      '<div class="keys" role="img" aria-label="Huruf A sampai Z untuk kode ' + esc(r.prefix) + ', huruf ' + esc(first) + ' disorot">' + keys + '</div>' +
      '<div class="keys-legend"><span><i class="a"></i>huruf plat ini</span><span><i class="b"></i>huruf lain daerah yang sama</span><span><i class="c"></i>daerah lain</span></div></div>';
  }

  function sourcesHtml(ids) {
    return (ids || []).map(function (id) {
      var s = D.SOURCES[id];
      return s ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a>' : '';
    }).filter(Boolean).join('<br>');
  }

  function samsatHtml(r) {
    if (!r.samsat.length) return '';
    var many = r.samsat.some(function (x) { return x.regionName !== r.samsat[0].regionName; });
    var h = '<section><div class="sec-title"><h2>Samsat yang melayani</h2></div>' +
      '<div class="note"><b class="tag">Info</b><span>' + esc(r.samsatNote) + '</span></div>' +
      '<div class="samsat-grid' + (r.samsat.length > 1 ? ' cols' : '') + '" style="margin-top:12px">';
    r.samsat.forEach(function (s) {
      var meta = [];
      if (s.phone) meta.push(esc(s.phone));
      if (s.hours) meta.push(esc(s.hours));
      h += '<div class="samsat">' + (many ? '<div class="tag">' + esc(s.regionName) + '</div>' : '') +
        '<div class="name">' + esc(s.name) + '</div>' +
        '<div class="meta">' + (s.address ? esc(s.address) : 'Alamat belum terverifikasi') + '</div>' +
        (meta.length ? '<div class="meta">' + meta.join(' &middot; ') + '</div>' : '') +
        (s.note ? '<div class="note-i">' + esc(s.note) + '</div>' : '') +
        '<div class="acts"><a class="btn small" target="_blank" rel="noopener" href="' + mapsUrl(s.name.replace(/\s*\(.*\)/, '') + ' ' + (s.address || r.origin.candidates[0].province)) + '">Peta</a>' +
        (s.phone ? '<a class="btn small" href="' + telUrl(s.phone) + '">Telepon</a>' : '') + '</div></div>';
    });
    if (r.samsatRefs.length) h += '</div><p class="muted src-line">Sumber: ' + refsHtml(r.samsatRefs).replace(/<br>/g, ', ') + '</p></section>';
    else h += '</div></section>';
    return h;
  }

  function reportBtn(r) {
    if (r.kind !== 'reguler' || !r.origin) return '';
    var first = r.series ? r.series.charAt(0) : '';
    var hasil = r.origin.candidates.map(function (c) { return c.name; }).join(' / ') + ' (keyakinan ' + r.origin.confidence + ')';
    return '<a class="btn small" id="act-report" target="_blank" rel="noopener noreferrer" href="' +
      esc(issueUrl({ kode: r.prefix, huruf: first, hasil: hasil, keyakinan: r.origin.confidence })) +
      '" title="Membuka formulir di GitHub. Nomor plat tidak ikut dikirim, hanya kode dan huruf seri.">Data ini salah?</a>';
  }

  function resultHtml(r) {
    if (!r.ok) return '<div class="note err" role="alert"><b class="tag">Salah</b><span>' + esc(r.errors.join(' ')) + '</span></div>';

    var v = originView(r);
    var names = v.names.map(function (n, i) {
      return (i ? '<div class="or">ATAU</div>' : '') + '<div class="origin' + (v.long ? ' long' : '') + '">' + esc(n) + '</div>';
    }).join('');

    var rows = '';
    if (r.kind === 'reguler') {
      rows += '<div class="row"><div class="k">Penggunaan</div><div class="v">' + (r.usage ? esc(r.usage) + '<small>' + esc(r.color.label) + '</small>'
        : 'Belum diketahui<small>Pilih warna plat di atas untuk menentukan pribadi, umum, atau dinas.</small>') + '</div></div>';
      if (r.expiry && r.expiry.valid) {
        var e = r.expiry;
        var st = e.expired ? '<span class="pill bad">Sudah lewat</span>' : (e.monthsLeft <= 3 ? '<span class="pill warn">Segera habis</span>' : '<span class="pill ok">Masih berlaku</span>');
        rows += '<div class="row"><div class="k">Masa berlaku plat</div><div class="v">' + esc(e.label) + st + '</div></div>';
      }
      if (r.origin) {
        rows += '<div class="row"><div class="k">Dibandingkan dengan</div><div class="v"><small style="margin:0">' +
          (r.origin.refs && r.origin.refs.length ? refsHtml(r.origin.refs) : 'Belum ada pembanding yang ditemukan') + '</small></div></div>';
      }
    }

    var notes = '';
    r.warnings.forEach(function (w) { notes += '<div class="note warn"><b class="tag">Perhatian</b><span>' + esc(w) + '</span></div>'; });
    r.notes.forEach(function (n) { notes += '<div class="note"><b class="tag">Catatan</b><span>' + esc(n) + '</span></div>'; });
    if (r.origin && r.origin.note) {
      notes += '<div class="note' + (r.origin.confidence === 'rendah' ? ' warn' : '') + '"><b class="tag">Data</b><span>' + esc(r.origin.note) + '</span></div>';
    }
    if (r.origin && r.prefix !== 'D' && !r.samsat.length) {
      notes += '<div class="note"><b class="tag">Samsat</b><span>Alamat Samsat rinci baru tersedia untuk Bandung Raya dan Jakarta. Untuk daerah lain, tanyakan ke Bapenda provinsi setempat.</span></div>';
    }
    if (r.vehicle) notes += '<div class="note"><b class="tag">Jenis</b><span>' + esc(D.NUMBER_NOTE) + '</span></div>';

    return '<article class="slip">' +
      '<div class="slip-head"><span>Hasil pemeriksaan</span><span>No. ' + esc(r.display) + '</span></div>' +
      '<div class="slip-body">' +
        '<div class="verdict"><p class="kicker">' + esc(v.kicker) + '</p>' + names +
          '<p class="origin-sub">' + v.sub + '</p>' + v.stamp +
          '<div class="actions"><button class="btn small" type="button" id="act-copy">Salin ringkasan</button><button class="btn small" type="button" id="act-share">Bagikan</button>' + reportBtn(r) + '</div></div>' +
        plateShowHtml(r) +
      '</div>' +
      decoderHtml(r) + keysHtml(r) +
      '<div class="slip-rest">' + (notes ? '<div class="notes">' + notes + '</div>' : '') +
        (rows ? '<div class="form-rows">' + rows + '</div>' : '') + samsatHtml(r) + '</div>' +
      '</article>';
  }

  /* ----------------------------------------------------------- pencarian */
  var liveTimer;
  function runSearch(commit, quiet) {
    var input = $('#plate-input');
    var r = P.parsePlate(input.value, { color: state.color, expiry: $('#expiry-input').value });
    var hint = $('#plate-hint');

    if (!r.ok) {
      if (quiet) { // saat mengetik: jangan berteriak soal format sebelum selesai
        if (!input.value.trim()) $('#result').innerHTML = '';
        return;
      }
      $('#result').innerHTML = resultHtml(r);
      hint.classList.add('is-error');
      return;
    }
    hint.classList.remove('is-error');
    $('#result').innerHTML = resultHtml(r);

    if (commit) {
      input.value = r.display;
      addHistory(r.display);
      var q = new URL(location.href);
      q.searchParams.set('plat', r.display);
      history.replaceState(null, '', q.pathname + q.search + location.hash);
    }

    var copyBtn = $('#act-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () { copy(r.display + ': ' + P.summarize(r), 'Ringkasan disalin'); });
    var shareBtn = $('#act-share');
    if (shareBtn) shareBtn.addEventListener('click', function () {
      var data = { title: 'CekPlat ' + r.display, text: r.display + ': ' + P.summarize(r), url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {}); else copy(location.href, 'Tautan disalin');
    });
    if (commit) {
      var res = $('#result');
      if (res.getBoundingClientRect().top > window.innerHeight * 0.6) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); runSearch(true, false); });
  $('#plate-input').addEventListener('input', function () {
    var v = this.value.toUpperCase();
    if (v !== this.value) this.value = v;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { runSearch(false, true); }, 160);
  });
  $('#expiry-input').addEventListener('input', function () { if ($('#plate-input').value.trim()) runSearch(false, true); });

  document.addEventListener('click', function (e) {
    var ex = e.target.closest('[data-example]');
    if (ex) { $('#plate-input').value = ex.getAttribute('data-example'); runSearch(true, false); }
  });

  /* ------------------------------------------------------------ riwayat */
  function addHistory(p) {
    state.history = [p].concat(state.history.filter(function (x) { return x !== p; })).slice(0, 8);
    store('history', state.history);
    renderHistory();
  }
  function renderHistory() {
    $('#history-wrap').hidden = state.history.length === 0;
    $('#history').innerHTML = state.history.map(function (p) {
      return '<button type="button" class="ex" data-hist="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
  }
  $('#history').addEventListener('click', function (e) {
    var b = e.target.closest('[data-hist]');
    if (!b) return;
    $('#plate-input').value = b.getAttribute('data-hist');
    runSearch(false, false);
  });
  $('#history-clear').addEventListener('click', function () { state.history = []; store('history', []); renderHistory(); });

  /* -------------------------------------------------------- banyak sekaligus */
  var bulkRows = [];
  var COLS = ['input', 'plat', 'daerah', 'provinsi', 'jenis', 'penggunaan', 'keyakinan', 'status'];
  function csvCell(v) {
    v = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // cegah formula injection di Excel/Sheets
    return '"' + v.replace(/"/g, '""') + '"';
  }
  $('#bulk-run').addEventListener('click', function () {
    var lines = $('#bulk-input').value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    var max = 500, truncated = lines.length > max;
    lines = lines.slice(0, max);
    bulkRows = lines.map(function (line) {
      var r = P.parsePlate(line, { color: state.color });
      var daerah = '', prov = '', conf = '';
      if (r.ok && r.origin) {
        daerah = r.origin.candidates.map(function (c) { return c.name; }).join(' / ') + (r.origin.candidates.length > 1 ? ' (ambigu)' : '');
        prov = uniq(r.origin.candidates.map(function (c) { return c.province; })).join(' / ');
        conf = r.origin.confidence;
      } else if (r.ok && r.area) {
        daerah = r.area.title || ''; prov = r.area.province || '';
      }
      return { input: line, plat: r.ok ? r.display : '', daerah: daerah, provinsi: prov, jenis: r.vehicle ? r.vehicle.label : '', penggunaan: r.usage || '', keyakinan: conf, status: r.ok ? 'OK' : r.errors[0] };
    });
    var box = $('#bulk-result');
    if (!bulkRows.length) {
      box.hidden = true; $('#bulk-count').textContent = 'Belum ada plat.';
      $('#bulk-copy').disabled = $('#bulk-csv').disabled = true; return;
    }
    var h = '<table><thead><tr><th>Plat</th><th>Daerah asal</th><th>Provinsi</th><th>Jenis</th><th>Penggunaan</th><th>Status</th></tr></thead><tbody>';
    bulkRows.forEach(function (x) {
      h += '<tr><td class="mono">' + esc(x.plat || x.input) + '</td><td>' + esc(x.daerah || '—') + '</td><td>' + esc(x.provinsi) + '</td><td>' + esc(x.jenis) + '</td><td>' + esc(x.penggunaan) + '</td><td>' +
        (x.status === 'OK' ? '<span class="pill ok" style="margin:0">OK</span>' : '<span class="pill bad" style="margin:0">' + esc(x.status) + '</span>') + '</td></tr>';
    });
    box.innerHTML = h + '</tbody></table>'; box.hidden = false;
    var ok = bulkRows.filter(function (x) { return x.status === 'OK'; }).length;
    $('#bulk-count').textContent = ok + ' valid dari ' + bulkRows.length + ' baris' + (truncated ? ' (dibatasi ' + max + ')' : '');
    $('#bulk-copy').disabled = $('#bulk-csv').disabled = false;
  });
  $('#bulk-copy').addEventListener('click', function () {
    copy(COLS.join('\t') + '\n' + bulkRows.map(function (r) { return COLS.map(function (c) { return r[c]; }).join('\t'); }).join('\n'), 'Hasil disalin (tempel ke Excel/Sheets)');
  });
  $('#bulk-csv').addEventListener('click', function () {
    var csv = '﻿' + COLS.join(',') + '\n' + bulkRows.map(function (r) { return COLS.map(function (c) { return csvCell(r[c]); }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'cekplat-hasil.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* ------------------------------------------------------------ peta huruf */
  var PALETTE = ['#ffc800', '#ff7a59', '#5cc48a', '#6ea8ff', '#d28bf0', '#f2a33a', '#4fd0d0', '#c9a96a', '#ff8fb8', '#b7c0cc'];
  var refDone = false;
  var atlas = { prefix: 'D', hot: null };

  function atlasHtml() {
    var prefix = atlas.prefix;
    var row = D.PREFIXES[prefix];
    var areas = D.areasOfPrefix(prefix);
    var idxOf = {};
    areas.forEach(function (a, i) { idxOf[a.name] = i; });

    var keys = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (l) {
      var hit = areas.filter(function (a) { return a.letters.indexOf(l) !== -1; });
      if (!hit.length) { keys += '<div class="key none" title="' + l + ': tidak tercatat">' + l + '</div>'; return; }
      var cols = hit.map(function (a) { return PALETTE[idxOf[a.name] % PALETTE.length]; });
      var bg = cols.length > 1 ? 'repeating-linear-gradient(45deg,' + cols[0] + ' 0 6px,' + cols[1] + ' 6px 12px)' : cols[0];
      var dim = atlas.hot && hit.every(function (a) { return a.name !== atlas.hot; }) ? ' dim' : '';
      var hot = atlas.hot && hit.some(function (a) { return a.name === atlas.hot; }) ? ' hot' : '';
      keys += '<button type="button" class="key' + dim + hot + '" style="--c:' + bg + '" data-letter="' + l + '" aria-label="Huruf ' + l + ': ' + esc(hit.map(function (a) { return a.name; }).join(' atau ')) + '">' + l + '</button>';
    });

    var list = areas.map(function (a, i) {
      var amb = a.letters.filter(function (l) { return areas.filter(function (b) { return b.letters.indexOf(l) !== -1; }).length > 1; });
      return '<button type="button" class="area' + (atlas.hot === a.name ? ' hot' : '') + '" data-area="' + esc(a.name) + '">' +
        '<i style="--c:' + PALETTE[i % PALETTE.length] + '"></i><span class="an">' + esc(a.name) +
        '<span class="ap">' + esc(a.province) + (amb.length ? ' &middot; huruf ' + esc(compress(amb)) + ' juga tercatat untuk daerah lain' : '') + '</span></span>' +
        '<span class="al">' + esc(a.letters.length === 26 ? 'semua' : compress(a.letters)) + '</span></button>';
    }).join('');

    var vf = D.verifyOf(prefix);
    var vline = areas.length
      ? '<div class="atlas-ver">' + verifHtml({ checked: vf.checked, status: vf.status }) + '<p class="muted">' + esc(vf.note) + '</p>' +
        '<a class="btn small" target="_blank" rel="noopener noreferrer" href="' + esc(issueUrl({ kode: prefix, huruf: atlas.hotLetter || '', hasil: 'Peta huruf kode ' + prefix })) + '">Data kode ini salah?</a></div>'
      : '';
    var body = areas.length
      ? vline + '<div class="readout" id="readout" aria-live="polite">Kode ' + esc(prefix) + '<small>' + esc(row.province) + '. Sentuh sebuah huruf atau daerah.</small></div>' +
        '<div class="keys">' + keys + '</div><div class="area-list">' + list + '</div>'
      : '<div class="readout">Kode ' + esc(prefix) + '<small>' + esc(row.province) + ': ' + esc(row.areas) + '. Rincian huruf seri untuk kode ini belum ada di data aplikasi.</small></div>';

    return '<div class="atlas"><div class="atlas-head"><span>Kode ' + esc(prefix) + '</span><span>' + esc(row.province) + ' &middot; ' + areas.length + ' daerah</span></div><div class="atlas-body">' + body + '</div></div>';
  }

  function drawAtlas() {
    $('#atlas').innerHTML = atlasHtml();
    var sel = $('#prefix-sel'); if (sel) sel.value = atlas.prefix;
  }

  function readout(html) { var r = $('#readout'); if (r) r.innerHTML = html; }

  function showAtlas(prefix, hot) {
    atlas.prefix = prefix; atlas.hot = hot || null;
    drawAtlas();
    if (hot) {
      var a = D.areasOfPrefix(prefix).filter(function (x) { return x.name === hot; })[0];
      if (a) readout(esc(a.name) + '<small>' + esc(a.province) + ' &middot; huruf seri: ' + esc(compress(a.letters)) + '</small>');
    }
  }

  function renderRef() {
    if (refDone) return;
    refDone = true;
    var h = '';

    h += '<div class="finder"><label for="find-input" class="field-label">Cari daerah atau kode</label>' +
      '<input id="find-input" class="txt" type="search" placeholder="mis. Cimahi atau Jakarta Selatan" autocomplete="off">' +
      '<div id="found" class="found" aria-live="polite"></div></div>';

    h += '<div class="pick"><label><span class="field-label">Kode wilayah</span><select id="prefix-sel" class="sel">' +
      D.PREFIX_ROWS.map(function (r) { return '<option value="' + esc(r[0]) + '">' + esc(r[0]) + ' — ' + esc(r[1]) + '</option>'; }).join('') +
      '</select></label><p class="muted">Warna tuts menandai daerah. Garis miring dua warna berarti huruf itu tercatat untuk lebih dari satu daerah.</p></div>';

    h += '<div id="atlas"></div>';

    h += '<details class="fold"><summary>Samsat Bandung Raya</summary><div class="fold-body"><p>' + esc(D.SAMSAT_NOTE) + '</p><div class="samsat-grid cols">';
    Object.keys(D.REGIONS).forEach(function (k) {
      D.SAMSAT[k].forEach(function (s) {
        h += '<div class="samsat"><div class="tag">' + esc(D.REGIONS[k].name) + '</div><div class="name">' + esc(s.name) + '</div><div class="meta">' + esc(s.address) + '</div><div class="meta">' + esc(s.phone) + '</div></div>';
      });
    });
    h += '</div></div></details>';

    var jkt = {};
    Object.keys(D.SAMSAT_AREA).filter(function (k) { return k.indexOf('B|') === 0; }).forEach(function (k) {
      D.SAMSAT_AREA[k].offices.forEach(function (o) { jkt[o.name] = o; });
    });
    h += '<details class="fold"><summary>Samsat Jakarta</summary><div class="fold-body"><p>Alamat dari DDTCNews (6 Nov 2026); telepon dan jam hari kerja belum terverifikasi.</p><div class="samsat-grid cols">' +
      Object.keys(jkt).map(function (n) { return '<div class="samsat"><div class="name">' + esc(n) + '</div><div class="meta">' + esc(jkt[n].address) + '</div></div>'; }).join('') +
      '</div></div></details>';

    h += '<details class="fold"><summary>Rentang nomor dan jenis kendaraan</summary><div class="fold-body"><p>' + esc(D.NUMBER_NOTE) + '</p><div class="table-wrap" style="margin:0;box-shadow:none"><table><thead><tr><th>Nomor</th><th>Jenis</th></tr></thead><tbody>' +
      D.NUMBER_RANGES.map(function (r) { return '<tr><td class="mono">' + r.from + ' – ' + r.to + '</td><td>' + esc(r.label) + '</td></tr>'; }).join('') + '</tbody></table></div></div></details>';

    h += '<details class="fold"><summary>Warna plat</summary><div class="fold-body"><div class="samsat-grid cols">' +
      Object.keys(D.COLORS).map(function (k) {
        var c = D.COLORS[k];
        return '<div class="color-card"><div><span class="mini-plate" style="--pb:' + c.bg + ';--pf:' + c.fg + '">D 1234</span></div><div class="name" style="font:800 1.2rem/1 var(--f-display);text-transform:uppercase">' + esc(c.usage) + '</div><div class="meta" style="font-size:.9rem;color:var(--ink-2)">' + esc(c.detail) + '</div></div>';
      }).join('') + '</div></div></details>';

    h += '<details class="fold"><summary>Kode khusus</summary><div class="fold-body"><div class="samsat-grid cols">' +
      D.SPECIAL_CODES.map(function (c) { return '<div class="samsat"><div class="name">' + esc(c.code) + '</div><div class="tag">' + esc(c.title) + '</div><div class="meta">' + esc(c.text) + '</div></div>'; }).join('') + '</div></div></details>';

    h += '<details class="fold"><summary>Semua kode wilayah (' + D.PREFIX_ROWS.length + ')</summary><div class="fold-body">' +
      '<input id="prefix-filter" class="txt" type="search" placeholder="Saring: kode, provinsi, atau daerah"><div class="table-wrap" style="margin:0;box-shadow:none"><table><thead><tr><th>Kode</th><th>Provinsi</th><th>Cakupan</th></tr></thead><tbody id="prefix-body"></tbody></table></div></div></details>';

    $('#ref-content').innerHTML = h;
    drawAtlas();

    // pilih kode
    $('#prefix-sel').addEventListener('change', function () { showAtlas(this.value); });

    // interaksi atlas (delegasi)
    $('#atlas').addEventListener('click', function (e) {
      var k = e.target.closest('[data-letter]');
      var a = e.target.closest('[data-area]');
      if (k) {
        var l = k.getAttribute('data-letter');
        var o = D.lookupOrigin(atlas.prefix, l);
        if (o) {
          atlas.hot = o.candidates[0].name;
          drawAtlas();
          readout('Huruf ' + esc(l) + ' &rarr; ' + esc(o.candidates.map(function (c) { return c.name; }).join(' atau ')) +
            '<small>' + esc(o.candidates[0].province) + (o.confidence === 'tinggi' ? '' : ' &middot; keyakinan ' + esc(o.confidence)) + '</small>');
        }
      } else if (a) {
        showAtlas(atlas.prefix, a.getAttribute('data-area'));
      }
    });

    // cari balik
    $('#find-input').addEventListener('input', function () {
      var res = D.searchAreas(this.value, 30);
      $('#found').innerHTML = res.map(function (a, i) {
        return '<button type="button" class="found-row" data-fi="' + i + '"><span class="pf">' + esc(a.prefix) + '</span><span class="fn">' + esc(a.name) +
          '</span><span class="fm">' + esc(a.province) + ' &middot; huruf seri <b>' + esc(a.letters.length === 26 ? 'semua' : compress(a.letters)) + '</b></span></button>';
      }).join('') || (this.value.trim() ? '<p class="muted">Tidak ada yang cocok.</p>' : '');
      $('#found').__res = res;
    });
    $('#found').addEventListener('click', function (e) {
      var b = e.target.closest('[data-fi]');
      if (!b) return;
      var a = this.__res[Number(b.getAttribute('data-fi'))];
      showAtlas(a.prefix, a.name);
      $('#atlas').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // tabel semua kode
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

  /* --------------------------------------------------------------- akurasi */
  var infoDone = false;
  function renderInfo() {
    if (infoDone) return;
    infoDone = true;
    var srcs = Object.keys(D.SOURCES).map(function (k) {
      return '<li><a href="' + esc(D.SOURCES[k].url) + '" target="_blank" rel="noopener noreferrer">' + esc(D.SOURCES[k].title) + '</a></li>';
    }).join('');
    var V = D.VERIFY;
    var order = { 'konflik': 0, 'sebagian': 1, 'tanpa-pembanding': 2, 'cocok': 3 };
    var rows = D.PREFIX_ROWS.map(function (r) {
      var has = D.hasDetail(r[0]);
      var v = has ? D.verifyOf(r[0]) : null;
      return { code: r[0], prov: r[1], has: has, v: v };
    }).sort(function (x, y) {
      var ox = x.v ? order[x.v.status] : 4, oy = y.v ? order[y.v.status] : 4;
      return ox - oy || (x.code < y.code ? -1 : 1);
    });
    var table = '<div class="table-wrap" style="margin:0;box-shadow:none"><table class="vtable"><thead><tr><th>Kode</th><th>Provinsi</th><th>Status</th><th>Dicek</th></tr></thead><tbody>' +
      rows.map(function (x) {
        return '<tr><td class="mono">' + esc(x.code) + '</td><td>' + esc(x.prov) + '</td><td>' +
          (x.v ? '<span class="ver-dot ' + esc(x.v.status) + '"></span>' + esc(STATUS_SHORT[x.v.status]) : 'tingkat provinsi') +
          '</td><td class="nw">' + (x.v ? esc(idDate(x.v.checked).replace(/ \d{4}$/, '')) : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    $('#info-content').innerHTML = '<div class="prose">' +
      '<p>Tidak ada API atau dokumen resmi Polri maupun Samsat yang menerbitkan pembagian huruf seri plat. Aplikasi ini memakai tabel publik, dan <b>setiap hasil diberi cap tingkat keyakinan serta tanggal pemeriksaan</b> supaya Anda tahu seberapa kuat dasarnya.</p>' +
      '<div><div class="legend-row"><div class="stamp tinggi">Keyakinan tinggi</div><p>Tabel utama cocok dengan setidaknya satu artikel lain yang memuat tabel rinci, tanpa ada yang bertentangan untuk huruf itu. Contoh: plat B, plat H, huruf A–R plat D.</p></div>' +
      '<div class="legend-row"><div class="stamp sedang">Keyakinan sedang</div><p>Hanya satu tabel yang tersedia, atau pembandingnya tidak memuat huruf itu, atau mayoritas sumber sepakat dengan satu yang berbeda (contoh: S/T dan V/Y di plat D, plat KU).</p></div>' +
      '<div class="legend-row"><div class="stamp rendah">Ambigu</div><p>Sumber saling bertentangan atau satu huruf tercatat untuk beberapa daerah (contoh: W dan Z plat D, sebagian huruf plat N dan EA). Aplikasi menampilkan semua kandidat, bukan menebak.</p></div>' +
      '<div class="legend-row"><div class="stamp netral">Tingkat provinsi</div><p>Hanya provinsi yang bisa ditentukan: rincian huruf seri untuk kode itu belum ada, atau huruf tersebut tidak tercatat.</p></div></div>' +
      '<div class="note"><b class="tag">Catatan</b><span>"Cocok" berarti tidak ada tabel lain yang bertentangan, <b>bukan</b> data resmi. Sebagian besar penerbit (Moladin, detikOto, Daihatsu, Auto2000, Popmama, IDN Times) saling mengutip dan tidak terbukti independen. Karena itu kesalahan yang sama di semuanya tetap mungkin lolos.</span></div>' +
      '<h2>Status per kode wilayah</h2><p>Diurutkan dari yang paling perlu dicek. Terakhir diperiksa menyeluruh pada ' + esc(idDate(V.ASOF)) + '.</p>' + table +
      '<h2>Yang tidak bisa dibaca dari plat</h2><ul>' +
      '<li><b>Kantor Samsat spesifik.</b> Plat tidak memuatnya. Alamat Samsat tersedia untuk Bandung Raya (artikel 2017 dan 2021) dan Jakarta (DDTCNews, Nov 2026). Surabaya hanya nama kantornya. Daerah lain belum ada, dan semuanya sebaiknya dicek ulang sebelum berkunjung.</li>' +
      '<li><b>Pribadi atau umum.</b> Ditentukan warna plat, bukan angka atau huruf.</li>' +
      '<li><b>Jenis kendaraan.</b> Berdasarkan rentang nomor awal; nomor bisa dipakai ulang dengan seri lain, jadi sifatnya indikatif.</li>' +
      '<li><b>Pemilik, merek, tipe, dan status pajak.</b> Tidak tersedia secara publik. Untuk pajak, pakai kanal resmi Bapenda provinsi.</li>' +
      '<li><b>Pemekaran dan perubahan.</b> Sejak 2024 Papua Selatan (PS), Papua Tengah (PT), dan Papua Barat Daya (PY) punya kode sendiri, plat lama tetap berlaku. Kode Papua Pegunungan belum ditemukan di sumber. Kepulauan Seribu tidak tercantum di sumber mana pun, jadi hurufnya tidak bisa dipastikan.</li></ul>' +
      '<h2>Ada yang salah?</h2><p>Tombol <b>Data ini salah?</b> di hasil dan di Peta huruf membuka formulir di GitHub dengan kode dan huruf sudah terisi. Nomor plat lengkap tidak ikut dikirim. Koreksi paling berguna bila disertai sumber resmi (Bapenda, Samsat, Polda).</p>' +
      '<h2>Privasi</h2><p>Semua pemrosesan terjadi di perangkat Anda. Tidak ada plat yang dikirim ke server. Riwayat tersimpan lokal di browser dan bisa dihapus kapan saja.</p>' +
      '<h2>Sumber data</h2><ul class="src-list">' + srcs + '</ul></div>';
  }

  /* -------------------------------------------------------------- pintasan */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); showTab('cek'); $('#plate-input').focus();
    }
  });

  /* ------------------------------------------------------------------ init */
  renderSwatches();
  renderHistory();

  var qp = new URL(location.href).searchParams.get('plat');
  var tab = location.hash.replace('#', '');
  if (['cek', 'banyak', 'ref', 'info'].indexOf(tab) > -1) showTab(tab);
  if (qp) { $('#plate-input').value = qp.slice(0, 14); runSearch(false, false); }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
