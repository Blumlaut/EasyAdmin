import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'

interface SettingsPrivacyProps {
  anonymous: boolean
  onChange: (anonymous: boolean) => void
}

export function SettingsPrivacy({ anonymous, onChange }: SettingsPrivacyProps) {
  const { t } = useTranslation()
  async function toggle(value: boolean) {
    onChange(value)
    try {
      await callLua('setAnonymous', { value })
      notify(value ? t('Anonymous mode on') : t('Anonymous mode off'), 'success')
    } catch {
      notify(t('Failed to update privacy'), 'error')
    }
  }

  return (
    <div className="card">
      <p className="section-label">{t("Privacy")}</p>
      <div className="toggle-row">
        <div className="flex flex-col">
          <span className="text-sm">{t("Anonymous mode")}</span>
          <span className="text-xs text-fg-muted">
            {t("Hide your identity in moderation actions and webhooks.")}
          </span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => toggle(e.target.checked)}
            aria-label={t("Anonymous mode")}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  )
}
