import { useMemo, useState } from 'react'
import type { Notification, Report } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface ReportListPageProps {
  reports: Report[]
  loading: boolean
  onSelectReport: (reportId: number) => void
  onToast: (text: string, type?: Notification['type']) => void
  onRefresh: () => void
}

export function ReportListPage({
  reports,
  loading,
  onSelectReport,
  onRefresh,
}: ReportListPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    if (!debouncedQuery) return reports
    const q = debouncedQuery.toLowerCase()
    return reports.filter((report) => {
      if (String(report.id).includes(q)) return true
      if (report.reporterName?.toLowerCase().includes(q)) return true
      if (report.reportedName?.toLowerCase().includes(q)) return true
      if (report.reason?.toLowerCase().includes(q)) return true
      return false
    })
  }, [reports, debouncedQuery])

  return (
    <div className="page-container">
      <div className="flex items-center gap-2 mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by ID, name, or reason..."
          resultCount={{ shown: filtered.length, total: reports.length }}
          ariaLabel="Search reports"
        />
        <button
          className="btn btn-ghost btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
      </div>

      {loading ? (
        <ReportListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="flag" size="lg" className="text-muted" />
          <p>{reports.length === 0 ? 'No open reports' : 'No reports match your search'}</p>
        </div>
      ) : (
        <div className="list">
          {filtered.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onClick={() => onSelectReport(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportRow({ report, onClick }: { report: Report; onClick: () => void }) {
  const colorClass = report.claimed
    ? 'report-claimed'
    : report.type === 1
      ? 'report-emergency'
      : 'report-normal'

  const targetName = report.reportedName ?? report.reporterName

  return (
    <div
      className={`list-item ${colorClass}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="avatar avatar-sm">
        <Icon
          name="flag"
          size="xs"
          className={
            report.claimed
              ? 'text-green'
              : report.type === 1
                ? 'text-red'
                : 'text-yellow'
          }
        />
      </div>
      <div className="list-item-content">
        <div className="list-item-title">
          #{report.id} {targetName}
        </div>
        <div className="list-item-subtitle truncate">{report.reason}</div>
      </div>
      <div className="list-item-meta">
        {report.claimed && report.claimedName && (
          <span className="badge badge-green">{report.claimedName}</span>
        )}
        <span className="badge badge-default">{report.reportTimeFormatted}</span>
      </div>
    </div>
  )
}

function ReportListSkeleton() {
  return (
    <div className="list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="list-item">
          <Skeleton width={32} height={32} circle />
          <div className="list-item-content flex flex-col gap-1">
            <Skeleton width="50%" height={14} />
            <Skeleton width="80%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}
