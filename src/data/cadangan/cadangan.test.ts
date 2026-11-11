/**
 * Pengujian Ekspor & Impor Cadangan Terenkripsi (TC-BCK-01 s/d TC-BCK-05).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { basisData } from '../db'
import {
  buatBerkasCadangan,
  dekripsiPayload,
  enkripsiPayload,
  MAGIC_CADANGAN,
  VERSI_FORMAT,
} from './index'
import {
  bacaPratinjauCadangan,
  pulihkanDariBerkas,
  pulihkanDariBundel,
} from './impor'

const PASSWORD_BENAR = 'KatasandiRahasia123'
const PASSWORD_SALAH = 'KatasandiSalah456'

beforeEach(async () => {
  const db = basisData()
  await db.open()
  for (const tabel of db.tables) await tabel.clear()
})

afterEach(async () => {
  const db = basisData()
  for (const tabel of db.tables) await tabel.clear()
})

describe('Kriptografi Cadangan (.rekam)', () => {
  it('berhasil enkripsi dan dekripsi payload byte dengan kata sandi yang cocok', async () => {
    const dataAsli = new TextEncoder().encode('Halo Rekam Keluarga Indonesia!')
    const berkasBytes = await enkripsiPayload(dataAsli, PASSWORD_BENAR)

    expect(berkasBytes.length).toBeGreaterThan(dataAsli.length + 33)
    // Cek magic bytes "REKM"
    expect(berkasBytes.slice(0, 4)).toEqual(MAGIC_CADANGAN)
    expect(berkasBytes[4]).toBe(VERSI_FORMAT)

    const hasilDekripsi = await dekripsiPayload(berkasBytes, PASSWORD_BENAR)
    const teksHasil = new TextDecoder().decode(hasilDekripsi)
    expect(teksHasil).toBe('Halo Rekam Keluarga Indonesia!')
  })

  it('gagal dekripsi jika kata sandi salah (TC-BCK-03)', async () => {
    const dataAsli = new TextEncoder().encode('Data rahasia kesehatan')
    const berkasBytes = await enkripsiPayload(dataAsli, PASSWORD_BENAR)

    await expect(dekripsiPayload(berkasBytes, PASSWORD_SALAH)).rejects.toThrow(
      'Kata sandi salah atau isi berkas telah dimodifikasi/rusak.',
    )
  })

  it('gagal jika file rusak atau bukan format .rekam yang valid', async () => {
    const berkasPalsu = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    await expect(dekripsiPayload(berkasPalsu, PASSWORD_BENAR)).rejects.toThrow(
      'ukuran terlalu kecil',
    )

    const berkasRusakMagic = new Uint8Array(50)
    await expect(dekripsiPayload(berkasRusakMagic, PASSWORD_BENAR)).rejects.toThrow(
      'Format berkas tidak dikenali',
    )
  })
})

describe('Ekspor dan Impor Cadangan Terenkripsi (TC-BCK-01, TC-BCK-04, TC-BCK-05)', () => {
  it('melakukan siklus penuh: isi database, ekspor, kosongkan, pulihkan identik beserta Blob', async () => {
    const db = basisData()

    // 1. Masukkan data dummy lengkap
    const anggotaId = await db.anggota.add({
      nama: 'Budi Santoso',
      hubungan: 'diri',
      tanggalLahir: '1985-05-12',
      golonganDarah: 'O',
      alergi: ['Udang', 'Debu'],
      kondisiKronis: ['Hipertensi'],
      dibuatPada: '2026-01-01T00:00:00.000Z',
      diperbaruiPada: '2026-01-01T00:00:00.000Z',
      diarsipkanPada: null,
    })

    const kunjunganId = await db.kunjungan.add({
      anggotaId: anggotaId as number,
      jenis: 'klinik',
      tanggal: '2026-03-01T08:00:00.000Z',
      tempat: 'Klinik Medika',
      dokter: 'dr. Herman',
      keluhan: 'Tekanan darah tinggi',
      diagnosis: 'Hipertensi stage 1',
      dibuatPada: '2026-03-01T08:00:00.000Z',
      diperbaruiPada: '2026-03-01T08:00:00.000Z',
      diarsipkanPada: null,
    })

    const dummyBlob = new Blob(['isi berkas foto resep obat'], { type: 'text/plain' })
    await db.lampiran.add({
      kunjunganId: kunjunganId as number,
      nama: 'resep-budi.txt',
      jenis: 'resep',
      mime: 'text/plain',
      ukuran: dummyBlob.size,
      blob: dummyBlob,
      dibuatPada: '2026-03-01T08:15:00.000Z',
    })

    await db.obat.add({
      anggotaId: anggotaId as number,
      nama: 'Amlodipine 5mg',
      dosis: '1x1 pagi',
      mulaiPada: '2026-03-01',
      selesaiPada: '2026-03-31',
      dibuatPada: '2026-03-01T08:00:00.000Z',
      diperbaruiPada: '2026-03-01T08:00:00.000Z',
      diarsipkanPada: null,
    })

    await db.pengingat.add({
      anggotaId: anggotaId as number,
      jenis: 'kontrol',
      judul: 'Kontrol tensi dr. Herman',
      jatuhTempo: '2026-04-01',
      selesaiPada: null,
      dibuatPada: '2026-03-01T08:00:00.000Z',
      diperbaruiPada: '2026-03-01T08:00:00.000Z',
    })

    // 2. Ekspor cadangan terenkripsi (TC-BCK-01)
    const { berkasBytes, ringkasan } = await buatBerkasCadangan(PASSWORD_BENAR)
    expect(ringkasan.anggota).toBe(1)
    expect(ringkasan.kunjungan).toBe(1)
    expect(ringkasan.lampiran).toBe(1)
    expect(ringkasan.obat).toBe(1)
    expect(ringkasan.pengingat).toBe(1)
    expect(berkasBytes.length).toBeGreaterThan(100)

    // Periksa pengaturan 'cadangan.terakhirPada' terisi
    const barisSetting = await db.pengaturan.get('cadangan.terakhirPada')
    expect(barisSetting?.nilai).toBeDefined()

    // 3. Baca pratinjau sebelum restore
    const pratinjau = await bacaPratinjauCadangan(berkasBytes, PASSWORD_BENAR)
    expect(pratinjau.ringkasan.anggota).toBe(1)
    expect(pratinjau.ringkasan.lampiran).toBe(1)

    // 4. Kosongkan database sepenuhnya (simulasi perangkat baru / reset)
    for (const tabel of db.tables) await tabel.clear()
    expect(await db.anggota.count()).toBe(0)
    expect(await db.kunjungan.count()).toBe(0)
    expect(await db.lampiran.count()).toBe(0)

    // 5. Pulihkan dari berkas cadangan (TC-BCK-04)
    await pulihkanDariBerkas(berkasBytes, PASSWORD_BENAR)

    // 6. Verifikasi kepulihan data 100%
    const anggotaPulih = await db.anggota.toArray()
    expect(anggotaPulih.length).toBe(1)
    expect(anggotaPulih[0].nama).toBe('Budi Santoso')
    expect(anggotaPulih[0].kondisiKronis).toEqual(['Hipertensi'])

    const lampiranPulih = await db.lampiran.toArray()
    expect(lampiranPulih.length).toBe(1)
    expect(lampiranPulih[0].nama).toBe('resep-budi.txt')

    // Verifikasi isi Blob berhasil direkonstruksi
    const teksBlobPulih = await lampiranPulih[0].blob.text()
    expect(teksBlobPulih).toBe('isi berkas foto resep obat')

    const obatPulih = await db.obat.toArray()
    expect(obatPulih[0].nama).toBe('Amlodipine 5mg')

    const pengingatPulih = await db.pengingat.toArray()
    expect(pengingatPulih[0].judul).toBe('Kontrol tensi dr. Herman')
  })

  it('mempertahankan PIN lokal bila pertahankanKunciLokal aktif (TC-BCK-05)', async () => {
    const db = basisData()

    // Database tujuan sudah punya PIN terpasang
    await db.pengaturan.put({
      kunci: 'kunci.aktif',
      nilai: true,
      diperbaruiPada: '2026-01-01T00:00:00.000Z',
    })
    await db.pengaturan.put({
      kunci: 'kunci.hash',
      nilai: 'PIN_HASH_LOKAL_BARU',
      diperbaruiPada: '2026-01-01T00:00:00.000Z',
    })

    // Cadangan berisi PIN lama
    const bundelDummy = {
      versiSkema: 1,
      dieksporPada: '2026-01-01T00:00:00.000Z',
      tabel: {
        anggota: [],
        kunjungan: [],
        lampiran: [],
        obat: [],
        vaksin: [],
        pengingat: [],
        pengaturan: [
          {
            kunci: 'kunci.hash',
            nilai: 'PIN_HASH_DARI_CADANGAN',
            diperbaruiPada: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    }

    await pulihkanDariBundel(bundelDummy, { mode: 'timpa', pertahankanKunciLokal: true })

    const settingHash = await db.pengaturan.get('kunci.hash')
    // Hash lokal tidak boleh tertimpa
    expect(settingHash?.nilai).toBe('PIN_HASH_LOKAL_BARU')
  })
})
