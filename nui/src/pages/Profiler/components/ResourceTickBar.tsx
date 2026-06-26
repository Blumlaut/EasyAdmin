import { useCallback, useEffect, useState } from 'react'
import type { CodeSnippet, ProfilerSnippetError, ProfilerSnippetResult, ResourceTickData, ThreadTickData } from '../../../types'
import { on, callLua } from '../../../fivem'
import { Icon } from '../../../components/icons'
import { ThreadDetailRow } from './ThreadDetailRow'
import { CodeSnippet as CodeSnippetView } from './CodeSnippet'

interface ResourceTickBarProps {
  resource: ResourceTickData
  maxAvgUs: number
}

// Per-thread snippet state
interface SnippetState {
  loading: boolean
  data: CodeSnippet | null
  error: string | null
  filePath: string
  resource: string
}

const initialSnippetState: SnippetState = {
  loading: false,
  data: null,
  error: null,
  filePath: '',
  resource: '',
}

// Color coding thresholds
function getBarColor(avgUs: number): string {
  if (avgUs > 100) return 'var(--accent-red)'
  if (avgUs > 50) return 'var(--accent-orange)'
  if (avgUs > 20) return 'var(--accent-blue)'
  return 'var(--accent-green)'
}

function getBarColorClass(avgUs: number): string {
  if (avgUs > 100) return 'profiler-bar-hot'
  if (avgUs > 50) return 'profiler-bar-elevated'
  if (avgUs > 20) return 'profiler-bar-normal'
  return 'profiler-bar-healthy'
}

export function ResourceTickBar({ resource, maxAvgUs }: ResourceTickBarProps) {
  const [expanded, setExpanded] = useState(false)
  // Map threadId string -> snippet state
  const [snippets, setSnippets] = useState<Record<string, SnippetState>>({})

  // Listen for snippet results
  useEffect(() => {
    return on<ProfilerSnippetResult>('profilerSnippetResult', (data) => {
      setSnippets((prev) => {
        const existing = prev[data.threadId]
        if (!existing) return prev
        return {
          ...prev,
          [data.threadId]: {
            ...existing,
            loading: false,
            data: data.snippet,
            filePath: data.filePath,
            resource: data.resource,
          },
        }
      })
    })
  }, [])

  // Listen for snippet errors
  useEffect(() => {
    return on<ProfilerSnippetError>('profilerSnippetError', (data) => {
      setSnippets((prev) => {
        const existing = prev[data.threadId]
        if (!existing) return prev
        return {
          ...prev,
          [data.threadId]: {
            ...existing,
            loading: false,
            error: data.message,
          },
        }
      })
    })
  }, [])

  const handleThreadExpand = useCallback((idx: number, thread: ThreadTickData) => {
    const threadId = `${thread.filePath}-${thread.lineRange}-${idx}`
    setSnippets((prev) => {
      const existing = prev[threadId]
      // Already loaded or loading — toggle visibility
      if (existing && (existing.data || existing.loading)) {
        if (existing.data) {
          // Close the snippet
          return {
            ...prev,
            [threadId]: { ...existing, data: null },
          }
        }
        return prev // Still loading, don't re-trigger
      }
      // Start loading
      callLua('profilerGetSnippet', { threadId, label: thread.label }).catch(() => {})
      return {
        ...prev,
        [threadId]: { ...initialSnippetState, loading: true },
      }
    })
  }, [])

  const handleCloseSnippet = useCallback((idx: number, thread: ThreadTickData) => {
    const threadId = `${thread.filePath}-${thread.lineRange}-${idx}`
    setSnippets((prev) => {
      const existing = prev[threadId]
      if (!existing) return prev
      return {
        ...prev,
        [threadId]: { ...existing, data: null, error: null },
      }
    })
  }, [])

  const barColor = getBarColor(resource.avgUs)
  const barColorClass = getBarColorClass(resource.avgUs)
  const barWidth = maxAvgUs > 0 ? Math.max((resource.avgUs / maxAvgUs) * 100, 2) : 2

  const hasThreads = resource.threads.length > 0

  // Tooltip info
  const tooltip = `Ticks: ${resource.tickCount}, Max: ${resource.maxUs.toFixed(1)}μs, Min: ${resource.minUs.toFixed(1)}μs`

  return (
    <div className="profiler-resource-row">
      {/* Main row */}
      <button
        className="profiler-resource-header"
        onClick={() => setExpanded(!expanded)}
        title={tooltip}
        aria-expanded={expanded}
      >
        {/* Resource name */}
        <span className="profiler-resource-name" title={resource.name}>
          {resource.name}
        </span>

        {/* Bar */}
        <div className="profiler-bar-track">
          <div
            className={`profiler-bar-fill ${barColorClass}`}
            // eslint-disable-next-line nui/no-inline-styles
            style={{
              width: `${barWidth}%`,
              background: barColor,
            }}
          />
        </div>

        {/* Stats */}
        <div className="profiler-resource-stats">
          <span className="profiler-resource-avg" title={`Average tick time: ${resource.avgUs.toFixed(1)}μs`}>
            {resource.avgUs.toFixed(1)}μs
          </span>
          <span
            className={`badge ${barColorClass === 'profiler-bar-hot' ? 'badge-danger' : barColorClass === 'profiler-bar-elevated' ? 'badge-warning' : 'badge-default'}`}
            title={`This resource uses ${resource.pctOfTotal.toFixed(1)}% of total server tick time`}
          >
            {resource.pctOfTotal.toFixed(1)}%
          </span>
        </div>

        {/* Expand chevron */}
        {hasThreads && (
          <Icon
            name="chevron-down"
            size="xs"
            className={`profiler-expand-chevron${expanded ? ' profiler-expand-chevron-open' : ''}`}
          />
        )}
      </button>

      {/* Thread details (expandable) */}
      {expanded && hasThreads && (
        <div className="profiler-threads-list">
          {resource.threads.map((thread, idx) => {
            const threadId = `${thread.filePath}-${thread.lineRange}-${idx}`
            const state = snippets[threadId] ?? initialSnippetState

            return (
              <ThreadDetailRow
                key={threadId}
                thread={thread}
                snippetLoading={state.loading}
                snippetError={state.error}
                onExpand={() => handleThreadExpand(idx, thread)}
              >
                {state.data && (
                  <CodeSnippetView
                    snippet={state.data}
                    filePath={state.filePath || thread.filePath}
                    resource={state.resource || thread.resource}
                    onClose={() => handleCloseSnippet(idx, thread)}
                  />
                )}
              </ThreadDetailRow>
            )
          })}
        </div>
      )}
    </div>
  )
}
