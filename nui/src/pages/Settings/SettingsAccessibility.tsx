import { setResourceKvp } from '../../fivem'
import type { Notification } from '../../types'

interface SettingsAccessibilityProps {
  highContrast: boolean
  fontSize: number
  onChange: (patch: { highContrast?: boolean; fontSize?: number }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const FONT_SIZES = [80, 90, 100, 110, 120, 130, 140, 150]

export function SettingsAccessibility({
  highContrast,
  fontSize,
  onChange,
  onToast,
}: SettingsAccessibilityProps) {
  function toggleHighContrast(value: boolean) {
    onChange({ highContrast: value })
    setResourceKvp('ea_highContrast', value ? 'true' : 'false')
    onToast(value ? 'High contrast enabled' : 'High contrast disabled', 'success')
  }

  function setFontSize(value: number) {
    onChange({ fontSize: value })
    setResourceKvp('ea_fontSize', String(value))
    onToast(`Font size set to ${value}%`, 'success')
  }

  return (
    <div className="card">
      <p className="section-label">Accessibility</p>

      {/* High Contrast */}
      <div className="toggle-row">
        <div className="flex flex-col">
          <span className="text-sm">High contrast</span>
          <span className="text-xs text-muted">
            Boost color contrast for better readability.
          </span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => toggleHighContrast(e.target.checked)}
            aria-label="Enable high contrast mode"
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Font Size */}
      <div className="flex flex-col gap-1 mt-3">
        <span className="text-sm text-secondary">
          Font size ({fontSize}%)
        </span>
        <span className="text-xs text-muted mb-1">
          Adjust the base text size across the entire menu.
        </span>
        <div className="flex flex-wrap gap-1">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`btn btn-sm ${fontSize === size ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFontSize(size)}
              aria-label={`Set font size to ${size}%`}
              aria-pressed={fontSize === size}
            >
              {size}%
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
