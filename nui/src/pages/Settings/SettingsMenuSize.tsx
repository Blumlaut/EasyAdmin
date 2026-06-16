import { setResourceKvp } from '../../fivem'
import type { AppSettings, Notification } from '../../types'

interface SettingsMenuSizeProps {
  menuSize: AppSettings['menuSize']
  onChange: (patch: { menuSize?: AppSettings['menuSize'] }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const SIZES: { value: AppSettings['menuSize']; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Centered window, responsive to screen size.' },
  { value: 'large', label: 'Large', description: 'Expanded window for more screen real estate.' },
  { value: 'fullscreen', label: 'Fullscreen', description: 'Fill the entire screen.' },
]

export function SettingsMenuSize({ menuSize, onChange, onToast }: SettingsMenuSizeProps) {
  function setSize(value: AppSettings['menuSize']) {
    onChange({ menuSize: value })
    setResourceKvp('ea_menuSize', value)
    onToast(`Menu size set to ${value}`, 'success')
  }

  return (
    <div className="card">
      <p className="section-label">Menu Size</p>
      <p className="text-sm text-secondary mb-3">
        Control how large the admin panel window appears on screen.
      </p>
      <div className="flex flex-col gap-2">
        {SIZES.map((size) => (
          <label
            key={size.value}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              menuSize === size.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-transparent bg-transparent hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name="menuSize"
              value={size.value}
              checked={menuSize === size.value}
              onChange={() => setSize(size.value)}
              className="mt-1"
              aria-label={size.label}
            />
            <div className="flex-1">
              <span className="text-sm font-medium">{size.label}</span>
              <span className="block text-xs text-muted mt-0.5">
                {size.description}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
