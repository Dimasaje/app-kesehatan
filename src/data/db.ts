/**
 * Basis data lokal (IndexedDB via Dexie).
 *
 * ## Riwayat versi
 * | Versi | Perubahan |
 * |-------|-----------|
 * | 1 | Skema awal: 7 entitas PRD bagian 8 |
 * | 2 | Indeks gabungan timeline kunjungan, indeks arsip/obat/vaksin, backfill `diarsipkanPada` |
 *
 * ## Cara menambah versi
 * 1. Naikkan angka versi; jangan pernah mengubah atau menghapus definisi versi lama.
 * 2. Tulis ulang lengkap `.stores({...})` untuk versi baru (Dexie memakai
 *    definisi penuh, bukan tambalan).
 * 3. Tambahkan `.upgrade()` bila bentuk data lama perlu diubah; fungsi ini harus
 *    idempoten karena bisa terulang setelah gagal di tengah jalan.
 * 4. Tambahkan kasus uji migrasi di `src/data/db.test.ts`.
 *
 * ## Catatan indeks
 * IndexedDB tidak mengindeks nilai `null`/`undefined`. Jadi indeks hanya dipasang
 * pada kolom yang selalu terisi, dan pencarian "belum selesai"/"aktif" memakai
 * `.filter()` di atas tabel (jumlah barisnya kecil: satu keluarga).
 */
import Dexie, { type Table } from 'dexie'
import type {
  Anggota,
  BarisPengaturan,
  Kunjungan,
  Lampiran,
  Obat,
  Pengingat,
  Vaksin,
} from './skema'

export const NAMA_BASIS_DATA = 'rekam-keluarga'

/** Versi skema saat ini. */
export const VERSI_SKEMA = 2

const TABEL_V1 = {
  anggota: '++id, nama, hubungan, tanggalLahir',
  kunjungan: '++id, anggotaId, tanggal, jenis',
  lampiran: '++id, kunjunganId, jenis',
  obat: '++id, anggotaId, nama',
  vaksin: '++id, anggotaId, tanggal',
  pengingat: '++id, anggotaId, jatuhTempo, selesaiPada',
  pengaturan: 'kunci',
}

const TABEL_V2 = {
  anggota: '++id, nama, hubungan, tanggalLahir, diarsipkanPada',
  // [anggotaId+tanggal] melayani timeline per anggota (Issue #9).
  kunjungan: '++id, anggotaId, tanggal, jenis, [anggotaId+tanggal], [anggotaId+jenis]',
  lampiran: '++id, kunjunganId, jenis',
  obat: '++id, anggotaId, nama, selesaiPada',
  vaksin: '++id, anggotaId, tanggal, berikutnyaPada',
  pengingat: '++id, anggotaId, jatuhTempo, selesaiPada',
  pengaturan: 'kunci',
}

export class BasisDataRekamKeluarga extends Dexie {
  anggota!: Table<Anggota, number>
  kunjungan!: Table<Kunjungan, number>
  lampiran!: Table<Lampiran, number>
  obat!: Table<Obat, number>
  vaksin!: Table<Vaksin, number>
  pengingat!: Table<Pengingat, number>
  pengaturan!: Table<BarisPengaturan, string>

