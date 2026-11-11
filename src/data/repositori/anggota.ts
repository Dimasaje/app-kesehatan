import { basisData, waktuSekarang } from '../db'
import type { Anggota, GolonganDarah, Hubungan, JenisKelamin, TanggalKalender } from '../skema'

export interface MasukanAnggota {
  nama: string
  hubungan: Hubungan
  tanggalLahir?: TanggalKalender
  jenisKelamin?: JenisKelamin
  golonganDarah?: GolonganDarah
  alergi?: string[]
  kondisiKronis?: string[]
  catatan?: string
  warnaSampul?: string
}

function bersihkanTeks(nilai: string | undefined): string | undefined {
  const rapi = nilai?.trim()
  return rapi ? rapi : undefined
}

function bersihkanDaftar(nilai: string[] | undefined): string[] {
  return (nilai ?? []).map((item) => item.trim()).filter(Boolean)
}

/**
 * Anggota aktif, urut nama.
 * IndexedDB tidak mengindeks nilai null, jadi penyaringan arsip dilakukan di
 * memori; jumlah anggota satu keluarga kecil sehingga biayanya tidak terasa.
 */
export async function daftarAnggotaAktif(): Promise<Anggota[]> {
  return basisData()
    .anggota.orderBy('nama')
    .filter((anggota) => anggota.diarsipkanPada === null)
    .toArray()
}

/** Termasuk yang sudah diarsipkan, urut nama. Dipakai layar pengaturan. */
export async function daftarSemuaAnggota(): Promise<Anggota[]> {
  return basisData().anggota.orderBy('nama').toArray()
}

export async function ambilAnggota(id: number): Promise<Anggota | undefined> {
  return basisData().anggota.get(id)
}

export async function tambahAnggota(masukan: MasukanAnggota): Promise<number> {
  const nama = bersihkanTeks(masukan.nama)
  if (!nama) throw new Error('Nama anggota wajib diisi.')

  const sekarang = waktuSekarang()
  return basisData().anggota.add({
    nama,
    hubungan: masukan.hubungan,
    tanggalLahir: masukan.tanggalLahir,
    jenisKelamin: masukan.jenisKelamin,
    golonganDarah: masukan.golonganDarah,
    alergi: bersihkanDaftar(masukan.alergi),
    kondisiKronis: bersihkanDaftar(masukan.kondisiKronis),
    catatan: bersihkanTeks(masukan.catatan),
    warnaSampul: masukan.warnaSampul,
    dibuatPada: sekarang,
    diperbaruiPada: sekarang,
    diarsipkanPada: null,
  })
}

export async function perbaruiAnggota(
  id: number,
  perubahan: Partial<MasukanAnggota>,
): Promise<void> {
  const tambalan: Partial<Anggota> = { diperbaruiPada: waktuSekarang() }

  if (perubahan.nama !== undefined) {
    const nama = bersihkanTeks(perubahan.nama)
    if (!nama) throw new Error('Nama anggota wajib diisi.')
    tambalan.nama = nama
  }
  if (perubahan.hubungan !== undefined) tambalan.hubungan = perubahan.hubungan
  if (perubahan.tanggalLahir !== undefined) tambalan.tanggalLahir = perubahan.tanggalLahir
  if (perubahan.jenisKelamin !== undefined) tambalan.jenisKelamin = perubahan.jenisKelamin
  if (perubahan.golonganDarah !== undefined) tambalan.golonganDarah = perubahan.golonganDarah
  if (perubahan.alergi !== undefined) tambalan.alergi = bersihkanDaftar(perubahan.alergi)
  if (perubahan.kondisiKronis !== undefined) {
    tambalan.kondisiKronis = bersihkanDaftar(perubahan.kondisiKronis)
  }
  if (perubahan.catatan !== undefined) tambalan.catatan = bersihkanTeks(perubahan.catatan)
  if (perubahan.warnaSampul !== undefined) tambalan.warnaSampul = perubahan.warnaSampul

  await basisData().anggota.update(id, tambalan)
}

/** Mengarsipkan anggota tanpa menghapus riwayatnya. */
export async function arsipkanAnggota(id: number): Promise<void> {
  const sekarang = waktuSekarang()
  await basisData().anggota.update(id, { diarsipkanPada: sekarang, diperbaruiPada: sekarang })
}

export async function pulihkanAnggota(id: number): Promise<void> {
  await basisData().anggota.update(id, {
    diarsipkanPada: null,
    diperbaruiPada: waktuSekarang(),
  })
}

/**
 * Hapus permanen beserta seluruh data turunannya. Dipakai hanya setelah
 * pengguna menegaskan; pemanggil wajib menampilkan konfirmasi lebih dulu.
 */
export async function hapusAnggotaPermanen(id: number): Promise<void> {
  const db = basisData()
  await db.transaction(
    'rw',
    [db.anggota, db.kunjungan, db.lampiran, db.obat, db.vaksin, db.pengingat],
    async () => {
      const kunjunganIds = await db.kunjungan.where('anggotaId').equals(id).primaryKeys()
      if (kunjunganIds.length > 0) {
        await db.lampiran.where('kunjunganId').anyOf(kunjunganIds).delete()
      }
      await db.kunjungan.where('anggotaId').equals(id).delete()
      await db.obat.where('anggotaId').equals(id).delete()
      await db.vaksin.where('anggotaId').equals(id).delete()
      await db.pengingat.where('anggotaId').equals(id).delete()
      await db.anggota.delete(id)
    },
  )
}
