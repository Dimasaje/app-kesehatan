## Layar Tambahan — Cadangan & Pengaturan (Issue #15)

### Latar belakang

Layar **Riwayat** dan **Keluarga** sudah diimplementasikan developer (`Timeline.tsx`, `HalamanAnggota.tsx`, `RiwayatPenyakit.tsx`) dengan gaya konsisten. Fokus desain ini: **Cadangan** dan **Pengaturan** yang belum ada.

---

### File baru di `design/`

| File | Isi |
|------|-----|
| `LayarCadangan.css` | Kelas CSS referensi layar Cadangan |
| `LayarPengaturan.css` | Kelas CSS referensi layar Pengaturan |
| `preview-layar-tambahan.html` | Preview visual dua layar, buka di browser |

---

### Layar Cadangan

**Komponen & pola:**
- Header dengan tombol kembali (`btn btn-ghost`)
- **Kartu status cadangan** — border kiri biru/merah tergantung status, label font mono uppercase, waktu font mono, chip ukuran file
- **Kartu aksi** — grid 2 kolom: teks + tombol pill. Ekspor = `btn-primary`, Impor = `btn-secondary`
- **Spinner progres** — animasi putar, warna `--color-primary`, dengan `aria-live="polite"`
- **Catatan privasi** — blok `--color-blue-light`, teks xs, label mono uppercase

**State yang didesain:** sukses, error (penyimpanan penuh), sedang memproses.

---

### Layar Pengaturan

**Komponen & pola:**
- Header tanpa tombol kembali (layar root via nav bawah)
- **Grup berlabel** — label mono xs uppercase, daftar kartu putih `border-radius-md`
- **Item baris** — grid `1fr auto`, border-bottom antar item, min-height 44px
- **Toggle switch** — `input[type=checkbox]` asli tersembunyi + `.toggle-track/.toggle-thumb` visual; `label` terhubung via `for`/`id`; `focus-visible` tampil di track
- **Chip versi** — font mono, latar `--color-blue-light`
- **Item bahaya** — hover latar merah pudar, teks `--color-danger`
- **Blok privasi** — ringkas, warna `--color-blue-light`

**Grup:** Keamanan · Preferensi · Data & Privasi · Tentang

---

### Catatan inkonsistensi (untuk developer)

| Masalah | Lokasi | Rekomendasi |
|---------|--------|-------------|
| Warna `#4a5893` hardcoded | `Beranda.css`, `Timeline.css`, `RiwayatPenyakit.css` | Tambah `--color-muted: #4a5893` di `tokens.css` |
| Nav bawah belum diintegrasikan | `App.tsx` (hanya render `Beranda`) | Tambah router sederhana + `<nav class="bottom-nav">` |
| Ikon SVG sudah inline | Semua layar | Pertahankan — sesuai aturan |
| Riwayat & Keluarga | `Timeline.tsx`, `HalamanAnggota.tsx` | Sudah ada, tidak perlu mockup baru |

---

### Cara pakai (developer)

```html
<link rel="stylesheet" href="design/tokens.css" />
<link rel="stylesheet" href="design/LayarCadangan.css" />
<link rel="stylesheet" href="design/LayarPengaturan.css" />
```

Lihat `preview-layar-tambahan.html` untuk struktur HTML lengkap setiap layar.
