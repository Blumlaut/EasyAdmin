import { useRef } from 'react'
import { setResourceKvp } from '../../fivem'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'
import type { FoldedStyle, SidebarDirection, SidebarMode } from '../../types'
import { WireframeOption } from './WireframeOption'
import type { WireframeVariant } from './Wireframe'

interface SettingsLayoutProps {
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  foldOpacity: number
  foldedStyle: FoldedStyle
  onChange: (patch: {
    sidebarMode?: SidebarMode
    sidebarDirection?: SidebarDirection
    foldOpacity?: number
    foldedStyle?: FoldedStyle
  }) => void
}

const FOLDED_OPTIONS: { style: FoldedStyle; labelKey: string; descriptionKey: string }[] = [
  {
    style: 'rail',
    labelKey: 'Icon rail',
    descriptionKey: 'A strip of icons with a dot for anything that needs you',
  },
  {
    style: 'chip',
    labelKey: 'Floating icon',
    descriptionKey: 'One small icon with a count of unclaimed reports',
  },
]

const OPTIONS: {
  variant: WireframeVariant
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
  foldedStyle,
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

  function setFoldedStyle(opt: (typeof FOLDED_OPTIONS)[number]) {
    onChange({ foldedStyle: opt.style })
    setResourceKvp('sfoldedStyle', opt.style)
    notify(t('Folded appearance set to {style}', { style: t(opt.labelKey) }), 'success')
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

        {OPTIONS.map((opt) => (
          <WireframeOption
            key={opt.variant}
            name="sidebar-layout"
            variant={opt.variant}
            checked={matchOption(opt, sidebarMode, sidebarDirection)}
            onSelect={() => setLayout(opt.mode, opt.direction)}
            label={t(opt.labelKey)}
            description={t(opt.descriptionKey)}
          />
        ))}
      </fieldset>

      {/* Folded appearance */}
      <div className="mt-5 flex flex-col gap-1">
        <span className="text-sm">{t("Folded appearance")}</span>
        <span className="text-xs text-fg-muted">
          {t("What stays on screen while the game has focus. Press ALT to bring the menu back.")}
        </span>
      </div>

      <fieldset className="layout-grid mt-2">
        <legend className="sr-only">{t("Folded appearance options")}</legend>

        {FOLDED_OPTIONS.map((opt) => (
          <WireframeOption
            key={opt.style}
            name="folded-style"
            variant={opt.style}
            checked={foldedStyle === opt.style}
            onSelect={() => setFoldedStyle(opt)}
            label={t(opt.labelKey)}
            description={t(opt.descriptionKey)}
          />
        ))}
      </fieldset>

      {/* Fold Opacity */}
      <div className="mt-5 flex flex-col gap-1">
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
