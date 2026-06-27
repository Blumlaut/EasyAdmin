import React, { type SVGProps } from 'react'
import {
  Activity, AlertCircle, AlertTriangle, Archive, ArrowDownCircle, ArrowLeft,
  ArrowRight, ArrowUpCircle, ArrowUpDown, AtSign, Ban, Bell, BookOpen, Box,
  Calendar, Camera, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, ChevronsDown, ChevronsLeft, ChevronsRight, ChevronsUp, ChartBar,
  Clipboard as ClipboardIcon, Clock, Code, Compass, Copy, CornerDownRight, Cpu,
  Database, Download, Edit, Eye, EyeOff, ExternalLink, FileSearch, FileText,
  Filter, Flag, FlagTriangleRight, Globe, GripVertical, HardDrive, Hash, Home,
  LayoutGrid as LayoutGridIcon, GitBranch as GitBranchIcon, Gauge as GaugeIcon,
  Menu as MenuIcon, RefreshCw, Mail, Map, MapPin, Maximize, MessageSquare,
  Minimize, Monitor, MousePointerClick, Navigation, Plus, Play, Phone, Search,
  Server, Settings, Shield, ShieldAlert, ShieldCheck, Signal, Sliders, Snowflake,
  Star, Square, Terminal as TerminalIcon, Tag, Trash, Trash2, TrendingUp, Unlock,
  Upload, User, UserCheck, UserMinus, UserSearch, UserX, Users, Volume2, VolumeX,
  Wifi, Zap, Loader2, Lock, LogOut, History, Info, Key, Layers, Link, X,
} from 'lucide-react'

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
  // Navigation
  | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'chevron-up'
  | 'chevron-double-left' | 'chevron-double-right' | 'chevron-double-up' | 'chevron-double-down'
  | 'arrow-left' | 'arrow-right' | 'arrow-up-circle' | 'arrow-down-circle' | 'arrow-up-down' | 'corner-down-right'
  // Core UI
  | 'x' | 'plus' | 'check' | 'search' | 'refresh' | 'edit' | 'trash' | 'trash-2'
  | 'copy' | 'filter' | 'link' | 'external-link'
  | 'maximize' | 'minimize' | 'menu' | 'home' | 'archive'
  | 'play' | 'square' | 'loader-2'
  // Status / Feedback
  | 'alert-triangle' | 'alert-circle' | 'check-circle' | 'info'
  | 'shield' | 'shield-alert' | 'shield-check'
  | 'lock' | 'unlock' | 'key'
  | 'ban' | 'star' | 'flag' | 'flag-triangle'
  | 'activity' | 'gauge' | 'zap' | 'trending-up'
  // People
  | 'users' | 'user' | 'user-check' | 'user-minus' | 'user-x' | 'user-search'
  // Communication
  | 'message-square' | 'mail' | 'phone' | 'at-sign' | 'bell'
  // Media / View
  | 'eye' | 'eye-off' | 'camera' | 'volume-x' | 'volume-2'
  | 'chart-bar' | 'compass' | 'sliders' | 'mouse-pointer-click'
  // Files / Data
  | 'box' | 'database' | 'hard-drive' | 'file-text' | 'file-search'
  | 'layers' | 'layout-grid' | 'code' | 'terminal' | 'git-branch'
  | 'download' | 'upload' | 'clipboard'
  // Location / Map
  | 'map-pin' | 'map' | 'navigation'
  // Time
  | 'clock' | 'calendar' | 'history'
  // Server / System
  | 'server' | 'settings' | 'globe' | 'snowflake'
  | 'cpu' | 'monitor' | 'wifi' | 'signal'
  | 'book-open' | 'tag' | 'hash'
  // Actions
  | 'log-out' | 'grip-vertical'
  // Brand logos (hand-crafted, not in lucide-react)
  | 'discord' | 'github'

// lucide-react v1.x exports class components (objects with { render }), not function components.
// This helper detects them and renders via React.createElement.
function isLucideComponent(value: unknown): value is { new (props: Record<string, unknown>): unknown } {
  return typeof value === 'object' && value !== null && 'render' in value
}

