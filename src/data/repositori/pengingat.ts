/**
 * Repositori pengingat (Issue #11).
 */
import { basisData, waktuSekarang } from '../db'
import type { Pengingat, JenisPengingat, Id } from '../skema'

export interface MasukanPengingat {
  anggotaId?: Id
  jenis: JenisPengingat
  judul: string
  jatuhTempo: string        // YYYY-MM-DD
  rujukanTabel?: Pengingat['rujukanTabel']
  rujukanId?: Id
}

export async function tambahPengingat(masukan: MasukanPengingat): Promise<number> {
  const sekarang = waktuSekarang()
  return basisData().pengingat.add({
    ...masukan,
    judul: masukan.judul.trim(),
    selesaiPada: null,
    dibuatPada: sekarang,
    diperbaruiPada: sekarang,
  })
}

export async function perbaruiPengingat(
  id: number,
  perubahan: Partial<MasukanPengingat>,
): Promise<void> {
  const tambalan: Partial<Pengingat> = { diperbaruiPada: waktuSekarang() }
  if (perubahan.judul !== undefined) tambalan.judul = perubahan.judul.trim()
  if (perubahan.jenis !== undefined) tambalan.jenis = perubahan.jenis
  if (perubahan.jatuhTempo !== undefined) tambalan.jatuhTempo = perubahan.jatuhTempo
  if (perubahan.anggotaId !== undefined) tambalan.anggotaId = perubahan.anggotaId
  await basisData().pengingat.update(id, tambalan)
}

export async function selesaikanPengingat(id: number): Promise<void> {
  await basisData().pengingat.update(id, {
    selesaiPada: waktuSekarang(),
    diperbaruiPada: waktuSekarang(),
  })
}

export async function hapusPengingat(id: number): Promise<void> {
  await basisData().pengingat.delete(id)
}

/** Pengingat aktif (belum selesai), urut jatuh tempo terdekat. */
export async function daftarPengingatAktif(anggotaId?: number): Promise<Pengingat[]> {
  let koleksi = basisData()
    .pengingat.filter((p) => p.selesaiPada === null)

  if (anggotaId !== undefined) {
    koleksi = koleksi.filter((p) => p.anggotaId === anggotaId)
  }

  const hasil = await koleksi.toArray()
  hasil.sort((a, b) => a.jatuhTempo.localeCompare(b.jatuhTempo))
  return hasil
}

/** Semua pengingat (aktif + selesai) per anggota. */
export async function daftarSemuaPengingat(anggotaId?: number): Promise<Pengingat[]> {
  const semua = await basisData().pengingat.toArray()
  const filtered = anggotaId !== undefined
    ? semua.filter((p) => p.anggotaId === anggotaId)
    : semua
  filtered.sort((a, b) => a.jatuhTempo.localeCompare(b.jatuhTempo))
  return filtered
}
