# NeuroLume — Stroke Risk & Research

NeuroLume adalah prototipe website edukasi dan penelitian untuk membantu masyarakat mengenali pola faktor risiko stroke berdasarkan model machine learning tabular.

Website ini dirancang sebagai media translasi hasil penelitian ke bentuk yang lebih mudah dipahami masyarakat, bukan sebagai alat diagnosis, alat triase, atau pengganti pemeriksaan dokter.

Demo website:

```text
https://neurolume-1.pages.dev
```

Status proyek: prototipe penelitian yang sudah dapat dideploy ke Cloudflare Pages.

---

## 1. Ringkasan Proyek

Penelitian NeuroLume berfokus pada:

> Optimasi dan interpretasi prediksi risiko stroke menggunakan stacking ensemble learning dan SHAP pada data kesehatan yang tidak seimbang.

Masalah utama yang diangkat adalah ketidakseimbangan kelas pada data stroke. Jumlah individu tanpa label stroke jauh lebih banyak dibandingkan individu dengan label stroke.

Kondisi ini membuat accuracy saja tidak cukup untuk menilai kualitas model. Model perlu dianalisis menggunakan:

- accuracy;
- precision;
- recall atau sensitivity;
- specificity;
- balanced accuracy;
- F1;
- F2;
- ROC-AUC;
- PR-AUC;
- false positive;
- false negative;
- calibration;
- decision-curve analysis;
- subgroup analysis;
- stabilitas hasil.

NeuroLume menerjemahkan model penelitian ke dalam tiga lapisan:

1. Lapisan penelitian: pelatihan, validasi, threshold optimization, evaluasi, dan interpretasi model.
2. Lapisan aplikasi: formulir masyarakat, skor indeks, kategori komunikasi, faktor yang perlu dibahas, tips kesehatan, dan edukasi.
3. Lapisan keamanan dan operasional: halaman penelitian privat, secret Cloudflare, API artikel internal, serta kebijakan tanpa penyimpanan data sebelum persetujuan etik.

---

## 2. Tujuan NeuroLume

### Tujuan Penelitian

- Membandingkan performa XGBoost, LightGBM, CatBoost, stacking, dan Random Forest.
- Mengevaluasi strategi penanganan ketidakseimbangan kelas.
- Membandingkan NoSMOTE dengan SMOTENC secara metodologis dan berdampingan.
- Menilai apakah stacking memberikan trade-off yang lebih baik pada data stroke tidak seimbang.
- Menggunakan SHAP untuk membantu menjelaskan kontribusi model dan fitur klinis.
- Menghasilkan artefak model yang dapat diaudit dan digunakan oleh prototipe website.
- Menguji konsistensi antara model Python dan model portabel JavaScript.

### Tujuan Website

- Membantu masyarakat memahami faktor risiko stroke secara lebih terstruktur.
- Menampilkan keluaran model sebagai indeks penelitian, bukan probabilitas klinis.
- Mengarahkan pengguna untuk membahas faktor risiko dengan tenaga kesehatan.
- Menyediakan edukasi stroke yang ringkas, ramah, dan berbasis sumber tepercaya.
- Menyediakan area penelitian yang tidak dapat diakses publik tanpa password.
- Menunjukkan penerapan nyata hasil penelitian machine learning dalam bentuk prototipe.

---

## 3. Pengguna dan Mode Website

NeuroLume memiliki dua mode utama.

### 3.1 Mode Masyarakat

Mode ini dapat digunakan tanpa akun dan tanpa login.

Pengguna mengisi data faktor risiko yang tersedia, kemudian menerima:

- skor indeks model 0–100;
- kategori komunikasi;
- faktor input yang perlu dibahas;
- tips kesehatan yang relevan;
- penjelasan bahwa hasil bukan diagnosis;
- arahan darurat bila terdapat gejala stroke yang muncul mendadak;
- artikel edukasi.

Website tidak meminta:

- nama;
- NIK;
- alamat;
- nomor telepon;
- identitas langsung lainnya.

