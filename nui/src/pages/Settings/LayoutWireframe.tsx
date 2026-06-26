/*
 * Mini window wireframes for the layout picker.
 * Each variant draws a small rectangle representing the EA window,
 * with the sidebar / taskbar region highlighted using the brand palette.
 */

const W = 100
const H = 64
const R = 4 // corner radius
const SIDEBAR_W = 26
const TASKBAR_H = 14
const CONTENT_GAP = 1 // gap between sidebar and content

interface LayoutWireframeProps {
  variant: 'left-sidebar' | 'right-sidebar' | 'top-taskbar' | 'bottom-taskbar'
  checked: boolean
}

export function LayoutWireframe({ variant, checked }: LayoutWireframeProps) {
  const accent = checked
    ? 'var(--brand-blue-light)'
    : 'var(--text-muted)'
  const accentBg = checked
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(139, 148, 158, 0.15)'
  const contentFill = checked
    ? 'rgba(139, 148, 158, 0.1)'
    : 'rgba(139, 148, 158, 0.06)'
  const border = checked
    ? 'var(--brand-blue-light)'
    : 'var(--border-subtle)'

  // Common: outer window frame
  const frame = (
    <rect
      key="frame"
      x={1}
      y={1}
      width={W - 2}
      height={H - 2}
      rx={R}
      fill="var(--bg-secondary)"
      stroke={border}
      strokeWidth={1.5}
    />
  )

  // Content placeholder lines (subtle horizontal bars)
  const contentLines = (x: number, y: number, w: number, count: number) =>
    Array.from({ length: count }, (_, i) => (
      <rect
        key={`line-${i}`}
        x={x}
        y={y + i * 6}
        width={w - (i === count - 1 ? 10 : 0)}
        height={2.5}
        rx={1}
        fill={contentFill}
      />
    ))

  let regions: React.ReactNode

  switch (variant) {
    case 'left-sidebar': {
      const contentX = SIDEBAR_W + CONTENT_GAP + 1
      const contentW = W - 2 - SIDEBAR_W - CONTENT_GAP
      regions = (
        <>
          {/* Sidebar region */}
          <rect
            x={1}
            y={1}
            width={SIDEBAR_W}
            height={H - 2}
            rx={R}
            fill={accentBg}
            stroke="none"
          />
          {/* Sidebar inner elements: logo area + nav items */}
          <rect x={5} y={6} width={18} height={5} rx={1.5} fill={accent} opacity={0.6} />
          <rect x={5} y={16} width={16} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={5} y={21} width={14} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={5} y={26} width={16} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={5} y={31} width={12} height={2} rx={1} fill={accent} opacity={0.25} />
          {/* Content region */}
          <rect
            x={contentX}
            y={1}
            width={contentW}
            height={H - 2}
            rx={R}
            fill="transparent"
            stroke="none"
          />
          {contentLines(contentX + 6, 6, contentW - 12, 5)}
        </>
      )
      break
    }

    case 'right-sidebar': {
      const contentW = W - 2 - SIDEBAR_W - CONTENT_GAP
      regions = (
        <>
          {/* Content region */}
          <rect
            x={1}
            y={1}
            width={contentW}
            height={H - 2}
            rx={R}
            fill="transparent"
            stroke="none"
          />
          {contentLines(6, 6, contentW - 12, 5)}
          {/* Sidebar region */}
          <rect
            x={W - 1 - SIDEBAR_W}
            y={1}
            width={SIDEBAR_W}
            height={H - 2}
            rx={R}
            fill={accentBg}
            stroke="none"
          />
          <rect x={W - SIDEBAR_W + 3} y={6} width={18} height={5} rx={1.5} fill={accent} opacity={0.6} />
          <rect x={W - SIDEBAR_W + 3} y={16} width={16} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={W - SIDEBAR_W + 3} y={21} width={14} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={W - SIDEBAR_W + 3} y={26} width={16} height={2} rx={1} fill={accent} opacity={0.25} />
          <rect x={W - SIDEBAR_W + 3} y={31} width={12} height={2} rx={1} fill={accent} opacity={0.25} />
        </>
      )
      break
    }

    case 'top-taskbar': {
      const contentY = TASKBAR_H + CONTENT_GAP + 1
      const contentH = H - 2 - TASKBAR_H - CONTENT_GAP
      regions = (
        <>
          {/* Taskbar region */}
          <rect
            x={1}
            y={1}
            width={W - 2}
            height={TASKBAR_H}
            rx={R}
            fill={accentBg}
            stroke="none"
          />
          {/* Taskbar nav dots */}
          <rect x={6} y={5} width={10} height={4} rx={1.5} fill={accent} opacity={0.6} />
          <rect x={20} y={5} width={8} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={32} y={5} width={12} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={48} y={5} width={9} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={61} y={5} width={11} height={4} rx={1.5} fill={accent} opacity={0.3} />
          {/* Content region */}
          <rect
            x={1}
            y={contentY}
            width={W - 2}
            height={contentH}
            rx={R}
            fill="transparent"
            stroke="none"
          />
          {contentLines(6, contentY + 4, W - 14, 4)}
        </>
      )
      break
    }

    case 'bottom-taskbar': {
      const contentH = H - 2 - TASKBAR_H - CONTENT_GAP
      regions = (
        <>
          {/* Content region */}
          <rect
            x={1}
            y={1}
            width={W - 2}
            height={contentH}
            rx={R}
            fill="transparent"
            stroke="none"
          />
          {contentLines(6, 5, W - 14, 4)}
          {/* Taskbar region */}
          <rect
            x={1}
            y={H - 1 - TASKBAR_H}
            width={W - 2}
            height={TASKBAR_H}
            rx={R}
            fill={accentBg}
            stroke="none"
          />
          <rect x={6} y={H - TASKBAR_H + 4} width={10} height={4} rx={1.5} fill={accent} opacity={0.6} />
          <rect x={20} y={H - TASKBAR_H + 4} width={8} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={32} y={H - TASKBAR_H + 4} width={12} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={48} y={H - TASKBAR_H + 4} width={9} height={4} rx={1.5} fill={accent} opacity={0.3} />
          <rect x={61} y={H - TASKBAR_H + 4} width={11} height={4} rx={1.5} fill={accent} opacity={0.3} />
        </>
      )
      break
    }
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="layout-wireframe"
    >
      {frame}
      {regions}
    </svg>
  )
}
