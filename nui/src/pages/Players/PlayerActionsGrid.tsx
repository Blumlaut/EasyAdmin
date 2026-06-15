import { useState } from 'react'
import type { IconName } from '../../components/icons'
import type { Notification, Permissions, Player } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'

interface PlayerActionsGridProps {
  player: Player
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

type Variant = 'primary' | 'secondary' | 'danger' | 'warning'

interface ActionDef {
  id: string
  label: string
  icon: IconName
  variant: Variant
  permission: string
}

const ACTIONS: ActionDef[] = [
  { id: 'kick', label: 'Kick', icon: 'log-out', variant: 'danger', permission: 'player.kick' },
  { id: 'ban', label: 'Ban', icon: 'ban', variant: 'danger', permission: 'player.ban.temporary' },
  { id: 'warn', label: 'Warn', icon: 'alert-triangle', variant: 'warning', permission: 'player.warn' },
  { id: 'slap', label: 'Slap', icon: 'zap', variant: 'secondary', permission: 'player.slap' },
  { id: 'spectate', label: 'Spectate', icon: 'eye', variant: 'secondary', permission: 'player.spectate' },
  { id: 'screenshot', label: 'Screenshot', icon: 'camera', variant: 'secondary', permission: 'player.screenshot' },
  { id: 'bucket-join', label: 'Join bucket', icon: 'arrow-left', variant: 'secondary', permission: 'player.bucket.join' },
  { id: 'bucket-force', label: 'Force bucket', icon: 'map-pin', variant: 'warning', permission: 'player.bucket.force' },
]

const TOGGLE_ACTIONS: Array<{
  id: 'freeze' | 'mute'
  label: (p: Player) => string
  activeLabel: (p: Player) => string
  icon: IconName
  permission: string
}> = [
  {
    id: 'freeze',
    label: () => 'Freeze',
    activeLabel: () => 'Unfreeze',
    icon: 'snowflake',
    permission: 'player.freeze',
  },
  {
    id: 'mute',
    label: () => 'Mute',
    activeLabel: () => 'Unmute',
    icon: 'volume-x',
    permission: 'player.mute',
  },
]

export function PlayerActionsGrid({ player, permissions, onToast }: PlayerActionsGridProps) {
  const modal = useModalContext()
  const [busy, setBusy] = useState<string | null>(null)

  const available = ACTIONS.filter((a) => permissions[a.permission])
  const availableToggles = TOGGLE_ACTIONS.filter((a) => permissions[a.permission])

  async function runToggle(id: 'freeze' | 'mute') {
    setBusy(id)
    try {
      const newState = id === 'freeze' ? !player.frozen : !player.muted
      await callLuaToggle(id === 'freeze' ? 'toggleFreeze' : 'toggleMute', {
        id: player.id,
        name: player.name,
        freeze: newState,
        mute: newState,
      })
      onToast(`${id === 'freeze' ? 'Freeze' : 'Mute'} toggled`, 'success')
    } catch {
      onToast('Action failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  function handleAction(actionId: string) {
    if (actionId === 'kick') {
      modal.openKick(player)
    } else if (actionId === 'ban') {
      modal.openBan(player)
    } else if (actionId === 'warn') {
      modal.openWarn(player)
    } else if (actionId === 'slap') {
      modal.openSlap(player)
    } else if (actionId === 'spectate') {
      modal.openConfirm(
        'Spectate',
        `Start spectating ${player.name}?`,
        () => runConfirmAction('spectatePlayer', player),
      )
    } else if (actionId === 'screenshot') {
      modal.openConfirm(
        'Screenshot',
        `Take a screenshot of ${player.name}?`,
        () => runConfirmAction('screenshotPlayer', player),
      )
    } else if (actionId === 'bucket-join') {
      modal.openConfirm(
        'Join bucket',
        `Join ${player.name}'s routing bucket?`,
        () => runConfirmAction('joinPlayerBucket', player),
      )
    } else if (actionId === 'bucket-force') {
      modal.openConfirm(
        'Force bucket',
        `Force ${player.name} into your routing bucket?`,
        () => runConfirmAction('forcePlayerBucket', player),
        'danger',
      )
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action.id}
            className={`btn btn-${action.variant}`}
            onClick={() => handleAction(action.id)}
            disabled={busy === action.id}
          >
            <Icon name={action.icon} size="xs" />
            {action.label}
          </button>
        ))}
        {availableToggles.map((toggle) => {
          const active = toggle.id === 'freeze' ? player.frozen : player.muted
          return (
            <button
              key={toggle.id}
              className={`btn ${active ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => runToggle(toggle.id)}
              disabled={busy === toggle.id}
            >
              <Icon name={toggle.icon} size="xs" />
              {active ? toggle.activeLabel(player) : toggle.label(player)}
            </button>
          )
        })}
        {available.length === 0 && availableToggles.length === 0 && (
          <p className="text-muted text-sm">No permissions for this player</p>
        )}
      </div>
    </div>
  )
}

// Re-exported from fivem for toggle actions
import { callLua } from '../../fivem'

async function callLuaToggle(action: string, data: unknown): Promise<unknown> {
  return callLua(action, data)
}

async function runConfirmAction(cb: string, player: Player): Promise<void> {
  await callLua(cb, { id: player.id, name: player.name })
}
