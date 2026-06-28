import React, { type SVGProps } from 'react'
import * as Lucide from 'lucide-react'

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

// Commonly-used icon names for IDE autocomplete.
// Any valid lucide-react icon name (kebab-case) works at runtime — these are just hints.
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
  // Accept any string so plugins can use any lucide icon name at runtime
  | (string & {})

// kebab-case → PascalCase: "chevron-double-left" → "ChevronDoubleLeft"
function toPascalCase(kebab: string): string {
  return kebab.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase())
}

// lucide-react v1.x exports class components (objects with { render }), not function components.
// This helper detects them and renders via React.createElement.
function isLucideComponent(value: unknown): value is { new (props: Record<string, unknown>): unknown } {
  return typeof value === 'object' && value !== null && 'render' in value
}

// Resolve a kebab-case icon name to a lucide-react component.
// Tries the direct PascalCase name first, then falls back to the `*Icon` suffixed variant.
function resolveLucideIcon(name: string): typeof Lucide.AlertTriangle | null {
  const pascal = toPascalCase(name)
  // Try direct name first (e.g. "ChevronLeft"), then suffixed variant (e.g. "ChevronLeftIcon")
  const component = Lucide[pascal as keyof typeof Lucide] ?? Lucide[`${pascal}Icon` as keyof typeof Lucide]
  if (component && isLucideComponent(component)) {
    return component as typeof Lucide.AlertTriangle
  }
  return null
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

// Name aliases — map our icon names to the correct lucide-react export names
const NAME_ALIASES: Record<string, string> = {
  refresh: 'refresh-cw',
  'flag-triangle': 'flag-triangle-right',
  'chevron-double-left': 'chevrons-left',
  'chevron-double-right': 'chevrons-right',
  'chevron-double-up': 'chevrons-up',
  'chevron-double-down': 'chevrons-down',
}

export function Icon({ name, size = 'md', className, ...props }: IconProps) {
  const dimension = SIZES[size] ?? SIZES.md

  // Brand icons use our hand-crafted SVG wrapper
  if (name in BRAND_ICONS) {
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
        {BRAND_ICONS[name]}
      </svg>
    )
  }

  // Resolve lucide icon dynamically from name (kebab-case → PascalCase)
  const resolvedName = NAME_ALIASES[name] ?? name
  const icon = resolveLucideIcon(resolvedName)
  if (!icon) {
    console.warn(`Icon "${name}" not found in lucide-react`)
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.createElement(icon as any, { size: dimension, className, ...props })
}
