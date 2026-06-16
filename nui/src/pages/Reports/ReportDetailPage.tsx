import { useEffect, useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification, Permissions, Player, Report } from '../../types'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Icon } from '../../components/icons'

interface ReportDetailPageProps {
  reportId: number
  reports: Report[]
  permissions: Permissions
  players: Player[]
  onOpenPlayer: (playerId: number) => void
  onRemoved: () => void
  onToast: (text: string, type?: Notification['type']) => void
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; report: Report }

export function ReportDetailPage({
  reportId,
  reports,
  permissions,
  players,
  onOpenPlayer,
  onRemoved,
  onToast,
}: ReportDetailPageProps) {
  const canClaim = !!permissions['player.reports.claim']
  const canProcess = !!permissions['player.reports.process']

  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmSimilar, setConfirmSimilar] = useState(false)
  const [busy, setBusy] = useState(false)

  // Derive report from parent's reports array; fall back to fetch if not found
  useEffect(() => {
    const existing = reports.find((r) => r.id === reportId)
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: 'success', report: existing })
    } else {
      // Report not yet in the list (e.g. navigated before list loaded)
      let cancelled = false
      callLua<{ report?: Report }>('getReportById', { id: reportId })
        .then((res) => {
          if (cancelled) return
          if (res.report) {
            setState({ status: 'success', report: res.report })
          } else {
            setState({ status: 'error' })
          }
        })
        .catch(() => {
          if (cancelled) return
          setState({ status: 'error' })
        })
      return () => {
        cancelled = true
      }
    }
    // Re-run when reportId changes or reports array is updated (e.g. after claim)
  }, [reportId, reports])

  async function claim() {
    if (state.status !== 'success') return
    setBusy(true)
    try {
      await callLua('claimReport', { id: state.report.id })
      // UI updates automatically via the reports prop when updateReports fires
    } catch {
      onToast('Failed to claim report', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function closeReport() {
    if (state.status !== 'success') return
    setBusy(true)
    try {
      await callLua('closeReport', { id: state.report.id })
      onToast('Report closed', 'success')
      setConfirmClose(false)
      onRemoved()
    } catch {
      onToast('Failed to close report', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function closeSimilar() {
    if (state.status !== 'success') return
    setBusy(true)
    try {
      await callLua('closeSimilarReports', { id: state.report.id })
      onToast('Similar reports closed', 'success')
      setConfirmSimilar(false)
      onRemoved()
    } catch {
      onToast('Failed to close similar reports', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="page-container">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar avatar-md">…</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">Loading report…</h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <div className="empty-state-icon empty-state-icon-orange">
            <Icon name="flag" size="lg" className="text-orange" />
          </div>
          <p className="text-secondary">Report not found or failed to load</p>
        </div>
      </div>
    )
  }

  const report = state.report
  const isPlayerOnline = (id: number) => players.some((p) => p.id === id)

  const rows: KeyValueRow[] = [
    { key: 'ID', value: `#${report.id}`, mono: true },
    { key: 'Type', value: report.type === 1 ? 'Emergency' : 'Normal' },
    { key: 'Time', value: report.reportTimeFormatted },
    {
      key: 'Reporter',
      value: report.reporterName,
      mono: true,
      onClick: isPlayerOnline(report.reporter)
        ? () => onOpenPlayer(report.reporter)
        : undefined,
      actionLabel: isPlayerOnline(report.reporter) ? 'Open' : 'Offline',
    },
  ]
  if (report.reported !== undefined && report.reportedName) {
    const reportedId = report.reported
    const open = isPlayerOnline(reportedId)
    rows.push({
      key: 'Reported',
      value: report.reportedName,
      mono: true,
      onClick: open ? () => onOpenPlayer(reportedId) : undefined,
      actionLabel: open ? 'Open' : 'Offline',
    })
  }
  rows.push({ key: 'Reason', value: report.reason })
  if (report.claimed) {
    rows.push({ key: 'Claimed by', value: report.claimedName ?? '—' })
  }

  const iconColor = report.claimed
    ? 'text-green'
    : report.type === 1
      ? 'text-red'
      : 'text-yellow'

  return (
    <div className="page-container">
      <div className={`card ${report.claimed ? 'card-report-claimed' : report.type === 1 ? 'card-report-emergency' : 'card-report-normal'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`avatar avatar-md ${report.claimed ? 'avatar-report-claimed' : report.type === 1 ? 'avatar-report-emergency' : 'avatar-report'}`}>
            <Icon
              name="flag"
              size="sm"
              className={iconColor}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              Report #{report.id}
            </h3>
            <p className="text-sm text-muted">
              {report.type === 1 ? 'Emergency' : 'Normal'}
            </p>
          </div>
        </div>
        <KeyValueTable rows={rows} ariaLabel="Report details" />
      </div>

      <div className="card">
        <p className="section-label">Actions</p>
        <div className="flex flex-col gap-2">
          {canClaim && !report.claimed && (
            <button
              className="btn btn-primary btn-full"
              onClick={claim}
              disabled={busy}
            >
              <Icon name="check" size="xs" />
              Claim report
            </button>
          )}
          {canProcess && (
            <>
              <button
                className="btn btn-danger btn-full"
                onClick={() => setConfirmClose(true)}
                disabled={busy}
              >
                <Icon name="x" size="xs" />
                Close report
              </button>
              <button
                className="btn btn-warning btn-full"
                onClick={() => setConfirmSimilar(true)}
                disabled={busy}
              >
                <Icon name="trash-2" size="xs" />
                Close similar reports
              </button>
            </>
          )}
        </div>
      </div>

      {confirmClose && (
        <ConfirmDialog
          title="Close report"
          message={`Are you sure you want to close report #${report.id}?`}
          confirmLabel="Close"
          variant="danger"
          onConfirm={closeReport}
          onCancel={() => setConfirmClose(false)}
        />
      )}

      {confirmSimilar && (
        <ConfirmDialog
          title="Close similar reports"
          message="This will close all reports with the same reporter, reported player, and reason. Continue?"
          confirmLabel="Close similar"
          variant="danger"
          onConfirm={closeSimilar}
          onCancel={() => setConfirmSimilar(false)}
        />
      )}
    </div>
  )
}
