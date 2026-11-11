/**
 * Riwayat penyakit keluarga (Issue #10).
 * Tampilkan kondisi kronis + alergi per anggota, tandai yang menurun (herediter).
 * Data disimpan di field `kondisiKronis` Anggota — tidak perlu tabel baru.
 */
import { useCallback, useEffect, useState } from 'react'
import type { Anggota } from '../data/skema'
import { daftarSemuaAnggota, perbaruiAnggota } from '../data/repositori/anggota'
import './RiwayatPenyakit.css'

/** Kondisi yang umumnya dianggap dapat menurun (hanya panduan UI, bukan medis). */
const KONDISI_MENURUN = new Set([
  'diabetes', 'hipertensi', 'jantung', 'kanker', 'asma', 'stroke',
  'kolesterol', 'thalasemia', 'hemofilia', 'lupus', 'parkinson',
  'alzheimer', 'epilepsi',
])

function apakahMenurun(kondisi: string): boolean {
  const k = kondisi.toLowerCase()
  return [...KONDISI_MENURUN].some((m) => k.includes(m))
}

interface Props {
  onKembali(): void
}

interface KartuPenyakitProps {
  anggota: Anggota
  onTambahKondisi(id: number, kondisi: string): Promise<void>
  onHapusKondisi(id: number, kondisi: string): Promise<void>
  sibuk: boolean
}

function KartuPenyakit({ anggota, onTambahKondisi, onHapusKondisi, sibuk }: KartuPenyakitProps) {
  const [tambahMode, setTambahMode] = useState(false)
  const [nilaiTambah, setNilaiTambah] = useState('')

  async function handleTambah() {
    const kondisi = nilaiTambah.trim()
    if (!kondisi) return
    await onTambahKondisi(anggota.id!, kondisi)
    setNilaiTambah('')
    setTambahMode(false)
  }

  const inisial = anggota.nama.trim().slice(0, 2).toUpperCase()
  const warna = anggota.warnaSampul ?? 'var(--color-primary)'

  return (
    <article className="kartu-penyakit">
      <div className="kartu-penyakit__header">
        <div className="kartu-penyakit__avatar" style={{ background: warna }} aria-hidden="true">
          {inisial}
        </div>
        <div>
          <span className="kartu-penyakit__nama">{anggota.nama}</span>
        </div>
      </div>

      {/* Kondisi kronis */}
      <div className="kartu-penyakit__seksi">
        <span className="kartu-penyakit__label">Kondisi kronis</span>
        {anggota.kondisiKronis.length === 0 ? (
          <span className="kartu-penyakit__kosong">Tidak ada</span>
        ) : (
          <ul className="kartu-penyakit__daftar" role="list">
            {anggota.kondisiKronis.map((k) => (
              <li key={k} className="kartu-penyakit__tag-wrap">
                <span className={`kartu-penyakit__tag ${apakahMenurun(k) ? 'kartu-penyakit__tag--menurun' : ''}`}>
                  {k}
                  {apakahMenurun(k) && (
                    <span className="kartu-penyakit__ikon-menurun" title="Dapat menurun" aria-label="Dapat menurun">
                      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="11" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 6 Q8 8 11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M11 6 Q8 8 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="kartu-penyakit__btn-hapus"
                  onClick={() => onHapusKondisi(anggota.id!, k)}
                  disabled={sibuk}
                  aria-label={`Hapus kondisi ${k}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {tambahMode ? (
          <div className="kartu-penyakit__tambah-form">
            <input
              className="form-input kartu-penyakit__input"
              type="text"
              value={nilaiTambah}
              onChange={(e) => setNilaiTambah(e.target.value)}
              placeholder="Nama kondisi…"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleTambah() } }}
              disabled={sibuk}
            />
            <button type="button" className="btn btn-primary kartu-penyakit__btn-simpan"
              onClick={handleTambah} disabled={sibuk || !nilaiTambah.trim()}>
              Tambah
            </button>
            <button type="button" className="btn btn-ghost kartu-penyakit__btn-batal"
              onClick={() => { setTambahMode(false); setNilaiTambah('') }}>
              Batal
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost kartu-penyakit__btn-plus"
            onClick={() => setTambahMode(true)} disabled={sibuk}>
            + Tambah kondisi
          </button>
        )}
      </div>

      {/* Alergi */}
      {anggota.alergi.length > 0 && (
        <div className="kartu-penyakit__seksi">
          <span className="kartu-penyakit__label">Alergi</span>
          <div className="kartu-penyakit__alergi-list">
            {anggota.alergi.map((a) => (
              <span key={a} className="kartu-penyakit__alergi-tag">{a}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export function RiwayatPenyakit({ onKembali }: Props) {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    setAnggotaList(await daftarSemuaAnggota())
  }, [])

  useEffect(() => { void muat() }, [muat])

  async function handleTambahKondisi(id: number, kondisi: string) {
    const a = anggotaList.find((x) => x.id === id)
    if (!a) return
    setSibuk(true)
    try {
      await perbaruiAnggota(id, { kondisiKronis: [...a.kondisiKronis, kondisi] })
      await muat()
    } finally { setSibuk(false) }
  }

  async function handleHapusKondisi(id: number, kondisi: string) {
    const a = anggotaList.find((x) => x.id === id)
    if (!a) return
    setSibuk(true)
    try {
      await perbaruiAnggota(id, { kondisiKronis: a.kondisiKronis.filter((k) => k !== kondisi) })
      await muat()
    } finally { setSibuk(false) }
  }

  const aktif = anggotaList.filter((a) => a.diarsipkanPada === null)

  return (
    <div className="riwayat-penyakit">
      <header className="riwayat-penyakit__header">
        <button type="button" className="btn btn-ghost btn--kembali" onClick={onKembali}>
          ← Kembali
        </button>
        <h1 className="riwayat-penyakit__judul">Riwayat penyakit keluarga</h1>
      </header>

      <p className="riwayat-penyakit__petunjuk">
        Kondisi bertanda <span className="badge-menurun">MENURUN</span> dapat menurun ke generasi berikutnya.
      </p>

      {aktif.length === 0 ? (
        <p className="riwayat-penyakit__kosong">Belum ada anggota keluarga.</p>
      ) : (
        <div className="riwayat-penyakit__daftar">
          {aktif.map((a) => (
            <KartuPenyakit
              key={a.id}
              anggota={a}
              sibuk={sibuk}
              onTambahKondisi={handleTambahKondisi}
              onHapusKondisi={handleHapusKondisi}
            />
          ))}
        </div>
      )}
    </div>
  )
}
