import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { mintaPenyimpananTetap } from './data/db'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Minta penyimpanan tetap sekali setelah aplikasi siap. Browser boleh menolak
// tanpa bertanya; kegagalan bukan alasan untuk menghentikan aplikasi.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void mintaPenyimpananTetap().catch(() => undefined)
  })
}
