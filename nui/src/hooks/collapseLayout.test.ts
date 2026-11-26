import {
  CHIP_SIZE,
  RAIL_WIDTH,
  TASKBAR_HEIGHT,
  clampWindowRectToViewport,
  getFoldRects,
  getStripRect,
  measureRailHeight,
} from './collapseLayout'

const VIEWPORT = { width: 1920, height: 1080 }
const EXPANDED = { x: 100, y: 50, width: 1210, height: 750 }

function rects(overrides: Partial<Parameters<typeof getFoldRects>[0]> = {}) {
  return getFoldRects({
    expandedRect: EXPANDED,
    sidebarMode: 'vertical',
    sidebarDirection: 'right',
    railHeight: 660,
    viewport: VIEWPORT,
    ...overrides,
  })
}

describe('getFoldRects', () => {
  it('leaves the expanded panel where it was', () => {
    expect(rects().open).toEqual(EXPANDED)
  })

  it('shrinks the rail to the icon column at the sidebar content height', () => {
    expect(rects().rail).toEqual({ x: 100, y: 50, width: RAIL_WIDTH, height: 660 })
  })

  it('pins the rail to the right edge when the sidebar sits on the right', () => {
    const rail = rects({ sidebarDirection: 'left' }).rail

    expect(rail.x).toBe(100 + 1210 - RAIL_WIDTH)
    expect(rail.y).toBe(50)
  })

  it('keeps the taskbar at full width when the sidebar is horizontal', () => {
    const rail = rects({ sidebarMode: 'horizontal', sidebarDirection: 'down' }).rail

    expect(rail).toEqual({ x: 100, y: 50, width: 1210, height: TASKBAR_HEIGHT })
  })

  it('pins a bottom taskbar to its bottom edge', () => {
    const rail = rects({ sidebarMode: 'horizontal', sidebarDirection: 'up' }).rail

    expect(rail.y).toBe(50 + 750 - TASKBAR_HEIGHT)
    expect(rail.height).toBe(TASKBAR_HEIGHT)
  })

  it('pins the chip to the same edge as the rail', () => {
    const chip = rects({ sidebarDirection: 'left' }).chip

    expect(chip).toEqual({ x: 100 + 1210 - CHIP_SIZE, y: 50, width: CHIP_SIZE, height: CHIP_SIZE })
  })

  it('clamps the rail to the viewport when the sidebar is taller than the screen', () => {
    const rail = rects({ railHeight: 1400, viewport: { width: 1280, height: 720 } }).rail

    expect(rail.height).toBe(720)
    expect(rail.y).toBe(0)
  })

  it('clamps an expanded panel that hangs over the screen edge', () => {
    const open = rects({ expandedRect: { x: -40, y: 900, width: 1210, height: 750 } }).open

    expect(open.x).toBe(0)
    expect(open.y).toBe(VIEWPORT.height - 750)
  })
})

describe('getStripRect', () => {
  it('keeps the open height at the folded width when folding', () => {
    const all = rects()

    expect(getStripRect('open', 'rail', all)).toEqual({ x: 100, y: 50, width: RAIL_WIDTH, height: 750 })
  })

  it('uses the same strip in both directions', () => {
    const all = rects()

    expect(getStripRect('rail', 'open', all)).toEqual(getStripRect('open', 'rail', all))
  })

  it('narrows the chip strip to the chip width', () => {
    const all = rects()

    expect(getStripRect('open', 'chip', all).width).toBe(CHIP_SIZE)
    expect(getStripRect('chip', 'open', all).width).toBe(CHIP_SIZE)
  })
})

describe('clampWindowRectToViewport', () => {
  it('keeps a rect that already fits untouched', () => {
    expect(clampWindowRectToViewport({ x: 10, y: 10, width: 100, height: 100 }, VIEWPORT))
      .toEqual({ x: 10, y: 10, width: 100, height: 100 })
  })

  it('pulls a rect back inside the bottom right corner', () => {
    expect(clampWindowRectToViewport({ x: 1900, y: 1000, width: 100, height: 100 }, VIEWPORT))
      .toEqual({ x: VIEWPORT.width - 100, y: VIEWPORT.height - 100, width: 100, height: 100 })
  })
})

/** jsdom has no layout, so every box is stubbed by hand */
function domRect(top: number, bottom: number, height: number): DOMRect {
  return { top, bottom, height, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
}

function sidebarWith(metrics: {
  headerHeight: number
  navTop: number
  itemsBottom: number[]
  paddingBottom?: string
  chrome?: number
}) {
  const windowEl = document.createElement('div')
  const header = document.createElement('div')
  header.className = 'sidebar-header'
  header.getBoundingClientRect = () => domRect(0, metrics.headerHeight, metrics.headerHeight)

  const nav = document.createElement('nav')
  nav.className = 'sidebar-nav'
  nav.style.paddingBottom = metrics.paddingBottom ?? '0px'
  nav.getBoundingClientRect = () => domRect(metrics.navTop, metrics.navTop + 600, 600)
  for (const bottom of metrics.itemsBottom) {
    const item = document.createElement('div')
    item.getBoundingClientRect = () => domRect(bottom - 40, bottom, 40)
    nav.appendChild(item)
  }

  windowEl.append(header, nav)
  document.body.appendChild(windowEl)
  Object.defineProperty(windowEl, 'offsetHeight', { value: 750 + (metrics.chrome ?? 0) })
  Object.defineProperty(windowEl, 'clientHeight', { value: 750 })

  return windowEl
}

describe('measureRailHeight', () => {
  it('falls back to two chip heights when the sidebar is missing', () => {
    expect(measureRailHeight(document.createElement('div'))).toBe(CHIP_SIZE * 2)
  })

  it('measures to the last nav item, ignoring the nav container height', () => {
    const windowEl = sidebarWith({ headerHeight: 49, navTop: 52, itemsBottom: [200, 400, 560] })

    expect(measureRailHeight(windowEl)).toBe(557)
    windowEl.remove()
  })

  it('adds the nav bottom padding and the window border', () => {
    const windowEl = sidebarWith({
      headerHeight: 49,
      navTop: 52,
      itemsBottom: [560],
      paddingBottom: '18px',
      chrome: 2,
    })

    expect(measureRailHeight(windowEl)).toBe(577)
    windowEl.remove()
  })

  it('falls back to the header height when the nav is empty', () => {
    const windowEl = sidebarWith({ headerHeight: 49, navTop: 52, itemsBottom: [] })

    expect(measureRailHeight(windowEl)).toBe(49)
    windowEl.remove()
  })
})
