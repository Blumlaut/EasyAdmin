import { callLua } from '../../fivem'
import type { Notification } from '../../types'

interface SettingsAccessibilityProps {
  tts: boolean
  ttsSpeed: number
  onChange: (patch: { tts?: boolean; ttsSpeed?: number }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const SPEEDS = Array.from({ length: 10 }, (_, i) => i + 1)

export function SettingsAccessibility({
  tts,
  ttsSpeed,
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

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Accessibility</h3>
      <div className="toggle-row">
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
