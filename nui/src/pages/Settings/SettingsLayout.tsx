import { useRef } from 'react'
import { setResourceKvp } from '../../fivem'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'
import type { SidebarDirection, SidebarMode } from '../../types'
import { LayoutWireframe } from './LayoutWireframe'

interface SettingsLayoutProps {
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  foldOpacity: number
  onChange: (patch: { sidebarMode?: SidebarMode; sidebarDirection?: SidebarDirection; foldOpacity?: number }) => void
}

type LayoutVariant = 'left-sidebar' | 'right-sidebar' | 'top-taskbar' | 'bottom-taskbar'

const OPTIONS: {
  variant: LayoutVariant
  mode: SidebarMode
  direction: SidebarDirection
  labelKey: string
  descriptionKey: string
}[] = [
  {
    variant: 'left-sidebar',
    mode: 'vertical',
    direction: 'right',
    labelKey: 'Left sidebar',
    descriptionKey: 'Sidebar on the left, content opens to the right',
  },
  {
    variant: 'right-sidebar',
    mode: 'vertical',
    direction: 'left',
    labelKey: 'Right sidebar',
    descriptionKey: 'Sidebar on the right, content opens to the left',
  },
  {
    variant: 'top-taskbar',
    mode: 'horizontal',
    direction: 'down',
    labelKey: 'Top taskbar',
    descriptionKey: 'Taskbar on top, content opens downward',
  },
  {
    variant: 'bottom-taskbar',
    mode: 'horizontal',
    direction: 'up',
    labelKey: 'Bottom taskbar',
    descriptionKey: 'Taskbar on the bottom, content opens upward',
  },
]

function matchOption(
  opt: (typeof OPTIONS)[number],
  mode: SidebarMode,
  direction: SidebarDirection,
) {
  return opt.mode === mode && opt.direction === direction
}

const FOLD_OPACITY_MIN = 10
const FOLD_OPACITY_MAX = 100
const FOLD_OPACITY_STEP = 5

export function SettingsLayout({
  sidebarMode,
  sidebarDirection,
  foldOpacity,
  onChange,
}: SettingsLayoutProps) {
  const { t } = useTranslation()
  const dragStartFoldOpacity = useRef(foldOpacity)

  function setLayout(mode: SidebarMode, direction: SidebarDirection) {
    onChange({ sidebarMode: mode, sidebarDirection: direction })
    setResourceKvp('ssidebarMode', mode)
    setResourceKvp('ssidebarDirection', direction)
    notify(t("Sidebar layout set to {mode} ({direction})", { mode, direction }), 'success')
  }

  function setFoldOpacity(value: number) {
    onChange({ foldOpacity: value })
    setResourceKvp('ifoldOpacity', String(value))
    notify(t("Fold opacity set to {value}%", { value: String(value) }), 'success')
  }

  return (
    <div className="card">
      <p className="section-label">{t("Layout")}</p>

      <div className="mb-3 flex flex-col gap-1">
        <span className="text-sm">{t("Sidebar mode")}</span>
        <span className="text-xs text-fg-muted">
          {t("Choose where the navigation panel sits and how the content area opens.")}
        </span>
      </div>

      <fieldset className="layout-grid">
        <legend className="sr-only">{t("Sidebar layout options")}</legend>

        {OPTIONS.map((opt) => {
          const checked = matchOption(opt, sidebarMode, sidebarDirection)
          return (
            <label
              key={opt.variant}
              className={`layout-grid-option selectable-card${checked ? ' selectable-card--checked' : ''}`}
            >
              <input
                className="radio-group-input"
                type="radio"
                name="sidebar-layout"
                checked={checked}
                onChange={() => setLayout(opt.mode, opt.direction)}
              />
              <div className="layout-wireframe-wrap">
                <LayoutWireframe variant={opt.variant} checked={checked} />
              </div>
              <div className="layout-grid-content">
                <span className="layout-grid-label">{t(opt.labelKey)}</span>
                <span className="layout-grid-description">{t(opt.descriptionKey)}</span>
              </div>
            </label>
          )
        })}
      </fieldset>

      {/* Fold Opacity */}
      <div className="mt-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-subtle">{t("Fold opacity")}</span>
          <span className="text-sm font-medium">{foldOpacity}%</span>
        </div>
        <span className="text-xs text-fg-muted">
          {t("How transparent the window appears when folded in.")}
        </span>
        <input
          type="range"
          className="slider"
          min={FOLD_OPACITY_MIN}
          max={FOLD_OPACITY_MAX}
          step={FOLD_OPACITY_STEP}
          value={foldOpacity}
          onPointerDown={() => { dragStartFoldOpacity.current = foldOpacity }}
          onChange={(e) => onChange({ foldOpacity: Number(e.target.value) })}
          onPointerUp={(e) => {
            const value = Number((e.target as HTMLInputElement).value)
            if (value !== dragStartFoldOpacity.current) {
              setFoldOpacity(value)
            }
          }}
          aria-label={t("Fold opacity, currently {value}%", { value: String(foldOpacity) })}
        />
        <div className="flex justify-between text-xs text-fg-muted">
          <span>{FOLD_OPACITY_MIN}%</span>
          <span>{FOLD_OPACITY_MAX}%</span>
        </div>
      </div>
    </div>
  )
}
