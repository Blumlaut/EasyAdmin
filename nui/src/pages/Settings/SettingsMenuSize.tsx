import { setResourceKvp } from '../../fivem'
import { RadioGroup } from '../../components/RadioGroup'
import type { AppSettings, Notification } from '../../types'

interface SettingsMenuSizeProps {
  menuSize: AppSettings['menuSize']
  onChange: (patch: { menuSize?: AppSettings['menuSize'] }) => void
  onToast: (text: string, type?: Notification['type']) => void
}

const SIZES = [
  { value: 'small' as const, label: 'Small', description: 'Compact window, less screen coverage.' },
  { value: 'default' as const, label: 'Default', description: 'Centered window, responsive to screen size.' },
  { value: 'large' as const, label: 'Large', description: 'Expanded window for more screen real estate.' },
  { value: 'fullscreen' as const, label: 'Fullscreen', description: 'Fill the entire screen.' },
]

export function SettingsMenuSize({ menuSize, onChange, onToast }: SettingsMenuSizeProps) {
  function setSize(value: AppSettings['menuSize']) {
    onChange({ menuSize: value })
    setResourceKvp('smenuSize', value)
    onToast(`Menu size set to ${value}`, 'success')
  }

  return (
    <div className="card">
      <p className="section-label">Menu Size</p>
      <p className="text-sm text-secondary mb-3">
        Control how large the admin panel window appears on screen.
      </p>
      <RadioGroup
        name="menuSize"
        options={SIZES}
        value={menuSize}
        onChange={setSize}
      />
    </div>
  )
}
