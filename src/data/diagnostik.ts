/**
 * Alat pemeriksaan penyimpanan untuk QA dan pengujian manual di HP.
 *
 * Menulis satu anggota uji, menutup lalu membuka kembali basis data, dan
 * memastikan barisnya masih ada. Inilah bukti "data bertahan setelah aplikasi
 * ditutup" tanpa harus menutup aplikasi secara manual.
 */
import { basisData, NAMA_BASIS_DATA } from './db'
import { hapusAnggotaPermanen, tambahAnggota } from './repositori/anggota'

export const PENANDA_UJI = '__uji_penyimpanan__'

export interface HasilUjiPenyimpanan {
  berhasil: boolean
  id: number | null
  /** Jumlah anggota uji yang terbaca setelah basis data dibuka ulang. */
  terbaca: number
  /** Versi skema yang aktif saat pengujian. */
  versiSkema: number
  pesan: string
}

export async function jalankanUjiSimpan(): Promise<HasilUjiPenyimpanan> {
  try {
    const id = await tambahAnggota({
      nama: PENANDA_UJI,
      hubungan: 'lainnya',
      catatan: 'Baris uji penyimpanan. Aman dihapus.',
    })

    // Tutup dan buka ulang: memaksa Dexie membaca dari IndexedDB, bukan cache.
    const db = basisData()
    db.close()
    await db.open()

    const terbaca = await db.anggota.where('nama').equals(PENANDA_UJI).count()
    return {
      berhasil: terbaca === 1,
      id,
      terbaca,
      versiSkema: db.verno,
      pesan:
        terbaca === 1
          ? `Baris uji tersimpan dan terbaca kembali di "${NAMA_BASIS_DATA}" (skema v${db.verno}).`
          : 'Baris uji ditulis tetapi tidak terbaca kembali.',
    }
  } catch (galat) {
    return {
      berhasil: false,
      id: null,
      terbaca: 0,
      versiSkema: basisData().verno,
      pesan: galat instanceof Error ? galat.message : String(galat),
    }
  }
}

/** Menghapus semua baris uji. Mengembalikan jumlah baris yang dihapus. */
export async function bersihkanDataUji(): Promise<number> {
  const db = basisData()
  const ids = await db.anggota.where('nama').equals(PENANDA_UJI).primaryKeys()
  for (const id of ids) await hapusAnggotaPermanen(id)
  return ids.length
}
