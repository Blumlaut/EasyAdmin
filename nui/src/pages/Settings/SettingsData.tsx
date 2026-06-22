import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { Icon } from '../../components/icons'
import { useTranslation } from '../../lib/i18n'

export function SettingsData() {
  const { t } = useTranslation()
  async function refresh(action: 'refreshBanList' | 'refreshCachedPlayers' | 'refreshPermissions', label: string) {
    try {
      await callLua(action)
      notify(t("{label} refreshed", { label }), 'success')
    } catch {
      notify(t("Failed to refresh {label}", { label }), 'error')
    }
  }

  return (
    <div className="card">
      <p className="section-label">{t("Data")}</p>
      <div className="flex flex-col gap-1">
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshBanList', 'Ban list')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">{t("Refresh ban list")}</span>
        </button>
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshCachedPlayers', 'Cached players')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">{t("Refresh cached players")}</span>
        </button>
        <button
          className="server-action-btn"
          onClick={() => refresh('refreshPermissions', 'Permissions')}
        >
          <Icon name="refresh" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">{t("Refresh permissions")}</span>
        </button>
      </div>
    </div>
  )
}
