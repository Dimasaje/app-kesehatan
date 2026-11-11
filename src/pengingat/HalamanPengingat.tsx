/**
 * Halaman kelola pengingat (Issue #11).
 * Daftar semua pengingat aktif per anggota, tambah/ubah/hapus/selesai.
 */
import { useCallback, useEffect, useState } from 'react'
import type { Anggota, Pengingat } from '../data/skema'
import {
  daftarSemuaPengingat,
  hapusPengingat,
  perbaruiPengingat,
  selesaikanPengingat,
  tambahPengingat,
} from '../data/repositori/pengingat'
import type { MasukanPengingat } from '../data/repositori/pengingat'
import { daftarAnggotaAktif } from '../data/repositori/anggota'
import { FormPengingat } from './FormPengingat'
import './HalamanPengingat.css'

const LABEL_JENIS: Record<string, string> = {
  kontrol: 'Kontrol', imunisasi: 'Imunisasi',
  'obat-habis': 'Obat habis', lainnya: 'Lainnya',
}

function selisihHari(tanggal: string): number {
  const tujuan = new Date(tanggal)
  const sekarang = new Date()
  sekarang.setHours(0, 0, 0, 0)
  tujuan.setHours(0, 0, 0, 0)
  return Math.round((tujuan.getTime() - sekarang.getTime()) / 86_400_000)
}

function labelHari(h: number): string {
  if (h < 0) return `${-h} hari lalu`
  if (h === 0) return 'Hari ini'
  if (h === 1) return 'Besok'
  return `${h} hari lagi`
}

/** Jatuh tempo ≤ 3 hari = mendesak */
function mendesak(jatuhTempo: string): boolean {
  return selisihHari(jatuhTempo) <= 3
}

type Mode = 'daftar' | 'tambah' | { ubah: Pengingat }

interface KartuPengingatProps {
  pengingat: Pengingat
  namaAnggota: string
  onUbah(): void
  onSelesai(): void
  onHapus(): void
  sibuk: boolean
}

