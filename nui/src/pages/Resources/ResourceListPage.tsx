import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import type { Permissions, ResourceEntry, ResourceMetadata, ResourceUpdateResult } from '../../types'
import { callLua, on } from '../../fivem'
import { notify } from '../../lib/notify'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { useModalContext } from '../../ModalContext'
import { useTranslation } from '../../lib/i18n'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { Alert } from '../../components/Alert'
import { CopyButton } from '../../components/CopyButton'
import { Icon } from '../../components/icons'
import { ListItem } from '../../components/ListItem'
import { createConfirmModal, runModalAction } from '../../modals/helpers'

interface ResourceListPageProps {
  permissions: Permissions
  onSelectResource: (name: string) => void
}

interface ResourceListResponse {
  resources: ResourceEntry[]
  protected: string
}

interface ResourceMetadataBatchResponse {
  metadata: ResourceMetadata[]
}

interface ResourceUpdatesResponse {
  updates: ResourceUpdateResult[]
}

// Truncate description to max chars
const MAX_DESC_LENGTH = 80

function truncateDesc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export function ResourceListPage({
  permissions,
  onSelectResource,
}: ResourceListPageProps) {
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  // Update check state
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [outdatedResources, setOutdatedResources] = useState<
    { name: string; current: string; latest: string }[]
  >([])

  const canStart = !!permissions['server.resources.start']
  const canStop = !!permissions['server.resources.stop']
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  // Fetch metadata for all resources (batch) to populate version/description/repository
  const fetchBatchMetadata = useCallback(async (resList: ResourceEntry[]) => {
    const names = resList.map((r) => r.name)
    try {
      const res = await callLua<ResourceMetadataBatchResponse>('requestResourceMetadataBatch', { names })
      const metadataList = res.metadata ?? []
      // Merge metadata summaries into resources
      setResources((prev) =>
        prev.map((r) => {
          const meta = metadataList.find((m) => m.name === r.name)
          if (!meta) return r
          const version = meta.entries.find((e) => e.key === 'version')?.value
          const description = meta.entries.find((e) => e.key === 'description')?.value
          const repository = meta.entries.find((e) => e.key === 'repository')?.value
          return {
            ...r,
            version: version || r.version,
            description: description || r.description,
            repository: repository || r.repository,
          }
        }),
      )
    } catch {
      // Silent fail - metadata is nice-to-have
    }
  }, [])

  // Build outdated resources list from a resource array
  const buildOutdatedList = useCallback((resList: ResourceEntry[]) => {
    return resList
      .filter((r) => r.outdated && r.latestVersion)
      .map((r) => ({
        name: r.name,
        current: r.version ?? '?',
        latest: r.latestVersion ?? '?',
      }))
  }, [])

  const fetchResources = useCallback(() => {
    setLoading(true)
    callLua<ResourceListResponse>('requestResources')
      .then((res) => {
        setResources(res.resources ?? [])
        // Populate outdated list from cached server data
        setOutdatedResources(buildOutdatedList(res.resources ?? []))
        // After loading resources, fetch batch metadata
        fetchBatchMetadata(res.resources ?? [])
      })
      .catch(() => notify(t('Failed to fetch resources'), 'error'))
      .finally(() => setLoading(false))
  }, [fetchBatchMetadata, buildOutdatedList, t])

  // Initial fetch + event subscriptions (side effects, not render logic)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchResources()

    const unsubResources = on<ResourceListResponse>('updateResources', (payload) => {
      setResources(payload.resources ?? [])
      setOutdatedResources(buildOutdatedList(payload.resources ?? []))
      fetchBatchMetadata(payload.resources ?? [])
    })
    return () => {
      unsubResources()
    }
  }, [fetchResources, fetchBatchMetadata, buildOutdatedList])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    if (!debouncedQuery) return resources
    const q = debouncedQuery.toLowerCase()
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
    )
  }, [resources, debouncedQuery])

  const startedCount = resources.filter((r) => r.state === 'started').length
  const stoppedCount = resources.length - startedCount
  const outdatedCount = resources.filter((r) => r.outdated).length
  const listRef = useRef<HTMLDivElement>(null)

  useListKeyboardNav(listRef, filtered.length)

  // Execute a resource action (called after confirmation)
  const executeAction = useCallback(async (name: string, action: 'start' | 'stop' | 'ensure') => {
    try {
      if (action === 'ensure') {
        await callLua('stopResource', { name })
        await callLua('startResource', { name })
      } else if (action === 'start') {
        await callLua('startResource', { name })
      } else {
        await callLua('stopResource', { name })
      }
      // List is refreshed via server push
    } catch {
      throw new Error(t("Failed to {action} {name}", { action, name }))
    }
  }, [t])

  // Show confirmation dialog then execute
  const requestAction = useCallback((name: string, action: 'start' | 'stop' | 'ensure') => {
    if (action === 'start' && !canStart) return
    if ((action === 'stop' || action === 'ensure') && !canStop) return

    const labels: Record<string, { title: string; message: string; confirm: string; variant: 'primary' | 'danger' }> = {
      start: { title: t("Start {name}", { name }), message: t("Are you sure you want to start {name}?", { name }), confirm: t("Start"), variant: 'primary' },
      stop: { title: t("Stop {name}", { name }), message: t("Are you sure you want to stop {name}?", { name }), confirm: t("Stop"), variant: 'danger' },
      ensure: { title: t("Restart {name}", { name }), message: t("Are you sure you want to restart {name}?", { name }), confirm: t("Restart"), variant: 'danger' },
    }
    const label = labels[action]
    openModal(createConfirmModal({
      title: label.title,
      description: label.message,
      submitLabel: label.confirm,
      submitVariant: label.variant,
      onSubmit: async () => {
        await runModalAction({
          action: () => executeAction(name, action),
          closeModal,
          errorMessage: t("Failed to {action} {name}", { action, name }),
        })
      },
    }))
  }, [canStart, canStop, executeAction, openModal, closeModal, t])

  const handleCheckUpdates = async () => {
    if (!canStart && !canStop) return
    const withRepo = resources.filter((r) => r.repository && r.version)
    if (withRepo.length === 0) {
      notify(t('No resources with a repository URL'), 'info')
      return
    }
    setCheckingUpdates(true)
    try {
      const res = await callLua<ResourceUpdatesResponse>('checkResourceUpdates', {
        names: withRepo.map((r) => r.name),
      })
      const updates = res.updates ?? []
      // Merge update results into resources
      setResources((prev) =>
        prev.map((r) => {
          const update = updates.find((u) => u.name === r.name)
          if (!update) return r
          return {
            ...r,
            latestVersion: update.latest,
            outdated: update.outdated,
          }
        }),
      )
      // Build outdated resources list for the alert
      const outdatedList = updates
        .filter((u) => u.outdated && u.latest)
        .map((u) => {
          const res = resources.find((r) => r.name === u.name)
          return {
            name: u.name,
            current: res?.version ?? '?',
            latest: u.latest ?? '?',
          }
        })
      setOutdatedResources(outdatedList)

      const outdatedNames = updates.filter((u) => u.outdated).map((u) => u.name)
      if (outdatedNames.length > 0) {
        notify(t("{count} resource(s) have updates", { count: String(outdatedNames.length) }), 'info')
      } else {
        notify(t('All resources are up to date'), 'success')
        setOutdatedResources([])
      }
    } catch {
      notify(t('Failed to check for updates'), 'error')
    } finally {
      setCheckingUpdates(false)
    }
  }

  return (
    <div className="page-container">
      <div className="mb-3 flex items-center justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t("Search resources...")}
          resultCount={{ shown: filtered.length, total: resources.length }}
          ariaLabel={t("Search resources")}
        />
        <div className="flex gap-2">
          {outdatedCount > 0 && (
            <span className="badge badge-warning self-center text-xs" title={t("{count} resource(s) have updates", { count: String(outdatedCount) })}>
              <Icon name="arrow-up-circle" size="xs" />
              {outdatedCount}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCheckUpdates}
            disabled={checkingUpdates || (!canStart && !canStop)}
            title={t("Check GitHub for latest releases")}
          >
            <Icon name="arrow-up-circle" size="xs" />
            {checkingUpdates ? t("Checking...") : t("Updates")}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchResources}
            disabled={loading}
          >
            <Icon name="refresh" size="xs" />
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="mb-3 flex gap-2">
        <span className="badge badge-started">
          {t("{count} started", { count: String(startedCount) })}
        </span>
        <span className="badge badge-stopped">
          {t("{count} stopped", { count: String(stoppedCount) })}
        </span>
      </div>

      {/* Update available alert */}
      {outdatedResources.length > 0 && (
        <Alert
          variant="warning"
          title={t("{count} resource(s) have updates", { count: String(outdatedResources.length) })}
          onDismiss={() => setOutdatedResources([])}
        >
          <div className="flex flex-col gap-1">
            {outdatedResources.map((r) => (
              <span
                key={r.name}
                className="resource-link"
                role="button"
                tabIndex={0}
                onClick={() => onSelectResource(r.name)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectResource(r.name); } }}
              >
                <span className="text-mono font-medium">{r.name}</span>
                {' '}
                <span className="text-fg-muted">v{r.current} → v{r.latest}</span>
              </span>
            ))}
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="list-item">
              <div className="list-item-content flex flex-col gap-1">
                <Skeleton width="40%" height={14} />
                <Skeleton width="20%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Icon name="layers" size="lg" className="text-fg-muted" />
          </div>
          <p className="text-fg-subtle">
            {resources.length === 0
              ? t("No resources found")
              : t("No resources match your search")}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="list">
          {filtered.map((resource) => (
            <ResourceRow
              key={resource.name}
              resource={resource}
              canStart={canStart}
              canStop={canStop}
              onRequestAction={(action) => requestAction(resource.name, action)}
              onClick={() => onSelectResource(resource.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Resource row in the list ----

function ResourceRow({
  resource,
  canStart,
  canStop,
  onRequestAction,
  onClick,
}: {
  resource: ResourceEntry
  canStart: boolean
  canStop: boolean
  onRequestAction: (action: 'start' | 'stop' | 'ensure') => void
  onClick: () => void
}) {
  const { t } = useTranslation()
  const isStarted = resource.state === 'started'
  const canToggle = isStarted ? canStop : canStart
  const isSelf = resource.isProtected

  return (
    <ListItem onClick={onClick}>
      {/* State indicator */}
      <div
        className={`resource-state-dot resource-state-dot--${resource.state}`}
        aria-label={t("State: {state}", { state: resource.state })}
      />

      {/* Content */}
      <div className="list-item-content min-w-0">
        <div className="flex items-center gap-2">
          <span className="list-item-title truncate">{resource.name}</span>
          {resource.version && (
            <span
              className={`badge shrink-0 ${resource.outdated ? 'badge-warning' : ''}`}
              title={
                resource.outdated && resource.latestVersion
                  ? t("Update available: v{version}", { version: resource.latestVersion })
                  : `v${resource.version}`
              }
            >
              {resource.outdated && resource.latestVersion ? (
                <>
                  <Icon name="arrow-up-circle" size="xs" />
                  v{resource.version}
                </>
              ) : (
                `v${resource.version}`
              )}
            </span>
          )}
          {resource.repository && (
            <CopyButton
              value={resource.repository}
              label={t("Copy")}
              ariaLabel={t("Copy repository URL")}
              onCopy={() => notify(t('Repository URL copied'), 'success')}
            />
          )}
        </div>
        {resource.description && (
          <div className="list-item-subtitle truncate" title={resource.description}>
            {truncateDesc(resource.description, MAX_DESC_LENGTH)}
          </div>
        )}
      </div>

      {/* Inline action button */}
      {canToggle && !isSelf && (
        isStarted && canStart && canStop ? (
          <div
            className="btn-split mr-1 shrink-0"
          >
            <button
              className="btn-split-half btn-split-half--restart"
              onClick={(e) => {
                e.stopPropagation()
                onRequestAction('ensure')
              }}
              title={t("Restart {name}", { name: resource.name })}
            >
              <Icon name="refresh" size="xs" />
            </button>
            <button
              className="btn-split-half btn-split-half--stop"
              onClick={(e) => {
                e.stopPropagation()
                onRequestAction('stop')
              }}
              title={t("Stop {name}", { name: resource.name })}
            >
              <Icon name="square" size="xs" />
            </button>
          </div>
        ) : (
          <button
            className={`btn btn-sm mr-1 shrink-0 ${isStarted ? 'btn-danger' : 'btn-success'}`}
            onClick={(e) => {
              e.stopPropagation()
              onRequestAction(isStarted ? 'stop' : 'start')
            }}
            title={isStarted ? `Stop ${resource.name}` : `Start ${resource.name}`}
          >
            <Icon name={isStarted ? 'square' : 'play'} size="xs" />
          </button>
        )
      )}

      <Icon name="chevron-right" size="xs" className="opacity-subtle shrink-0 text-fg-muted" />
    </ListItem>
  )
}
