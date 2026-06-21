import { useCallback } from 'react'
import type { RefObject } from 'react'
import type { SidebarDirection, SidebarMode } from '../types'
import { COLLAPSED_SIDEBAR_WIDTH, COLLAPSED_TASKBAR_HEIGHT, getTargetWindowRect } from './collapseLayout'

const COLLAPSE_DURATION = 180

export function useCollapse(
  windowRef: RefObject<HTMLDivElement | null>,
  contentCollapsed: boolean,
  setContentCollapsed: (v: boolean) => void,
  getExpandedWidth: () => number,
  getExpandedHeight: () => number,
  getWindowPosition: () => { x: number; y: number },
  setWindowPosition: (pos: { x: number; y: number }) => void,
  sidebarMode: SidebarMode,
  sidebarDirection: SidebarDirection,
  onAnimationFinish?: (collapsed: boolean) => void,
) {
  const toggleCollapsed = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const isCollapsing = !contentCollapsed
    const isHorizontal = sidebarMode === 'horizontal'
    const contentEl = el.querySelector(':scope > div:not(.sidebar)') as HTMLElement | null
    const currentPos = getWindowPosition()

    if (contentEl) {
      const w = contentEl.offsetWidth || Math.max(0, getExpandedWidth() - COLLAPSED_SIDEBAR_WIDTH)
      const h = contentEl.offsetHeight || Math.max(0, getExpandedHeight() - COLLAPSED_TASKBAR_HEIGHT)
      contentEl.style.position = 'absolute'
      contentEl.style.width = `${w}px`
      contentEl.style.height = `${h}px`

      if (isHorizontal) {
        contentEl.style.left = '0'
        contentEl.style.top = sidebarDirection === 'up' ? '0' : `${COLLAPSED_TASKBAR_HEIGHT}px`
      } else {
        contentEl.style.left = sidebarDirection === 'left' ? '0' : `${COLLAPSED_SIDEBAR_WIDTH}px`
        contentEl.style.top = '0'
      }
    }

    document.documentElement.style.overflowX = 'hidden'
    document.documentElement.style.overflowY = 'hidden'

    const targetRect = getTargetWindowRect({
      currentRect: {
        x: currentPos.x,
        y: currentPos.y,
        width: el.offsetWidth,
        height: el.offsetHeight,
      },
      expandedSize: {
        width: getExpandedWidth(),
        height: getExpandedHeight(),
      },
      nextCollapsed: isCollapsing,
      sidebarMode,
      sidebarDirection,
    })

    const sizeAnim = el.animate(
      [
        {
          width: `${el.offsetWidth}px`,
          height: `${el.offsetHeight}px`,
          left: `${currentPos.x}px`,
          top: `${currentPos.y}px`,
        },
        {
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          left: `${targetRect.x}px`,
          top: `${targetRect.y}px`,
        },
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
    el.classList.add('ea-window--collapse-animating')
    el.classList.toggle('ea-window--collapsed', isCollapsing)
    setContentCollapsed(isCollapsing)

    // On expand, remove flex collapse immediately so content reappears
    if (!isCollapsing && contentEl) {
      contentEl.classList.remove('ea-content--collapsed')
    }

    sizeAnim.addEventListener('finish', () => {
      document.documentElement.style.overflowX = ''
      document.documentElement.style.overflowY = ''
      el.classList.remove('ea-window--collapse-animating')
      el.style.width = `${targetRect.width}px`
      el.style.height = `${targetRect.height}px`
      el.style.setProperty('--ea-left', `${targetRect.x}px`)
      el.style.setProperty('--ea-top', `${targetRect.y}px`)
      setWindowPosition({ x: targetRect.x, y: targetRect.y })
      sizeAnim.cancel()
      contentAnim?.cancel()
      onAnimationFinish?.(isCollapsing)
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
    }, { once: true })

    sizeAnim.addEventListener('cancel', () => {
      document.documentElement.style.overflowX = ''
      document.documentElement.style.overflowY = ''
      el.classList.remove('ea-window--collapse-animating')
      contentAnim?.cancel()
    }, { once: true })
  }, [contentCollapsed, windowRef, setContentCollapsed, getExpandedWidth, getExpandedHeight, getWindowPosition, setWindowPosition, sidebarMode, sidebarDirection, onAnimationFinish])

  return toggleCollapsed
}
