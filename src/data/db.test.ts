import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { BasisDataRekamKeluarga, NAMA_BASIS_DATA, VERSI_SKEMA, basisData } from './db'
import { daftarAnggotaAktif, hapusAnggotaPermanen, tambahAnggota } from './repositori/anggota'
import { ambilPengaturan, simpanPengaturan } from './repositori/pengaturan'

/**
 * Definisi skema v1 ditulis ulang di sini dengan sengaja: bunyi v1 tidak boleh
 * berubah lagi, dan uji ini harus gagal bila ada yang mengubahnya.
 */
const SKEMA_V1 = {
  anggota: '++id, nama, hubungan, tanggalLahir',
  kunjungan: '++id, anggotaId, tanggal, jenis',
  lampiran: '++id, kunjunganId, jenis',
  obat: '++id, anggotaId, nama',
  vaksin: '++id, anggotaId, tanggal',
  pengingat: '++id, anggotaId, jatuhTempo, selesaiPada',
  pengaturan: 'kunci',
}

const namaUnik = () => `uji-${Math.random().toString(36).slice(2)}`
const waktu = '2026-01-01T00:00:00.000Z'

async function buatBasisDataV1(nama: string): Promise<Dexie> {
  const lama = new Dexie(nama)
  lama.version(1).stores(SKEMA_V1)
  await lama.open()
  return lama
}

afterEach(async () => {
  // Jangan hapus basis data bersama: instance singleton Dexie tidak suka
  // dibuka ulang setelah basis datanya dihapus. Bersihkan isinya saja.
  const db = basisData()
  await db.open()
  for (const tabel of db.tables) await tabel.clear()
})

describe('skema dan migrasi', () => {
  it('membuka basis data baru pada versi skema terkini dengan 7 tabel', async () => {
    const db = new BasisDataRekamKeluarga(namaUnik())
    await db.open()

    expect(db.verno).toBe(VERSI_SKEMA)
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['anggota', 'kunjungan', 'lampiran', 'obat', 'pengingat', 'pengaturan', 'vaksin'].sort(),
    )

    db.close()
    await Dexie.delete(db.name)
  })

  it('mempertahankan data v1 dan mengisi kolom baru saat naik ke v2', async () => {
    const nama = namaUnik()
    const lama = await buatBasisDataV1(nama)
    await lama.table('anggota').add({
      nama: 'Sari',
      hubungan: 'diri',
      golonganDarah: 'O',
      alergi: ['Penisilin'],
      kondisiKronis: [],
      dibuatPada: waktu,
    })
    const kunjunganId = await lama.table('kunjungan').add({
      anggotaId: 1,
      jenis: 'klinik',
      tanggal: '2026-02-02T03:00:00.000Z',
      tempat: 'Klinik Sehat',
      keluhan: 'Demam tiga hari',
    })
    await lama.table('pengingat').add({
      anggotaId: 1,
      jenis: 'kontrol',
      judul: 'Kontrol ulang',
      jatuhTempo: '2026-03-01',
      dibuatPada: waktu,
    })
    lama.close()

    const db = new BasisDataRekamKeluarga(nama)
    await db.open()

    expect(db.verno).toBe(2)

    const [anggota] = await db.anggota.toArray()
    expect(anggota).toMatchObject({ nama: 'Sari', golonganDarah: 'O' })
    expect(anggota.diarsipkanPada).toBeNull()
    expect(anggota.diperbaruiPada).toBe(waktu)
    expect(anggota.alergi).toEqual(['Penisilin'])

    const [kunjungan] = await db.kunjungan.toArray()
    expect(kunjungan.id).toBe(kunjunganId)
    expect(kunjungan.keluhan).toBe('Demam tiga hari')
    expect(kunjungan.diarsipkanPada).toBeNull()
    // Stempel waktu diisi dari tanggal asli, bukan waktu migrasi.
    expect(kunjungan.diperbaruiPada).toBe('2026-02-02T03:00:00.000Z')

    const [pengingat] = await db.pengingat.toArray()
    expect(pengingat.selesaiPada).toBeNull()
    expect(pengingat.diperbaruiPada).toBe(waktu)

    // Indeks gabungan baru benar-benar bisa dipakai.
    const lewatIndeks = await db.kunjungan
      .where('[anggotaId+tanggal]')
      .equals([1, '2026-02-02T03:00:00.000Z'])
      .first()
    expect(lewatIndeks?.id).toBe(kunjunganId)

    db.close()
    await Dexie.delete(nama)
  })

  it('migrasi aman dijalankan dua kali (idempoten)', async () => {
    const nama = namaUnik()
    const lama = await buatBasisDataV1(nama)
    await lama.table('anggota').add({
      nama: 'Budi',
      hubungan: 'diri',
      alergi: [],
      kondisiKronis: [],
      dibuatPada: waktu,
    })
    lama.close()

    const pertama = new BasisDataRekamKeluarga(nama)
    await pertama.open()
    const setelahPertama = await pertama.anggota.toArray()
    pertama.close()

    const kedua = new BasisDataRekamKeluarga(nama)
    await kedua.open()
    const setelahKedua = await kedua.anggota.toArray()

    expect(setelahKedua).toEqual(setelahPertama)
    expect(kedua.verno).toBe(2)

    kedua.close()
    await Dexie.delete(nama)
  })
})

