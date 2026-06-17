import { setResourceKvp } from '../../fivem'
import type { Notification, SidebarDirection, SidebarMode } from '../../types'

interface SettingsLayoutProps {
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  onChange: (patch: { sidebarMode?: SidebarMode; sidebarDirection?: SidebarDirection }) => void
  onToast: (text: string, type?: Notification['type']) => void
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
          Vertical opens left or right. Horizontal uses a taskbar-style bar and opens up or down.
        </span>
      </div>

      <fieldset className="radio-group">
        <legend className="sr-only">Sidebar layout options</legend>
        <div className="radio-group-options">
          <label className={`radio-group-option${sidebarMode === 'vertical' && sidebarDirection === 'right' ? ' radio-group-option--checked' : ''}`}>
            <input
              className="radio-group-input"
              type="radio"
              name="sidebar-layout"
              checked={sidebarMode === 'vertical' && sidebarDirection === 'right'}
              onChange={() => setLayout('vertical', 'right')}
            />
            <span className="radio-group-radio" />
            <span className="radio-group-content">
              <span className="radio-group-label">Vertical — opens right</span>
              <span className="radio-group-description">Current layout. Sidebar stays on the left, content opens to the right.</span>
            </span>
          </label>

          <label className={`radio-group-option${sidebarMode === 'vertical' && sidebarDirection === 'left' ? ' radio-group-option--checked' : ''}`}>
            <input
              className="radio-group-input"
              type="radio"
              name="sidebar-layout"
              checked={sidebarMode === 'vertical' && sidebarDirection === 'left'}
              onChange={() => setLayout('vertical', 'left')}
            />
            <span className="radio-group-radio" />
            <span className="radio-group-content">
              <span className="radio-group-label">Vertical — opens left</span>
              <span className="radio-group-description">Sidebar moves to the right edge of the window, content opens to the left.</span>
            </span>
          </label>

          <label className={`radio-group-option${sidebarMode === 'horizontal' && sidebarDirection === 'down' ? ' radio-group-option--checked' : ''}`}>
            <input
              className="radio-group-input"
              type="radio"
              name="sidebar-layout"
              checked={sidebarMode === 'horizontal' && sidebarDirection === 'down'}
              onChange={() => setLayout('horizontal', 'down')}
            />
            <span className="radio-group-radio" />
            <span className="radio-group-content">
              <span className="radio-group-label">Horizontal — opens down</span>
              <span className="radio-group-description">Taskbar-style bar on top, content opens downward.</span>
            </span>
          </label>

          <label className={`radio-group-option${sidebarMode === 'horizontal' && sidebarDirection === 'up' ? ' radio-group-option--checked' : ''}`}>
            <input
              className="radio-group-input"
              type="radio"
              name="sidebar-layout"
              checked={sidebarMode === 'horizontal' && sidebarDirection === 'up'}
              onChange={() => setLayout('horizontal', 'up')}
            />
            <span className="radio-group-radio" />
            <span className="radio-group-content">
              <span className="radio-group-label">Horizontal — opens up</span>
              <span className="radio-group-description">Taskbar-style bar on the bottom, content opens upward.</span>
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  )
}
