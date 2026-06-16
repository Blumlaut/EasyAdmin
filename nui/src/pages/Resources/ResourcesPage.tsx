import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Notification, Permissions, ResourceEntry, ResourceMetadata, ResourceUpdateResult } from '../../types'
import { callLua, on } from '../../fivem'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Icon } from '../../components/icons'

interface ResourcesPageProps {
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
  onSelectResource?: (name: string) => void
  selectedResource?: string | null
}

interface ResourceListResponse {
  resources: ResourceEntry[]
  protected: string
}

interface ResourceMetadataResponse {
  metadata: ResourceMetadata | null
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

export function ResourcesPage({
  permissions,
  onToast,
  onSelectResource,
  selectedResource,
}: ResourcesPageProps) {
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  // Detail panel state
  const [detailName, setDetailName] = useState<string | null>(selectedResource ?? null)
  const [detailMetadata, setDetailMetadata] = useState<ResourceMetadata | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Update check state
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  const canStart = !!permissions['server.resources.start']
  const canStop = !!permissions['server.resources.stop']

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

  const fetchResources = useCallback(() => {
    setLoading(true)
    callLua<ResourceListResponse>('requestResources')
      .then((res) => {
        setResources(res.resources ?? [])
        // After loading resources, fetch batch metadata
        fetchBatchMetadata(res.resources ?? [])
      })
      .catch(() => onToast('Failed to fetch resources', 'error'))
      .finally(() => setLoading(false))
  }, [onToast, fetchBatchMetadata])

  // Initial fetch + event subscriptions (side effects, not render logic)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchResources()

    const unsubResources = on<ResourceListResponse>('updateResources', (payload) => {
      setResources(payload.resources ?? [])
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

  // Fetch metadata when detailName changes
  /* eslint-disable react-hooks/set-state-in-effect */
  // legitimate data fetching effect
  useEffect(() => {
    if (!detailName) {
      setDetailMetadata(null)
      return
    }
    setDetailLoading(true)
    callLua<ResourceMetadataResponse>('requestResourceMetadata', { name: detailName })
      .then((res) => setDetailMetadata(res.metadata ?? null))
      .catch(() => setDetailMetadata(null))
      .finally(() => setDetailLoading(false))
  }, [detailName])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sync with parent-selected resource (nav from outside)
  /* eslint-disable react-hooks/set-state-in-effect */
  // legitimate prop-to-state sync effect
  useEffect(() => {
    if (selectedResource && selectedResource !== detailName) {
      setDetailName(selectedResource)
    }
  }, [selectedResource, detailName])
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

  const handleAction = async (name: string, action: 'start' | 'stop' | 'ensure') => {
    if (action === 'start' && !canStart) return
    if ((action === 'stop' || action === 'ensure') && !canStop) return

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
      // Refresh metadata if viewing this resource
      if (detailName === name) {
        setDetailLoading(true)
        const res = await callLua<ResourceMetadataResponse>('requestResourceMetadata', { name })
        setDetailMetadata(res.metadata ?? null)
        setDetailLoading(false)
      }
    } catch {
      onToast(`Failed to ${action} ${name}`, 'error')
    }
  }

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
      const outdatedNames = updates.filter((u) => u.outdated).map((u) => u.name)
      if (outdatedNames.length > 0) {
        onToast(`${outdatedNames.length} resource(s) have updates available`, 'info')
      } else {
        onToast('All resources are up to date', 'success')
      }
    } catch {
      onToast('Failed to check for updates', 'error')
    } finally {
      setCheckingUpdates(false)
    }
  }

