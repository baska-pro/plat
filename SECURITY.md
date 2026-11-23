# Keamanan

CekPlat adalah situs statis: semua proses terjadi di browser, tanpa server, akun, atau basis data. Nomor plat yang diketik tidak dikirim ke mana pun. Satu-satunya data yang disimpan adalah riwayat pencarian, skor kuis, dan pilihan tema di `localStorage` perangkat Anda sendiri.

## Melaporkan kerentanan

Kalau Anda menemukan celah (misalnya XSS lewat input plat atau tautan `?plat=`), mohon **jangan** membuka issue publik. Gunakan **Report a vulnerability** di tab Security repositori ini (GitHub private vulnerability reporting). Sertakan langkah untuk mereproduksi dan browser yang dipakai.

Laporan yang valid akan ditanggapi secepatnya dan diperbaiki sebelum diumumkan.

## Yang bukan kerentanan

Data wilayah yang keliru bukan masalah keamanan. Untuk itu buka [issue koreksi data](https://github.com/baska-pro/plat/issues/new?template=koreksi-data.yml).
