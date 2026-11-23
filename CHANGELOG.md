# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/), dan versi mengikuti [SemVer](https://semver.org/lang/id/). Perubahan data wilayah dicatat sebagai *Diubah* atau *Diperbaiki*.

## [1.0.0] - 2026-11-23

Rilis publik pertama.

### Ditambahkan
- Pembaca plat nomor: ketik langsung di plat, hasilnya sampai tingkat kota/kabupaten, lengkap dengan jenis kendaraan, masa berlaku `BB.TT`, dan arti warna plat.
- Tabel huruf seri untuk 57 dari 60 kode wilayah (`PS`, `PT`, `PY` masih tingkat provinsi), dengan lebih dari 450 daerah.
- Cap tingkat keyakinan (tinggi, sedang, ambigu, tingkat provinsi), tanggal cek, dan status perbandingan dengan penerbit lain per kode.
- Peta huruf, pencarian dari nama daerah, cek banyak plat sekaligus (tempel hingga 500, salin ke Excel atau unduh CSV).
- Kuis "Tebak plat" yang hanya memakai huruf berkeyakinan tinggi.
- Alamat Samsat Bandung Raya dan Jakarta, serta tautan kanal resmi cek pajak (SIGNAL dan Bapenda provinsi).
- Tombol "Data ini salah?" yang membuka formulir issue dengan kode dan huruf terisi; nomor plat lengkap tidak ikut dikirim.
- PWA: bisa dipasang dan jalan offline, mode terang/gelap, font di-host sendiri.
- Data terbuka: `data/plat.json` dengan skema JSON ([docs/DATA.md](docs/DATA.md)).
- Tes: 55 tes unit, 29 tes antarmuka (termasuk aksesibilitas WCAG AA lewat axe-core), ESLint, semuanya di CI.
- Halaman 404, `robots.txt`, `sitemap.xml`, dan metadata Open Graph.

[1.0.0]: https://github.com/baska-pro/plat/releases/tag/v1.0.0
