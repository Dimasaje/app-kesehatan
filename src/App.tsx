import { useState } from 'react'
import './App.css'
import { Beranda } from './beranda/Beranda'
import { LayarBuatPin } from './kunci/LayarBuatPin'
import { LayarMasukkanPin } from './kunci/LayarMasukkanPin'
import { useKunci } from './kunci/useKunci'

export default function App() {
  const kunci = useKunci()
  const [sibuk, setSibuk] = useState(false)

  if (kunci.status === 'memuat') {
    return (
      <div className="layar-muat" aria-label="Memuat aplikasi" aria-live="polite">
        <span className="layar-muat__spinner" aria-hidden="true" />
      </div>
    )
  }

  if (kunci.status === 'buat-pin') {
    return (
      <LayarBuatPin
        sibuk={sibuk}
        onBuat={async (pin) => {
          setSibuk(true)
          try { await kunci.buatPin(pin) }
          finally { setSibuk(false) }
        }}
      />
    )
  }

  if (kunci.status === 'masukkan-pin') {
    return (
      <LayarMasukkanPin
        sibuk={sibuk}
        gagal={kunci.gagal}
        terkunci={kunci.terkunci}
        detikSisa={kunci.detikSisa}
        onMasukkan={async (pin) => {
          setSibuk(true)
          try { return await kunci.masukkannPin(pin) }
          finally { setSibuk(false) }
        }}
      />
    )
  }

  // status === 'terbuka'
  return <Beranda onKunci={kunci.kunci} />
}
