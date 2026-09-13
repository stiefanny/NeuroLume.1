# NeuroLume untuk Cloudflare Pages

Paket ini adalah versi gratis NeuroLume yang siap dibangun di Cloudflare Pages.

## Isi paket

* Halaman analisis awal untuk masyarakat
* Model final NoSMOTE stacking yang berjalan langsung di browser
* Skor indeks model, tiga kategori komunikasi, faktor yang perlu dibahas, dan tips
* Pemeriksaan gejala darurat sebelum analisis model
* Artikel edukasi yang dimuat melalui API internal
* Login password untuk halaman penelitian dan admin
* Penyimpanan jawaban yang tetap nonaktif sebelum persetujuan etik

Model portabel berasal dari berkas model penelitian yang sama. Proses ekspor tidak melatih ulang model dan tidak mengubah parameter maupun cutoff.

## Pemeriksaan sebelum deploy

```bash
corepack enable
pnpm install
pnpm verify:model
pnpm lint
pnpm build
```

Build statis berada di folder `out`. Cloudflare Pages Functions berada di folder `functions`.

## Pengaturan Cloudflare Pages

| Pengaturan | Nilai |
|---|---|
| Framework preset | Next.js Static HTML Export |
| Production branch | main |
| Build command | pnpm build |
| Build output directory | out |
| Root directory | kosongkan jika proyek berada di akar repository |

Tambahkan dua secret pada Settings, Variables and Secrets:

| Nama | Isi |
|---|---|
| `RESEARCH_PASSWORD` | Password privat minimal 8 karakter |
| `SESSION_SECRET` | Teks acak minimal 32 karakter |

Jangan menaruh secret asli di GitHub. Lihat panduan lengkap pada `CLOUDFLARE_DEPLOYMENT.md`.

## Cara kerja

Analisis model berlangsung di perangkat pengunjung. Jawaban tidak dikirim ke API dan tidak disimpan. Pages Functions hanya menangani artikel edukasi, login, logout, perlindungan halaman penelitian, dan pemeriksaan kesehatan layanan.

Skor NeuroLume adalah indeks keluaran model penelitian. Skor tersebut bukan probabilitas klinis, diagnosis, atau pengganti pemeriksaan tenaga kesehatan. Cutoff tiga kategori dipilih dari data development OOF dan belum tervalidasi klinis.

## Audit model

`scripts/export_cloudflare_model.py` mengubah model Python terpercaya menjadi JSON portabel. `scripts/verify-portable-model.mjs` membandingkan hasil JavaScript dengan 160 hasil referensi Python. Berkas pickle hanya disertakan untuk audit dan reproduksibilitas, bukan dijalankan di Cloudflare.
