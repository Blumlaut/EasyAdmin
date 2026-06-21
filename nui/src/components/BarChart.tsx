import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartData } from 'chart.js'
import { chartGrid, chartLegend, chartTick, chartTickSm, chartTooltip } from '../lib/chartTheme'

// ============================================================
// Types
// ============================================================

export interface BarItem {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  items: BarItem[]
  /** Minimum bar height in pixels */
  barHeight?: number
  /** Chart height in pixels (auto if omitted) */
  height?: number
  /** Show value labels on bars */
  showValues?: boolean
  emptyMessage?: string
  className?: string
}

// ============================================================
// Helpers
// ============================================================

const defaultColors = [
  '#3b82f6',  // brand-blue-light
  '#3fb950',  // accent-green
  '#d29922',  // accent-orange
  '#3b82f6',  // brand-blue-light
  '#c084fc',  // accent-purple
]

// ============================================================
// Component
// ============================================================

export function BarChart({
  items,
  barHeight = 20,
  height,
  showValues = true,
  emptyMessage = 'No data',
  className = '',
}: BarChartProps) {
  // Hooks must be called before any early returns
  const chartHeight = height ?? Math.max(items.length * (barHeight + 8) + 20, 80)

  const labels = useMemo(() => items.map((item) => item.label), [items])
  const values = useMemo(() => items.map((item) => item.value), [items])
  const bgColors = useMemo(
    () => items.map((item, i) => item.color || defaultColors[i % defaultColors.length]),
    [items],
  )

  const data: ChartData<'bar'> = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Value',
      data: values,
      backgroundColor: bgColors,
      borderColor: bgColors,
      borderWidth: 0,
      borderRadius: 999,
      barPercentage: 0.6,
      categoryPercentage: 0.85,
      barThickness: Math.min(barHeight, 16),
      maxBarThickness: 20,
    }],
  }), [labels, values, bgColors, barHeight])

  const options: Record<string, unknown> = useMemo(() => ({
    animation: false,
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: showValues ? 40 : 0,
      },
    },
    plugins: {
      legend: chartLegend,
      tooltip: {
        enabled: true,
        ...chartTooltip,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: (ctx: any[]) => ctx[0]?.label || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: chartGrid,
        ticks: { ...chartTick, maxTicksLimit: 4 },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { ...chartTickSm, crossAlign: 'far' },
        border: { display: false },
      },
    },
  }), [showValues])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}
        // eslint-disable-next-line nui/no-inline-styles -- dynamic min-height for empty state container
        style={{ minHeight: 60 }}
      >
        <p className="text-xs text-fg-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}
      // eslint-disable-next-line nui/no-inline-styles -- dynamic chart height computed from item count
      style={{ height: `${chartHeight}px` }}
    >
      <Bar data={data} options={options} />
    </div>
  )
}
