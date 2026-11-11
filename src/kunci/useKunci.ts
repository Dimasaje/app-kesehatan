/**
 * Hook state mesin kunci PIN (Issue #5).
 * Mengelola: belum dikonfigurasi → buat PIN | dikonfigurasi → masukkan PIN.
 * Ekspor satu hook `useKunci` untuk dipakai App.tsx.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ambilPengaturan,
  simpanPengaturan,
} from '../data/repositori/pengaturan'
import { hashPin, verifikasiPin } from './kripto'

export type StatusKunci =
  | 'memuat'       // sedang baca DB
  | 'buat-pin'     // belum ada PIN, perlu buat
  | 'masukkan-pin' // PIN ada, tunggu input
  | 'terbuka'      // sudah terautentikasi

const BATAS_GAGAL = 5          // maks percobaan salah
const JEDA_KUNCI_MS = 30_000   // 30 s kunci setelah batas gagal

export interface StateKunci {
  status: StatusKunci
  gagal: number
  terkunci: boolean
  detikSisa: number
}

export interface AksiKunci {
  buatPin(pin: string): Promise<void>
  masukkannPin(pin: string): Promise<boolean>
  kunci(): void
}

export function useKunci(): StateKunci & AksiKunci {
  const [status, setStatus] = useState<StatusKunci>('memuat')
  const [gagal, setGagal] = useState(0)
  const [terkunciHingga, setTerkunciHingga] = useState<number | null>(null)
  const [detikSisa, setDetikSisa] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Baca state awal dari DB
  useEffect(() => {
    ambilPengaturan('kunci.aktif').then((aktif) => {
      setStatus(aktif ? 'masukkan-pin' : 'buat-pin')
    })
  }, [])

  // Hitung mundur saat terkunci
  useEffect(() => {
    if (terkunciHingga === null) {
      setDetikSisa(0)
      return
    }
    const tick = () => {
      const sisa = Math.max(0, Math.ceil((terkunciHingga - Date.now()) / 1000))
      setDetikSisa(sisa)
      if (sisa === 0) {
        setTerkunciHingga(null)
        setGagal(0)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [terkunciHingga])

  const buatPin = useCallback(async (pin: string) => {
    const { hash, salt, iterasi } = await hashPin(pin)
    await simpanPengaturan('kunci.aktif', true)
    await simpanPengaturan('kunci.hash', hash)
    await simpanPengaturan('kunci.salt', salt)
    await simpanPengaturan('kunci.iterasi', iterasi)
    setStatus('terbuka')
  }, [])

  const masukkannPin = useCallback(async (pin: string): Promise<boolean> => {
    const [hash, salt, iterasi] = await Promise.all([
      ambilPengaturan('kunci.hash'),
      ambilPengaturan('kunci.salt'),
      ambilPengaturan('kunci.iterasi'),
    ])
    const cocok = await verifikasiPin(pin, hash, salt, iterasi)
    if (cocok) {
      setGagal(0)
      setStatus('terbuka')
      return true
    }
    const jumlahGagal = gagal + 1
    setGagal(jumlahGagal)
    if (jumlahGagal >= BATAS_GAGAL) {
      setTerkunciHingga(Date.now() + JEDA_KUNCI_MS)
    }
    return false
  }, [gagal])

  const kunci = useCallback(() => {
    setStatus('masukkan-pin')
    setGagal(0)
    setTerkunciHingga(null)
  }, [])

  return {
    status,
    gagal,
    terkunci: terkunciHingga !== null,
    detikSisa,
    buatPin,
    masukkannPin,
    kunci,
  }
}
