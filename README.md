# Key Assistant

Meja kerja untuk vendor pernikahan. Make Up Artist, Hijab & Hair Stylist, Decoration, Attire, Photografer & Videografer, dan Event & Wedding Content Creator bisa saling menemukan partner lalu menjual satu harga kombo. Lokasi bisa diganti (Bandung, Surabaya, Jakarta, …) supaya partner dan inbox hanya menampilkan kota itu. Studio demo-nya **Key Partner**, dengan jadwal, DP, invoice, dan pricelist.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://127.0.0.1:43123](http://127.0.0.1:43123) (server listen di `0.0.0.0:43123` supaya preview Cursor bisa menjangkau).

## Login & onboarding

Studio dilindungi login. Daftar di `/daftar` (Step 1: akun), lalu lanjut `/onboarding` (workspace → bidang bisnis multi-select → profil → layanan opsional → dashboard). Akun contoh di bawah sudah selesai onboarding.

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
- Jalankan `supabase/schema.sql` di SQL Editor agar tabel `studios`, `owner_data`, dan RLS tersedia.

### Sinkron lintas perangkat (HP / laptop)

Data bisnis ikut **email akun** (Auth Supabase `user_metadata`, plus tabel `owner_data` jika sudah dijalankan). Bukan hanya di browser satu HP.

1. **Daftar** dengan email + kata sandi (bukan `@riasaja.id`).
2. Supabase project ini memakai **konfirmasi email** — cek inbox/spam, klik link, baru bisa masuk di perangkat lain.
3. Di perangkat yang sudah terisi data, tekan **Simpan ke cloud** (banner di studio) sekali setelah email terkonfirmasi.
4. Di HP lain: **Masuk** dengan email & kata sandi yang sama — profil, onboarding, dan studio ditarik dari cloud.

Opsional di Supabase Dashboard → Authentication → Providers → Email: matikan “Confirm email” agar daftar langsung punya sesi (lebih mudah untuk uji lintas perangkat).

Tanpa Supabase (atau akun demo), data tetap hanya di `localStorage` perangkat itu.

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
- Operasional juga punya **Profil bisnis** (`/studio/profil`, seperti langkah 4) dan **Layanan & harga** (`/studio/layanan`, seperti langkah 5) supaya owner bisa menambah/mengubah layanan tanpa mengulang biodata penuh.

Data demo / cache tetap di browser (`localStorage`). Akun email nyata menyimpan salinan ke Supabase (`owner_data`) supaya login di perangkat lain memulihkan data. Tombol **Data contoh** hanya menampilkan sampel Key Partner; tidak menimpa data cloud.

Jangan menaruh service role key di aplikasi ini.
