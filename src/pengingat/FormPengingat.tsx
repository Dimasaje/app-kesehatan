/**
 * Form tambah/ubah pengingat (Issue #11).
 */
import { type FormEvent, useEffect, useState } from 'react'
import type { Pengingat } from '../data/skema'
import { JENIS_PENGINGAT } from '../data/skema'
import type { MasukanPengingat } from '../data/repositori/pengingat'
import type { Anggota } from '../data/skema'

const LABEL_JENIS: Record<string, string> = {
  kontrol: 'Kontrol dokter',
  imunisasi: 'Imunisasi',
  'obat-habis': 'Obat habis',
  lainnya: 'Lainnya',
}

function hariIni(): string {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  awal?: Pengingat
  anggotaList: Anggota[]
  onSimpan(data: MasukanPengingat): Promise<void>
  onBatal(): void
  sibuk: boolean
}

export function FormPengingat({ awal, anggotaList, onSimpan, onBatal, sibuk }: Props) {
  const [jenis, setJenis] = useState(awal?.jenis ?? 'kontrol')
  const [judul, setJudul] = useState(awal?.judul ?? '')
  const [jatuhTempo, setJatuhTempo] = useState(awal?.jatuhTempo ?? hariIni())
  const [anggotaId, setAnggotaId] = useState<string>(awal?.anggotaId ? String(awal.anggotaId) : '')
  const [galat, setGalat] = useState('')

  // Isi judul otomatis dari jenis jika belum diubah
  useEffect(() => {
    if (!awal && !judul) setJudul(LABEL_JENIS[jenis] ?? jenis)
  }, [jenis, awal, judul])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!judul.trim()) { setGalat('Judul wajib diisi.'); return }
    if (!jatuhTempo) { setGalat('Tanggal wajib diisi.'); return }
    setGalat('')
    await onSimpan({
      jenis: jenis as MasukanPengingat['jenis'],
      judul: judul.trim(),
      jatuhTempo,
      anggotaId: anggotaId ? Number(anggotaId) : undefined,
    })
  }

  return (
    <form className="form-pengingat" onSubmit={handleSubmit} noValidate>
      <h2 className="form-pengingat__judul">
        {awal ? 'Ubah pengingat' : 'Tambah pengingat'}
      </h2>

      {galat && <p className="form-pengingat__galat" role="alert">{galat}</p>}

      {/* Jenis */}
      <div className="field">
        <span className="field__label">Jenis</span>
        <div className="form-chip-group" role="group" aria-label="Jenis pengingat">
          {JENIS_PENGINGAT.map((j) => (
            <label key={j} className={`tag form-chip-label ${jenis === j ? 'tag--primary' : ''}`}>
              <input
                type="radio"
                name="jenis-pengingat"
                value={j}
                checked={jenis === j}
                onChange={() => setJenis(j)}
                className="sr-only"
                disabled={sibuk}
              />
              {LABEL_JENIS[j] ?? j}
            </label>
          ))}
        </div>
      </div>

      {/* Judul */}
      <div className="field">
        <label htmlFor="fp-judul" className="field__label">
          Judul <span aria-hidden="true">*</span>
        </label>
        <input
          id="fp-judul"
          className="field__input"
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required
          disabled={sibuk}
        />
      </div>

      {/* Tanggal */}
      <div className="field">
        <label htmlFor="fp-tempo" className="field__label">
          Tanggal jatuh tempo <span aria-hidden="true">*</span>
        </label>
        <input
          id="fp-tempo"
          className="field__input"
          type="date"
          value={jatuhTempo}
          onChange={(e) => setJatuhTempo(e.target.value)}
          required
          disabled={sibuk}
        />
      </div>

      {/* Anggota */}
      {anggotaList.length > 0 && (
        <div className="field">
          <label htmlFor="fp-anggota" className="field__label">Anggota</label>
          <select
            id="fp-anggota"
            className="field__input"
            value={anggotaId}
            onChange={(e) => setAnggotaId(e.target.value)}
            disabled={sibuk}
          >
            <option value="">Semua / tidak spesifik</option>
            {anggotaList.map((a) => (
              <option key={a.id} value={a.id}>{a.nama}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-aksi">
        <button type="submit" className="btn btn-primary" disabled={sibuk}>
          {sibuk ? 'Menyimpan…' : 'Simpan'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBatal} disabled={sibuk}>
          Batal
        </button>
      </div>
    </form>
  )
}
