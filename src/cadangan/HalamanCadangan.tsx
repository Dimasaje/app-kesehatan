/**
 * Halaman Cadangan — ekspor + impor berkas .rekam (Issue #14).
 * CSS dari design/LayarCadangan.css diadaptasi ke src/cadangan/HalamanCadangan.css
 */
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  bacaPratinjauCadangan,
  buatBerkasCadangan,
  formatNamaBerkasCadangan,
  pulihkanDariBundel,
  unduhBerkasCadangan,
} from '../data/cadangan'
import type { BundelCadangan, RingkasanCadangan } from '../data/cadangan'
import { ambilPengaturan } from '../data/repositori/pengaturan'
import './HalamanCadangan.css'

/* ---- Helpers ---- */

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function formatWaktu(iso: string): string {
  try {
    const d = new Date(iso)
    const hari = Math.round((Date.now() - d.getTime()) / 86_400_000)
    if (hari === 0) return 'Hari ini'
    if (hari === 1) return 'Kemarin'
    return `${hari} hari lalu (${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`
  } catch {
    return iso
  }
}

function RingkasanCadanganView({ r }: { r: RingkasanCadangan }) {
  return (
    <dl className="ringkasan-cadangan">
      {([
        ['Anggota', r.anggota],
        ['Kunjungan', r.kunjungan],
        ['Lampiran', r.lampiran],
        ['Obat', r.obat],
        ['Vaksin', r.vaksin],
        ['Pengingat', r.pengingat],
      ] as [string, number][]).map(([label, val]) => (
        <div key={label} className="ringkasan-cadangan__baris">
          <dt>{label}</dt>
          <dd>{val}</dd>
        </div>
      ))}
      {r.ukuranByte > 0 && (
        <div className="ringkasan-cadangan__baris">
          <dt>Ukuran</dt>
          <dd>{formatBytes(r.ukuranByte)}</dd>
        </div>
      )}
    </dl>
  )
}

/* ---- Spinner ---- */
function Spinner() {
  return <span className="cadangan__progres-spinner" aria-hidden="true" />
}

/* ============================================================
   PANEL EKSPOR
   ============================================================ */
type StatusEkspor = 'idle' | 'proses' | 'sukses' | 'gagal'

function PanelEkspor({ onSukses }: { onSukses(): void }) {
  const [kataSandi, setKataSandi] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [status, setStatus] = useState<StatusEkspor>('idle')
  const [pesan, setPesan] = useState('')
  const [ringkasan, setRingkasan] = useState<RingkasanCadangan | null>(null)

  async function handleEkspor(e: FormEvent) {
    e.preventDefault()
    if (kataSandi.length < 4) { setPesan('Kata sandi minimal 4 karakter.'); return }
    if (kataSandi !== konfirmasi) { setPesan('Konfirmasi kata sandi tidak cocok.'); return }
    setPesan('')
    setStatus('proses')
    try {
      const { berkasBytes, ringkasan: r } = await buatBerkasCadangan(kataSandi)
      unduhBerkasCadangan(berkasBytes, formatNamaBerkasCadangan())
      setRingkasan(r)
      setStatus('sukses')
      onSukses()
    } catch (err) {
      setPesan(err instanceof Error ? err.message : 'Ekspor gagal.')
      setStatus('gagal')
    }
  }

  if (status === 'sukses' && ringkasan) {
    return (
      <div className="panel-cadangan">
        <div className="panel-cadangan__sukses" role="status">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="panel-cadangan__ikon-sukses">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="panel-cadangan__sukses-teks">Cadangan berhasil diunduh.</p>
        </div>
        <RingkasanCadanganView r={ringkasan} />
        <button type="button" className="btn btn-ghost" onClick={() => { setStatus('idle'); setKataSandi(''); setKonfirmasi(''); setRingkasan(null) }}>
          Buat cadangan lain
        </button>
      </div>
    )
  }

  return (
    <form className="panel-cadangan" onSubmit={handleEkspor} noValidate>
      <p className="panel-cadangan__info">
        Semua data dikemas dan dienkripsi ke berkas <code>.rekam</code>. Simpan di tempat aman.
      </p>

      {pesan && <p className="panel-cadangan__galat" role="alert">{pesan}</p>}

      {status === 'proses' && (
        <div className="cadangan__progres" role="status" aria-live="polite">
          <Spinner />
          <span>Membuat cadangan…</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="cd-sandi" className="field__label">
          Kata sandi cadangan <span aria-hidden="true">*</span>
        </label>
        <input id="cd-sandi" className="field__input" type="password"
          value={kataSandi} onChange={(e) => setKataSandi(e.target.value)}
          autoComplete="new-password" required disabled={status === 'proses'} />
      </div>

      <div className="field">
        <label htmlFor="cd-konfirm" className="field__label">
          Konfirmasi kata sandi <span aria-hidden="true">*</span>
        </label>
        <input id="cd-konfirm" className="field__input" type="password"
          value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)}
          autoComplete="new-password" required disabled={status === 'proses'} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === 'proses'}>
        Buat dan unduh cadangan
      </button>
    </form>
  )
}

