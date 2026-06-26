import type { SidebarDirection, SidebarMode } from '../types'

export const COLLAPSED_SIDEBAR_WIDTH = 260
export const COLLAPSED_TASKBAR_HEIGHT = 84

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

interface GetTargetWindowRectOptions {
  currentRect: WindowRect
  expandedSize: { width: number; height: number }
  nextCollapsed: boolean
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
}

export function getTargetWindowRect({
  currentRect,
  expandedSize,
  nextCollapsed,
  sidebarMode,
  sidebarDirection,
}: GetTargetWindowRectOptions): WindowRect {
  const width = sidebarMode === 'horizontal'
    ? expandedSize.width
    : (nextCollapsed ? COLLAPSED_SIDEBAR_WIDTH : expandedSize.width)

  const height = sidebarMode === 'horizontal'
    ? (nextCollapsed ? COLLAPSED_TASKBAR_HEIGHT : expandedSize.height)
    : expandedSize.height

  const x = sidebarMode === 'vertical' && sidebarDirection === 'left'
    ? currentRect.x + currentRect.width - width
    : currentRect.x

  const y = sidebarMode === 'horizontal' && sidebarDirection === 'up'
    ? currentRect.y + currentRect.height - height
    : currentRect.y

  return { x, y, width, height }
}

interface GetRenderedWindowSizeOptions {
  contentCollapsed: boolean
  sidebarMode: SidebarMode
  expandedSize: { width: number; height: number }
}

export function getRenderedWindowSize({
  contentCollapsed,
  sidebarMode,
  expandedSize,
}: GetRenderedWindowSizeOptions) {
  if (!contentCollapsed) return expandedSize

  return {
    width: sidebarMode === 'horizontal' ? expandedSize.width : COLLAPSED_SIDEBAR_WIDTH,
    height: sidebarMode === 'horizontal' ? COLLAPSED_TASKBAR_HEIGHT : expandedSize.height,
  }
}

export function clampWindowRectToViewport(rect: WindowRect, viewport: { width: number; height: number }): WindowRect {
  return {
    ...rect,
    x: Math.max(0, Math.min(viewport.width - rect.width, rect.x)),
    y: Math.max(0, Math.min(viewport.height - rect.height, rect.y)),
  }
}
