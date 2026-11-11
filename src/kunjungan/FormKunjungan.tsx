/**
 * Form catat kunjungan + lampiran foto (Issue #8).
 */
import { type FormEvent, useRef, useState } from 'react'
import type { Kunjungan } from '../data/skema'
import { JENIS_KUNJUNGAN } from '../data/skema'
import type { MasukanKunjungan } from '../data/repositori/kunjungan'
import './FormKunjungan.css'

const LABEL_JENIS: Record<string, string> = {
  klinik: 'Klinik', 'rumah-sakit': 'RS', dokter: 'Dokter',
  lab: 'Lab', lainnya: 'Lainnya',
}

interface BerkasAntrian {
  file: File
  preview?: string
}

interface Props {
  anggotaId: number
  awal?: Kunjungan
  onSimpan(data: MasukanKunjungan, berkas: File[]): Promise<void>
  onBatal(): void
  sibuk: boolean
}

function tanggalLokal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function FormKunjungan({ anggotaId, awal, onSimpan, onBatal, sibuk }: Props) {
  const [jenis, setJenis] = useState(awal?.jenis ?? 'klinik')
  const [tanggal, setTanggal] = useState(awal ? awal.tanggal.slice(0, 16) : tanggalLokal())
  const [tempat, setTempat] = useState(awal?.tempat ?? '')
  const [dokter, setDokter] = useState(awal?.dokter ?? '')
  const [keluhan, setKeluhan] = useState(awal?.keluhan ?? '')
  const [diagnosis, setDiagnosis] = useState(awal?.diagnosis ?? '')
  const [tindakan, setTindakan] = useState(awal?.tindakan ?? '')
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [biaya, setBiaya] = useState(awal?.biaya ? String(awal.biaya) : '')
  const [berkas, setBerkas] = useState<BerkasAntrian[]>([])
  const [galat, setGalat] = useState('')
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputKameraRef = useRef<HTMLInputElement>(null)

  function tambahFile(files: FileList | null) {
    if (!files) return
    const baru: BerkasAntrian[] = Array.from(files).map((f) => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))
    setBerkas((prev) => [...prev, ...baru])
  }

  function hapusFile(i: number) {
    setBerkas((prev) => {
      const salinan = [...prev]
      const item = salinan.splice(i, 1)[0]
      if (item.preview) URL.revokeObjectURL(item.preview)
      return salinan
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tempat.trim()) { setGalat('Tempat wajib diisi.'); return }
    if (!keluhan.trim()) { setGalat('Keluhan wajib diisi.'); return }
    setGalat('')
    await onSimpan(
      {
        anggotaId,
        jenis: jenis as MasukanKunjungan['jenis'],
        tanggal: new Date(tanggal).toISOString(),
        tempat: tempat.trim(),
        dokter: dokter.trim() || undefined,
        keluhan: keluhan.trim(),
        diagnosis: diagnosis.trim() || undefined,
        tindakan: tindakan.trim() || undefined,
        catatan: catatan.trim() || undefined,
        biaya: biaya ? parseInt(biaya.replace(/\D/g, ''), 10) : undefined,
      },
      berkas.map((b) => b.file),
    )
  }

  return (
    <form className="form-kunjungan" onSubmit={handleSubmit} noValidate>
      <h2 className="form-kunjungan__judul">
        {awal ? 'Ubah kunjungan' : 'Catat kunjungan'}
      </h2>

      {galat && <p className="form-kunjungan__galat" role="alert">{galat}</p>}

      {/* Jenis */}
      <div className="form-field">
        <label className="form-label">Jenis kunjungan</label>
        <div className="form-chip-group" role="group" aria-label="Jenis kunjungan">
          {JENIS_KUNJUNGAN.map((j) => (
            <label key={j} className={`form-chip ${jenis === j ? 'form-chip--aktif' : ''}`}>
              <input
                type="radio"
                name="jenis"
                value={j}
                checked={jenis === j}
                onChange={() => setJenis(j)}
                className="sr-only"
                disabled={sibuk}
              />
              {LABEL_JENIS[j]}
            </label>
          ))}
        </div>
      </div>

      {/* Tanggal */}
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="fk-tanggal" className="form-label">Tanggal & waktu <span aria-hidden="true">*</span></label>
          <input
            id="fk-tanggal"
            className="form-input"
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            disabled={sibuk}
          />
        </div>
      </div>

      {/* Tempat */}
      <div className="form-field">
        <label htmlFor="fk-tempat" className="form-label">Tempat <span aria-hidden="true">*</span></label>
        <input
          id="fk-tempat"
          className="form-input"
          type="text"
          value={tempat}
          onChange={(e) => setTempat(e.target.value)}
          placeholder="RS Siloam, Klinik dr. Budi, ..."
          required
          disabled={sibuk}
        />
      </div>

      {/* Dokter */}
      <div className="form-field">
        <label htmlFor="fk-dokter" className="form-label">Nama dokter</label>
        <input
          id="fk-dokter"
          className="form-input"
          type="text"
          value={dokter}
          onChange={(e) => setDokter(e.target.value)}
          disabled={sibuk}
        />
      </div>

      {/* Keluhan */}
      <div className="form-field">
        <label htmlFor="fk-keluhan" className="form-label">Keluhan <span aria-hidden="true">*</span></label>
        <textarea
          id="fk-keluhan"
          className="form-input form-input--area"
          value={keluhan}
          onChange={(e) => setKeluhan(e.target.value)}
          rows={2}
          required
          disabled={sibuk}
        />
      </div>

      {/* Diagnosis */}
      <div className="form-field">
        <label htmlFor="fk-diagnosis" className="form-label">Diagnosis</label>
        <input
          id="fk-diagnosis"
          className="form-input"
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          disabled={sibuk}
        />
      </div>

      {/* Tindakan */}
      <div className="form-field">
        <label htmlFor="fk-tindakan" className="form-label">Tindakan / Resep</label>
        <textarea
          id="fk-tindakan"
          className="form-input form-input--area"
          value={tindakan}
          onChange={(e) => setTindakan(e.target.value)}
          rows={2}
          disabled={sibuk}
        />
      </div>

      {/* Biaya */}
      <div className="form-field">
        <label htmlFor="fk-biaya" className="form-label">Biaya (Rp)</label>
        <input
          id="fk-biaya"
          className="form-input"
          type="number"
          min="0"
          value={biaya}
          onChange={(e) => setBiaya(e.target.value)}
          disabled={sibuk}
        />
      </div>

      {/* Catatan */}
      <div className="form-field">
        <label htmlFor="fk-catatan" className="form-label">Catatan tambahan</label>
        <textarea
          id="fk-catatan"
          className="form-input form-input--area"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
          disabled={sibuk}
        />
      </div>

      {/* Lampiran foto */}
      <div className="form-field">
        <span className="form-label">Lampiran foto</span>
        <div className="form-lampiran-aksi">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => inputFotoRef.current?.click()}
            disabled={sibuk}
          >
            📁 Galeri
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => inputKameraRef.current?.click()}
            disabled={sibuk}
          >
            📷 Kamera
          </button>
        </div>
        {/* Input tersembunyi */}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => tambahFile(e.target.files)}
          disabled={sibuk}
        />
        <input
          ref={inputKameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => tambahFile(e.target.files)}
          disabled={sibuk}
        />

        {berkas.length > 0 && (
          <div className="form-preview-list" aria-label="Lampiran dipilih">
            {berkas.map((b, i) => (
              <div key={i} className="form-preview-item">
                {b.preview ? (
                  <img src={b.preview} alt={b.file.name} className="form-preview-img" />
                ) : (
                  <span className="form-preview-ikon" aria-hidden="true">📄</span>
                )}
                <span className="form-preview-nama">{b.file.name}</span>
                <button
                  type="button"
                  className="form-preview-hapus"
                  onClick={() => hapusFile(i)}
                  aria-label={`Hapus ${b.file.name}`}
                  disabled={sibuk}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
