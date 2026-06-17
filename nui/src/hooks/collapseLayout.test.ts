import { clampWindowRectToViewport, COLLAPSED_SIDEBAR_WIDTH, COLLAPSED_TASKBAR_HEIGHT, getRenderedWindowSize, getTargetWindowRect } from './collapseLayout'

describe('collapseLayout', () => {
  describe('getTargetWindowRect', () => {
    it('keeps the right edge fixed when collapsing vertical left', () => {
      const rect = getTargetWindowRect({
        currentRect: { x: 100, y: 50, width: 1210, height: 750 },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: true,
        sidebarMode: 'vertical',
        sidebarDirection: 'left',
      })

      expect(rect).toEqual({
        x: 100 + 1210 - COLLAPSED_SIDEBAR_WIDTH,
        y: 50,
        width: COLLAPSED_SIDEBAR_WIDTH,
        height: 750,
      })
    })

    it('keeps the left edge fixed when collapsing vertical right', () => {
      const rect = getTargetWindowRect({
        currentRect: { x: 100, y: 50, width: 1210, height: 750 },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: true,
        sidebarMode: 'vertical',
        sidebarDirection: 'right',
      })

      expect(rect).toEqual({
        x: 100,
        y: 50,
        width: COLLAPSED_SIDEBAR_WIDTH,
        height: 750,
      })
    })

    it('keeps the bottom edge fixed when collapsing horizontal up', () => {
      const rect = getTargetWindowRect({
        currentRect: { x: 100, y: 50, width: 1210, height: 750 },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: true,
        sidebarMode: 'horizontal',
        sidebarDirection: 'up',
      })

      expect(rect).toEqual({
        x: 100,
        y: 50 + 750 - COLLAPSED_TASKBAR_HEIGHT,
        width: 1210,
        height: COLLAPSED_TASKBAR_HEIGHT,
      })
    })

    it('keeps the top edge fixed when collapsing horizontal down', () => {
      const rect = getTargetWindowRect({
        currentRect: { x: 100, y: 50, width: 1210, height: 750 },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: true,
        sidebarMode: 'horizontal',
        sidebarDirection: 'down',
      })

      expect(rect).toEqual({
        x: 100,
        y: 50,
        width: 1210,
        height: COLLAPSED_TASKBAR_HEIGHT,
      })
    })

    it('restores expanded rect from a left-collapsed state without moving the sidebar anchor', () => {
      const collapsedX = 100 + 1210 - COLLAPSED_SIDEBAR_WIDTH
      const rect = getTargetWindowRect({
        currentRect: { x: collapsedX, y: 50, width: COLLAPSED_SIDEBAR_WIDTH, height: 750 },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: false,
        sidebarMode: 'vertical',
        sidebarDirection: 'left',
      })

      expect(rect).toEqual({
        x: 100,
        y: 50,
        width: 1210,
        height: 750,
      })
    })

    it('restores expanded rect from an up-collapsed state without moving the sidebar anchor', () => {
      const collapsedY = 50 + 750 - COLLAPSED_TASKBAR_HEIGHT
      const rect = getTargetWindowRect({
        currentRect: { x: 100, y: collapsedY, width: 1210, height: COLLAPSED_TASKBAR_HEIGHT },
        expandedSize: { width: 1210, height: 750 },
        nextCollapsed: false,
        sidebarMode: 'horizontal',
        sidebarDirection: 'up',
      })

      expect(rect).toEqual({
        x: 100,
        y: 50,
        width: 1210,
        height: 750,
      })
    })
  })

  describe('getRenderedWindowSize', () => {
    it('returns collapsed vertical size', () => {
      expect(getRenderedWindowSize({
        contentCollapsed: true,
        sidebarMode: 'vertical',
        expandedSize: { width: 1210, height: 750 },
      })).toEqual({ width: COLLAPSED_SIDEBAR_WIDTH, height: 750 })
    })

    it('returns collapsed horizontal size', () => {
      expect(getRenderedWindowSize({
        contentCollapsed: true,
        sidebarMode: 'horizontal',
        expandedSize: { width: 1210, height: 750 },
      })).toEqual({ width: 1210, height: COLLAPSED_TASKBAR_HEIGHT })
    })
  })

  describe('clampWindowRectToViewport', () => {
    it('clamps x/y while preserving width/height', () => {
      expect(clampWindowRectToViewport(
        { x: 900, y: 700, width: 400, height: 200 },
        { width: 1000, height: 800 },
      )).toEqual({
        x: 600,
        y: 600,
        width: 400,
        height: 200,
      })
    })
  })
})
