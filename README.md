# CekPlat

Webapp untuk mengecek asal plat nomor kendaraan Indonesia, dengan fokus akurat pada **plat D (Bandung Raya)**. Ketik `D 5002 FA` dan aplikasi menampilkan:

- **Wilayah**: Kota Bandung, Kota Cimahi, Kabupaten Bandung, atau Kabupaten Bandung Barat (KBB)
- **Samsat** yang melayani wilayah itu (alamat, telepon, jam layanan, tombol peta dan telepon)
- **Jenis kendaraan** (mobil, motor, bus, barang, khusus) dari rentang nomor
- **Penggunaan** (pribadi / umum / dinas) dari warna plat
- **Masa berlaku** plat (format `BB.TT`)
- Kode wilayah seluruh Indonesia (55 kode) dan plat khusus (CD, CC, RI)

## Fitur

- Cek satu plat dengan input fleksibel (`d5002fa`, `D-5002-FA`, huruf kecil semua bisa)
- **Cek banyak**: tempel hingga 500 plat, salin hasil atau unduh CSV
- Riwayat pencarian (lokal), tautan yang bisa dibagikan (`?plat=D+5002+FA`)
- Tema terang/gelap otomatis, responsif ponsel sampai desktop, bisa diinstal (PWA) dan jalan offline
- Tanpa framework, tanpa dependensi, tanpa server: semua diproses di browser, tidak ada data dikirim ke mana pun

## Menjalankan

```bash
npm start        # server statis di http://localhost:8080
npm test         # 27 tes parser dan data
```

Atau buka `index.html` langsung / hosting di GitHub Pages (workflow sudah disediakan di `.github/workflows/pages.yml`; aktifkan Pages dengan sumber "GitHub Actions" di pengaturan repo).

## Soal akurasi data (baca ini)

**Tidak ada API atau dokumen resmi Polri/Samsat yang mempublikasikan pembagian huruf seri plat D.** Datanya berasal dari artikel publik, dan artikel-artikel itu **tidak sepenuhnya sepakat**. Daripada memilih satu sumber lalu berpura-pura pasti, aplikasi ini membandingkan empat sumber dan menampilkan tingkat keyakinan di setiap hasil:

| Huruf seri pertama | Wilayah | Keyakinan | Catatan |
|---|---|---|---|
| A-P, R | Kota Bandung | Tinggi | Semua sumber sepakat |
| U, X | Kab. Bandung Barat | Tinggi | Semua sumber sepakat |
| S, T | Kota Cimahi | Sedang | 3 dari 4 sumber; Popmama menaruhnya di Kab. Bandung |
| V, Y | Kabupaten Bandung | Sedang | 3 dari 4 sumber; Popmama menaruhnya di Cimahi |
| W | Kab. Bandung **atau** KBB | Ambigu | Sumber terbelah 2-2 |
| Z | KBB **atau** Kab. Bandung | Ambigu | Sumber terbelah tiga arah |
| Q | Kota Bandung | Rendah | Hanya tersirat dari rentang "A-R" |

Untuk huruf ambigu, aplikasi menampilkan **semua kandidat beserta Samsat-nya**, bukan menebak. Jika Anda punya akses ke data resmi (misalnya dari Bapenda Jabar atau Ditlantas Polda Jabar), cukup ubah `LETTER_MAP` di `js/data.js` dan jalankan `npm test`.

Hal lain yang perlu diketahui:

- **Plat tidak memuat kantor Samsat tertentu.** Yang ditampilkan adalah kantor Samsat yang melayani wilayah tersebut. Alamat dan jam bersumber dari artikel 2017 dan 2021, jadi cek ulang sebelum berkunjung.
- **Jenis kendaraan bersifat indikatif.** Rentang nomor (1-1999 mobil, 2000-6999 motor, 7000-7999 bus, 8000-8999 barang, 9000-9999 khusus) adalah penjatahan awal menurut Perkap Polri 4/2006 dan detikOto. Nomor bisa dipakai ulang dengan seri berbeda. Sumber-sumber berbeda soal batas 8000-9999, dan aplikasi memakai pembagian detikOto.
- **Pribadi vs umum ditentukan warna plat**, bukan angka atau huruf, sehingga pengguna perlu memilih warna di "Opsi tambahan".
- **Tidak ada data pemilik, merek, tipe, atau pajak.** Data itu tidak publik. Untuk cek pajak gunakan kanal resmi Bapenda Jawa Barat.
- Seri `ZZ`/`RF` untuk plat dinas bersumber dari Wikipedia dan ditandai perlu verifikasi.

## Struktur

```
index.html            halaman
css/style.css         gaya (terang/gelap, responsif)
js/data.js            seluruh data + sumber + tingkat keyakinan
js/parser.js          logika parsing plat (bisa dipakai di Node)
js/app.js             antarmuka
sw.js, manifest...    PWA / offline
tests/                tes otomatis (node:test)
scripts/serve.js      server statis lokal
```

## Sumber

- [Popmama: Plat D Daerah Mana?](https://www.popmama.com/life/health/plat-d-daerah-mana-ini-daftar-lengkap-wilayah-dan-cara-cek-pajaknya-00-wjk9l-516pwd)
- [Moladin: 300+ Kode Plat Nomor Belakang](https://moladin.com/news/kode-plat-nomor-belakang-kendaraan-dan-daerahnya-2/) dan [Daftar Plat Nomor](https://moladin.com/news/daftar-plat-nomor-kendaraan-dan-daerahnya/)
- [detikOto: Kode Plat Nomor Belakang](https://oto.detik.com/berita/d-7309433/kode-plat-nomor-belakang-kendaraan-komponen-dan-wilayahnya), [Daftar Kode Plat Seluruh Indonesia](https://oto.detik.com/berita/d-7086258/plat-d-daerah-mana-cek-daftar-kode-plat-nomor-seluruh-indonesia), [Arti Warna Pelat](https://oto.detik.com/berita/d-7932595/arti-warna-pelat-nomor-kendaraan-di-indonesia-ada-yang-hijau)
- [Perkap Polri No. 4 Tahun 2006](https://kalsel.polri.go.id/perkap/2006/PERKAP%20NO%204%20TH%202006%20TTG%20PENOMORAN%20RANMOR.pdf)
- [Wikipedia: Vehicle registration plates of Indonesia](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Indonesia)
- [Hukumonline: Kode Plat Khusus dan Rahasia](https://www.hukumonline.com/klinik/a/ini-arti-kode-plat-nomor-khusus-dan-rahasia-untuk-kendaraan-pejabat-lt5fa10ac795848/)
- Alamat Samsat: [Seputar Bandung Raya (2017)](https://www.seputarbandungraya.com/2017/12/alamat-nomor-telepon-dan-jam-layanan.html), [Kumparan (2021)](https://kumparan.com/info-otomotif/samsat-bandung-ini-lokasi-dan-jam-operasionalnya-1wdVh1Hrnql)

## Disclaimer

Bukan layanan resmi Polri atau Samsat. Untuk keperluan hukum atau administrasi, verifikasi ke Samsat/Bapenda setempat.

## Lisensi

MIT
