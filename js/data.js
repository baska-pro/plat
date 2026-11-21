/*
 * Basis data CekPlat.
 * Setiap data memuat tingkat keyakinan (confidence) dan rujukan sumber agar
 * pengguna tahu mana yang pasti dan mana yang perlu diverifikasi.
 *
 * Format UMD: bisa dipakai di browser (window.PlatData) maupun Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./series.js'), require('./verify.js'));
  else root.PlatData = factory(root.PlatSeries, root.PlatVerify);
})(typeof self !== 'undefined' ? self : this, function (Series, Verify) {
  'use strict';

  /* ---------------------------------------------------------------- Sumber */
  var SOURCES = {
    auto2000Jkt: {
      title: 'Auto2000 - Kode Plat Nomor Belakang Jakarta',
      url: 'https://auto2000.co.id/berita-dan-tips/kode-plat-nomor-belakang-jakarta'
    },
    getandride: {
      title: 'GetAndRide - Detail Kode Plat Nomor Belakang',
      url: 'https://blog.getandride.com/tips/detail-kode-plat-nomor-belakang-kendaraan-indonesia-beserta-wilayahnya/'
    },
    auto2000H: {
      title: 'Auto2000 - Plat H Daerah Mana?',
      url: 'https://auto2000.co.id/berita-dan-tips/plat-nomor-h-tips'
    },
    moladin: {
      title: 'Moladin - 300+ Kode Plat Nomor Belakang Kendaraan dan Daerahnya',
      url: 'https://moladin.com/news/kode-plat-nomor-belakang-kendaraan-dan-daerahnya-2/'
    },
    popmama: {
      title: 'Popmama - Plat D Daerah Mana?',
      url: 'https://www.popmama.com/life/health/plat-d-daerah-mana-ini-daftar-lengkap-wilayah-dan-cara-cek-pajaknya-00-wjk9l-516pwd'
    },
    moladinSuffix: {
      title: 'Moladin - 300+ Kode Plat Nomor Belakang',
      url: 'https://moladin.com/news/kode-plat-nomor-belakang-kendaraan-dan-daerahnya-2/'
    },
    moladinList: {
      title: 'Moladin - Daftar Plat Nomor Kendaraan dan Daerahnya',
      url: 'https://moladin.com/news/daftar-plat-nomor-kendaraan-dan-daerahnya/'
    },
    detikSuffix: {
      title: 'detikOto - Kode Plat Nomor Belakang Kendaraan',
      url: 'https://oto.detik.com/berita/d-7309433/kode-plat-nomor-belakang-kendaraan-komponen-dan-wilayahnya'
    },
    detikPrefix: {
      title: 'detikOto - Plat D Daerah Mana? Daftar Kode Plat Seluruh Indonesia',
      url: 'https://oto.detik.com/berita/d-7086258/plat-d-daerah-mana-cek-daftar-kode-plat-nomor-seluruh-indonesia'
    },
    detikWarna: {
      title: 'detikOto - Arti Warna Pelat Nomor Kendaraan di Indonesia',
      url: 'https://oto.detik.com/berita/d-7932595/arti-warna-pelat-nomor-kendaraan-di-indonesia-ada-yang-hijau'
    },
    detikAngka: {
      title: 'detikOto - Arti Huruf dan Angka di Pelat Kendaraan',
      url: 'https://oto.detik.com/berita/d-5883632/ternyata-huruf-dan-angka-di-pelat-kendaraan-bermotor-punya-arti-tersendiri'
    },
    perkap2006: {
      title: 'Perkap Polri No. 4 Tahun 2006 tentang Penomoran Ranmor',
      url: 'https://kalsel.polri.go.id/perkap/2006/PERKAP%20NO%204%20TH%202006%20TTG%20PENOMORAN%20RANMOR.pdf'
    },
    wiki: {
      title: 'Wikipedia - Vehicle registration plates of Indonesia',
      url: 'https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Indonesia'
    },
    hukumonline: {
      title: 'Hukumonline - Arti Kode Plat Nomor Khusus dan Rahasia',
      url: 'https://www.hukumonline.com/klinik/a/ini-arti-kode-plat-nomor-khusus-dan-rahasia-untuk-kendaraan-pejabat-lt5fa10ac795848/'
    },
    ddtcSamsat2026: {
      title: 'DDTCNews: Samsat Jakarta buka hingga Sabtu (6 Nov 2026)',
      url: 'https://news.ddtc.co.id/berita/daerah/1823916/mudahkan-wajib-pajak-sejumlah-samsat-di-jakarta-buka-hingga-sabtu'
    },
    detikSamsatJaksel: {
      title: 'detikOto: Samsat Jakarta Selatan sampai jam berapa (Sep 2023)',
      url: 'https://oto.detik.com/berita/d-6938153/samsat-jakarta-selatan-sampai-jam-berapa-ini-keterangan-dan-layanannya'
    },
    detikSamsatSby: {
      title: 'detikJatim: Samsat Manyar Surabaya (Jan 2026)',
      url: 'https://www.detik.com/jatim/berita/d-8289768/samsat-manyar-surabaya-ramai-di-hari-pertama-kerja-usai-libur-tahun-baru'
    },
    pajakku38: {
      title: 'Pajakku: Link e-Samsat per provinsi (diperbarui Agu 2026)',
      url: 'https://pajakku.com/artikel/cek-pajak-motor-online-terbaru-lengkap-dengan-link-e-samsat-untuk-38-provinsi'
    },
    signalStore: {
      title: 'App Store: SIGNAL - Samsat Digital Nasional',
      url: 'https://apps.apple.com/us/app/signal-samsat-digital-nasional/id1587653489'
    },
    detikAplikasiPajak: {
      title: 'detikOto: 7 aplikasi cek pajak kendaraan resmi (Mar 2024)',
      url: 'https://oto.detik.com/berita/d-7268374/7-aplikasi-cek-pajak-kendaraan-resmi-dan-langkah-langkahnya'
    },
    samsat2017: {
      title: 'Seputar Bandung Raya - Alamat Samsat di Bandung Raya (2017)',
      url: 'https://www.seputarbandungraya.com/2017/12/alamat-nomor-telepon-dan-jam-layanan.html'
    },
    samsat2021: {
      title: 'Kumparan - Samsat Bandung: Lokasi dan Jam Operasional (2021)',
      url: 'https://kumparan.com/info-otomotif/samsat-bandung-ini-lokasi-dan-jam-operasionalnya-1wdVh1Hrnql'
    },
    bapenda: {
      title: 'Bapenda Jawa Barat (resmi)',
      url: 'https://bapenda.jabarprov.go.id/'
    }
  };

  /* --------------------------------------------- Wilayah di bawah plat "D" */
  var REGIONS = {
    kotaBandung: {
      key: 'kotaBandung',
      name: 'Kota Bandung',
      type: 'Kota',
      capital: 'Bandung',
      color: '#2f6bff'
    },
    cimahi: {
      key: 'cimahi',
      name: 'Kota Cimahi',
      type: 'Kota',
      capital: 'Cimahi',
      color: '#00a37a'
    },
    kabBandung: {
      key: 'kabBandung',
      name: 'Kabupaten Bandung',
      type: 'Kabupaten',
      capital: 'Soreang',
      color: '#e8920b'
    },
    kbb: {
      key: 'kbb',
      name: 'Kabupaten Bandung Barat (KBB)',
      type: 'Kabupaten',
      capital: 'Ngamprah',
      color: '#c43ad0'
    }
  };

  /*
   * Pemetaan HURUF PERTAMA seri -> wilayah.
   * Plat Bandung: "D 5002 FA" -> seri "FA" -> huruf pertama "F".
   *
   * Perbandingan 4 sumber (lihat README):
   *   - Popmama      : Bdg A-R | KabBdg S,T | KBB U,W,X | Cimahi V,Y,Z
   *   - Moladin #1   : Bdg A-R | KabBdg V,W,Y | KBB U,X,Z | Cimahi S,T
   *   - Moladin #2   : Bdg A-R | KabBdg V,Y,Z | KBB U,W,X | Cimahi S,T
   *   - detikOto     : Bdg A-R | KabBdg V,W,Y | KBB U,X,Z | Cimahi S,T
   *
   * confidence: 'tinggi' = semua sumber sepakat
   *             'sedang' = mayoritas sumber sepakat
   *             'rendah' = sumber saling bertentangan (ditandai ambigu)
   */
  var LETTER_MAP = {};
  function setLetters(letters, region, confidence, note, candidates) {
    letters.split('').forEach(function (l) {
      LETTER_MAP[l] = {
        letter: l,
        region: region,
        confidence: confidence,
        note: note || '',
        candidates: candidates || null
      };
    });
  }

  setLetters('ABCDEFGHIJKLMNOPR', 'kotaBandung', 'tinggi',
    'Seluruh sumber sepakat: huruf A sampai R untuk Kota Bandung.');
  setLetters('Q', 'kotaBandung', 'rendah',
    'Huruf Q tidak tercantum di daftar Moladin/detikOto, tetapi Popmama menyebut rentang A-R untuk Kota Bandung.',
    ['kotaBandung']);
  setLetters('UX', 'kbb', 'tinggi',
    'Seluruh sumber sepakat: huruf U dan X untuk Kabupaten Bandung Barat.');
  setLetters('ST', 'cimahi', 'sedang',
    '3 dari 4 sumber menempatkan S/T di Kota Cimahi; Popmama menempatkannya di Kabupaten Bandung.');
  setLetters('VY', 'kabBandung', 'sedang',
    '3 dari 4 sumber menempatkan V/Y di Kabupaten Bandung; Popmama menempatkannya di Kota Cimahi.');
  setLetters('W', 'kabBandung', 'rendah',
    'Sumber terbelah 2-2: Kabupaten Bandung (Moladin, detikOto) atau Bandung Barat (Moladin, Popmama).',
    ['kabBandung', 'kbb']);
  setLetters('Z', 'kbb', 'rendah',
    'Sumber terbelah: Bandung Barat (Moladin, detikOto), Kabupaten Bandung (Moladin), atau Cimahi (Popmama).',
    ['kbb', 'kabBandung']);

  /* ------------------------------------------------------------ Kantor Samsat */
  /*
   * Plat TIDAK memuat informasi kantor Samsat tertentu. Yang ditampilkan adalah
   * kantor Samsat yang melayani wilayah tersebut.
   * Data bersumber dari artikel 2017 dan 2021: telepon & jam layanan dapat berubah.
   */
  var HOURS = 'Sen-Jum 08.00-14.00, Sab 08.00-11.00 WIB';
  var SAMSAT = {
    kotaBandung: [
      {
        name: 'Samsat Bandung Barat (Kota Bandung I - Pajajaran)',
        address: 'Jl. Pajajaran No. 88, Kota Bandung',
        phone: '(022) 6021802',
        hours: HOURS
      },
      {
        name: 'Samsat Bandung Tengah (Kota Bandung II - Kawaluyaan)',
        address: 'Jl. Kawaluyaan Raya, Jatisari, Kota Bandung',
        phone: '(022) 7320869',
        hours: HOURS
      },
      {
        name: 'Samsat Bandung Timur (Kota Bandung III - Soekarno-Hatta)',
        address: 'Jl. Soekarno Hatta No. 528, Kota Bandung',
        phone: '(022) 7563998',
        hours: HOURS,
        note: 'Samsat Drive Thru berada di alamat yang sama (Sen-Sab 08.00-11.00 WIB, data 2017).'
      }
    ],
    cimahi: [
      {
        name: 'Samsat Cimahi',
        address: 'Jl. Raya Cibabat No. 331 A, Kota Cimahi',
        phone: '(022) 6645095',
        hours: HOURS
      }
    ],
    kabBandung: [
      {
        name: 'Samsat Rancaekek (Kab. Bandung I)',
        address: 'Jl. K.H. Ahmad Shadili No. 66, Rancaekek, Kab. Bandung',
        phone: '(022) 7793817',
        hours: HOURS
      },
      {
        name: 'Samsat Soreang (Kab. Bandung II)',
        address: 'Jl. Gading Tutuka, Soreang, Kab. Bandung',
        phone: '(022) 85870534',
        hours: HOURS
      }
    ],
    kbb: [
      {
        name: 'Samsat Cimareme (Kab. Bandung Barat)',
        address: 'Jl. Raya Cimareme No. 203 B, Kab. Bandung Barat',
        phone: '(022) 6621010',
        hours: HOURS,
        note: 'Di aplikasi peta, kantor ini juga tercatat di Jl. Raya Gadobangkong, Ngamprah.'
      }
    ]
  };

  /* -------------------------------------------------- Rentang nomor / jenis */
  /*
   * Rentang nomor registrasi per jenis kendaraan.
   * Sumber: Perkap 4/2006 Lampiran B (1-1999 penumpang, 2000-6999 motor,
   * 7000-7999 bus, 8000-9999 barang) dan detikOto (8000-8999 barang,
   * 9000-9999 khusus). Rentang ini aturan penjatahan awal; setelah nomor habis
   * Samsat dapat mengulang dengan huruf seri berbeda, jadi hasilnya indikatif.
   */
  var NUMBER_RANGES = [
    { from: 1, to: 1999, key: 'mobil', label: 'Mobil penumpang', icon: 'car' },
    { from: 2000, to: 6999, key: 'motor', label: 'Sepeda motor', icon: 'bike' },
    { from: 7000, to: 7999, key: 'bus', label: 'Bus', icon: 'bus' },
    { from: 8000, to: 8999, key: 'barang', label: 'Mobil barang (truk/pick-up)', icon: 'truck' },
    { from: 9000, to: 9999, key: 'khusus', label: 'Kendaraan khusus', icon: 'special' }
  ];

  /* --------------------------------------------------------- Warna plat */
  var COLORS = {
    putih: {
      key: 'putih',
      label: 'Putih, tulisan hitam',
      usage: 'Pribadi',
      detail: 'Kendaraan pribadi, badan hukum, perwakilan negara asing dan badan internasional (Perpol 7/2021). Skema ini berlaku sejak Juni 2022.',
      bg: '#f7f7f2', fg: '#111111', source: 'detikWarna'
    },
    hitam: {
      key: 'hitam',
      label: 'Hitam, tulisan putih',
      usage: 'Pribadi (skema lama)',
      detail: 'Skema lama kendaraan pribadi sebelum Juni 2022. Dalam Perkap 4/2006, hitam-putih juga dipakai untuk TNKB rahasia/khusus.',
      bg: '#121212', fg: '#f4f4f4', source: 'wiki'
    },
    kuning: {
      key: 'kuning',
      label: 'Kuning, tulisan hitam',
      usage: 'Umum / angkutan umum',
      detail: 'Kendaraan umum seperti angkot, bus, taksi, dan truk angkutan barang komersial.',
      bg: '#f4c20d', fg: '#111111', source: 'detikWarna'
    },
    merah: {
      key: 'merah',
      label: 'Merah, tulisan putih',
      usage: 'Dinas pemerintah',
      detail: 'Kendaraan dinas instansi pemerintah, termasuk layanan seperti pemadam kebakaran dan ambulans.',
      bg: '#c4161c', fg: '#ffffff', source: 'detikWarna'
    },
    hijau: {
      key: 'hijau',
      label: 'Hijau, tulisan hitam',
      usage: 'Kawasan perdagangan bebas',
      detail: 'Kendaraan di kawasan perdagangan bebas dengan pembebasan bea masuk (umumnya Batam).',
      bg: '#1f9d55', fg: '#111111', source: 'detikWarna'
    }
  };

  /* ----------------------------------------------------- Kode wilayah nasional */
  /* [kode, provinsi, daftar wilayah] - sumber: detikOto (55 kode) */
  var PREFIX_ROWS = [
    ['A', 'Banten', 'Cilegon, Lebak, Serang, Pandeglang'],
    ['B', 'DKI Jakarta (dan sekitarnya)', 'DKI Jakarta, Tangerang (kab/kota), Bekasi (kab/kota), Depok'],
    ['D', 'Jawa Barat', 'Kota Bandung, Kota Cimahi, Kabupaten Bandung, Kabupaten Bandung Barat'],
    ['E', 'Jawa Barat', 'Kuningan, Cirebon, Majalengka, Indramayu'],
    ['F', 'Jawa Barat', 'Bogor, Sukabumi, Cianjur'],
    ['T', 'Jawa Barat', 'Subang, Purwakarta, Karawang'],
    ['Z', 'Jawa Barat', 'Garut, Tasikmalaya, Sumedang, Ciamis, Banjar'],
    ['G', 'Jawa Tengah', 'Brebes, Pemalang, Batang, Tegal, Pekalongan'],
    ['H', 'Jawa Tengah', 'Salatiga, Semarang, Kendal, Demak'],
    ['K', 'Jawa Tengah', 'Cepu, Pati, Kudus, Jepara, Grobogan, Rembang, Blora'],
    ['R', 'Jawa Tengah', 'Banjarnegara, Banyumas, Cilacap, Purbalingga'],
    ['AA', 'Jawa Tengah', 'Kedu: Purworejo, Temanggung, Magelang, Wonosobo, Kebumen'],
    ['AD', 'Jawa Tengah', 'Boyolali, Klaten, Wonogiri, Sukoharjo, Surakarta, Karanganyar, Sragen'],
    ['AB', 'DI Yogyakarta', 'Yogyakarta, Bantul, Kulon Progo, Gunungkidul, Sleman'],
    ['L', 'Jawa Timur', 'Surabaya'],
    ['M', 'Jawa Timur', 'Madura: Bangkalan, Sampang, Sumenep, Pamekasan'],
    ['N', 'Jawa Timur', 'Malang, Pasuruan, Probolinggo, Batu, Lumajang'],
    ['S', 'Jawa Timur', 'Tuban, Jombang, Bojonegoro, Lamongan, Mojokerto'],
    ['W', 'Jawa Timur', 'Gresik, Sidoarjo'],
    ['P', 'Jawa Timur', 'Banyuwangi, Besuki, Bondowoso, Jember, Situbondo'],
    ['AG', 'Jawa Timur', 'Tulungagung, Kediri, Blitar, Trenggalek, Nganjuk'],
    ['AE', 'Jawa Timur', 'Ngawi, Madiun, Pacitan, Ponorogo, Magetan'],
    ['DK', 'Bali', 'Seluruh Bali'],
    ['DR', 'Nusa Tenggara Barat', 'Lombok, Lombok Tengah, Lombok Timur, Lombok Barat, Mataram'],
    ['EA', 'Nusa Tenggara Barat', 'Sumbawa, Bima, Dompu, Sumbawa Barat'],
    ['DH', 'Nusa Tenggara Timur', 'Kupang, Rote Ndao, Timor Tengah Selatan, Timor Tengah Utara'],
    ['EB', 'Nusa Tenggara Timur', 'Flores, Ende, Ngada, Sikka, Manggarai, Alor, Lembata'],
    ['ED', 'Nusa Tenggara Timur', 'Sumba Timur, Sumba Barat'],
    ['KB', 'Kalimantan Barat', 'Seluruh Kalimantan Barat'],
    ['KH', 'Kalimantan Tengah', 'Seluruh Kalimantan Tengah'],
    ['DA', 'Kalimantan Selatan', 'Seluruh Kalimantan Selatan'],
    ['KT', 'Kalimantan Timur', 'Seluruh Kalimantan Timur'],
    ['KU', 'Kalimantan Utara', 'Seluruh Kalimantan Utara'],
    ['DB', 'Sulawesi Utara', 'Manado, Bitung, Tomohon, Minahasa, Bolaang Mongondow'],
    ['DL', 'Sulawesi Utara', 'Sangihe, Talaud, Sitaro'],
    ['DM', 'Gorontalo', 'Seluruh Gorontalo'],
    ['DN', 'Sulawesi Tengah', 'Seluruh Sulawesi Tengah'],
    ['DT', 'Sulawesi Tenggara', 'Seluruh Sulawesi Tenggara'],
    ['DD', 'Sulawesi Selatan', 'Seluruh Sulawesi Selatan'],
    ['DP', 'Sulawesi Selatan', 'Parepare, Barru, Sidrap, Pinrang, Enrekang, Palopo, Luwu, Toraja'],
    ['DW', 'Sulawesi Selatan', 'Bone, Wajo, Soppeng, Sinjai'],
    ['DC', 'Sulawesi Barat', 'Seluruh Sulawesi Barat'],
    ['DE', 'Maluku', 'Seluruh Maluku'],
    ['DG', 'Maluku Utara', 'Seluruh Maluku Utara'],
    ['PA', 'Papua', 'Seluruh Papua'],
    ['PB', 'Papua Barat', 'Seluruh Papua Barat'],
    ['PS', 'Papua Selatan', 'Seluruh Papua Selatan (kode baru sejak 2024, sebelumnya PA)'],
    ['PT', 'Papua Tengah', 'Seluruh Papua Tengah (kode baru sejak 2024, sebelumnya PA)'],
    ['PY', 'Papua Barat Daya', 'Seluruh Papua Barat Daya (kode baru sejak 2024, sebelumnya PB)'],
    ['BL', 'Aceh', 'Seluruh Aceh'],
    ['BB', 'Sumatera Utara', 'Wilayah barat Sumatera Utara'],
    ['BK', 'Sumatera Utara', 'Wilayah timur Sumatera Utara'],
    ['BA', 'Sumatera Barat', 'Seluruh Sumatera Barat'],
    ['BM', 'Riau', 'Seluruh Riau'],
    ['BP', 'Kepulauan Riau', 'Seluruh Kepulauan Riau'],
    ['BH', 'Jambi', 'Seluruh Jambi'],
    ['BG', 'Sumatera Selatan', 'Seluruh Sumatera Selatan'],
    ['BN', 'Kepulauan Bangka Belitung', 'Seluruh Kepulauan Bangka Belitung'],
    ['BD', 'Bengkulu', 'Seluruh Bengkulu'],
    ['BE', 'Lampung', 'Seluruh Lampung']
  ];

  var PREFIXES = {};
  PREFIX_ROWS.forEach(function (r) {
    PREFIXES[r[0]] = { code: r[0], province: r[1], areas: r[2] };
  });

  /* --------------------------------------------------------- Kode khusus */
  var SPECIAL_CODES = [
    { code: 'CD', title: 'Korps Diplomatik', text: 'Kendaraan perwakilan diplomatik asing dan organisasi internasional. Diikuti kode negara/organisasi dan nomor urut; nomor 01 umumnya untuk duta besar.', source: 'wiki' },
    { code: 'CC', title: 'Korps Konsuler', text: 'Kendaraan perwakilan konsuler asing, formatnya sama dengan CD.', source: 'wiki' },
    { code: 'RI 1 / RI 2', title: 'Presiden / Wakil Presiden', text: 'Kode RI dengan nomor 1 untuk Presiden dan nomor 2 untuk Wakil Presiden, tanpa huruf seri.', source: 'perkap2006' },
    { code: 'RF*', title: 'Plat dinas pejabat (lama)', text: 'Menurut Wikipedia, seri RF (RFS, RFT, RFD, dst.) dihentikan Oktober 2023 dan diganti seri ZZ. Perlu diverifikasi ke sumber resmi.', source: 'wiki' },
    { code: 'ZZ', title: 'Plat dinas pejabat (baru)', text: 'Menurut Wikipedia, menggantikan seri RF sejak Oktober 2023. Perlu diverifikasi ke sumber resmi.', source: 'wiki' },
    { code: 'Nomor 1-99 tanpa seri', title: 'TNKB Khusus pejabat', text: 'Pejabat provinsi memakai kode wilayah dengan angka 1-5 dan seterusnya tanpa huruf seri (1 Gubernur, 2 Wakil Gubernur, 3 Ketua DPRD Provinsi, 4 Kajati, 5 Ketua Pengadilan Tinggi, 6-99 pejabat lain).', source: 'hukumonline' }
  ];

  /* ------------------------------------------------ Indeks huruf seri semua kode */
  /*
   * SERIES_INDEX[kode][huruf] = [ { name, province, letters }, ... ]
   * Lebih dari satu entri berarti sumber mencatat huruf itu untuk beberapa daerah.
   * Plat D tidak masuk indeks ini; ia memakai LETTER_MAP di atas.
   */
  var SERIES_INDEX = {};
  var AREA_LIST = []; // untuk pencarian balik: { prefix, name, province, letters }

  function provinceOf(prefix) {
    return PREFIXES[prefix] ? PREFIXES[prefix].province : '';
  }

  Object.keys(Series.RAW).forEach(function (prefix) {
    var idx = (SERIES_INDEX[prefix] = {});
    Series.RAW[prefix].forEach(function (row) {
      var area = { prefix: prefix, name: row[0], letters: row[1].split(''), province: row[2] || provinceOf(prefix) };
      AREA_LIST.push(area);
      area.letters.forEach(function (l) { (idx[l] = idx[l] || []).push(area); });
    });
  });

  // Plat D dimasukkan ke daftar pencarian (huruf diambil dari LETTER_MAP).
  Object.keys(REGIONS).forEach(function (key) {
    var letters = Object.keys(LETTER_MAP).filter(function (l) {
      var info = LETTER_MAP[l];
      return (info.candidates || [info.region]).indexOf(key) !== -1;
    });
    AREA_LIST.push({ prefix: 'D', name: REGIONS[key].name, province: 'Jawa Barat', letters: letters, regionKey: key });
  });

  Object.keys(Series.WHOLE).forEach(function (prefix) {
    AREA_LIST.push({ prefix: prefix, name: Series.WHOLE[prefix].name, province: provinceOf(prefix), letters: Series.ALL.split('') });
  });

  /** Kode yang punya rincian huruf seri -> daerah. */
  function hasDetail(prefix) {
    return prefix === 'D' || !!SERIES_INDEX[prefix] || !!Series.WHOLE[prefix];
  }

  /**
   * Asal daerah dari kode wilayah + huruf pertama seri.
   * @returns {null | {candidates:[{name,province,letters,regionKey?}], confidence, note, sources}}
   */
  function lookupOrigin(prefix, letter) {
    letter = (letter || '').charAt(0);

    if (prefix === 'D') {
      var info = LETTER_MAP[letter];
      if (!info) return null;
      var keys = info.candidates || [info.region];
      return {
        candidates: keys.map(function (k) {
          return { name: REGIONS[k].name, province: 'Jawa Barat', regionKey: k, letters: lettersOfRegion(k) };
        }),
        confidence: info.confidence,
        note: info.note,
        sources: ['popmama', 'moladinSuffix', 'moladinList', 'detikSuffix'],
        refs: srcRefs(['popmama', 'moladinSuffix', 'moladinList', 'detikSuffix']),
        checked: verifyOf('D').checked,
        status: info.confidence === 'tinggi' ? 'cocok' : (info.confidence === 'sedang' ? 'sebagian' : 'konflik')
      };
    }

    if (Series.WHOLE[prefix]) {
      var w = Series.WHOLE[prefix];
      return {
        candidates: [{ name: w.name, province: provinceOf(prefix), letters: Series.ALL.split('') }],
        confidence: w.conf,
        note: w.note,
        sources: ['detikPrefix'],
        refs: srcRefs(['detikPrefix']),
        checked: verifyOf(prefix).checked,
        status: 'cocok'
      };
    }

    var hit = SERIES_INDEX[prefix] && SERIES_INDEX[prefix][letter];
    var ov = Verify.LETTERS[prefix] && Verify.LETTERS[prefix][letter];
    if (!hit && !ov) return null;
    var meta = verifyOf(prefix);
    var out = {
      candidates: (hit || []).map(function (a) { return { name: a.name, province: a.province, letters: a.letters }; }),
      confidence: meta.conf,
      note: meta.note,
      sources: [],
      refs: meta.refs,
      checked: meta.checked,
      status: meta.status
    };
    if (hit && hit.length > 1) {
      out.confidence = 'rendah';
      out.note = 'Huruf ' + letter + ' tercatat untuk lebih dari satu daerah di tabel sumber: ' +
        hit.map(function (a) { return a.name; }).join(' / ') + '. Tidak bisa dipastikan hanya dari plat.';
      if (ov && ov.note) out.note += ' ' + ov.note;
    }
    if (ov) {
      if (ov.names) {
        out.candidates = ov.names.map(function (n) {
          var a = areaByName(prefix, n);
          return { name: a.name, province: a.province, letters: a.letters };
        });
      }
      out.confidence = out.candidates.length > 1 ? 'rendah' : ov.conf;
      if (!(hit && hit.length > 1)) out.note = ov.note;
    }
    return out;
  }

  function srcRefs(ids) {
    return ids.map(function (id) { return { label: SOURCES[id].title, url: SOURCES[id].url }; });
  }

  var DEFAULT_VERIFY = { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: 'Berasal dari satu tabel publik (Moladin) dan belum diverifikasi silang.' };

  /** Metadata verifikasi satu kode, dengan rujukan sudah berbentuk {label, url}. */
  function verifyOf(prefix) {
    var v = Verify.CODES[prefix] || DEFAULT_VERIFY;
    return {
      conf: v.conf,
      status: v.status,
      checked: v.checked || Verify.ASOF,
      note: v.note,
      refs: (v.refs || []).map(function (k) { return { label: Verify.REFS[k][0], url: Verify.REFS[k][1] }; })
    };
  }

  function areaByName(prefix, name) {
    var found = (SERIES_INDEX[prefix] ? Series.RAW[prefix] : []).filter(function (r) { return r[0] === name; })[0];
    return {
      name: name,
      province: (found && found[2]) || provinceOf(prefix),
      letters: found ? found[1].split('') : []
    };
  }

  function lettersOfRegion(key) {
    return Object.keys(LETTER_MAP).filter(function (l) {
      var info = LETTER_MAP[l];
      return (info.candidates || [info.region]).indexOf(key) !== -1;
    });
  }

  /** Daftar daerah sebuah kode, urut sesuai tabel. */
  function areasOfPrefix(prefix) {
    return AREA_LIST.filter(function (a) { return a.prefix === prefix; });
  }

  /** Pencarian balik: cari daerah (atau kode) lalu tampilkan kode + hurufnya. */
  function searchAreas(q, limit) {
    q = String(q || '').toLowerCase().trim();
    if (!q) return [];
    // Kueri yang persis sama dengan sebuah kode wilayah (mis. "dk") hanya mencari kode itu.
    var byCode = AREA_LIST.filter(function (a) { return a.prefix.toLowerCase() === q; });
    if (byCode.length) return limit ? byCode.slice(0, limit) : byCode;
    var res = AREA_LIST.filter(function (a) {
      return a.name.toLowerCase().indexOf(q) !== -1 || a.province.toLowerCase().indexOf(q) !== -1;
    });
    return limit ? res.slice(0, limit) : res;
  }

  /* ------------------------------------------------------------ Lainnya */
  var NUMBER_NOTE = 'Rentang nomor adalah aturan penjatahan awal. Karena nomor bisa digunakan ulang dengan seri huruf berbeda, hasil jenis kendaraan bersifat indikatif.';

  var SAMSAT_NOTE = 'Plat nomor tidak memuat kantor Samsat spesifik. Berikut kantor Samsat yang melayani wilayah ini. Alamat dan jam layanan bersumber dari artikel 2017 dan 2021, jadi cek ulang sebelum berkunjung.';

  /* -------------------------------------------- Samsat di luar Bandung Raya */
  /*
   * SAMSAT_AREA['KODE|Nama daerah'] = { note, src:[id sumber], offices:[{name, address, phone, hours, note}] }
   * Hanya daerah yang punya sumber alamat yang bisa dirujuk. Daerah lain tidak diisi
   * (aplikasi mengarahkan ke Bapenda), bukan ditebak.
   */
  var SAT_2026 = 'Sab 08.00-12.00 WIB, khusus 7 Nov-19 Des 2026. Jam hari kerja belum terverifikasi.';
  var JKT_NOTE = 'Plat Jakarta tidak menunjuk kantor Samsat tertentu. Ini kantor yang melayani wilayah tersebut. Alamat dari DDTCNews (6 Nov 2026); telepon dan jam hari kerja belum terverifikasi, jadi cek ulang sebelum berkunjung.';
  var INDUK_UTARA = { name: 'Samsat Induk Jakarta Pusat dan Utara', address: 'Jl. Gunung Sahari No. 13, Pademangan, Jakarta Utara', phone: '', hours: SAT_2026 };

  var SAMSAT_AREA = {
    'B|Kota Adm. Jakarta Selatan': { note: JKT_NOTE, src: ['ddtcSamsat2026', 'detikSamsatJaksel'], offices: [
      { name: 'Samsat Induk Jakarta Selatan', address: 'Komplek Gedung Polda Metro Jaya, Jl. Jenderal Gatot Subroto, Kebayoran Baru, Jakarta Selatan', phone: '',
        hours: 'Sen-Jum 08.00-15.00 WIB (data 2023); ' + SAT_2026.replace('Jam hari kerja belum terverifikasi.', '') .trim() },
      { name: 'Gerai Samsat Pasar Minggu', address: 'Jl. Raya Ragunan No. 16, Pasar Minggu, Jakarta Selatan', phone: '', hours: SAT_2026 }
    ] },
    'B|Kota Adm. Jakarta Timur': { note: JKT_NOTE, src: ['ddtcSamsat2026'], offices: [
      { name: 'Samsat Induk Jakarta Timur', address: 'Jl. D.I. Panjaitan Kav. 55, Jatinegara, Jakarta Timur', phone: '', hours: SAT_2026 },
      { name: 'Gerai Samsat Pulo Gadung', address: 'Jl. H. Darip No. 1, Jatinegara Kaum, Pulo Gadung, Jakarta Timur', phone: '', hours: SAT_2026 }
    ] },
    'B|Kota Adm. Jakarta Barat': { note: JKT_NOTE, src: ['ddtcSamsat2026'], offices: [
      { name: 'Samsat Induk Jakarta Barat', address: 'Jl. Daan Mogot KM 13, Cengkareng, Jakarta Barat', phone: '', hours: SAT_2026 },
      { name: 'Gerai Samsat Kebon Jeruk', address: 'Jl. Lapangan Bola No. 2 (belakang Kantor Kecamatan Kebon Jeruk), Jakarta Barat', phone: '', hours: SAT_2026 }
    ] },
    'B|Kota Adm. Jakarta Utara': { note: JKT_NOTE, src: ['ddtcSamsat2026'], offices: [
      INDUK_UTARA,
      { name: 'Gerai Samsat Penjaringan', address: 'Jl. Pluit Raya No. 5, Penjaringan, Jakarta Utara', phone: '', hours: SAT_2026 }
    ] },
    'B|Kota Adm. Jakarta Pusat': { note: JKT_NOTE, src: ['ddtcSamsat2026'], offices: [
      INDUK_UTARA,
      { name: 'Gerai Samsat Kemayoran', address: 'Jl. Serdang III No. 1, Serdang, Kemayoran, Jakarta Pusat', phone: '', hours: SAT_2026 }
    ] },
    'L|Kota Surabaya': { note: 'Sumber (detikJatim, Jan 2026) hanya menyebut empat Samsat Surabaya: Barat, Timur, Utara, dan Selatan, dengan Manyar sebagai Samsat Surabaya Timur. Alamat belum terverifikasi; tombol Peta mencari lewat nama.', src: ['detikSamsatSby'], offices: [
      { name: 'Samsat Surabaya Timur (Manyar)', address: '', phone: '', hours: '' },
      { name: 'Samsat Surabaya Barat', address: '', phone: '', hours: '' },
      { name: 'Samsat Surabaya Utara', address: '', phone: '', hours: '' },
      { name: 'Samsat Surabaya Selatan', address: '', phone: '', hours: '' }
    ] }
  };


  /* ------------------------------------------------- Kanal resmi cek pajak */
  /*
   * CekPlat tidak menyimpan atau mencari data kendaraan. Untuk status pajak, pengguna
   * diarahkan ke kanal resmi. Daftar URL provinsi dari Pajakku (diperbarui Agu 2026,
   * satu sumber pengumpul), jadi bisa berubah; provinsi tanpa URL yang terverifikasi
   * memakai pencarian web, bukan tebakan alamat.
   */
  var TAX_SIGNAL = {
    name: 'SIGNAL (Samsat Digital Nasional)',
    text: 'Aplikasi nasional untuk cek dan bayar pajak, pengesahan STNK, dan SWDKLLJ kendaraan pribadi. Cari "SIGNAL Samsat Digital Nasional" di Play Store atau App Store.',
    url: SOURCES.signalStore.url
  };
  var TAX_SITES = {
    'Banten': ['https://infopkb.bantenprov.go.id/', 'Aplikasi Sambat'],
    'DI Yogyakarta': ['https://samsatsleman.jogjaprov.go.id/cek/pajak'],
    'DKI Jakarta': ['https://samsat-pkb2.jakarta.go.id/'],
    'Jawa Barat': ['https://bapenda.jabarprov.go.id/e-samsat-jabar', 'Aplikasi Sambara'],
    'Jawa Tengah': [null, 'Aplikasi New Sakpole'],
    'Jawa Timur': ['https://bapenda.jatimprov.go.id/info/pkb'],
    'Bali': ['https://portal.bpdbali.id/infosamsat/'],
    'Nusa Tenggara Timur': ['https://samsat.bpdntt.co.id/'],
    'Aceh': ['https://esamsat.acehprov.go.id/'],
    'Kepulauan Bangka Belitung': ['https://samsat-sungailiat.babelprov.go.id/layanan'],
    'Bengkulu': ['https://pusako.bengkuluprov.go.id/infopajak'],
    'Jambi': ['https://jambisamsat.net/infopkb.html'],
    'Kepulauan Riau': [null, 'Aplikasi ESamsat Kepri'],
    'Riau': ['https://bapenda.riau.go.id/dashboard/layanan/infopajak'],
    'Sumatera Barat': ['https://bapenda.sumbarprov.go.id/content/info_pajak_kendaraan', 'Aplikasi E-Samsat Sumbar'],
    'Sumatera Utara': ['https://bapenda.sumutprov.go.id/website/pajak#/pkb/info-pkb'],
    'Kalimantan Barat': ['https://jipp.kalbarprov.go.id/inovasi/view/173'],
    'Kalimantan Selatan': ['https://bapenda.kalselprov.go.id/'],
    'Kalimantan Tengah': ['https://pajak.samsatkalteng.com/'],
    'Kalimantan Utara': ['https://dkisp.tarakankota.go.id/esamsat-kalimantan-utara/'],
    'Gorontalo': ['https://gorontaloprov.go.id/esamsat'],
    'Sulawesi Barat': ['https://web.bpkpd.sulbarprov.go.id/'],
    'Sulawesi Selatan': ['https://bapenda.sulselprov.go.id/', 'Aplikasi Bapenda Sulsel Mobile'],
    'Sulawesi Tengah': ['https://bapenda.sultengprov.go.id/pkb'],
    'Sulawesi Tenggara': ['https://sultraprov.go.id/esamsat'],
    'Sulawesi Utara': ['https://bapenda.sulutprov.go.id/cekpajak'],
    'Maluku': ['https://esamsat.malukuprov.go.id/kiosk/kiosk.aspx'],
    'Maluku Utara': ['https://esamsat.malutprov.go.id/']
  };

  /** Kanal resmi untuk satu provinsi: {province, site, app, searchUrl}. */
  function taxChannels(province) {
    var key = String(province || '').replace(/\s*\(.*\)\s*$/, '');
    var t = TAX_SITES[key];
    return {
      province: key,
      site: t && t[0] ? t[0] : '',
      app: t && t[1] ? t[1] : '',
      searchUrl: 'https://www.google.com/search?q=' + encodeURIComponent('cek pajak kendaraan bapenda ' + key + ' resmi')
    };
  }


  return {
    SOURCES: SOURCES,
    REGIONS: REGIONS,
    LETTER_MAP: LETTER_MAP,
    SERIES_INDEX: SERIES_INDEX,
    AREA_LIST: AREA_LIST,
    hasDetail: hasDetail,
    lookupOrigin: lookupOrigin,
    areasOfPrefix: areasOfPrefix,
    searchAreas: searchAreas,
    SAMSAT: SAMSAT,
    SAMSAT_AREA: SAMSAT_AREA,
    verifyOf: verifyOf,
    TAX_SIGNAL: TAX_SIGNAL,
    TAX_SITES: TAX_SITES,
    taxChannels: taxChannels,
    VERIFY: Verify,
    NUMBER_RANGES: NUMBER_RANGES,
    COLORS: COLORS,
    PREFIXES: PREFIXES,
    PREFIX_ROWS: PREFIX_ROWS,
    SPECIAL_CODES: SPECIAL_CODES,
    NUMBER_NOTE: NUMBER_NOTE,
    SAMSAT_NOTE: SAMSAT_NOTE
  };
});
