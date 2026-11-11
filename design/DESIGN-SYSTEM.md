# Sistem Desain — Rekam Keluarga
Issue #2 · Milestone 1

## File

| File | Isi |
|------|-----|
| `design/tokens.css` | Variabel CSS: warna, tipografi, jarak, radius, bayangan |
| `design/components.css` | Komponen siap pakai (import tokens.css lebih dulu) |
| `design/preview.html` | Preview visual semua komponen |

---

## Token Warna

| Token | Nilai | Kegunaan |
|-------|-------|----------|
| `--color-primary` | `#2E5BEA` | Tombol aksi, penekanan, border aktif |
| `--color-ink` | `#14226B` | Teks utama |
| `--color-blue-light` | `#DCE5FB` | Latar kartu, chip, hover |
| `--color-bg` | `#EEF2FF` | Latar halaman |
| `--color-white` | `#FFFFFF` | Kartu, navigasi |
| `--color-success` | `#1A7A4A` | Status positif |
| `--color-warning` | `#B45309` | Peringatan |
| `--color-danger` | `#C0392B` | Error, hapus |

Kontras `--color-ink` (#14226B) atas `--color-white`: **14.1:1** ✓  
Kontras `--color-primary` (#2E5BEA) atas `--color-white`: **4.6:1** ✓  

---

## Token Tipografi

| Token | Nilai | Kegunaan |
|-------|-------|----------|
| `--font-heading` | Newsreader, serif | Judul kartu, nama anggota |
| `--font-body` | IBM Plex Sans | Teks isi, label, tombol |
| `--font-mono` | IBM Plex Mono | Tanggal, golongan darah, label kecil |

Skala ukuran: `xs` 12px · `sm` 14px · `base` 16px · `lg` 18px · `xl` 22px · `2xl` 28px

---

## Token Jarak & Lainnya

```
--space-{1–8}: 4px hingga 32px
--radius-sm: 6px  |  --radius-md: 12px  |  --radius-pill: 9999px
--touch-min: 44px   (semua kontrol interaktif)
--border-width: 1.5px
```

---

## Komponen

### 1. Tombol Pill
```html
<button class="btn btn-primary">Simpan</button>
<button class="btn btn-secondary">Batal</button>
<button class="btn btn-ghost">Lihat Semua</button>
<button class="btn btn-primary" disabled>Nonaktif</button>
```
Varian: `btn-primary`, `btn-secondary`, `btn-ghost`. Min-height 44px.

### 2. Kartu Sampul Anggota
```html
<article class="cover-card">
  <div class="cover-card__avatar">A</div>
  <div class="cover-card__meta">
    <span class="blood-stamp">O+</span>
    <h2 class="cover-card__name">Budi Santoso</h2>
    <p class="cover-card__role">Ayah</p>
  </div>
</article>
```
Border kiri biru, bayangan ringan. `.blood-stamp` = cap miring font mono.

### 3. Kotak Tanggal (cap gaya buku)
```html
<time class="date-stamp" datetime="2026-11-11">11 Nov 2026</time>
```
Font mono, border kotak, latar `--color-bg`.

### 4. Tag / Chip
```html
<span class="tag">Imunisasi</span>
<span class="tag tag--primary">Aktif</span>
```

### 5. Input Bergaris
```html
<div class="field">
  <label class="field__label" for="nama">Nama Lengkap</label>
  <input class="field__input" id="nama" type="text" placeholder="Masukkan nama" />
  <span class="field__hint">Wajib diisi</span>
</div>
```
Border bawah saja, tanpa kotak. Fokus = border biru.

### 6. Bar Navigasi Bawah
```html
<nav class="bottom-nav" aria-label="Navigasi utama">
  <a class="bottom-nav__item bottom-nav__item--active" href="/beranda" aria-current="page">
    <svg><!-- ikon --></svg>
    <span>Beranda</span>
  </a>
  <a class="bottom-nav__item" href="/keluarga">
    <svg><!-- ikon --></svg>
    <span>Keluarga</span>
  </a>
</nav>
```
Fixed bottom, tinggi 64px, safe-area-inset didukung.

### 7. Area Aksi (garis putus-putus)
```html
<button class="dashed-action" type="button">+ Tambah Anggota</button>
```
Border putus-putus biru, penanda area kosong yang bisa diisi.

---

## Cara Pakai (Developer)

```html
<head>
  <link rel="stylesheet" href="design/tokens.css" />
  <link rel="stylesheet" href="design/components.css" />
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet" />
</head>
```

Semua token tersedia sebagai CSS custom property — gunakan langsung di komponen tambahan, misal:
```css
.kartu-vaksin {
  background: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  font-family: var(--font-body);
  color: var(--color-ink);
}
```
