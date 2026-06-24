import type { AppSettings, Permissions } from '../../types'
import { SettingsData } from './SettingsData'
import { SettingsLinks } from './SettingsLinks'
import { SettingsPrivacy } from './SettingsPrivacy'
import { SettingsAccessibility } from './SettingsAccessibility'
import { SettingsLayout } from './SettingsLayout'

interface SettingsPageProps {
  permissions: Permissions
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}

export function SettingsPage({
  permissions,
  settings,
  onChange,
}: SettingsPageProps) {
  function patchAccessibility(patch: Partial<Pick<AppSettings, 'highContrast' | 'fontSize' | 'uiDensity'>>) {
    onChange(patch)
  }

  function patchLayout(patch: Partial<Pick<AppSettings, 'sidebarMode' | 'sidebarDirection' | 'foldOpacity'>>) {
    onChange(patch)
  }

  function patchPrivacy(anonymous: boolean) {
    onChange({ anonymous })
  }

  return (
    <div className="page-container">
      <SettingsLinks />
      <SettingsData />
      {permissions['anon'] && (
        <SettingsPrivacy
          anonymous={settings.anonymous}
          onChange={patchPrivacy}
        />
      )}
      <SettingsAccessibility
        highContrast={settings.highContrast}
        fontSize={settings.fontSize}
        uiDensity={settings.uiDensity}
        onChange={patchAccessibility}
      />
      <SettingsLayout
        sidebarMode={settings.sidebarMode}
        sidebarDirection={settings.sidebarDirection}
        foldOpacity={settings.foldOpacity}
        onChange={patchLayout}
      />
    </div>
  )
}
