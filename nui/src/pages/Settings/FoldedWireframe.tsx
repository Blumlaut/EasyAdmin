/*
 * Mini wireframes for the folded-appearance picker.
 * Same frame as the layout picker, but showing what is left on screen
 * while the game has the input.
 */

const W = 100
const H = 64
const R = 4

interface FoldedWireframeProps {
  variant: 'rail' | 'chip'
  checked: boolean
}

export function FoldedWireframe({ variant, checked }: FoldedWireframeProps) {
  const accent = checked ? 'var(--brand-blue-light)' : 'var(--text-muted)'
  const accentBg = checked
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(139, 148, 158, 0.15)'
  const border = checked ? 'var(--brand-blue-light)' : 'var(--border-subtle)'

  // Game area behind the folded window
  const screen = (
    <rect
      key="screen"
      x={1}
      y={1}
      width={W - 2}
      height={H - 2}
      rx={R}
      fill="transparent"
      stroke={border}
      strokeWidth={1.5}
      strokeDasharray={checked ? undefined : '3 2'}
    />
  )

  if (variant === 'chip') {
    const size = 16
    return (
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="layout-wireframe"
        role="img"
        aria-hidden="true"
      >
        {screen}
        <rect
          x={6}
          y={6}
          width={size}
          height={size}
          rx={4}
          fill="var(--bg-secondary)"
          stroke={accent}
          strokeWidth={1.5}
        />
        <circle cx={6 + size - 2} cy={6 + 2} r={3} fill={accent} />
      </svg>
    )
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="layout-wireframe"
      role="img"
      aria-hidden="true"
    >
      {screen}
      <rect x={1} y={1} width={13} height={H - 2} rx={R} fill={accentBg} stroke="none" />
      <rect x={4} y={5} width={7} height={4} rx={1.5} fill={accent} opacity={0.6} />
      {[14, 22, 30, 38, 46, 54].map((y) => (
        <rect key={y} x={4.5} y={y} width={6} height={6} rx={1.5} fill={accent} opacity={0.3} />
      ))}
      <circle cx={10} cy={16.5} r={1.6} fill={accent} />
    </svg>
  )
}
