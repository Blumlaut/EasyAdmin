import { callLua } from '../../fivem'
import type { Notification } from '../../types'

interface SettingsPrivacyProps {
  anonymous: boolean
  onChange: (anonymous: boolean) => void
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsPrivacy({ anonymous, onChange, onToast }: SettingsPrivacyProps) {
  async function toggle(value: boolean) {
    onChange(value)
    try {
      await callLua('setAnonymous', { value })
      onToast(value ? 'Anonymous mode on' : 'Anonymous mode off', 'success')
    } catch {
      onToast('Failed to update privacy', 'error')
    }
  }

  return (
    <div className="card">
      <p className="section-label">Privacy</p>
      <div className="toggle-row">
        <div className="flex flex-col">
          <span className="text-sm">Anonymous mode</span>
          <span className="text-xs text-muted">
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
