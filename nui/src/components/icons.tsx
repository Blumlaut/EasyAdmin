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
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-double-left'
  | 'chevron-double-right'
  | 'arrow-left'
  | 'arrow-right'
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
  | 'plus'
  | 'edit'
  | 'trash'
  | 'trash-2'
  | 'check'
  | 'refresh'
  | 'message-square'
  | 'globe'
  | 'flag'
  | 'flag-triangle'
  | 'activity'
  | 'gauge'
  | 'layers'
  | 'box'
  | 'user-minus'
  | 'external-link'
  | 'arrow-up-circle'
  | 'play'
  | 'square'
  | 'code'
  | 'git-branch'
  | 'layout-grid'
  | 'compass'
  | 'sliders'
  | 'mouse-pointer-click'
  | 'grip-vertical'

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
const ICONS: Record<IconName, React.ReactNode> = {
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
  'chevron-right': (
    <polyline points="9 18 15 12 9 6" />
  ),
  'chevron-down': (
    <polyline points="6 9 12 15 18 9" />
  ),
  'chevron-up': (
    <polyline points="18 15 12 9 6 15" />
  ),
  'chevron-double-left': (
    <>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </>
  ),
  'chevron-double-right': (
    <>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </>
  ),
  'arrow-left': (
    <>
      <line x1={19} y1={12} x2={5} y2={12} />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  'arrow-right': (
    <>
      <line x1={5} y1={12} x2={19} y2={12} />
      <polyline points="12 5 19 12 12 19" />
    </>
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
  plus: (
    <>
      <line x1={12} y1={5} x2={12} y2={19} />
      <line x1={5} y1={12} x2={19} y2={12} />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </>
  ),
  'trash-2': (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1={10} y1={11} x2={10} y2={17} />
      <line x1={14} y1={11} x2={14} y2={17} />
    </>
  ),
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  'message-square': (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
  globe: (
    <>
      <circle cx={12} cy={12} r={10} />
      <line x1={2} y1={12} x2={22} y2={12} />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1={4} y1={22} x2={4} y2={15} />
    </>
  ),
  'flag-triangle': (
    <path d="M4 22V3l16 9-16 9z" />
  ),
  activity: (
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  ),
  gauge: (
    <>
      <path d="M15 6v.01" />
      <path d="M12 9v.01" />
      <path d="M9 6v.01" />
      <path d="M6 9v.01" />
      <circle cx={12} cy={12} r={10} />
      <path d="M12 8v4l3 3" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  box: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1={12} y1={22.08} x2={12} y2={12} />
    </>
  ),
  'user-minus': (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <line x1={23} y1={8} x2={23} y2={16} />
    </>
  ),
  'external-link': (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1={10} y1={14} x2={21} y2={3} />
    </>
  ),
  'arrow-up-circle': (
    <>
      <circle cx={12} cy={12} r={10} />
      <polyline points="12 16 16 12 12 8" />
      <line x1={8} y1={12} x2={16} y2={12} />
    </>
  ),
  play: (
    <polygon points="5 3 19 12 5 21 5 3" />
  ),
  square: (
    <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
  ),
  code: (
    <polyline points="16 18 22 12 16 6" />
  ),
  'git-branch': (
    <>
      <line x1={6} y1={3} x2={6} y2={15} />
      <circle cx={18} cy={6} r={3} />
      <circle cx={6} cy={18} r={3} />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  'layout-grid': (
    <>
      <rect x={3} y={3} width={7} height={7} rx={1} />
      <rect x={14} y={3} width={7} height={7} rx={1} />
      <rect x={14} y={14} width={7} height={7} rx={1} />
      <rect x={3} y={14} width={7} height={7} rx={1} />
    </>
  ),
  compass: (
    <>
      <circle cx={12} cy={12} r={10} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  sliders: (
    <>
      <line x1={4} y1={21} x2={4} y2={14} />
      <line x1={4} y1={10} x2={4} y2={3} />
      <line x1={12} y1={21} x2={12} y2={12} />
      <line x1={12} y1={8} x2={12} y2={3} />
      <line x1={20} y1={21} x2={20} y2={16} />
      <line x1={20} y1={12} x2={20} y2={3} />
      <line x1={1} y1={14} x2={7} y2={14} />
      <line x1={9} y1={8} x2={15} y2={8} />
      <line x1={17} y1={16} x2={23} y2={16} />
    </>
  ),
  'mouse-pointer-click': (
    <>
      <path d="M9 9l3 9 1.5-3.5L17 13z" />
      <path d="M6 4l1.5 1.5" />
      <path d="M4 6l1.5 1.5" />
      <path d="M2 9l2 0" />
      <path d="M4 12l1.5-1.5" />
      <path d="M6 14l1.5-1.5" />
      <path d="M9 6l0 2" />
    </>
  ),
  'grip-vertical': (
    <>
      <circle cx={9} cy={5} r={1.5} />
      <circle cx={9} cy={12} r={1.5} />
      <circle cx={9} cy={19} r={1.5} />
      <circle cx={15} cy={5} r={1.5} />
      <circle cx={15} cy={12} r={1.5} />
      <circle cx={15} cy={19} r={1.5} />
    </>
  ),
}
