/**
 * Bar navigasi bawah (design/components.css .bottom-nav).
 * Memakai SVG inline — tidak ada emoji sebagai ikon (PRD bagian 10).
 */
import type { ReactNode } from 'react'
import './NavBawah.css'

export type TabNav = 'beranda' | 'riwayat' | 'pengingat' | 'pengaturan'

interface Props {
  aktif: TabNav
  onChange(tab: TabNav): void
}

interface ItemNav {
  id: TabNav
  label: string
  ikon: ReactNode
}

const ITEM: ItemNav[] = [
  {
    id: 'beranda',
    label: 'Beranda',
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12v9h18V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'riwayat',
    label: 'Riwayat',
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'pengingat',
    label: 'Pengingat',
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function NavBawah({ aktif, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {ITEM.map(({ id, label, ikon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item ${aktif === id ? 'bottom-nav__item--active' : ''}`}
          aria-current={aktif === id ? 'page' : undefined}
          onClick={() => onChange(id)}
          aria-label={label}
        >
          {ikon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