  // If a detail is open, show the detail view
  if (detailName) {
    return (
      <ResourceDetailView
        name={detailName}
        metadata={detailMetadata}
        loading={detailLoading}
        canStart={canStart}
        canStop={canStop}
        onAction={(action) => handleAction(detailName, action)}
      />
    )
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
        <div className="list">
          {filtered.map((resource) => (
            <ResourceRow
              key={resource.name}
              resource={resource}
              canStart={canStart}
              canStop={canStop}
              onToggle={() => {
                if (resource.state === 'started') {
                  handleAction(resource.name, 'stop')
                } else {
                  handleAction(resource.name, 'start')
                }
              }}
              onClick={() => {
                setDetailName(resource.name)
                onSelectResource?.(resource.name)
              }}
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
  onToggle,
  onClick,
}: {
  resource: ResourceEntry
  canStart: boolean
  canStop: boolean
  onToggle: () => void
  onClick: () => void
}) {
  const isStarted = resource.state === 'started'
  const canToggle = isStarted ? canStop : canStart
  const isSelf = resource.isProtected

  return (
    <div
      className="list-item"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
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
        <button
          className="btn btn-sm shrink-0 mr-1"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          title={isStarted ? `Stop ${resource.name}` : `Start ${resource.name}`}
        >
          <Icon name={isStarted ? 'square' : 'play'} size="xs" />
        </button>
      )}

      <Icon name="chevron-right" size="xs" className="text-muted opacity-subtle shrink-0" />
    </div>
  )
}

// ---- Detail view for a single resource ----

function ResourceDetailView({
  name,
  metadata,
  loading,
  canStart,
  canStop,
  onAction,
}: {
  name: string
  metadata: ResourceMetadata | null
  loading: boolean
  canStart: boolean
  canStop: boolean
  onAction: (action: 'start' | 'stop' | 'ensure') => void
}) {
  // Get the parent resource name from the window (set by FiveM)
  const currentResourceName = typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).parentResourceName as string | undefined ?? 'EasyAdmin')
    : 'EasyAdmin'
  const isSelf = name === currentResourceName

  // Extract key metadata for header display
  const version = metadata?.entries.find((e) => e.key === 'version')?.value
  const description = metadata?.entries.find((e) => e.key === 'description')?.value
  const repository = metadata?.entries.find((e) => e.key === 'repository')?.value

  const metadataRows: KeyValueRow[] = loading
    ? []
    : (metadata?.entries ?? []).map((entry) => ({
        key: entry.key,
        value: entry.value,
        mono: true,
      }))

  // If no metadata entries found, show a message
  if (!loading && metadataRows.length === 0) {
    metadataRows.push({
      key: 'metadata',
      value: <span className="text-muted">No metadata entries found</span>,
    })
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`resource-state-dot resource-state-dot-lg resource-state-dot--${metadata?.state ?? 'unknown'}`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-mono">{name}</h3>
            {version && (
              <span className="text-muted text-sm font-mono shrink-0">v{version}</span>
            )}
            {repository && (
              <a
                href={repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground shrink-0"
                title={repository}
              >
                <Icon name="external-link" size="xs" />
              </a>
            )}
          </div>
          {description && (
            <p className="text-secondary text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card mb-4">
        <p className="section-label mb-3">Actions</p>
        <div className="flex flex-wrap gap-2">
          {canStart && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => onAction('start')}
              disabled={isSelf}
              title={isSelf ? 'Cannot start self' : 'Start resource'}
            >
              <Icon name="play" size="xs" />
              Start
            </button>
          )}
          {canStop && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onAction('stop')}
              disabled={isSelf}
              title={isSelf ? 'Cannot stop EasyAdmin' : 'Stop resource'}
            >
              <Icon name="square" size="xs" />
              Stop
            </button>
          )}
          {canStart && canStop && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onAction('ensure')}
              disabled={isSelf}
              title={isSelf ? 'Cannot ensure self' : 'Refresh + Stop + Start'}
            >
              <Icon name="refresh" size="xs" />
              Ensure
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="card">
        <p className="section-label mb-3">Metadata</p>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2 kv-row-divider">
                <Skeleton width={100} height={14} />
                <Skeleton width="60%" height={14} />
              </div>
            ))}
          </div>
        ) : (
          <KeyValueTable rows={metadataRows} ariaLabel="Resource metadata" />
        )}
      </div>
    </div>
  )
}