Pada konfigurasi saat ini, jawaban pengguna:

- tidak dikirim ke API model;
- tidak disimpan ke database;
- tidak digunakan untuk melatih ulang model;
- tidak digunakan untuk memilih cutoff baru.

### 3.2 Mode Penelitian

Mode penelitian bersifat privat. Aksesnya melalui halaman login dan password yang disimpan sebagai Cloudflare Secret.

Mode ini dapat memuat:

- ringkasan model dan eksperimen;
- perbandingan NoSMOTE dan SMOTENC;
- metrik penelitian;
- visualisasi;
- ringkasan validasi;
- informasi audit model;
- keterbatasan penelitian.

Mode penelitian tidak ditampilkan sebagai halaman publik utama dan tidak ditujukan untuk masyarakat umum.

---

## 4. Peringatan Medis dan Batas Penggunaan

NeuroLume bukan alat diagnosis stroke.

Jika pengguna mengalami gejala yang muncul mendadak, seperti:

- wajah mencong;
- kelemahan atau mati rasa pada satu sisi tubuh;
- bicara pelo atau sulit dipahami;
- gangguan penglihatan mendadak;
- gangguan keseimbangan mendadak;
- kebingungan mendadak;
- sakit kepala hebat yang muncul tiba-tiba;

maka pengguna diarahkan untuk segera mencari pertolongan darurat.

Pengguna tidak boleh menunggu skor website.

Gejala darurat tidak digunakan sebagai fitur prediksi model. Gejala tersebut hanya berfungsi sebagai pemeriksaan keselamatan sebelum analisis model.

### Klaim yang Diperbolehkan

- indikasi model penelitian;
- pola faktor risiko;
- bahan diskusi dengan tenaga kesehatan;
- prototipe edukasi dan penelitian;
- indeks keluaran model.

### Klaim yang Tidak Diperbolehkan

- diagnosis stroke;
- persentase pasti seseorang terkena stroke;
- jaminan seseorang aman dari stroke;
- pengganti dokter atau pemeriksaan klinis;
- alat klinis tervalidasi;
- keputusan pengobatan otomatis.

---

## 5. Input Model

Website menyediakan formulir yang mengikuti fitur model final.

Fitur yang digunakan dapat mencakup:

- usia;
- jenis kelamin;
- hipertensi;
- penyakit jantung;
- status pernah menikah;
- jenis pekerjaan;
- tipe tempat tinggal;
- kadar glukosa rata-rata;
- BMI;
- status merokok.

Untuk jenis pekerjaan, tersedia pilihan lain atau kategori tambahan agar pengguna tidak dipaksa memilih kategori yang tidak sesuai.

Data kosong tidak boleh otomatis dianggap sebagai kondisi normal. Jika suatu data tidak diketahui, website membedakannya dari nilai normal sesuai kebijakan model.

Glukosa dan BMI sebaiknya diperoleh dari pemeriksaan atau catatan kesehatan yang benar. Pengguna tidak dianjurkan mengarang angka.

---

## 6. Arsitektur Model Penelitian

Model utama NeuroLume menggunakan stacking ensemble learning.

```text
Data input
    ↓
Preprocessing sesuai pipeline penelitian
    ↓
XGBoost ───────────────┐
LightGBM ──────────────┼──→ Probabilitas OOF
CatBoost ──────────────┘
    ↓
Logistic Regression sebagai meta-learner
    ↓
Skor model dan threshold komunikasi
    ↓
Kategori dan rekomendasi edukatif
```

### Base Learner

- XGBoost;
- LightGBM;
- CatBoost.

### Meta-Learner

- Logistic Regression;
- transformasi probabilitas meta menggunakan logit sesuai konfigurasi bundle model;
- penalty dan nilai `C` disimpan dalam spesifikasi artefak model.

### Model Pembanding

Random Forest digunakan sebagai pembanding eksternal terhadap base learner dan stacking.

---

## 7. NoSMOTE dan Posisi Model Final