  constructor(nama: string = NAMA_BASIS_DATA) {
    super(nama)

    this.version(1).stores(TABEL_V1)

    this.version(2)
      .stores(TABEL_V2)
      .upgrade(async (transaksi) => {
        // v1 belum punya kolom arsip maupun stempel waktu pembaruan. Baris lama
        // harus diberi nilai agar kode aplikasi bisa membandingkan dengan null
        // dan agar urutan "terbaru diubah" tetap masuk akal.
        //
        // Stempel waktu diisi dari waktu asli baris (dibuatPada/tanggal), bukan
        // waktu migrasi, supaya riwayat tidak tampak "diubah hari ini".
        const sekarang = new Date().toISOString()
        const waktuAsli = (baris: Record<string, unknown>): string => {
          for (const kandidat of [baris.dibuatPada, baris.tanggal]) {
            if (typeof kandidat === 'string' && kandidat) return kandidat
          }
          return sekarang
        }

        for (const nama of ['anggota', 'obat', 'vaksin'] as const) {
          await transaksi
            .table(nama)
            .toCollection()
            .modify((baris: Record<string, unknown>) => {
              if (!('diarsipkanPada' in baris)) baris.diarsipkanPada = null
              if (!baris.diperbaruiPada) baris.diperbaruiPada = waktuAsli(baris)
            })
        }

        await transaksi
          .table('kunjungan')
          .toCollection()
          .modify((baris: Record<string, unknown>) => {
            if (!('diarsipkanPada' in baris)) baris.diarsipkanPada = null
            if (!baris.diperbaruiPada) baris.diperbaruiPada = waktuAsli(baris)
          })

        await transaksi
          .table('pengingat')
          .toCollection()
          .modify((baris: Record<string, unknown>) => {
            if (!('selesaiPada' in baris)) baris.selesaiPada = null
            if (!baris.diperbaruiPada) baris.diperbaruiPada = waktuAsli(baris)
          })
      })
  }
}

let instance: BasisDataRekamKeluarga | null = null

/**
 * Satu instance untuk seluruh aplikasi. Dibuat malas agar pengujian dapat
 * memakai nama basis data berbeda dan memasang `fake-indexeddb` lebih dulu.
 */
export function basisData(): BasisDataRekamKeluarga {
  if (!instance) instance = new BasisDataRekamKeluarga()
  return instance
}

export interface StatusPenyimpanan {
  nama: string
  versiSkema: number
  tersedia: boolean
  jumlahAnggota: number
  /** Perkiraan ruang terpakai dalam byte, `null` bila browser tidak menyediakan. */
  perkiraanPemakaian: number | null
  /** Kuota penyimpanan dalam byte, `null` bila browser tidak menyediakan. */
  kuota: number | null
  /** true bila browser sudah menjamin data tidak dihapus saat ruang menipis. */
  tetap: boolean
}

/** Membaca status penyimpanan nyata, bukan perkiraan. */
export async function bacaStatusPenyimpanan(): Promise<StatusPenyimpanan> {
  if (typeof indexedDB === 'undefined') {
    return {
      nama: NAMA_BASIS_DATA,
      versiSkema: VERSI_SKEMA,
      tersedia: false,
      jumlahAnggota: 0,
      perkiraanPemakaian: null,
      kuota: null,
      tetap: false,
    }
  }

  const db = basisData()
  await db.open()
  const jumlahAnggota = await db.anggota.count()

  let perkiraanPemakaian: number | null = null
  let kuota: number | null = null
  let tetap = false

  if (typeof navigator !== 'undefined') {
    if (navigator.storage?.estimate) {
      const perkiraan = await navigator.storage.estimate()
      perkiraanPemakaian = perkiraan.usage ?? null
      kuota = perkiraan.quota ?? null
    }
    if (navigator.storage?.persisted) {
      tetap = await navigator.storage.persisted()
    }
  }

  return {
    nama: db.name,
    versiSkema: db.verno,
    tersedia: true,
    jumlahAnggota,
    perkiraanPemakaian,
    kuota,
    tetap,
  }
}

/** Meminta penyimpanan tetap agar browser tidak membersihkan data saat ruang menipis. */
export async function mintaPenyimpananTetap(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
  if (await navigator.storage.persisted?.()) return true
  return navigator.storage.persist()
}

/** Menghapus seluruh basis data. Hanya untuk pemulihan bencana dan pengujian. */
export async function hapusBasisData(): Promise<void> {
  const db = basisData()
  db.close()
  await Dexie.delete(db.name)
}

/** Waktu sekarang dalam ISO 8601 UTC. Satu-satunya sumber stempel waktu. */
export function waktuSekarang(): string {
  return new Date().toISOString()
}
