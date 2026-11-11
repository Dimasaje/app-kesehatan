/**
 * IndexedDB tidak ada di Node, jadi pengujian memasang implementasi palsu
 * (`fake-indexeddb`) sebelum modul basis data dimuat.
 */
import 'fake-indexeddb/auto'