/* ============================================================
   PANEL IMPOR
   ============================================================ */
type StepImpor = 'pilih' | 'pratinjau' | 'proses' | 'sukses' | 'gagal'

function PanelImpor({ onSukses }: { onSukses(): void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [berkas, setBerkas] = useState<File | null>(null)
  const [kataSandi, setKataSandi] = useState('')
  const [step, setStep] = useState<StepImpor>('pilih')
  const [pesan, setPesan] = useState('')
  const [pratinjau, setPratinjau] = useState<RingkasanCadangan | null>(null)
  const [bundel, setBundel] = useState<BundelCadangan | null>(null)
  const [setuju, setSetuju] = useState(false)

  function reset() {
    setBerkas(null); setKataSandi(''); setStep('pilih')
    setPesan(''); setPratinjau(null); setBundel(null); setSetuju(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handlePratinjau(e: FormEvent) {
    e.preventDefault()
    if (!berkas) { setPesan('Pilih berkas .rekam terlebih dahulu.'); return }
    if (!kataSandi) { setPesan('Masukkan kata sandi.'); return }
    setPesan('')
    setStep('proses')
    try {
      const ab = await berkas.arrayBuffer()
      const bytes = new Uint8Array(ab) as Uint8Array<ArrayBuffer>
      const { bundel: b, ringkasan: r } = await bacaPratinjauCadangan(bytes, kataSandi)
      setBundel(b)
      setPratinjau(r)
      setStep('pratinjau')
    } catch (err) {
      setPesan(err instanceof Error ? err.message : 'Gagal membaca berkas. Pastikan kata sandi benar.')
      setStep('gagal')
    }
  }

  async function handlePulihkan() {
    if (!bundel) return
    setStep('proses')
    setPesan('')
    try {
      await pulihkanDariBundel(bundel, { mode: 'timpa', pertahankanKunciLokal: true })
      setStep('sukses')
      onSukses()
    } catch (err) {
      setPesan(err instanceof Error ? err.message : 'Pemulihan gagal.')
      setStep('gagal')
    }
  }

  if (step === 'sukses') {
    return (
      <div className="panel-cadangan">
        <div className="panel-cadangan__sukses" role="status">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="panel-cadangan__ikon-sukses">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="panel-cadangan__sukses-teks">Data berhasil dipulihkan. PIN tidak berubah.</p>
        </div>
        {pratinjau && <RingkasanCadanganView r={pratinjau} />}
        <button type="button" className="btn btn-ghost" onClick={reset}>Impor berkas lain</button>
      </div>
    )
  }

  if (step === 'pratinjau' && pratinjau) {
    return (
      <div className="panel-cadangan">
        <p className="panel-cadangan__info panel-cadangan__info--peringatan">
          Data saat ini akan <strong>ditimpa seluruhnya</strong>. PIN tidak terpengaruh.
        </p>
        <RingkasanCadanganView r={pratinjau} />

        <label className="panel-cadangan__setuju">
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
          <span>Saya mengerti data saat ini akan ditimpa</span>
        </label>

        <div className="panel-cadangan__aksi">
          <button type="button" className="btn btn-primary"
            onClick={handlePulihkan} disabled={!setuju}>
            Pulihkan sekarang
          </button>
          <button type="button" className="btn btn-ghost" onClick={reset}>Batal</button>
        </div>
      </div>
    )
  }

  return (
    <form className="panel-cadangan" onSubmit={handlePratinjau} noValidate>
      <p className="panel-cadangan__info">
        Pilih berkas <code>.rekam</code> dan masukkan kata sandi yang dipakai saat membuat cadangan.
      </p>

      {pesan && <p className="panel-cadangan__galat" role="alert">{pesan}</p>}

      {step === 'proses' && (
        <div className="cadangan__progres" role="status" aria-live="polite">
          <Spinner />
          <span>{step === 'proses' && bundel === null ? 'Membaca berkas…' : 'Memulihkan data…'}</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="im-berkas" className="field__label">
          Berkas cadangan (.rekam) <span aria-hidden="true">*</span>
        </label>
        <input id="im-berkas" ref={fileRef} className="field__input field__input--file"
          type="file" accept=".rekam"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBerkas(e.target.files?.[0] ?? null)}
          required disabled={step === 'proses'} />
        {berkas && <span className="field__hint">{berkas.name} · {formatBytes(berkas.size)}</span>}
      </div>

      <div className="field">
        <label htmlFor="im-sandi" className="field__label">
          Kata sandi cadangan <span aria-hidden="true">*</span>
        </label>
        <input id="im-sandi" className="field__input" type="password"
          value={kataSandi} onChange={(e) => setKataSandi(e.target.value)}
          autoComplete="current-password" required disabled={step === 'proses'} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={step === 'proses' || !berkas}>
        Periksa berkas
      </button>
    </form>
  )
}

/* ============================================================
   HALAMAN CADANGAN UTAMA
   ============================================================ */
interface Props {
  onNavigasiKembali?(): void
}

export function HalamanCadangan({ onNavigasiKembali }: Props) {
  const [tab, setTab] = useState<'ekspor' | 'impor'>('ekspor')
  const [terakhirPada, setTerakhirPada] = useState<string | null>(null)

  const muatStatus = useCallback(async () => {
    setTerakhirPada(await ambilPengaturan('cadangan.terakhirPada'))
  }, [])

  useEffect(() => { void muatStatus() }, [muatStatus])

  return (
    <div className="layar-cadangan">
      <header className="layar-cadangan__header">
        {onNavigasiKembali && (
          <button type="button" className="btn btn-ghost cadangan__btn-kembali" onClick={onNavigasiKembali}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Kembali
          </button>
        )}
        <h1 className="layar-cadangan__judul">Cadangan data</h1>
      </header>

      {/* Status cadangan terakhir */}
      <div className={`kartu-status-cadangan ${terakhirPada ? '' : 'kartu-status-cadangan--peringatan'}`}>
        <span className="kartu-status-cadangan__label">Status cadangan</span>
        {terakhirPada ? (
          <>
            <span className="kartu-status-cadangan__waktu">{formatWaktu(terakhirPada)}</span>
            <span className="kartu-status-cadangan__info">Cadangan terakhir berhasil dibuat.</span>
          </>
        ) : (
          <>
            <span className="kartu-status-cadangan__waktu">Belum pernah dicadangkan</span>
            <span className="kartu-status-cadangan__info kartu-status-cadangan__info--peringatan">
              Buat cadangan sekarang untuk melindungi data keluarga.
            </span>
          </>
        )}
      </div>

      {/* Tab Ekspor / Impor */}
      <div className="layar-cadangan__tab" role="tablist" aria-label="Mode cadangan">
        {(['ekspor', 'impor'] as const).map((t) => (
          <button key={t} role="tab" type="button"
            className={`layar-cadangan__tab-btn ${tab === t ? 'layar-cadangan__tab-btn--aktif' : ''}`}
            aria-selected={tab === t}
            onClick={() => setTab(t)}>
            {t === 'ekspor' ? 'Ekspor' : 'Impor'}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'ekspor'
          ? <PanelEkspor onSukses={muatStatus} />
          : <PanelImpor onSukses={muatStatus} />
        }
      </div>

      {/* Catatan privasi */}
      <p className="cadangan__catatan">
        <strong>Enkripsi end-to-end.</strong>{' '}
        Berkas cadangan terenkripsi dengan kata sandi yang kamu pilih.
        Tanpa kata sandi yang benar, isi berkas tidak dapat dibuka oleh siapa pun.
        Data tidak pernah dikirim ke server.
      </p>
    </div>
  )
}
