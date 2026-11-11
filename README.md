# Rekam Keluarga

Buku kesehatan keluarga digital: profil anggota, catatan kunjungan, obat, vaksin, dan
pengingat — semuanya tersimpan di HP pengguna. Tidak ada server, akun, atau analitik.

Status: fondasi (Milestone 1). Layar masih berupa halaman status penyimpanan sementara;
tampilan sebenarnya dikerjakan pada Issue #2 dan #7.

## Keputusan teknologi

Keputusan ini diminta oleh Issue #1 dan menjadi acuan semua issue berikutnya.

| Bagian | Pilihan | Alasan | Alternatif yang tidak dipakai |
| --- | --- | --- | --- |
| Framework | **React 19 + Vite 8 + TypeScript** | Tim sudah mengenal React; Vite memberi dev server cepat dan build statis kecil. TypeScript memaksa bentuk data kesehatan (tanggal, dosis, rujukan anggota) konsisten. | Svelte (bundel lebih kecil, tetapi kurva belajar dan contoh komponen lebih sedikit bagi tim), Next.js (butuh server/SSR yang tidak ada di produk local-first) |
| PWA | **vite-plugin-pwa 2 (Workbox, `generateSW`)** | Precache otomatis seluruh aset, `registerType: 'autoUpdate'` agar pembaruan terpasang tanpa tombol manual. | Menulis service worker manual (rawan salah pada strategi cache), `injectManifest` (belum perlu custom routing) |
| Penyimpanan | **IndexedDB via Dexie 4** | Transaksi, indeks gabungan, dan migrasi versi bawaan; mendukung `Blob` untuk lampiran. | `localStorage` (sinkron, batas ~5 MB, tanpa indeks), SQLite WASM (unduhan besar, butuh OPFS dan header COOP/COEP) |
| Enkripsi cadangan | **Web Crypto API** (AES-GCM + PBKDF2) — Issue #12 | Bawaan browser, tidak ada dependensi. | CryptoJS (bundel lebih besar, tidak perlu karena Web Crypto tersedia) |
| Hosting | Berkas statis di hosting HTTPS gratis (mis. GitHub Pages) | Tidak ada data yang dikirim; hosting hanya menyajikan berkas aplikasi. | Vercel/Netlify (tetap boleh, tetapi tidak diperlukan) |
| Gaya | CSS biasa + variabel CSS | Aturan desain PRD (palet, pill, area sentuh) cukup ditulis langsung; menghindari kelas utilitas yang menyulitkan Designer saat meninjau. | Tailwind, CSS-in-JS |

Catatan: `BASE_PATH` wajib diisi saat aplikasi disajikan dari sub-folder, misal GitHub
Pages proyek:

```bash
BASE_PATH=/app-kesehatan/ npm run build
```

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173 (juga terbuka ke jaringan lokal)
npm run test       # 10 uji skema, migrasi, repositori
npm run lint
npm run build      # build produksi + service worker di dist/
npm run preview    # menyajikan dist/ di http://localhost:4173
npm run icons      # membuat ulang ikon PNG di public/icons
```

Butuh Node 20 atau lebih baru.

## Memasang di layar utama HP

Service worker hanya aktif pada **HTTPS** atau `localhost`. Membuka
`http://192.168.x.x:5173` dari HP **tidak** membuat aplikasi bisa dipasang.

1. Build lalu sajikan di HTTPS (GitHub Pages, Netlify, atau hosting statis lain).
2. Buka alamat itu di Chrome (Android) atau Safari (iPhone).
3. Android: menu ⋮ → **Tambahkan ke layar utama**. iPhone: tombol Bagikan → **Tambahkan ke Layar Utama**.
4. Buka dari ikon; aplikasi tampil tanpa address bar (`display: standalone`) dan tetap
   terbuka saat jaringan dimatikan.

Pemeriksaan lokal tanpa HP: `npm run preview`, buka `http://localhost:4173` di Chrome,
lalu DevTools → Application → Manifest (tanpa error) dan Service Workers (status
*activated*). Sudah diverifikasi: manifest diurai Chrome tanpa error, service worker
aktif, dan halaman tetap terbuka setelah reload dalam mode luring.

## Struktur folder

```
public/icons/          ikon PNG (dibuat oleh scripts/generate-icons.mjs)
scripts/               skrip pembuat ikon
src/
  data/
    skema.ts           bentuk data 7 entitas
    db.ts              Dexie: versi skema, migrasi, status penyimpanan
    diagnostik.ts      uji "simpan lalu baca ulang" untuk QA
    repositori/        akses data per entitas (anggota, pengaturan)
  pengujian/setup.ts   pemasangan fake-indexeddb untuk uji
  App.tsx              halaman status penyimpanan sementara
docs/arsitektur-data.md  rancangan skema dan aturan migrasi
```

## Data

Tujuh entitas sesuai PRD bagian 8: **Anggota, Kunjungan, Lampiran, Obat, Vaksin,
Pengingat, Pengaturan**. Detail kolom, indeks, dan aturan migrasi ada di
[docs/arsitektur-data.md](docs/arsitektur-data.md).

Basis data: `rekam-keluarga`, skema **v2**.

## Privasi

- Tidak ada permintaan jaringan setelah aset termuat; tidak ada pelacak, analitik, atau font eksternal.
- Data tidak dienkripsi saat disimpan di IndexedDB; PIN (Issue #5) hanya menjaga akses
  lewat antarmuka. Perangkat yang tidak terkunci tetap bisa membaca penyimpanan browser.
  Berkas cadangan wajib terenkripsi (Issue #12) — itu pengaman utama saat HP hilang.
