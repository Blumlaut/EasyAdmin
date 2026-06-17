import { useCallback, RefObject } from 'react'

const COLLAPSE_DURATION = 180
const COLLAPSED_WIDTH = 260 // Match sidebar width exactly

export function useCollapse(
  windowRef: RefObject<HTMLDivElement | null>,
  contentCollapsed: boolean,
  setContentCollapsed: (v: boolean) => void,
  getExpandedWidth: () => number,
  onAnimationFinish?: () => void,
) {
  const toggleCollapsed = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const isCollapsing = !contentCollapsed

    const toWidth = isCollapsing ? COLLAPSED_WIDTH : getExpandedWidth()
    // collapse/expand started
    const contentEl = el.querySelector(':scope > div:not(.sidebar)') as HTMLElement | null

    // Remove content from flex layout so the window width can animate
    // without layout shifts. Capture dimensions first, then go absolute.
    // Applied for both collapse AND expand — restored after animation.
    const sidebarWidth = 260
    if (contentEl) {
      const w = contentEl.offsetWidth || getExpandedWidth() - sidebarWidth
      const h = contentEl.offsetHeight || el.offsetHeight
      contentEl.style.position = 'absolute'
      contentEl.style.left = `${sidebarWidth}px`
      contentEl.style.top = '0'
      contentEl.style.width = `${w}px`
      contentEl.style.height = `${h}px`
    }

    // Lock scrollbar so width change doesn't shift layout
    document.documentElement.style.overflowX = 'hidden'

    // Animate width + clip-path together
    const widthAnim = el.animate(
      [{ width: `${el.offsetWidth}px` }, { width: `${toWidth}px` }],
      { duration: COLLAPSE_DURATION, easing: 'ease-out', fill: 'forwards' },
    )
    contentEl?.animate(
      [
        { clipPath: isCollapsing ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' },
        { clipPath: isCollapsing ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)' },
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

    widthAnim.onfinish = () => {
      document.documentElement.style.overflowX = ''
      el.style.width = isCollapsing ? `${toWidth}px` : ''
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
    widthAnim.oncancel = () => { document.documentElement.style.overflowX = '' }
  }, [contentCollapsed, windowRef, setContentCollapsed, getExpandedWidth, onAnimationFinish])

  return toggleCollapsed
}
