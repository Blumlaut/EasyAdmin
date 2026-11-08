import type { SidebarDirection, SidebarMode } from '../types'

/** Width of the expanded sidebar / taskbar. Keep in sync with layout.css. */
export const SIDEBAR_WIDTH = 260
export const TASKBAR_HEIGHT = 84

/** Width of the icon rail, the default folded appearance. */
export const RAIL_WIDTH = 64

/** Size of the floating chip. */
export const CHIP_SIZE = 56

export type FoldState = 'open' | 'rail' | 'chip'

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

interface GetFoldRectsOptions {
  /** Expanded window rect: current position plus the saved window size. */
  expandedRect: WindowRect
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  /** Height the sidebar needs in rail layout, measured from the live DOM. */
  railHeight: number
  viewport: { width: number; height: number }
}

/**
 * Geometry for every fold state, anchored to the same screen edge the
 * expanded window sits against so folding never makes the window drift.
 */
export function getFoldRects({
  expandedRect,
  sidebarMode,
  sidebarDirection,
  railHeight,
  viewport,
}: GetFoldRectsOptions): Record<FoldState, WindowRect> {
  const vertical = sidebarMode === 'vertical'
  const anchoredRight = vertical && sidebarDirection === 'left'
  const anchoredBottom = !vertical && sidebarDirection === 'up'

  const open = clampWindowRectToViewport(expandedRect, viewport)

  const railSize = vertical
    ? { width: RAIL_WIDTH, height: Math.min(railHeight, viewport.height) }
    : { width: Math.min(expandedRect.width, viewport.width), height: TASKBAR_HEIGHT }

  const anchorX = (width: number) => anchoredRight ? open.x + open.width - width : open.x
  const anchorY = (height: number) => anchoredBottom ? open.y + open.height - height : open.y

  return {
    open,
    rail: clampWindowRectToViewport(
      { x: anchorX(railSize.width), y: anchorY(railSize.height), ...railSize },
      viewport,
    ),
    chip: clampWindowRectToViewport(
      { x: anchorX(CHIP_SIZE), y: anchorY(CHIP_SIZE), width: CHIP_SIZE, height: CHIP_SIZE },
      viewport,
    ),
  }
}

/**
 * The rect between two states: full height at the folded width. Folding visits
 * it after the width shrinks, unfolding visits it before the width grows, so
 * both directions read as the panel peeling open sideways.
 */
export function getStripRect(from: FoldState, to: FoldState, rects: Record<FoldState, WindowRect>): WindowRect {
  const folded = from === 'open' ? rects[to] : rects[from]

  return {
    x: folded.x,
    y: rects.open.y,
    width: folded.width,
    height: rects.open.height,
  }
}

export function clampWindowRectToViewport(
  rect: WindowRect,
  viewport: { width: number; height: number },
): WindowRect {
  return {
    ...rect,
    x: Math.max(0, Math.min(viewport.width - rect.width, rect.x)),
    y: Math.max(0, Math.min(viewport.height - rect.height, rect.y)),
  }
}

export function rectsAreEqual(a: WindowRect, b: WindowRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

/** Natural height of the sidebar contents, with the nav laid out at its own size. */
export function measureRailHeight(windowEl: HTMLElement): number {
  const header = windowEl.querySelector<HTMLElement>('.sidebar-header')
  const nav = windowEl.querySelector<HTMLElement>('.sidebar-nav')
  if (!header || !nav) return CHIP_SIZE * 2

  const previousFlex = nav.style.flex
  const previousHeight = nav.style.height
  nav.style.flex = '0 0 auto'
  nav.style.height = 'auto'
  const height = header.offsetHeight + nav.offsetHeight
  nav.style.flex = previousFlex
  nav.style.height = previousHeight

  return Math.round(height)
}
