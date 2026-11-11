# Rencana Pengujian (Test Plan) — Rekam Keluarga

- **Proyek:** Rekam Keluarga (Buku Kesehatan Keluarga)
- **Dokumen Terkait:** `PRD.md`
- **Issue:** #4 (Milestone 1) & acuan untuk #16 (Milestone 4)
- **Target Perangkat:** HP Android (Chrome mobile terbaru) & iPhone (Safari iOS terbaru)
- **Resolusi Acuan:** 390px (Mobile-first)
- **Karakteristik Kunci:** Local-first, Offline-first, Zero-cloud backend, PWA

---

## 1. Lingkup Pengujian

Dokumen ini memuat matriks skenario uji untuk seluruh fitur MVP dan pengujian non-fungsional sesuai PRD Rekam Keluarga:
1. Kunci Aplikasi (PIN & Biometrik)
2. Kelola Anggota Keluarga
3. Catat Kunjungan & Lampiran Foto
4. Riwayat (Timeline Kunjungan)
5. Riwayat Penyakit Keluarga
6. Pengingat (Kontrol, Imunisasi, Obat Habis)
7. Ekspor & Impor Cadangan Terenkripsi
8. Ketahanan Data, Offline PWA, & Cross-Device

---

## 2. Matriks Skenario Uji MVP

### Fitur 1: Kunci Aplikasi (PIN)
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-PIN-01 | Pembuatan PIN pertama kali | 1. Buka aplikasi saat fresh install.<br>2. Masukkan PIN baru 6 digit.<br>3. Konfirmasi PIN ulang. | PIN berhasil disimpan (PBKDF2-SHA256, 210.000 iterasi, salt 16-byte di tabel Pengaturan IndexedDB, bukan plaintext). Aplikasi terbuka ke Beranda. | Ready |
| TC-PIN-02 | Konfirmasi PIN tidak cocok | 1. Masukkan PIN awal `123456`.<br>2. Masukkan konfirmasi PIN `123457`. | Muncul pesan validasi "PIN tidak cocok. Coba lagi." Form kembali ke tahap pertama. | Ready |
| TC-PIN-03 | Buka aplikasi dengan PIN benar | 1. Tutup aplikasi/kunci layar.<br>2. Buka aplikasi kembali.<br>3. Masukkan PIN 6 digit yang benar. | Kunci terbuka, navigasi diarahkan ke halaman Beranda. | Ready |
| TC-PIN-04 | Masukkan PIN salah | 1. Buka layar kunci.<br>2. Masukkan PIN yang salah. | Muncul indikator kesalahan "PIN salah. Sisa percobaan: X", input ter-reset. | Ready |
| TC-PIN-05 | Proteksi brute force / timeout | 1. Masukkan PIN salah berturut-turut sebanyak 5 kali. | Input keypad terkunci dengan hitung mundur jeda waktu 30 detik ("Terlalu banyak percobaan salah. Coba lagi dalam X detik."). | Ready |
| TC-PIN-06 | Integrasi Biometrik (WebAuthn) | 1. Aktifkan fitur biometrik di Pengaturan (jika didukung perangkat).<br>2. Buka aplikasi dan verifikasi via Fingerprint/FaceID. | Aplikasi terbuka tanpa perlu mengetik PIN manual. Fallback PIN tetap tersedia jika biometrik gagal/dibatalkan. | Backlog |
| TC-PIN-07 | Ubah PIN | 1. Masuk menu Pengaturan > Ubah PIN.<br>2. Masukkan PIN lama.<br>3. Masukkan dan konfirmasi PIN baru. | PIN berhasil diperbarui. Percobaan masuk berikutnya wajib memakai PIN baru. | Backlog |

---

