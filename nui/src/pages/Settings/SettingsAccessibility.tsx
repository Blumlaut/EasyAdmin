import { callLua } from '../../fivem'
import { setResourceKvp } from '../../fivem'
import type { Notification } from '../../types'

interface SettingsAccessibilityProps {
  tts: boolean
  ttsSpeed: number
  highContrast: boolean
  fontSize: number
  onChange: (patch: { tts?: boolean; ttsSpeed?: number; highContrast?: boolean; fontSize?: number }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const SPEEDS = Array.from({ length: 10 }, (_, i) => i + 1)
const FONT_SIZES = [80, 90, 100, 110, 120, 130, 140, 150]

export function SettingsAccessibility({
  tts,
  ttsSpeed,
  highContrast,
  fontSize,
  onChange,
  onToast,
}: SettingsAccessibilityProps) {
  async function toggleTts(value: boolean) {
    onChange({ tts: value })
    try {
      await callLua('setTtsEnabled', { value })
      onToast(value ? 'TTS on' : 'TTS off', 'success')
    } catch {
      onToast('Failed to update TTS', 'error')
    }
  }

  async function setSpeed(value: number) {
    onChange({ ttsSpeed: value })
    try {
      await callLua('setTtsSpeed', { value })
      onToast(`TTS speed set to ${value}`, 'success')
    } catch {
      onToast('Failed to update TTS speed', 'error')
    }
  }

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
      <label className="flex flex-col gap-1 mt-3">
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
      </label>

      {/* TTS */}
      <div className="section-divider mt-4" />
      <div className="toggle-row mt-2">
        <div className="flex flex-col">
          <span className="text-sm">Text-to-speech</span>
          <span className="text-xs text-muted">
            Speaks menu items and notifications.
          </span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={tts}
            onChange={(e) => toggleTts(e.target.checked)}
            aria-label="Enable text-to-speech"
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <label className="flex flex-col gap-1 mt-3">
        <span className="text-sm text-secondary">TTS speed (1-10)</span>
        <select
          className="input"
          value={ttsSpeed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
