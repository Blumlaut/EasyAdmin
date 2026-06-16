import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartData } from 'chart.js'

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
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: 60 }}>
        <p className="text-xs text-muted">{emptyMessage}</p>
      </div>
    )
  }

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
      borderRadius: 4,
      barThickness: Math.min(barHeight, 24),
      maxBarThickness: 28,
    }],
  }), [labels, values, bgColors, barHeight])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = useMemo(() => ({
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
          title: (ctx: any[]) => ctx[0]?.label || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(48, 54, 61, 0.4)',
          drawTicks: false,
        },
        ticks: {
          color: '#8b949e',
          font: {
            size: 10,
            family: '-apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif',
          },
          maxTicksLimit: 4,
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#8b949e',
          font: {
            size: 11,
            family: '-apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif',
          },
          crossAlign: 'far',
        },
        border: { display: false },
      },
    },
  }), [showValues])

  return (
    <div className={`relative ${className}`} style={{ height: `${chartHeight}px` }}>
      <Bar data={data} options={options} />
    </div>
  )
}
