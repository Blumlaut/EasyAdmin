import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { InputPrompt } from '../../components/InputPrompt'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Icon } from '../../components/icons'

interface ServerResourcesProps {
  onToast: (text: string, type?: Notification['type']) => void
}

type Mode = 'start' | 'stop' | null

export function ServerResources({ onToast }: ServerResourcesProps) {
  const [mode, setMode] = useState<Mode>(null)
  const [confirmStop, setConfirmStop] = useState<null | string>(null)
  const [busy, setBusy] = useState(false)

  async function start(name: string) {
    setBusy(true)
    try {
      await callLua('startResource', { name })
      onToast(`Started ${name}`, 'success')
      setMode(null)
    } catch {
      onToast('Failed to start resource', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function stop(name: string) {
    setBusy(true)
    try {
      await callLua('stopResource', { name })
      onToast(`Stopped ${name}`, 'success')
      setMode(null)
      setConfirmStop(null)
    } catch {
      onToast('Failed to stop resource', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Resources</h3>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-primary"
          onClick={() => setMode('start')}
          disabled={busy}
        >
          <Icon name="plus" size="xs" />
          Start resource
        </button>
        <button
          className="btn btn-warning"
          onClick={() => setMode('stop')}
          disabled={busy}
        >
          <Icon name="x" size="xs" />
          Stop resource
        </button>
      </div>

      {mode === 'start' && (
        <InputPrompt
          title="Start resource"
          label="Resource name"
          placeholder="myresource"
          onCancel={() => setMode(null)}
          onConfirm={start}
        />
      )}

      {mode === 'stop' && (
        <InputPrompt
          title="Stop resource"
          label="Resource name"
          placeholder="myresource"
          onCancel={() => setMode(null)}
          onConfirm={(name) => setConfirmStop(name)}
        />
      )}

      {confirmStop && (
        <ConfirmDialog
          title="Stop resource"
          message={`Are you sure you want to stop "${confirmStop}"?`}
          variant="danger"
          confirmLabel="Stop"
          onConfirm={() => stop(confirmStop)}
          onCancel={() => setConfirmStop(null)}
        />
      )}
    </div>
  )
}