### Fitur 2: Kelola Anggota Keluarga
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-FAM-01 | Tambah anggota keluarga lengkap | 1. Klik Tambah Anggota.<br>2. Isi Nama, Hubungan, Tanggal Lahir, Golongan Darah, Alergi, Kondisi Kronis, Obat Rutin.<br>3. Simpan. | Data tersimpan di IndexedDB. Kartu anggota baru tampil di Beranda dengan gaya sampul buku. | Draft |
| TC-FAM-02 | Validasi field wajib anggota | 1. Kosongkan field Nama atau Tanggal Lahir.<br>2. Klik Simpan. | Form menolak submit, tampil pesan error pada elemen input terkait. | Draft |
| TC-FAM-03 | Format tanggal lahir & usia | 1. Isi tanggal lahir di masa lalu.<br>2. Isi tanggal lahir di masa depan. | Tanggal masa lalu menampilkan kalkulasi usia otomatis (thn/bln). Tanggal masa depan ditolak validasi. | Draft |
| TC-FAM-04 | Ubah data profil anggota | 1. Pilih anggota dari Beranda.<br>2. Buka menu Edit Profil.<br>3. Ubah golongan darah dan alergi.<br>4. Simpan. | Perubahan langsung tercermin di profil anggota dan halaman Beranda. | Draft |
| TC-FAM-05 | Hapus anggota keluarga dengan konfirmasi | 1. Pilih anggota keluarga.<br>2. Klik tombol Hapus.<br>3. Muncul modal konfirmasi bahaya.<br>4. Konfirmasi hapus. | Data anggota beserta data kunjungan/pengingat terkait terhapus. Kartu anggota hilang dari Beranda. | Draft |
| TC-FAM-06 | Batal hapus anggota | 1. Klik tombol Hapus pada anggota.<br>2. Klik Batal pada dialog konfirmasi. | Anggota tidak terhapus, data tetap utuh. | Draft |

---

### Fitur 3: Catat Kunjungan & Lampiran Foto
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-VIS-01 | Tambah catatan kunjungan baru | 1. Buka profil anggota > Klik "Catat Kunjungan".<br>2. Isi Tanggal, Fasilitas/Dokter, Keluhan, Diagnosis, Resep Obat.<br>3. Simpan. | Kunjungan tersimpan dan terhubung dengan ID anggota keluarga yang bersangkutan. | Draft |
| TC-VIS-02 | Unggah foto lampiran via Kamera | 1. Di form kunjungan, klik lampiran "Ambil Foto".<br>2. Izinkan akses kamera HP dan ambil foto resep/lab.<br>3. Simpan. | Foto terlampir dalam form, disimpan lokal di IndexedDB (Blob/Base64 terkompresi). | Draft |
| TC-VIS-03 | Unggah foto lampiran via Galeri | 1. Klik lampiran "Pilih dari Galeri".<br>2. Pilih file gambar (JPG/PNG/WebP). | Thumbnail preview gambar tampil, file siap disimpan. | Draft |
| TC-VIS-04 | Validasi ukuran dan format file | 1. Coba unggah file bukan gambar (misal: PDF/EXE) atau file terlalu besar (>10MB). | Sistem menolak file non-gambar dan mengompres/membatasi ukuran file sesuai batas aman penyimpanan lokal. | Draft |
| TC-VIS-05 | Edit catatan kunjungan | 1. Buka salah satu riwayat kunjungan.<br>2. Ubah catatan diagnosis atau tambah lampiran.<br>3. Simpan. | Catatan kunjungan terbarui dengan timestamp modifikasi. | Draft |
| TC-VIS-06 | Hapus catatan kunjungan | 1. Buka kunjungan > Klik Hapus Kunjungan.<br>2. Konfirmasi hapus. | Kunjungan dan lampiran foto terhapus dari timeline. | Draft |

---

