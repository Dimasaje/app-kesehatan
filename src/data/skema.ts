/**
 * Bentuk data Rekam Keluarga.
 *
 * Aturan:
 * - Semua tanggal disimpan sebagai teks ISO 8601 dalam UTC (`...Z`) agar urutan
 *   abjad = urutan waktu dan aman untuk indeks IndexedDB.
 * - Tanggal kalender (lahir, tanggal vaksin) memakai `YYYY-MM-DD` karena tidak
 *   punya jam; jangan dikonversi ke zona waktu.
 * - Penghapusan memakai penanda arsip (`diarsipkanPada`), bukan hapus fisik,
 *   kecuali untuk lampiran dan pengaturan.
 */

/** Kunci primer tabel IndexedDB (auto-increment). */
export type Id = number

/** Tanggal kalender tanpa jam: `YYYY-MM-DD`. */
export type TanggalKalender = string

/** Waktu lengkap ISO 8601 UTC: `2026-11-11T06:15:00.000Z`. */
export type WaktuIso = string

export const HUBUNGAN = ['diri', 'pasangan', 'anak', 'orangtua', 'lainnya'] as const
export type Hubungan = (typeof HUBUNGAN)[number]

export const JENIS_KELAMIN = ['L', 'P'] as const
export type JenisKelamin = (typeof JENIS_KELAMIN)[number]

export const GOLONGAN_DARAH = ['A', 'B', 'AB', 'O', 'tidak-tahu'] as const
export type GolonganDarah = (typeof GOLONGAN_DARAH)[number]

export const JENIS_KUNJUNGAN = ['klinik', 'rumah-sakit', 'dokter', 'lab', 'lainnya'] as const
export type JenisKunjungan = (typeof JENIS_KUNJUNGAN)[number]

export const JENIS_LAMPIRAN = ['resep', 'hasil-lab', 'foto', 'dokumen'] as const
export type JenisLampiran = (typeof JENIS_LAMPIRAN)[number]

export const JENIS_PENGINGAT = ['kontrol', 'imunisasi', 'obat-habis', 'lainnya'] as const
export type JenisPengingat = (typeof JENIS_PENGINGAT)[number]

export interface Anggota {
  id?: Id
  nama: string
  hubungan: Hubungan
  tanggalLahir?: TanggalKalender
  jenisKelamin?: JenisKelamin
  golonganDarah?: GolonganDarah
  /** Contoh: "Penisilin", "Debu". Disimpan sebagai larik agar bisa disaring. */
  alergi: string[]
  kondisiKronis: string[]
  catatan?: string
  /** Warna sampul buku, mis. "#2E5BEA". Dipakai layar beranda (Issue #7). */
  warnaSampul?: string
  dibuatPada: WaktuIso
  diperbaruiPada: WaktuIso
  /** null = aktif. Berisi waktu saat anggota diarsipkan. */
  diarsipkanPada: WaktuIso | null
}

export interface Kunjungan {
  id?: Id
  anggotaId: Id
  jenis: JenisKunjungan
  /** Waktu kunjungan; dipakai untuk urutan timeline. */
  tanggal: WaktuIso
  tempat: string
  dokter?: string
  keluhan: string
  diagnosis?: string
  tindakan?: string
  catatan?: string
  /** Biaya dalam rupiah, bilangan bulat. */
  biaya?: number
  dibuatPada: WaktuIso
  diperbaruiPada: WaktuIso
  diarsipkanPada: WaktuIso | null
}

export interface Lampiran {
  id?: Id
  kunjunganId: Id
  nama: string
  jenis: JenisLampiran
  /** MIME asli berkas, mis. "image/jpeg". */
  mime: string
  /** Ukuran berkas dalam byte. */
  ukuran: number
  /** Isi berkas. Disimpan lokal di IndexedDB; tidak pernah diunggah. */
  blob: Blob
  dibuatPada: WaktuIso
}

export interface Obat {
  id?: Id
  anggotaId: Id
  nama: string
  dosis?: string
  aturanPakai?: string
  /** Tanggal mulai minum obat. */
  mulaiPada: TanggalKalender
  /** Perkiraan tanggal obat habis; dasar pengingat "obat habis". */
  selesaiPada?: TanggalKalender
  stok?: number
  satuan?: string
  catatan?: string
  dibuatPada: WaktuIso
  diperbaruiPada: WaktuIso
  diarsipkanPada: WaktuIso | null
}

export interface Vaksin {
  id?: Id
  anggotaId: Id
  nama: string
  dosisKe?: number
  tanggal: TanggalKalender
  tempat?: string
  nomorBatch?: string
  /** Jadwal dosis berikutnya; dasar pengingat imunisasi. */
  berikutnyaPada?: TanggalKalender
  catatan?: string
  dibuatPada: WaktuIso
  diperbaruiPada: WaktuIso
  diarsipkanPada: WaktuIso | null
}

export interface Pengingat {
  id?: Id
  /** Kosong untuk pengingat tingkat aplikasi, mis. "sudah lama tidak mencadangkan". */
  anggotaId?: Id
  jenis: JenisPengingat
  judul: string
  jatuhTempo: TanggalKalender
  /** null = belum selesai. */
  selesaiPada: WaktuIso | null
  /** Asal pengingat otomatis, mis. tabel "vaksin" dengan id 12. */
  rujukanTabel?: 'vaksin' | 'obat' | 'kunjungan'
  rujukanId?: Id
  dibuatPada: WaktuIso
  diperbaruiPada: WaktuIso
}

/**
 * Pengaturan berbentuk kunci-nilai agar penambahan opsi baru tidak memaksa
 * migrasi skema. Nilai disimpan sebagai JSON dan divalidasi di lapisan akses.
 */
export interface BarisPengaturan {
  kunci: string
  nilai: unknown
  diperbaruiPada: WaktuIso
}

export type NamaTabel =
  | 'anggota'
  | 'kunjungan'
  | 'lampiran'
  | 'obat'
  | 'vaksin'
  | 'pengingat'
  | 'pengaturan'