Website menggunakan artefak varian ACC/NoSMOTE yang telah diekspor dari hasil penelitian.

NoSMOTE berarti pipeline model tidak melakukan oversampling SMOTE atau SMOTENC.

Penanganan ketidakseimbangan mengikuti konfigurasi NoSMOTE yang telah dikunci pada notebook penelitian, termasuk pembobotan kelas apabila memang tercantum pada konfigurasi base learner.

Hal yang perlu dibedakan:

- NoSMOTE bukan berarti tidak ada strategi imbalance sama sekali.
- NoSMOTE berarti tidak membuat sampel sintetis melalui SMOTE atau SMOTENC.
- SMOTENC merupakan eksperimen pembanding yang dipertahankan untuk analisis penelitian.
- Website menggunakan model final yang sudah dilatih, bukan melatih model baru ketika pengguna mengisi formulir.

Kesimpulan penelitian tidak boleh menyatakan bahwa SMOTENC selalu buruk.

Kesimpulan yang lebih tepat adalah:

> Pada dataset dan konfigurasi penelitian ini, NoSMOTE memberikan trade-off yang lebih seimbang dibandingkan SMOTENC pada metrik tertentu.

---

## 8. Preprocessing dan Pencegahan Data Leakage

Pipeline penelitian menggunakan preprocessing yang dipelajari dari data training.

Komponen preprocessing dapat mencakup:

- imputasi numerik dengan median;
- imputasi kategorikal dengan modus;
- standardisasi fitur numerik;
- one-hot encoding fitur kategorikal;
- penanganan kategori yang tidak dikenal secara aman.

Untuk menjaga validitas:

- split dilakukan sebelum evaluasi holdout;
- informasi dari data test tidak digunakan untuk memilih preprocessing;
- threshold dipilih dari development atau OOF, bukan dari data test;
- SMOTENC, jika digunakan pada eksperimen pembanding, hanya diterapkan pada training fold;
- validation fold dan holdout tidak di-SMOTE;
- meta-learner dilatih menggunakan prediksi OOF;
- prediksi OOF tidak berasal dari model yang dilatih pada baris yang sama;
- data masa depan tidak digunakan sebagai fitur;
- label target tidak digunakan sebagai fitur;
- proses preprocessing dilakukan secara fold-local.

Website tidak melakukan proses training dan tidak memilih cutoff baru berdasarkan jawaban pengunjung.

---

## 9. Threshold dan Tiga Kategori Komunikasi

Website menampilkan tiga kategori komunikasi:

1. Pantau dan Jaga Kesehatan.
2. Perlu Perhatian.
3. Disarankan Konsultasi.

Cutoff dipilih dari data development atau whole-stack OOF sesuai prosedur penelitian.

Cutoff tersebut berfungsi sebagai batas komunikasi aplikasi, bukan batas risiko klinis.

Skor ditampilkan sebagai:

```text
100 × probabilitas keluaran model
```

Namun skor tersebut bukan probabilitas klinis.

Nilai 70 tidak boleh dibaca sebagai:

```text
70% pasti terkena stroke
```

Threshold juga tidak boleh dipilih ulang dari jawaban pengguna atau holdout.

Jika cutoff belum divalidasi secara klinis, website harus menyatakannya secara eksplisit.

---

## 10. Evaluasi Penelitian

Evaluasi model penelitian mencakup:

- accuracy;
- precision;
- recall atau sensitivity;
- specificity;
- balanced accuracy;
- F1;
- F2;
- ROC-AUC;
- PR-AUC atau average precision;
- confusion matrix;
- false positive;
- false negative;
- calibration plot;
- decision-curve analysis;
- subgroup analysis;
- repeated stratified cross-validation;
- bootstrap comparison;
- stabilitas mean ± SD;
- SHAP level 1;
- SHAP level 2.

Metrik tidak boleh dibaca secara terpisah.

Recall yang lebih tinggi dapat disertai lebih banyak false positive.

Precision yang rendah dapat terjadi pada dataset dengan prevalensi positif yang rendah.

