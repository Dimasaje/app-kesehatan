/**
 * Operasi kriptografi untuk kunci PIN (Issue #5).
 * Pakai Web Crypto API bawaan browser — tidak ada dependensi tambahan.
 *
 * Skema: PBKDF2-SHA-256, salt 16 byte acak, 210.000 iterasi, output 32 byte.
 */

const ALGORITMA = 'PBKDF2'
const HASH = 'SHA-256'
const PANJANG_KUNCI = 256
const PANJANG_SALT = 16

function base64Encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64Decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function turunkanKunci(pin: string, salt: Uint8Array<ArrayBuffer>, iterasi: number): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const materi = await crypto.subtle.importKey('raw', enc.encode(pin), ALGORITMA, false, [
    'deriveBits',
  ])
  return crypto.subtle.deriveBits(
    { name: ALGORITMA, salt, iterations: iterasi, hash: HASH },
    materi,
    PANJANG_KUNCI,
  )
}

export interface HasilHash {
  hash: string   // base64
  salt: string   // base64
  iterasi: number
}

/** Buat hash PIN baru dengan salt acak. */
export async function hashPin(pin: string, iterasi = 210_000): Promise<HasilHash> {
  const salt = crypto.getRandomValues(new Uint8Array(PANJANG_SALT)) as Uint8Array<ArrayBuffer>
  const bits = await turunkanKunci(pin, salt, iterasi)
  return {
    hash: base64Encode(bits),
    salt: base64Encode(salt.buffer),
    iterasi,
  }
}

/** Verifikasi PIN terhadap hash yang tersimpan. */
export async function verifikasiPin(
  pin: string,
  hashTersimpan: string,
  saltTersimpan: string,
  iterasi: number,
): Promise<boolean> {
  const saltArr = base64Decode(saltTersimpan)
  const salt = new Uint8Array(saltArr) as Uint8Array<ArrayBuffer>
  const bits = await turunkanKunci(pin, salt, iterasi)
  return base64Encode(bits) === hashTersimpan
}
