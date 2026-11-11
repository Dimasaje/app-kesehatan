# PRD — Rekam Keluarga (Buku Kesehatan Keluarga)

- **Repo:** https://github.com/Dimasaje/app-kesehatan
- **Folder proyek:** `D:\app\Kesehatan`
- **Mockup acuan:** https://claude.ai/artifact/TKQ7Gs67vzsGU8sxtWys9o
- **Platform:** HP saja (mobile-first, lebar acuan 390 px)

## 1. Ringkasan
Aplikasi untuk mencatat rekam medis dan riwayat kesehatan seluruh anggota keluarga dalam satu "buku" digital. **Semua data tersimpan di HP pengguna. Tidak ada server, database cloud, atau serverless.**

## 2. Tujuan
1. Satu tempat untuk data kesehatan semua anggota keluarga (profil, kunjungan, obat, vaksin, hasil lab).
2. Mudah dipakai saat di klinik: cari dan tunjukkan riwayat dalam hitungan detik.
3. Data aman dan tetap milik pengguna, termasuk saat HP hilang atau ganti.

## 3. Pengguna
Orang tua/kepala keluarga yang mengelola kesehatan keluarga (anak, pasangan, orang tua lanjut usia) dari satu HP.

## 4. Prinsip produk
- **Local-first:** tidak ada backend. Jangan menambah layanan eksternal tanpa persetujuan pemilik proyek.
- **Backup adalah fitur inti:** tanpa server, ekspor/impor satu-satunya pengaman data.
- **Privasi:** data tidak pernah keluar dari perangkat kecuali pengguna mengekspornya sendiri.
- **Bahasa Indonesia** untuk semua teks antarmuka.

## 5. Teknologi (arahan)
- PWA, bisa di-install ke layar utama HP, jalan offline.
- Penyimpanan lokal di IndexedDB (disarankan lewat Dexie.js).
- Framework front-end ringan (mis. React + Vite atau Svelte). Pilihan akhir ditentukan Developer Senior dan dicatat di issue arsitektur.
- Enkripsi memakai Web Crypto API (bawaan browser).
- Hosting statis gratis (mis. GitHub Pages) hanya untuk berkas aplikasi, bukan untuk data.

## 6. Lingkup MVP
| # | Fitur | Ringkas |
|---|-------|---------|
| 1 | Kunci aplikasi | PIN (dan biometrik jika didukung) saat membuka aplikasi |
| 2 | Anggota keluarga | Tambah/ubah profil: nama, hubungan, tanggal lahir, golongan darah, alergi, kondisi kronis, obat rutin |
| 3 | Catatan kunjungan | Tanggal, dokter/tempat, keluhan, diagnosis, obat, foto resep atau hasil lab |
| 4 | Riwayat (timeline) | Daftar kunjungan per anggota, urut waktu, bisa dicari dan disaring |
| 5 | Riwayat keluarga | Penanda kondisi yang menurun di keluarga (mis. diabetes) |
| 6 | Pengingat | Kontrol, imunisasi, obat habis. Tampil di beranda "Perlu perhatian" |
| 7 | Cadangan | Ekspor berkas terenkripsi (data + foto), impor untuk memulihkan, pengingat jika cadangan sudah lama |

## 7. Di luar lingkup (MVP)
Sinkronisasi otomatis antar HP, akun/login, integrasi rumah sakit, analitik cloud, notifikasi push dari server, saran diagnosis medis.

## 8. Data (tingkat konsep)
Entitas: **Anggota**, **Kunjungan**, **Lampiran**, **Obat**, **Vaksin**, **Pengingat**, **Pengaturan**. Kunjungan, Obat, Vaksin, dan Pengingat terhubung ke satu Anggota. Lampiran terhubung ke Kunjungan. Detail skema dirancang Developer Senior.

## 9. Keamanan dan privasi
- Berkas ekspor wajib dienkripsi dengan kata sandi pilihan pengguna.
- PIN tidak disimpan polos.
- Tidak ada pelacak, analitik pihak ketiga, atau font/skrip yang memuat data pengguna.
- Tampilkan jelas di aplikasi: data hanya ada di HP ini.

## 10. Desain
Konsep: **buku kesehatan cetak** (seperti buku KIA/vaksin) dalam palet biru. Bukan tampilan template generik.

- **Palet:** biru utama `#2E5BEA` · biru tinta `#14226B` · biru muda `#DCE5FB` · latar `#EEF2FF` · putih `#FFFFFF`. Biru utama untuk aksi dan penekanan, biru tinta untuk teks.
- **Tipografi:** Newsreader (judul, serif), IBM Plex Sans (isi), IBM Plex Mono (tanggal dan label kecil).
- **Ciri khas:** anggota keluarga sebagai "sampul buku", tanggal jatuh tempo bergaya cap, golongan darah sebagai cap miring, garis putus-putus untuk area aksi, tombol berbentuk pill.
- **Aturan:** tanpa emoji sebagai ikon, tanpa gradien dekoratif, area sentuh minimal 44 px, kontras teks minimal 4.5:1, semua kontrol memakai elemen asli (`button`, `input`, `label`).
- Layar mockup: Beranda, Profil anggota, Catat kunjungan. Layar lain mengikuti gaya yang sama.

## 11. Kriteria berhasil
- Seluruh alur MVP berjalan offline di HP.
- Data bertahan setelah aplikasi ditutup dan dibuka lagi.
- Cadangan bisa diekspor lalu dipulihkan di HP lain tanpa kehilangan data.
- Lulus pengujian QA pada HP Android dan iPhone (browser terbaru).

## 12. Cara kerja tim
Tim di OpenBot (PM, Design, Developer Senior, Developer Middle, QA Tester) bekerja dari `D:\app\Kesehatan`. **Setiap tugas dibuat sebagai issue baru** di repo GitHub. Daftar issue ada di `issue.md`, panduan tim di `openbot-team-setup.md`.
