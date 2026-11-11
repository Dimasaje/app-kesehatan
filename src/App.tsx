import { useState } from 'react'
import './App.css'
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

  // status === 'terbuka' — isi app utama (Issue #7 dst)
  return (
    <main className="halaman">
      <header className="sampul">
        <h1 className="sampul__judul">Rekam Keluarga</h1>
        <p className="sampul__catatan">
          Buku kesehatan keluarga. Semua data tersimpan di HP ini.
        </p>
      </header>
      <p style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-ink)', opacity: 0.6 }}>
        Layar beranda menyusul (Issue #7).
      </p>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ margin: 'auto' }}
        onClick={kunci.kunci}
      >
        Kunci aplikasi
      </button>
    </main>
  )
}
