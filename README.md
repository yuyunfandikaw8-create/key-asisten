# Riasaja

Meja kerja untuk vendor pernikahan. Makeup, dekor, dan sewa baju bisa saling menemukan partner lalu menjual satu harga kombo. Studio demo-nya **Laras Bridal** di Bandung, dengan jadwal, DP, invoice, dan pricelist.

## Menjalankan

```bash
npm install
npm run dev -- --port 43123
```

Buka [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Yang bisa dicoba

- Studio demo di `/studio`: laba, DP, bentrok jadwal, dan gaun yang telat kembali.
- Booking baru di `/studio/jadwal/baru`. Tombol **Isi contoh chat** membaca nama, tanggal, jam, lokasi, paket, dan nomor.
- Invoice di `/studio/invoice`: catat DP, tandai lunas, atau buka WhatsApp dengan pesan tagihan.
- Gaun di `/studio/gaun`.
- Pricelist publik di `/p/laras`. Pengajuan tanggal dan kombo masuk ke jadwal studio sebagai belum DP.
- Partner di `/studio/partner`. Saring dekor, makeup, atau sewa baju, ajak kerja sama, lalu susun kombo.

Data tersimpan di browser (`localStorage`). Tombol **Data contoh** mengembalikan studio Laras Bridal.

Supabase project `iukerqusjdlkkoyxvgjs` belum disambungkan. Endpoint `/rest/v1/` menolak request tanpa anon key. Jangan menaruh service role key di aplikasi ini.
