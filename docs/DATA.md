# Data terbuka

Tabel huruf seri CekPlat tersedia sebagai JSON supaya bisa dipakai proyek lain, tanpa perlu membaca `js/series.js`.

- Berkas: [`data/plat.json`](../data/plat.json)
- Skema: [`data/plat.schema.json`](../data/plat.schema.json)
- Dari situs: `https://baska-pro.github.io/plat/data/plat.json`

Berkas ini dibuat dari kode oleh `npm run build:data` dan dijaga tetap sinkron oleh tes. Jangan disunting langsung; ubah `js/series.js` atau `js/verify.js`, lalu jalankan perintah itu.

## Bentuk

```json
{
  "codes": [
    {
      "code": "B",
      "province": "DKI Jakarta (dan sekitarnya)",
      "detailed": true,
      "verification": {
        "status": "cocok",
        "checkedOn": "2026-11-19",
        "note": "...",
        "references": [{ "label": "...", "url": "https://..." }]
      },
      "areas": [{ "name": "Kota Adm. Jakarta Selatan", "province": "DKI Jakarta", "letters": ["S"] }],
      "letters": {
        "S": { "areas": ["Kota Adm. Jakarta Selatan"], "confidence": "tinggi" }
      }
    }
  ]
}
```

- **Huruf yang dipakai** adalah huruf *pertama* seri di belakang angka (`B 1234 SKA` memakai `S`).
- **`confidence`**: `tinggi`, `sedang`, atau `rendah` (ambigu). Lihat [AKURASI.md](AKURASI.md) untuk artinya.
- **`areas` lebih dari satu** pada satu huruf berarti sumber bertentangan atau huruf itu dipakai bersama. Jangan dipilih acak; tampilkan sebagai ambigu.
- **`verification.status`**: `cocok` (tidak ada tabel lain yang bertentangan), `sebagian`, `konflik`, atau `tanpa-pembanding`. `cocok` bukan berarti resmi.
- **`detailed: false`** (saat ini `PS`, `PT`, `PY`) berarti hanya provinsinya yang diketahui.
- Catatan khusus satu huruf ada di `letters.X.note`; catatan untuk seluruh kode ada di `verification.note`.

## Contoh pemakaian

```js
const { codes } = await (await fetch('https://baska-pro.github.io/plat/data/plat.json')).json();
const b = codes.find((c) => c.code === 'B');
console.log(b.letters.S.areas); // ["Kota Adm. Jakarta Selatan"]
```

Data ini bukan data resmi Polri atau Samsat dan bisa memuat kesalahan. Sertakan tingkat keyakinannya saat menampilkannya ke pengguna.
