import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { ActionHistoryEntry, Permissions } from '../../types'
import { Icon } from '../../components/icons'
import { CopyButton } from '../../components/CopyButton'
import { TimelineEntry } from '../../components/TimelineEntry'
import { useModalContext } from '../../ModalContext'
import { Skeleton } from '../../components/Skeleton'
import { createConfirmModal, runModalAction } from '../../modals/helpers'

interface ActionHistorySectionProps {
  playerId: number
  permissions: Permissions
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
}: ActionHistorySectionProps) {
  const canDelete = permissions['player.actionhistory.delete']
  const { openModal, closeModal } = useModalContext()

  const [state, setState] = useState<HistoryState>({ status: 'loading' })

  // Fetch action history from server
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state before async fetch is the standard data-fetching pattern
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
    openModal(createConfirmModal({
      title: 'Delete action entry',
      description: 'Are you sure you want to delete this action history entry? This cannot be undone.',
      submitVariant: 'danger',
      onSubmit: async () => {
        await runModalAction({
          action: () => callLua('deleteActionHistoryEntry', { id: entryId, playerId }),
          closeModal,
          successMessage: 'Action entry deleted',
          errorMessage: 'Failed to delete action entry',
        })
      },
    }))
  }, [playerId, openModal, closeModal])

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
            <Skeleton key={i} width="100%" height={48} />
          ))}
        </div>
      </div>
    )
  }

  // ---- Render ----

  return (
    <div className="card">
      <div className="card-header">
        {/* eslint-disable-next-line nui/no-inline-styles -- overrides section-label margin for card-header context only */}
        <p className="section-label" style={{ marginBottom: 0 }}>Action History</p>
        <span className="text-xs text-fg-muted">{sortedEntries.length} entr{sortedEntries.length === 1 ? 'y' : 'ies'}</span>
      </div>

      {sortedEntries.length === 0 ? (
        <p className="text-sm text-fg-muted">No actions recorded for this player</p>
      ) : (
        <div className="timeline-list">
          {sortedEntries.map((entry) => {
            const color = ACTION_COLORS[entry.action] || 'var(--text-muted)'
            return (
              <TimelineEntry
                key={entry.id}
                title={
                  <span
                    className="action-history-entry-badge"
                    // eslint-disable-next-line nui/no-inline-styles -- dynamic color derived from action type mapping
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {capitalize(entry.action)}
                  </span>
                }
                time={formatTime(entry.time)}
                footer={
                  <>
                    <span className="timeline-entry-moderator">
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
                  </>
                }
                actions={
                  canDelete && (
                    <button
                      className="timeline-entry-delete"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete this entry"
                      aria-label="Delete action entry"
                    >
                      <Icon name="trash-2" size="xs" />
                    </button>
                  )
                }
              >
                {entry.reason && entry.reason}
              </TimelineEntry>
            )
          })}
        </div>
      )}
    </div>
  )
}
