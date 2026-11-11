/**
 * Halaman kelola anggota keluarga (Issue #6).
 * Daftar anggota aktif + tombol tambah, ubah, arsip, hapus permanen.
 */
import { useCallback, useEffect, useState } from 'react'
import type { Anggota } from '../data/skema'
import {
  arsipkanAnggota,
  daftarAnggotaAktif,
  hapusAnggotaPermanen,
  perbaruiAnggota,
  tambahAnggota,
} from '../data/repositori/anggota'
import type { MasukanAnggota } from '../data/repositori/anggota'
import { FormAnggota } from './FormAnggota'
import './HalamanAnggota.css'

type Mode = 'daftar' | 'tambah' | { ubah: Anggota }

const LABEL_HUBUNGAN: Record<string, string> = {
  diri: 'Diri sendiri', pasangan: 'Pasangan', anak: 'Anak',
  orangtua: 'Orang tua', lainnya: 'Lainnya',
}

function hitungUsia(tanggalLahir?: string): string {
  if (!tanggalLahir) return ''
  const lahir = new Date(tanggalLahir)
  const sekarang = new Date()
  let usia = sekarang.getFullYear() - lahir.getFullYear()
  const belumUlangTahun =
    sekarang.getMonth() < lahir.getMonth() ||
    (sekarang.getMonth() === lahir.getMonth() && sekarang.getDate() < lahir.getDate())
  if (belumUlangTahun) usia--
  return usia >= 0 ? `${usia} th` : ''
}

interface KartuAnggotaProps {
  anggota: Anggota
  onUbah(): void
  onArsip(): void
  onHapus(): void
  sibuk: boolean
}

function KartuAnggota({ anggota, onUbah, onArsip, onHapus, sibuk }: KartuAnggotaProps) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)
  const inisial = anggota.nama.trim().slice(0, 2).toUpperCase()
  const usia = hitungUsia(anggota.tanggalLahir)

  return (
    <article
      className="kartu-anggota"
      style={{ borderLeftColor: anggota.warnaSampul ?? 'var(--color-primary)' }}
    >
      <div
        className="kartu-anggota__avatar"
        style={{ background: anggota.warnaSampul ?? 'var(--color-primary)' }}
        aria-hidden="true"
      >
        {inisial}
      </div>
      <div className="kartu-anggota__info">
        <span className="kartu-anggota__nama">{anggota.nama}</span>
        <span className="kartu-anggota__meta">
          {LABEL_HUBUNGAN[anggota.hubungan] ?? anggota.hubungan}
          {usia && ` · ${usia}`}
          {anggota.golonganDarah && anggota.golonganDarah !== 'tidak-tahu'
            ? ` · ${anggota.golonganDarah}`
            : ''}
        </span>
        {anggota.kondisiKronis.length > 0 && (
          <span className="kartu-anggota__kronis">
            {anggota.kondisiKronis.join(', ')}
          </span>
        )}
      </div>
      <div className="kartu-anggota__aksi">
        <button
          type="button"
          className="btn btn-ghost kartu-anggota__btn"
          onClick={onUbah}
          disabled={sibuk}
          aria-label={`Ubah ${anggota.nama}`}
        >
          Ubah
        </button>
        <button
          type="button"
          className="btn btn-ghost kartu-anggota__btn"
          onClick={onArsip}
          disabled={sibuk}
          aria-label={`Arsipkan ${anggota.nama}`}
        >
          Arsip
        </button>
        {konfirmHapus ? (
          <div className="kartu-anggota__konfirm" role="alert">
            <span>Hapus permanen?</span>
            <button
              type="button"
              className="btn-hapus-ya"
              onClick={() => { setKonfirmHapus(false); onHapus() }}
              disabled={sibuk}
            >Ya, hapus</button>
            <button
              type="button"
              className="btn-hapus-tidak"
              onClick={() => setKonfirmHapus(false)}
            >Batal</button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost kartu-anggota__btn kartu-anggota__btn--hapus"
            onClick={() => setKonfirmHapus(true)}
            disabled={sibuk}
            aria-label={`Hapus ${anggota.nama}`}
          >
            Hapus
          </button>
        )}
      </div>
    </article>
  )
}

interface Props {
  onKembali(): void
}

export function HalamanAnggota({ onKembali }: Props) {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [mode, setMode] = useState<Mode>('daftar')
  const [sibuk, setSibuk] = useState(false)

  const muatDaftar = useCallback(async () => {
    setAnggotaList(await daftarAnggotaAktif())
  }, [])

  useEffect(() => { void muatDaftar() }, [muatDaftar])

  async function handleSimpan(data: MasukanAnggota) {
    setSibuk(true)
    try {
      if (typeof mode === 'object' && 'ubah' in mode) {
        await perbaruiAnggota(mode.ubah.id!, data)
      } else {
        await tambahAnggota(data)
      }
      await muatDaftar()
      setMode('daftar')
    } finally {
      setSibuk(false)
    }
  }

  async function handleArsip(id: number) {
    setSibuk(true)
    try { await arsipkanAnggota(id); await muatDaftar() }
    finally { setSibuk(false) }
  }

  async function handleHapus(id: number) {
    setSibuk(true)
    try { await hapusAnggotaPermanen(id); await muatDaftar() }
    finally { setSibuk(false) }
  }


  if (mode === 'tambah') {
    return (
      <FormAnggota
        sibuk={sibuk}
        onSimpan={handleSimpan}
        onBatal={() => setMode('daftar')}
      />
    )
  }

  if (typeof mode === 'object' && 'ubah' in mode) {
    return (
      <FormAnggota
        awal={mode.ubah}
        sibuk={sibuk}
        onSimpan={handleSimpan}
        onBatal={() => setMode('daftar')}
      />
    )
  }

  return (
    <div className="halaman-anggota">
      <header className="halaman-anggota__header">
        <button type="button" className="btn btn-ghost btn--kembali" onClick={onKembali}>
          ← Beranda
        </button>
        <h1 className="halaman-anggota__judul">Anggota keluarga</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setMode('tambah')}
          disabled={sibuk}
        >
          + Tambah
        </button>
      </header>

      {anggotaList.length === 0 ? (
        <p className="halaman-anggota__kosong">
          Belum ada anggota. Tambahkan anggota pertama keluarga Anda.
        </p>
      ) : (
        <ul className="halaman-anggota__daftar" role="list">
          {anggotaList.map((a) => (
            <li key={a.id}>
              <KartuAnggota
                anggota={a}
                sibuk={sibuk}
                onUbah={() => setMode({ ubah: a })}
                onArsip={() => a.id && handleArsip(a.id)}
                onHapus={() => a.id && handleHapus(a.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
