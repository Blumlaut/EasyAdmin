import { useCallback, RefObject } from 'react'

const COLLAPSE_DURATION = 180
const COLLAPSED_WIDTH = 260 // Match sidebar width exactly

export function useCollapse(
  windowRef: RefObject<HTMLDivElement | null>,
  contentCollapsed: boolean,
  setContentCollapsed: (v: boolean) => void,
  getExpandedWidth: () => number,
) {
  const toggleCollapsed = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const isCollapsing = !contentCollapsed

    const toWidth = isCollapsing ? COLLAPSED_WIDTH : getExpandedWidth()
    const contentEl = el.querySelector(':scope > div:not(.sidebar)') as HTMLElement | null

    // Lock scrollbar so width change doesn't shift layout
    document.documentElement.style.overflowX = 'hidden'

    // Animate width + clip-path together. clip-path hides content from
    // the right edge without affecting the flex layout.
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
      // On collapse, apply flex collapse after animation
      // On expand, clear clip-path so content is fully visible
      if (isCollapsing && contentEl) {
        contentEl.classList.add('ea-content--collapsed')
      }
      contentEl?.style.removeProperty('clip-path')
    }
    widthAnim.oncancel = () => { document.documentElement.style.overflowX = '' }
  }, [contentCollapsed, windowRef, setContentCollapsed, getExpandedWidth])

  return toggleCollapsed
}
