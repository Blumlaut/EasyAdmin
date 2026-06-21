import { useRef } from 'react'
import { setResourceKvp } from '../../fivem'
import { notify } from '../../lib/notify'

interface SettingsAccessibilityProps {
  highContrast: boolean
  fontSize: number
  onChange: (patch: { highContrast?: boolean; fontSize?: number }) => void
}

const FONT_SIZE_MIN = 10
const FONT_SIZE_MAX = 20
const FONT_SIZE_STEP = 1

export function SettingsAccessibility({
  highContrast,
  fontSize,
  onChange,
}: SettingsAccessibilityProps) {
  const dragStartFontSize = useRef(fontSize)

  function toggleHighContrast(value: boolean) {
    onChange({ highContrast: value })
    setResourceKvp('shighContrast', value ? 'true' : 'false')
    notify(value ? 'High contrast enabled' : 'High contrast disabled', 'success')
  }

  function setFontSize(value: number) {
    onChange({ fontSize: value })
    setResourceKvp('ifontSize', String(value))
    notify(`Font size set to ${value}px`, 'success')
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
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary">Font size</span>
          <span className="text-sm font-medium">{fontSize}px</span>
        </div>
        <span className="text-xs text-muted">
          Adjust the base text size across the entire menu.
        </span>
        <input
          type="range"
          className="slider"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          step={FONT_SIZE_STEP}
          value={fontSize}
          onPointerDown={() => { dragStartFontSize.current = fontSize }}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          onPointerUp={(e) => {
            const value = Number((e.target as HTMLInputElement).value)
            if (value !== dragStartFontSize.current) {
              setFontSize(value)
            }
          }}
          aria-label={`Font size, currently ${fontSize}px`}
        />
        <div className="flex justify-between text-xs text-muted">
          <span>{FONT_SIZE_MIN}px</span>
          <span>{FONT_SIZE_MAX}px</span>
        </div>
      </div>
    </div>
  )
}
