import type { SVGProps } from 'react'

// Icon size tokens
const SIZES: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  name: IconName
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export type IconName =
  | 'users'
  | 'shield'
  | 'settings'
  | 'server'
  | 'alert-triangle'
  | 'x'
  | 'search'
  | 'chevron-left'
  | 'zap'
  | 'eye'
  | 'map-pin'
  | 'snowflake'
  | 'volume-x'
  | 'camera'
  | 'ban'
  | 'log-out'
  | 'clock'
  | 'star'
  | 'menu'
  | 'home'
  | 'archive'

export function Icon({ name, size = 'md', className, ...props }: IconProps) {
  const dimension = SIZES[size] ?? SIZES.md
  const icon = ICONS[name]
  if (!icon) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {icon}
    </svg>
  )
}

// Icon library -- each returns JSX elements for the SVG body
const ICONS: Record<IconName, JSX.Element> = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  settings: (
    <>
      <circle cx={12} cy={12} r={3} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  server: (
    <>
      <rect x={2} y={2} width={20} height={8} rx={2} ry={2} />
      <rect x={2} y={14} width={20} height={8} rx={2} ry={2} />
      <line x1={6} y1={6} x2={6.01} y2={6} />
      <line x1={6} y1={18} x2={6.01} y2={18} />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </>
  ),
  x: (
    <>
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </>
  ),
  search: (
    <>
      <circle cx={11} cy={11} r={8} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} />
    </>
  ),
  'chevron-left': (
    <polyline points="15 18 9 12 15 6" />
  ),
  zap: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </>
  ),
  'map-pin': (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx={12} cy={10} r={3} />
    </>
  ),
  snowflake: (
    <>
      <line x1={2} y1={12} x2={22} y2={12} />
      <line x1={12} y1={2} x2={12} y2={22} />
      <line x1={4.93} y1={4.93} x2={19.07} y2={19.07} />
      <line x1={19.07} y1={4.93} x2={4.93} y2={19.07} />
    </>
  ),
  'volume-x': (
    <>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1={23} y1={9} x2={17} y2={15} />
      <line x1={17} y1={9} x2={23} y2={15} />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx={12} cy={13} r={4} />
    </>
  ),
  ban: (
    <>
      <circle cx={12} cy={12} r={10} />
      <line x1={4.93} y1={4.93} x2={19.07} y2={19.07} />
    </>
  ),
  'log-out': (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </>
  ),
  clock: (
    <>
      <circle cx={12} cy={12} r={10} />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  menu: (
    <>
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </>
  ),
  home: (
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  archive: (
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x={1} y={3} width={22} height={5} />
      <line x1={10} y1={12} x2={14} y2={12} />
    </>
  ),
}
