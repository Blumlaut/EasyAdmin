import { setResourceKvp } from '../../fivem'
import type { Notification, SidebarDirection, SidebarMode } from '../../types'
import { LayoutWireframe } from './LayoutWireframe'

interface SettingsLayoutProps {
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  onChange: (patch: { sidebarMode?: SidebarMode; sidebarDirection?: SidebarDirection }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

type LayoutVariant = 'left-sidebar' | 'right-sidebar' | 'top-taskbar' | 'bottom-taskbar'

const OPTIONS: {
  variant: LayoutVariant
  mode: SidebarMode
  direction: SidebarDirection
  label: string
  description: string
}[] = [
  {
    variant: 'left-sidebar',
    mode: 'vertical',
    direction: 'right',
    label: 'Left sidebar',
    description: 'Sidebar on the left, content opens to the right',
  },
  {
    variant: 'right-sidebar',
    mode: 'vertical',
    direction: 'left',
    label: 'Right sidebar',
    description: 'Sidebar on the right, content opens to the left',
  },
  {
    variant: 'top-taskbar',
    mode: 'horizontal',
    direction: 'down',
    label: 'Top taskbar',
    description: 'Taskbar on top, content opens downward',
  },
  {
    variant: 'bottom-taskbar',
    mode: 'horizontal',
    direction: 'up',
    label: 'Bottom taskbar',
    description: 'Taskbar on the bottom, content opens upward',
  },
]

function matchOption(
  opt: (typeof OPTIONS)[number],
  mode: SidebarMode,
  direction: SidebarDirection,
) {
  return opt.mode === mode && opt.direction === direction
}

export function SettingsLayout({
  sidebarMode,
  sidebarDirection,
  onChange,
  onToast,
}: SettingsLayoutProps) {
  function setLayout(mode: SidebarMode, direction: SidebarDirection) {
    onChange({ sidebarMode: mode, sidebarDirection: direction })
    setResourceKvp('ssidebarMode', mode)
    setResourceKvp('ssidebarDirection', direction)
    onToast(`Sidebar layout set to ${mode} (${direction})`, 'success')
  }

  return (
    <div className="card">
      <p className="section-label">Layout</p>

      <div className="flex flex-col gap-1 mb-3">
        <span className="text-sm">Sidebar mode</span>
        <span className="text-xs text-muted">
          Choose where the navigation panel sits and how the content area opens.
        </span>
      </div>

      <fieldset className="layout-grid">
        <legend className="sr-only">Sidebar layout options</legend>

        {OPTIONS.map((opt) => {
          const checked = matchOption(opt, sidebarMode, sidebarDirection)
          return (
            <label
              key={opt.variant}
              className={`layout-grid-option${checked ? ' layout-grid-option--checked' : ''}`}
              onClick={() => setLayout(opt.mode, opt.direction)}
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
                <span className="layout-grid-label">{opt.label}</span>
                <span className="layout-grid-description">{opt.description}</span>
              </div>
            </label>
          )
        })}
      </fieldset>
    </div>
  )
}
