import type { Player, Permissions, Notification } from '../types'
import { callLua } from '../fivem'
import { Icon, type IconName } from './icons'

interface PlayerActionsProps {
  player: Player
  permissions: Permissions
  onConfirm: (title: string, message: string, onConfirmFn: () => void) => void
  onToast: (text: string, type?: Notification['type']) => void
}

export function PlayerActions({ player, permissions, onConfirm, onToast }: PlayerActionsProps) {
  const actions: Array<{
    label: string
    icon: IconName
    variant: 'primary' | 'secondary' | 'danger' | 'warning'
    permission: string
    action: () => void
  }> = [
    {
      label: 'Kick',
      icon: 'log-out',
      variant: 'danger',
      permission: 'admin.player.kick',
      action: () => openConfirm(
        'Kick Player',
        `Kick ${player.name} from the server?`,
        () => execute('kickPlayer', { id: player.id, name: player.name }),
      ),
    },
    {
      label: 'Ban',
      icon: 'ban',
      variant: 'danger',
      permission: 'admin.player.ban',
      action: () => openConfirm(
        'Ban Player',
        `Ban ${player.name} from the server?`,
        () => execute('banPlayer', { id: player.id, name: player.name, reason: 'No reason specified', duration: 0 }),
      ),
    },
    {
      label: 'Warn',
      icon: 'alert-triangle',
      variant: 'warning',
      permission: 'admin.player.warn',
      action: () => execute('warnPlayer', { id: player.id, name: player.name }),
    },
    {
      label: 'Slap',
      icon: 'zap',
      variant: 'secondary',
      permission: 'admin.player.slap',
      action: () => execute('slapPlayer', { id: player.id, name: player.name }),
    },
    {
      label: player.frozen ? 'Unfreeze' : 'Freeze',
      icon: 'snowflake',
      variant: player.frozen ? 'secondary' : 'primary',
      permission: 'admin.player.freeze',
      action: () => execute('toggleFreeze', { id: player.id, name: player.name }),
    },
    {
      label: player.muted ? 'Unmute' : 'Mute',
      icon: 'volume-x',
      variant: player.muted ? 'secondary' : 'primary',
      permission: 'admin.player.mute',
      action: () => execute('toggleMute', { id: player.id, name: player.name }),
    },
    {
      label: 'Spectate',
      icon: 'eye',
      variant: 'secondary',
      permission: 'admin.player.spectate',
      action: () => execute('spectatePlayer', { id: player.id, name: player.name }),
    },
    {
      label: 'Teleport to',
      icon: 'map-pin',
      variant: 'secondary',
      permission: 'admin.player.teleport',
      action: () => execute('teleportToPlayer', { id: player.id, name: player.name }),
    },
    {
      label: 'Screenshot',
      icon: 'camera',
      variant: 'secondary',
      permission: 'admin.player.screenshot',
      action: () => execute('screenshotPlayer', { id: player.id, name: player.name }),
    },
  ]

  const availableActions = actions.filter((a) => permissions[a.permission])

  function execute(action: string, data: Record<string, unknown>) {
    callLua<Record<string, unknown>>(action, data)
      .then((result) => {
        if (result?.success) {
          onToast(`${action.replace(/([A-Z])/g, ' $1').trim()} executed`, 'success')
        }
      })
      .catch(() => {
        onToast('Action failed', 'error')
      })
  }

  function openConfirm(title: string, message: string, onConfirmFn: () => void) {
    onConfirm(title, message, onConfirmFn)
  }

  return (
    <div className="page-container">
      {/* Player info card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-lg">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{player.name}</h3>
            <p className="text-sm text-secondary text-mono">
              ID: {player.id}
              {player.license ? ` -- ${player.license}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {player.frozen && <span className="badge badge-frozen">Frozen</span>}
            {player.muted && <span className="badge badge-muted">Muted</span>}
            {player.developer && <span className="badge badge-dev">Dev</span>}
            {player.contributor && <span className="badge badge-contributor">Contrib</span>}
          </div>
        </div>
      </div>

      {/* Actions grid */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">
          Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          {availableActions.map((action) => (
            <button
              key={action.label}
              className={`btn btn-${action.variant}`}
              onClick={action.action}
            >
              <Icon name={action.icon} size="xs" />
              {action.label}
            </button>
          ))}
          {availableActions.length === 0 && (
            <p className="text-muted text-sm">No permissions for this player</p>
          )}
        </div>
      </div>
    </div>
  )
}
