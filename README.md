# CekPlat

Webapp untuk membaca **asal plat nomor kendaraan Indonesia sampai tingkat kota/kabupaten**. Ketik `B 1234 SKA` dan hasilnya bukan "DKI Jakarta dan sekitarnya", melainkan **Kota Adm. Jakarta Selatan**. Ketik `D 5002 FA` dan hasilnya **Kota Bandung**.

Rincian huruf seri tersedia untuk **54 dari 55 kode wilayah** (hanya `KU` Kalimantan Utara yang belum punya data rinci), dengan lebih dari 450 daerah.

## Cara membaca plat

```
D   5002   FA
│    │     └─ huruf PERTAMA seri (F) -> daerah asal: Kota Bandung
│    └─ nomor urut -> jenis kendaraan (2000-6999 = sepeda motor)
└─ kode wilayah -> provinsi
```

Contoh hasil:

| Plat | Hasil |
|---|---|
| `B 1234 SKA` | Kota Adm. Jakarta Selatan, DKI Jakarta |
| `B 1234 KKA` | Kota Bekasi, Jawa Barat |
| `B 1234 EKA` | Kota Depok, Jawa Barat |
| `B 1234 WKA` | Kota Tangerang Selatan, Banten |
| `D 5002 FA` | Kota Bandung, Jawa Barat |
| `H 4821 AB` | Kota Semarang, Jawa Tengah |
| `AB 3456 EA` | Kabupaten Sleman, DI Yogyakarta |
| `D 1234 WA` | **Kabupaten Bandung atau Kabupaten Bandung Barat** (ambigu, lihat di bawah) |

## Fitur

- **Ketik langsung di plat**: hasil muncul saat mengetik; warna plat bisa dipilih (putih, kuning, merah, hijau, hitam) untuk menentukan pribadi/umum/dinas
- **Pembaca tiga bagian**: kode wilayah, nomor urut, dan seri huruf dijelaskan satu per satu, dengan deretan tuts A-Z yang menyorot huruf Anda dan huruf lain milik daerah yang sama
- **Cap tingkat keyakinan** di setiap hasil (tinggi / sedang / ambigu / tingkat provinsi)
- **Peta huruf**: pilih kode untuk melihat huruf apa milik daerah mana, atau **cari balik**: ketik "Cimahi" untuk tahu kodenya `D` dengan huruf `S, T`
- **Banyak sekaligus**: tempel hingga 500 plat, salin ke Excel atau unduh CSV
- Samsat Bandung Raya (alamat, telepon, jam layanan, tombol peta dan telepon), masa berlaku plat `BB.TT`, riwayat, tautan yang bisa dibagikan (`?plat=B+1234+SKA`)
- Terang/gelap, responsif dari ponsel sampai desktop, bisa diinstal (PWA) dan jalan offline
- Tanpa framework, tanpa dependensi, font di-host sendiri; semua diproses di browser, tidak ada data dikirim ke mana pun

## Menjalankan

```bash
npm start        # server statis di http://localhost:8080
npm test         # 38 tes parser dan data
```

Atau hosting statis di GitHub Pages (workflow di `.github/workflows/pages.yml`; aktifkan Pages dengan sumber "GitHub Actions").

## Soal akurasi (baca ini)

**Tidak ada API atau dokumen resmi Polri/Samsat yang menerbitkan pembagian huruf seri.** Semua data berasal dari tabel publik, dan setiap hasil diberi tingkat keyakinan:

| Cap | Arti | Cakupan |
|---|---|---|
| **Tinggi** | Dua sumber atau lebih yang memuat tabel rinci sepakat | Plat **B**, plat **H**, huruf A-P dan R plat D, huruf U dan X plat D |
| **Sedang** | Satu tabel rinci tanpa pembanding independen, atau mayoritas sumber sepakat | Sebagian besar kode lain; S/T dan V/Y plat D |
| **Ambigu** | Sumber bertentangan, atau satu huruf tercatat untuk beberapa daerah | Huruf W dan Z plat D; T-Z plat T; beberapa huruf kode lain |
| **Tingkat provinsi** | Hanya provinsi yang bisa ditentukan | Kode `KU`, atau huruf yang tidak ada di tabel |

Untuk huruf ambigu, aplikasi menampilkan **semua kandidat**, bukan menebak. Beberapa temuan penting:

- Basis utama (tabel Moladin, 54 kode) **bersumber satu garis** dan dicocokkan hanya untuk B (dengan Auto2000), H (Auto2000), D (beberapa sumber), dan sebagian K (detikOto). Untuk kode lain, cap "sedang" jujur berarti **belum diverifikasi silang**.
- Plat **D** punya konflik nyata antar sumber, terutama huruf W dan Z (Kabupaten Bandung vs Bandung Barat) dan S/T/V/Y (Cimahi vs Kabupaten Bandung). Detailnya ada di `js/data.js`.
- Huruf yang tidak tercantum di tabel (misal `Q` di plat B) ditampilkan sebagai "tidak tercatat", bukan ditebak.
- **Kepulauan Seribu** tidak tercantum di sumber mana pun yang diperiksa; **Kalimantan Utara** belum punya data rinci.
- Tanda `*` di tabel Moladin hanya artefak format. Diverifikasi lewat Auto2000 (plat H): huruf **pertama** setelah angka yang menentukan daerah.
- Pemekaran dan perubahan pembagian huruf bisa belum tercermin di tabel sumber.