Karena itu, pemilihan model harus mempertimbangkan:

- tujuan screening;
- stabilitas;
- PR-AUC;
- F2;
- calibration;
- false positive;
- false negative;
- interpretabilitas;
- batasan dataset.

---

## 11. Interpretabilitas SHAP

Penelitian menggunakan dua perspektif interpretasi.

### SHAP Level 1

Menjelaskan kontribusi prediksi:

- XGBoost;
- LightGBM;
- CatBoost;

terhadap meta-learner stacking.

### SHAP Level 2

Menjelaskan pengaruh fitur klinis mentah seperti:

- usia;
- glukosa;
- BMI;
- hipertensi;
- penyakit jantung;
- status merokok.

SHAP menjelaskan perilaku model dan hubungan prediktif dalam data.

SHAP tidak membuktikan hubungan sebab-akibat medis.

Contoh penjelasan yang aman:

> Fitur ini memberikan kontribusi besar terhadap prediksi model pada data penelitian.

Bukan:

> Fitur ini pasti menyebabkan stroke pada seseorang.

---

## 12. Arsitektur Teknis Website

### Frontend

- Next.js;
- React;
- TypeScript;
- halaman static export;
- komponen antarmuka responsif;
- model portabel untuk inference di browser.

### Hosting

- Cloudflare Pages;
- HTTPS otomatis dari Cloudflare;
- deployment terhubung ke branch GitHub `main`;
- build otomatis setiap ada perubahan pada repository;
- alamat gratis dengan subdomain `pages.dev`.

### Pages Functions

Folder `functions/` digunakan untuk fungsi server-side yang ringan, seperti:

- API artikel edukasi internal;
- pemeriksaan status layanan;
- login area penelitian;
- logout;
- pemeriksaan session;
- perlindungan halaman penelitian.

Model utama tidak memerlukan API inference terpisah.

Prediksi dilakukan di perangkat pengunjung menggunakan model portabel.

### Database

Database belum diaktifkan.

Jawaban pengguna tidak disimpan sebelum persetujuan etik dan kebijakan privasi tersedia.

---

## 13. Privasi dan Keamanan

NeuroLume menerapkan prinsip minimalisasi data:

- tidak meminta identitas langsung;
- tidak menyimpan jawaban pengguna pada konfigurasi saat ini;
- tidak mengirim jawaban ke API model;
- tidak mengaktifkan database sebelum persetujuan etik;
- mode penelitian dilindungi password;
- password dan session secret tidak dimasukkan ke GitHub;
- secret disimpan melalui Cloudflare Variables and Secrets;
- file `.env`, `.dev.vars`, dan secret lokal tidak boleh di-commit;
- website tidak digunakan sebagai sistem rekam medis;
- website tidak digunakan untuk mengambil keputusan terapi.

Catatan penting:

Karena model berjalan di browser, artefak model portabel dapat dianalisis oleh pengguna teknis.

Mekanisme ini cocok untuk:

- prototipe penelitian;
- demonstrasi;
- transparansi;
- pengujian parity model.

Mekanisme ini bukan cara untuk menyembunyikan model secara absolut.

---

## 14. Struktur Folder Utama

Struktur dapat berbeda sedikit sesuai versi repository, tetapi komponen utamanya adalah:

```text
NeuroLume-Cloudflare-Free/
├── app/
│   ├── admin/
│   ├── education/
│   ├── login/
│   ├── research/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── functions/
├── hooks/
├── lib/
├── model/
│   ├── neurolume_acc_model.pkl
│   ├── neuro..._inference.py
│   └── three_level_cutoffs.json
├── public/
│   └── model/
├── scripts/
│   ├── export_cloudflare_model.py
│   └── verify-portable-model.mjs
├── tests/
├── package.json
├── pnpm-lock.yaml
├── next.config.*
├── wrangler.toml
├── CLOUDFLARE_DEPLOYMENT.md
└── README.md
```

---

## 15. Perbedaan File Penelitian dan File Deployment

