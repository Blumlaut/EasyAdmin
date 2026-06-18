import { useEffect, useState, useCallback } from 'react'
import type { Notification, Permissions, ResourceEntry, ResourceMetadata } from '../../types'
import { callLua, on } from '../../fivem'
import { useModalContext } from '../../ModalContext'
import { Alert } from '../../components/Alert'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'
import { createConfirmModal, runModalAction } from '../../modals/helpers'

interface ResourceDetailPageProps {
  resourceName: string
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

interface ResourceListResponse {
  resources: ResourceEntry[]
  protected: string
}

interface ResourceMetadataResponse {
  metadata: ResourceMetadata | null
}

export function ResourceDetailPage({
  resourceName,
  permissions,
  onToast,
}: ResourceDetailPageProps) {
  const canStart = !!permissions['server.resources.start']
  const canStop = !!permissions['server.resources.stop']
  const { openModal, closeModal } = useModalContext()

  // Find the resource entry from the server list
  const [resource, setResource] = useState<ResourceEntry | null>(null)
  const [metadata, setMetadata] = useState<ResourceMetadata | null>(null)
  const [loading, setLoading] = useState(true)

  const isSelf = resource?.isProtected ?? false
  const isStarted = resource?.state === 'started'
  const isTransitioning = resource?.state === 'starting' || resource?.state === 'stopping'

  // Fetch resource list to find this resource's current state
  const fetchResource = useCallback(() => {
    callLua<ResourceListResponse>('requestResources')
      .then((res) => {
        const found = (res.resources ?? []).find((r) => r.name === resourceName)
        setResource(found ?? null)
      })
      .catch(() => setResource(null))
  }, [resourceName])

  // Fetch metadata
  const fetchMetadata = useCallback(() => {
    setLoading(true)
    callLua<ResourceMetadataResponse>('requestResourceMetadata', { name: resourceName })
      .then((res) => setMetadata(res.metadata ?? null))
      .catch(() => setMetadata(null))
      .finally(() => setLoading(false))
  }, [resourceName])

  useEffect(() => {
    fetchResource()
    fetchMetadata()

    const unsubResources = on<ResourceListResponse>('updateResources', (payload) => {
      // Update from event payload directly — no extra Lua round-trip
      const found = (payload.resources ?? []).find((r) => r.name === resourceName)
      setResource(found ?? null)
    })
    const unsubToast = on<Notification>('notification', (payload) => {
      onToast(payload.text, payload.type)
    })

    return () => {
      unsubResources()
      unsubToast()
    }
  }, [resourceName, fetchResource, fetchMetadata, onToast])

  // Execute a resource action (called after confirmation)
  const executeAction = useCallback(async (action: 'start' | 'stop' | 'ensure') => {
    try {
      if (action === 'ensure') {
        await callLua('stopResource', { name: resourceName })
        await callLua('startResource', { name: resourceName })
      } else if (action === 'start') {
        await callLua('startResource', { name: resourceName })
      } else {
        await callLua('stopResource', { name: resourceName })
      }
      // Refresh both resource state and metadata after action
      fetchResource()
      fetchMetadata()
    } catch {
      throw new Error(`Failed to ${action} ${resourceName}`)
    }
  }, [resourceName, fetchResource, fetchMetadata])

  const requestAction = useCallback((action: 'start' | 'stop' | 'ensure') => {
    if (action === 'start' && !canStart) return
    if ((action === 'stop' || action === 'ensure') && !canStop) return

    const labels: Record<string, { title: string; message: string; confirm: string; variant: 'primary' | 'danger' }> = {
      start: { title: `Start ${resourceName}`, message: `Are you sure you want to start ${resourceName}?`, confirm: 'Start', variant: 'primary' },
      stop: { title: `Stop ${resourceName}`, message: `Are you sure you want to stop ${resourceName}?`, confirm: 'Stop', variant: 'danger' },
      ensure: { title: `Restart ${resourceName}`, message: `Are you sure you want to restart ${resourceName}?`, confirm: 'Restart', variant: 'danger' },
    }
    const label = labels[action]
    openModal(createConfirmModal({
      title: label.title,
      description: label.message,
      submitLabel: label.confirm,
      submitVariant: label.variant,
      onSubmit: async () => {
        await runModalAction({
          action: () => executeAction(action),
          onToast,
          closeModal,
          errorMessage: `Failed to ${action} ${resourceName}`,
        })
      },
    }))
  }, [canStart, canStop, executeAction, openModal, closeModal, onToast, resourceName])

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

  // Determine display state
  const displayState = metadata?.state ?? resource?.state ?? 'unknown'

  if (!resource && loading) {
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
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={20} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`resource-state-dot resource-state-dot-lg resource-state-dot--${displayState}`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-mono">{resourceName}</h3>
            {version && (
              <span
                className="text-sm font-mono shrink-0"
                style={resource?.outdated ? { color: 'var(--accent-yellow)' } : undefined}
                title={resource?.outdated && resource?.latestVersion ? `Update available: v${resource.latestVersion}` : undefined}
              >
                {resource?.outdated && resource?.latestVersion ? (
                  <>
                    <Icon name="arrow-up-circle" size="xs" className="inline align-middle mr-0.5" />
                    v{version}
                  </>
                ) : (
                  `v${version}`
                )}
              </span>
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

      {/* Update available alert */}
      {resource?.outdated && resource?.latestVersion && (
        <Alert variant="warning" title="Update available" className="mb-4">
          <div className="flex items-center gap-3 text-sm">
            <span>
              <span className="text-muted">Current:</span>{' '}
              <span className="font-mono">v{version ?? '?'}</span>
            </span>
            <Icon name="arrow-right" size="xs" className="text-muted shrink-0" />
            <span>
              <span className="text-muted">Latest:</span>{' '}
              <span className="font-mono">v{resource.latestVersion}</span>
            </span>
          </div>
        </Alert>
      )}

      {/* Actions */}
      <div className="card mb-4">
        <p className="section-label mb-3">Actions</p>
        <div className="flex flex-wrap gap-2">
          {canStart && !isStarted && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => requestAction('start')}
              disabled={isSelf || isTransitioning}
              title={isSelf ? 'Cannot start self' : 'Start resource'}
            >
              <Icon name="play" size="xs" />
              Start
            </button>
          )}
          {canStop && isStarted && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => requestAction('stop')}
              disabled={isSelf || isTransitioning}
              title={isSelf ? 'Cannot stop self' : 'Stop resource'}
            >
              <Icon name="square" size="xs" />
              Stop
            </button>
          )}
          {canStart && canStop && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => requestAction('ensure')}
              disabled={isSelf || isTransitioning}
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
