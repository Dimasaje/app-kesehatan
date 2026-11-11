/**
 * Repositori kunjungan (Issue #8, #9).
 */
import { basisData, waktuSekarang } from '../db'
import type { Kunjungan, JenisKunjungan, Id } from '../skema'

export interface MasukanKunjungan {
  anggotaId: Id
  jenis: JenisKunjungan
  tanggal: string
  tempat: string
  dokter?: string
  keluhan: string
  diagnosis?: string
  tindakan?: string
  catatan?: string
  biaya?: number
}

export async function tambahKunjungan(masukan: MasukanKunjungan): Promise<number> {
  const sekarang = waktuSekarang()
  return basisData().kunjungan.add({
    ...masukan,
    dokter: masukan.dokter?.trim() || undefined,
    diagnosis: masukan.diagnosis?.trim() || undefined,
    tindakan: masukan.tindakan?.trim() || undefined,
    catatan: masukan.catatan?.trim() || undefined,
    dibuatPada: sekarang,
    diperbaruiPada: sekarang,
    diarsipkanPada: null,
  })
}

export async function perbaruiKunjungan(id: number, perubahan: Partial<MasukanKunjungan>): Promise<void> {
  await basisData().kunjungan.update(id, { ...perubahan, diperbaruiPada: waktuSekarang() })
}

export async function ambilKunjungan(id: number): Promise<Kunjungan | undefined> {
  return basisData().kunjungan.get(id)
}

/** Timeline per anggota, urut tanggal terbaru. */
export async function timelineAnggota(
  anggotaId: number,
  opsi?: { cari?: string; jenis?: JenisKunjungan; batasAtas?: number; mulaiDari?: number },
): Promise<Kunjungan[]> {
  let koleksi = basisData()
    .kunjungan.where('[anggotaId+tanggal]')
    .between([anggotaId, ''], [anggotaId, '\uffff'])
    .filter((k) => k.diarsipkanPada === null)

  if (opsi?.jenis) {
    koleksi = koleksi.filter((k) => k.jenis === opsi.jenis)
  }
  if (opsi?.cari) {
    const kata = opsi.cari.toLowerCase()
    koleksi = koleksi.filter(
      (k) =>
        k.keluhan.toLowerCase().includes(kata) ||
        k.tempat.toLowerCase().includes(kata) ||
        (k.dokter ?? '').toLowerCase().includes(kata) ||
        (k.diagnosis ?? '').toLowerCase().includes(kata),
    )
  }

  const semua = await koleksi.toArray()
  semua.sort((a, b) => b.tanggal.localeCompare(a.tanggal))

  const mulai = opsi?.mulaiDari ?? 0
  const batas = opsi?.batasAtas ?? semua.length
  return semua.slice(mulai, mulai + batas)
}

export async function arsipkanKunjungan(id: number): Promise<void> {
  const sekarang = waktuSekarang()
  await basisData().kunjungan.update(id, { diarsipkanPada: sekarang, diperbaruiPada: sekarang })
}