function KartuPengingat({ pengingat, namaAnggota, onUbah, onSelesai, onHapus, sibuk }: KartuPengingatProps) {
  const [konfirm, setKonfirm] = useState(false)
  const h = selisihHari(pengingat.jatuhTempo)
  const urgen = mendesak(pengingat.jatuhTempo)
  const selesai = pengingat.selesaiPada !== null

  return (
    <article className={`kartu-pengingat-kelola ${urgen && !selesai ? 'kartu-pengingat-kelola--urgen' : ''} ${selesai ? 'kartu-pengingat-kelola--selesai' : ''}`}>
      {/* Aksen mendesak — garis border kiri tebal dari design system */}
      <div className="kartu-pengingat-kelola__isi">
        <div className="kartu-pengingat-kelola__atas">
          <span className="tag">{LABEL_JENIS[pengingat.jenis] ?? pengingat.jenis}</span>
          <time
            className={`date-stamp ${urgen && !selesai ? 'date-stamp--urgen' : ''}`}
            dateTime={pengingat.jatuhTempo}
          >
            {labelHari(h)}
          </time>
        </div>

        <p className="kartu-pengingat-kelola__judul">{pengingat.judul}</p>

        {namaAnggota && (
          <p className="kartu-pengingat-kelola__anggota">{namaAnggota}</p>
        )}
      </div>

      <div className="kartu-pengingat-kelola__aksi">
        {!selesai && (
          <>
            <button
              type="button"
              className="btn btn-secondary kartu-pengingat-kelola__btn"
              onClick={onSelesai}
              disabled={sibuk}
              aria-label={`Tandai selesai: ${pengingat.judul}`}
            >
              Selesai
            </button>
            <button
              type="button"
              className="btn btn-ghost kartu-pengingat-kelola__btn"
              onClick={onUbah}
              disabled={sibuk}
            >
              Ubah
            </button>
          </>
        )}
        {konfirm ? (
          <div className="kartu-pengingat-kelola__konfirm">
            <button type="button" className="btn-hapus-ya" onClick={() => { setKonfirm(false); onHapus() }} disabled={sibuk}>Hapus</button>
            <button type="button" className="btn-hapus-tidak" onClick={() => setKonfirm(false)}>Batal</button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost kartu-pengingat-kelola__btn kartu-pengingat-kelola__btn--hapus"
            onClick={() => setKonfirm(true)}
            disabled={sibuk}
            aria-label={`Hapus pengingat: ${pengingat.judul}`}
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

export function HalamanPengingat({ onKembali }: Props) {
  const [pengingatList, setPengingatList] = useState<Pengingat[]>([])
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [mode, setMode] = useState<Mode>('daftar')
  const [sibuk, setSibuk] = useState(false)
  const [tampilSelesai, setTampilSelesai] = useState(false)

  const muat = useCallback(async () => {
    const [p, a] = await Promise.all([
      daftarSemuaPengingat(),
      daftarAnggotaAktif(),
    ])
    setPengingatList(p)
    setAnggotaList(a)
  }, [])

  useEffect(() => { void muat() }, [muat])

  function namaAnggota(id?: number): string {
    if (!id) return ''
    return anggotaList.find((a) => a.id === id)?.nama ?? ''
  }

  async function handleSimpan(data: MasukanPengingat) {
    setSibuk(true)
    try {
      if (typeof mode === 'object' && 'ubah' in mode) {
        await perbaruiPengingat(mode.ubah.id!, data)
      } else {
        await tambahPengingat(data)
      }
      await muat()
      setMode('daftar')
    } finally { setSibuk(false) }
  }

  async function handleSelesai(id: number) {
    setSibuk(true)
    try { await selesaikanPengingat(id); await muat() }
    finally { setSibuk(false) }
  }

  async function handleHapus(id: number) {
    setSibuk(true)
    try { await hapusPengingat(id); await muat() }
    finally { setSibuk(false) }
  }

  if (mode === 'tambah') {
    return <FormPengingat anggotaList={anggotaList} sibuk={sibuk} onSimpan={handleSimpan} onBatal={() => setMode('daftar')} />
  }
  if (typeof mode === 'object' && 'ubah' in mode) {
    return <FormPengingat awal={mode.ubah} anggotaList={anggotaList} sibuk={sibuk} onSimpan={handleSimpan} onBatal={() => setMode('daftar')} />
  }

  const aktif = pengingatList.filter((p) => p.selesaiPada === null)
  const selesai = pengingatList.filter((p) => p.selesaiPada !== null)
  const urgenList = aktif.filter((p) => mendesak(p.jatuhTempo))
  const biasaList = aktif.filter((p) => !mendesak(p.jatuhTempo))

  return (
    <div className="halaman-pengingat">
      <header className="halaman-pengingat__header">
        <button type="button" className="btn btn-ghost btn--kembali" onClick={onKembali}>
          ← Beranda
        </button>
        <h1 className="halaman-pengingat__judul">Pengingat</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setMode('tambah')}
          disabled={sibuk}
        >
          + Tambah
        </button>
      </header>

      {/* Mendesak */}
      {urgenList.length > 0 && (
        <section aria-labelledby="label-urgen">
          <h2 className="halaman-pengingat__seksi-judul halaman-pengingat__seksi-judul--urgen" id="label-urgen">
            <span className="urgen-aksen" aria-hidden="true" />
            Mendesak
          </h2>
          <ul className="halaman-pengingat__daftar" role="list">
            {urgenList.map((p) => (
              <li key={p.id}>
                <KartuPengingat
                  pengingat={p}
                  namaAnggota={namaAnggota(p.anggotaId)}
                  sibuk={sibuk}
                  onUbah={() => setMode({ ubah: p })}
                  onSelesai={() => handleSelesai(p.id!)}
                  onHapus={() => handleHapus(p.id!)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mendatang */}
      {biasaList.length > 0 && (
        <section aria-labelledby="label-mendatang">
          <h2 className="halaman-pengingat__seksi-judul" id="label-mendatang">Mendatang</h2>
          <ul className="halaman-pengingat__daftar" role="list">
            {biasaList.map((p) => (
              <li key={p.id}>
                <KartuPengingat
                  pengingat={p}
                  namaAnggota={namaAnggota(p.anggotaId)}
                  sibuk={sibuk}
                  onUbah={() => setMode({ ubah: p })}
                  onSelesai={() => handleSelesai(p.id!)}
                  onHapus={() => handleHapus(p.id!)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {aktif.length === 0 && (
        <div className="halaman-pengingat__kosong">
          <p>Tidak ada pengingat aktif.</p>
          <button type="button" className="dashed-action" onClick={() => setMode('tambah')} disabled={sibuk}>
            + Tambah pengingat
          </button>
        </div>
      )}

      {/* Toggle selesai */}
      {selesai.length > 0 && (
        <section>
          <button
            type="button"
            className="btn btn-ghost halaman-pengingat__toggle"
            onClick={() => setTampilSelesai((v) => !v)}
          >
            {tampilSelesai ? 'Sembunyikan' : `Tampilkan ${selesai.length} selesai`}
          </button>
          {tampilSelesai && (
            <ul className="halaman-pengingat__daftar" role="list">
              {selesai.map((p) => (
                <li key={p.id}>
                  <KartuPengingat
                    pengingat={p}
                    namaAnggota={namaAnggota(p.anggotaId)}
                    sibuk={sibuk}
                    onUbah={() => setMode({ ubah: p })}
                    onSelesai={() => handleSelesai(p.id!)}
                    onHapus={() => handleHapus(p.id!)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
