import { basisData, waktuSekarang } from '../db'

/**
 * Kunci pengaturan yang dikenal beserta tipenya.
 *
 * Pengaturan disimpan sebagai kunci-nilai supaya penambahan opsi tidak memicu
 * migrasi skema. Nilai tetap divalidasi lewat `PengaturanAplikasi` di sini.
 */
export interface PengaturanAplikasi {
  /** true bila PIN sudah dipasang (Issue #5). */
  'kunci.aktif': boolean
  /** Hash PBKDF2-SHA256 dalam base64. PIN tidak pernah disimpan polos. */
  'kunci.hash': string
  /** Salt acak dalam base64. */
  'kunci.salt': string
  /** Jumlah iterasi PBKDF2 yang dipakai saat hash dibuat. */
  'kunci.iterasi': number
  /** Waktu (ISO) cadangan terakhir berhasil dibuat. */
  'cadangan.terakhirPada': string | null
  /** Peringatkan bila cadangan lebih lama dari sekian hari. */
  'cadangan.ingatkanSetelahHari': number
  /** true setelah layar perkenalan pertama selesai. */
  'aplikasi.sudahDibuka': boolean
}

export type KunciPengaturan = keyof PengaturanAplikasi

interface BawaanPengaturan {
  'kunci.aktif': false
  'kunci.hash': ''
  'kunci.salt': ''
  'kunci.iterasi': 210_000
  'cadangan.terakhirPada': null
  'cadangan.ingatkanSetelahHari': 30
  'aplikasi.sudahDibuka': false
}

export const PENGATURAN_BAWAAN: BawaanPengaturan = {
  'kunci.aktif': false,
  'kunci.hash': '',
  'kunci.salt': '',
  'kunci.iterasi': 210_000,
  'cadangan.terakhirPada': null,
  'cadangan.ingatkanSetelahHari': 30,
  'aplikasi.sudahDibuka': false,
}

export async function ambilPengaturan<K extends KunciPengaturan>(
  kunci: K,
): Promise<PengaturanAplikasi[K]> {
  const baris = await basisData().pengaturan.get(kunci)
  if (!baris) return PENGATURAN_BAWAAN[kunci] as PengaturanAplikasi[K]
  return baris.nilai as PengaturanAplikasi[K]
}

export async function simpanPengaturan<K extends KunciPengaturan>(
  kunci: K,
  nilai: PengaturanAplikasi[K],
): Promise<void> {
  await basisData().pengaturan.put({
    kunci,
    // Disimpan sebagai JSON agar tipe (boolean, angka, null) tidak berubah saat
    // dibaca kembali oleh IndexedDB.
    nilai: JSON.parse(JSON.stringify(nilai)),
    diperbaruiPada: waktuSekarang(),
  })
}

export async function ambilSemuaPengaturan(): Promise<PengaturanAplikasi> {
  const baris = await basisData().pengaturan.toArray()
  const hasil: Record<string, unknown> = { ...PENGATURAN_BAWAAN }
  for (const { kunci, nilai } of baris) hasil[kunci] = nilai
  return hasil as unknown as PengaturanAplikasi
}
