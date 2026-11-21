/*
 * Tabel huruf seri -> daerah asal, per kode wilayah.
 *
 * Aturan baca: HURUF PERTAMA setelah angka menentukan daerah.
 *   "B 1234 SKA"  -> huruf S -> Kota Adm. Jakarta Selatan
 *   "D 5002 FA"   -> huruf F -> Kota Bandung
 * (diverifikasi untuk plat H lewat Auto2000; tanda * di tabel Moladin hanyalah
 *  artefak format.)
 *
 * Sumber tabel: Moladin "300+ Kode Plat Nomor Belakang" (semua kode); KU, DP, DW dari
 * Daihatsu dan detikOto. Hasil perbandingan dengan penerbit lain (tingkat keyakinan,
 * tanggal cek, huruf yang diperdebatkan) ada di verify.js, bukan di sini.
 * Plat D ditangani terpisah di data.js karena sumbernya saling bertentangan.
 *
 * Format baris: [nama daerah, huruf-huruf, provinsi (opsional, menimpa default kode)]
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PlatSeries = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  var RAW = {
    /* ----------------------------------------------------------- Banten / Jabodetabek */
    A: [
      ['Kota Serang', 'ABCD'],
      ['Kabupaten Serang', 'EFGHI'],
      ['Kabupaten Pandeglang', 'JKLMN'],
      ['Kota Cilegon', 'OU'],
      ['Kabupaten Lebak', 'PRST'],
      ['Kabupaten Tangerang', 'VWXYZ']
    ],
    B: [
      ['Kota Adm. Jakarta Barat', 'B', 'DKI Jakarta'],
      ['Kota Adm. Jakarta Pusat', 'P', 'DKI Jakarta'],
      ['Kota Adm. Jakarta Selatan', 'S', 'DKI Jakarta'],
      ['Kota Adm. Jakarta Timur', 'T', 'DKI Jakarta'],
      ['Kota Adm. Jakarta Utara', 'U', 'DKI Jakarta'],
      ['Kota Bekasi', 'K', 'Jawa Barat'],
      ['Kabupaten Bekasi', 'F', 'Jawa Barat'],
      ['Kota Depok', 'EZ', 'Jawa Barat'],
      ['Kota Tangerang', 'CV', 'Banten'],
      ['Kota Tangerang Selatan', 'W', 'Banten'],
      ['Kabupaten Tangerang', 'GN', 'Banten']
    ],

    /* ----------------------------------------------------------------------- Jawa Barat */
    E: [
      ['Kota Cirebon', 'ABCDEFG'],
      ['Kabupaten Cirebon', 'HIJKLMNO'],
      ['Kabupaten Indramayu', 'PQRST'],
      ['Kabupaten Majalengka', 'UVWX'],
      ['Kabupaten Kuningan', 'YZ']
    ],
    F: [
      ['Kota Bogor', 'ABCDE'],
      ['Kabupaten Bogor', 'FGHIJKLMNOPR'],
      ['Kabupaten Sukabumi', 'QUV'],
      ['Kota Sukabumi', 'ST'],
      ['Kabupaten Cianjur', 'WXYZ']
    ],
    T: [
      ['Kabupaten Purwakarta', 'ABC'],
      ['Kabupaten Karawang', 'DEFGHIJKLMNOPQRS'],
      // Sumber hanya menulis "sebagian Kab. Bekasi & Subang" untuk T-Z: sengaja dibiarkan ambigu.
      ['Kabupaten Subang', 'TUVWXYZ'],
      ['Kabupaten Bekasi (sebagian)', 'TUVWXYZ']
    ],
    Z: [
      ['Kabupaten Sumedang', 'ABC'],
      ['Kabupaten Garut', 'DEFG'],
      ['Kota Tasikmalaya', 'HIJ'],
      ['Kabupaten Tasikmalaya', 'KLMNOPQRS'],
      ['Kabupaten Ciamis', 'TUV'],
      ['Kabupaten Pangandaran', 'W'],
      ['Kota Banjar', 'XYZ']
    ],

    /* ---------------------------------------------------------------------- Jawa Tengah */
    G: [
      ['Kota Pekalongan', 'AHS'],
      ['Kabupaten Pekalongan', 'BKOT'],
      ['Kabupaten Batang', 'CLVX'],
      ['Kabupaten Pemalang', 'DIMW'],
      ['Kota Tegal', 'ENY'],
      ['Kabupaten Tegal', 'FPQZ'],
      ['Kabupaten Brebes', 'GJRU']
    ],
    H: [
      ['Kota Semarang', 'AFGHPQRSWXYZ'],
      ['Kota Salatiga', 'BKOT'],
      ['Kabupaten Semarang', 'CILV'],
      ['Kabupaten Kendal', 'DMU'],
      ['Kabupaten Demak', 'EJN']
    ],
    K: [
      ['Kabupaten Pati', 'AGHSU'],
      ['Kabupaten Kudus', 'BKORT'],
      ['Kabupaten Jepara', 'CLQV'],
      ['Kabupaten Rembang', 'DIMW'],
      ['Kabupaten Blora', 'ENXY'],
      ['Kabupaten Grobogan', 'FJPZ']
    ],
    R: [
      ['Kabupaten Banyumas', 'AEGHJSX'],
      ['Kabupaten Cilacap', 'BFKNPRT'],
      ['Kabupaten Purbalingga', 'CLQUVZ'],
      ['Kabupaten Banjarnegara', 'DIMOWY']
    ],
    AA: [
      ['Kota Magelang', 'AHSU'],
      ['Kabupaten Magelang', 'BGKOT'],
      ['Kabupaten Purworejo', 'CLQV'],
      ['Kabupaten Kebumen', 'DJMW'],
      ['Kabupaten Temanggung', 'ENY'],
      ['Kabupaten Wonosobo', 'FPZ']
    ],
    AD: [
      ['Kota Surakarta (Solo)', 'AHSU'],
      ['Kabupaten Sukoharjo', 'BKOT'],
      ['Kabupaten Klaten', 'CJLQV'],
      ['Kabupaten Boyolali', 'DMW'],
      ['Kabupaten Sragen', 'ENY'],
      ['Kabupaten Karanganyar', 'FPZ'],
      ['Kabupaten Wonogiri', 'GIR']
    ],
    AB: [
      ['Kota Yogyakarta', 'AFHIS'],
      ['Kabupaten Bantul', 'BGJKT'],
      ['Kabupaten Kulon Progo', 'CLPV'],
      ['Kabupaten Gunungkidul', 'DMW'],
      ['Kabupaten Sleman', 'ENQUYZ']
    ],

    /* ----------------------------------------------------------------------- Jawa Timur */
    M: [
      ['Kabupaten Pamekasan', 'ABCDEFG'],
      ['Kabupaten Bangkalan', 'HIJKLMN'],
      ['Kabupaten Sampang', 'OPQRST'],
      ['Kabupaten Sumenep', 'UVWXYZ']
    ],
    N: [
      ['Kota Malang', 'ABCE'],
      ['Kabupaten Malang', 'DFGHIJ'],
      ['Kota Batu', 'KL'],
      ['Kabupaten Probolinggo', 'MNP'],
      ['Kota Probolinggo', 'QRS'],
      ['Kabupaten Pasuruan', 'OTW'],
      ['Kota Pasuruan', 'VX'],
      ['Kabupaten Lumajang', 'UYZ']
    ],
    P: [
      ['Kabupaten Bondowoso', 'ABCD'],
      ['Kabupaten Situbondo', 'EFGHIJ'],
      ['Kabupaten Jember', 'KLMNOPQRST'],
      ['Kabupaten Banyuwangi', 'UVWXYZ']
    ],
    S: [
      ['Kabupaten Bojonegoro', 'ABCD'],
      ['Kabupaten Tuban', 'EFGH'],
      ['Kabupaten Lamongan', 'IJKL'],
      ['Kabupaten Mojokerto', 'MNOPQR'],
      ['Kota Mojokerto', 'STUV'],
      ['Kabupaten Jombang', 'WXYZ']
    ],
    W: [
      ['Kabupaten Gresik', 'ABCDEFGHIJKLM'],
      ['Kabupaten Sidoarjo', 'NOPQRSTUVWXYZ']
    ],
    AE: [
      ['Kota Madiun', 'ABC'],
      ['Kabupaten Madiun', 'DEFG'],
      ['Kabupaten Ngawi', 'HIJKL'],
      ['Kabupaten Magetan', 'MNOPQR'],
      ['Kabupaten Ponorogo', 'STUV'],
      ['Kabupaten Pacitan', 'WXYZ']
    ],
    AG: [
      ['Kota Kediri', 'ABC'],
      ['Kabupaten Kediri', 'DEFGHJ'],
      ['Kabupaten Blitar', 'IKLMN'],
      ['Kabupaten Tulungagung', 'ORST'],
      ['Kota Blitar', 'PQ'],
      ['Kabupaten Nganjuk', 'UVWX'],
      ['Kabupaten Trenggalek', 'YZ']
    ],

    /* -------------------------------------------------------------------- Bali & Nusa Tenggara */
    DK: [
      ['Kota Denpasar', 'ABCDEIQX'],
      ['Kabupaten Badung', 'FJO'],
      ['Kabupaten Tabanan', 'GH'],
      ['Kabupaten Gianyar', 'KL'],
      ['Kabupaten Klungkung', 'MN'],
      ['Kabupaten Bangli', 'PR'],
      ['Kabupaten Karangasem', 'ST'],
      ['Kabupaten Buleleng', 'UV'],
      ['Kabupaten Jembrana', 'WZ']
    ],
    DR: [
      ['Kota Mataram', 'ABCDE'],
      ['Kabupaten Lombok Barat', 'HJK'],
      ['Kabupaten Lombok Timur', 'L'],
      ['Kabupaten Lombok Tengah', 'S'],
      ['Kabupaten Lombok Utara', 'RT']
    ],
    EA: [
      ['Kabupaten Sumbawa', 'A'],
      ['Kabupaten Sumbawa Barat', 'H'],
      ['Kabupaten Dompu', 'R'],
      ['Kota Bima', 'S'],
      ['Kabupaten Bima', 'XY']
    ],
    DH: [
      ['Kota/Kabupaten Kupang', 'ABC'],
      ['Kabupaten Timor Tengah Utara', 'D'],
      ['Kabupaten Timor Tengah Selatan', 'E'],
      ['Kabupaten Alor', 'F'],
      ['Kabupaten Belu', 'G'],
      ['Kabupaten Rote Ndao', 'U']
    ],
    EB: [
      ['Kabupaten Ende', 'A'],
      ['Kabupaten Sikka', 'B'],
      ['Kabupaten Ngada', 'C'],
      ['Kabupaten Flores Timur', 'D'],
      ['Kabupaten Manggarai Barat', 'E'],
      ['Kabupaten Lembata', 'F'],
      ['Kabupaten Manggarai', 'G']
    ],
    ED: [
      ['Kabupaten Sumba Barat', 'A'],
      ['Kabupaten Sumba Timur', 'B']
    ],

    /* --------------------------------------------------------------------------- Kalimantan */
    KB: [
      ['Kota Pontianak', 'AQSW'],
      ['Kabupaten Mempawah', 'B'],
      ['Kota Singkawang', 'C'],
      ['Kabupaten Sanggau', 'D'],
      ['Kabupaten Sintang', 'E'],
      ['Kabupaten Kapuas Hulu', 'F'],
      ['Kabupaten Ketapang', 'G'],
      ['Kabupaten Melawi', 'H'],
      ['Kabupaten Bengkayang', 'K'],
      ['Kabupaten Landak', 'L'],
      ['Kabupaten Kubu Raya', 'M'],
      ['Kabupaten Sambas', 'P'],
      ['Kabupaten Sekadau', 'V'],
      ['Kabupaten Kayong Utara', 'Z']
    ],
    KH: [
      ['Kota Palangkaraya', 'ATY'],
      ['Kabupaten Kapuas', 'BC'],
      ['Kabupaten Barito Selatan', 'D'],
      ['Kabupaten Barito Utara', 'E'],
      ['Kabupaten Kotawaringin Timur', 'FLW'],
      ['Kabupaten Kotawaringin Barat', 'GV'],
      ['Kabupaten Gunung Mas', 'H'],
      ['Kabupaten Pulang Pisau', 'J'],
      ['Kabupaten Barito Timur', 'K'],
      ['Kabupaten Murung Raya', 'M'],
      ['Kabupaten Katingan', 'NU'],
      ['Kabupaten Seruyan', 'P'],
      ['Kabupaten Lamandau', 'R'],
      ['Kabupaten Sukamara', 'S']
    ],
    DA: [
      ['Kota Banjarmasin', 'ACIJNOSTVWX'],
      ['Kabupaten Banjar', 'BQ'],
      ['Kabupaten Hulu Sungai Selatan', 'D'],
      ['Kabupaten Hulu Sungai Tengah', 'E'],
      ['Kabupaten Hulu Sungai Utara', 'F'],
      ['Kabupaten Kotabaru', 'G'],
      ['Kabupaten Tabalong', 'HU'],
      ['Kabupaten Tapin', 'K'],
      ['Kabupaten Tanah Laut', 'L'],
      ['Kabupaten Barito Kuala', 'M'],
      ['Kota Banjarbaru', 'PR'],
      ['Kabupaten Balangan', 'Y'],
      ['Kabupaten Tanah Bumbu', 'Z']
    ],
    KT: [
      ['Kota Balikpapan', 'AKLYZ'],
      ['Kota Samarinda', 'BIMNWX'],
      ['Kabupaten Kutai Kartanegara', 'COU'],
      ['Kota Bontang', 'DQ'],
      ['Kabupaten Paser', 'E'],
      ['Kabupaten Berau', 'G'],
      ['Kabupaten Kutai Barat', 'P'],
      ['Kabupaten Kutai Timur', 'R'],
      ['Kabupaten Penajam Paser Utara', 'V']
    ],
    KU: [
      ['Kabupaten Bulungan', 'AB'],
      ['Kota Tarakan', 'G'],
      ['Kabupaten Tana Tidung', 'H'],
      ['Kabupaten Nunukan', 'N'],
      ['Kabupaten Malinau', 'S']
    ],

    /* ----------------------------------------------------------------------------- Sulawesi */
    DB: [
      ['Kota Manado', 'ALMR'],
      ['Kabupaten Minahasa', 'B'],
      ['Kota Bitung', 'C'],
      ['Kabupaten Bolaang Mongondow', 'D'],
      ['Kabupaten Minahasa Selatan', 'E'],
      ['Kabupaten Minahasa Utara', 'F'],
      ['Kota Tomohon', 'G'],
      ['Kabupaten Bolaang Mongondow Utara', 'H'],
      ['Kabupaten Minahasa Tenggara', 'J'],
      ['Kota Kotamobagu', 'K'],
      ['Kabupaten Bolaang Mongondow Timur', 'N'],
      ['Kabupaten Bolaang Mongondow Selatan', 'P']
    ],
    DL: [
      ['Kabupaten Kepulauan Sangihe', 'A'],
      ['Kabupaten Kepulauan Talaud', 'B'],
      ['Kabupaten Kepulauan Sitaro', 'C']
    ],
    DM: [
      ['Kota Gorontalo', 'A'],
      ['Kabupaten Gorontalo', 'B'],
      ['Kabupaten Boalemo', 'C'],
      ['Kabupaten Pohuwato', 'D'],
      ['Kabupaten Bone Bolango', 'E'],
      ['Kabupaten Gorontalo Utara', 'F']
    ],
    DN: [
      ['Kota Palu', 'AVY'],
      ['Kabupaten Donggala', 'B'],
      ['Kabupaten Banggai', 'CR'],
      ['Kabupaten Tolitoli', 'D'],
      ['Kabupaten Poso', 'E'],
      ['Kabupaten Buol', 'F'],
      ['Kabupaten Morowali', 'G'],
      ['Kabupaten Banggai Kepulauan', 'H'],
      ['Kabupaten Parigi Moutong', 'JK'],
      ['Kabupaten Tojo Una-Una', 'L'],
      ['Kabupaten Sigi', 'M'],
      ['Kabupaten Banggai Laut', 'Q'],
      ['Kabupaten Morowali Utara', 'U']
    ],
    DT: [
      ['Kabupaten Konawe', 'A'],
      ['Kabupaten Kolaka Utara', 'B'],
      ['Kabupaten Wakatobi', 'C'],
      ['Kota Kendari', 'E'],
      ['Kabupaten Buton Utara', 'F'],
      ['Kabupaten Buton', 'G'],
      ['Kabupaten Konawe Selatan', 'H'],
      ['Kabupaten Kolaka', 'J'],
      ['Kabupaten Bombana', 'K'],
      ['Kabupaten Konawe Utara', 'M']
    ],
    DD: [
      ['Kota Makassar', 'AKQ'],
      ['Kabupaten Gowa', 'BL'],
      ['Kabupaten Takalar', 'C'],
      ['Kabupaten Maros', 'D'],
      ['Kabupaten Pangkajene Kepulauan', 'E'],
      ['Kabupaten Bantaeng', 'F'],
      ['Kabupaten Jeneponto', 'G'],
      ['Kabupaten Bulukumba', 'H'],
      ['Kabupaten Selayar', 'J']
    ],
    DP: [
      ['Kota Parepare', 'A'],
      ['Kabupaten Barru', 'B'],
      ['Kabupaten Sidenreng Rappang', 'CM'],
      ['Kabupaten Pinrang', 'DR'],
      ['Kota Palopo', 'E'],
      ['Kabupaten Luwu', 'F'],
      ['Kabupaten Luwu Timur', 'G'],
      ['Kabupaten Luwu Utara', 'H'],
      ['Kabupaten Enrekang', 'I'],
      ['Kabupaten Tana Toraja', 'J'],
      ['Kabupaten Toraja Utara', 'K']
    ],
    DW: [
      ['Kabupaten Bone', 'A'],
      ['Kabupaten Wajo', 'B'],
      ['Kabupaten Soppeng', 'CY'],
      ['Kabupaten Sinjai', 'DZ']
    ],
    DC: [
      ['Kabupaten Mamuju', 'A'],
      ['Kabupaten Majene', 'B'],
      ['Kabupaten Polewali Mandar', 'C'],
      ['Kabupaten Mamasa', 'D'],
      ['Kabupaten Mamuju Utara (Pasangkayu)', 'E']
    ],

    /* ------------------------------------------------------------------- Maluku & Papua */
    DE: [
      ['Kota Ambon', 'A'],
      ['Kabupaten Maluku Tengah', 'B'],
      ['Kabupaten Buru', 'D'],
      ['Kabupaten Maluku Tenggara', 'E'],
      ['Kabupaten Buru Selatan', 'F'],
      ['Kabupaten Maluku Barat Daya', 'JK'],
      ['Kabupaten Seram Bagian Timur', 'L'],
      ['Kabupaten Kepulauan Aru', 'N'],
      ['Kabupaten Seram Bagian Barat', 'O'],
      ['Kota Tual', 'T']
    ],
    DG: [
      ['Kota Ternate', 'A'],
      ['Kota Tidore Kepulauan', 'B'],
      ['Kabupaten Halmahera Timur', 'D'],
      ['Kabupaten Kepulauan Sula', 'E'],
      ['Kabupaten Halmahera Selatan', 'K'],
      ['Kabupaten Halmahera Tengah', 'L'],
      ['Kabupaten Halmahera Barat', 'M'],
      ['Kabupaten Halmahera Utara', 'N'],
      ['Kabupaten Pulau Morotai', 'U']
    ],
    PA: [
      ['Kota Jayapura', 'A'],
      ['Kabupaten Jayawijaya', 'B'],
      ['Kabupaten Paniai', 'C'],
      ['Kabupaten Mimika', 'D'],
      ['Kabupaten Nabire', 'E'],
      ['Kabupaten Merauke', 'G'],
      ['Kabupaten Jayapura', 'J'],
      ['Kabupaten Biak Numfor', 'K'],
      ['Kabupaten Kepulauan Yapen', 'L'],
      ['Kabupaten Puncak Jaya', 'P']
    ],
    PB: [
      ['Kabupaten Teluk Bintuni', 'B'],
      ['Kabupaten Fakfak', 'F'],
      ['Kabupaten Kaimana', 'K'],
      ['Kabupaten Manokwari', 'M'],
      ['Kota Sorong', 'S'],
      ['Kabupaten Sorong Selatan', 'T'],
      ['Kabupaten Maybrat', 'V'],
      ['Kabupaten Teluk Wondama', 'W']
    ],

    /* ----------------------------------------------------------------------------- Sumatera */
    BL: [
      ['Kota Banda Aceh', 'AJL'],
      ['Kabupaten Aceh Besar', 'B'],
      ['Kabupaten Aceh Barat Daya', 'C'],
      ['Kabupaten Aceh Timur', 'D'],
      ['Kabupaten Aceh Barat', 'E'],
      ['Kota Langsa', 'F'],
      ['Kabupaten Aceh Tengah', 'G'],
      ['Kabupaten Gayo Lues', 'H'],
      ['Kota Subulussalam', 'I'],
      ['Kabupaten Aceh Utara', 'KQ'],
      ['Kota Sabang', 'M'],
      ['Kota Lhokseumawe', 'N'],
      ['Kabupaten Pidie Jaya', 'O'],
      ['Kabupaten Pidie', 'P'],
      ['Kabupaten Aceh Singkil', 'R'],
      ['Kabupaten Simeulue', 'S'],
      ['Kabupaten Aceh Selatan', 'T'],
      ['Kabupaten Aceh Tamiang', 'U'],
      ['Kabupaten Nagan Raya', 'V'],
      ['Kabupaten Aceh Jaya', 'W'],
      ['Kabupaten Aceh Tenggara', 'X'],
      ['Kabupaten Bener Meriah', 'Y'],
      ['Kabupaten Bireuen', 'Z']
    ],
    BB: [
      ['Kota Sibolga', 'ALM'],
      ['Kabupaten Tapanuli Utara', 'B'],
      ['Kabupaten Samosir', 'C'],
      ['Kabupaten Humbang Hasundutan', 'D'],
      ['Kabupaten Toba Samosir', 'E'],
      ['Kota Padang Sidempuan', 'FH'],
      ['Kabupaten Tapanuli Selatan', 'G'],
      ['Kabupaten Padang Lawas', 'J'],
      ['Kabupaten Padang Lawas Utara', 'K'],
      ['Kabupaten Tapanuli Tengah', 'N'],
      ['Kabupaten Nias Utara', 'Q'],
      ['Kabupaten Mandailing Natal', 'R'],
      ['Kota Gunungsitoli', 'T'],
      ['Kabupaten Nias Barat', 'U'],
      ['Kabupaten Nias', 'V'],
      ['Kabupaten Nias Selatan', 'W'],
      ['Kabupaten Dairi', 'Y'],
      ['Kabupaten Pakpak Bharat', 'Z']
    ],
    BK: [
      ['Kota Medan', 'ABCDEFGHIKL'],
      ['Kabupaten Labuhanbatu Utara', 'J'],
      ['Kabupaten Deli Serdang', 'M'],
      ['Kota Tebing Tinggi', 'N'],
      ['Kabupaten Batubara', 'O'],
      ['Kabupaten Langkat', 'P'],
      ['Kota Tanjung Balai', 'Q'],
      ['Kota Binjai', 'R'],
      ['Kabupaten Karo', 'S'],
      ['Kabupaten Simalungun', 'TU'],
      ['Kabupaten Asahan', 'V'],
      ['Kota Pematang Siantar', 'W'],
      ['Kabupaten Serdang Bedagai', 'X'],
      ['Kabupaten Labuhanbatu', 'Y'],
      ['Kabupaten Labuhanbatu Selatan', 'Z']
    ],
    BA: [
      ['Kota Padang', 'ABOQR'],
      ['Kabupaten Lima Puluh Kota', 'CX'],
      ['Kabupaten Pasaman', 'D'],
      ['Kabupaten Tanah Datar', 'E'],
      ['Kabupaten Padang Pariaman', 'F'],
      ['Kabupaten Pesisir Selatan', 'GI'],
      ['Kabupaten Solok', 'H'],
      ['Kota Sawahlunto', 'J'],
      ['Kabupaten Sijunjung', 'K'],
      ['Kota Bukittinggi', 'L'],
      ['Kota Payakumbuh', 'M'],
      ['Kota Padang Panjang', 'N'],
      ['Kota Solok', 'P'],
      ['Kabupaten Pasaman Barat', 'S'],
      ['Kabupaten Agam', 'TZ'],
      ['Kabupaten Kepulauan Mentawai', 'U'],
      ['Kabupaten Dharmasraya', 'V'],
      ['Kota Pariaman', 'W'],
      ['Kabupaten Solok Selatan', 'Y']
    ],
    BM: [
      ['Kota Pekanbaru', 'AJLNQT'],
      ['Kabupaten Indragiri Hulu', 'BV'],
      ['Kabupaten Pelalawan', 'CI'],
      ['Kabupaten Bengkalis', 'DE'],
      ['Kabupaten Kampar', 'FOZ'],
      ['Kabupaten Indragiri Hilir', 'G'],
      ['Kota Dumai', 'HR'],
      ['Kabupaten Kuantan Singingi', 'KX'],
      ['Kabupaten Rokan Hulu', 'MU'],
      ['Kabupaten Rokan Hilir', 'PW'],
      ['Kabupaten Siak', 'SY'],
      ['Kabupaten Kepulauan Meranti', 'X']
    ],
    BP: [
      ['Kota Tanjung Pinang', 'AT'],
      ['Kabupaten Bintan', 'B'],
      ['Kota Batam', 'CDEFGHIJMPQRZ'],
      ['Kabupaten Karimun', 'K'],
      ['Kabupaten Natuna', 'N'],
      ['Kabupaten Lingga', 'O'],
      ['Kabupaten Kepulauan Anambas', 'S']
    ],
    BH: [
      ['Kota Jambi', 'ALMNYZ'],
      ['Kabupaten Batanghari', 'BV'],
      ['Kabupaten Tebo', 'CW'],
      ['Kabupaten Kerinci', 'D'],
      ['Kabupaten Tanjung Jabung Barat', 'E'],
      ['Kabupaten Merangin', 'FP'],
      ['Kabupaten Muaro Jambi', 'GH'],
      ['Kabupaten Bungo', 'KU'],
      ['Kota Sungai Penuh', 'R'],
      ['Kabupaten Sarolangun', 'QS'],
      ['Kabupaten Tanjung Jabung Timur', 'T']
    ],
    BG: [
      ['Kota Palembang', 'AILMNPQRUXZ'],
      ['Kabupaten Musi Banyuasin', 'B'],
      ['Kota Prabumulih', 'C'],
      ['Kabupaten Muara Enim', 'D'],
      ['Kabupaten Lahat', 'E'],
      ['Kabupaten Ogan Komering Ulu', 'F'],
      ['Kabupaten Musi Rawas', 'G'],
      ['Kota Lubuk Linggau', 'H'],
      ['Kabupaten Banyuasin', 'J'],
      ['Kabupaten Ogan Komering Ilir', 'K'],
      ['Kabupaten Penukal Abab Lematang Ilir', 'O'],
      ['Kabupaten Empat Lawang', 'S'],
      ['Kabupaten Ogan Ilir', 'T'],
      ['Kabupaten Ogan Komering Ulu Selatan', 'V'],
      ['Kota Pagaralam', 'W'],
      ['Kabupaten Ogan Komering Ulu Timur', 'Y']
    ],
    BN: [
      ['Kota Pangkal Pinang', 'A'],
      ['Kabupaten Bangka', 'B'],
      ['Kabupaten Bangka Tengah', 'C'],
      ['Kabupaten Bangka Barat', 'D'],
      ['Kabupaten Bangka Selatan', 'E'],
      ['Kabupaten Belitung', 'F'],
      ['Kabupaten Belitung Timur', 'G']
    ],
    BD: [
      ['Kota Bengkulu', 'ACEL'],
      ['Kabupaten Bengkulu Selatan', 'BM'],
      ['Kabupaten Bengkulu Utara', 'DS'],
      ['Kabupaten Kepahiang', 'G'],
      ['Kabupaten Lebong', 'H'],
      ['Kabupaten Rejang Lebong', 'K'],
      ['Kabupaten Muko Muko', 'N'],
      ['Kabupaten Seluma', 'P'],
      ['Kabupaten Kaur', 'W'],
      ['Kabupaten Bengkulu Tengah', 'Y']
    ],
    BE: [
      ['Kota Bandar Lampung', 'ABCY'],
      ['Kabupaten Lampung Selatan', 'DEO'],
      ['Kota Metro', 'F'],
      ['Kabupaten Lampung Tengah', 'GHI'],
      ['Kabupaten Lampung Utara', 'JK'],
      ['Kabupaten Mesuji', 'L'],
      ['Kabupaten Lampung Barat', 'M'],
      ['Kabupaten Lampung Timur', 'NP'],
      ['Kabupaten Tulang Bawang Barat', 'Q'],
      ['Kabupaten Pesawaran', 'R'],
      ['Kabupaten Tulang Bawang', 'ST'],
      ['Kabupaten Tanggamus', 'VZ'],
      ['Kabupaten Pringsewu', 'U'],
      ['Kabupaten Way Kanan', 'W'],
      ['Kabupaten Pesisir Barat', 'X']
    ]
  };

  /* Kode yang seluruh hurufnya milik satu daerah. */
  var WHOLE = {
    L: { name: 'Kota Surabaya', note: 'Kode L hanya dipakai Kota Surabaya, jadi huruf seri tidak membedakan daerah.', conf: 'tinggi' }
  };

  return { RAW: RAW, WHOLE: WHOLE, ALL: ALL };
});
