import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { TwoFieldPrompt } from '../../components/TwoFieldPrompt'
import { Icon } from '../../components/icons'

interface ServerConvarsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerConvars({ onToast }: ServerConvarsProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function commit(name: string, value: string) {
    setBusy(true)
    try {
      await callLua('setConvar', { name, value })
      onToast(`Set ${name} = ${value}`, 'success')
      setOpen(false)
    } catch {
      onToast('Failed to set convar', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">ConVars</h3>
      <p className="text-sm text-muted mb-3">
        Set a convar by name and value.
      </p>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        <Icon name="settings" size="xs" />
        Set convar
      </button>
      {open && (
        <TwoFieldPrompt
          title="Set ConVar"
          firstLabel="Convar name"
          firstPlaceholder="ea_useNUI"
          secondLabel="Convar value"
          secondPlaceholder="true"
          onCancel={() => setOpen(false)}
          onConfirm={commit}
        />
      )}
    </div>
  )
}
