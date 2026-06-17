import { useCallback, RefObject } from 'react'
import type { SidebarDirection, SidebarMode } from '../types'

const COLLAPSE_DURATION = 180
const COLLAPSED_WIDTH = 260
const COLLAPSED_HEIGHT = 84

export function useCollapse(
  windowRef: RefObject<HTMLDivElement | null>,
  contentCollapsed: boolean,
  setContentCollapsed: (v: boolean) => void,
  getExpandedWidth: () => number,
  getExpandedHeight: () => number,
  sidebarMode: SidebarMode,
  sidebarDirection: SidebarDirection,
  onAnimationFinish?: () => void,
) {
  const toggleCollapsed = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const isCollapsing = !contentCollapsed
    const isHorizontal = sidebarMode === 'horizontal'
    const toWidth = isHorizontal ? getExpandedWidth() : (isCollapsing ? COLLAPSED_WIDTH : getExpandedWidth())
    const toHeight = isHorizontal ? (isCollapsing ? COLLAPSED_HEIGHT : getExpandedHeight()) : getExpandedHeight()
    const contentEl = el.querySelector(':scope > div:not(.sidebar)') as HTMLElement | null

    if (contentEl) {
      const w = contentEl.offsetWidth || Math.max(0, getExpandedWidth() - COLLAPSED_WIDTH)
      const h = contentEl.offsetHeight || Math.max(0, getExpandedHeight() - COLLAPSED_HEIGHT)
      contentEl.style.position = 'absolute'
      contentEl.style.width = `${w}px`
      contentEl.style.height = `${h}px`

      if (isHorizontal) {
        contentEl.style.left = '0'
        contentEl.style.top = sidebarDirection === 'up' ? '0' : `${COLLAPSED_HEIGHT}px`
      } else {
        contentEl.style.left = sidebarDirection === 'left' ? '0' : `${COLLAPSED_WIDTH}px`
        contentEl.style.top = '0'
      }
    }

    document.documentElement.style.overflowX = 'hidden'
    document.documentElement.style.overflowY = 'hidden'

    const sizeAnim = el.animate(
      [
        { width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` },
        { width: `${toWidth}px`, height: `${toHeight}px` },
      ],
      { duration: COLLAPSE_DURATION, easing: 'ease-out', fill: 'forwards' },
    )
    const contentAnim = contentEl?.animate(
      isHorizontal
        ? [
            { clipPath: isCollapsing ? 'inset(0 0 0 0)' : (sidebarDirection === 'up' ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)') },
            { clipPath: isCollapsing ? (sidebarDirection === 'up' ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)') : 'inset(0 0 0 0)' },
          ]
        : [
            { clipPath: isCollapsing ? 'inset(0 0 0 0)' : (sidebarDirection === 'left' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)') },
            { clipPath: isCollapsing ? (sidebarDirection === 'left' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)') : 'inset(0 0 0 0)' },
          ],
      { duration: COLLAPSE_DURATION, easing: 'ease-out', fill: 'forwards' },
    )

    // Apply styling class immediately (shadow, border)
    el.classList.toggle('ea-window--collapsed', isCollapsing)
    setContentCollapsed(isCollapsing)

    // On expand, remove flex collapse immediately so content reappears
    if (!isCollapsing && contentEl) {
      contentEl.classList.remove('ea-content--collapsed')
    }

    sizeAnim.onfinish = () => {
      document.documentElement.style.overflowX = ''
      document.documentElement.style.overflowY = ''
      el.style.width = `${toWidth}px`
      el.style.height = `${toHeight}px`
      sizeAnim.cancel()
      contentAnim?.cancel()
      // collapse/expand finished
      onAnimationFinish?.()
      // Restore content to static + apply flex collapse
      if (contentEl) {
        contentEl.style.position = ''
        contentEl.style.left = ''
        contentEl.style.top = ''
        contentEl.style.width = ''
        contentEl.style.height = ''
        contentEl.style.removeProperty('clip-path')
      }
      if (isCollapsing && contentEl) {
        contentEl.classList.add('ea-content--collapsed')
      }
    }
    sizeAnim.oncancel = () => {
      document.documentElement.style.overflowX = ''
      document.documentElement.style.overflowY = ''
      contentAnim?.cancel()
    }
  }, [contentCollapsed, windowRef, setContentCollapsed, getExpandedWidth, getExpandedHeight, sidebarMode, sidebarDirection, onAnimationFinish])

  return toggleCollapsed
}
