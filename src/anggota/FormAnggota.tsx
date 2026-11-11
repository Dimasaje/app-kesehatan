/**
 * Form tambah/ubah anggota keluarga (Issue #6).
 * Validasi minimal di sisi UI; aturan bisnis ada di repositori.
 */
import { type FormEvent, useEffect, useState } from 'react'
import type { Anggota } from '../data/skema'
import {
  GOLONGAN_DARAH,
  HUBUNGAN,
  JENIS_KELAMIN,
} from '../data/skema'
import type { MasukanAnggota } from '../data/repositori/anggota'
import './FormAnggota.css'

const WARNA_SAMPUL = [
  '#2E5BEA', '#1A7A4A', '#B45309', '#7C3AED',
  '#C0392B', '#0891B2', '#BE185D', '#374151',
]

const LABEL_HUBUNGAN: Record<string, string> = {
  diri: 'Diri sendiri', pasangan: 'Pasangan', anak: 'Anak',
  orangtua: 'Orang tua', lainnya: 'Lainnya',
}

interface Props {
  awal?: Anggota
  onSimpan(data: MasukanAnggota): Promise<void>
  onBatal(): void
  sibuk: boolean
}

function daftarDariTeks(teks: string): string[] {
  return teks.split(',').map((s) => s.trim()).filter(Boolean)
}

export function FormAnggota({ awal, onSimpan, onBatal, sibuk }: Props) {
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [hubungan, setHubungan] = useState<string>(awal?.hubungan ?? 'lainnya')
  const [tanggalLahir, setTanggalLahir] = useState(awal?.tanggalLahir ?? '')
  const [jenisKelamin, setJenisKelamin] = useState(awal?.jenisKelamin ?? '')
  const [golonganDarah, setGolonganDarah] = useState(awal?.golonganDarah ?? '')
  const [alergi, setAlergi] = useState((awal?.alergi ?? []).join(', '))
  const [kondisiKronis, setKondisiKronis] = useState((awal?.kondisiKronis ?? []).join(', '))
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [warnaSampul, setWarnaSampul] = useState(awal?.warnaSampul ?? WARNA_SAMPUL[0])
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (awal) {
      setNama(awal.nama)
      setHubungan(awal.hubungan)
      setTanggalLahir(awal.tanggalLahir ?? '')
      setJenisKelamin(awal.jenisKelamin ?? '')
      setGolonganDarah(awal.golonganDarah ?? '')
      setAlergi((awal.alergi ?? []).join(', '))
      setKondisiKronis((awal.kondisiKronis ?? []).join(', '))
      setCatatan(awal.catatan ?? '')
      setWarnaSampul(awal.warnaSampul ?? WARNA_SAMPUL[0])
    }
  }, [awal])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setGalat('Nama wajib diisi.'); return }
    setGalat('')
    await onSimpan({
      nama: nama.trim(),
      hubungan: hubungan as MasukanAnggota['hubungan'],
      tanggalLahir: tanggalLahir || undefined,
      jenisKelamin: jenisKelamin as MasukanAnggota['jenisKelamin'] || undefined,
      golonganDarah: golonganDarah as MasukanAnggota['golonganDarah'] || undefined,
      alergi: daftarDariTeks(alergi),
      kondisiKronis: daftarDariTeks(kondisiKronis),
      catatan: catatan.trim() || undefined,
      warnaSampul,
    })
  }

  return (
    <form className="form-anggota" onSubmit={handleSubmit} noValidate>
      <h2 className="form-anggota__judul">
        {awal ? 'Ubah anggota' : 'Tambah anggota'}
      </h2>

      {galat && <p className="form-anggota__galat" role="alert">{galat}</p>}

      <div className="form-field">
        <label htmlFor="fa-nama" className="form-label">Nama <span aria-hidden="true">*</span></label>
        <input
          id="fa-nama"
          className="form-input"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          autoComplete="name"
          disabled={sibuk}
        />
      </div>

      <div className="form-field">
        <label htmlFor="fa-hubungan" className="form-label">Hubungan</label>
        <select
          id="fa-hubungan"
          className="form-input"
          value={hubungan}
          onChange={(e) => setHubungan(e.target.value)}
          disabled={sibuk}
        >
          {HUBUNGAN.map((h) => (
            <option key={h} value={h}>{LABEL_HUBUNGAN[h] ?? h}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="fa-lahir" className="form-label">Tanggal lahir</label>
          <input
            id="fa-lahir"
            className="form-input"
            type="date"
            value={tanggalLahir}
            onChange={(e) => setTanggalLahir(e.target.value)}
            disabled={sibuk}
          />
        </div>
        <div className="form-field">
          <label htmlFor="fa-goldar" className="form-label">Gol. darah</label>
          <select
            id="fa-goldar"
            className="form-input"
            value={golonganDarah}
            onChange={(e) => setGolonganDarah(e.target.value)}
            disabled={sibuk}
          >
            <option value="">—</option>
            {GOLONGAN_DARAH.map((g) => (
              <option key={g} value={g}>{g === 'tidak-tahu' ? 'Tidak tahu' : g}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="form-fieldset" disabled={sibuk}>
        <legend className="form-label">Jenis kelamin</legend>
        <div className="form-radio-group">
          <label className="form-radio">
            <input
              type="radio"
              name="jenisKelamin"
              value=""
              checked={jenisKelamin === ''}
              onChange={() => setJenisKelamin('')}
            />
            Tidak diisi
          </label>
          {JENIS_KELAMIN.map((j) => (
            <label key={j} className="form-radio">
              <input
                type="radio"
                name="jenisKelamin"
                value={j}
                checked={jenisKelamin === j}
                onChange={() => setJenisKelamin(j)}
              />
              {j === 'L' ? 'Laki-laki' : 'Perempuan'}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="fa-alergi" className="form-label">
          Alergi <span className="form-hint">(pisahkan koma)</span>
        </label>
        <input
          id="fa-alergi"
          className="form-input"
          type="text"
          value={alergi}
          onChange={(e) => setAlergi(e.target.value)}
          placeholder="Penisilin, Debu, ..."
          disabled={sibuk}
        />
      </div>

      <div className="form-field">
        <label htmlFor="fa-kronis" className="form-label">
          Kondisi kronis <span className="form-hint">(pisahkan koma)</span>
        </label>
        <input
          id="fa-kronis"
          className="form-input"
          type="text"
          value={kondisiKronis}
          onChange={(e) => setKondisiKronis(e.target.value)}
          placeholder="Diabetes, Hipertensi, ..."
          disabled={sibuk}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Warna sampul</label>
        <div className="form-warna">
          {WARNA_SAMPUL.map((w) => (
            <button
              key={w}
              type="button"
              className={`form-warna__titik ${warnaSampul === w ? 'form-warna__titik--aktif' : ''}`}
              style={{ background: w }}
              onClick={() => setWarnaSampul(w)}
              aria-label={`Warna ${w}`}
              aria-pressed={warnaSampul === w}
              disabled={sibuk}
            />
          ))}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="fa-catatan" className="form-label">Catatan</label>
        <textarea
          id="fa-catatan"
          className="form-input form-input--area"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={3}
          disabled={sibuk}
        />
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
