/**
 * Layar Beranda (Issue #7).
 * - Daftar anggota sebagai sampul buku
 * - Bagian "Perlu perhatian" (kondisi kronis)
 * - Kartu pengingat mendatang
 */
import { useState } from 'react'
import type { Anggota, Pengingat } from '../data/skema'
import { HalamanAnggota } from '../anggota/HalamanAnggota'
import { useBeranda } from './useBeranda'
import './Beranda.css'

const LABEL_HUBUNGAN: Record<string, string> = {
  diri: 'Diri sendiri', pasangan: 'Pasangan', anak: 'Anak',
  orangtua: 'Orang tua', lainnya: 'Lainnya',
}

const LABEL_PENGINGAT: Record<string, string> = {
  kontrol: 'Kontrol', imunisasi: 'Imunisasi',
  'obat-habis': 'Obat habis', lainnya: 'Pengingat',
}

function selisihHari(tanggal: string): number {
  const tujuan = new Date(tanggal)
  const sekarang = new Date()
  sekarang.setHours(0, 0, 0, 0)
  tujuan.setHours(0, 0, 0, 0)
  return Math.round((tujuan.getTime() - sekarang.getTime()) / 86_400_000)
}

function labelHari(h: number): string {
  if (h === 0) return 'Hari ini'
  if (h === 1) return 'Besok'
  if (h < 0) return `${-h} hari lalu`
  return `${h} hari lagi`
}

function SampulBuku({ anggota, onClick }: { anggota: Anggota; onClick(): void }) {
  const inisial = anggota.nama.trim().slice(0, 2).toUpperCase()
  const warna = anggota.warnaSampul ?? 'var(--color-primary)'

  return (
    <button
      type="button"
      className="sampul-buku"
      style={{ '--warna-sampul': warna } as React.CSSProperties}
      onClick={onClick}
      aria-label={`Buka profil ${anggota.nama}`}
    >
      <div className="sampul-buku__punggung" aria-hidden="true" />
      <div className="sampul-buku__muka">
        <div className="sampul-buku__avatar" aria-hidden="true">{inisial}</div>
        <span className="sampul-buku__nama">{anggota.nama}</span>
        <span className="sampul-buku__peran">
          {LABEL_HUBUNGAN[anggota.hubungan] ?? anggota.hubungan}
        </span>
        {anggota.kondisiKronis.length > 0 && (
          <span className="sampul-buku__tanda-kronis" aria-label="Ada kondisi kronis" title={anggota.kondisiKronis.join(', ')}>
            ⚠
          </span>
        )}
      </div>
    </button>
  )
}

function KartuPengingat({ pengingat }: { pengingat: Pengingat }) {
  const h = selisihHari(pengingat.jatuhTempo)
  const urgen = h <= 3

  return (
    <div className={`kartu-pengingat ${urgen ? 'kartu-pengingat--urgen' : ''}`}>
      <span className="kartu-pengingat__jenis">
        {LABEL_PENGINGAT[pengingat.jenis] ?? pengingat.jenis}
      </span>
      <span className="kartu-pengingat__judul">{pengingat.judul}</span>
      <span className="kartu-pengingat__hari" aria-label={`Jatuh tempo: ${labelHari(h)}`}>
        {labelHari(h)}
      </span>
    </div>
  )
}

interface Props {
  onKunci(): void
  onNavigasi(tab: 'beranda' | 'riwayat' | 'pengingat' | 'pengaturan'): void
}

type Layar = 'beranda' | 'anggota'

export function Beranda({ onKunci, onNavigasi }: Props) {
  const { anggota, pengingat, memuatAnggota, muat } = useBeranda()
  const [layar, setLayar] = useState<Layar>('beranda')

  if (layar === 'anggota') {
    return (
      <HalamanAnggota onKembali={() => { setLayar('beranda'); void muat() }} />
    )
  }

  const perluPerhatian = anggota.filter((a) => a.kondisiKronis.length > 0)

  return (
    <div className="beranda">
      {/* Header sampul */}
      <header className="beranda__header">
        <div className="beranda__judul-wrap">
          <h1 className="beranda__judul">Rekam Keluarga</h1>
          <p className="beranda__sub">Semua data tersimpan di perangkat ini.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost beranda__btn-kunci"
          onClick={onKunci}
          aria-label="Kunci aplikasi"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M7 9V6a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      {/* Daftar anggota sebagai sampul buku */}
      <section aria-labelledby="label-anggota">
        <div className="beranda__seksi-header">
          <h2 className="beranda__seksi-judul" id="label-anggota">Anggota keluarga</h2>
          <button
            type="button"
            className="btn btn-ghost beranda__btn-kelola"
            onClick={() => setLayar('anggota')}
          >
            Kelola
          </button>
        </div>

        {memuatAnggota ? (
          <p className="beranda__muat">Memuat…</p>
        ) : anggota.length === 0 ? (
          <div className="beranda__kosong">
            <p>Belum ada anggota keluarga.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setLayar('anggota')}
            >
              Tambah anggota
            </button>
          </div>
        ) : (
          <div className="beranda__rak" role="list" aria-label="Daftar anggota keluarga">
            {anggota.map((a) => (
              <div key={a.id} role="listitem">
                <SampulBuku anggota={a} onClick={() => setLayar('anggota')} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Perlu perhatian */}
      {perluPerhatian.length > 0 && (
        <section className="beranda__seksi" aria-labelledby="label-perhatian">
          <h2 className="beranda__seksi-judul" id="label-perhatian">Perlu perhatian</h2>
          <ul className="beranda__perhatian-list" role="list">
            {perluPerhatian.map((a) => (
              <li key={a.id} className="beranda__perhatian-item">
                <span className="beranda__perhatian-nama">{a.nama}</span>
                <span className="beranda__perhatian-kronis">
                  {a.kondisiKronis.join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pengingat mendatang */}
      {pengingat.length > 0 && (
        <section className="beranda__seksi" aria-labelledby="label-pengingat">
          <div className="beranda__seksi-header">
            <h2 className="beranda__seksi-judul" id="label-pengingat">Pengingat mendatang</h2>
            <button
              type="button"
              className="btn btn-ghost beranda__btn-kelola"
              onClick={() => onNavigasi('pengingat')}
            >
              Kelola
            </button>
          </div>
          <div className="beranda__pengingat-list" role="list">
            {pengingat.map((p) => (
              <div key={p.id} role="listitem">
                <KartuPengingat pengingat={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {pengingat.length === 0 && (
        <button
          type="button"
          className="dashed-action"
          onClick={() => onNavigasi('pengingat')}
        >
          + Tambah pengingat
        </button>
      )}
    </div>
  )
}
