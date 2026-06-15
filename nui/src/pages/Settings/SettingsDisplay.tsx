import type { Notification } from '../../types'
import { callLua } from '../../fivem'

interface SettingsDisplayProps {
  showLicenses: boolean
  orientation: 'left' | 'middle' | 'right'
  menuWidth: number
  onChange: (patch: { showLicenses?: boolean; orientation?: 'left' | 'middle' | 'right' }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsDisplay({
  showLicenses,
  orientation,
  menuWidth,
  onChange,
  onToast,
}: SettingsDisplayProps) {
  async function setOrientation(value: 'left' | 'middle' | 'right') {
    onChange({ orientation: value })
    try {
      await callLua('setResourceKvp', { key: 'ea_menuorientation', value })
      onToast('Orientation saved', 'success')
    } catch {
      onToast('Failed to save orientation', 'error')
    }
  }

  async function setShowLicenses(value: boolean) {
    onChange({ showLicenses: value })
    try {
      await callLua('setShowLicenses', { value })
      onToast('Ban list display updated', 'success')
    } catch {
      onToast('Failed to update display', 'error')
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Display</h3>

      <div className="flex flex-col gap-2">
        <div className="toggle-row">
          <span className="text-sm">Show licenses in ban list</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showLicenses}
              onChange={(e) => setShowLicenses(e.target.checked)}
              aria-label="Show licenses in ban list"
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <label className="flex flex-col gap-1 mt-2">
          <span className="text-sm text-secondary">Menu orientation</span>
          <select
            className="input"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'left' | 'middle' | 'right')}
          >
            <option value="left">Left</option>
            <option value="middle">Middle</option>
            <option value="right">Right</option>
          </select>
        </label>

        <div className="text-sm text-muted mt-1">Current menu width: {menuWidth}</div>
      </div>
    </div>
  )
}
