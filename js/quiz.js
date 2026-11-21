/*
 * Kuis "Tebak plat".
 *
 * Hanya memakai huruf yang keyakinannya TINGGI dan menunjuk tepat satu daerah, supaya
 * jawaban "benar" di kuis tidak pernah berasal dari data yang diperdebatkan.
 *
 * Format UMD: window.PlatQuiz (browser) atau require('./quiz.js') (Node).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.PlatQuiz = factory(root.PlatData);
})(typeof self !== 'undefined' ? self : this, function (Data) {
  'use strict';

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var poolCache = null;

  /** Semua pasangan (kode, huruf) yang yakin tinggi dan tepat satu daerah. */
  function pool() {
    if (poolCache) return poolCache;
    poolCache = [];
    Object.keys(Data.PREFIXES).forEach(function (prefix) {
      if (prefix === 'L' || !Data.hasDetail(prefix)) return;
      LETTERS.forEach(function (letter) {
        var o = Data.lookupOrigin(prefix, letter);
        if (!o || o.confidence !== 'tinggi' || o.candidates.length !== 1) return;
        poolCache.push({ prefix: prefix, letter: letter, area: o.candidates[0].name, province: o.candidates[0].province });
      });
    });
    return poolCache;
  }

  /** RNG deterministik untuk tes. */
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** Tiga pengecoh: utamakan daerah sekode, lalu sepropinsi, lalu acak. Tidak pernah daerah yang juga memakai huruf itu. */
  function distractors(item, rng) {
    var chosen = [];
    function add(list) {
      shuffle(list, rng).forEach(function (a) {
        if (chosen.length >= 3) return;
        if (/\(sebagian\)/.test(a.name)) return;
        if (a.name === item.area || chosen.some(function (c) { return c.name === a.name; })) return;
        chosen.push({ name: a.name, province: a.province });
      });
    }
    var same = Data.areasOfPrefix(item.prefix).filter(function (a) { return a.letters.indexOf(item.letter) === -1; });
    add(same);
    if (chosen.length < 3) add(Data.AREA_LIST.filter(function (a) { return a.province === item.province && a.letters.indexOf(item.letter) === -1; }));
    if (chosen.length < 3) add(Data.AREA_LIST);
    return chosen;
  }

  function compress(letters) {
    return letters.length === 26 ? 'semua huruf' : letters.join(', ');
  }

  /** Satu soal. rng opsional (Math.random). */
  function makeQuestion(rng, item) {
    rng = rng || Math.random;
    item = item || pick(pool(), rng);
    var num = 1 + Math.floor(rng() * 9999);
    var extra = '';
    for (var n = Math.floor(rng() * 3); n > 0; n--) extra += pick(LETTERS, rng);
    var options = shuffle([{ name: item.area, province: item.province }].concat(distractors(item, rng)), rng);
    var answer = options.map(function (o) { return o.name; }).indexOf(item.area);
    var area = Data.areasOfPrefix(item.prefix).filter(function (a) { return a.name === item.area; })[0];
    return {
      plate: item.prefix + ' ' + num + ' ' + item.letter + extra,
      prefix: item.prefix,
      letter: item.letter,
      options: options,
      answer: answer,
      explain: 'Huruf pertama seri (' + item.letter + ') pada kode ' + item.prefix + ' menunjuk ' + item.area + ', ' + item.province +
        (area ? '. Huruf seri daerah ini: ' + compress(area.letters) + '.' : '.')
    };
  }

  /** Satu putaran berisi n soal dengan pasangan (kode, huruf) berbeda dan kode yang bervariasi. */
  function makeRound(n, rng) {
    rng = rng || Math.random;
    var items = shuffle(pool(), rng);
    var used = {}, out = [], leftover = [];
    items.forEach(function (it) {
      if (out.length >= n) return;
      if (used[it.prefix]) { leftover.push(it); return; }
      used[it.prefix] = true;
      out.push(it);
    });
    leftover.forEach(function (it) { if (out.length < n) out.push(it); });
    return out.map(function (it) { return makeQuestion(rng, it); });
  }

  return { pool: pool, seeded: seeded, makeQuestion: makeQuestion, makeRound: makeRound };
});
