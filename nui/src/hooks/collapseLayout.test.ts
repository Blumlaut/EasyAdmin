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

describe('measureRailHeight', () => {
  it('falls back to two chip heights when the sidebar is missing', () => {
    expect(measureRailHeight(document.createElement('div'))).toBe(CHIP_SIZE * 2)
  })
})
