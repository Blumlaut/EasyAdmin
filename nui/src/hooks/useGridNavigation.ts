import { useEffect, useRef } from 'react'

/**
 * Default selector for grid navigation targets.
 * Only matches interactive elements — not form controls or decorative content.
 */
const DEFAULT_ITEM_SELECTOR = '[role="button"], button'

function isVisible(el: HTMLElement): boolean {
  return (
    el.offsetParent !== null ||
    el.checkVisibility?.() !== false ||
    getComputedStyle(el).visibility !== 'hidden'
  )
}

export interface UseGridNavigationOptions {
  /**
   * CSS selector for navigation target elements.
   * Default: `'[role="button"], button'` (interactive rows + action buttons).
   *
   * Override when your list uses different markup (e.g. `<a>` links,
   * custom data attributes, or table rows).
   */
  itemSelector?: string
}

/**
 * Grid-based keyboard navigation for list containers.
 *
 * Organises matched elements inside a container into rows of
 * "zones" and handles arrow-key navigation:
 *
 *   ArrowUp / ArrowDown  — move between rows (same zone index)
 *   ArrowLeft / ArrowRight — move between zones within a row
 *   Home                 — first zone of first row
 *   End                  — last zone of last row
 *
 * Pages define the grid topology via `zonesPerRow`. The hook is
 * completely generic — it does not know about ListItem, QuickActionBar,
 * or any page-specific logic.
 *
 * @example
 *   // Simple list — one focusable element per row
 *   useGridNavigation(listRef, () => 1)
 *
 *   // Player list — row body + quick actions + optional dropdown
 *   const zones = () => 1 + quickActionCount + (hasDropdown ? 1 : 0)
 *   useGridNavigation(listRef, zones)
 *
 *   // Custom selector for a table-based list
 *   useGridNavigation(listRef, () => 1, { itemSelector: '[data-nav-item]' })
 */
export function useGridNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  zonesPerRow: (rowIndex: number) => number,
  options: UseGridNavigationOptions = {},
) {
  const itemsRef = useRef<HTMLElement[]>([])
  const zonesRef = useRef(zonesPerRow)
  const selectorRef = useRef(options.itemSelector ?? DEFAULT_ITEM_SELECTOR)

  zonesRef.current = zonesPerRow
  selectorRef.current = options.itemSelector ?? DEFAULT_ITEM_SELECTOR

  // Collect matching, visible, enabled elements
  const collectItems = () => {
    const container = containerRef.current
    if (!container) return

    itemsRef.current = Array.from(
      container.querySelectorAll<HTMLElement>(selectorRef.current),
    ).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-disabled') !== 'true' &&
        isVisible(el),
    )
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    collectItems()

    const observer = new MutationObserver(collectItems)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [containerRef])

  // Stable handler via ref — reads live data from refs so it never goes stale.
  // This avoids re-attaching the window listener on every render.
  const handleKeyDownRef = useRef((e: KeyboardEvent) => {
    const items = itemsRef.current
    if (items.length === 0) return

    const active = document.activeElement as HTMLElement | null
    const currentIndex = active !== null ? items.indexOf(active) : -1

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (currentIndex === -1) return // focus not in our list — let other handlers take it

      const upward = e.key === 'ArrowUp'

      // Determine current row and zone
      let row = -1
      let zone = -1

      if (currentIndex >= 0) {
        const zones = zonesRef.current
        let accumulated = 0
        for (let r = 0; r < items.length; r++) {
          const z = zones(r)
          if (accumulated + z > currentIndex) {
            row = r
            zone = currentIndex - accumulated
            break
          }
          accumulated += z
        }
        if (row === -1) return
      }

      const targetRow = upward ? row - 1 : row + 1

      // Find target row boundaries
      let targetRowStart = 0
      let targetRowZones = 0
      const zones = zonesRef.current
      let acc = 0
      for (let r = 0; r < items.length; r++) {
        const z = zones(r)
        if (r === targetRow) {
          targetRowStart = acc
          targetRowZones = z
          break
        }
        acc += z
      }

      if (targetRow < 0 || targetRowZones === 0) return

      // Clamp zone to target row's zone count
      let targetZone = zone
      if (targetZone >= targetRowZones) {
        targetZone = targetRowZones - 1
      }
      if (targetZone < 0) targetZone = 0

      const newIndex = targetRowStart + targetZone

      if (newIndex >= 0 && newIndex < items.length) {
        e.preventDefault()
        items[newIndex].focus()
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const leftward = e.key === 'ArrowLeft'

      if (currentIndex === -1) return

      // Determine current row boundaries
      const zones = zonesRef.current
      let rowStart = 0
      let rowZones = 0
      let zoneInRow = 0
      let acc = 0

      for (let r = 0; r < items.length; r++) {
        const z = zones(r)
        if (acc + z > currentIndex) {
          rowStart = acc
          rowZones = z
          zoneInRow = currentIndex - acc
          break
        }
        acc += z
      }

      const newZone = leftward ? zoneInRow - 1 : zoneInRow + 1

      if (newZone >= 0 && newZone < rowZones) {
        e.preventDefault()
        const newIndex = rowStart + newZone
        if (newIndex >= 0 && newIndex < items.length) {
          items[newIndex].focus()
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      if (items[0]) items[0].focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      if (items[items.length - 1]) items[items.length - 1].focus()
    }
  })

  useEffect(() => {
    // Listen on window so the handler fires regardless of event
    // propagation quirks in CEF/OSR rendering mode.
    // The handler reads live refs so it never goes stale.
    window.addEventListener('keydown', handleKeyDownRef.current)
    return () => window.removeEventListener('keydown', handleKeyDownRef.current)
  }, [])
}
