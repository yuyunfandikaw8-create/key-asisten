# Key Assistant

Meja kerja untuk vendor pernikahan. Make Up Artist, Hijab & Hair Stylist, Decoration, Attire, Photografer & Videografer, dan Event & Wedding Content Creator bisa saling menemukan partner lalu menjual satu harga kombo. Lokasi bisa diganti (Bandung, Surabaya, Jakarta, …) supaya partner dan inbox hanya menampilkan kota itu. Studio demo-nya **Key Partner**, dengan jadwal, DP, invoice, dan pricelist.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://127.0.0.1:43123](http://127.0.0.1:43123) (server listen di `0.0.0.0:43123` supaya preview Cursor bisa menjangkau).

## Login

Studio dilindungi login. Coba di `/masuk` atau daftar di `/daftar`.

Akun contoh (tersimpan di browser):

- Bandung: `laras@riasaja.id` / `laras123`
- Surabaya: `nadya@riasaja.id` / `suro123`

Atau tekan **Lanjutkan dengan Google** / **Daftar dengan Google**, lalu pilih salah satu Gmail contoh di dialog.

Supabase project: `iukerqusjdlkkoyxvgjs` — pakai **anon public JWT** di `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://iukerqusjdlkkoyxvgjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon public, bukan service_role
```

- Email/password baru → Auth Supabase (biasanya perlu konfirmasi email).
- Akun contoh `@riasaja.id` dan pilihan Gmail demo → tetap lokal untuk coba cepat.
- Google OAuth asli: aktifkan provider Google di Supabase Authentication, lalu tombol Google akan mengalihkan ke Google.
- **Jangan** taruh `service_role` / `sb_secret_` di frontend atau sebagai `NEXT_PUBLIC_*`.
- Jalankan `supabase/schema.sql` di SQL Editor agar tabel `studios` + RLS tersedia.

### Deploy Vercel

1. Create repo GitHub dari chat Cursor (proyek ini masih Origin sementara).
2. Import repo di Vercel.
3. Set env Production/Preview: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sama seperti lokal).
4. Deploy branch `main`.
5. Di Supabase Auth → URL Configuration, tambahkan `https://<domain-vercel>/masuk` ke Redirect URLs.

## Yang bisa dicoba

- Studio demo di `/studio` (setelah masuk): laba, DP, bentrok jadwal, dan gaun yang telat kembali.
- Booking baru di `/studio/jadwal/baru`. Tombol **Isi contoh chat** membaca nama, tanggal, jam, lokasi, paket, dan nomor.
- Invoice di `/studio/invoice`: catat DP, tandai lunas, atau buka WhatsApp dengan pesan tagihan.
- Gaun di `/studio/gaun`.
- Pricelist publik di `/p/laras`. Pengajuan tanggal dan kombo masuk ke jadwal studio sebagai belum DP.
- Partner di `/studio/partner`. Saring Make Up Artist, Hijab & Hair, Decsets, Attire, Photografer & Videografer, atau Content Creator di kota aktif, ajak kerja sama, lalu susun kombo.
- Inbox di `/studio/inbox`. Chat partner sesuai lokasi aktif (contoh: pilih Surabaya untuk melihat partner Surabaya saja).
- Menu di `/studio/menu`. Pintasan ke jadwal, partner, invoice, aset, lokasi, dan identitas studio.

Data tersimpan di browser (`localStorage`). Tombol **Data contoh** mengembalikan studio Key Partner.

Supabase project `iukerqusjdlkkoyxvgjs` belum disambungkan. Endpoint `/rest/v1/` menolak request tanpa anon key. Jangan menaruh service role key di aplikasi ini.
