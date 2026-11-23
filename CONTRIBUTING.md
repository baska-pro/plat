# Berkontribusi

Terima kasih sudah mau membantu. Yang paling berguna untuk proyek ini adalah **data yang benar**, jadi koreksi dengan sumber lebih berharga daripada fitur baru.

## Melaporkan data yang salah

Cara tercepat: tombol **Data ini salah?** di aplikasi. Tombol itu membuka formulir issue dengan kode wilayah dan huruf yang sudah terisi (nomor plat lengkap tidak ikut dikirim). Tulis hasil yang seharusnya dan, kalau ada, tautan sumbernya. Sumber resmi (Bapenda, Ditlantas, Samsat) lebih kuat daripada artikel otomotif.

## Memperbaiki data lewat pull request

| Yang diubah | Berkas |
|---|---|
| Huruf seri per daerah untuk kode selain D | `js/series.js` |
| Plat D (Bandung Raya) | `LETTER_MAP` di `js/data.js` |
| Status verifikasi, tanggal cek, tautan pembanding, huruf yang diperdebatkan | `js/verify.js` |
| Alamat dan jam Samsat | `SAMSAT_AREA` di `js/data.js` |
| Tautan pajak provinsi | `TAX_SITES` di `js/data.js` |

Aturan kecil:

- Sertakan sumber di deskripsi PR. Jangan menebak: huruf yang belum pasti lebih baik ditandai ambigu daripada diisi.
- Kalau mengubah data, perbarui juga entri di `js/verify.js` (tanggal cek dan status) supaya cap keyakinan di aplikasi tetap jujur.
- Jalankan `npm test` sebelum membuka PR. Tes memeriksa konsistensi tabel, jadi salah ketik biasanya langsung ketahuan.

## Mengubah kode

```bash
npm start                                         # http://localhost:8080
npm test                                          # tes unit
npm install && npx playwright install chromium    # sekali saja
npm run test:ui                                   # tes antarmuka
```

Proyek ini sengaja tanpa framework dan tanpa langkah build: HTML, CSS, dan JavaScript biasa. Mohon tidak menambah dependensi runtime. Font di-host sendiri, jadi aplikasi tidak memanggil layanan pihak ketiga.

Untuk perubahan besar, buka issue dulu supaya kita sepakat arahnya sebelum Anda menulis banyak kode.

Dengan mengirim kontribusi, Anda setuju kontribusi itu dilisensikan di bawah [lisensi MIT](LICENSE) proyek ini.
