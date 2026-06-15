import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { Icon } from '../../components/icons'

interface SettingsDataProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsData({ onToast }: SettingsDataProps) {
  async function refresh(action: 'refreshBanList' | 'refreshCachedPlayers' | 'refreshPermissions', label: string) {
    try {
      await callLua(action)
      onToast(`${label} refreshed`, 'success')
    } catch {
      onToast(`Failed to refresh ${label.toLowerCase()}`, 'error')
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Data</h3>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => refresh('refreshBanList', 'Ban list')}
        >
          <Icon name="refresh" size="xs" />
          Refresh ban list
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => refresh('refreshCachedPlayers', 'Cached players')}
        >
          <Icon name="refresh" size="xs" />
          Refresh cached players
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => refresh('refreshPermissions', 'Permissions')}
        >
          <Icon name="refresh" size="xs" />
          Refresh permissions
        </button>
      </div>
    </div>
  )
}