describe('repositori anggota', () => {
  it('menyimpan anggota lalu membacanya kembali setelah basis data ditutup', async () => {
    const id = await tambahAnggota({
      nama: '  Ayu  ',
      hubungan: 'anak',
      tanggalLahir: '2019-04-12',
      alergi: ['Debu', '  '],
    })

    const db = basisData()
    db.close()
    await db.open()

    const tersimpan = await db.anggota.get(id)
    expect(tersimpan?.nama).toBe('Ayu')
    expect(tersimpan?.alergi).toEqual(['Debu'])
    expect(tersimpan?.diarsipkanPada).toBeNull()
  })

  it('menolak nama kosong', async () => {
    await expect(tambahAnggota({ nama: '   ', hubungan: 'diri' })).rejects.toThrow(
      /Nama anggota wajib diisi/,
    )
  })

  it('mengurutkan anggota aktif menurut nama dan menyembunyikan yang diarsipkan', async () => {
    await tambahAnggota({ nama: 'Citra', hubungan: 'pasangan' })
    await tambahAnggota({ nama: 'Ani', hubungan: 'diri' })
    const budi = await tambahAnggota({ nama: 'Budi', hubungan: 'orangtua' })

    await basisData().anggota.update(budi, { diarsipkanPada: waktu })

    const aktif = await daftarAnggotaAktif()
    expect(aktif.map((a) => a.nama)).toEqual(['Ani', 'Citra'])
  })

  it('menghapus anggota beserta kunjungan dan lampirannya', async () => {
    const id = await tambahAnggota({ nama: 'Dewi', hubungan: 'diri' })
    const db = basisData()
    const kunjunganId = await db.kunjungan.add({
      anggotaId: id,
      jenis: 'lab',
      tanggal: waktu,
      tempat: 'Lab Sehat',
      keluhan: 'Cek darah',
      dibuatPada: waktu,
      diperbaruiPada: waktu,
      diarsipkanPada: null,
    })
    await db.lampiran.add({
      kunjunganId,
      nama: 'hasil.jpg',
      jenis: 'hasil-lab',
      mime: 'image/jpeg',
      ukuran: 3,
      blob: new Blob(['abc'], { type: 'image/jpeg' }),
      dibuatPada: waktu,
    })

    await hapusAnggotaPermanen(id)

    expect(await db.anggota.count()).toBe(0)
    expect(await db.kunjungan.count()).toBe(0)
    expect(await db.lampiran.count()).toBe(0)
  })
})

describe('pengaturan', () => {
  it('memberi nilai bawaan saat kunci belum ada', async () => {
    expect(await ambilPengaturan('cadangan.ingatkanSetelahHari')).toBe(30)
    expect(await ambilPengaturan('kunci.aktif')).toBe(false)
    expect(await ambilPengaturan('cadangan.terakhirPada')).toBeNull()
  })

  it('menjaga tipe nilai setelah disimpan dan dibaca ulang', async () => {
    await simpanPengaturan('kunci.aktif', true)
    await simpanPengaturan('cadangan.terakhirPada', '2026-11-11T06:00:00.000Z')

    const db = basisData()
    db.close()
    await db.open()

    expect(await ambilPengaturan('kunci.aktif')).toBe(true)
    expect(await ambilPengaturan('cadangan.terakhirPada')).toBe('2026-11-11T06:00:00.000Z')
  })

  it('memakai nama basis data yang tercatat di README', () => {
    expect(NAMA_BASIS_DATA).toBe('rekam-keluarga')
  })
})
