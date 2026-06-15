import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'

interface SettingsAppearanceProps {
  easterEggs: string[]
  currentEgg: string | null
  onToast: (text: string, type?: Notification['type']) => void
}

export function SettingsAppearance({
  easterEggs,
  currentEgg,
  onToast,
}: SettingsAppearanceProps) {
  const [selected, setSelected] = useState<string | null>(currentEgg)

  async function apply(value: string | null) {
    setSelected(value)
    try {
      await callLua('setEasterEgg', { value })
      onToast(value ? `Easter egg set: ${value}` : 'Easter egg cleared', 'success')
    } catch {
      onToast('Failed to set easter egg', 'error')
    }
  }

  if (easterEggs.length === 0) return null

  return (
    <div className="card">
      <p className="section-label">Appearance</p>
      <p className="text-sm text-secondary mb-3">
        Force a fun alternative branding for the menu.
      </p>
      <select
        className="input"
        value={selected ?? 'none'}
        onChange={(e) => apply(e.target.value === 'none' ? null : e.target.value)}
        aria-label="Easter egg"
      >
        <option value="none">None</option>
        {easterEggs.map((egg) => (
          <option key={egg} value={egg}>
            {egg}
          </option>
        ))}
      </select>
    </div>
  )
}
