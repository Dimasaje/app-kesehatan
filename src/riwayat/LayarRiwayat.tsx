/**
 * Layar Riwayat (tab utama).
 * Pemilih anggota → Timeline kunjungan per anggota.
 * Tombol "Riwayat Penyakit" di header buka RiwayatPenyakit keluarga.
 */
import { useCallback, useEffect, useState } from 'react'
import type { Anggota } from '../data/skema'
import { daftarAnggotaAktif } from '../data/repositori/anggota'
import { Timeline } from '../kunjungan/Timeline'
import { RiwayatPenyakit } from '../penyakit/RiwayatPenyakit'
import './LayarRiwayat.css'

type SubLayar = 'pilih' | { timeline: Anggota } | 'penyakit'

function AvatarAnggota({ anggota }: { anggota: Anggota }) {
  const inisial = anggota.nama.trim().slice(0, 2).toUpperCase()
  const warna = anggota.warnaSampul ?? 'var(--color-primary)'
  return (
    <div className="layar-riwayat__avatar" style={{ background: warna }} aria-hidden="true">
      {inisial}
    </div>
  )
}

export function LayarRiwayat() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [layar, setLayar] = useState<SubLayar>('pilih')
  const [muat, setMuat] = useState(true)

  const muatAnggota = useCallback(async () => {
    setMuat(true)
    try { setAnggotaList(await daftarAnggotaAktif()) }
    finally { setMuat(false) }
  }, [])

  useEffect(() => { void muatAnggota() }, [muatAnggota])

  if (layar === 'penyakit') {
    return <RiwayatPenyakit onKembali={() => setLayar('pilih')} />
  }

  if (typeof layar === 'object' && 'timeline' in layar) {
    return (
      <Timeline
        anggota={layar.timeline}
        onKembali={() => setLayar('pilih')}
        onTambah={() => { /* Timeline handles add internally */ }}
      />
    )
  }

  return (
    <div className="layar-riwayat">
      <header className="layar-riwayat__header">
        <h1 className="layar-riwayat__judul">Riwayat</h1>
        <button
          type="button"
          className="btn btn-ghost layar-riwayat__btn-penyakit"
          onClick={() => setLayar('penyakit')}
        >
          Riwayat penyakit
        </button>
      </header>

      <p className="layar-riwayat__petunjuk">Pilih anggota untuk melihat timeline kunjungan.</p>

      {muat ? (
        <p className="layar-riwayat__muat">Memuat…</p>
      ) : anggotaList.length === 0 ? (
        <p className="layar-riwayat__kosong">Belum ada anggota keluarga. Tambah dulu di Beranda.</p>
      ) : (
        <ul className="layar-riwayat__daftar" role="list">
          {anggotaList.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="layar-riwayat__item"
                onClick={() => setLayar({ timeline: a })}
              >
                <AvatarAnggota anggota={a} />
                <div className="layar-riwayat__info">
                  <span className="layar-riwayat__nama">{a.nama}</span>
                  {a.kondisiKronis.length > 0 && (
                    <span className="layar-riwayat__kronis">
                      {a.kondisiKronis.join(', ')}
                    </span>
                  )}
                </div>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="layar-riwayat__chevron" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
