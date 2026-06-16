import { useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import { copyToClipboard } from '../../utils/clipboard'
import type { BanEntry, Notification, Permissions } from '../../types'
import { InputPrompt } from '../../components/InputPrompt'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface BanDetailPageProps {
  banId: string
  ban: BanEntry | null
  ipPrivacy: boolean
  permissions: Permissions
  onBack: () => void
  onToast: (text: string, type?: Notification['type']) => void
  onUnbanned: () => void
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; ban: BanEntry }

export function BanDetailPage({
  banId,
  ban: initialBan,
  ipPrivacy,
  permissions,
  onBack: _onBack,
  onToast,
  onUnbanned,
}: BanDetailPageProps) {
  const canEdit = !!permissions['player.ban.edit']
  const canRemove = !!permissions['player.ban.remove']

  const [state, setState] = useState<DetailState>(
    initialBan ? { status: 'success', ban: initialBan } : { status: 'loading' },
  )
  const [edited, setEdited] = useState<BanEntry | null>(initialBan ?? null)
  const [editing, setEditing] = useState<null | 'reason' | 'name' | 'banner' | 'expire'>(null)
  const [confirmUnban, setConfirmUnban] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch ban detail from server if not provided via props
  useEffect(() => {
    if (initialBan) return // Already have the data
    let cancelled = false
    callLua('getBanById', { banid: banId })
    const unsub = on<{ ban: BanEntry | null }>('banDetail', (data) => {
      if (cancelled) return
      if (data.ban) {
        setState({ status: 'success', ban: data.ban })
        setEdited(data.ban)
      } else {
        setState({ status: 'error' })
      }
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [banId, initialBan])

  // All hooks must run on every render. Compute memoized values unconditionally.
  const visibleIdentifiers = useMemo(() => {
    if (!edited?.identifiers) return []
    return edited.identifiers.filter((id) => {
      if (ipPrivacy && id.split(':')[0] === 'ip') return false
      return true
    })
  }, [edited, ipPrivacy])

  if (state.status === 'loading' || !edited) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton width={48} height={48} circle />
            <div className="flex-1 flex flex-col gap-1">
              <Skeleton width="40%" height={18} />
              <Skeleton width="30%" height={14} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={20} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <div className="empty-state-icon empty-state-icon-red">
            <Icon name="ban" size="lg" className="text-red" />
          </div>
          <p className="text-secondary">Ban not found or failed to load</p>
        </div>
      </div>
    )
  }

  const current = edited

  function applyEdit(field: keyof BanEntry, value: string) {
    setEdited((prev) => (prev ? { ...prev, [field]: value } : prev))
    setEditing(null)
  }

  async function handleSave() {
    if (!edited) return
    setSaving(true)
    try {
      await callLua('editBan', edited)
      onToast('Ban updated', 'success')
    } catch {
      onToast('Failed to save ban', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnban() {
    if (!edited) return
    try {
      await callLua('unbanPlayer', { banid: edited.banid })
      onToast('Player unbanned', 'success')
      setConfirmUnban(false)
      onUnbanned()
    } catch {
      onToast('Failed to unban', 'error')
    }
  }

  function copy(text: string) {
    if (!text) return
    copyToClipboard(text).catch(() => {})
  }

  const rows: KeyValueRow[] = [
    {
      key: 'Ban ID',
      value: current.banid || '—',
      mono: true,
      ...(current.banid
        ? { onClick: () => copy(current.banid), actionLabel: 'Copy' }
        : {}),
    },
    {
      key: 'Reason',
      value: current.reason || '—',
      ...(canEdit
        ? { onClick: () => setEditing('reason'), actionLabel: 'Edit' }
        : {}),
    },
    {
      key: 'Name',
      value: current.name ?? '—',
      ...(canEdit
        ? {
            onClick: () => setEditing('name'),
            actionLabel: 'Edit',
          }
        : {}),
    },
    {
      key: 'Banner',
      value: current.banner ?? '—',
      ...(canEdit
        ? { onClick: () => setEditing('banner'), actionLabel: 'Edit' }
        : {}),
    },
    {
      key: 'Expires',
      value: current.expireString ?? '—',
      ...(canEdit
        ? { onClick: () => setEditing('expire'), actionLabel: 'Edit' }
        : {}),
    },
  ]

  return (
    <div className="page-container">
      <div className="card card-ban">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar avatar-md avatar-ban">
            <Icon name="ban" size="sm" className="text-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {current.name ?? 'Banned player'}
            </h3>
            <p className="text-sm text-muted text-mono">ID: {current.banid}</p>
          </div>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Icon name="check" size="xs" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          )}
        </div>
        <KeyValueTable rows={rows} ariaLabel="Ban details" />
      </div>

      <div className="card">
        <p className="section-label">
          Identifiers
          <span className="text-sm text-muted identifier-count">{visibleIdentifiers.length}</span>
        </p>
        {visibleIdentifiers.length === 0 ? (
          <p className="text-sm text-muted">No identifiers available</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {visibleIdentifiers.map((id) => {
              const [kind, value] = id.split(':')
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 text-mono text-sm identifier-row"
                >
                  <span className="badge badge-default">{kind}</span>
                  <span className="truncate flex-1">{value ?? id}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copy(id)}
                    aria-label={`Copy ${kind}`}
                  >
                    Copy
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {canRemove && (
        <div className="card card-danger-border">
          <p className="section-label section-label-danger">Danger zone</p>
          <button
            className="btn btn-danger btn-full"
            onClick={() => setConfirmUnban(true)}
          >
            <Icon name="trash" size="xs" />
            Unban player
          </button>
        </div>
      )}

      {editing === 'reason' && (
        <InputPrompt
          title="Edit reason"
          label="Ban reason"
          initialValue={current.reason}
          onConfirm={(v) => applyEdit('reason', v)}
          onCancel={() => setEditing(null)}
        />
      )}
      {editing === 'name' && (
        <InputPrompt
          title="Edit name"
          label="Banned player name"
          initialValue={current.name}
          onConfirm={(v) => applyEdit('name', v)}
          onCancel={() => setEditing(null)}
        />
      )}
      {editing === 'banner' && (
        <InputPrompt
          title="Edit banner"
          label="Admin name to display"
          initialValue={current.banner}
          onConfirm={(v) => applyEdit('banner', v)}
          onCancel={() => setEditing(null)}
        />
      )}
      {editing === 'expire' && (
        <InputPrompt
          title="Edit expire"
          label="Unix timestamp (-1 for permanent)"
          initialValue={String(current.expire ?? '')}
          onConfirm={(v) => {
            const num = Number(v)
            applyEdit('expire', String(Number.isFinite(num) ? num : -1))
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {confirmUnban && (
        <ConfirmDialog
          title="Unban player"
          message={`Are you sure you want to unban ${current.name ?? 'this player'}?`}
          confirmLabel="Unban"
          variant="danger"
          onConfirm={handleUnban}
          onCancel={() => setConfirmUnban(false)}
        />
      )}
    </div>
  )
}
