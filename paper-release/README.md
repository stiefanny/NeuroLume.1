# NeuroLume — Cloudflare, model terbaru sesuai paper

Paket ini menyiapkan website terbaru untuk Cloudflare Pages/Functions. Frontend
dipertahankan dari `NeuroLume_Terbaru_Sesuai_Paper(1).zip`. Inferensi Python
diekspor menjadi evaluasi pohon di Cloudflare Worker agar hosting tidak
memerlukan server Python terpisah. Tidak ada pelatihan, penyetelan, perubahan
koefisien, atau transformasi logit tambahan.

**Status paket:** siap deploy; belum dinyatakan online sebelum akun hosting
memublikasikannya dan endpoint deployment diverifikasi.

## Model yang harus muncul

- ID: `neurolume-nosmote-paper-e77f77c5-v2.0.0`
- Runtime deployment: `cloudflare-paper-v1`
- SHA-256 artefak Python asal:
  `754e330ae1de6eda5e1984e2b1551ec16a7306105eab610597bb692a7399b51e`
- Meta-learner menerima tiga probabilitas langsung, tanpa logit.
- Clinical: `0.4366863203725091`; precision guard: `0.572269702977344`.
- Standar: `0.5`; F2 OOF: `0.4923120083493016`.
- Keputusan menggunakan `score >= threshold`.

## Cara tercepat pada Windows: perbarui proyek Cloudflare yang sudah ada

1. Ekstrak seluruh ZIP ke satu folder. Jangan hanya menyalin index.html.
2. Pastikan Node.js LTS versi 22 atau lebih baru terpasang. Sumber resmi:
   https://nodejs.org/en/download
3. Klik dua kali `DEPLOY_WINDOWS.cmd` atau buka terminal pada folder ini:

   ```powershell
   npm.cmd run build
   npm.cmd test
   npx.cmd --yes wrangler@4.151.0 login
   npx.cmd --yes wrangler@4.151.0 pages deploy public --project-name neurolume-1
   ```

4. Masuk ke akun Cloudflare pemilik proyek `neurolume-1` saat browser dibuka.
   Jika akun memiliki beberapa proyek, pastikan nama proyek benar sebelum deploy.
   Tidak perlu memberi password atau token kepada orang lain.
5. Baca URL dan jenis deployment dari keluaran Wrangler. Pastikan deployment
   ditujukan ke Production jika tujuannya mengganti website utama. Jika hasilnya
   Preview, lihat Production branch proyek di dashboard dan ulangi dengan
   `--branch NAMA_BRANCH_PRODUKSI` yang benar. Jangan menebak nama branch.
6. Verifikasi endpoint dan form menggunakan panduan di bawah.

Perintah ini hanya mengganti aset/deployment proyek. Berkas repositori GitHub
tidak ikut diperbarui. Jika proyek memiliki Git integration, deployment GitHub
berikutnya dapat menimpa versi manual. Sinkronkan sumber paket ini ke repositori
sebelum melanjutkan perubahan melalui GitHub.

## Jika menggunakan repositori GitHub yang terhubung Cloudflare

Unggah isi folder ini ke root repositori yang digunakan proyek. Jangan mengubah
visibilitas repositori. Pada pengaturan build Cloudflare gunakan:

| Pengaturan | Nilai |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `public` |
| Root directory | Root repositori yang memuat package.json ini |
| Node | 22 atau lebih baru |

`public/_worker.js` harus ikut dihasilkan. Worker tersebut menyediakan API dan
inferensi; upload index.html/CSS saja akan membuat form tidak dapat menghitung.
Jangan menggabungkan file aplikasi Next.js lama ke sumber baru secara acak.
Pastikan konfigurasi build lama sudah diganti sebelum memicu deployment Git.

## Pemeriksaan sesudah deploy

Ganti `URL_DEPLOYMENT` dengan URL nyata yang dikembalikan Cloudflare.

1. Buka `URL_DEPLOYMENT/api/health`: harus menampilkan `ready: true`, ID model
   di atas, dan `runtime: cloudflare-paper-v1`.
