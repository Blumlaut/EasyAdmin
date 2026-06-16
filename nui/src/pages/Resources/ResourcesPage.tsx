import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Notification, Permissions, ResourceEntry, ResourceMetadata } from '../../types'
import { callLua } from '../../fivem'
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
  onBack?: () => void
}

interface ResourceListResponse {
  resources: ResourceEntry[]
  protected: string
}

interface ResourceMetadataResponse {
  metadata: ResourceMetadata | null
}

const STATE_COLORS: Record<string, string> = {
  started: 'var(--accent-green)',
  stopped: 'var(--accent-red)',
  starting: 'var(--accent-orange)',
  stopping: 'var(--accent-orange)',
  missing: 'var(--text-muted)',
  unknown: 'var(--text-muted)',
}

export function ResourcesPage({
  permissions,
  onToast,
  onSelectResource,
  selectedResource,
  onBack,
}: ResourcesPageProps) {
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  // Detail panel state
  const [detailName, setDetailName] = useState<string | null>(selectedResource ?? null)
  const [detailMetadata, setDetailMetadata] = useState<ResourceMetadata | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const canStart = !!permissions['server.resources.start']
  const canStop = !!permissions['server.resources.stop']

  const fetchResources = useCallback(() => {
    setLoading(true)
    callLua<ResourceListResponse>('requestResources')
      .then((res) => {
        setResources(res.resources ?? [])
      })
      .catch(() => onToast('Failed to fetch resources', 'error'))
      .finally(() => setLoading(false))
  }, [onToast])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Fetch metadata when detailName changes
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

  // Sync with parent-selected resource (nav from outside)
  useEffect(() => {
    if (selectedResource && selectedResource !== detailName) {
      setDetailName(selectedResource)
    }
  }, [selectedResource])

  const filtered = useMemo(() => {
    if (!debouncedQuery) return resources
    const q = debouncedQuery.toLowerCase()
    return resources.filter((r) => r.name.toLowerCase().includes(q))
  }, [resources, debouncedQuery])

  const startedCount = resources.filter((r) => r.state === 'started').length
  const stoppedCount = resources.length - startedCount

  const handleAction = async (name: string, action: 'start' | 'stop' | 'ensure') => {
    if (action === 'start' && !canStart) return
    if ((action === 'stop' || action === 'ensure') && !canStop) return

    try {
      if (action === 'ensure') {
        // Ensure = refresh + stop + start
        await callLua('stopResource', { name })
        await callLua('startResource', { name })
        onToast(`Ensured ${name}`, 'success')
      } else if (action === 'start') {
        await callLua('startResource', { name })
        onToast(`Started ${name}`, 'success')
      } else {
        await callLua('stopResource', { name })
        onToast(`Stopped ${name}`, 'success')
      }
      // Refresh list after action
      fetchResources()
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

  const closeDetail = () => {
    setDetailName(null)
    if (onBack) onBack()
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
        onBack={closeDetail}
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
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchResources}
          disabled={loading}
        >
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
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
  onClick,
}: {
  resource: ResourceEntry
  onClick: () => void
}) {
  const stateColor = STATE_COLORS[resource.state] ?? STATE_COLORS.unknown

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
      <div
        className="shrink-0"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: stateColor,
        }}
        aria-label={`State: ${resource.state}`}
      />
      <div className="list-item-content">
        <div className="list-item-title">{resource.name}</div>
        <div className="list-item-subtitle">
          {resource.state}
          {resource.isProtected ? ' (protected)' : ''}
        </div>
      </div>
      <Icon name="chevron-right" size="xs" className="text-muted opacity-subtle" />
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
  onBack,
}: {
  name: string
  metadata: ResourceMetadata | null
  loading: boolean
  canStart: boolean
  canStop: boolean
  onAction: (action: 'start' | 'stop' | 'ensure') => void
  onBack: () => void
}) {
  const stateColor = STATE_COLORS[metadata?.state ?? 'unknown'] ?? STATE_COLORS.unknown

  // Get the parent resource name from the window (set by FiveM)
  const currentResourceName = typeof window !== 'undefined'
    ? ((window as any).parentResourceName ?? 'EasyAdmin')
    : 'EasyAdmin'
  const isSelf = name === currentResourceName

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
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          aria-label="Go back"
        >
          <Icon name="chevron-left" size="xs" />
          Back
        </button>
        <div
          className="shrink-0"
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: stateColor,
          }}
        />
        <h3 className="text-lg font-semibold text-mono">{name}</h3>
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
              <Icon name="zap" size="xs" />
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
              <Icon name="x" size="xs" />
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
