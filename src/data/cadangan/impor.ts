/**
 * Modul Impor dan Pemulihan Cadangan (Issue #13).
 *
 * Mendekripsi berkas `.rekam`, memvalidasi skema bundel, dan menjalankan
 * transaksi atomic pemulihan data ke Dexie.
 *
 * Fitur Keselamatan:
 * - Validasi tipe dan struktur sebelum data disentuh.
 * - Eksekusi pemulihan di dalam `db.transaction('rw', ...)` tunggal: jika ada error,
 *   Dexie membatalkan otomatis seluruh perubahan (fail-safe transaction).
 * - Mendukung mode 'timpa' (wipe existing) atau 'gabung' (upsert).
 */

import { basisData } from '../db'
import { dekripsiPayload } from './kriptoCadangan'
import type { BundelCadangan, RingkasanCadangan } from './ekspor'
import type { Lampiran } from '../skema'

/**
 * Konversi string Base64 kembali ke Blob.
 */
export function base64KeBlob(base64: string, mime: string): Blob {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * Validasi struktural bundel cadangan sebelum pemulihan.
 */
export function validasiBundelCadangan(data: unknown): asserts data is BundelCadangan {
  if (!data || typeof data !== 'object') {
    throw new Error('Format isi cadangan bukan objek JSON yang valid.')
  }

  const d = data as Partial<BundelCadangan>
  if (typeof d.versiSkema !== 'number' || d.versiSkema < 1) {
    throw new Error('Versi skema cadangan tidak valid atau tidak didukung.')
  }

  if (!d.tabel || typeof d.tabel !== 'object') {
    throw new Error('Struktur tabel data tidak ditemukan dalam berkas cadangan.')
  }

  const daftarTabelWajib: (keyof BundelCadangan['tabel'])[] = [
    'anggota',
    'kunjungan',
    'lampiran',
    'obat',
    'vaksin',
    'pengingat',
    'pengaturan',
  ]

  for (const namaTabel of daftarTabelWajib) {
    if (!Array.isArray(d.tabel[namaTabel])) {
      throw new Error(`Tabel "${namaTabel}" tidak berbentuk array dalam cadangan.`)
    }
  }
}

/**
 * Buka dan periksa isi berkas cadangan tanpa langsung memulihkannya ke database.
 * Berguna untuk menampilkan pratinjau (preview/ringkasan) kepada pengguna sebelum
 * mereka memutuskan menimpa data yang ada.
 */
export async function bacaPratinjauCadangan(
  fileBytes: Uint8Array<ArrayBuffer>,
  kataSandi: string,
): Promise<{ bundel: BundelCadangan; ringkasan: RingkasanCadangan }> {
  const payloadBytes = await dekripsiPayload(fileBytes, kataSandi)
  const jsonStr = new TextDecoder().decode(payloadBytes)

  let rawData: unknown
  try {
    rawData = JSON.parse(jsonStr)
  } catch {
    throw new Error('Data terdekripsi rusak atau bukan JSON yang valid.')
  }

  validasiBundelCadangan(rawData)

  const ringkasan: RingkasanCadangan = {
    anggota: rawData.tabel.anggota.length,
    kunjungan: rawData.tabel.kunjungan.length,
    lampiran: rawData.tabel.lampiran.length,
    obat: rawData.tabel.obat.length,
    vaksin: rawData.tabel.vaksin.length,
    pengingat: rawData.tabel.pengingat.length,
    ukuranByte: fileBytes.byteLength,
    dieksporPada: rawData.dieksporPada,
  }

  return { bundel: rawData, ringkasan }
}

export interface OpsiPemulihan {
  /**
   * 'timpa': Kosongkan data lama terlebih dahulu, lalu masukkan semua data cadangan.
   * 'gabung': Masukkan / timpa berdasarkan ID tanpa menghapus data lain yang ada.
   * Bawaan: 'timpa' (sesuai spesifikasi restore cadangan).
   */
  mode?: 'timpa' | 'gabung'
  /**
   * Jika true, data PIN dan status kunci aplikasi eksisting tidak akan tertimpa
   * oleh pengaturan kunci dari berkas cadangan.
   * Bawaan: true (agar pengguna tidak terkunci dengan PIN lama dari file backup).
   */
  pertahankanKunciLokal?: boolean
}

/**
 * Pulihkan data dari BundelCadangan ke dalam Dexie.
 * Menjalankan transaksi atomic Dexie.
 */
export async function pulihkanDariBundel(
  bundel: BundelCadangan,
  opsi: OpsiPemulihan = {},
): Promise<RingkasanCadangan> {
  validasiBundelCadangan(bundel)

  const mode = opsi.mode ?? 'timpa'
  const pertahankanKunci = opsi.pertahankanKunciLokal ?? true
  const db = basisData()

  // Ambil pengaturan kunci lokal saat ini jika ingin dipertahankan
  let pengaturanKunciLokal: Record<string, unknown> = {}
  if (pertahankanKunci) {
    const kunciList = ['kunci.aktif', 'kunci.hash', 'kunci.salt', 'kunci.iterasi']
    const barisLokal = await db.pengaturan.where('kunci').anyOf(kunciList).toArray()
    for (const b of barisLokal) {
      pengaturanKunciLokal[b.kunci] = b.nilai
    }
  }

  // Siapkan baris lampiran yang sudah dikonversi kembali ke Blob
  const daftarLampiranPulih: Lampiran[] = bundel.tabel.lampiran.map((l) => ({
    id: l.id,
    kunjunganId: l.kunjunganId,
    nama: l.nama,
    jenis: l.jenis,
    mime: l.mime,
    ukuran: l.ukuran,
    blob: base64KeBlob(l.dataBase64, l.mime),
    dibuatPada: l.dibuatPada,
  }))

  // Siapkan baris pengaturan yang akan disimpan
  const daftarPengaturanPulih = bundel.tabel.pengaturan.filter((p) => {
    if (pertahankanKunci && p.kunci.startsWith('kunci.')) {
      return false // Jangan timpa pengaturan kunci jika pertahankanKunci aktif
    }
    return true
  })

  // Transaksi atomic: semua tabel dilibatkan dalam mode readwrite
  await db.transaction(
    'rw',
    [
      db.anggota,
      db.kunjungan,
      db.lampiran,
      db.obat,
      db.vaksin,
      db.pengingat,
      db.pengaturan,
    ],
    async () => {
      if (mode === 'timpa') {
        // Kosongkan tabel
        await Promise.all([
          db.anggota.clear(),
          db.kunjungan.clear(),
          db.lampiran.clear(),
          db.obat.clear(),
          db.vaksin.clear(),
          db.pengingat.clear(),
        ])
        if (!pertahankanKunci) {
          await db.pengaturan.clear()
        } else {
          // Hapus selain kunci.*
          const nonKunciKeys = (await db.pengaturan.toArray())
            .filter((p) => !p.kunci.startsWith('kunci.'))
            .map((p) => p.kunci)
          if (nonKunciKeys.length > 0) {
            await db.pengaturan.bulkDelete(nonKunciKeys)
          }
        }
      }

      // Masukkan data baru
      if (bundel.tabel.anggota.length > 0) {
        await db.anggota.bulkPut(bundel.tabel.anggota)
      }
      if (bundel.tabel.kunjungan.length > 0) {
        await db.kunjungan.bulkPut(bundel.tabel.kunjungan)
      }
      if (daftarLampiranPulih.length > 0) {
        await db.lampiran.bulkPut(daftarLampiranPulih)
      }
      if (bundel.tabel.obat.length > 0) {
        await db.obat.bulkPut(bundel.tabel.obat)
      }
      if (bundel.tabel.vaksin.length > 0) {
        await db.vaksin.bulkPut(bundel.tabel.vaksin)
      }
      if (bundel.tabel.pengingat.length > 0) {
        await db.pengingat.bulkPut(bundel.tabel.pengingat)
      }
      if (daftarPengaturanPulih.length > 0) {
        await db.pengaturan.bulkPut(daftarPengaturanPulih)
      }
    },
  )

  return {
    anggota: bundel.tabel.anggota.length,
    kunjungan: bundel.tabel.kunjungan.length,
    lampiran: bundel.tabel.lampiran.length,
    obat: bundel.tabel.obat.length,
    vaksin: bundel.tabel.vaksin.length,
    pengingat: bundel.tabel.pengingat.length,
    ukuranByte: 0,
    dieksporPada: bundel.dieksporPada,
  }
}

/**
 * Pulihkan langsung dari file biner (.rekam) terenkripsi.
 */
export async function pulihkanDariBerkas(
  fileBytes: Uint8Array<ArrayBuffer>,
  kataSandi: string,
  opsi: OpsiPemulihan = {},
): Promise<RingkasanCadangan> {
  const { bundel, ringkasan } = await bacaPratinjauCadangan(fileBytes, kataSandi)
  await pulihkanDariBundel(bundel, opsi)
  return ringkasan
}
