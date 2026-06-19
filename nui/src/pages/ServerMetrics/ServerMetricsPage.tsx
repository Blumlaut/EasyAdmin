import { useMemo, useState } from 'react'
import type { MetricsRange, MetricsTab, Notification } from '../../types'
import { useMetricsData } from '../../hooks/useMetricsData'
import { Icon } from '../../components/icons'
import { StatCard } from '../../components/StatCard'
import { TimeSeriesChart, type TimeSeriesLine } from '../../components/TimeSeriesChart'
import { CPUMetricsSection } from './CPUMetricsSection'
import { MemoryMetricsSection } from './MemoryMetricsSection'
import { DiskMetricsSection } from './DiskMetricsSection'
import { NetworkMetricsSection } from './NetworkMetricsSection'
import { ProcessesSection } from './ProcessesSection'

// ============================================================
// Types
// ============================================================

interface ServerMetricsPageProps {
  onToast: (text: string, type?: Notification['type']) => void
}

// ============================================================
// Range / tab config
// ============================================================

const rangeOptions: Array<{ value: MetricsRange; label: string }> = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
]

const tabs: Array<{ key: MetricsTab; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: 'layout-grid' },
  { key: 'cpu', label: 'CPU', icon: 'zap' },
  { key: 'memory', label: 'Memory', icon: 'server' },
  { key: 'disk', label: 'Disk', icon: 'archive' },
  { key: 'network', label: 'Network', icon: 'globe' },
  { key: 'processes', label: 'Processes', icon: 'layers' },
]

// ============================================================
// Skeleton
// ============================================================

function MetricsSkeleton() {
  return (
    <>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-4 metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card dashboard-card-sm">
            <div className="flex items-center gap-3">
              <div className="skeleton dashboard-skeleton-icon" />
              <div className="flex-1">
                <div className="skeleton dashboard-skeleton-label" />
                <div className="skeleton dashboard-skeleton-value" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton" style={{ width: '120px', height: '14px' }} />
          <div className="flex items-center gap-2">
            <div className="skeleton" style={{ width: '60px', height: '12px' }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '4px' }} />
      </div>
    </>
  )
}

// ============================================================
// OverviewTab
// ============================================================

function OverviewTab({
  cpu,
  cpuCoreCount,
  memoryCurrent,
  networkCurrent,
  loading,
}: {
  cpu: Array<{ timestamp: number; usagePercent: number }>
  cpuCoreCount: number
  memoryCurrent: { totalMB: number; usedMB: number; usagePercent: number } | null
  networkCurrent: { bytesInMBps: number; bytesOutMBps: number } | null
  loading: boolean
}) {
  // Stat cards
  const statCards = [
    {
      label: 'CPU Usage',
      value: cpu.length > 0 ? `${cpu[cpu.length - 1].usagePercent.toFixed(1)}%` : '—',
      icon: 'zap' as const,
      iconColor: 'var(--accent-orange)',
      bgColor: 'var(--bg-orange)',
      subValue: cpuCoreCount > 0 ? `${cpuCoreCount} core${cpuCoreCount > 1 ? 's' : ''}` : undefined,
    },
    {
      label: 'RAM Usage',
      value: memoryCurrent
        ? `${memoryCurrent.usedMB} / ${memoryCurrent.totalMB} MB`
        : '—',
      icon: 'server' as const,
      iconColor: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
      subValue: memoryCurrent ? `${memoryCurrent.usagePercent.toFixed(1)}% used` : undefined,
    },
    {
      label: 'Network In',
      value: networkCurrent ? `${networkCurrent.bytesInMBps.toFixed(2)} MB/s` : '—',
      icon: 'arrow-down-circle' as const,
      iconColor: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: 'Network Out',
      value: networkCurrent ? `${networkCurrent.bytesOutMBps.toFixed(2)} MB/s` : '—',
      icon: 'arrow-up-circle' as const,
      iconColor: 'var(--accent-purple)',
      bgColor: 'var(--bg-purple)',
    },
  ]

  // CPU sparkline (last 60 data points)
  const cpuLines: TimeSeriesLine[] = useMemo(() => [
    {
      label: 'CPU %',
      data: cpu.slice(-60).map((d) => ({ timestamp: d.timestamp * 1000, value: d.usagePercent })),
      color: '#d29922',
      fillColor: 'rgba(210, 153, 34, 0.15)',
    },
  ], [cpu])

  const cpuRange = useMemo(() => {
    if (cpu.length === 0) return { start: Date.now() - 3600000, end: Date.now() }
    return {
      start: cpu[0].timestamp * 1000 - 60000,
      end: cpu[cpu.length - 1].timestamp * 1000 + 60000,
    }
  }, [cpu])

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 metrics-grid">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* CPU sparkline */}
      <div className="card metrics-chart-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">CPU Usage (recent)</p>
          {!loading && cpu.length > 0 && (
            <span className="badge badge-warning">{cpu[cpu.length - 1].usagePercent.toFixed(1)}%</span>
          )}
        </div>
        <TimeSeriesChart
          lines={cpuLines}
          range={cpuRange}
          height={180}
          unit="%"
          emptyMessage="No CPU data collected yet"
        />
      </div>
    </>
  )
}

// ============================================================
// ServerMetricsPage
// ============================================================

export function ServerMetricsPage({ onToast: _onToast }: ServerMetricsPageProps) {
  const [range, setRange] = useState<MetricsRange>('24h')
  const [activeTab, setActiveTab] = useState<MetricsTab>('overview')

  const data = useMetricsData(range)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Server Metrics</h3>
          <p className="text-xs text-muted mt-0.5">
            System performance and resource monitoring
            {data.os ? ` · ${data.os.os === 'windows' ? 'Windows' : 'Linux'}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={data.refresh}
            disabled={data.loading}
          >
            <Icon name="refresh" size="xs" />
            Refresh
          </button>
          <div className="flex items-center gap-0.5">
            {rangeOptions.map((r) => (
              <button
                key={r.value}
                className={`btn btn-xs ${range === r.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="metrics-tabs mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`metrics-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon as any} size="xs" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {data.loading && !data.cpu.length && !data.memory.length ? (
        <MetricsSkeleton />
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              cpu={data.cpu}
              cpuCoreCount={data.cpuCoreCount}
              memoryCurrent={data.memoryCurrent}
              networkCurrent={data.networkCurrent}
              loading={data.loading}
            />
          )}
          {activeTab === 'cpu' && (
            <CPUMetricsSection
              snapshots={data.cpu}
              coreCount={data.cpuCoreCount}
              range={range}
              loading={data.loading}
            />
          )}
          {activeTab === 'memory' && (
            <MemoryMetricsSection
              snapshots={data.memory}
              current={data.memoryCurrent}
              range={range}
              loading={data.loading}
            />
          )}
          {activeTab === 'disk' && (
            <DiskMetricsSection
              snapshots={data.disk}
              current={data.diskCurrent}
              range={range}
              loading={data.loading}
            />
          )}
          {activeTab === 'network' && (
            <NetworkMetricsSection
              snapshots={data.network}
              current={data.networkCurrent}
              range={range}
              loading={data.loading}
            />
          )}
          {activeTab === 'processes' && (
            <ProcessesSection
              processes={data.processes}
              timestamp={data.processesTimestamp}
              loading={data.loading}
            />
          )}
        </>
      )}
    </div>
  )
}
