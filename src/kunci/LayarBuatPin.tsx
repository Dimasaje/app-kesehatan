/**
 * Layar buat PIN baru (Issue #5).
 * Minta PIN 2× untuk konfirmasi, simpan hash via useKunci.
 */
import { useState } from 'react'
import { PinInput } from './PinInput'
import './LayarKunci.css'

interface Props {
  onBuat(pin: string): Promise<void>
  sibuk: boolean
}

export function LayarBuatPin({ onBuat, sibuk }: Props) {
  const [tahap, setTahap] = useState<'pertama' | 'konfirmasi'>('pertama')
  const [pinPertama, setPinPertama] = useState('')
  const [galat, setGalat] = useState('')

  async function handleKonfirmasi(pin: string) {
    if (pin !== pinPertama) {
      setGalat('PIN tidak cocok. Coba lagi.')
      setTahap('pertama')
      setPinPertama('')
      return
    }
    setGalat('')
    await onBuat(pin)
  }

  if (tahap === 'pertama') {
    return (
      <div className="layar-kunci">
        <header className="layar-kunci__header">
          <h1 className="layar-kunci__judul">Buat PIN</h1>
          <p className="layar-kunci__sub">
            PIN melindungi data keluarga Anda. Gunakan 6 angka yang mudah Anda ingat.
          </p>
        </header>
        {galat && <p className="layar-kunci__galat" role="alert">{galat}</p>}
        <PinInput
          label="Buat PIN baru"
          disabled={sibuk}
          onSelesai={(pin) => { setPinPertama(pin); setTahap('konfirmasi') }}
        />
      </div>
    )
  }

  return (
    <div className="layar-kunci">
      <header className="layar-kunci__header">
        <h1 className="layar-kunci__judul">Konfirmasi PIN</h1>
        <p className="layar-kunci__sub">Masukkan PIN yang sama sekali lagi.</p>
      </header>
      <PinInput
        label="Ulangi PIN"
        disabled={sibuk}
        onSelesai={handleKonfirmasi}
      />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => { setTahap('pertama'); setPinPertama(''); setGalat('') }}
      >
        Kembali
      </button>
    </div>
  )
}
