/**
 * Komponen input PIN — 6 digit, tombol angka on-screen (Issue #5).
 * Pakai design system: tokens.css + components.css.
 */
import { useEffect, useRef, useState } from 'react'
import './PinInput.css'

const PANJANG = 6

interface Props {
  onSelesai(pin: string): void
  disabled?: boolean
  label?: string
}

export function PinInput({ onSelesai, disabled = false, label = 'Masukkan PIN' }: Props) {
  const [digit, setDigit] = useState<string[]>([])
  const submitRef = useRef(false)

  // Kirim PIN begitu 6 digit terpenuhi
  useEffect(() => {
    if (digit.length === PANJANG && !submitRef.current) {
      submitRef.current = true
      onSelesai(digit.join(''))
    }
  }, [digit, onSelesai])

  function tambahDigit(d: string) {
    if (disabled || digit.length >= PANJANG) return
    setDigit((prev) => [...prev, d])
  }

  function hapusDigit() {
    if (disabled) return
    submitRef.current = false
    setDigit((prev) => prev.slice(0, -1))
  }

  function reset() {
    submitRef.current = false
    setDigit([])
  }

  // Keyboard fisik
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return
      if (/^[0-9]$/.test(e.key)) tambahDigit(e.key)
      else if (e.key === 'Backspace') hapusDigit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const dots = Array.from({ length: PANJANG }, (_, i) => (
    <span
      key={i}
      className={`pin-dot ${i < digit.length ? 'pin-dot--isi' : ''}`}
      aria-hidden="true"
    />
  ))

  const tombolAngka = ['1','2','3','4','5','6','7','8','9','','0','⌫'].map((t, i) => {
    if (t === '') return <span key={i} />
    if (t === '⌫') {
      return (
        <button
          key={i}
          type="button"
          className="pin-key pin-key--hapus"
          onClick={hapusDigit}
          disabled={disabled || digit.length === 0}
          aria-label="Hapus digit terakhir"
        >
          {t}
        </button>
      )
    }
    return (
      <button
        key={i}
        type="button"
        className="pin-key"
        onClick={() => tambahDigit(t)}
        disabled={disabled || digit.length >= PANJANG}
        aria-label={`Angka ${t}`}
      >
        {t}
      </button>
    )
  })

  return (
    <div className="pin-wrap" role="group" aria-label={label}>
      <p className="pin-label">{label}</p>
      <div className="pin-dots" aria-live="polite" aria-atomic="true"
        aria-label={`${digit.length} dari ${PANJANG} digit diisi`}>
        {dots}
      </div>
      <div className="pin-pad" aria-label="Papan angka">
        {tombolAngka}
      </div>
      {digit.length > 0 && !disabled && (
        <button type="button" className="btn btn-ghost pin-reset" onClick={reset}>
          Ulangi
        </button>
      )}
    </div>
  )
}
