# Panduan Pengguna Rekam Keluarga

Panduan singkat untuk memakai **Rekam Keluarga** — buku kesehatan keluarga yang seluruh datanya tersimpan di HP Anda sendiri.

- **Buka aplikasi:** <https://dimasaje.github.io/app-kesehatan/>
- Tidak perlu daftar akun, tidak ada biaya, tidak ada data yang dikirim ke server.

> Versi dokumen ini: v0.1. Layar yang disebut di sini memakai nama tombol yang sama dengan yang ada di aplikasi.

---

## 1. Pasang di layar utama HP

Aplikasi berjalan di browser, tetapi bisa dipasang seperti aplikasi biasa. Setelah dipasang, aplikasi bisa dibuka tanpa internet.

**Android (Chrome)**

1. Buka <https://dimasaje.github.io/app-kesehatan/>.
2. Ketuk menu tiga titik di kanan atas.
3. Pilih **Instal aplikasi** (pada sebagian versi: **Tambahkan ke layar utama**).
4. Ketuk **Instal**.

**iPhone / iPad (Safari)**

1. Buka tautan di atas **di Safari** (bukan di dalam aplikasi lain).
2. Ketuk tombol **Bagikan** (kotak dengan panah ke atas).
3. Gulir dan pilih **Tambahkan ke Layar Utama**.
4. Ketuk **Tambah**.

Ikon **Rekam Keluarga** akan muncul di layar utama. Buka dari ikon itu, bukan dari browser, agar tampil penuh layar.

---

## 2. Pertama kali membuka: membuat PIN

1. Saat pertama dibuka, aplikasi meminta Anda membuat **PIN 6 angka**.
2. Masukkan 6 angka, lalu masukkan lagi angka yang sama untuk konfirmasi.
3. PIN ini mengunci aplikasi. Tanpa PIN, orang lain yang memegang HP Anda tidak bisa membuka catatan kesehatan keluarga.

Hal yang perlu diketahui:

- **PIN tidak bisa dipulihkan.** Tidak ada email, tidak ada server, tidak ada "lupa PIN". Kalau PIN lupa, data hanya bisa dibuka lewat berkas cadangan (lihat bagian 7) — dan itu pun menimpa data di HP.
- Setelah **5 kali** PIN salah, aplikasi terkunci selama **30 detik**. Tunggu, lalu coba lagi.
- Untuk mengunci aplikasi saat sedang dipakai: tab **Pengaturan** → **Kunci aplikasi**.

---

## 3. Menambah anggota keluarga

1. Buka tab **Beranda**.
2. Ketuk tombol untuk menambah anggota.
3. Isi nama, tanggal lahir, dan jenis kelamin. Warna sampul boleh dipilih agar mudah dibedakan.
4. Simpan.

Data anggota bisa diubah kapan saja. Menghapus anggota akan meminta konfirmasi lebih dulu.

---

## 4. Mencatat kunjungan (periksa, imunisasi, obat)

1. Buka tab **Riwayat**.
2. Pilih anggota keluarga.
3. Ketuk **+ Catat**.
4. Isi formulir:
   - **Jenis kunjungan** — pilih salah satu jenis yang tersedia.
   - **Tanggal & waktu** — wajib.
   - **Tempat** — wajib, misalnya "Puskesmas Cilandak".
   - **Nama dokter**, **Keluhan** (wajib), **Diagnosis**, **Tindakan / Resep**, **Biaya**, **Catatan tambahan**.
5. Lampirkan foto hasil lab, resep, atau surat dokter bila perlu (lihat bagian 5).
6. Ketuk simpan. Catatan langsung muncul di timeline anggota tersebut.

Mengubah catatan: buka catatan di timeline, pilih ubah, simpan. Catatan lama juga bisa diarsipkan bila sudah tidak relevan.

---

## 5. Melampirkan foto atau dokumen

