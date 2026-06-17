import type { AppSettings, Notification, Permissions } from '../../types'
import { SettingsData } from './SettingsData'
import { SettingsPrivacy } from './SettingsPrivacy'
import { SettingsAccessibility } from './SettingsAccessibility'

interface SettingsPageProps {
  permissions: Permissions
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsPage({
  permissions,
  settings,
  onChange,
  onToast,
}: SettingsPageProps) {
  function patchAccessibility(patch: Partial<Pick<AppSettings, 'highContrast' | 'fontSize'>>) {
    onChange(patch)
  }

  function patchPrivacy(anonymous: boolean) {
    onChange({ anonymous })
  }

  return (
    <div className="page-container">
      <SettingsData onToast={onToast} />
      {permissions['anon'] && (
        <SettingsPrivacy
          anonymous={settings.anonymous}
          onChange={patchPrivacy}
          onToast={onToast}
        />
      )}
      <SettingsAccessibility
        highContrast={settings.highContrast}
        fontSize={settings.fontSize}
        onChange={patchAccessibility}
        onToast={onToast}
      />
    </div>
  )
}
