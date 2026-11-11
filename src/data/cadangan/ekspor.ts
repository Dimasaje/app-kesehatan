/**
 * Modul Ekspor Cadangan Terenkripsi (Issue #12).
 *
 * Mengumpulkan data dari 7 tabel Dexie, mengonversi Blob lampiran menjadi
 * Base64 data URI, mengemas bundel JSON berversi, dan mengenkripsinya
 * menjadi berkas biner `.rekam`.
 */

import { basisData, waktuSekarang } from '../db'
import { simpanPengaturan } from '../repositori/pengaturan'
import { enkripsiPayload } from './kriptoCadangan'
import type {
  Anggota,
  BarisPengaturan,
  Kunjungan,
  Obat,
  Pengingat,
  Vaksin,
} from '../skema'

export interface LampiranSerial {
  id?: number
  kunjunganId: number
  nama: string
  jenis: 'resep' | 'hasil-lab' | 'foto' | 'dokumen'
  mime: string
  ukuran: number
  dibuatPada: string
  /** Data biner Blob dikonversi ke Base64 */
  dataBase64: string
}

export interface BundelCadangan {
  versiSkema: number
  dieksporPada: string
  tabel: {
    anggota: Anggota[]
    kunjungan: Kunjungan[]
    lampiran: LampiranSerial[]
    obat: Obat[]
    vaksin: Vaksin[]
    pengingat: Pengingat[]
    pengaturan: BarisPengaturan[]
  }
}

export interface RingkasanCadangan {
  anggota: number
  kunjungan: number
  lampiran: number
  obat: number
  vaksin: number
  pengingat: number
  ukuranByte: number
  dieksporPada: string
}

/**
 * Konversi Blob ke Base64 string.
 */
export async function blobKeBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000 // 32KB chunk untuk menghindari stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

/**
 * Ekspor seluruh data Dexie ke dalam BundelCadangan (tanpa enkripsi).
 */
export async function kumpulkanBundelCadangan(): Promise<BundelCadangan> {
  const db = basisData()

  const [
    anggota,
    kunjungan,
    daftarLampiran,
    obat,
    vaksin,
    pengingat,
    pengaturan,
  ] = await Promise.all([
    db.anggota.toArray(),
    db.kunjungan.toArray(),
    db.lampiran.toArray(),
    db.obat.toArray(),
    db.vaksin.toArray(),
    db.pengingat.toArray(),
    db.pengaturan.toArray(),
  ])

  // Konversi semua Blob lampiran ke Base64
  const lampiran: LampiranSerial[] = await Promise.all(
    daftarLampiran.map(async (l) => ({
      id: l.id,
      kunjunganId: l.kunjunganId,
      nama: l.nama,
      jenis: l.jenis,
      mime: l.mime,
      ukuran: l.ukuran,
      dibuatPada: l.dibuatPada,
      dataBase64: await blobKeBase64(l.blob),
    })),
  )

  return {
    versiSkema: 1,
    dieksporPada: waktuSekarang(),
    tabel: {
      anggota,
      kunjungan,
      lampiran,
      obat,
      vaksin,
      pengingat,
      pengaturan,
    },
  }
}

/**
 * Buat cadangan biner (.rekam) terenkripsi dari seluruh data aplikasi.
 * Mencatat waktu cadangan ke pengaturan `cadangan.terakhirPada`.
 */
export async function buatBerkasCadangan(
  kataSandi: string,
): Promise<{ berkasBytes: Uint8Array<ArrayBuffer>; ringkasan: RingkasanCadangan }> {
  const bundel = await kumpulkanBundelCadangan()
  const jsonStr = JSON.stringify(bundel)
  const payloadBytes = new TextEncoder().encode(jsonStr) as Uint8Array<ArrayBuffer>

  const berkasBytes = await enkripsiPayload(payloadBytes, kataSandi)

  // Catat riwayat cadangan sukses
  await simpanPengaturan('cadangan.terakhirPada', bundel.dieksporPada)

  const ringkasan: RingkasanCadangan = {
    anggota: bundel.tabel.anggota.length,
    kunjungan: bundel.tabel.kunjungan.length,
    lampiran: bundel.tabel.lampiran.length,
    obat: bundel.tabel.obat.length,
    vaksin: bundel.tabel.vaksin.length,
    pengingat: bundel.tabel.pengingat.length,
    ukuranByte: berkasBytes.byteLength,
    dieksporPada: bundel.dieksporPada,
  }

  return { berkasBytes, ringkasan }
}

/**
 * Buat nama berkas cadangan standar: `rekam-keluarga-YYYYMMDD-HHmmss.rekam`
 */
export function formatNamaBerkasCadangan(waktu = new Date()): string {
  const yyyy = waktu.getFullYear()
  const mm = String(waktu.getMonth() + 1).padStart(2, '0')
  const dd = String(waktu.getDate()).padStart(2, '0')
  const hh = String(waktu.getHours()).padStart(2, '0')
  const min = String(waktu.getMinutes()).padStart(2, '0')
  const ss = String(waktu.getSeconds()).padStart(2, '0')
  return `rekam-keluarga-${yyyy}${mm}${dd}-${hh}${min}${ss}.rekam`
}

/**
 * Unduh berkas biner cadangan di browser via anchor download link.
 */
export function unduhBerkasCadangan(
  bytes: Uint8Array,
  namaBerkas = formatNamaBerkasCadangan(),
): void {
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/octet-stream',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaBerkas
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
