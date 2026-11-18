# Laporan Audit Privasi dan Keamanan — Rekam Keluarga

- **Dokumen Terkait:** `PRD.md` (Pasal 1 & 9)
- **Issue:** #17 (Milestone 4)
- **Tanggal Audit:** 18 November 2026
- **Status Akhir:** LULUS (Semua 6 kriteria terpenuhi)

---

## 1. Ringkasan Eksekutif

Aplikasi **Rekam Keluarga** diaudit secara menyeluruh untuk membuktikan arsitektur *local-first*, *zero-cloud backend*, dan *zero-leakage*. Hasil audit membuktikan:
- Tidak ada lalu lintas jaringan keluar (zero outbound requests) yang membawa data pengguna.
- Nol skrip pelacak (analytics/telemetry/pixel/CDN).
- Seluruh data medis, foto lampiran, dan pengaturan tersimpan secara terenkripsi atau lokal di IndexedDB peramban, tanpa kebocoran ke `localStorage` atau `sessionStorage`.
- Kebijakan Keamanan Konten (Content Security Policy) diaktifkan untuk mencegah eksfiltrasi data.

---

## 2. Matriks Temuan Audit

| No | Poin Audit | Metodologi & Bukti | Temuan | Status |
|---|---|---|---|---|
| 1 | **Permintaan Jaringan Data Pengguna** | Pencarian kode sumber (`grep -rn "fetch\|XMLHttpRequest\|sendBeacon" src/`). Audit panel jaringan DevTools saat penggunaan CRUD dan ekspor. | Nol panggilan API atau jaringan di seluruh `src/`. Tidak ada endpoint backend yang dihubungi. | **LULUS** |
| 2 | **Pelacak Pihak Ketiga (Analytics/Tracker)** | Pengecekan `package.json`, `index.html`, dan bundel kompilasi `dist/assets/*.js`. | Dependensi runtime hanya `react`, `react-dom`, `dexie`, dan `dexie-react-hooks`. Tidak ada SDK Google Analytics, Mixpanel, Sentry, Facebook Pixel, atau skrip eksternal. | **LULUS** |
| 3 | **Pemuatan Font & Privasi IP** | Analisis deklarasi CSS (`src/index.css`, `design/tokens.css`, `index.html`) dan aset `public/fonts/`. | Berkas font WOFF2 (Newsreader 400 & 600, IBM Plex Sans 400, 500 & 600, IBM Plex Mono 400 & 500) di-bundle dan disajikan lokal dari origin sendiri (self-hosted). Dideklarasikan via `@font-face` dengan `font-display: swap`. Nol permintaan jaringan ke Google Fonts atau CDN pihak ketiga; IP pengguna tidak pernah terekspos. Total ukuran seluruh 7 font subset latin hanya 143,5 KB. | **LULUS** |
| 4 | **Keamanan Penyimpanan Lokal** | Pencarian kata kunci `localStorage` dan `sessionStorage` di seluruh `src/`. Inspeksi IndexedDB. | Nol penggunaan `localStorage`/`sessionStorage`. Seluruh data tersimpan di IndexedDB `rekam-keluarga`. Kredensial PIN di-hash dengan PBKDF2-SHA-256 (210.000 iterasi, salt 16B). File cadangan dienkripsi dengan AES-GCM-256 dan hash PIN dikecualikan dari berkas cadangan. | **LULUS** |
| 5 | **Content Security Policy (CSP)** | Penempatan tag `<meta http-equiv="Content-Security-Policy">` di baris teratas `<head>` pada `index.html`. | Diterapkan CSP ketat: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';`. Parameter `connect-src 'self'` memblokir transmisi data ke domain eksternal pada tingkat peramban, dan `font-src 'self'` memastikan font hanya dimuat dari origin lokal. | **LULUS** |
| 6 | **Manajemen Memori Blob URL** | Audit siklus hidup `URL.createObjectURL` dan `URL.revokeObjectURL` pada `FormKunjungan.tsx`, `Timeline.tsx`, dan `ekspor.ts`. | Fungsi pembersihan `cabutUrlBlob` ditambahkan di `src/data/repositori/lampiran.ts` dan diimplementasikan pada `ItemLampiran` (`Timeline.tsx`) dengan cleanup `useEffect` saat unmount untuk mencegah kebocoran memori (memory leak). | **LULUS** |

---

## 3. Detail Perbaikan Kode yang Dilakukan

1. **Self-Hosting Font WOFF2 (`public/fonts/` & `src/index.css`):**
   - Menambahkan berkas font WOFF2 subset latin lokal:
     - `newsreader-400.woff2` (22,5 KB) & `newsreader-600.woff2` (23,9 KB)
     - `ibm-plex-sans-400.woff2` (22,6 KB), `-500.woff2` (24,2 KB), `-600.woff2` (24,3 KB)
     - `ibm-plex-mono-400.woff2` (14,6 KB), `-500.woff2` (14,9 KB)
     *(Total 143,5 KB — di bawah batas anggaran 150 KB).*
   - Mendeklarasikan `@font-face` di `src/index.css` dengan `src: url('/fonts/...woff2') format('woff2')` dan `font-display: swap`.
2. **Pencegahan Eksfiltrasi via CSP Terisolasi (`index.html`):**
   Ditambahkan tag meta CSP pembatas koneksi peramban di awal `<head>`:
   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
   />
   ```
3. **Pembersihan Blob URL (`src/data/repositori/lampiran.ts` & `src/kunjungan/Timeline.tsx`):**
   - Menambahkan utilitas `cabutUrlBlob(url: string)`:
     ```ts
     export function cabutUrlBlob(url: string): void {
       URL.revokeObjectURL(url)
     }
     ```
   - Mengisolasi penampil berkas/gambar lampiran ke sub-komponen `ItemLampiran` yang secara otomatis memanggil `cabutUrlBlob` saat unmount atau saat berkas berubah, sekaligus mengganti ikon emoji `📄` menjadi SVG inline.

---

## 4. Kesimpulan dan Rekomendasi

Arsitektur aplikasi sepenuhnya memenuhi prinsip **Local-First** dan **Zero-Cloud Backend** yang disyaratkan dalam PRD. Privasi data pengguna 100% terjaga di perangkat lokal.