2. Buka `URL_DEPLOYMENT/api/model`: empat threshold dan hasil holdout harus
   cocok dengan paper. Ini hanya statistik agregat, bukan data per observasi.
3. Buka halaman utama, lengkapi formulir, centang persetujuan, dan periksa hasil.
4. Mode Penelitian harus menampilkan tabel dan empat skenario. Mengganti
   skenario mengubah keputusan, bukan skor dan kategori komunikasi.
5. Periksa BMI kosong, gejala mendadak, pergantian mode, dan tombol bersihkan.
6. Lakukan hard refresh jika browser masih menampilkan tampilan lama.

## Pengujian yang sudah dilakukan

- Inferensi Python asli diperiksa terhadap 1.022 skor holdout tersimpan;
  selisih maksimum `1.1102230246251565e-16`.
- Port Cloudflare diuji pada semua 1.022 observasi holdout: selisih skor
  maksimum `2.9737207696278745e-9`, di bawah toleransi `1e-8`.
- 180 profil tambahan dengan nilai kontinu dan sebagian BMI kosong: selisih
  maksimum `3.3306690738754696e-16`.
- Keputusan empat threshold dan kategori komunikasi cocok pada seluruh kasus
  uji. Confusion matrix holdout setiap skenario sama dengan paper.
- Sepuluh pengujian Node untuk API, BMI, validasi, gejala, batas kategori,
  same-origin, batas ukuran, metadata, dan Worker hasil build: PASS.
- Wrangler 4.151.0 berhasil mengompilasi Worker. Server preview lokal tidak
  dapat berjalan pada lingkungan persiapan karena kegagalan sistem
  `uv_interface_addresses`; pengujian browser live masih perlu dilakukan
  setelah deployment. Jangan menyebutnya sudah diuji online.

Lihat `docs/cloudflare_verification.json`. Port numerik tidak diklaim identik
bit demi bit untuk setiap kemungkinan masukan. Inferensi tidak dilatih ulang.
Data holdout per observasi dan fixture pengujian batch sengaja tidak disertakan
di folder publik atau ZIP deployment. Untuk mereproduksi pengujian batch,
jalankan `scripts/export_model.py --source PATH_PAKET_PYTHON_ASLI` memakai
lingkungan requirements.txt paket Python asal, lalu `npm run verify:model`.

## Cakupan dan data

Paket terbaru ini menyediakan analisis dan informasi penelitian. Tidak ada
database, penyimpanan masukan, dashboard admin, atau login peneliti. Fitur admin
dan Supabase pada paket Cloudflare lama tidak ditambahkan ke paket terbaru ini.
Form mengirim masukan melalui POST ke Worker pada domain yang sama. Kode tidak
mencatat isi masukan; pencatatan platform hosting mengikuti pengaturan akun.
Jangan mengunggah data pasien nyata atau menambah penyimpanan tanpa rancangan
yang telah disetujui untuk penelitian.

Indeks adalah 100 kali skor klasifikasi status stroke tercatat, bukan persentase
risiko stroke prospektif atau diagnosis. Kategori merupakan komunikasi penelitian.
Sorotan berupa ringkasan masukan, bukan SHAP individual. Gejala mendadak
menghentikan analisis. Validasi independen belum tersedia.

## Referensi deployment

- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/pages/get-started/direct-upload/

## Isi utama

- `public/`: hanya berkas produksi yang diunggah ke Cloudflare.
- `src/`: model ekspor, evaluasi pohon, dan API untuk pemeliharaan.
- `scripts/build.mjs`: menghasilkan Worker dari sumber, tanpa dependensi npm.
- `tests/api.test.mjs`: pengujian API menggunakan satu profil referensi publik.
- `docs/cloudflare_verification.json`: hasil pemeriksaan numerik dan confusion matrix.
- `DEPLOY_WINDOWS.cmd`: langkah deployment Windows dengan login milik pengguna.

Paket berisi model terlatih dalam representasi pohon. Pertahankan lisensi dan
atribusi sumber dataset serta kebijakan repositori saat membagikan kode.
