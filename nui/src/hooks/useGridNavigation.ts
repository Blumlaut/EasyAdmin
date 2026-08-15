import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Default selector for grid navigation targets.
 * Only matches interactive elements — not form controls or decorative content.
 */
const DEFAULT_ITEM_SELECTOR = '[role="button"], button'

function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility()
  }
  // Fallback (jsdom, older Chromium): treat as visible unless explicitly hidden.
  const style = getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
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
  /**
   * Optional element rendered above the grid (typically the page's search
   * input) to bridge keyboard focus with:
   *
   * - ArrowDown while the anchor is focused → focus first grid item
   * - ArrowUp while the first grid item (row 0, zone 0) is focused → focus the anchor
   *
   * Leave undefined when there is no element above the list.
   */
  anchor?: React.RefObject<HTMLElement | null>
}

/**
 * Grid-based keyboard navigation for list containers.
 *
 * Organises matched elements inside a container into rows of
 * "zones" and handles arrow-key navigation:
 *
 *   ArrowUp / ArrowDown  — move between rows (same zone index)
 *   ArrowLeft / ArrowRight — move between zones within a row
 *   Home                 — first item of the grid
 *   End                  — last item of the grid
 *
 * Home/End only act while focus is already inside the grid, so they never
 * steal focus from text inputs, modals, or other UI.
 *
 * Pages define the grid topology via `zonesPerRow`. The hook is
 * completely generic — it does not know about ListItem, QuickActionBar,
 * or any page-specific logic.
 *
 * Returns a callback ref to attach to the list container. Items are
 * (re)collected whenever the container node mounts or its contents change,
 * so lists that render after a loading state work correctly.
 *
 * @example
 *   // Simple list — one focusable element per row
 *   const listRef = useGridNavigation(() => 1)
 *   return <List ref={listRef}>...</List>
 *
 *   // Player list — row body + quick actions + optional dropdown
 *   const listRef = useGridNavigation(() => zonesPerRow)
 *
 *   // Table-based list with a search input above it
 *   const listRef = useGridNavigation(() => 1, {
 *     itemSelector: '[data-nav-row]',
 *     anchor: searchRef,
 *   })
 */
export function useGridNavigation(
  zonesPerRow: (rowIndex: number) => number,
  options: UseGridNavigationOptions = {},
): (el: HTMLElement | null) => void {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const itemsRef = useRef<HTMLElement[]>([])
  const zonesRef = useRef(zonesPerRow)
  const selectorRef = useRef(options.itemSelector ?? DEFAULT_ITEM_SELECTOR)
  const anchorObjRef = useRef<React.RefObject<HTMLElement | null> | undefined>(options.anchor)

  // Live refs so the window handler never goes stale.
  zonesRef.current = zonesPerRow
  selectorRef.current = options.itemSelector ?? DEFAULT_ITEM_SELECTOR
  anchorObjRef.current = options.anchor

  const setRef = useCallback((el: HTMLElement | null) => {
    setContainer(el)
  }, [])

  // Collect matching, visible, enabled elements.
  // Re-runs whenever the container node mounts/unmounts (fixes lists that
  // only appear after a loading state) — the MutationObserver catches
  // content changes while the container is alive.
  useEffect(() => {
    if (!container) {
      itemsRef.current = []
      return
    }

    const collectItems = () => {
      itemsRef.current = Array.from(
        container.querySelectorAll<HTMLElement>(selectorRef.current),
      ).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-disabled') !== 'true' &&
          isVisible(el),
      )
    }

    collectItems()

    const observer = new MutationObserver(collectItems)
    observer.observe(container, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      itemsRef.current = []
    }
  }, [container])

  // Locate the row/zone containing a flat item index.
  // Returns null when the index falls outside the declared topology
  // (happens if the DOM and zonesPerRow disagree — treated as "not in grid").
  function locate(items: HTMLElement[], index: number) {
    const zones = zonesRef.current
    let acc = 0
    for (let r = 0; r < items.length; r++) {
      const z = zones(r)
      if (acc + z > index) {
        return { row: r, zone: index - acc, rowStart: acc, rowZones: z }
      }
      acc += z
    }
    return null
  }

  // Stable handler via ref — reads live data from refs so it never goes stale.
  // This avoids re-attaching the window listener on every render.
  const handleKeyDownRef = useRef((e: KeyboardEvent) => {
    const items = itemsRef.current
    if (items.length === 0) return

    const active = document.activeElement as HTMLElement | null
    // Read the anchor element live so it works even when the anchor mounts
    // in the same commit as the grid (ref .current is set after render).
    const anchor = anchorObjRef.current?.current ?? null
    const currentIndex = active !== null ? items.indexOf(active) : -1

    // Focus bridge: anchor (e.g. search input) → first grid item.
    if (anchor && active === anchor) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        items[0].focus()
      }
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (currentIndex === -1) return // focus not in our grid — let other handlers take it

      const upward = e.key === 'ArrowUp'
      const pos = locate(items, currentIndex)
      if (!pos) return

      // Bridge back up: first row, first zone → anchor
      if (upward && pos.row === 0 && pos.zone === 0 && anchor) {
        e.preventDefault()
        anchor.focus()
        return
      }

      const targetRow = upward ? pos.row - 1 : pos.row + 1
      if (targetRow < 0) return

      // Find target row boundaries
      let targetRowStart = -1
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

      if (targetRowStart === -1 || targetRowZones === 0) return

      // Clamp zone to target row's zone count
      let targetZone = pos.zone
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

      const pos = locate(items, currentIndex)
      if (!pos) return

      const newZone = leftward ? pos.zone - 1 : pos.zone + 1

      if (newZone >= 0 && newZone < pos.rowZones) {
        e.preventDefault()
        const newIndex = pos.rowStart + newZone
        if (newIndex >= 0 && newIndex < items.length) {
          items[newIndex].focus()
        }
      }
    } else if (e.key === 'Home' || e.key === 'End') {
      // Only act when focus is already inside the grid — otherwise we would
      // steal focus from text inputs, open modals, or other UI elements.
      if (currentIndex === -1) return

      e.preventDefault()
      const target = e.key === 'Home' ? items[0] : items[items.length - 1]
      if (target) target.focus()
    }
  })

  useEffect(() => {
    // Listen on window so the handler fires regardless of event
    // propagation quirks in CEF/OSR rendering mode.
    // The handler reads live refs so it never goes stale.
    window.addEventListener('keydown', handleKeyDownRef.current)
    return () => window.removeEventListener('keydown', handleKeyDownRef.current)
  }, [])

  return setRef
}
