import { useEffect, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { Notification, Permissions, Player, ReasonShortcut } from '../../types'
import { copyToClipboard } from '../../utils/clipboard'
import { PlayerInfoPanel } from './PlayerInfoPanel'
import { PlayerActionsPanel } from './PlayerActionsPanel'

interface PlayerDetailPageProps {
  player: Player
  permissions: Permissions
  ipPrivacy: boolean
  shortcuts: ReasonShortcut[]
  onToast: (text: string, type?: Notification['type']) => void
}

export function PlayerDetailPage({
  player,
  permissions,
  ipPrivacy,
  shortcuts,
  onToast,
}: PlayerDetailPageProps) {
  const [identifiers, setIdentifiers] = useState<string[] | null>(null)

  // Lazy-load full identifiers from server
  useEffect(() => {
    let cancelled = false
    callLua('getPlayerIdentifiers', { id: player.id })
    const unsub = on<{ id: number; identifiers: string[] }>('playerIdentifiers', (data) => {
      if (cancelled || data.id !== player.id) return
      setIdentifiers(data.identifiers)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [player.id])

  function copyDiscord() {
    if (!player.discord) {
      onToast('No Discord to copy', 'error')
      return
    }
    try {
      copyToClipboard(player.discord)
      onToast('Discord copied to clipboard', 'success')
    } catch {
      onToast('Copy failed', 'error')
    }
  }

  return (
    <div className="page-container">
      <PlayerInfoPanel
        player={player}
        ipPrivacy={ipPrivacy}
        identifiers={identifiers}
        onCopyDiscord={copyDiscord}
      />
      <PlayerActionsPanel
        player={player}
        permissions={permissions}
        shortcuts={shortcuts}
        onToast={onToast}
      />
    </div>
  )
}
