import { useState } from 'react'
import type { ResourceTickData } from '../../../types'
import { Icon } from '../../../components/icons'
import { ThreadDetailRow } from './ThreadDetailRow'

interface ResourceTickBarProps {
  resource: ResourceTickData
  maxAvgUs: number
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
          {resource.threads.map((thread, idx) => (
            <ThreadDetailRow
              key={`${thread.filePath}-${thread.lineRange}-${idx}`}
              thread={thread}
            />
          ))}
        </div>
      )}
    </div>
  )
}
