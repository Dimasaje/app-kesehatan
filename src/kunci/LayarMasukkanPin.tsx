/**
 * Layar masukkan PIN (Issue #5).
 * Tampil saat app terbuka dan PIN sudah dikonfigurasi.
 */
import { PinInput } from './PinInput'
import './LayarKunci.css'

interface Props {
  onMasukkan(pin: string): Promise<boolean>
  gagal: number
  terkunci: boolean
  detikSisa: number
  sibuk: boolean
}

export function LayarMasukkanPin({ onMasukkan, gagal, terkunci, detikSisa, sibuk }: Props) {
  return (
    <div className="layar-kunci">
      <header className="layar-kunci__header">
        <div className="layar-kunci__ikon" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="18" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M13 18V13a7 7 0 0 1 14 0v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="layar-kunci__judul">Rekam Keluarga</h1>
        <p className="layar-kunci__sub">Masukkan PIN untuk membuka aplikasi.</p>
      </header>

      {terkunci ? (
        <p className="layar-kunci__galat" role="alert">
          Terlalu banyak percobaan salah. Coba lagi dalam {detikSisa} detik.
        </p>
      ) : (
        <>
          {gagal > 0 && (
            <p className="layar-kunci__galat" role="alert">
              PIN salah. Sisa percobaan: {5 - gagal}.
            </p>
          )}
          <PinInput
            label="Masukkan PIN"
            disabled={sibuk || terkunci}
            onSelesai={onMasukkan}
          />
        </>
      )}
    </div>
  )
}
