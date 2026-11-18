/**
 * Hook data beranda: anggota aktif + pengingat mendatang (Issue #7).
 */
import { useCallback, useEffect, useState } from 'react'
import type { Anggota, Pengingat } from '../data/skema'
import { daftarAnggotaAktif } from '../data/repositori/anggota'
import { ambilPengaturan } from '../data/repositori/pengaturan'
import { basisData } from '../data/db'

export interface InfoCadangan {
  terakhirPada: string | null
  perluDiingatkan: boolean
}

export interface DataBeranda {
  anggota: Anggota[]
  pengingat: Pengingat[]
  cadangan: InfoCadangan
  memuatAnggota: boolean
  memuatPengingat: boolean
}

const HARI_MENDATANG = 30

export function useBeranda(): DataBeranda & { muat(): void } {
  const [anggota, setAnggota] = useState<Anggota[]>([])
  const [pengingat, setPengingat] = useState<Pengingat[]>([])
  const [cadangan, setCadangan] = useState<InfoCadangan>({ terakhirPada: null, perluDiingatkan: false })
  const [memuatAnggota, setMemuatAnggota] = useState(true)
  const [memuatPengingat, setMemuatPengingat] = useState(true)

  const muat = useCallback(async () => {
    setMemuatAnggota(true)
    setMemuatPengingat(true)
    try {
      const [a, p, terakhirPada, batasHari] = await Promise.all([
        daftarAnggotaAktif(),
        ambilPengingatMendatang(),
        ambilPengaturan('cadangan.terakhirPada'),
        ambilPengaturan('cadangan.ingatkanSetelahHari'),
      ])
      setAnggota(a)
      setPengingat(p)
      const selisih = terakhirPada
        ? (Date.now() - new Date(terakhirPada).getTime()) / 86_400_000
        : Infinity
      setCadangan({ terakhirPada, perluDiingatkan: selisih > batasHari })
    } finally {
      setMemuatAnggota(false)
      setMemuatPengingat(false)
    }
  }, [])

  useEffect(() => { void muat() }, [muat])

  return { anggota, pengingat, cadangan, memuatAnggota, memuatPengingat, muat }
}

async function ambilPengingatMendatang(): Promise<Pengingat[]> {
  const batas = new Date()
  batas.setDate(batas.getDate() + HARI_MENDATANG)
  const batasStr = batas.toISOString().slice(0, 10)
  const hari = new Date().toISOString().slice(0, 10)

  return basisData()
    .pengingat.filter(
      (p) =>
        p.selesaiPada === null &&
        p.jatuhTempo >= hari &&
        p.jatuhTempo <= batasStr,
    )
    .sortBy('jatuhTempo')
}
