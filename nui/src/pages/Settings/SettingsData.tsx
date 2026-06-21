import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { Icon } from '../../components/icons'

export function SettingsData() {
  async function refresh(action: 'refreshBanList' | 'refreshCachedPlayers' | 'refreshPermissions', label: string) {
    try {
      await callLua(action)
      notify(`${label} refreshed`, 'success')
    } catch {
      notify(`Failed to refresh ${label.toLowerCase()}`, 'error')
    }
  }

  return (
    <div className="card">
      <p className="section-label">Data</p>
      <div className="flex flex-col gap-1">
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshBanList', 'Ban list')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">Refresh ban list</span>
        </button>
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshCachedPlayers', 'Cached players')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">Refresh cached players</span>
        </button>
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshPermissions', 'Permissions')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">Refresh permissions</span>
        </button>
      </div>
    </div>
  )
}
