import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConvarEntry } from '../../types'
import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { useModalContext } from '../../ModalContext'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'
import { SearchBar } from '../../components/SearchBar'
import { Icon } from '../../components/icons'
import { Skeleton } from '../../components/Skeleton'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

interface ServerConvarsProps {
  permissions: Permissions
}

export function ServerConvars({ permissions }: ServerConvarsProps) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  const [convars, setConvars] = useState<ConvarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [refreshing, setRefreshing] = useState(false)

  const canEdit = !!permissions['server.convars']
  const listRef = useRef<HTMLDivElement>(null)

  const fetchConvars = useCallback(() => {
    setRefreshing(true)
    callLua<ConvarEntry[]>('requestConvars')
      .then((result) => {
        setConvars(result)
      })
      .catch(() => notify(t('Failed to fetch convars'), 'error'))
      .finally(() => {
        setRefreshing(false)
        setLoading(false)
      })
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    fetchConvars()
  }, [fetchConvars])

  // Filter by search query
  const filtered = useMemo(() => {
    if (!debouncedQuery) return convars
    const q = debouncedQuery.toLowerCase()
    return convars.filter(
      (c) =>
        c.key.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.value ?? '').toLowerCase().includes(q),
    )
  }, [convars, debouncedQuery])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ConvarEntry[]> = {}
    for (const c of filtered) {
      if (!groups[c.category]) groups[c.category] = []
      groups[c.category].push(c)
    }
    // Sort categories alphabetically
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  useListKeyboardNav(listRef, filtered.length)

  function handleEditConvar(entry: ConvarEntry) {
    const typeLabel = entry.setType === 'setr' ? ' (replicated)' : entry.setType === 'sets' ? ' (server info)' : ''
    openModal(createTextInputModal({
      title: t('Edit Convar: {key}', { key: entry.key }),
      label: `${entry.label}${typeLabel}`,
      placeholder: entry.value ?? '',
      initialValue: entry.value ?? '',
      required: false,
      onSubmit: async (values) => {
        const value = getStringValue(values, 'value')
        await runModalAction({
          action: () => callLua('setConvar', { name: entry.key, value, setType: entry.setType }),
          closeModal,
          successMessage: t('Convar {key} set to "{value}"', { key: entry.key, value }),
          errorMessage: t('Failed to set convar'),
        })
        fetchConvars()
      },
    }))
  }

  function handleCustomConvar() {
    openModal({
      title: t('Set Custom Convar'),
      fields: [
        {
          key: 'name',
          type: 'text',
          label: t('Convar name'),
          placeholder: t('my_convar'),
          required: true,
        },
        {
          key: 'value',
          type: 'text',
          label: t('Value'),
          placeholder: t('my_value'),
          required: false,
        },
      ],
      onSubmit: async (values) => {
        const name = typeof values.name === 'string' ? values.name.trim() : ''
        const value = typeof values.value === 'string' ? values.value.trim() : ''
        if (!name) return
        await runModalAction({
          action: () => callLua('setConvar', { name, value }),
          closeModal,
          successMessage: t('Convar set'),
          errorMessage: t('Failed to set convar'),
        })
      },
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label mb-0">{t("ConVars")}</p>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleCustomConvar}
              title={t("Set a convar not in the list")}
            >
              <Icon name="plus" size="xs" />
              {t("Custom")}
            </button>
          )}
          <button
            className="btn btn-ghost btn-xs"
            onClick={fetchConvars}
            disabled={loading || refreshing}
            title={t("Refresh")}
          >
            <Icon name="refresh" size="xs" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t("Search convars...")}
          resultCount={convars.length > 0 ? { shown: filtered.length, total: convars.length } : undefined}
          ariaLabel={t("Search convars")}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="convar-row">
              <Skeleton width="35%" height={14} />
              <Skeleton width="25%" height={14} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state py-4 text-center">
          <p className="text-sm text-fg-muted">
            {convars.length === 0
              ? t("No convars loaded")
              : t("No convars match your search")}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="convar-list">
          {grouped.map(([category, entries]) => (
            <div key={category}>
              <p className="convar-category">{category}</p>
              {entries.map((entry) => (
                <div
                  key={entry.key}
                  className="convar-row"
                  role={canEdit ? 'button' : undefined}
                  tabIndex={canEdit ? 0 : undefined}
                  onClick={canEdit ? () => handleEditConvar(entry) : undefined}
                  onKeyDown={canEdit
                    ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEditConvar(entry); } }
                    : undefined
                  }
                >
                  <span className="convar-row-key" title={entry.key}>
                    {entry.key}
                  </span>
                  {entry.setType && entry.setType !== 'set' && (
                    <span
                      className={`convar-type-badge convar-type-badge--${entry.setType}`}
                      title={entry.setType === 'setr' ? t('Replicated to clients') : t('Server info (visible in browser)')}
                    >
                      {entry.setType}
                    </span>
                  )}
                  <span className="convar-row-value" title={entry.value ?? ''}>
                    {entry.value ?? <span className="text-fg-muted">—</span>}
                  </span>
                  {canEdit && (
                    <Icon
                      name="edit"
                      size="xs"
                      className="convar-row-edit shrink-0 text-fg-muted"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
