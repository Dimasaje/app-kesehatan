/**
 * Lapisan Kriptografi Cadangan (Issue #12, #13).
 *
 * Standar Keamanan:
 * - PBKDF2-SHA-256 dengan 210.000 iterasi untuk penurunan kunci enkripsi dari kata sandi.
 * - AES-GCM-256 dengan IV 12-byte unik per enkripsi.
 * - Format Biner Berkas (.rekam):
 *   [0..3]   : Magic bytes "REKM" (4 byte: 0x52, 0x45, 0x4B, 0x4D)
 *   [4]      : Versi format berkas cadangan (uint8: 1)
 *   [5..20]  : Salt PBKDF2 (16 byte)
 *   [21..32] : IV AES-GCM (12 byte)
 *   [33..]   : Ciphertext + Auth Tag AES-GCM (payload data terenkripsi)
 */

export const MAGIC_CADANGAN = new Uint8Array([0x52, 0x45, 0x4b, 0x4d]) // "REKM"
export const VERSI_FORMAT = 1
export const PANJANG_SALT = 16
export const PANJANG_IV = 12
export const ITERASI_PBKDF2 = 210_000

/**
 * Turunkan CryptoKey AES-GCM dari kata sandi teks dan salt acak.
 */
async function buatKunciEnkripsi(
  kataSandi: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const materiKunci = await crypto.subtle.importKey(
    'raw',
    enc.encode(kataSandi),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERASI_PBKDF2,
      hash: 'SHA-256',
    },
    materiKunci,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Enkripsi payload byte dengan kata sandi pengguna.
 * Menghasilkan Uint8Array format biner siap simpan / unduh.
 */
export async function enkripsiPayload(
  payloadBytes: Uint8Array<ArrayBuffer>,
  kataSandi: string,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!kataSandi || kataSandi.length < 4) {
    throw new Error('Kata sandi cadangan minimal 4 karakter.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(PANJANG_SALT)) as Uint8Array<ArrayBuffer>
  const iv = crypto.getRandomValues(new Uint8Array(PANJANG_IV)) as Uint8Array<ArrayBuffer>
  const key = await buatKunciEnkripsi(kataSandi, salt)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    payloadBytes,
  )

  const ciphertext = new Uint8Array(ciphertextBuffer) as Uint8Array<ArrayBuffer>

  // Rakit biner: MAGIC (4) + VERSI (1) + SALT (16) + IV (12) + CIPHERTEXT
  const totalLength = MAGIC_CADANGAN.length + 1 + PANJANG_SALT + PANJANG_IV + ciphertext.length
  const hasil = new Uint8Array(totalLength) as Uint8Array<ArrayBuffer>

  hasil.set(MAGIC_CADANGAN, 0)
  hasil[4] = VERSI_FORMAT
  hasil.set(salt, 5)
  hasil.set(iv, 5 + PANJANG_SALT)
  hasil.set(ciphertext, 5 + PANJANG_SALT + PANJANG_IV)

  return hasil
}

/**
 * Dekripsi berkas biner cadangan dengan kata sandi pengguna.
 * Mengembalikan payload byte asli yang belum terenkripsi.
 */
export async function dekripsiPayload(
  fileBytes: Uint8Array<ArrayBuffer>,
  kataSandi: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const headerMin = MAGIC_CADANGAN.length + 1 + PANJANG_SALT + PANJANG_IV
  if (fileBytes.length <= headerMin) {
    throw new Error('Berkas cadangan tidak valid atau rusak (ukuran terlalu kecil).')
  }

  // Verifikasi magic bytes
  for (let i = 0; i < MAGIC_CADANGAN.length; i++) {
    if (fileBytes[i] !== MAGIC_CADANGAN[i]) {
      throw new Error('Format berkas tidak dikenali. Pastikan memilih berkas .rekam yang valid.')
    }
  }

  const versi = fileBytes[4]
  if (versi !== VERSI_FORMAT) {
    throw new Error(`Versi format cadangan (${versi}) tidak didukung oleh aplikasi ini.`)
  }

  const salt = fileBytes.slice(5, 5 + PANJANG_SALT) as Uint8Array<ArrayBuffer>
  const iv = fileBytes.slice(5 + PANJANG_SALT, 5 + PANJANG_SALT + PANJANG_IV) as Uint8Array<ArrayBuffer>
  const ciphertext = fileBytes.slice(headerMin) as Uint8Array<ArrayBuffer>

  let key: CryptoKey
  try {
    key = await buatKunciEnkripsi(kataSandi, salt)
  } catch (err) {
    throw new Error(`Gagal menurunkan kunci enkripsi: ${err instanceof Error ? err.message : String(err)}`)
  }

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    )
    return new Uint8Array(plainBuffer) as Uint8Array<ArrayBuffer>
  } catch {
    throw new Error('Kata sandi salah atau isi berkas telah dimodifikasi/rusak.')
  }
}
