import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import type { Notification, Permissions, ResourceEntry, ResourceMetadata, ResourceUpdateResult } from '../../types'
import { callLua, on } from '../../fivem'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { useModalContext } from '../../ModalContext'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { Alert } from '../../components/Alert'
import { Icon } from '../../components/icons'
import { ListItem } from '../../components/ListItem'
import { createConfirmModal, runModalAction } from '../../modals/helpers'

interface ResourceListPageProps {
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
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
  onToast,
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
        latest: r.latestVersion!,
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
      .catch(() => onToast('Failed to fetch resources', 'error'))
      .finally(() => setLoading(false))
  }, [onToast, fetchBatchMetadata, buildOutdatedList])

  // Initial fetch + event subscriptions (side effects, not render logic)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchResources()

    const unsubResources = on<ResourceListResponse>('updateResources', (payload) => {
      setResources(payload.resources ?? [])
      setOutdatedResources(buildOutdatedList(payload.resources ?? []))
      fetchBatchMetadata(payload.resources ?? [])
    })
    const unsubToast = on<Notification>('notification', (payload) => {
      onToast(payload.text, payload.type)
    })

    return () => {
      unsubResources()
      unsubToast()
    }
  }, [fetchResources, fetchBatchMetadata, onToast])
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
      throw new Error(`Failed to ${action} ${name}`)
    }
  }, [])

  // Show confirmation dialog then execute
  const requestAction = useCallback((name: string, action: 'start' | 'stop' | 'ensure') => {
    if (action === 'start' && !canStart) return
    if ((action === 'stop' || action === 'ensure') && !canStop) return

    const labels: Record<string, { title: string; message: string; confirm: string; variant: 'primary' | 'danger' }> = {
      start: { title: `Start ${name}`, message: `Are you sure you want to start ${name}?`, confirm: 'Start', variant: 'primary' },
      stop: { title: `Stop ${name}`, message: `Are you sure you want to stop ${name}?`, confirm: 'Stop', variant: 'danger' },
      ensure: { title: `Restart ${name}`, message: `Are you sure you want to restart ${name}?`, confirm: 'Restart', variant: 'danger' },
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
          onToast,
          closeModal,
          errorMessage: `Failed to ${action} ${name}`,
        })
      },
    }))
  }, [canStart, canStop, executeAction, openModal, closeModal, onToast])

  const handleCheckUpdates = async () => {
    if (!canStart && !canStop) return
    const withRepo = resources.filter((r) => r.repository && r.version)
    if (withRepo.length === 0) {
      onToast('No resources with a repository URL', 'info')
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
            latest: u.latest!,
          }
        })
      setOutdatedResources(outdatedList)

      const outdatedNames = updates.filter((u) => u.outdated).map((u) => u.name)
      if (outdatedNames.length > 0) {
        onToast(`${outdatedNames.length} resource(s) have updates available`, 'info')
      } else {
        onToast('All resources are up to date', 'success')
        setOutdatedResources([])
      }
    } catch {
      onToast('Failed to check for updates', 'error')
    } finally {
      setCheckingUpdates(false)
    }
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search resources..."
          resultCount={{ shown: filtered.length, total: resources.length }}
          ariaLabel="Search resources"
        />
        <div className="flex gap-2">
          {outdatedCount > 0 && (
            <span className="badge badge-warning text-xs self-center" title={`${outdatedCount} resource(s) have updates`}>
              <Icon name="arrow-up-circle" size="xs" />
              {outdatedCount}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCheckUpdates}
            disabled={checkingUpdates || (!canStart && !canStop)}
            title="Check GitHub for latest releases"
          >
            <Icon name="arrow-up-circle" size="xs" />
            {checkingUpdates ? 'Checking...' : 'Updates'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchResources}
            disabled={loading}
          >
            <Icon name="refresh" size="xs" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 mb-3">
        <span className="badge badge-started">
          {startedCount} started
        </span>
        <span className="badge badge-stopped">
          {stoppedCount} stopped
        </span>
      </div>

      {/* Update available alert */}
      {outdatedResources.length > 0 && (
        <Alert
          variant="warning"
          title={`${outdatedResources.length} resource(s) have updates available`}
          onDismiss={() => setOutdatedResources([])}
        >
          <div className="flex flex-col gap-1">
            {outdatedResources.map((r) => (
              <button
                key={r.name}
                className="text-sm hover:underline text-left cursor-pointer p-0 bg-none border-none"
                onClick={() => onSelectResource(r.name)}
              >
                <span className="font-medium text-mono">{r.name}</span>
                {' '}
                <span className="text-muted">v{r.current} → v{r.latest}</span>
              </button>
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
            <Icon name="layers" size="lg" className="text-muted" />
          </div>
          <p className="text-secondary">
            {resources.length === 0
              ? 'No resources found'
              : 'No resources match your search'}
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
  const isStarted = resource.state === 'started'
  const canToggle = isStarted ? canStop : canStart
  const isSelf = resource.isProtected

  return (
    <ListItem onClick={onClick}>
      {/* State indicator */}
      <div
        className={`resource-state-dot resource-state-dot--${resource.state}`}
        aria-label={`State: ${resource.state}`}
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
                  ? `Update available: v${resource.latestVersion}`
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
            <a
              href={resource.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground shrink-0"
              title={resource.repository}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="external-link" size="xs" />
            </a>
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
            className="btn-split shrink-0 mr-1"
          >
            <button
              className="btn-split-half btn-split-half--restart"
              onClick={(e) => {
                e.stopPropagation()
                onRequestAction('ensure')
              }}
              title={`Restart ${resource.name}`}
            >
              <Icon name="refresh" size="xs" />
            </button>
            <button
              className="btn-split-half btn-split-half--stop"
              onClick={(e) => {
                e.stopPropagation()
                onRequestAction('stop')
              }}
              title={`Stop ${resource.name}`}
            >
              <Icon name="square" size="xs" />
            </button>
          </div>
        ) : (
          <button
            className={`btn btn-sm shrink-0 mr-1 ${isStarted ? 'btn-danger' : 'btn-success'}`}
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

      <Icon name="chevron-right" size="xs" className="text-muted opacity-subtle shrink-0" />
    </ListItem>
  )
}