### Notebook Penelitian

Notebook digunakan untuk:

- audit dataset;
- EDA;
- preprocessing;
- training;
- hyperparameter search;
- OOF stacking;
- threshold optimization;
- repeated validation;
- bootstrap;
- calibration;
- decision-curve analysis;
- SHAP;
- perbandingan NoSMOTE dan SMOTENC.

### File Deployment

File deployment digunakan untuk:

- memuat artefak model final;
- memproses input pengguna;
- menjalankan inference;
- mengubah keluaran menjadi skor;
- menerapkan cutoff komunikasi;
- menampilkan faktor dan tips.

Website tidak perlu membawa seluruh kode training karena training sudah selesai sebelum deployment.

Parameter model tersimpan dalam artefak model dan file model portabel.

---

## 16. Ekspor dan Audit Model

### Ekspor Model

File:

```text
scripts/export_cloudflare_model.py
```

Script ini mengubah model Python terpercaya menjadi artefak portabel yang dapat digunakan oleh frontend.

Proses ekspor:

- tidak melatih ulang model;
- tidak mengubah parameter model;
- tidak memilih ulang cutoff;
- tidak menggunakan data pengguna website;
- tidak mengubah hasil penelitian.

### Verifikasi Model Portabel

File:

```text
scripts/verify-portable-model.mjs
```

Script ini membandingkan keluaran model JavaScript dengan hasil referensi Python pada sejumlah kasus uji.

Tujuannya adalah memastikan implementasi browser tetap konsisten dengan model sumber.

### Artefak Pickle

File:

```text
model/neurolume_acc_model.pkl
```

File pickle digunakan untuk:

- audit;
- reproduksibilitas;
- pemeriksaan struktur model;
- penyimpanan bundle model Python.

File ini bukan file teks dan tidak boleh diedit manual.

Website Cloudflare menggunakan model portabel untuk inference, bukan menjalankan pickle secara langsung di browser.

### Informasi Audit Bundle

Bundle model dapat menyimpan:

- base learner;
- meta-learner;
- threshold;
- daftar fitur;
- kandidat model;
- versi library;
- protokol ekspor;
- status validasi klinis;
- hash dataset.

Contoh pemeriksaan lokal:

```powershell
python -c "import cloudpickle; from pathlib import Path; b=cloudpickle.load(Path('model/neurolume_acc_model.pkl').open('rb')); print('MODEL KEYS:',b['model'].keys()); print('META TYPE:',type(b['model']['meta']).__name__); print('VERSIONS:',b['versions']); print('PROTOCOL:',b['protocol']); print('DATASET SHA256:',b['dataset_sha256'])"
```

---

## 17. Instalasi Lokal

### Persyaratan

- Node.js;
- Corepack;
- pnpm;
- Git;
- Python hanya diperlukan untuk audit atau ekspor model.

### Instalasi Dependency

```bash
corepack enable
pnpm install
```

### Verifikasi Model Portabel

```bash
pnpm verify:model
```

### Menjalankan Lint

```bash
pnpm lint
```

### Build Production

```bash
pnpm build
```

### Menjalankan Mode Pengembangan

```bash
pnpm dev
```

Setelah menjalankan `pnpm dev`, website dapat diakses melalui alamat lokal yang ditampilkan di terminal, biasanya:

```text
http://localhost:3000
```

Hasil build static akan berada di folder:

```text
out/
```

---

## 18. Deployment ke GitHub Menggunakan Git

### Clone Repository

Jika repository belum ada di komputer:

```bash
git clone https://github.com/stiefanny/NeuroLume.1.git
cd NeuroLume.1
```

### Memeriksa Status Repository

```bash
git status
```

### Menambahkan Perubahan

```bash
git add .
```

### Membuat Commit

```bash
git commit -m "Update NeuroLume documentation and deployment"
```

### Push ke GitHub

```bash
git push origin main
```

Setelah push berhasil, perubahan akan tersedia di branch:

```text
main
```

