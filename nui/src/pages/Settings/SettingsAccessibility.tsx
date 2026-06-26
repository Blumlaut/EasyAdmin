import { useRef } from 'react'
import { setResourceKvp } from '../../fivem'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'
import type { UiDensity } from '../../types'

interface SettingsAccessibilityProps {
  highContrast: boolean
  fontSize: number
  uiDensity: UiDensity
  onChange: (patch: { highContrast?: boolean; fontSize?: number; uiDensity?: UiDensity }) => void
}

const FONT_SIZE_MIN = 10
const FONT_SIZE_MAX = 20
const FONT_SIZE_STEP = 1

const DENSITY_OPTIONS: { value: UiDensity; labelKey: string }[] = [
  { value: 'cramped', labelKey: 'Cramped' },
  { value: 'cozy', labelKey: 'Cozy' },
  { value: 'default', labelKey: 'Default' },
  { value: 'spacious', labelKey: 'Spacious' },
  { value: 'airy', labelKey: 'Airy' },
]

export function SettingsAccessibility({
  highContrast,
  fontSize,
  uiDensity,
  onChange,
}: SettingsAccessibilityProps) {
  const { t } = useTranslation()
  const dragStartFontSize = useRef(fontSize)

  function toggleHighContrast(value: boolean) {
    onChange({ highContrast: value })
    setResourceKvp('shighContrast', value ? 'true' : 'false')
    notify(value ? t('High contrast enabled') : t('High contrast disabled'), 'success')
  }

  function setFontSize(value: number) {
    onChange({ fontSize: value })
    setResourceKvp('ifontSize', String(value))
    notify(t("Font size set to {value}px", { value: String(value) }), 'success')
  }

  function setUiDensity(value: UiDensity) {
    onChange({ uiDensity: value })
    setResourceKvp('suiDensity', value)
    notify(t("UI density set to {value}", { value: t(value) }), 'success')
  }

  return (
    <div className="card">
      <p className="section-label">{t("Accessibility")}</p>

      {/* High Contrast */}
      <div className="toggle-row">
        <div className="flex flex-col">
          <span className="text-sm">{t("High contrast")}</span>
          <span className="text-xs text-fg-muted">
            {t("Boost color contrast for better readability.")}
          </span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => toggleHighContrast(e.target.checked)}
            aria-label={t("Enable high contrast mode")}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Font Size */}
      <div className="mt-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-subtle">{t("Font size")}</span>
          <span className="text-sm font-medium">{fontSize}px</span>
        </div>
        <span className="text-xs text-fg-muted">
          {t("Adjust the base text size across the entire menu.")}
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
          aria-label={t("Font size, currently {value}px", { value: String(fontSize) })}
        />
        <div className="flex justify-between text-xs text-fg-muted">
          <span>{FONT_SIZE_MIN}px</span>
          <span>{FONT_SIZE_MAX}px</span>
        </div>
      </div>

      {/* UI Density */}
      <div className="mt-5 flex flex-col gap-1">
        <span className="text-sm">{t("UI density")}</span>
        <span className="text-xs text-fg-muted">
          {t("Control how much space elements have between each other.")}
        </span>
        <div className="density-options" role="radiogroup" aria-label={t("UI density")}>
          {DENSITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`density-option${uiDensity === opt.value ? ' density-option--active' : ''}`}
            >
              <input
                type="radio"
                name="ui-density"
                value={opt.value}
                checked={uiDensity === opt.value}
                onChange={() => setUiDensity(opt.value)}
                className="sr-only"
              />
              <span className="density-option-label">{t(opt.labelKey)}</span>
              <span className="density-option-indicator" />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
