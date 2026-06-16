import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartData, Plugin } from 'chart.js'

// ============================================================
// Types
// ============================================================

interface DoughnutChartProps {
  value: number
  max: number
  size?: number
  /** Label shown above the chart */
  label?: string
  /** Sub-label shown below the chart */
  subLabel?: string
  /** Custom segment colors (default uses design token colors) */
  colors?: { filled: string; empty: string }
  className?: string
}

// ============================================================
// Helpers
// ============================================================

/** Pick a color based on fill percentage */
function getCapacityColor(pct: number): string {
  if (pct >= 0.9) return '#f85149'   // accent-red
  if (pct >= 0.7) return '#d29922'   // accent-orange
  return '#3fb950'                    // accent-green
}

// ============================================================
// Plugin: draws centered text inside the doughnut hole
// ============================================================

function makeCenterTextPlugin(value: number, max: number): Plugin<'doughnut'> {
  return {
    id: 'centerText',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDraw: (chart: any) => {
      const { ctx, chartArea: { width, height, top, left } } = chart
      const centerX = left + width / 2
      const centerY = top + height / 2

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // "value" text
      ctx.fillStyle = '#f0f6fc'
      ctx.font = '700 30px -apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif'
      ctx.fillText(String(value), centerX, centerY - 10)

      // "/ max" text
      ctx.fillStyle = '#8b949e'
      ctx.font = '400 13px -apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif'
      ctx.fillText(`/ ${max}`, centerX, centerY + 16)

      ctx.restore()
    },
  }
}

// ============================================================
// Component
// ============================================================

export function DoughnutChart({
  value,
  max,
  size = 160,
  label = 'Player Capacity',
  subLabel,
  colors,
  className = '',
}: DoughnutChartProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const pctText = max > 0 ? Math.round(pct * 100) : 0

  const strokeColor = colors?.filled ?? getCapacityColor(pct)
  const emptyColor = colors?.empty ?? 'rgba(48, 54, 61, 0.3)'

  const data: ChartData<'doughnut'> = useMemo(() => ({
    datasets: [{
      data: [value, Math.max(max - value, 0)],
      backgroundColor: [strokeColor, emptyColor],
      borderWidth: 0,
      spacing: 2,
    }],
  }), [value, max, strokeColor, emptyColor])

  const centerPlugin = useMemo(() => makeCenterTextPlugin(value, max), [value, max])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = useMemo(() => ({
    animation: false,
    responsive: false,
    cutout: '80%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#161b22',
        titleColor: '#f0f6fc',
        bodyColor: '#c9d1d9',
        borderColor: '#30363d',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        titleFont: {
          size: 12,
          weight: 600,
          family: '-apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif',
        },
        bodyFont: {
          size: 11,
          family: '-apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif',
        },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const label = ctx.dataset.data[ctx.dataIndex] === value ? 'Current' : 'Remaining'
            return `${label}: ${ctx.parsed}`
          },
        },
      },
    },
  }), [value, strokeColor])

  return (
    <div className={`card flex flex-col items-center justify-center ${className}`}>
      <p className="section-label mb-2">{label}</p>
      <div className="flex items-center justify-center">
        <Doughnut data={data} options={options} plugins={[centerPlugin]} width={size} height={size} />
      </div>
      <p className="text-sm font-semibold mt-3" style={{ color: strokeColor }}>
        {pctText}% full
      </p>
      {subLabel && <p className="text-xs text-muted mt-1">{subLabel}</p>}
    </div>
  )
}
