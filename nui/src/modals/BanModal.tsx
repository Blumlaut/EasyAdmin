import { useCallback, useMemo, useState } from 'react'
import type { IconName } from '../components/icons'
import { Icon } from '../components/icons'
import { useModalContext } from '../ModalContext'
import { useTranslation } from '../lib/i18n'
import { Alert } from '../components/Alert'
import { DialogWrapper } from '../components/DialogWrapper'
import { DatePicker } from '../components/DatePicker'
import { TimePicker } from '../components/TimePicker'

// ---- Types ----

interface BanModalProps {
  title: string
  onSubmit: (reason: string, duration: number) => Promise<void> | void
}

interface PresetOption {
  id: string
  label?: string
  labelKey?: string
  icon: IconName
  seconds: number
}

// ---- Presets ----

const PRESETS: PresetOption[] = [
  { id: '1h', label: '1h', icon: 'clock', seconds: 3600 },
  { id: '6h', label: '6h', icon: 'clock', seconds: 21600 },
  { id: '12h', label: '12h', icon: 'clock', seconds: 43200 },
  { id: '1d', label: '1d', icon: 'calendar', seconds: 86400 },
  { id: '3d', label: '3d', icon: 'calendar', seconds: 259200 },
  { id: '1w', label: '1w', icon: 'calendar', seconds: 604800 },
  { id: '1mo', label: '1mo', icon: 'calendar', seconds: 2592000 },
  { id: 'permanent', labelKey: 'Permanent', icon: 'ban', seconds: 10444633200 },
]

const PERMANENT_SECONDS = 10444633200

// ---- Helpers (all local-time, never UTC) ----

function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function getDefaultDate(): string {
  const d = new Date(Date.now() + 86400 * 1000) // default: 1 day from now
  return localDate(d)
}

function getDefaultTime(): string {
  return localTime(new Date())
}

function secondsToDate(seconds: number): string {
  return localDate(new Date(Date.now() + seconds * 1000))
}

function secondsToTime(seconds: number): string {
  return localTime(new Date(Date.now() + seconds * 1000))
}

function dateToTimestamp(date: string, time: string): number {
  const iso = `${date}T${time || '00:00'}`
  return Math.floor(new Date(iso).getTime() / 1000)
}

// ---- Component ----

function BanModalInner({ title, onSubmit }: BanModalProps) {
  const { closeModal } = useModalContext()
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [permanent, setPermanent] = useState(false)
  const [date, setDate] = useState(getDefaultDate())
  const [time, setTime] = useState(getDefaultTime())
  const [submitting, setSubmitting] = useState(false)

  const handlePreset = useCallback((preset: PresetOption) => {
    setSelectedPreset(preset.id)
    if (preset.id === 'permanent') {
      setPermanent(true)
    } else {
      setPermanent(false)
      setDate(secondsToDate(preset.seconds))
      setTime(secondsToTime(preset.seconds))
    }
  }, [])

  // When date/time changes, deselect preset (user is customizing)
  const handleDateChange = useCallback((value: string) => {
    setDate(value)
    setSelectedPreset('')
  }, [])

  const handleTimeChange = useCallback((value: string) => {
    setTime(value)
    setSelectedPreset('')
  }, [])

  const isValid = useMemo(() => {
    if (!reason.trim()) return false
    if (permanent) return true
    if (!date) return false
    return true
  }, [reason, permanent, date])

  const isDateInPast = useMemo(() => {
    if (permanent || !date) return false
    const unbanTimestamp = dateToTimestamp(date, time)
    // eslint-disable-next-line react-hooks/purity -- Date.now() is stable within a single render; recomputes only when deps change
    return unbanTimestamp <= Math.floor(Date.now() / 1000)
  }, [permanent, date, time])

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      const trimmed = reason.trim() || 'No reason'
      let duration: number
      if (permanent) {
        duration = PERMANENT_SECONDS
      } else {
        const unbanTimestamp = dateToTimestamp(date, time)
        const now = Math.floor(Date.now() / 1000)
        duration = Math.max(unbanTimestamp - now, 1)
      }
      await onSubmit(trimmed, duration)
    } finally {
      setSubmitting(false)
    }
    closeModal()
  }, [isValid, submitting, reason, permanent, date, time, onSubmit, closeModal])

  return (
    <DialogWrapper
      title={title}
      onCancel={closeModal}
      actions={
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
            disabled={submitting}
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleSubmit}
            disabled={!isValid || isDateInPast || submitting}
          >
            {submitting ? t("Working...") : t("Ban")}
          </button>
        </div>
      }
    >
      <div className="ban-modal">
        {/* Reason field */}
        <label className="ban-modal-field">
          <span className="text-sm text-fg-subtle">{t("Reason")}</span>
          <textarea
            className="input ban-modal-reason"
            placeholder={t("No reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            aria-label={t("Ban reason")}
          />
        </label>

        {/* Quick-select presets */}
        <div className="ban-modal-section">
          <span className="text-sm text-fg-subtle">{t("Quick select")}</span>
          <div className="ban-modal-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`ban-modal-preset${selectedPreset === preset.id ? ' ban-modal-preset-active' : ''}`}
                onClick={() => handlePreset(preset)}
              >
                <Icon name={preset.icon} size="xs" />
                {preset.labelKey ? t(preset.labelKey) : preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Past-date warning */}
        {isDateInPast && (
          <Alert variant="warning" title={t("Unban time is in the past")}>
            {t("Select a future date and time, or use a quick-select preset.")}
          </Alert>
        )}

        {/* Custom date/time (hidden when permanent) */}
        {!permanent && (
          <div className="ban-modal-section">
            <div className="ban-modal-datetime">
              <DatePicker
                value={date}
                onChange={handleDateChange}
                label={t("Unban date")}
              />
              <TimePicker
                value={time}
                onChange={handleTimeChange}
                label={t("Unban time")}
              />
            </div>
          </div>
        )}
      </div>
    </DialogWrapper>
  )
}

// ---- Public API ----

export function createBanModal(options: {
  title: string
  onSubmit: (reason: string, duration: number) => Promise<void> | void
}) {
  return {
    kind: 'custom' as const,
    render: () => <BanModalInner {...options} />,
  }
}
