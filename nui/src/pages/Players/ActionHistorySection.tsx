import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { ActionHistoryEntry, Notification, Permissions } from '../../types'
import { Icon } from '../../components/icons'
import { CopyButton } from '../../components/CopyButton'
import { useModalContext } from '../../ModalContext'
import { Skeleton } from '../../components/Skeleton'

interface ActionHistorySectionProps {
  playerId: number
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

type HistoryState =
  | { status: 'loading' }
  | { status: 'success'; entries: ActionHistoryEntry[] }

// Map action types to severity colors
const ACTION_COLORS: Record<string, string> = {
  'Ban': 'var(--accent-red)',
  'Kick': 'var(--accent-orange)',
  'Warn': 'var(--accent-yellow)',
  'Mute': 'var(--accent-blue)',
  'Freeze': 'var(--accent-blue)',
}

// Format a Unix timestamp (seconds) to a readable date string
function formatTime(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000)
  return date.toLocaleString()
}

// Capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function ActionHistorySection({
  playerId,
  permissions,
  onToast,
}: ActionHistorySectionProps) {
  const canDelete = permissions['player.actionhistory.delete']
  const modal = useModalContext()

  const [state, setState] = useState<HistoryState>({ status: 'loading' })

  // Fetch action history from server
  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    callLua('getActionHistory', { id: playerId })
    const unsub = on<{ id: number; entries: ActionHistoryEntry[] }>('actionHistory', (data) => {
      if (cancelled || data.id !== playerId) return
      setState({ status: 'success', entries: data.entries })
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [playerId])

  const handleDelete = useCallback((entryId: number) => {
    modal.openConfirm(
      'Delete action entry',
      'Are you sure you want to delete this action history entry? This cannot be undone.',
      async () => {
        try {
          await callLua('deleteActionHistoryEntry', { id: entryId, playerId })
          onToast('Action entry deleted', 'success')
        } catch {
          onToast('Failed to delete action entry', 'error')
        }
      },
      'danger'
    )
  }, [playerId, onToast, modal])

  // Sort entries by time descending (newest first)
  const sortedEntries = useMemo(() => {
    if (state.status !== 'success') return []
    return [...state.entries].sort((a, b) => b.time - a.time)
  }, [state])

  // ---- Loading state ----

  if (state.status === 'loading') {
    return (
      <div className="card">
        <p className="section-label">Action History</p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={40} />
          ))}
        </div>
      </div>
    )
  }

  // ---- Empty state ----

  if (sortedEntries.length === 0) {
    return (
      <div className="card">
        <p className="section-label">Action History</p>
        <p className="text-sm text-muted">No actions recorded for this player</p>
      </div>
    )
  }

  // ---- Entries ----

  return (
    <div className="card">
      <div className="card-header">
        <p className="section-label" style={{ marginBottom: 0 }}>Action History</p>
        <span className="text-xs text-muted">{sortedEntries.length} entr{sortedEntries.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="action-history-list">
        {sortedEntries.map((entry) => {
          const color = ACTION_COLORS[entry.action] || 'var(--text-muted)'
          return (
            <div
              key={entry.id}
              className="action-history-entry"
              style={{ '--entry-accent': color } as React.CSSProperties}
            >
              <div className="action-history-entry-header">
                <span
                  className="action-history-entry-badge"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {capitalize(entry.action)}
                </span>
                <span className="action-history-entry-time">
                  {formatTime(entry.time)}
                </span>
              </div>

              {entry.reason && (
                <p className="action-history-entry-reason">{entry.reason}</p>
              )}

              <div className="action-history-entry-meta">
                <span className="action-history-entry-moderator">
                  <Icon name="shield" size="xs" />
                  {entry.moderator}
                </span>

                {entry.banid != null && (
                  <span className="action-history-entry-banid">
                    Ban #{entry.banid}
                    <CopyButton
                      value={String(entry.banid)}
                      ariaLabel="Copy ban ID"
                    />
                  </span>
                )}

                {canDelete && (
                  <button
                    className="action-history-entry-delete"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete this entry"
                    aria-label="Delete action entry"
                  >
                    <Icon name="trash-2" size="xs" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
