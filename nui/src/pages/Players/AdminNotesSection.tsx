import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { AdminNoteEntry, Permissions } from '../../types'
import { Icon } from '../../components/icons'
import { TimelineEntry } from '../../components/TimelineEntry'
import { useModalContext } from '../../ModalContext'
import { Skeleton } from '../../components/Skeleton'
import { createConfirmModal, createTextAreaModal, getStringValue, runModalAction } from '../../modals/helpers'

interface AdminNotesSectionProps {
  playerId: number
  permissions: Permissions
}

type NotesState =
  | { status: 'loading' }
  | { status: 'success'; entries: AdminNoteEntry[] }

export function AdminNotesSection({
  playerId,
  permissions,
}: AdminNotesSectionProps) {
  const canAdd = permissions['player.adminnotes.add']
  const canDelete = permissions['player.adminnotes.delete']
  const { openModal, closeModal } = useModalContext()

  const [state, setState] = useState<NotesState>({ status: 'loading' })

  // Fetch admin notes from server
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state before async fetch is the standard data-fetching pattern
    setState({ status: 'loading' })
    callLua('getAdminNotes', { id: playerId })
    const unsub = on<{ id: number; entries: AdminNoteEntry[] }>('adminNotes', (data) => {
      if (cancelled || data.id !== playerId) return
      setState({ status: 'success', entries: data.entries })
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [playerId])

  const handleDelete = useCallback((noteId: number) => {
    openModal(createConfirmModal({
      title: 'Delete admin note',
      description: 'Are you sure you want to delete this note? This cannot be undone.',
      submitVariant: 'danger',
      onSubmit: async () => {
        await runModalAction({
          action: () => callLua('deleteAdminNote', { id: noteId, playerId }),
          closeModal,
          successMessage: 'Note deleted',
          errorMessage: 'Failed to delete note',
        })
      },
    }))
  }, [playerId, openModal, closeModal])

  // Sort entries by time descending (newest first).
  // Note: time is a formatted string "DD/MM/YYYY HH:MM" so we sort by id descending as proxy.
  const sortedEntries = useMemo(() => {
    if (state.status !== 'success') return []
    return [...state.entries].sort((a, b) => b.id - a.id)
  }, [state])

  // ---- Loading state ----

  if (state.status === 'loading') {
    return (
      <div className="card">
        <p className="section-label">Admin Notes</p>
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
        <p className="section-label" style={{ marginBottom: 0 }}>Admin Notes</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">{sortedEntries.length} note{sortedEntries.length === 1 ? '' : 's'}</span>
          {canAdd && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => openModal(createTextAreaModal({
                title: 'Add admin note',
                label: 'Note content',
                placeholder: 'Type your note...',
                maxLength: 512,
                required: true,
                submitLabel: 'Add note',
                onSubmit: async (values) => {
                  const content = getStringValue(values, 'value')
                  await runModalAction({
                    action: () => callLua('addAdminNote', { id: playerId, note: content }),
                    closeModal,
                    successMessage: 'Note added',
                    errorMessage: 'Failed to add note',
                  })
                },
              }))}
              title="Add note"
              aria-label="Add admin note"
            >
              <Icon name="plus" size="xs" />
              Add
            </button>
          )}
        </div>
      </div>

      {sortedEntries.length === 0 ? (
        <p className="text-sm text-fg-muted">No notes for this player</p>
      ) : (
        <div className="timeline-list">
          {sortedEntries.map((entry) => (
            <TimelineEntry
              key={entry.id}
              time={entry.time}
              footer={
                <span className="timeline-entry-moderator">
                  <Icon name="shield" size="xs" />
                  {entry.moderator}
                </span>
              }
              actions={
                canDelete && (
                  <button
                    className="timeline-entry-delete"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete this note"
                    aria-label="Delete admin note"
                  >
                    <Icon name="trash-2" size="xs" />
                  </button>
                )
              }
            >
              {entry.content}
            </TimelineEntry>
          ))}
        </div>
      )}
    </div>
  )
}
