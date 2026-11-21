/*
 * Hasil verifikasi silang tabel huruf seri, per kode wilayah dan per huruf.
 *
 * Tabel utama di series.js bersumber dari satu garis sumber (Moladin; detikOto dan
 * Daihatsu/Auto2000 memuat tabel yang sama persis). Berkas ini mencatat apa yang
 * ditemukan ketika tiap kode dibandingkan dengan artikel per-plat dari penerbit lain.
 *
 * Penting soal arti "cocok": penerbit-penerbit ini saling mengutip, jadi cocok BUKAN
 * bukti independen dan BUKAN data resmi. Ia hanya berarti tidak ada tabel lain yang
 * bertentangan. Tidak ada sumber resmi (Polri/Samsat/Bapenda) yang menerbitkan pembagian
 * huruf seri per daerah.
 *
 * CODES[kode] = {
 *   conf    : 'tinggi' | 'sedang'  (tingkat keyakinan dasar kode ini)
 *   status  : 'cocok' | 'sebagian' | 'konflik' | 'tanpa-pembanding'
 *   checked : tanggal pemeriksaan terakhir (YYYY-MM-DD)
 *   refs    : kunci ke REFS (pembanding yang benar-benar dibaca)
 *   note    : catatan hasil perbandingan
 * }
 * LETTERS[kode][huruf] = { names?, conf, note }  menimpa hasil untuk satu huruf
 *   names : daftar nama daerah kandidat (harus ada di RAW kode itu); bila kosong
 *           dipakai daerah dari tabel utama.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PlatVerify = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ASOF = '2026-11-21';
  var EARLIER = '2026-11-19';

  /* kunci -> [label tampil, url] */
  var REFS = {
    auto2000Jkt: ['Auto2000: Kode plat belakang Jakarta', 'https://auto2000.co.id/berita-dan-tips/kode-plat-nomor-belakang-jakarta'],
    auto2000H: ['Auto2000: Plat H', 'https://auto2000.co.id/berita-dan-tips/plat-nomor-h-tips'],
    popA: ['Popmama: Plat A', 'https://www.popmama.com/life/health/plat-a-daerah-mana-00-sm58d-5rds0n'],
    detikE: ['detikOto: Plat E', 'https://oto.detik.com/mobil/d-7022909/plat-e-daerah-mana-cek-kode-plat-nomor-di-indonesia'],
    popF: ['Popmama: Plat F', 'https://www.popmama.com/life/health/plat-f-daerah-mana-00-wjk9l-974yby'],
    detikF: ['detikOto: Plat F', 'https://oto.detik.com/berita/d-7043378/pelat-f-daerah-mana-cek-kode-pelat-nomor-di-indonesia'],
    idnT: ['IDN Times: Plat T', 'https://www.idntimes.com/automotive/car/uswatun-khasanah-52/plat-t-daerah-mana'],
    kumparanT: ['Kumparan: Plat T', 'https://kumparan.com/info-otomotif/plat-t-daerah-mana-ini-daftar-wilayahnya-1wwV5zLurV3'],
    idnZ: ['IDN Times: Pelat Z', 'https://www.idntimes.com/automotive/car/pelat-z-daerah-mana-ini-wilayahnya-00-vs37w-tkfmh9'],
    idnG: ['IDN Times: Pelat G', 'https://www.idntimes.com/automotive/car/pelat-g-daerah-mana-00-vs37w-ttc354'],
    idnK: ['IDN Times: Pelat K', 'https://www.idntimes.com/automotive/car/pelat-k-daerah-mana-00-vs37w-fg45lf'],
    detikK: ['detikOto: Plat K', 'https://oto.detik.com/mobil/d-7026754/daerah-yang-menggunakan-plat-k-ini-penjelasannya'],
    idnR: ['IDN Times: Pelat R', 'https://www.idntimes.com/automotive/car/pelat-r-daerah-mana-wilayah-cangkupan-00-kkx41-0vc358'],
    idnAA: ['IDN Times: Pelat AA', 'https://www.idntimes.com/automotive/car/uswatun-khasanah-52/pelat-aa-daerah-mana'],
    gridoAD: ['Gridoto: Kode plat daerah Solo', 'https://www.gridoto.com/read/221010197/kode-lokasi-plat-nomor-daerah-solo-bisa-kepoin-rumah-gebetan-nih?page=all'],
    idnAB: ['IDN Times: Pelat AB', 'https://www.idntimes.com/automotive/car/pelat-ab-daerah-mana-00-kkx41-bkvqws'],
    detikAB: ['detikOto: Area pelat nomor seluruh Indonesia', 'https://oto.detik.com/berita/d-5889177/ini-daftar-area-pelat-nomor-kendaraan-di-seluruh-wilayah-indonesia'],
    detikN: ['detikOto: Plat N (2023)', 'https://oto.detik.com/mobil/d-7059640/daerah-yang-menggunakan-plat-n-cek-daftarnya'],
    popN: ['Popmama: Plat N', 'https://www.popmama.com/life/health/plat-n-daerah-mana-00-sm58d-fr4f14'],
    auto2000N: ['Auto2000: Plat N', 'https://auto2000.co.id/berita-dan-tips/plat-n-daerah-mana-tips'],
    popM: ['Popmama: Plat M', 'https://www.popmama.com/life/health/plat-m-daerah-mana-00-sm58d-wjmxhz'],
    idnS: ['IDN Times: Pelat S', 'https://www.idntimes.com/automotive/car/penjelasan-pelat-s-daerah-mana-00-kkx41-nwwbwl'],
    detikW: ['detikOto: Pelat W', 'https://oto.detik.com/mobil/d-7022473/pelat-w-daerah-mana-cek-kode-plat-nomor-di-indonesia'],
    popAE: ['Popmama: Plat AE', 'https://www.popmama.com/life/health/plat-ae-daerah-mana-00-kd2wt-z09stf'],
    popAG: ['Popmama: Plat AG', 'https://www.popmama.com/life/health/plat-ag-daerah-mana-00-nzqrb-v69mkq'],
    popDK: ['Popmama: Plat DK', 'https://www.popmama.com/life/health/plat-dk-daerah-mana-00-nzqrb-gn742l'],
    auto2000DR: ['Auto2000: Plat DR', 'https://auto2000.co.id/berita-dan-tips/plat-nomor-dr-daerah-mana'],
    astraDR: ['Astra Otoshop: Plat DR', 'https://astraotoshop.com/article/plat-dr'],
    moladinEA: ['Moladin: Plat EA', 'https://moladin.com/news/plat-ea/'],
    popBK: ['Popmama: Plat BK', 'https://www.popmama.com/life/health/plat-bk-daerah-mana-00-kd2wt-pmlf5w'],
    popBA: ['Popmama: Plat BA', 'https://www.popmama.com/life/health/plat-ba-daerah-mana-00-kd2wt-1k5kz1'],
    popBM: ['Popmama: Plat BM', 'https://www.popmama.com/life/health/plat-bm-daerah-mana-00-sm58d-gzwkmf'],
    daihatsuBM: ['Daihatsu: Plat BM', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-bm-kota-apa-simak-di-sini-dan-cara-cek-pajaknya/'],
    idnBE: ['IDN Times: Pelat BE', 'https://www.idntimes.com/automotive/car/pelat-be-daerah-mana-00-vs37w-0mtr9q'],
    popBL: ['Popmama: Plat BL', 'https://www.popmama.com/life/health/plat-bl-daerah-mana-00-kd2wt-fhpvmc'],
    popBB: ['Popmama: Plat BB', 'https://www.popmama.com/life/health/plat-bb-daerah-mana-00-kd2wt-gphpsk'],
    popBD: ['Popmama: Plat BD', 'https://www.popmama.com/life/health/plat-bd-daerah-mana-00-nzqrb-5n2qqd'],
    popBH: ['Popmama: Plat BH', 'https://www.popmama.com/life/health/plat-bh-daerah-mana-00-kd2wt-2jwss4'],
    daihatsuBH: ['Daihatsu: Plat BH', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-bh-daerah-mana-yuk-simak-informasinya-di-sini'],
    popBN: ['Popmama: Plat BN', 'https://www.popmama.com/life/health/plat-bn-daerah-mana-00-nzqrb-53sglg'],
    popBP: ['Popmama: Plat BP', 'https://www.popmama.com/life/health/plat-bp-daerah-mana-00-kd2wt-gnjcv7'],
    daihatsuBP: ['Daihatsu: Plat BP', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-bp-daerah-mana-cek-info-lengkapnya-di-sini/'],
    auto2000BP: ['Auto2000: Plat BP', 'https://auto2000.co.id/berita-dan-tips/plat-bp-daerah-mana-tips'],
    daihatsuKU: ['Daihatsu: Plat KU', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-ku-daerah-mana-simak-jawabannya-di-sini/'],
    popKT: ['Popmama: Plat KT', 'https://www.popmama.com/life/health/plat-kt-daerah-mana-00-nzqrb-qvrt1f/amp'],
    daihatsuKB: ['Daihatsu: Plat KB', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-kb-daerah-mana-saja-ini-cakupan-wilayahnya'],
    popDA: ['Popmama: Plat DA', 'https://www.popmama.com/life/health/plat-da-daerah-mana-00-nzqrb-24csk5'],
    popKH: ['Popmama: Plat KH', 'https://www.popmama.com/life/health/plat-kh-dari-mana-00-kd2wt-37f8t7'],
    daihatsuPA: ['Daihatsu: Plat PA', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-pa-daerah-mana-simak-jawabannya-di-sini/'],
    detikPapua: ['detikOto: Kode pelat 3 provinsi Papua diubah (2024)', 'https://oto.detik.com/berita/d-7501604/kode-pelat-nomor-di-3-provinsi-papua-diubah'],
    daihatsuDB: ['Daihatsu: Plat DB', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-db-daerah-mana-simak-jawabannya-di-sini/'],
    detikDD: ['detikOto: Pelat DD', 'https://oto.detik.com/berita/d-7141068/pelat-dd-daerah-mana-ini-detail-wilayah-dan-kode-belakangnya'],
    astraDD: ['Astra Otoshop: Plat DD', 'https://astraotoshop.com/article/daerah-nomor-plat-dd'],
    daihatsuDP: ['Daihatsu: Plat DP', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-dp-daerah-mana-simak-jawabannya-di-sini'],
    daihatsuDW: ['Daihatsu: Plat DW', 'https://daihatsu.co.id/en/tips-and-event/tips-sahabat/detail-content/plat-dw-daerah-mana-cek-info-lengkapnya-di-sini'],
    popDW: ['Popmama: Plat DW', 'https://www.popmama.com/life/health/plat-dw-daerah-mana-00-kd2wt-zhcwgs']
  };

  var NONE = 'Pembanding yang ditemukan hanya menyebut daerah tanpa huruf seri, jadi tabel ini belum punya verifikasi silang.';

  var CODES = {
    D: { conf: 'sedang', status: 'konflik', checked: EARLIER, refs: [], note: 'Empat sumber dibandingkan (Popmama, dua tabel Moladin, detikOto). Huruf A sampai R dan U, X sepakat; S, T, V, W, Y, Z bertentangan.' },
    /* ------------------------------ Banten, Jakarta, Jawa Barat */
    A: { conf: 'tinggi', status: 'cocok', refs: ['popA'], note: 'Cocok dengan Popmama (satu pembanding).' },
    B: { conf: 'tinggi', status: 'cocok', checked: EARLIER, refs: ['auto2000Jkt'],
         note: 'Cocok dengan Auto2000. Kepulauan Seribu tidak tercantum di sumber mana pun yang diperiksa (Moladin, Auto2000, detikOto), jadi tidak ada huruf yang bisa dipastikan untuknya.' },
    E: { conf: 'tinggi', status: 'cocok', refs: ['detikE'],
         note: 'detikOto cocok persis. Satu artikel Popmama berbeda di huruf F, O, dan R, tetapi tidak konsisten dengan dirinya sendiri sehingga tidak dipakai.' },
    F: { conf: 'tinggi', status: 'cocok', refs: ['popF', 'detikF'], note: 'Popmama dan detikOto cocok (detikOto menulis Cianjur "WXYX", diduga salah ketik).' },
    T: { conf: 'tinggi', status: 'sebagian', refs: ['idnT', 'kumparanT'],
         note: 'Purwakarta, Karawang, dan Subang cocok. Sumber hanya menulis "sebagian Kabupaten Bekasi dan Subang" untuk T sampai Z tanpa tabel huruf, jadi huruf itu sengaja dibiarkan ambigu.' },
    Z: { conf: 'tinggi', status: 'cocok', refs: ['idnZ'], note: 'IDN Times cocok. Ia menulis "Kabupaten Banjar" untuk X-Z; itu dibaca sebagai Kota Banjar (Jawa Barat) seperti sumber lain.' },

    /* ------------------------------ Jawa Tengah dan DIY */
    G: { conf: 'tinggi', status: 'cocok', refs: ['idnG'], note: 'IDN Times cocok huruf demi huruf (label "Kota" untuk Batang dan Brebes di artikel itu keliru, hurufnya sama).' },
    H: { conf: 'tinggi', status: 'cocok', checked: EARLIER, refs: ['auto2000H'], note: 'Cocok dengan Auto2000.' },
    K: { conf: 'tinggi', status: 'cocok', refs: ['idnK', 'detikK'], note: 'IDN Times cocok penuh; detikOto cocok untuk huruf yang disebutnya.' },
    R: { conf: 'tinggi', status: 'sebagian', refs: ['idnR'],
         note: 'Banyumas, Purbalingga, dan Banjarnegara cocok. Untuk Cilacap IDN Times menulis huruf yang tumpang tindih dengan Banyumas (dianggap salah ketik), jadi huruf Cilacap belum terverifikasi.' },
    AA: { conf: 'tinggi', status: 'cocok', refs: ['idnAA'], note: 'IDN Times cocok persis.' },
    AD: { conf: 'tinggi', status: 'cocok', refs: ['gridoAD'], note: 'Gridoto cocok persis.' },
    AB: { conf: 'tinggi', status: 'cocok', refs: ['idnAB', 'detikAB'], note: 'IDN Times cocok persis; detikOto (2022) cocok untuk huruf yang disebutnya.' },

    /* ------------------------------ Jawa Timur */
    L: { conf: 'tinggi', status: 'cocok', checked: EARLIER, refs: [], note: 'Kode L hanya dipakai Kota Surabaya.' },
    M: { conf: 'sedang', status: 'sebagian', refs: ['popM'], note: 'Pembanding hanya memberi contoh plat. B, P, dan U cocok; untuk A ia menyebut Bangkalan sedangkan tabel utama Pamekasan.' },
    N: { conf: 'sedang', status: 'konflik', refs: ['detikN', 'popN', 'auto2000N'],
         note: 'Dua versi tabel beredar. Moladin, Popmama, dan Auto2000 sepakat dengan tabel di sini; detikOto (2023) berbeda di huruf L, O, P, S, T, U, W, dan X. Belum ada sumber ketiga yang independen.' },
    P: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    S: { conf: 'tinggi', status: 'sebagian', refs: ['idnS'], note: 'IDN Times cocok untuk huruf yang disebutnya. Huruf M sampai V (Kab./Kota Mojokerto) tidak dibedakan di sana, jadi belum terverifikasi.' },
    W: { conf: 'sedang', status: 'konflik', refs: ['detikW'],
         note: 'Satu artikel detikOto menulis kebalikannya (Gresik N-Z, Sidoarjo A-M). Tabel di sini mengikuti Moladin dan detikOto tabel besar (Gresik A-M, Sidoarjo N-Z). Belum ada pembanding ketiga.' },
    AE: { conf: 'sedang', status: 'konflik', refs: ['popAE'], note: 'Satu artikel Popmama menulis pola berurutan yang berbeda hampir di setiap huruf dan tidak konsisten secara internal; tidak dipakai.' },
    AG: { conf: 'sedang', status: 'konflik', refs: ['popAG'], note: 'Satu artikel Popmama menulis pola berurutan yang berbeda hampir di setiap huruf dan tidak konsisten secara internal; tidak dipakai.' },

    /* ------------------------------ Bali dan Nusa Tenggara */
    DK: { conf: 'tinggi', status: 'cocok', refs: ['popDK'], note: 'Popmama cocok huruf demi huruf (ia mengutip IDN Times).' },
    DR: { conf: 'tinggi', status: 'cocok', refs: ['auto2000DR', 'astraDR'], note: 'Auto2000 dan Astra Otoshop cocok. Astra menambah Kabupaten Lombok Utara (R, T) yang belum ada pembandingnya.' },
    EA: { conf: 'sedang', status: 'konflik', refs: ['moladinEA'],
          note: 'Halaman Moladin khusus EA (Sumbawa A-E, Dompu F-H, Bima J-N, Kota Bima P-R) bertentangan dengan tabel daftar Moladin yang dipakai di sini. Huruf yang diperdebatkan ditandai ambigu.' },
    DH: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    EB: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    ED: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },

    /* ------------------------------ Kalimantan */
    KB: { conf: 'tinggi', status: 'sebagian', refs: ['daihatsuKB'], note: 'Daihatsu cocok untuk 13 daerah. Kota Pontianak (A, Q, S, W) tidak ada di sana, jadi belum terverifikasi.' },
    KH: { conf: 'tinggi', status: 'sebagian', refs: ['popKH'], note: 'Huruf yang dimuat Popmama semuanya cocok. Huruf C, L, U, V, W, dan Y tidak dimuat di sana.' },
    DA: { conf: 'tinggi', status: 'cocok', refs: ['popDA'], note: 'Popmama cocok huruf demi huruf.' },
    KT: { conf: 'tinggi', status: 'cocok', refs: ['popKT'], note: 'Popmama cocok huruf demi huruf untuk 9 daerah.' },
    KU: { conf: 'sedang', status: 'tanpa-pembanding', refs: ['daihatsuKU'],
          note: 'Data hanya dari satu artikel (Daihatsu); artikel itu menulis "Balungan", dibaca sebagai Bulungan. Sumber lain hanya menyebut KU sebagai kode provinsi, tanpa huruf.' },

    /* ------------------------------ Sulawesi */
    DB: { conf: 'tinggi', status: 'cocok', refs: ['daihatsuDB'], note: 'Daihatsu cocok huruf demi huruf, tetapi diduga satu garis sumber dengan tabel utama.' },
    DC: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE + ' Pemekaran Mamuju Tengah belum tercermin.' },
    DD: { conf: 'tinggi', status: 'cocok', refs: ['detikDD', 'astraDD'], note: 'detikOto dan Astra Otoshop cocok. Huruf Q (Makassar) tidak muncul di keduanya. Satu artikel Popmama berpola berbeda dan tidak konsisten, tidak dipakai.' },
    DL: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    DM: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    DN: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: 'Pembanding tidak ditemukan.' },
    DP: { conf: 'sedang', status: 'sebagian', refs: ['daihatsuDP'], note: 'Tabel dari Daihatsu dan detikOto (tabel besar). Pembanding lain hanya menyebut daerah tanpa huruf.' },
    DT: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: 'Pembanding tidak ditemukan.' },
    DW: { conf: 'tinggi', status: 'sebagian', refs: ['daihatsuDW', 'popDW'], note: 'A, B, C, D, Y, dan Z cocok di Daihatsu dan Popmama. Popmama menambah huruf lain (Bone E-H, Wajo L-P, Soppeng Q, Sinjai V) yang belum dimasukkan karena belum ada pembandingnya.' },

    /* ------------------------------ Maluku dan Papua */
    DE: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: 'Satu-satunya pembanding yang ditemukan identik dan tampak salinan sumber yang sama.' },
    DG: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: 'Satu-satunya pembanding yang ditemukan berasal dari penerbit yang sama dengan tabel utama.' },
    PA: { conf: 'tinggi', status: 'cocok', refs: ['daihatsuPA', 'detikPapua'],
          note: 'Tabel lama cocok, tetapi sejak 2024 beberapa daerah berganti kode (Papua Selatan PS, Papua Tengah PT). Plat lama tetap berlaku.' },
    PB: { conf: 'sedang', status: 'tanpa-pembanding', refs: ['detikPapua'],
          note: 'Tidak ada pembanding untuk huruf. Sejak 2024 Papua Barat Daya memakai kode PY. Plat lama tetap berlaku.' },

    /* ------------------------------ Sumatra */
    BK: { conf: 'tinggi', status: 'cocok', refs: ['popBK'], note: 'Popmama cocok (Kota Tebing Tinggi, N, tidak dimuat di sana).' },
    BA: { conf: 'tinggi', status: 'sebagian', refs: ['popBA'], note: 'Cocok kecuali Kota Padang: Popmama menulis "A-D" yang bertabrakan dengan C dan D di tabelnya sendiri, dan tidak memuat O, Q, R.' },
    BB: { conf: 'sedang', status: 'konflik', refs: ['popBB'],
          note: 'Popmama (mengaku mengutip Perpol 7/2021) menukar huruf J dengan K dan M dengan N. Artikelnya sendiri ganjil, sehingga huruf itu ditandai ambigu sampai ada sumber ketiga.' },
    BD: { conf: 'tinggi', status: 'cocok', refs: ['popBD'], note: 'Popmama cocok untuk 10 daerah.' },
    BE: { conf: 'tinggi', status: 'cocok', refs: ['idnBE'], note: 'IDN Times cocok untuk 15 daerah.' },
    BG: { conf: 'sedang', status: 'tanpa-pembanding', refs: [], note: NONE },
    BH: { conf: 'sedang', status: 'konflik', refs: ['popBH', 'daihatsuBH'],
          note: 'Daihatsu identik dengan tabel di sini. Popmama (mengutip Perpol 7/2021) menulis huruf H untuk Kota Jambi dan menambah huruf I, J, O, X yang belum dimasukkan.' },
    BL: { conf: 'tinggi', status: 'sebagian', refs: ['popBL'], note: '17 daerah yang dimuat Popmama cocok. Aceh Besar, Tengah, Singkil, Tamiang, Jaya, dan Tenggara tidak dimuat.' },
    BM: { conf: 'tinggi', status: 'cocok', refs: ['popBM', 'daihatsuBM'], note: 'Cocok, tetapi huruf X tercatat untuk Kuantan Singingi dan Kepulauan Meranti di semua sumber; tidak ada yang menyatakan mana yang benar.' },
    BN: { conf: 'tinggi', status: 'cocok', refs: ['popBN'], note: 'Huruf A-G cocok. Popmama menambah huruf kedua (Pangkalpinang J, L, P; Bangka Tengah T; Bangka Barat R; Bangka Selatan V) tanpa konflik, belum dimasukkan.' },
    BP: { conf: 'sedang', status: 'konflik', refs: ['popBP', 'daihatsuBP', 'auto2000BP'],
          note: 'Daihatsu dan Auto2000 sama dengan tabel di sini. Popmama berbeda tetapi bentrok dengan dirinya sendiri (huruf T, G, H dipakai dua daerah), jadi tidak dipakai.' }
  };

  /* ------------------------------------------------ Penimpaan per huruf */
  var LETTERS = {};
  function put(prefix, letters, spec) {
    LETTERS[prefix] = LETTERS[prefix] || {};
    letters.split('').forEach(function (l) { LETTERS[prefix][l] = spec; });
  }
  function spec(conf, note, names) { return { conf: conf, note: note, names: names }; }

  // Plat N: dua versi tabel
  var N_NOTE = 'Sumber bertentangan untuk huruf ini: tabel utama (Moladin, Popmama, Auto2000) dan detikOto 2023 menempatkannya di daerah berbeda.';
  put('N', 'L', spec('rendah', N_NOTE, ['Kota Batu', 'Kabupaten Probolinggo']));
  put('N', 'OT', spec('rendah', N_NOTE + ' detikOto tidak menetapkan huruf ini.', ['Kabupaten Pasuruan']));
  put('N', 'P', spec('rendah', N_NOTE, ['Kabupaten Probolinggo', 'Kota Probolinggo']));
  put('N', 'S', spec('rendah', N_NOTE, ['Kota Probolinggo', 'Kabupaten Pasuruan']));
  put('N', 'U', spec('rendah', N_NOTE, ['Kabupaten Lumajang', 'Kabupaten Pasuruan']));
  put('N', 'W', spec('rendah', N_NOTE, ['Kabupaten Pasuruan', 'Kabupaten Lumajang']));
  put('N', 'X', spec('rendah', 'detikOto menulis huruf X untuk Kota Pasuruan sekaligus Kabupaten Lumajang; tabel utama hanya Kota Pasuruan.', ['Kota Pasuruan', 'Kabupaten Lumajang']));

  put('M', 'A', spec('rendah', 'Popmama (contoh plat) menyebut huruf A untuk Bangkalan, tabel utama untuk Pamekasan.', ['Kabupaten Pamekasan', 'Kabupaten Bangkalan']));

  put('R', 'BFKNPRT', spec('sedang', 'Huruf Kabupaten Cilacap belum punya pembanding yang bisa dipakai.'));
  put('S', 'MNOPQRSTUV', spec('sedang', 'Kabupaten dan Kota Mojokerto tidak dibedakan di pembanding.'));
  put('T', 'TUVWXYZ', spec('rendah', 'Sumber hanya menulis "sebagian Kabupaten Bekasi dan Subang" untuk huruf ini. IDN Times menyebut Bekasi tidak termasuk plat T.'));

  // Plat EA: halaman Moladin khusus EA berbeda dari tabel daftar
  var EA_NOTE = 'Halaman Moladin khusus EA menulis huruf ini untuk daerah lain daripada tabel daftar Moladin. Belum ada sumber ketiga.';
  put('EA', 'BCDE', spec('rendah', EA_NOTE, ['Kabupaten Sumbawa']));
  put('EA', 'FG', spec('rendah', EA_NOTE, ['Kabupaten Dompu']));
  put('EA', 'H', spec('rendah', EA_NOTE, ['Kabupaten Sumbawa Barat', 'Kabupaten Dompu']));
  put('EA', 'JKLMN', spec('rendah', EA_NOTE, ['Kabupaten Bima']));
  put('EA', 'PQ', spec('rendah', EA_NOTE, ['Kota Bima']));
  put('EA', 'R', spec('rendah', EA_NOTE, ['Kabupaten Dompu', 'Kota Bima']));

  put('DR', 'RT', spec('sedang', 'Hanya Astra Otoshop yang menyebut Lombok Utara untuk huruf ini.'));
  put('KB', 'AQSW', spec('sedang', 'Kota Pontianak tidak ada di pembanding.'));
  put('KH', 'CLUVWY', spec('sedang', 'Huruf ini tidak dimuat di pembanding.'));
  put('BA', 'ABOQR', spec('sedang', 'Pembanding menulis Kota Padang "A-D" yang bertabrakan dengan daerah lain, dan tidak memuat O, Q, R.'));
  put('BL', 'BGRUWX', spec('sedang', 'Daerah ini tidak dimuat di pembanding.'));
  put('DD', 'Q', spec('sedang', 'Huruf Q tidak muncul di pembanding.'));

  // Pemekaran Papua 2024: kode berganti, plat lama tetap berlaku
  put('PA', 'CDEGP', spec('sedang', 'Sejak 2024 kendaraan baru dari daerah ini memakai kode PT (Papua Tengah) atau PS (Papua Selatan). Plat PA lama tetap berlaku.'));
  put('PB', 'STV', spec('sedang', 'Sejak 2024 kendaraan baru dari daerah ini memakai kode PY (Papua Barat Daya). Plat PB lama tetap berlaku.'));

  // Plat BB dan BH: pembanding menukar huruf
  var BB_NOTE = 'Popmama menukar huruf ini dengan daerah di sebelahnya. Belum ada sumber ketiga.';
  put('BB', 'M', spec('rendah', BB_NOTE, ['Kota Sibolga', 'Kabupaten Tapanuli Tengah']));
  put('BB', 'N', spec('rendah', BB_NOTE, ['Kabupaten Tapanuli Tengah', 'Kota Sibolga']));
  put('BB', 'J', spec('rendah', BB_NOTE, ['Kabupaten Padang Lawas', 'Kabupaten Padang Lawas Utara']));
  put('BB', 'K', spec('rendah', BB_NOTE, ['Kabupaten Padang Lawas Utara', 'Kabupaten Padang Lawas']));
  put('BH', 'H', spec('rendah', 'Popmama (mengutip Perpol 7/2021) menulis huruf H untuk Kota Jambi; Daihatsu dan tabel utama untuk Muaro Jambi.', ['Kabupaten Muaro Jambi', 'Kota Jambi']));

  return { ASOF: ASOF, REFS: REFS, CODES: CODES, LETTERS: LETTERS };
});
