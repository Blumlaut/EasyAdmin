import { useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { BanEntry, Permissions } from '../../types'
import { notify } from '../../lib/notify'
import { useModalContext } from '../../ModalContext'
import { useTranslation } from '../../lib/i18n'
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
  const { t } = useTranslation()

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
          <div className="mb-3 flex items-center gap-3">
            <Skeleton width={48} height={48} circle />
            <div className="flex flex-1 flex-col gap-1">
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
          <p className="text-fg-subtle">{t("Ban not found or failed to load")}</p>
        </div>
      </div>
    )
  }

  const current = edited

  function handleEditField(field: 'reason' | 'name' | 'banner' | 'expire') {
    const currentValue = field === 'expire' ? String(current.expire ?? '') : String(current[field] ?? '')
    const fieldLabels: Record<string, { title: string; label: string; placeholder: string }> = {
      reason: { title: t('Edit reason'), label: t('Ban reason'), placeholder: t('Enter ban reason...') },
      name: { title: t('Edit name'), label: t('Banned player name'), placeholder: t('Enter player name...') },
      banner: { title: t('Edit banner'), label: t('Admin name to display'), placeholder: t('Enter admin name...') },
      expire: { title: t('Edit expire'), label: t('Unix timestamp (-1 for permanent)'), placeholder: '-1' },
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
      notify(t('Ban updated'), 'success')
    } catch {
      notify(t('Failed to save ban'), 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleUnban() {
    if (!edited) return
    openModal(createConfirmModal({
      title: t('Unban player'),
      description: t("Are you sure you want to unban {name}?", { name: edited.name ?? t('this player') }),
      submitLabel: t('Unban'),
      submitVariant: 'danger',
      onSubmit: async () => {
        await runModalAction({
          action: () => callLua('unbanPlayer', { banid: edited.banid }),
          closeModal,
          successMessage: t('Player unbanned'),
          errorMessage: t('Failed to unban'),
          onSuccess: onBack,
        })
      },
    }))
  }

  const rows: KeyValueRow[] = [
    {
      key: t('Ban ID'),
      value: current.banid || '—',
      mono: true,
      ...(current.banid
        ? { actionLabel: <CopyButton value={current.banid} ariaLabel={t("Copy ban ID")} /> }
        : {}),
    },
    {
      key: t('Reason'),
      value: current.reason || '—',
      ...(canEdit
        ? { onClick: () => handleEditField('reason'), actionLabel: t('Edit') }
        : {}),
    },
    {
      key: t('Name'),
      value: current.name ?? '—',
      ...(canEdit
        ? {
            onClick: () => handleEditField('name'),
            actionLabel: t('Edit'),
          }
        : {}),
    },
    {
      key: t('Banner'),
      value: current.banner ?? '—',
      ...(canEdit
        ? { onClick: () => handleEditField('banner'), actionLabel: t('Edit') }
        : {}),
    },
    {
      key: t('Expires'),
      value: current.expireString ?? '—',
      ...(canEdit
        ? { onClick: () => handleEditField('expire'), actionLabel: t('Edit') }
        : {}),
    },
    ...(current.issuingResource
      ? [
          {
            key: t('Issuing resource'),
            value: current.issuingResource ?? '—',
            mono: true,
          },
        ]
      : []),
  ]

  return (
    <div className="page-container">
      <div className="card card-ban">
        <div className="mb-3 flex items-center gap-3">
          <div className="avatar avatar-md avatar-ban">
            <Icon name="ban" size="sm" className="text-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {current.name ?? t('Banned player')}
            </h3>
            <p className="text-mono text-sm text-fg-muted">ID: {current.banid}</p>
          </div>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Icon name="check" size="xs" />
              {saving ? t('Saving...') : t('Save changes')}
            </button>
          )}
        </div>
        <KeyValueTable rows={rows} ariaLabel="Ban details" />
      </div>

      <div className="card">
        <p className="section-label">
          {t("Identifiers")}
          <span className="identifier-count text-sm text-fg-muted">{visibleIdentifiers.length}</span>
        </p>
        {visibleIdentifiers.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("No identifiers available")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {visibleIdentifiers.map((id) => {
              const [kind, value] = id.split(':')
              return (
                <li
                  key={id}
                  className="text-mono identifier-row flex items-center gap-2 text-sm"
                >
                  <span className="badge badge-default">{kind}</span>
                  <span className="flex-1 truncate">{value ?? id}</span>
                  <CopyButton value={id} ariaLabel={`Copy ${kind}`} />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {canRemove && (
        <div className="card card-danger-border">
          <p className="section-label section-label-danger">{t("Danger zone")}</p>
          <button
            className="btn btn-danger btn-full"
            onClick={handleUnban}
          >
            <Icon name="trash" size="xs" />
            {t("Unban player")}
          </button>
        </div>
      )}
    </div>
  )
}