- Pada formulir kunjungan, pilih lampiran dari **kamera** atau **galeri/berkas**.
- Foto otomatis diperkecil sebelum disimpan agar tidak memenuhi penyimpanan HP. Dokumen (PDF) disimpan apa adanya.
- Ketuk lampiran di timeline untuk melihatnya lebih besar.
- **Lampiran ikut masuk ke berkas cadangan.** Jadi cadangan bisa berukuran beberapa MB — itu normal.

---

## 6. Melihat riwayat dan riwayat penyakit

- **Timeline** menampilkan semua kunjungan satu anggota, terbaru di atas. Ada kolom pencarian dan filter jenis kunjungan.
- **Riwayat penyakit** (tombol di bagian atas tab Riwayat) menampilkan kondisi kesehatan seluruh anggota keluarga, termasuk penanda kondisi menurun dalam keluarga. Berguna saat dokter bertanya "ada riwayat penyakit apa di keluarga?".

---

## 7. Pengingat

Tab **Pengingat** dipakai untuk hal yang perlu diingat: kontrol ulang, jadwal minum obat, atau vaksin berikutnya.

- Buat pengingat dengan judul, tanggal, dan anggota terkait.
- Pengingat yang sudah dekat atau lewat tampil di kartu **Perlu perhatian** di Beranda.
- Setelah dilakukan, tandai pengingat sebagai selesai.

Pengingat berjalan di dalam aplikasi. **Tidak ada notifikasi push** — jadi biasakan membuka aplikasi untuk memeriksanya.

---

## 8. Cadangkan data (langkah paling penting)

Data hanya ada di HP ini. Kalau aplikasi dihapus, HP hilang, atau data browser dibersihkan, data ikut hilang. **Cadangan adalah satu-satunya cara menyelamatkannya.**

Aplikasi akan menampilkan kartu peringatan di Beranda bila belum pernah mencadangkan atau cadangan terakhir sudah lebih dari 7 hari.

### Membuat cadangan

1. Buka tab **Pengaturan** → **Cadangan data**.
2. Pada tab **Ekspor**, isi **kata sandi cadangan** (minimal 4 karakter) dan ulangi di kolom konfirmasi.
3. Ketuk tombol ekspor. Berkas terunduh dengan nama seperti `rekam-keluarga-20261118-0930.rekam`.
4. Simpan berkas itu di tempat yang aman: Google Drive, iCloud, kartu SD, atau kirim ke email sendiri.

**Tentang kata sandi cadangan:**

- Berkas cadangan **dienkripsi**. Isinya tidak bisa dibaca tanpa kata sandi, bahkan oleh siapa pun yang menemukan berkasnya.
- Kata sandi cadangan **tidak terkait dengan PIN** aplikasi. Boleh berbeda.
- **Kalau kata sandi cadangan lupa, isi berkas tidak bisa dibuka sama sekali.** Tidak ada cara memulihkannya. Catat kata sandi itu di tempat aman, atau pakai kalimat panjang yang mudah Anda ingat.

### Kapan sebaiknya mencadangkan

- Setelah menambah banyak catatan atau foto baru.
- Sebelum mengganti HP atau menghapus aplikasi.
- Minimal sebulan sekali, atau setiap kali kartu peringatan muncul di Beranda.

---

## 9. Memulihkan dari cadangan

Gunakan langkah ini saat ganti HP atau memasang ulang aplikasi.

1. Pasang dan buka aplikasi (buat PIN baru bila diminta — PIN akan tetap dipakai setelah pemulihan).
2. Buka tab **Pengaturan** → **Cadangan data** → tab **Impor**.
3. Pilih berkas `.rekam` dari penyimpanan HP.
4. Masukkan **kata sandi cadangan** berkas tersebut.
5. Aplikasi menampilkan **pratinjau**: jumlah anggota, kunjungan, dan lampiran di dalam berkas. Periksa dulu sebelum melanjutkan.
6. Centang pernyataan bahwa Anda mengerti data saat ini akan **ditimpa seluruhnya**.
7. Ketuk **Pulihkan sekarang**.

