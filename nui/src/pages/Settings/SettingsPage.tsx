import { useState } from 'react'
import type { AppSettings, Notification, Permissions } from '../../types'
import { SettingsData } from './SettingsData'
import { SettingsDisplay } from './SettingsDisplay'
import { SettingsPrivacy } from './SettingsPrivacy'
import { SettingsAccessibility } from './SettingsAccessibility'
import { SettingsAppearance } from './SettingsAppearance'

interface SettingsPageProps {
  permissions: Permissions
  settings: AppSettings
  easterEggs: string[]
  currentEasterEgg: string | null
  isRedm: boolean
  onChange: (patch: Partial<AppSettings>) => void
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsPage({
  permissions,
  settings,
  easterEggs,
  currentEasterEgg,
  isRedm,
  onChange,
  onToast,
}: SettingsPageProps) {
  // Local mirror for orientation/showLicenses (so display component does not
  // re-render the entire settings tree on every change).
  const [local, setLocal] = useState({
    showLicenses: settings.showLicenses,
    orientation: settings.orientation,
  })

  function patchDisplay(patch: { showLicenses?: boolean; orientation?: 'left' | 'middle' | 'right' }) {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(patch as Partial<AppSettings>)
  }

  function patchAccessibility(patch: { tts?: boolean; ttsSpeed?: number }) {
    onChange(patch as Partial<AppSettings>)
  }

  function patchPrivacy(anonymous: boolean) {
    onChange({ anonymous })
  }

  return (
    <div className="page-container">
      <SettingsData onToast={onToast} />
      <SettingsDisplay
        showLicenses={local.showLicenses}
        orientation={local.orientation}
        menuWidth={settings.menuWidth}
        onChange={patchDisplay}
        onToast={onToast}
      />
      {permissions['anon'] && (
        <SettingsPrivacy
          anonymous={settings.anonymous}
          onChange={patchPrivacy}
          onToast={onToast}
        />
      )}
      <SettingsAccessibility
        tts={settings.tts}
        ttsSpeed={settings.ttsSpeed}
        onChange={patchAccessibility}
        onToast={onToast}
      />
      {!isRedm && (
        <SettingsAppearance
          easterEggs={easterEggs}
          currentEgg={currentEasterEgg}
          onToast={onToast}
        />
      )}
    </div>
  )
}
