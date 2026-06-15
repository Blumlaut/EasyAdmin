import { useState } from 'react'
import { callLua } from '../../fivem'
import type { IconName } from '../../components/icons'
import type { Notification, Player } from '../../types'
import { Icon } from '../../components/icons'

interface PlayerTeleportMenuProps {
  player: Player
  onToast: (text: string, type?: Notification['type']) => void
}

type TeleportAction = 'toMe' | 'meToPlayer' | 'meBack' | 'playerBack' | 'intoVehicle'

interface TeleportOption {
  id: TeleportAction
  label: string
  icon: IconName
  action: 'teleportToPlayer' | 'teleportPlayerToMe' | 'teleportMeBack' | 'teleportPlayerBack' | 'teleportIntoVehicle'
}

const OPTIONS: TeleportOption[] = [
  { id: 'toMe', label: 'Teleport to me', icon: 'map-pin', action: 'teleportPlayerToMe' },
  { id: 'meToPlayer', label: 'Me to player', icon: 'log-out', action: 'teleportToPlayer' },
  { id: 'meBack', label: 'Me back', icon: 'chevron-left', action: 'teleportMeBack' },
  { id: 'playerBack', label: 'Player back', icon: 'home', action: 'teleportPlayerBack' },
  { id: 'intoVehicle', label: 'Into closest vehicle', icon: 'globe', action: 'teleportIntoVehicle' },
]

/**
 * Sub-grid of teleport options. Mirrors the NativeUI list (5 options).
 */
export function PlayerTeleportMenu({ player, onToast }: PlayerTeleportMenuProps) {
  const [busy, setBusy] = useState<TeleportAction | null>(null)

  async function run(opt: TeleportOption) {
    setBusy(opt.id)
    try {
      await callLua(opt.action, { id: player.id, name: player.name })
      onToast(`${opt.label} executed`, 'success')
    } catch {
      onToast(`Failed: ${opt.label}`, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card">
      <p className="section-label">Teleport</p>
      <div className="flex flex-col gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className="teleport-btn"
            onClick={() => run(opt)}
            disabled={busy === opt.id}
          >
            <Icon name={opt.icon} size="xs" className="text-muted" />
            <span className="flex-1 text-left">{opt.label}</span>
            <Icon name="chevron-right" size="xs" className="text-muted" style={{ opacity: 0.4 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
