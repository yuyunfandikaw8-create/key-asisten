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

Akun uji (tersimpan di browser; pintasan di `/masuk`):

| Peran | Email | Kata sandi | Untuk |
| --- | --- | --- | --- |
| **Owner** | `owner@riasaja.id` | `owner123` | Portofolio (nav), profil publik `/p/laras`, layanan, booking |
| **Klien** | `klien@riasaja.id` | `klien123` | Cari vendor, lihat portofolio Owner, Pilihan Saya |

Di studio dan ruang klien ada toggle **Data Saya** / **Coba data contoh** — sama seperti Owner. Data contoh tidak menimpa Data Saya (kosong sampai kamu isi).

Atau tekan **Lanjutkan dengan Google** / **Daftar dengan Google**, lalu pilih salah satu Gmail contoh di dialog (setelah login pilih Owner atau Klien).

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

### Database Supabase (wajib untuk sinkron semua data)

Project: `iukerqusjdlkkoyxvgjs`. Anon key saja **tidak** bisa membuat tabel.

1. Buka [Supabase SQL Editor](https://supabase.com/dashboard/project/iukerqusjdlkkoyxvgjs/sql/new).
2. Copy seluruh isi `supabase/schema.sql` → Run.
3. Cek status: `GET /api/cloud-status` (harus `"ok": true`).

Tabel yang dibuat:

| Tabel | Isi |
| --- | --- |
| `profiles` | Akun Owner & Klien |
| `studios` | Identitas studio ringkas |
| `owner_data` | Profil bisnis + state studio (booking, invoice, partner, …) |
| `client_data` | Workspace klien (acara, shortlist, status) |
| `public_booking_profiles` | Profil publik `/p/[slug]` (portofolio, layanan, bio) |
| `booking_requests` | Pengajuan dari link booking |

### Profil publik & portofolio

Owner mengunggah **Portofolio** dari **Menu → Portofolio** (`/studio/portofolio`): foto/video, judul, kategori, deskripsi, tahun, tampil/sembunyi. Setelah disimpan, profil publik ter-publish otomatis.

Klien melihat portofolio Owner yang sudah diunggah di:

- `Klien → Cari Vendor` → bagian **Vendor di Key Assistant** (bukan hanya direktori contoh)
- Profil publik: `/p/[slug]` (contoh `/p/laras`)
- `Klien → Pilihan Saya` — bandingkan portofolio, rating, harga mulai, lokasi, status

Setelah menambah kolom portofolio, jalankan ulang bagian ALTER di `supabase/schema.sql` (aman diulang).

Setelah skema aktif, login email/Google non-demo menyimpan data ke cloud (bukan hanya `localStorage`).

### Auth URL (wajib agar Google / konfirmasi email jalan di Vercel)

Di Supabase → Authentication → URL Configuration:

- Site URL: `https://key-asisten.vercel.app`
- Redirect URLs (tambahkan semua):
  - `https://key-asisten.vercel.app/masuk`
  - `https://key-asisten.vercel.app/daftar`
  - `http://127.0.0.1:43123/masuk`
  - `http://127.0.0.1:43123/daftar`

Google provider: Authentication → Providers → Google → Enable (Client ID + Secret dari Google Cloud).

### Deploy Vercel

1. Create repo GitHub dari chat Cursor (proyek ini masih Origin sementara).
2. Import repo di Vercel.
3. Set env Production/Preview: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sama seperti lokal).
4. Deploy branch `main`.
5. Pastikan Redirect URLs di atas sudah diisi.

## Yang bisa dicoba

- Studio demo di `/studio` (setelah masuk): laba, DP, bentrok jadwal, dan gaun yang telat kembali.
- Booking baru di `/studio/jadwal/baru`. Tombol **Isi contoh chat** membaca nama, tanggal, jam, lokasi, paket, dan nomor.
- Invoice di `/studio/invoice`: catat DP, tandai lunas, atau buka WhatsApp dengan pesan invoice.
- Gaun di `/studio/gaun`.
- Pricelist publik di `/p/laras`. Pengajuan tanggal dan kombo masuk ke jadwal studio sebagai Belum Bayar DP.
- Partner di `/studio/partner`. Saring Make Up Artist, Hijab & Hair, Decsets, Attire, Photografer & Videografer, atau Content Creator di kota aktif, ajak kerja sama, lalu susun kombo.
- Inbox di `/studio/inbox`. Chat partner sesuai lokasi aktif (contoh: pilih Surabaya untuk melihat partner Surabaya saja).
- Menu di `/studio/menu`. Pintasan ke jadwal, partner, invoice, aset, lokasi, dan identitas studio.
- Operasional juga punya **Profil bisnis** (`/studio/profil`, seperti langkah 4) dan **Layanan & harga** (`/studio/layanan`, seperti langkah 5) supaya owner bisa menambah/mengubah layanan tanpa mengulang biodata penuh.

Data demo / cache tetap di browser (`localStorage`). Akun email nyata menyimpan salinan ke Supabase (`owner_data`) supaya login di perangkat lain memulihkan data. Tombol **Data contoh** hanya menampilkan sampel Key Partner; tidak menimpa data cloud.

Jangan menaruh service role key di aplikasi ini.
