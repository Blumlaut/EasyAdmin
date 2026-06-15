import { callLua } from '../../fivem'
import type { Notification, Permissions, Player } from '../../types'
import { PlayerInfoPanel } from './PlayerInfoPanel'
import { PlayerActionsGrid } from './PlayerActionsGrid'
import { PlayerTeleportMenu } from './PlayerTeleportMenu'

interface PlayerDetailPageProps {
  player: Player
  permissions: Permissions
  ipPrivacy: boolean
  onToast: (text: string, type?: Notification['type']) => void
}

export function PlayerDetailPage({
  player,
  permissions,
  ipPrivacy,
  onToast,
}: PlayerDetailPageProps) {
  const canTeleport = !!permissions['player.teleport.single']

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
      <PlayerActionsGrid
        player={player}
        permissions={permissions}
        onToast={onToast}
      />
      {canTeleport && (
        <PlayerTeleportMenu player={player} onToast={onToast} />
      )}
    </div>
  )
}
