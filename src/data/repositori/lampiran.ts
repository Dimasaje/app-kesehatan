/**
 * Repositori lampiran foto (Issue #8).
 * Berkas disimpan sebagai Blob di IndexedDB — tidak pernah diunggah.
 */
import { basisData, waktuSekarang } from '../db'
import type { Lampiran, JenisLampiran, Id } from '../skema'

export async function tambahLampiran(
  kunjunganId: Id,
  berkas: File,
  jenis: JenisLampiran,
): Promise<number> {
  return basisData().lampiran.add({
    kunjunganId,
    nama: berkas.name,
    jenis,
    mime: berkas.type,
    ukuran: berkas.size,
    blob: berkas,
    dibuatPada: waktuSekarang(),
  })
}

export async function daftarLampiran(kunjunganId: Id): Promise<Lampiran[]> {
  return basisData().lampiran.where('kunjunganId').equals(kunjunganId).toArray()
}

export async function hapusLampiran(id: Id): Promise<void> {
  await basisData().lampiran.delete(id)
}

export function urlBlob(blob: Blob): string {
  return URL.createObjectURL(blob)
}
