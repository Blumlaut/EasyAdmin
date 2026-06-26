import { useState } from 'react'
import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { Icon } from '../../components/icons'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

const MAX_LENGTH = 200

interface ServerAnnouncementsProps {
  permissions: Permissions
}

export function ServerAnnouncements({ permissions }: ServerAnnouncementsProps) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const canAnnounce = !!permissions['server.announce']
  if (!canAnnounce) return null

  const charCount = message.length
  const charPercent = (charCount / MAX_LENGTH) * 100
  const charCountClass = charPercent > 90
    ? 'announcement-char-count--danger'
    : charPercent > 75
      ? 'announcement-char-count--warning'
      : ''

  async function handleSend() {
    const trimmed = message.trim()
    if (!trimmed) return
    setSending(true)
    try {
      await callLua('announce', { message: trimmed })
      setMessage('')
      notify(t('Announcement sent'), 'success')
    } catch {
      notify(t('Failed to send announcement'), 'error')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card">
      <p className="section-label">{t("Announcements")}</p>
      <p className="mb-3 text-sm text-fg-subtle">
        {t("Send a message to all players on the server.")}
      </p>
      <textarea
        className={`announcement-textarea ${charCountClass ? `announcement-textarea--${charCountClass.includes('danger') ? 'danger' : 'warning'}` : ''}`}
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder={t("Server restart in 5 minutes")}
        maxLength={MAX_LENGTH}
        aria-label={t("Announcement message")}
        rows={3}
      />
      <div className="announcement-footer">
        <span className={`text-xs text-fg-muted ${charCountClass}`}>
          {charCount} / {MAX_LENGTH}
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSend}
          disabled={sending || !message.trim()}
        >
          <Icon name="message-square" size="xs" />
          {t("Send")}
        </button>
      </div>
    </div>
  )
}
