import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { InputPrompt } from '../../components/InputPrompt'
import { Icon } from '../../components/icons'

interface ServerAnnouncementsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerAnnouncements({ onToast }: ServerAnnouncementsProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function send(message: string) {
    setBusy(true)
    try {
      await callLua('announce', { message })
      onToast('Announcement sent', 'success')
      setOpen(false)
    } catch {
      onToast('Failed to send announcement', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Announcements</h3>
      <p className="text-sm text-muted mb-3">
        Send a message to all players on the server.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        <Icon name="message-square" size="xs" />
        Send announcement
      </button>
      {open && (
        <InputPrompt
          title="Server Announcement"
          label="Message to broadcast"
          placeholder="Server restart in 5 minutes"
          maxLength={200}
          onCancel={() => setOpen(false)}
          onConfirm={send}
        />
      )}
    </div>
  )
}
