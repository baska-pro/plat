# Soal akurasi

Catatan lengkap tentang dari mana data CekPlat berasal, seberapa bisa dipercaya, dan apa yang belum diketahui. Ringkasannya ada di [README](../README.md#seberapa-akurat).


**Tidak ada API atau dokumen resmi Polri/Samsat yang menerbitkan pembagian huruf seri.** Pencarian API publik (apiindonesia.id, nopol.id, plat-id, SIGNAL, Samsat Digital) tidak menemukan satu pun yang memuat huruf seri ke kota/kabupaten: yang ada hanya tingkat kode, data kendaraan berbayar, atau tanpa sumber. Semua data berasal dari tabel publik, dan setiap hasil diberi tingkat keyakinan:

| Cap | Arti | Contoh |
|---|---|---|
| **Tinggi** | Tabel utama cocok dengan minimal satu artikel lain yang memuat tabel rinci, tanpa yang bertentangan untuk huruf itu | Plat B, H, A, E, F, G, K, AB, AD, DK, DR, KT, DA, BK, BM, dan huruf A-R plat D |
| **Sedang** | Satu tabel saja, pembanding tidak memuat huruf itu, atau mayoritas sumber sepakat dengan satu yang berbeda | KU, DP, DC, DE, DG, EB, ED, DH, DL, DM, DN, DT, P, M, S/T dan V/Y plat D |
| **Ambigu** | Sumber bertentangan, atau satu huruf tercatat untuk beberapa daerah | W dan Z plat D, sebagian huruf plat N, EA, BB, BH, T-Z plat T |
| **Tingkat provinsi** | Hanya provinsi yang bisa ditentukan | `PS`, `PT`, `PY`, atau huruf yang tidak tercatat |

**Arti "cocok" (penting):** artinya tidak ada tabel lain yang bertentangan, **bukan** data resmi dan **bukan** bukti independen. Moladin, detikOto, Daihatsu, Auto2000, Popmama, dan IDN Times terlihat saling mengutip. Satu kesalahan yang sama di semuanya tetap mungkin lolos.

## Hasil verifikasi silang (21 Nov 2026)

Untuk 55 kode yang punya tabel, saya mencari artikel per-plat dari penerbit lain sebagai pembanding (sebagian kode tidak punya pembanding yang bisa dibaca, lihat daftar di bawah); hasilnya ada di `js/verify.js` (status, tanggal, tautan, dan huruf yang diperdebatkan) dan ditampilkan di aplikasi.

- **Cocok:** A, B, E, F, G, H, K, Z, AA, AB, AD, DB, DD, DK, DR, KT, DA, BD, BE, BK, BM, BN, PA (tabel lama), dan lain-lain, lihat tab *Soal akurasi*.
- **Konflik nyata, ditandai ambigu atau diberi catatan, tidak ditebak:**
  - **N**: detikOto (2023) menulis versi berbeda untuk huruf L, O, P, S, T, U, W, X.
  - **EA**: halaman Moladin khusus EA bertentangan dengan tabel daftar Moladin sendiri.
  - **BB**: Popmama menukar huruf J/K dan M/N (Sibolga, Tapanuli Tengah, Padang Lawas).
  - **BH**: huruf H, Kota Jambi atau Muaro Jambi.
  - **W**: satu artikel detikOto menulis Gresik dan Sidoarjo terbalik.
  - **BM**: huruf X tercatat untuk Kuantan Singingi dan Kepulauan Meranti di semua sumber.
  - **AE, AG, BP**: artikel pembanding berpola berurutan dan tidak konsisten secara internal, jadi tidak dipakai, tetapi dicatat.
- **Belum ada pembanding sama sekali:** P, DH, EB, ED, DC, DL, DM, DN, DT, BG, DE, DG, KU (satu sumber).
- Pembanding hanya diambil lewat ringkasan model kecil saat pencarian web, jadi tabel penting sebaiknya dicek ulang sebelum dijadikan dasar keputusan.

## Data baru

- **KU** (Kalimantan Utara): Bulungan A-B, Tarakan G, Tana Tidung H, Nunukan N, Malinau S (satu sumber: Daihatsu).
- **DP** dan **DW** (Sulawesi Selatan) ditambahkan; sebelumnya tidak ada di daftar kode.
- **PS, PT, PY**: kode provinsi baru sejak 2024 (Papua Selatan, Papua Tengah, Papua Barat Daya). Plat PA/PB lama tetap berlaku; huruf PA/PB yang daerahnya pindah diberi catatan. Kode Papua Pegunungan belum ditemukan di sumber.
- **Kepulauan Seribu** tidak tercantum di sumber mana pun yang diperiksa ulang, jadi tidak ada huruf yang bisa dipastikan untuknya.

Untuk koreksi, gunakan tombol **Data ini salah?** di aplikasi atau buka [issue baru](https://github.com/baska-pro/plat/issues/new?template=koreksi-data.yml). Jika Anda punya data resmi (Bapenda, Ditlantas), ubah `js/series.js` (tabel), `js/verify.js` (status dan huruf diperdebatkan), atau `LETTER_MAP` di `js/data.js` (plat D) lalu jalankan `npm test`.

Hal lain:

- **Plat tidak memuat kantor Samsat tertentu.** Alamat Samsat ada untuk Bandung Raya (artikel 2017 dan 2021) dan Jakarta (DDTCNews, 6 Nov 2026; tanpa telepon, jam hari kerja belum terverifikasi). Surabaya baru nama kantornya (Barat, Timur/Manyar, Utara, Selatan), tanpa alamat. Semarang, Yogyakarta, Medan, dan daerah lain belum punya sumber alamat yang bisa dipercaya, jadi tidak diisi; aplikasi mengarahkan ke Bapenda provinsi. Cek ulang sebelum berkunjung.
- **Jenis kendaraan bersifat indikatif.** Rentang nomor (1-1999 mobil, 2000-6999 motor, 7000-7999 bus, 8000-8999 barang, 9000-9999 khusus) adalah penjatahan awal, dan nomor bisa dipakai ulang dengan seri lain.
- **Pribadi vs umum ditentukan warna plat**, bukan angka atau huruf.
- **Tidak ada data pemilik, merek, tipe, atau pajak** (tidak publik). Untuk pajak gunakan kanal resmi Bapenda.
- Seri `ZZ`/`RF` untuk plat dinas bersumber dari Wikipedia dan perlu diverifikasi.
- Tanda `*` di tabel Moladin hanya artefak format; diverifikasi lewat Auto2000 (plat H): huruf **pertama** setelah angka yang menentukan daerah.


## Sumber


- [Moladin: 300+ Kode Plat Nomor Belakang](https://moladin.com/news/kode-plat-nomor-belakang-kendaraan-dan-daerahnya-2/) (tabel utama semua kode) dan [Daftar Plat Nomor](https://moladin.com/news/daftar-plat-nomor-kendaraan-dan-daerahnya/)
- [Auto2000: Kode Plat Belakang Jakarta](https://auto2000.co.id/berita-dan-tips/kode-plat-nomor-belakang-jakarta) dan [Plat H](https://auto2000.co.id/berita-dan-tips/plat-nomor-h-tips)
- [GetAndRide: Detail Kode Plat Belakang](https://blog.getandride.com/tips/detail-kode-plat-nomor-belakang-kendaraan-indonesia-beserta-wilayahnya/)
- [Popmama: Plat D Daerah Mana?](https://www.popmama.com/life/health/plat-d-daerah-mana-ini-daftar-lengkap-wilayah-dan-cara-cek-pajaknya-00-wjk9l-516pwd)
- [detikOto: Kode Plat Belakang](https://oto.detik.com/berita/d-7309433/kode-plat-nomor-belakang-kendaraan-komponen-dan-wilayahnya), [Daftar Kode Plat](https://oto.detik.com/berita/d-7086258/plat-d-daerah-mana-cek-daftar-kode-plat-nomor-seluruh-indonesia), [Arti Warna Pelat](https://oto.detik.com/berita/d-7932595/arti-warna-pelat-nomor-kendaraan-di-indonesia-ada-yang-hijau)
- [Perkap Polri No. 4 Tahun 2006](https://kalsel.polri.go.id/perkap/2006/PERKAP%20NO%204%20TH%202006%20TTG%20PENOMORAN%20RANMOR.pdf)
- [Wikipedia: Vehicle registration plates of Indonesia](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Indonesia)
- [Hukumonline: Kode Plat Khusus dan Rahasia](https://www.hukumonline.com/klinik/a/ini-arti-kode-plat-nomor-khusus-dan-rahasia-untuk-kendaraan-pejabat-lt5fa10ac795848/)
- Verifikasi silang (21 Nov 2026): artikel per-plat Popmama, IDN Times, detikOto, Daihatsu, Auto2000, Astra Otoshop, Gridoto, Kumparan; daftar lengkap tautan per kode ada di `js/verify.js`
- Samsat Jakarta: [DDTCNews (6 Nov 2026)](https://news.ddtc.co.id/berita/daerah/1823916/mudahkan-wajib-pajak-sejumlah-samsat-di-jakarta-buka-hingga-sabtu), [detikOto Jaksel (2023)](https://oto.detik.com/berita/d-6938153/samsat-jakarta-selatan-sampai-jam-berapa-ini-keterangan-dan-layanannya); Surabaya: [detikJatim (2026)](https://www.detik.com/jatim/berita/d-8289768/samsat-manyar-surabaya-ramai-di-hari-pertama-kerja-usai-libur-tahun-baru)
- Kanal resmi cek pajak: [Pajakku: link e-Samsat 38 provinsi (Agu 2026)](https://pajakku.com/artikel/cek-pajak-motor-online-terbaru-lengkap-dengan-link-e-samsat-untuk-38-provinsi), [SIGNAL di App Store](https://apps.apple.com/us/app/signal-samsat-digital-nasional/id1587653489), [detikOto: 7 aplikasi cek pajak (2024)](https://oto.detik.com/berita/d-7268374/7-aplikasi-cek-pajak-kendaraan-resmi-dan-langkah-langkahnya). Alamat situs provinsi bisa berubah; provinsi tanpa alamat terverifikasi memakai pencarian
- Perubahan kode Papua: [detikOto (2024)](https://oto.detik.com/berita/d-7501604/kode-pelat-nomor-di-3-provinsi-papua-diubah)
- Samsat: [Seputar Bandung Raya (2017)](https://www.seputarbandungraya.com/2017/12/alamat-nomor-telepon-dan-jam-layanan.html), [Kumparan (2021)](https://kumparan.com/info-otomotif/samsat-bandung-ini-lokasi-dan-jam-operasionalnya-1wdVh1Hrnql)