Pastikan file `README.md` berada di folder utama repository, bukan di dalam folder bersarang seperti:

```text
NeuroLume-Cloudflare-Free/NeuroLume-Cloudflare-Free/README.md
```

Jika repository sudah terhubung dengan Cloudflare Pages, push ke branch `main` akan memicu deployment otomatis.

---

## 19. Deployment Cloudflare Pages

### Alur Deployment

Pada Cloudflare Dashboard, gunakan alur:

```text
Workers & Pages
→ Create application
→ Pages
→ Connect to Git
→ GitHub
→ stiefanny/NeuroLume.1
→ Begin setup
```

Jangan memilih alur Worker biasa jika project digunakan sebagai Cloudflare Pages.

### Pengaturan Build

| Pengaturan | Nilai |
|---|---|
| Framework preset | Next.js Static HTML Export |
| Production branch | `main` |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Root directory | Kosong jika project berada di akar repository |

### Secret Production

Tambahkan pada:

```text
Settings → Variables and Secrets → Production
```

Secret yang diperlukan:

| Nama | Keterangan |
|---|---|
| `RESEARCH_PASSWORD` | Password privat area penelitian |
| `SESSION_SECRET` | String acak panjang untuk session |

`RESEARCH_PASSWORD` sebaiknya memiliki minimal 8 karakter.

`SESSION_SECRET` sebaiknya berupa string acak minimal 32 karakter.

Jangan menulis nilai secret di:

- README;
- source code;
- GitHub;
- screenshot publik;
- file `.env` yang di-commit.

### Setelah Mengubah Secret

Setelah menambah atau mengubah secret:

```text
Deployments
→ pilih deployment terbaru
→ Details
→ Manage deployment
→ Retry deployment
```

Redeploy diperlukan agar Pages Functions menerima konfigurasi secret terbaru.

### URL Website

Setelah deployment berhasil, Cloudflare memberikan URL seperti:

```text
https://neurolume-1.pages.dev
```

URL deployment individual dapat terlihat seperti:

```text
https://random-id.neurolume-1.pages.dev
```

Untuk penggunaan umum, gunakan URL project utama:

```text
https://neurolume-1.pages.dev
```

---

## 20. Alur Demo untuk Dosen Pembimbing

Urutan demonstrasi yang disarankan:

1. Buka halaman utama NeuroLume.
2. Tunjukkan nama dan tujuan website.
3. Tunjukkan disclaimer bahwa website bukan diagnosis.
4. Tunjukkan pemeriksaan gejala darurat.
5. Tunjukkan formulir faktor risiko.
6. Isi data contoh yang tidak mengandung identitas pribadi.
7. Tunjukkan skor indeks model.
8. Tunjukkan kategori komunikasi.
9. Tunjukkan faktor yang perlu dibahas.
10. Tunjukkan tips kesehatan.
11. Buka halaman Edukasi.
12. Tunjukkan bahwa Area penelitian tidak dibuka langsung untuk publik.
13. Masuk menggunakan password penelitian.
14. Tunjukkan ringkasan model dan status prototipe.
15. Jelaskan bahwa website tidak menyimpan data pengguna.
16. Jelaskan bahwa model berjalan di browser.
17. Jelaskan bahwa hasil website berasal dari model NoSMOTE yang sudah dilatih di Google Colab.

Hindari menggunakan data pasien nyata saat demonstrasi tanpa persetujuan etik.

Gunakan data contoh atau data sintetis untuk demonstrasi.

---

## 21. Kontribusi Ilmiah

Kontribusi NeuroLume bukan sekadar membuat website.

Kontribusinya berada pada integrasi beberapa komponen:

