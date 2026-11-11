# Arsitektur data

Rancangan penyimpanan lokal Rekam Keluarga (Issue #3). Semua data hidup di IndexedDB
perangkat pengguna; tidak ada salinan di server.

## Prinsip

1. **Satu basis data, tujuh tabel.** Nama basis data `rekam-keluarga`.
2. **Waktu dalam ISO 8601 UTC** (`2026-11-11T06:15:00.000Z`). Urutan abjad = urutan waktu,
   aman untuk indeks. Tanggal kalender (lahir, tanggal vaksin) memakai `YYYY-MM-DD` tanpa
   konversi zona waktu — vaksin tanggal 12 tetap tanggal 12 di WIB maupun WITA.
3. **Arsip, bukan hapus.** Anggota, kunjungan, obat, dan vaksin memakai `diarsipkanPada`
   (`null` = aktif). Riwayat keluarga tidak boleh hilang karena salah tekan.
   Hanya `lampiran` dan `pengaturan` yang boleh dihapus fisik.
4. **Lampiran disimpan sebagai `Blob`** di IndexedDB, bukan base64, agar tidak membengkak
   ~33% dan bisa langsung dipakai `URL.createObjectURL`.
5. **Pengaturan berbentuk kunci-nilai** supaya opsi baru tidak memaksa migrasi skema.

## Entitas

| Entitas | Kunci | Kolom penting | Indeks |
| --- | --- | --- | --- |
| `anggota` | `++id` | `nama`, `hubungan`, `tanggalLahir`, `jenisKelamin`, `golonganDarah`, `alergi[]`, `kondisiKronis[]`, `catatan`, `warnaSampul`, `diarsipkanPada` | `nama`, `hubungan`, `tanggalLahir`, `diarsipkanPada` |
| `kunjungan` | `++id` | `anggotaId`, `jenis`, `tanggal`, `tempat`, `dokter`, `keluhan`, `diagnosis`, `tindakan`, `catatan`, `biaya`, `diarsipkanPada` | `anggotaId`, `tanggal`, `jenis`, `[anggotaId+tanggal]`, `[anggotaId+jenis]` |
| `lampiran` | `++id` | `kunjunganId`, `nama`, `jenis`, `mime`, `ukuran`, `blob` | `kunjunganId`, `jenis` |
| `obat` | `++id` | `anggotaId`, `nama`, `dosis`, `aturanPakai`, `mulaiPada`, `selesaiPada`, `stok`, `satuan`, `diarsipkanPada` | `anggotaId`, `nama`, `selesaiPada` |
| `vaksin` | `++id` | `anggotaId`, `nama`, `dosisKe`, `tanggal`, `tempat`, `nomorBatch`, `berikutnyaPada`, `diarsipkanPada` | `anggotaId`, `tanggal`, `berikutnyaPada` |
| `pengingat` | `++id` | `anggotaId?`, `jenis`, `judul`, `jatuhTempo`, `selesaiPada`, `rujukanTabel`, `rujukanId` | `anggotaId`, `jatuhTempo`, `selesaiPada` |
| `pengaturan` | `kunci` | `nilai` (JSON), `diperbaruiPada` | — |

Semua tabel transaksional juga menyimpan `dibuatPada` dan `diperbaruiPada`.

### Relasi

```
anggota 1──n kunjungan 1──n lampiran
anggota 1──n obat
anggota 1──n vaksin
anggota 1──n pengingat   (anggotaId boleh kosong untuk pengingat tingkat aplikasi)
```

Tidak ada foreign key di IndexedDB. Keutuhan dijaga di lapisan repositori:
`hapusAnggotaPermanen()` menghapus lampiran → kunjungan → obat → vaksin → pengingat →
anggota dalam **satu transaksi**.

### Nilai enumerasi

| Kolom | Nilai |
| --- | --- |
| `hubungan` | `diri`, `pasangan`, `anak`, `orangtua`, `lainnya` |
| `jenisKelamin` | `L`, `P` |
| `golonganDarah` | `A`, `B`, `AB`, `O`, `tidak-tahu` |
| `kunjungan.jenis` | `klinik`, `rumah-sakit`, `dokter`, `lab`, `lainnya` |
| `lampiran.jenis` | `resep`, `hasil-lab`, `foto`, `dokumen` |
| `pengingat.jenis` | `kontrol`, `imunisasi`, `obat-habis`, `lainnya` |

Disimpan sebagai teks, bukan angka, agar isi basis data tetap terbaca saat diperiksa
manual dan tidak berubah makna bila urutan konstanta diubah.

## Indeks dan catatan IndexedDB

IndexedDB **tidak mengindeks** nilai `null`/`undefined`. Karena itu:

- Indeks hanya dipasang pada kolom yang selalu terisi.
- Pencarian "anggota aktif" dan "pengingat belum selesai" memakai `.filter()` di atas
  tabel. Jumlah barisnya kecil (satu keluarga: puluhan anggota, ratusan kunjungan),
  jadi biayanya tidak terasa dan tidak sepadan dengan menambah kolom denormalisasi.

## Riwayat versi skema

| Versi | Perubahan |
| --- | --- |
| 1 | Skema awal ketujuh entitas |
| 2 | Indeks `[anggotaId+tanggal]`, `[anggotaId+jenis]`, `diarsipkanPada`, `selesaiPada`, `berikutnyaPada`; backfill `diarsipkanPada = null` dan `diperbaruiPada` |

Backfill mengisi `diperbaruiPada` dari waktu asli baris (`dibuatPada`, lalu `tanggal`),
bukan waktu migrasi, agar riwayat tidak tampak "diubah hari ini" setelah pembaruan.

### Aturan menambah versi

1. Naikkan `VERSI_SKEMA` dan tambah `this.version(n).stores({...})`. Jangan pernah
   mengubah atau menghapus definisi versi lama.
2. Tulis definisi **lengkap** untuk versi baru; Dexie memakai definisi penuh, bukan tambalan.
3. `upgrade()` harus **idempoten**: bisa terulang bila proses gagal di tengah.
4. Tambah kasus uji di `src/data/db.test.ts` yang membuat basis data versi lama, membuka
   versi baru, lalu memeriksa data lama masih utuh.
5. Jangan menurunkan versi. Pengguna yang membuka versi lebih baru lalu kembali ke versi
   lama akan mendapat `VersionError`; itu memang lebih aman daripada data rusak.

## Pola query yang sudah disiapkan

```ts
// Timeline satu anggota, terbaru dulu (Issue #9)
db.kunjungan
  .where('[anggotaId+tanggal]')
  .between([anggotaId, Dexie.minKey], [anggotaId, Dexie.maxKey])
  .reverse()
  .toArray()

// Perlu perhatian di beranda (Issue #7)
const batas = tanggalKalenderBesok()
const pengingat = await db.pengingat
  .where('jatuhTempo').belowOrEqual(batas)
  .filter((p) => p.selesaiPada === null)
  .toArray()

// Obat yang segera habis (Issue #11)
await db.obat.where('selesaiPada').belowOrEqual(batas).toArray()
```

## Penyimpanan tetap (persistent storage)

Browser boleh membersihkan data situs saat ruang penyimpanan menipis. Aplikasi memanggil
`navigator.storage.persist()` saat dibuka dan menyediakan tombol "Minta penyimpanan tetap".
Statusnya ditampilkan di layar sementara. Ini mitigasi, bukan jaminan — **cadangan
terenkripsi (Issue #12) tetap satu-satunya pengaman yang bisa diandalkan.**

## Keamanan yang perlu diketahui

- Data **tidak dienkripsi** di IndexedDB. PIN aplikasi (Issue #5) hanya mengunci
  antarmuka; isi penyimpanan tetap bisa dibaca lewat DevTools atau akses sistem berkas
  pada perangkat yang sudah dibuka kuncinya.
- Karena itu berkas ekspor wajib terenkripsi (AES-GCM + PBKDF2, Issue #12) dan PIN
  disimpan sebagai hash PBKDF2 + salt, bukan teks polos.
- Bawaan `pengaturan` sudah menyiapkan `kunci.hash`, `kunci.salt`, `kunci.iterasi`
  (210.000 iterasi) agar Issue #5 tidak perlu migrasi.
