import type { SVGProps } from 'react'

/** Небольшой набор линейных иконок (без внешней библиотеки — CSP и размер бандла) */
type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const InboxIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 13l2.5-7h13L21 13v6H3z" />
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
  </svg>
)
export const PenIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
)
export const JournalIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 4h12l4 4v12H4z" />
    <path d="M8 12h8M8 16h8M8 8h4" />
  </svg>
)
export const BuildingIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M4 21h17" />
    <path d="M8 8h3M8 12h3M8 16h3" />
  </svg>
)
export const SearchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)
export const FileIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 3h8l5 5v13H6z" />
    <path d="M14 3v5h5" />
  </svg>
)
export const XIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const AlertIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
  </svg>
)
export const ListIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
export const GridIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
)
export const LogoutIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M10 17l5-5-5-5M15 12H3M13 4h5a2 2 0 012 2v12a2 2 0 01-2 2h-5" />
  </svg>
)

/** Логотип: словесный знак серифом с квадратной «маркой» — без цветного квадрата с иконкой */
export const Logo = ({ className = '' }: { className?: string }) => (
  <span className={`inline-flex items-baseline gap-2 ${className}`}>
    <span className="inline-block h-3 w-3 translate-y-px bg-ink" aria-hidden="true" />
    <span className="font-serif text-xl font-bold leading-none tracking-tight">ДокПоток</span>
  </span>
)