export function Icon({ name, size = 'md', className, ...props }: IconProps) {
  const dimension = SIZES[size] ?? SIZES.md
  const icon = ICONS[name]
  if (!icon) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  // Lucide components render their own <svg>; brand icons are raw JSX rendered inside our wrapper
  if (isLucideComponent(icon)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.createElement(icon as any, { size: dimension, className, ...props })
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

// Brand icon names (hand-crafted SVGs, not available in lucide-react)
const BRAND_ICONS: Record<string, React.ReactNode> = {
  discord: (
    <>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.42 13.42 0 0 0-.606 1.215 18.41 18.41 0 0 0-5.487 0 13.489 13.489 0 0 0-.623-1.215.074.074 0 0 0-.078-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      <path d="M19.488 13.404a1.16 1.16 0 0 1-1.161 1.161 1.16 1.16 0 0 1-1.16-1.161c0-.643.522-1.161 1.16-1.161s1.161.519 1.161 1.161z" />
      <path d="M11.5 14.564a1.16 1.16 0 0 1-1.16-1.16 1.16 1.16 0 0 1 1.16-1.161 1.16 1.16 0 0 1 1.16 1.161 1.16 1.16 0 0 1-1.16 1.16z" />
    </>
  ),
  github: (
    <path d="M15 22v-4a4.77 4.77 0 0 0-1.32-3.54 4.77 4.77 0 0 0-3.54-1.32H9a4.77 4.77 0 0 0-3.54 1.32A4.77 4.77 0 0 0 4.14 18v4H2v-4a6.77 6.77 0 0 1 1.96-4.78A6.77 6.77 0 0 1 9 8.46h1.14a6.77 6.77 0 0 1 4.78 1.96A6.77 6.77 0 0 1 18 15.2v4h-2zM9 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
  ),
}

// Lucide icon library — each value is a lucide-react component
const LUCIDE_ICONS = {
  // Navigation
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-double-left': ChevronsLeft,
  'chevron-double-right': ChevronsRight,
  'chevron-double-up': ChevronsUp,
  'chevron-double-down': ChevronsDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-circle': ArrowUpCircle,
  'arrow-down-circle': ArrowDownCircle,
  'arrow-up-down': ArrowUpDown,
  'corner-down-right': CornerDownRight,
  // Core UI
  x: X,
  plus: Plus,
  check: Check,
  search: Search,
  refresh: RefreshCw,
  edit: Edit,
  trash: Trash,
  'trash-2': Trash2,
  copy: Copy,
  filter: Filter,
  link: Link,
  'external-link': ExternalLink,
  maximize: Maximize,
  minimize: Minimize,
  menu: MenuIcon,
  home: Home,
  archive: Archive,
  play: Play,
  square: Square,
  'loader-2': Loader2,
  // Status / Feedback
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  info: Info,
  shield: Shield,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  ban: Ban,
  star: Star,
  flag: Flag,
  'flag-triangle': FlagTriangleRight,
  activity: Activity,
  gauge: GaugeIcon,
  zap: Zap,
  'trending-up': TrendingUp,
  // People
  users: Users,
  user: User,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'user-x': UserX,
  'user-search': UserSearch,
  // Communication
  'message-square': MessageSquare,
  mail: Mail,
  phone: Phone,
  'at-sign': AtSign,
  bell: Bell,
  // Media / View
  eye: Eye,
  'eye-off': EyeOff,
  camera: Camera,
  'volume-x': VolumeX,
  'volume-2': Volume2,
  'chart-bar': ChartBar,
  compass: Compass,
  sliders: Sliders,
  'mouse-pointer-click': MousePointerClick,
  // Files / Data
  box: Box,
  database: Database,
  'hard-drive': HardDrive,
  'file-text': FileText,
  'file-search': FileSearch,
  layers: Layers,
  'layout-grid': LayoutGridIcon,
  code: Code,
  terminal: TerminalIcon,
  'git-branch': GitBranchIcon,
  download: Download,
  upload: Upload,
  clipboard: ClipboardIcon,
  // Location / Map
  'map-pin': MapPin,
  map: Map,
  navigation: Navigation,
  // Time
  clock: Clock,
  calendar: Calendar,
  history: History,
  // Server / System
  server: Server,
  settings: Settings,
  globe: Globe,
  snowflake: Snowflake,
  cpu: Cpu,
  monitor: Monitor,
  wifi: Wifi,
  signal: Signal,
  'book-open': BookOpen,
  tag: Tag,
  hash: Hash,
  // Actions
  'log-out': LogOut,
  'grip-vertical': GripVertical,
} as const

// Unified lookup: brand icons first, then lucide icons
const ICONS: Record<IconName, React.ReactNode> = Object.fromEntries([
  ...Object.entries(BRAND_ICONS),
  ...Object.entries(LUCIDE_ICONS),
]) as Record<IconName, React.ReactNode>
