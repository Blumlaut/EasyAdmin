import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'

interface SettingsPrivacyProps {
  anonymous: boolean
  onChange: (anonymous: boolean) => void
}

export function SettingsPrivacy({ anonymous, onChange }: SettingsPrivacyProps) {
  async function toggle(value: boolean) {
    onChange(value)
    try {
      await callLua('setAnonymous', { value })
      notify(value ? 'Anonymous mode on' : 'Anonymous mode off', 'success')
    } catch {
      notify('Failed to update privacy', 'error')
    }
  }

  return (
    <div className="card">
      <p className="section-label">Privacy</p>
      <div className="toggle-row">
        <div className="flex flex-col">
          <span className="text-sm">Anonymous mode</span>
          <span className="text-xs text-fg-muted">
            Hide your identity in moderation actions and webhooks.
          </span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => toggle(e.target.checked)}
            aria-label="Anonymous mode"
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  )
}