1. Evaluasi stacking pada data stroke yang tidak seimbang.
2. Perbandingan cost-sensitive NoSMOTE dan SMOTENC.
3. Threshold moving yang ditentukan dari development OOF.
4. Pelaporan metrik yang lebih sesuai untuk data imbalance daripada accuracy saja.
5. Analisis trade-off recall, precision, false positive, dan false negative.
6. Evaluasi stabilitas melalui repeated validation dan bootstrap.
7. Interpretasi model menggunakan SHAP pada level ensemble dan fitur klinis.
8. Ekspor model yang dapat diverifikasi dan dibandingkan antara Python dan JavaScript.
9. Translasi model menjadi prototipe edukasi masyarakat.
10. Pembatasan klaim medis secara eksplisit.
11. Penerapan prinsip privasi dengan menonaktifkan penyimpanan sebelum persetujuan etik.
12. Penyediaan artefak model yang dapat diaudit melalui versi library, protokol, dan dataset hash.

Novelty tidak boleh diklaim sebagai penemuan algoritma baru.

Novelty lebih tepat diletakkan pada:

- desain eksperimen;
- integrasi evaluasi;
- perbandingan strategi imbalance;
- interpretabilitas;
- audit artefak;
- validasi parity Python-JavaScript;
- translasi hasil penelitian ke prototipe yang bertanggung jawab.

---

## 22. Keterbatasan

Beberapa keterbatasan yang harus disebutkan secara jujur:

- dataset bersifat sekunder;
- jumlah kasus positif relatif terbatas;
- prevalensi kelas positif rendah;
- precision dapat rendah ketika recall diprioritaskan;
- belum ada validasi eksternal pada rumah sakit atau populasi lain;
- belum ada validasi prospektif;
- label dataset tidak otomatis sama dengan kejadian stroke baru di masa depan;
- cutoff komunikasi belum tervalidasi secara klinis;
- model belum boleh digunakan untuk diagnosis;
- model portabel di browser dapat dianalisis oleh pengguna teknis;
- website belum menyimpan data;
- database belum diaktifkan;
- dashboard populasi belum tersedia karena persetujuan etik belum tersedia;
- hasil dapat berubah jika versi model, dataset, preprocessing, atau threshold diganti;
- model belum dapat menggantikan penilaian dokter;
- belum ada validasi usability berskala besar;
- belum ada evaluasi fairness untuk seluruh subgroup populasi;
- belum ada monitoring model drift.

---

## 23. Rencana Pengembangan Berikutnya

Pengembangan lanjutan yang memerlukan persetujuan dan validasi tambahan dapat mencakup:

- validasi eksternal;
- validasi oleh dokter atau ahli epidemiologi;
- validasi prospektif;
- peninjauan cutoff oleh tenaga kesehatan;
- dokumentasi model card;
- kebijakan privasi;
- persetujuan pengguna;
- database dengan retensi terbatas;
- audit keamanan;
- analisis fairness;
- analisis subgroup yang lebih luas;
- monitoring drift;
- pengujian usability;
- pengujian aksesibilitas;
- evaluasi performa pada perangkat berbeda;
- proses governance sebelum penggunaan publik yang lebih luas.

---

## 24. Kesimpulan

NeuroLume adalah prototipe translasi penelitian yang menghubungkan model stacking NoSMOTE dengan antarmuka edukasi masyarakat.

Model utama terdiri dari:

- XGBoost;
- LightGBM;
- CatBoost;
- Logistic Regression sebagai meta-learner.

Website tidak melatih ulang model dan tidak memilih cutoff dari data pengguna.

Hasil yang ditampilkan harus dipahami sebagai indeks model dan bahan diskusi kesehatan.

Website:

- tidak menggantikan dokter;
- tidak menyatakan diagnosis;
- tidak memberikan probabilitas klinis;
- tidak digunakan untuk menentukan pengobatan;
- tidak boleh digunakan untuk menunda pertolongan darurat.

Nilai utama NeuroLume terletak pada kombinasi:

- metodologi machine learning yang dapat diaudit;
- evaluasi imbalance yang lebih lengkap;
- interpretabilitas SHAP;
- ekspor model yang dapat diverifikasi;
- validasi konsistensi model Python dan JavaScript;
- interface edukasi yang bertanggung jawab;
- pembatasan privasi;
- pembatasan klaim medis yang eksplisit.
