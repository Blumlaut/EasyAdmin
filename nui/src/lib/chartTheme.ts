// ============================================================
// Shared Chart.js theme defaults (dark theme)
// CSS vars don't work in canvas, so values are hardcoded hex.
// ============================================================

/** Default font config for chart labels and tooltips */
export const chartFont = {
  family: '-apple-system, blinkmacsystemfont, Segoe UI, roboto, sans-serif',
} as const

/** Shared tooltip config used by all chart components */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const chartTooltip: any = {
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
    family: chartFont.family,
  },
  bodyFont: {
    size: 11,
    family: chartFont.family,
  },
}

/** Shared axis tick config */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const chartTick: any = {
  color: '#8b949e',
  font: {
    size: 10,
    family: chartFont.family,
  },
}

/** Shared axis tick config (slightly larger for y-axis labels) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const chartTickSm: any = {
  color: '#8b949e',
  font: {
    size: 11,
    family: chartFont.family,
  },
}

/** Shared grid config */
export const chartGrid = {
  color: 'rgba(48, 54, 61, 0.4)',
  drawTicks: false,
} as const

/** Shared legend config (hidden by default) */
export const chartLegend = { display: false } as const
