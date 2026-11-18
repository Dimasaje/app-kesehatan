/**
 * Halaman Pengaturan (Issue #14).
 * Seksi: Cadangan, Privasi & Keamanan, Tentang.
 */
import { useState } from 'react'
import { HalamanCadangan } from '../cadangan/HalamanCadangan'
import './HalamanPengaturan.css'

interface Props {
  onKunci(): void
}

export function HalamanPengaturan({ onKunci }: Props) {
  const [subLayar, setSubLayar] = useState<'menu' | 'cadangan'>('menu')

  if (subLayar === 'cadangan') {
    return <HalamanCadangan onNavigasiKembali={() => setSubLayar('menu')} />
  }

  return (
    <div className="layar-pengaturan">
      <header className="layar-pengaturan__header">
        <h1 className="layar-pengaturan__judul">Pengaturan</h1>
      </header>

      {/* Data & Cadangan */}
      <div className="pengaturan__grup">
        <span className="pengaturan__grup-label">Data &amp; Cadangan</span>
        <div className="pengaturan__daftar">
          <button
            type="button"
            className="pengaturan__item"
            onClick={() => setSubLayar('cadangan')}
          >
            <div className="pengaturan__item-teks">
              <span className="pengaturan__item-nama">Cadangan data</span>
              <span className="pengaturan__item-sub">Ekspor dan impor berkas .rekam</span>
            </div>
            <div className="pengaturan__item-kontrol">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="pengaturan__panah" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Keamanan */}
      <div className="pengaturan__grup">
        <span className="pengaturan__grup-label">Keamanan</span>
        <div className="pengaturan__daftar">
          <button
            type="button"
            className="pengaturan__item pengaturan__item--bahaya"
            onClick={onKunci}
          >
            <div className="pengaturan__item-teks">
              <span className="pengaturan__item-nama pengaturan__item-nama--bahaya">Kunci aplikasi</span>
              <span className="pengaturan__item-sub">Memerlukan PIN untuk membuka kembali</span>
            </div>
            <div className="pengaturan__item-kontrol">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="pengaturan__panah" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 9V7a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Privasi */}
      <div className="pengaturan__catatan-privasi">
        <span className="pengaturan__catatan-privasi-judul">Privasi &amp; keamanan data</span>
        <p className="pengaturan__catatan-privasi-teks">
          Semua data keluarga tersimpan hanya di perangkat ini dan tidak pernah dikirim ke server mana pun.
          Berkas cadangan dienkripsi end-to-end — tanpa kata sandi yang benar, isinya tidak dapat dibuka oleh siapa pun.
        </p>
      </div>

      {/* Tentang */}
      <div className="pengaturan__grup">
        <span className="pengaturan__grup-label">Tentang</span>
        <div className="pengaturan__daftar">
          <div className="pengaturan__item pengaturan__item--info">
            <div className="pengaturan__item-teks">
              <span className="pengaturan__item-nama">Rekam Keluarga</span>
              <span className="pengaturan__item-sub">Catatan kesehatan keluarga, lokal dan aman</span>
            </div>
            <div className="pengaturan__item-kontrol">
              <span className="chip-versi">v0.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