Yang perlu diperhatikan:

- Pemulihan **mengganti seluruh data** yang ada di HP saat ini. Tidak ada opsi menggabungkan dua set data lewat aplikasi.
- **PIN aplikasi tidak ikut berubah.** Yang diatur oleh berkas cadangan hanya data keluarga.
- Kata sandi cadangan yang salah akan ditolak dengan pesan galat; data lama tidak tersentuh.
- Setelah pulih, periksa beberapa catatan dan satu lampiran foto untuk memastikan semuanya utuh.

---

## 10. Kerja offline

Setelah aplikasi dibuka sekali dengan internet, seluruh aplikasi tersimpan di HP dan bisa dipakai **tanpa internet**: menambah anggota, mencatat kunjungan, melihat timeline, membuat pengingat, serta membuat cadangan.

Yang tidak bisa dilakukan saat offline: memasang aplikasi untuk pertama kali, dan menerima pembaruan versi baru. Pembaruan terpasang otomatis saat aplikasi dibuka kembali dengan internet.

---

## 11. Pindah ke HP baru

1. Di HP lama: buat cadangan terbaru (bagian 8), lalu pindahkan berkas `.rekam` ke HP baru (misalnya lewat email atau drive).
2. Di HP baru: pasang aplikasi, buat PIN, lalu pulihkan dari berkas tersebut (bagian 9).
3. Periksa hasil pemulihan, termasuk beberapa lampiran foto.
4. Jangan hapus aplikasi/data di HP lama sampai Anda yakin HP baru sudah lengkap.

---

## 12. Pertanyaan yang sering muncul

**Apakah data saya dikirim ke internet?**
Tidak. Tidak ada server, akun, atau pelacakan. Satu-satunya lalu lintas jaringan adalah mengunduh berkas aplikasi itu sendiri saat pertama dibuka.

**Di mana data saya disimpan?**
Di penyimpanan lokal browser (IndexedDB) pada perangkat Anda. Karena itu data terikat pada satu browser di satu HP. Membuka tautan yang sama di HP lain akan menampilkan aplikasi kosong, bukan data Anda.

**Saya lupa PIN. Apa yang bisa dilakukan?**
PIN tidak bisa dipulihkan. Pasang aplikasi di browser/perangkat lain, buat PIN baru, lalu pulihkan dari berkas cadangan terakhir. Data yang belum pernah dicadangkan tidak bisa diselamatkan.

**Saya lupa kata sandi cadangan.**
Berkas tidak bisa dibuka. Ini konsekuensi enkripsi, bukan bug. Karena itu simpan kata sandi cadangan di tempat yang aman.

**Apakah aman menghapus riwayat browser / cache?**
Menghapus data situs (site data) untuk alamat ini akan **menghapus seluruh catatan**. Membersihkan cache biasa umumnya tidak, tetapi jangan mengambil risiko — buat cadangan lebih dulu.

**Bisakah dua orang memakai satu data keluarga di HP berbeda?**
Belum. Aplikasi ini hanya untuk satu perangkat. Berbagi data dilakukan manual: satu orang membuat cadangan, yang lain memulihkannya (data penerima akan tertimpa).

---

## 13. Batasan versi 0.1

Fitur berikut belum ada dan direncanakan menyusul:

- Mengubah PIN dari dalam aplikasi.
- Membuka aplikasi dengan sidik jari / Face ID.
- Notifikasi pengingat di luar aplikasi.
- Sinkronisasi otomatis antarperangkat.
- Ekspor ke PDF atau cetak ringkasan.
- Opsi menggabungkan data saat memulihkan cadangan.

Aplikasi ini alat bantu pencatatan, bukan pengganti nasihat medis. Untuk keputusan pengobatan, tetap konsultasikan dengan tenaga kesehatan.