### Fitur 4: Timeline Riwayat Kunjungan
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-TL-01 | Urutan kronologis kunjungan | 1. Buat beberapa kunjungan dengan tanggal berbeda.<br>2. Buka tab Riwayat/Timeline. | Riwayat tersusun rapi dari kunjungan paling baru (descending date). | Draft |
| TC-TL-02 | Pencarian riwayat | 1. Ketik kata kunci pada kotak pencarian (nama dokter, keluhan, diagnosis). | Daftar riwayat memfilter hasil secara instan (<200ms) sesuai kata kunci. | Draft |
| TC-TL-03 | Filter riwayat per anggota | 1. Gunakan dropdown/filter anggota keluarga. | Menampilkan riwayat milik anggota yang dipilih saja. | Draft |
| TC-TL-04 | Pratinjau lampiran foto di timeline | 1. Buka riwayat kunjungan yang memiliki foto lampiran.<br>2. Klik gambar lampiran. | Gambar terbuka dalam mode zoom/lightbox resolusi penuh dengan kontrol tutup. | Draft |

---

### Fitur 5: Riwayat Penyakit Keluarga
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-HER-01 | Penandaan kondisi herediter | 1. Pada profil anggota atau menu riwayat keluarga, tandai kondisi tertentu (contoh: Diabetes Melitus, Hipertensi, Asma).<br>2. Simpan. | Indikator kondisi keluarga tercatat pada entitas riwayat keluarga. | Ready |
| TC-HER-02 | Visibilitas pada profil anggota | 1. Buka profil anggota keluarga.<br>2. Periksa bagian "Riwayat Kesehatan Keluarga". | Muncul badge teks `MENURUN` (tanpa emoji, sesuai PRD pasal 10) dan ikon SVG inline peringatan faktor risiko keluarga. | Ready |

---

### Fitur 6: Pengingat (Perlu Perhatian)
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-REM-01 | Tambah pengingat kontrol dokter | 1. Buat pengingat baru jenis "Kontrol".<br>2. Tentukan tanggal kontrol (misal: 3 hari ke depan).<br>3. Simpan. | Pengingat tersimpan dan terhubung ke anggota terkait. | Ready |
| TC-REM-02 | Tampilan "Perlu Perhatian" di Beranda | 1. Buka halaman Beranda.<br>2. Periksa kartu "Perlu Perhatian". | Anggota dengan kondisi kronis tampil di "Perlu perhatian", dan kartu pengingat berurutan dari tanggal paling dekat/mendesak. | Ready |
| TC-REM-03 | Pengingat obat habis | 1. Catat jadwal konsumsi obat rutin dengan estimasi stok habis.<br>2. Simpan pengingat. | Saat mendekati tanggal habis, status berubah menjadi peringatan mendesak. | Ready |
| TC-REM-04 | Tandai pengingat selesai | 1. Klik checklist / aksi selesai pada kartu pengingat. | Pengingat bergeser ke status selesai / dihapus dari daftar aktif Beranda. | Ready |

---

### Fitur 7: Cadangan & Pemulihan (Backup & Restore)
| ID | Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-BCK-01 | Ekspor cadangan terenkripsi | 1. Masuk menu Cadangan.<br>2. Masukkan kata sandi enkripsi.<br>3. Klik Ekspor Cadangan. | Menghasilkan file cadangan terunduh `rekam-keluarga-[YYYYMMDD-HHmmss].rekam`. File terenkripsi format biner (AES-GCM-256 Web Crypto API, PBKDF2-SHA256, salt 16B, IV 12B), data tidak dapat dibaca polos lewat teks editor. | Ready |
| TC-BCK-02 | Pengingat cadangan berkala di Beranda | 1. Biarkan aplikasi tidak dicadangkan dalam periode tertentu (atau simulasi timestamp cadangan lampau). | Tampil kartu peringatan di Beranda: "Cadangan belum diperbarui X hari". | Ready |
| TC-BCK-03 | Gagal impor dengan kata sandi salah | 1. Pilih menu Impor Cadangan.<br>2. Pilih file `.rekam` yang valid.<br>3. Masukkan kata sandi yang salah.<br>4. Klik Pulihkan. | Dekripsi gagal, data tidak berubah, tampil error: "Kata sandi salah atau berkas rusak". | Ready |
| TC-BCK-04 | Impor dan pemulihan sukses | 1. Buat backup di Perangkat A (berisi anggota, kunjungan, foto Blob, pengingat).<br>2. Pindahkan file ke Perangkat B.<br>3. Lakukan impor dengan kata sandi yang benar. | Semua data (teks dan gambar lampiran Blob) pulih 100% identik tanpa kehilangan data. | Ready |
| TC-BCK-05 | Peringatan overwrite saat impor | 1. Aplikasi di Perangkat B sudah memiliki data eksisting.<br>2. Lakukan proses impor file cadangan. | Muncul modal peringatan eksplisit bahwa data saat ini akan ditimpa/digabung sebelum proses dijalankan. | Ready |

