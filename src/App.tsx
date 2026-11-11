import { useState } from 'react'
import './App.css'
import { Beranda } from './beranda/Beranda'
import { HalamanAnggota } from './anggota/HalamanAnggota'
import { HalamanPengingat } from './pengingat/HalamanPengingat'
import { LayarBuatPin } from './kunci/LayarBuatPin'
import { LayarMasukkanPin } from './kunci/LayarMasukkanPin'
import { useKunci } from './kunci/useKunci'
import { NavBawah } from './navigasi/NavBawah'
import type { TabNav } from './navigasi/NavBawah'

export default function App() {
  const kunci = useKunci()
  const [sibuk, setSibuk] = useState(false)
  const [tab, setTab] = useState<TabNav>('beranda')

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
  function renderKonten() {
    switch (tab) {
      case 'beranda':
        return <Beranda onKunci={kunci.kunci} onNavigasi={setTab} />
      case 'riwayat':
        return <HalamanAnggota onKembali={() => setTab('beranda')} />
      case 'pengingat':
        return <HalamanPengingat onKembali={() => setTab('beranda')} />
      case 'pengaturan':
        return (
          <div className="layar-placeholder">
            <p>Pengaturan — menyusul (Issue #14).</p>
            <button type="button" className="btn btn-ghost" onClick={() => setTab('beranda')}>
              ← Beranda
            </button>
          </div>
        )
    }
  }

  return (
    <div className="app-shell">
      <main className="app-shell__konten">
        {renderKonten()}
      </main>
      <NavBawah aktif={tab} onChange={setTab} />
    </div>
  )
}
