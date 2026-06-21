import { useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { BanEntry, Permissions } from '../../types'
import { notify } from '../../lib/notify'
import { useModalContext } from '../../ModalContext'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'
import { CopyButton } from '../../components/CopyButton'
import { createConfirmModal, createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'

interface BanDetailPageProps {
  banId: string
  ban: BanEntry | null
  ipPrivacy: boolean
  permissions: Permissions
  onBack: () => void
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
  onBack,
}: BanDetailPageProps) {
  const canEdit = !!permissions['player.ban.edit']
  const canRemove = !!permissions['player.ban.remove']
  const { openModal, closeModal } = useModalContext()

  const [state, setState] = useState<DetailState>(
    initialBan ? { status: 'success', ban: initialBan } : { status: 'loading' },
  )
  const [edited, setEdited] = useState<BanEntry | null>(initialBan ?? null)
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

  function handleEditField(field: 'reason' | 'name' | 'banner' | 'expire') {
    const currentValue = field === 'expire' ? String(current.expire ?? '') : String(current[field] ?? '')
    const fieldLabels: Record<string, { title: string; label: string; placeholder: string }> = {
      reason: { title: 'Edit reason', label: 'Ban reason', placeholder: 'Enter ban reason...' },
      name: { title: 'Edit name', label: 'Banned player name', placeholder: 'Enter player name...' },
      banner: { title: 'Edit banner', label: 'Admin name to display', placeholder: 'Enter admin name...' },
      expire: { title: 'Edit expire', label: 'Unix timestamp (-1 for permanent)', placeholder: '-1' },
    }
    const config = fieldLabels[field]
    openModal(createTextInputModal({
      title: config.title,
      label: config.label,
      placeholder: config.placeholder,
      initialValue: currentValue,
      onSubmit: async (values) => {
        const raw = getStringValue(values, 'value')
        const value = field === 'expire'
          ? String(Number.isFinite(Number(raw)) ? Number(raw) : -1)
          : raw
        setEdited((prev) => (prev ? { ...prev, [field]: value } : prev))
        closeModal()
      },
    }))
  }

  async function handleSave() {
    if (!edited) return
    setSaving(true)
    try {
      await callLua('editBan', edited)
      notify('Ban updated', 'success')
    } catch {
      notify('Failed to save ban', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleUnban() {
    if (!edited) return
    openModal(createConfirmModal({
      title: 'Unban player',
      description: `Are you sure you want to unban ${edited.name ?? 'this player'}?`,
      submitLabel: 'Unban',
      submitVariant: 'danger',
      onSubmit: async () => {
        await runModalAction({
          action: () => callLua('unbanPlayer', { banid: edited.banid }),
          closeModal,
          successMessage: 'Player unbanned',
          errorMessage: 'Failed to unban',
          onSuccess: onBack,
        })
      },
    }))
  }

  const rows: KeyValueRow[] = [
    {
      key: 'Ban ID',
      value: current.banid || '—',
      mono: true,
      ...(current.banid
        ? { actionLabel: <CopyButton value={current.banid} ariaLabel="Copy ban ID" /> }
        : {}),
    },
    {
      key: 'Reason',
      value: current.reason || '—',
      ...(canEdit
        ? { onClick: () => handleEditField('reason'), actionLabel: 'Edit' }
        : {}),
    },
    {
      key: 'Name',
      value: current.name ?? '—',
      ...(canEdit
        ? {
            onClick: () => handleEditField('name'),
            actionLabel: 'Edit',
          }
        : {}),
    },
    {
      key: 'Banner',
      value: current.banner ?? '—',
      ...(canEdit
        ? { onClick: () => handleEditField('banner'), actionLabel: 'Edit' }
        : {}),
    },
    {
      key: 'Expires',
      value: current.expireString ?? '—',
      ...(canEdit
        ? { onClick: () => handleEditField('expire'), actionLabel: 'Edit' }
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
                  <CopyButton value={id} ariaLabel={`Copy ${kind}`} />
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
            onClick={handleUnban}
          >
            <Icon name="trash" size="xs" />
            Unban player
          </button>
        </div>
      )}
    </div>
  )
}
