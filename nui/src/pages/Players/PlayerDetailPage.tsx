import { callLua } from '../../fivem'
import type { Notification, Permissions, Player, ReasonShortcut } from '../../types'
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
  async function copyDiscord() {
    if (!player.discord) {
      onToast('No Discord to copy', 'error')
      return
    }
    try {
      await callLua('copyToClipboard', { text: player.discord })
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