Jika Anda punya data resmi (misalnya dari Bapenda atau Ditlantas), ubah `js/series.js` (kode lain) atau `LETTER_MAP` di `js/data.js` (plat D) lalu jalankan `npm test`.

Hal lain:

- **Plat tidak memuat kantor Samsat tertentu.** Alamat Samsat saat ini hanya untuk Bandung Raya (artikel 2017 dan 2021, jadi cek ulang). Untuk daerah lain aplikasi mengarahkan ke Bapenda provinsi.
- **Jenis kendaraan bersifat indikatif.** Rentang nomor (1-1999 mobil, 2000-6999 motor, 7000-7999 bus, 8000-8999 barang, 9000-9999 khusus) adalah penjatahan awal, dan nomor bisa dipakai ulang dengan seri lain.
- **Pribadi vs umum ditentukan warna plat**, bukan angka atau huruf.
- **Tidak ada data pemilik, merek, tipe, atau pajak** (tidak publik). Untuk pajak gunakan kanal resmi Bapenda.
- Seri `ZZ`/`RF` untuk plat dinas bersumber dari Wikipedia dan perlu diverifikasi.

## Struktur

```
index.html            halaman
css/style.css         gaya ("loket registrasi": kertas, tinta, bayangan keras; mode gelap = aspal)
fonts/                Barlow Condensed, IBM Plex Sans/Mono (SIL OFL, di-host sendiri)
js/series.js          tabel huruf seri -> daerah untuk 52 kode (diedit di sini)
js/data.js            plat D, Samsat, warna, kode wilayah, sumber, pencarian
js/parser.js          logika parsing plat (bisa dipakai di Node)
js/app.js             antarmuka
sw.js, manifest...    PWA / offline
tests/                38 tes otomatis (node:test)
scripts/serve.js      server statis lokal
```

## Sumber

- [Moladin: 300+ Kode Plat Nomor Belakang](https://moladin.com/news/kode-plat-nomor-belakang-kendaraan-dan-daerahnya-2/) (tabel utama semua kode) dan [Daftar Plat Nomor](https://moladin.com/news/daftar-plat-nomor-kendaraan-dan-daerahnya/)
- [Auto2000: Kode Plat Belakang Jakarta](https://auto2000.co.id/berita-dan-tips/kode-plat-nomor-belakang-jakarta) dan [Plat H](https://auto2000.co.id/berita-dan-tips/plat-nomor-h-tips)
- [GetAndRide: Detail Kode Plat Belakang](https://blog.getandride.com/tips/detail-kode-plat-nomor-belakang-kendaraan-indonesia-beserta-wilayahnya/)
- [Popmama: Plat D Daerah Mana?](https://www.popmama.com/life/health/plat-d-daerah-mana-ini-daftar-lengkap-wilayah-dan-cara-cek-pajaknya-00-wjk9l-516pwd)
- [detikOto: Kode Plat Belakang](https://oto.detik.com/berita/d-7309433/kode-plat-nomor-belakang-kendaraan-komponen-dan-wilayahnya), [Daftar Kode Plat](https://oto.detik.com/berita/d-7086258/plat-d-daerah-mana-cek-daftar-kode-plat-nomor-seluruh-indonesia), [Arti Warna Pelat](https://oto.detik.com/berita/d-7932595/arti-warna-pelat-nomor-kendaraan-di-indonesia-ada-yang-hijau)
- [Perkap Polri No. 4 Tahun 2006](https://kalsel.polri.go.id/perkap/2006/PERKAP%20NO%204%20TH%202006%20TTG%20PENOMORAN%20RANMOR.pdf)
- [Wikipedia: Vehicle registration plates of Indonesia](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Indonesia)
- [Hukumonline: Kode Plat Khusus dan Rahasia](https://www.hukumonline.com/klinik/a/ini-arti-kode-plat-nomor-khusus-dan-rahasia-untuk-kendaraan-pejabat-lt5fa10ac795848/)
- Samsat: [Seputar Bandung Raya (2017)](https://www.seputarbandungraya.com/2017/12/alamat-nomor-telepon-dan-jam-layanan.html), [Kumparan (2021)](https://kumparan.com/info-otomotif/samsat-bandung-ini-lokasi-dan-jam-operasionalnya-1wdVh1Hrnql)

## Disclaimer

Bukan layanan resmi Polri atau Samsat. Untuk keperluan hukum atau administrasi, verifikasi ke Samsat/Bapenda setempat.

## Lisensi

MIT. Font berlisensi SIL OFL 1.1 (lihat `fonts/LICENSE-OFL.txt`).
