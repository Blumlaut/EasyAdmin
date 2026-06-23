/**
 * EasyInfo example plugin — Player Notes tab.
 *
 * Injected into the player detail page. Demonstrates a plugin tab that
 * fetches per-player data from the Lua backend and shows how plugin
 * contributions can extend existing EasyAdmin pages.
 */

import { useEffect, useState } from 'react'
import { usePluginApi } from '../index'
import type { PlayerDetailTabProps } from '../index'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface PlayerNote {
  text: string
  author: string
  timestamp: number
}

function formatTime(unixSeconds: number): string {
  if (!unixSeconds) return '—'
  return new Date(unixSeconds * 1000).toLocaleString()
}

export function PlayerNotesTab({ player }: PlayerDetailTabProps) {
  const api = usePluginApi('easyinfo')
  const [notes, setNotes] = useState<PlayerNote[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading state while fetching plugin tab data
    setLoading(true)
    api.callLua<PlayerNote[]>('getPlayerNotes', { playerId: player.id })
      .then((data) => setNotes(data ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [api, player.id])

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton height={16} width="80%" />
        <Skeleton height={16} width="60%" />
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-fg-muted">
        <Icon name="book-open" size="md" />
        <span>{api.t('No plugin notes for this player.')}</span>
      </div>
    )
  }

  return (
    <div className="easyinfo-notes flex flex-col gap-2 p-2">
      {notes.map((note, i) => (
        <div key={i} className="easyinfo-note card p-3">
          <p className="text-sm">{note.text}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
            <Icon name="shield" size="xs" />
            <span>{note.author}</span>
            <span className="text-mono ml-auto">{formatTime(note.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
