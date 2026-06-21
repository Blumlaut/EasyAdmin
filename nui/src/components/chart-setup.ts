/**
 * Chart.js registry — only registers the pieces we actually use.
 * Import this once at app entry to keep the bundle lean.
 */
import {
  Chart,
  CategoryScale,
  LinearScale,
  TimeScale,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import 'chartjs-adapter-date-fns'

Chart.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

// Make TS happy with the extended registry
declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Register extends Record<string, never> {}
}

export default Chart
