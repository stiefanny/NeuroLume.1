# Panduan deploy NeuroLume gratis

Panduan ini memakai repository GitHub yang sama, yaitu `neurolume-stroke-risk`.

## A. Ganti isi repository lokal

1. Ekstrak ZIP baru ke folder sementara.
2. Buka folder repository lama yang memiliki folder tersembunyi `.git`.
3. Salin seluruh isi folder baru ke repository lama dan pilih replace jika Windows meminta konfirmasi.
4. Jangan menghapus folder `.git`.
5. Buka Git Bash dari folder repository lama.

Periksa lokasi dan perubahan:

```bash
pwd
git status
```

Kirim perubahan ke repository yang sama:

```bash
git add -A
git commit -m "Migrate NeuroLume to Cloudflare Pages"
git push origin main
```

Perintah yang benar adalah `git add -A` atau `git add .` dengan spasi. Jangan menulis `git add.`.

## B. Buat Cloudflare Pages

1. Masuk ke Cloudflare Dashboard.
2. Pilih Workers and Pages.
3. Pilih Create application.
4. Pilih tab Pages.
5. Pilih Import an existing Git repository.
6. Hubungkan GitHub jika diminta.
7. Pilih repository `neurolume-stroke-risk`.
8. Isi nama proyek `neurolume` jika masih tersedia. Alamat gratisnya akan menjadi `neurolume.pages.dev`.
9. Pilih framework `Next.js Static HTML Export`.
10. Isi Production branch dengan `main`.
11. Isi Build command dengan `pnpm build`.
12. Isi Build output directory dengan `out`.
13. Kosongkan Root directory jika `package.json` terlihat langsung pada halaman utama repository.

## C. Tambahkan password privat

Sebelum deploy, buka Settings lalu Variables and Secrets. Tambahkan pada Production dan Preview:

* `RESEARCH_PASSWORD`, isi dengan password kuat minimal 8 karakter
* `SESSION_SECRET`, isi dengan teks acak minimal 32 karakter

Untuk membuat secret acak di PowerShell:

```powershell
$neurolumeBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($neurolumeBytes)
[Convert]::ToBase64String($neurolumeBytes)
```

Salin hasil baris terakhir sebagai `SESSION_SECRET`. Jangan unggah password atau secret ke GitHub.

## D. Deploy dan cek

1. Pilih Save and Deploy.
2. Tunggu sampai status menjadi Success.
3. Buka alamat `*.pages.dev` yang diberikan Cloudflare.
4. Isi seluruh formulir masyarakat dan pastikan skor, kategori, faktor, dan tips muncul.
5. Buka halaman Edukasi dan tekan artikel.
6. Buka Area penelitian. Pastikan halaman meminta password.
7. Setelah masuk, pastikan halaman penelitian dapat dibuka dan tombol Keluar bekerja.
8. Buka `/api/health`. Hasilnya harus memiliki `"ok": true`.

Jika nama `neurolume` sudah dipakai, pilih nama pendek seperti `neurolume-stroke`. Nama akun pribadi tidak perlu dimasukkan ke nama proyek.

## E. Memperbarui website

Setiap perubahan yang dikirim ke branch `main` akan dibangun dan dipublikasikan ulang secara otomatis:

```bash
git add -A
git commit -m "Update NeuroLume"
git push origin main
```

## Batas penggunaan

NeuroLume adalah prototipe penelitian dan edukasi. Model belum menjalani validasi klinis atau eksternal. Gejala stroke yang muncul mendadak harus langsung diarahkan ke layanan darurat atau IGD tanpa menunggu skor website.
