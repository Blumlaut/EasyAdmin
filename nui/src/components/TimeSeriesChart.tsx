import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartData } from 'chart.js'
import { chartFont, chartGrid, chartLegend, chartTick, chartTooltip } from '../lib/chartTheme'

// ============================================================
// Types
// ============================================================

export interface TimeSeriesPoint {
  timestamp: number  // milliseconds
  value: number
}

export interface TimeSeriesLine {
  label: string
  data: TimeSeriesPoint[]
  color: string        // stroke color (hex — CSS vars don't work in canvas)
  fillColor?: string   // area fill top color (hex with alpha)
  fill?: boolean       // default true
  borderDash?: number[]
  unit?: string        // per-line unit override for tooltips (falls back to chart-level unit)
}

interface TimeSeriesChartProps {
  lines: TimeSeriesLine[]
  /** Time range shown on x-axis. If omitted, auto-fits to data. */
  range?: { start: number; end: number }
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
  unit?: string        // suffix on tooltip values, e.g. 'players'
  emptyMessage?: string
  className?: string
}

// ============================================================
// Helpers
// ============================================================

/** Format a timestamp into a human-friendly label for tooltips */
function formatTooltipDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================
// Chart defaults (dark theme — hardcoded hex, CSS vars don't work in canvas)
// ============================================================

const chartLegendLabels = {
  ...chartLegend,
  labels: {
    color: '#8b949e',
    boxWidth: 12,
    boxHeight: 2,
    padding: 12,
    font: { size: 11, family: chartFont.family },
  },
} as const

const chartDefaults = {
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  resolution: 1,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: chartLegendLabels,
    tooltip: {
      ...chartTooltip,
      displayColors: true,
      boxWidth: 10,
      boxHeight: 10,
      boxPadding: 6,
      caretPadding: 8,
      caretSize: 6,
    },
    filler: {
      propagate: false,
    },
  },
  scales: {
    x: {
      type: 'time' as const,
      time: {
        displayFormats: {
          minute: 'HH:mm',
          hour: 'HH:mm',
          day: 'MMM d',
          week: 'MMM d',
          month: 'MMM yyyy',
        },
        tooltipFormat: 'MMM d, HH:mm',
      },
      grid: chartGrid,
      ticks: { ...chartTick, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: chartGrid,
      ticks: chartTick,
      border: { display: false },
    },
  },
}

// ============================================================
// Component
// ============================================================

export function TimeSeriesChart({
  lines,
  range,
  height = 200,
  showLegend = false,
  showTooltip = true,
  unit = '',
  emptyMessage = 'No data for this time range',
  className = '',
}: TimeSeriesChartProps) {
  // Flatten all timestamps to determine auto range
  const allTimestamps = useMemo(() =>
    lines.flatMap((l) => l.data.map((d) => d.timestamp)),
    [lines],
  )

  const xRange = useMemo(() => {
    if (range) return range
    // eslint-disable-next-line react-hooks/purity -- default range is "last 24 hours from now", which requires current time
    if (allTimestamps.length === 0) return { start: Date.now() - 86400000, end: Date.now() }
    return {
      start: Math.min(...allTimestamps) - 60000, // 1 min padding
      end: Math.max(...allTimestamps) + 60000,
    }
  }, [range, allTimestamps])

  // Build Chart.js datasets (attach unit as custom property for tooltip)
  const datasets = useMemo(() =>
    lines.map((line) => ({
      label: line.label,
      data: line.data.map((d) => ({ x: d.timestamp, y: d.value })),
      borderColor: line.color,
      backgroundColor: line.fillColor || line.color,
      fill: line.fill ?? true,
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 10,
      tension: 0.3,
      borderDash: line.borderDash,
      _unit: line.unit, // custom prop for tooltip callback
    })),
    [lines],
  )

  const data: ChartData<'line'> = { datasets }

  // Custom tooltip callback
  const tooltips = useMemo(
    () => ({
      ...(chartDefaults.plugins?.tooltip ?? {}),
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (items: any[]) => {
          if (items.length === 0) return ''
          const ts = items[0].parsed.x
          return formatTooltipDate(typeof ts === 'number' ? ts : new Date(ts).getTime())
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => {
          const lineUnit = ctx.dataset._unit ?? unit
          return `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}${lineUnit ? ` ${lineUnit}` : ''}`
        },
      },
    }),
    [unit],
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        ...chartDefaults.plugins?.legend ?? {},
        display: showLegend,
      },
      tooltip: showTooltip ? tooltips : { enabled: false },
    },
    scales: {
      ...chartDefaults.scales,
      x: {
        type: 'time' as const,
        grid: chartDefaults.scales?.x?.grid || {},
        ticks: chartDefaults.scales?.x?.ticks || {},
        border: chartDefaults.scales?.x?.border || {},
        min: xRange.start,
        max: xRange.end,
      },
    },
  }

  const hasData = lines.some((l) => l.data.length > 0)

  return (
    <div className={`relative ${className}`}
      // eslint-disable-next-line nui/no-inline-styles -- dynamic chart height from prop
      style={{ height: height ? `${height}px` : '100%' }}
    >
      {hasData ? (
        <Line data={data} options={options} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-fg-muted">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
