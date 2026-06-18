import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { AdminNoteEntry, Notification, Permissions } from '../../types'
import { Icon } from '../../components/icons'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { InputPrompt } from '../../components/InputPrompt'
import { Skeleton } from '../../components/Skeleton'

interface AdminNotesSectionProps {
  playerId: number
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

type NotesState =
  | { status: 'loading' }
  | { status: 'success'; entries: AdminNoteEntry[] }

export function AdminNotesSection({
  playerId,
  permissions,
  onToast,
}: AdminNotesSectionProps) {
  const canAdd = permissions['player.adminnotes.add']
  const canDelete = permissions['player.adminnotes.delete']

  const [state, setState] = useState<NotesState>({ status: 'loading' })
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Fetch admin notes from server
  useEffect(() => {
    let cancelled = false
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

  const handleAddNote = useCallback(async (content: string) => {
    setAdding(false)
    if (!content.trim()) return
    try {
      await callLua('addAdminNote', { id: playerId, note: content.trim() })
      onToast('Note added', 'success')
    } catch {
      onToast('Failed to add note', 'error')
    }
  }, [playerId, onToast])

  const handleDelete = useCallback((noteId: number) => {
    setDeletingId(noteId)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (deletingId === null) return
    try {
      await callLua('deleteAdminNote', { id: deletingId, playerId })
      onToast('Note deleted', 'success')
    } catch {
      onToast('Failed to delete note', 'error')
    } finally {
      setDeletingId(null)
    }
  }, [deletingId, playerId, onToast])

  const cancelDelete = useCallback(() => {
    setDeletingId(null)
  }, [])

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
        <p className="section-label" style={{ marginBottom: 0 }}>Admin Notes</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{sortedEntries.length} note{sortedEntries.length === 1 ? '' : 's'}</span>
          {canAdd && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setAdding(true)}
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
        <p className="text-sm text-muted">No notes for this player</p>
      ) : (
        <div className="admin-notes-list">
          {sortedEntries.map((entry) => (
            <div key={entry.id} className="admin-note-entry">
              <div className="admin-note-entry-header">
                <span className="admin-note-entry-moderator">
                  <Icon name="shield" size="xs" />
                  {entry.moderator}
                </span>
                <span className="admin-note-entry-time">{entry.time}</span>
                {canDelete && (
                  <button
                    className="admin-note-entry-delete"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete this note"
                    aria-label="Delete admin note"
                  >
                    <Icon name="trash-2" size="xs" />
                  </button>
                )}
              </div>
              <p className="admin-note-entry-content">{entry.content}</p>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <InputPrompt
          title="Add admin note"
          label="Note content"
          placeholder="Type your note..."
          maxLength={512}
          confirmLabel="Add note"
          required
          onConfirm={handleAddNote}
          onCancel={() => setAdding(false)}
        />
      )}

      {deletingId !== null && (
        <ConfirmDialog
          title="Delete admin note"
          message="Are you sure you want to delete this note? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  )
}
