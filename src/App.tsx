import { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
  bacaStatusPenyimpanan,
  mintaPenyimpananTetap,
  type StatusPenyimpanan,
} from './data/db'
import {
  bersihkanDataUji,
  jalankanUjiSimpan,
  type HasilUjiPenyimpanan,
} from './data/diagnostik'

function ukuranByte(nilai: number | null): string {
  if (nilai === null) return 'tidak tersedia'
  if (nilai < 1024) return `${nilai} B`
  const satuan = ['KB', 'MB', 'GB']
  let angka = nilai / 1024
  let i = 0
  while (angka >= 1024 && i < satuan.length - 1) {
    angka /= 1024
    i += 1
  }
  return `${angka.toFixed(angka < 10 ? 1 : 0)} ${satuan[i]}`
}

export default function App() {
  const [status, setStatus] = useState<StatusPenyimpanan | null>(null)
  const [hasil, setHasil] = useState<HasilUjiPenyimpanan | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [daring, setDaring] = useState(() => navigator.onLine)
  const [terpasang, setTerpasang] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches,
  )

  const muatStatus = useCallback(async () => {
    setStatus(await bacaStatusPenyimpanan())
  }, [])

  useEffect(() => {
    // Memuat status dari IndexedDB adalah sinkronisasi dengan sistem luar
    // (penyimpanan), bukan turunan dari render.
    // oxlint-disable-next-line react/set-state-in-effect
    void muatStatus()
  }, [muatStatus])

  useEffect(() => {
    const naik = () => setDaring(true)
    const turun = () => setDaring(false)
    window.addEventListener('online', naik)
    window.addEventListener('offline', turun)
    return () => {
      window.removeEventListener('online', naik)
      window.removeEventListener('offline', turun)
    }
  }, [])

  useEffect(() => {
    const kueri = window.matchMedia('(display-mode: standalone)')
    const ubah = () => setTerpasang(kueri.matches)
    kueri.addEventListener('change', ubah)
    return () => kueri.removeEventListener('change', ubah)
  }, [])

  async function ujiSimpan() {
    setSibuk(true)
    try {
      setHasil(await jalankanUjiSimpan())
      await muatStatus()
    } finally {
      setSibuk(false)
    }
  }

  async function hapusUji() {
    setSibuk(true)
    try {
      await bersihkanDataUji()
      setHasil(null)
      await muatStatus()
    } finally {
      setSibuk(false)
    }
  }

  async function mintaTetap() {
    setSibuk(true)
    try {
      await mintaPenyimpananTetap()
      await muatStatus()
    } finally {
      setSibuk(false)
    }
  }

  return (
    <main className="halaman">
      <header className="sampul">
        <h1 className="sampul__judul">Rekam Keluarga</h1>
        <p className="sampul__catatan">
          Buku kesehatan keluarga. Semua data tersimpan di HP ini dan tidak pernah
          dikirim ke mana pun.
        </p>
      </header>

      <section className="kartu" aria-labelledby="judul-status">
        <h2 className="kartu__judul" id="judul-status">
          Status penyimpanan
        </h2>
        <p className="kartu__petunjuk">
          Layar sementara untuk memastikan fondasi aplikasi berjalan. Tampilan
          sebenarnya menyusul pada Issue #2 dan #7.
        </p>

        <dl className="daftar-status">
          <dt>Basis data</dt>
          <dd>
            <span
              className={`tanda ${status?.tersedia ? 'tanda--ok' : 'tanda--masalah'}`}
            >
              {status === null
                ? 'memeriksa…'
                : status.tersedia
                  ? 'aktif'
                  : 'tidak tersedia'}
            </span>
          </dd>

          <dt>Skema</dt>
          <dd>{status ? `v${status.versiSkema}` : '—'}</dd>

          <dt>Anggota</dt>
          <dd>{status ? status.jumlahAnggota : '—'}</dd>

          <dt>Terpakai</dt>
          <dd>{status ? ukuranByte(status.perkiraanPemakaian) : '—'}</dd>

          <dt>Kuota</dt>
          <dd>{status ? ukuranByte(status.kuota) : '—'}</dd>

          <dt>Penyimpanan tetap</dt>
          <dd>{status ? (status.tetap ? 'ya' : 'belum') : '—'}</dd>

          <dt>Mode</dt>
          <dd>{terpasang ? 'terpasang di layar utama' : 'tab browser'}</dd>

          <dt>Jaringan</dt>
          <dd>{daring ? 'daring' : 'luring (offline)'}</dd>
        </dl>

        <div className="tombol-baris">
          <button className="tombol" type="button" onClick={ujiSimpan} disabled={sibuk}>
            Uji simpan lalu baca ulang
          </button>
          <button
            className="tombol tombol--kedua"
            type="button"
            onClick={hapusUji}
            disabled={sibuk}
          >
            Hapus data uji
          </button>
          <button
            className="tombol tombol--kedua"
            type="button"
            onClick={mintaTetap}
            disabled={sibuk || status?.tetap !== false}
          >
            Minta penyimpanan tetap
          </button>
        </div>

        {hasil ? (
          <p className="pesan-uji" role="status">
            <span
              className={`tanda ${hasil.berhasil ? 'tanda--ok' : 'tanda--masalah'}`}
            >
              {hasil.berhasil ? 'Berhasil' : 'Gagal'}
            </span>
            <br />
            {hasil.pesan}
          </p>
        ) : null}
      </section>

      <p className="catatan-kaki">
        Aplikasi berjalan luring. Data hanya ada di perangkat ini — buat cadangan
        terenkripsi secara berkala (Issue #12).
      </p>
    </main>
  )
}