---

## 3. Pengujian Non-Fungsional (Ketahanan, Offline, & Performa)

| ID | Skenario Uji | Kondisi & Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| TC-NF-01 | Pengujian Offline Penuh | 1. Aktifkan Mode Pesawat (Airplane Mode) pada HP.<br>2. Akses aplikasi via browser atau PWA terinstall.<br>3. Lakukan tambah anggota, catat kunjungan, lihat riwayat. | Semua fitur berfungsi lancar tanpa error koneksi, data tersimpan sempurna di IndexedDB lokal. | Draft |
| TC-NF-02 | Ketahanan Data (Persistence) | 1. Input data profil dan kunjungan.<br>2. Force close browser / reboot HP.<br>3. Buka kembali aplikasi. | Data tidak hilang dan tetap persisten. | Draft |
| TC-NF-03 | Instalasi PWA (Add to Home Screen) | 1. Buka via browser HP (Android Chrome & iOS Safari).<br>2. Klik "Install App" / "Add to Home Screen".<br>3. Buka dari ikon Home Screen. | Aplikasi terbuka dalam mode standalone (tanpa address bar browser). | Draft |
| TC-NF-04 | Verifikasi Privasi & Audit Jaringan | 1. Buka DevTools Network panel.<br>2. Jalankan seluruh alur CRUD data & ekspor/impor. | Tidak ada request HTTP keluar yang membawa data pengguna, token, atau analitik pihak ketiga. Zero network leak. | Draft |
| TC-NF-05 | Kesesuaian UI & Ergonomi Sentuh | 1. Uji di layar acuan 390px (iPhone & Android modern).<br>2. Verifikasi tap target dan kontras warna. | Area sentuh minimal 44 x 44 px, kontras teks >= 4.5:1, tidak ada layout breakdown atau horizontal scroll tak sengaja. | Draft |

---

## 4. Matriks Target Perangkat

| Perangkat / OS | Browser | Mode Pengujian | Target |
|---|---|---|---|
| Android 12+ (Samsung / Pixel / Xiaomi) | Google Chrome Mobile terbaru | Standalone PWA & Web Tab | Lulus 100% kriteria MVP |
| iOS 16+ (iPhone 12/13/14/15) | Apple Safari Mobile terbaru | Standalone PWA & Web Tab | Lulus 100% kriteria MVP |
| Desktop Emulation (Chrome DevTools) | Device Mode (390 x 844 px) | Local dev server | Verifikasi fungsional awal |

---

## 5. Pelaporan Cacat (Bug Triage Workflow)
Untuk Milestone 4 (Issue #16):
- Setiap kegagalan uji dilaporkan ke GitHub Issue dengan label `bug`.
- Format laporan bug:
  - **Deskripsi Bug:** Gejala kegagalan.
  - **Langkah Reproduksi:** Urutan aksi.
  - **Hasil Aktual vs Harapan:** Apa yang salah.
  - **Perangkat & Lingkungan:** Model HP, versi OS, versi browser.
  - **Tingkat Keparahan:** Blocker / Major / Minor.
