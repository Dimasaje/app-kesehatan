/**
 * Timeline riwayat kunjungan per anggota (Issue #9).
 * Pencarian, filter jenis, buka detail, ubah.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Anggota, Kunjungan } from '../data/skema'
import { JENIS_KUNJUNGAN } from '../data/skema'
import type { JenisKunjungan } from '../data/skema'
import { timelineAnggota, perbaruiKunjungan, arsipkanKunjungan } from '../data/repositori/kunjungan'
import { daftarLampiran, tambahLampiran, urlBlob } from '../data/repositori/lampiran'
import type { Lampiran } from '../data/skema'
import { FormKunjungan } from './FormKunjungan'
import type { MasukanKunjungan } from '../data/repositori/kunjungan'
import './Timeline.css'

const LABEL_JENIS: Record<string, string> = {
  klinik: 'Klinik', 'rumah-sakit': 'RS', dokter: 'Dokter',
  lab: 'Lab', lainnya: 'Lainnya',
}

const HALAMAN = 20

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

interface DetailKunjunganProps {
  kunjungan: Kunjungan
  onUbah(): void
  onArsip(): void
  onTutup(): void
  sibuk: boolean
}

function DetailKunjungan({ kunjungan, onUbah, onArsip, onTutup, sibuk }: DetailKunjunganProps) {
  const [lampiran, setLampiran] = useState<Lampiran[]>([])
  const [konfirm, setKonfirm] = useState(false)

  useEffect(() => {
    if (kunjungan.id) {
      daftarLampiran(kunjungan.id).then(setLampiran)
    }
  }, [kunjungan.id])

  return (
    <div className="detail-kunjungan">
      <div className="detail-kunjungan__header">
        <button type="button" className="btn btn-ghost btn--kembali" onClick={onTutup}>
          ← Kembali
        </button>
        <div className="detail-kunjungan__aksi">
          <button type="button" className="btn btn-ghost" onClick={onUbah} disabled={sibuk}>Ubah</button>
          {konfirm ? (
            <>
              <button type="button" className="btn-hapus-ya" onClick={() => { setKonfirm(false); onArsip() }} disabled={sibuk}>Ya, arsip</button>
              <button type="button" className="btn-hapus-tidak" onClick={() => setKonfirm(false)}>Batal</button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost kartu-anggota__btn--hapus" onClick={() => setKonfirm(true)} disabled={sibuk}>Arsip</button>
          )}
        </div>
      </div>

      <div className="detail-kunjungan__isi">
        <span className={`chip-jenis chip-jenis--${kunjungan.jenis}`}>
          {LABEL_JENIS[kunjungan.jenis] ?? kunjungan.jenis}
        </span>
        <h2 className="detail-kunjungan__tempat">{kunjungan.tempat}</h2>
        <p className="detail-kunjungan__waktu">
          {formatTanggal(kunjungan.tanggal)}, {formatWaktu(kunjungan.tanggal)}
          {kunjungan.dokter && ` · dr. ${kunjungan.dokter}`}
        </p>

        {(['keluhan', 'diagnosis', 'tindakan', 'catatan'] as const).map((k) =>
          kunjungan[k] ? (
            <div key={k} className="detail-kunjungan__baris">
              <span className="detail-kunjungan__kunci">
                {{ keluhan: 'Keluhan', diagnosis: 'Diagnosis', tindakan: 'Tindakan/Resep', catatan: 'Catatan' }[k]}
              </span>
              <p className="detail-kunjungan__nilai">{kunjungan[k]}</p>
            </div>
          ) : null
        )}

        {kunjungan.biaya != null && (
          <div className="detail-kunjungan__baris">
            <span className="detail-kunjungan__kunci">Biaya</span>
            <p className="detail-kunjungan__nilai">
              {kunjungan.biaya.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
            </p>
          </div>
        )}

        {lampiran.length > 0 && (
          <div className="detail-kunjungan__lampiran">
            <span className="detail-kunjungan__kunci">Lampiran</span>
            <div className="detail-kunjungan__foto-grid">
              {lampiran.map((l) => {
                const url = urlBlob(l.blob)
                return l.mime.startsWith('image/') ? (
                  <a key={l.id} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={l.nama} className="detail-kunjungan__foto" />
                  </a>
                ) : (
                  <a key={l.id} href={url} download={l.nama} className="detail-kunjungan__dokumen">
                    📄 {l.nama}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  anggota: Anggota
  onKembali(): void
  onTambah(): void
}

type Layar = 'daftar' | { detail: Kunjungan } | { ubah: Kunjungan }

export function Timeline({ anggota, onKembali, onTambah }: Props) {
  const [kunjunganList, setKunjunganList] = useState<Kunjungan[]>([])
  const [cari, setCari] = useState('')
  const [filterJenis, setFilterJenis] = useState<JenisKunjungan | ''>('')
  const [halaman, setHalaman] = useState(0)
  const [adaLagi, setAdaLagi] = useState(false)
  const [layar, setLayar] = useState<Layar>('daftar')
  const [sibuk, setSibuk] = useState(false)
  const cariTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const muat = useCallback(async (q: string, j: JenisKunjungan | '', h: number) => {
    const hasil = await timelineAnggota(anggota.id!, {
      cari: q || undefined,
      jenis: j || undefined,
      batasAtas: HALAMAN + 1,
      mulaiDari: h * HALAMAN,
    })
    setAdaLagi(hasil.length > HALAMAN)
    setKunjunganList(hasil.slice(0, HALAMAN))
  }, [anggota.id])

  useEffect(() => { void muat(cari, filterJenis, halaman) }, [muat, cari, filterJenis, halaman])

  function handleCari(nilai: string) {
    if (cariTimer.current) clearTimeout(cariTimer.current)
    cariTimer.current = setTimeout(() => { setCari(nilai); setHalaman(0) }, 350)
  }

  async function handleUbah(data: MasukanKunjungan, berkas: File[]) {
    if (typeof layar !== 'object' || !('ubah' in layar)) return
    setSibuk(true)
    try {
      await perbaruiKunjungan(layar.ubah.id!, data)
      for (const f of berkas) {
        await tambahLampiran(layar.ubah.id!, f, f.type.startsWith('image/') ? 'foto' : 'dokumen')
      }
      await muat(cari, filterJenis, halaman)
      setLayar('daftar')
    } finally { setSibuk(false) }
  }

  async function handleArsip(id: number) {
    setSibuk(true)
    try { await arsipkanKunjungan(id); await muat(cari, filterJenis, halaman); setLayar('daftar') }
    finally { setSibuk(false) }
  }

  if (typeof layar === 'object' && 'ubah' in layar) {
    return (
      <FormKunjungan
        anggotaId={anggota.id!}
        awal={layar.ubah}
        sibuk={sibuk}
        onSimpan={handleUbah}
        onBatal={() => setLayar('daftar')}
      />
    )
  }

  if (typeof layar === 'object' && 'detail' in layar) {
    return (
      <DetailKunjungan
        kunjungan={layar.detail}
        sibuk={sibuk}
        onTutup={() => setLayar('daftar')}
        onUbah={() => setLayar({ ubah: layar.detail })}
        onArsip={() => handleArsip(layar.detail.id!)}
      />
    )
  }

  return (
    <div className="timeline">
      <header className="timeline__header">
        <button type="button" className="btn btn-ghost btn--kembali" onClick={onKembali}>
          ← Kembali
        </button>
        <h1 className="timeline__judul">Riwayat {anggota.nama}</h1>
        <button type="button" className="btn btn-primary timeline__btn-tambah" onClick={onTambah}>
          + Catat
        </button>
      </header>

      {/* Filter & cari */}
      <div className="timeline__kontrol">
        <input
          className="timeline__cari form-input"
          type="search"
          placeholder="Cari kunjungan…"
          onChange={(e) => handleCari(e.target.value)}
          aria-label="Cari kunjungan"
        />
        <select
          className="timeline__filter form-input"
          value={filterJenis}
          onChange={(e) => { setFilterJenis(e.target.value as JenisKunjungan | ''); setHalaman(0) }}
          aria-label="Filter jenis"
        >
          <option value="">Semua jenis</option>
          {JENIS_KUNJUNGAN.map((j) => (
            <option key={j} value={j}>{LABEL_JENIS[j]}</option>
          ))}
        </select>
      </div>

      {kunjunganList.length === 0 ? (
        <p className="timeline__kosong">Belum ada kunjungan tercatat.</p>
      ) : (
        <ol className="timeline__daftar" role="list">
          {kunjunganList.map((k) => (
            <li key={k.id} className="timeline__item">
              <div className="timeline__penanda" aria-hidden="true" />
              <button
                type="button"
                className="timeline__kartu"
                onClick={() => setLayar({ detail: k })}
                aria-label={`Detail kunjungan ${k.tempat} ${formatTanggal(k.tanggal)}`}
              >
                <div className="timeline__kartu-atas">
                  <span className={`chip-jenis chip-jenis--${k.jenis}`}>
                    {LABEL_JENIS[k.jenis]}
                  </span>
                  <span className="timeline__tanggal">{formatTanggal(k.tanggal)}</span>
                </div>
                <p className="timeline__tempat">{k.tempat}</p>
                <p className="timeline__keluhan">{k.keluhan}</p>
                {k.diagnosis && (
                  <p className="timeline__diagnosis">Dx: {k.diagnosis}</p>
                )}
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* Paginasi */}
      <div className="timeline__paginasi">
        {halaman > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setHalaman((h) => h - 1)}>
            ← Sebelumnya
          </button>
        )}
        {adaLagi && (
          <button type="button" className="btn btn-ghost" onClick={() => setHalaman((h) => h + 1)}>
            Berikutnya →
          </button>
        )}
      </div>
    </div>
  )
}
