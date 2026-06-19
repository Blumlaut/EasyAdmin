import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProcessEntry, ProcessesResponse } from '../../types'
import { callLua, on } from '../../fivem'
import { Icon } from '../../components/icons'
import { StatCard } from '../../components/StatCard'
import { SearchBar } from '../../components/SearchBar'
import { SortableTable, type TableColumn, type SortState } from '../../components/SortableTable'
import { useDebounce } from '../../hooks/useDebounce'

// ============================================================
// Helpers
// ============================================================

function formatMemoryMB(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`
  }
  return `${mb} MB`
}

function formatTimestamp(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================
// ProcessesSection
// ============================================================

interface ProcessesSectionProps {
  processes: ProcessEntry[]
  timestamp: number
  loading: boolean
}

export function ProcessesSection({ processes: initialProcesses, timestamp, loading: initialLoading }: ProcessesSectionProps) {
  const [processes, setProcesses] = useState<ProcessEntry[]>(initialProcesses)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('memoryMB')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(initialLoading)
  const debouncedQuery = useDebounce(query, 300)

  // Listen for processes pushed from Lua
  useEffect(() => {
    return on<ProcessesResponse>('processes', (data) => {
      setProcesses(data.processes)
      setLoading(false)
    })
  }, [])

  // Fetch when debounced search changes
  useEffect(() => {
    setLoading(true)
    callLua('requestProcesses', { query: debouncedQuery }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  // Sync from props when initial data arrives
  useEffect(() => {
    if (initialProcesses.length > 0 && processes.length === 0) {
      setProcesses(initialProcesses)
    }
  }, [initialProcesses, processes.length])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    callLua('requestProcesses', { query: debouncedQuery }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleSortChange = useCallback((state: SortState) => {
    setSortBy(state.sortBy)
    setSortDir(state.sortDir)
  }, [])

  // Total CPU and memory
  const totals = useMemo(() => {
    const totalCpu = processes.reduce((acc, p) => acc + p.cpuPercent, 0)
    const totalMem = processes.reduce((acc, p) => acc + p.memoryMB, 0)
    return { totalCpu, totalMem }
  }, [processes])

  const columns = useMemo<TableColumn<ProcessEntry>[]>(() => [
    {
      key: 'name',
      label: 'Process',
      sortable: true,
      render: (p) => (
        <span className="truncate max-w-[180px] text-mono" title={p.name}>
          {p.name}
        </span>
      ),
    },
    {
      key: 'pid',
      label: 'PID',
      sortable: true,
      render: (p) => <span className="text-xs text-muted">{p.pid}</span>,
      cellClass: 'text-center',
    },
    {
      key: 'cpuPercent',
      label: 'CPU %',
      sortable: true,
      render: (p) => (
        <span className={`text-xs font-semibold ${p.cpuPercent > 50 ? 'text-red' : ''}`}>
          {p.cpuPercent.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'memoryMB',
      label: 'Memory',
      sortable: true,
      render: (p) => <span className="text-xs">{formatMemoryMB(p.memoryMB)}</span>,
    },
    ...(pHasUser(processes)
      ? [
          {
            key: 'user',
            label: 'User',
            sortable: true,
            render: (p: ProcessEntry) => <span className="text-xs text-muted">{p.user || '—'}</span>,
          },
        ]
      : []),
    ...(pHasState(processes)
      ? [
          {
            key: 'state',
            label: 'State',
            sortable: false,
            render: (p: ProcessEntry) => <span className="text-xs text-muted">{p.state || '—'}</span>,
          },
        ]
      : []),
  ], [processes])

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 metrics-grid">
        <StatCard
          label="Processes"
          value={processes.length}
          icon="layers"
          iconColor="var(--accent-blue)"
          bgColor="var(--bg-blue)"
          subValue={`Sampled ${formatTimestamp(timestamp)}`}
        />
        <StatCard
          label="Total CPU"
          value={`${totals.totalCpu.toFixed(1)}%`}
          icon="zap"
          iconColor="var(--accent-orange)"
          bgColor="var(--bg-orange)"
        />
        <StatCard
          label="Total Memory"
          value={formatMemoryMB(totals.totalMem)}
          icon="server"
          iconColor="var(--accent-purple)"
          bgColor="var(--bg-purple)"
        />
        <StatCard
          label="Top Consumer"
          value={
            processes.length > 0
              ? [...processes].sort((a, b) => b.memoryMB - a.memoryMB)[0]?.name ?? '—'
              : '—'
          }
          icon="trending-up"
          iconColor="var(--accent-red)"
          bgColor="var(--bg-red)"
          subValue={
            processes.length > 0
              ? `${formatMemoryMB([...processes].sort((a, b) => b.memoryMB - a.memoryMB)[0]?.memoryMB ?? 0)} RAM`
              : undefined
          }
        />
      </div>

      {/* Process table */}
      <div className="card metrics-card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Running Processes</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search processes…"
            resultCount={
              processes.length > 0
                ? { shown: processes.length, total: processes.length }
                : undefined
            }
            ariaLabel="Search processes"
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon name="refresh" size="xs" />
            Refresh
          </button>
        </div>

        {loading && processes.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '100px' }}>
            <p className="text-xs text-muted">Loading processes…</p>
          </div>
        ) : processes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="empty-state-icon empty-state-icon-blue mb-3">
              <Icon name="layers" size="lg" className="text-blue" />
            </div>
            <p className="text-sm text-muted">No process data available</p>
            <p className="text-xs text-muted mt-1">Process list will appear after the first sample</p>
          </div>
        ) : (
          <SortableTable
            columns={columns}
            rows={processes}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            getKey={(p) => `proc-${p.pid}`}
          />
        )}
      </div>
    </>
  )
}

// Check if any process has user/state fields
function pHasUser(processes: ProcessEntry[]): boolean {
  return processes.some((p) => p.user !== undefined)
}
function pHasState(processes: ProcessEntry[]): boolean {
  return processes.some((p) => p.state !== undefined)
}
