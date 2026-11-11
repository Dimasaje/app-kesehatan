/**
 * Membuat ikon PWA (PNG) tanpa dependensi gambar eksternal.
 * Jalankan: node scripts/generate-icons.mjs
 *
 * Ikon digambar sebagai raster RGBA di memori lalu di-encode ke PNG
 * (signature + IHDR + IDAT + IEND) memakai zlib bawaan Node.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BIRU = [0x2e, 0x5b, 0xea]
const PUTIH = [0xff, 0xff, 0xff]

/** Alfa dari fungsi jarak bertanda, diberi supersampling agar tepi halus. */
const SAMPEL = 4

function roundedRect(x, y, w, h, r) {
  return (px, py) => {
    const dx = Math.max(x + r - px, 0, px - (x + w - r))
    const dy = Math.max(y + r - py, 0, py - (y + h - r))
    return Math.hypot(dx, dy) - r
  }
}

function inside(sdf, px, py) {
  return sdf(px, py) <= 0
}

/** Cakupan 0..1 sebuah bidang pada satu piksel (supersampling SAMPEL x SAMPEL). */
function coverage(sdf, px, py) {
  let hit = 0
  for (let sy = 0; sy < SAMPEL; sy += 1) {
    for (let sx = 0; sx < SAMPEL; sx += 1) {
      if (inside(sdf, px + (sx + 0.5) / SAMPEL, py + (sy + 0.5) / SAMPEL)) hit += 1
    }
  }
  return hit / (SAMPEL * SAMPEL)
}

function blit(pixels, size, x, y, warna, alpha) {
  if (alpha <= 0) return
  const i = (y * size + x) * 4
  const a = Math.min(1, alpha)
  for (let c = 0; c < 3; c += 1) {
    pixels[i + c] = Math.round(pixels[i + c] * (1 - a) + warna[c] * a)
  }
  pixels[i + 3] = Math.round(pixels[i + 3] * (1 - a) + 255 * a)
}

/**
 * @param {number} size
 * @param {{ maskable: boolean }} opsi
 */
function gambarIkon(size, { maskable }) {
  const pixels = new Uint8Array(size * size * 4)
  const s = size / 512
  // Maskable: latar penuh sampai tepi. Selain itu: kartu bersudut bulat.
  const latar = maskable
    ? roundedRect(0, 0, size, size, 0)
    : roundedRect(0, 0, size, size, 96 * s)

  // Palang putih (rasio mengikuti zona aman maskable 80%).
  const tebal = 84 * s
  const lengan = 268 * s
  const cx = size / 2
  const cy = size / 2
  const palangH = roundedRect(cx - lengan / 2, cy - tebal / 2, lengan, tebal, tebal / 2)
  const palangV = roundedRect(cx - tebal / 2, cy - lengan / 2, tebal, lengan, tebal / 2)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const aLatar = coverage(latar, x, y)
      blit(pixels, size, x, y, BIRU, aLatar)
      const aPalang = Math.max(coverage(palangH, x, y), coverage(palangV, x, y))
      blit(pixels, size, x, y, PUTIH, aPalang * aLatar)
    }
  }
  return pixels
}

const TABEL_CRC = (() => {
  const tabel = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabel[n] = c >>> 0
  }
  return tabel
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = TABEL_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(tipe, data) {
  const panjang = Buffer.alloc(4)
  panjang.writeUInt32BE(data.length)
  const isi = Buffer.concat([Buffer.from(tipe, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(isi))
  return Buffer.concat([panjang, isi, crc])
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // kedalaman bit
  ihdr[9] = 6 // RGBA
  const mentah = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y += 1) {
    const baris = y * (size * 4 + 1)
    mentah[baris] = 0 // filter None
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(mentah, baris + 1)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(mentah, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const TARGET = [
  { berkas: 'icons/icon-192.png', size: 192, maskable: false },
  { berkas: 'icons/icon-512.png', size: 512, maskable: false },
  { berkas: 'icons/maskable-512.png', size: 512, maskable: true },
  { berkas: 'icons/apple-touch-icon.png', size: 180, maskable: true },
]

mkdirSync(resolve(OUT_DIR, 'icons'), { recursive: true })
for (const { berkas, size, maskable } of TARGET) {
  const png = encodePng(gambarIkon(size, { maskable }), size)
  writeFileSync(resolve(OUT_DIR, berkas), png)
  console.log(`ditulis public/${berkas} (${size}x${size}, ${png.length} byte)`)
}
