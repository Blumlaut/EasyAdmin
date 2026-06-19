import type { ThreadTickData } from '../../../types'

interface ThreadDetailRowProps {
  thread: ThreadTickData
  snippetLoading: boolean
  snippetError: string | null
  onExpand: () => void
  children?: React.ReactNode
}

export function ThreadDetailRow({ thread, snippetLoading, snippetError, onExpand, children }: ThreadDetailRowProps) {
  // Parse line range for display
  const lineDisplay = thread.lineRange.replace('..', '-')

  return (
    <div className="profiler-thread-row-wrapper">
      <button
        className={`profiler-thread-row${snippetLoading ? ' profiler-thread-row--loading' : ''}`}
        title={`This code block ran for ${thread.durationUs.toFixed(1)}μs. File: ${thread.resource}/${thread.filePath}, lines ${thread.lineRange}. Click to view source.`}
        onClick={onExpand}
      >
        <span className="profiler-thread-icon">📄</span>
        <span className="profiler-thread-file" title={`${thread.resource}/${thread.filePath}`}>
          {thread.filePath}:{lineDisplay}
        </span>
        <span className="profiler-thread-duration">{thread.durationUs.toFixed(1)}μs</span>
        <span className="profiler-thread-expand-hint">
          {snippetError ? '⚠' : snippetLoading ? '⏳' : '🔍'}
        </span>
      </button>

      {snippetError && (
        <div className="profiler-thread-error" title={snippetError}>
          {snippetError}
        </div>
      )}

      {children}
    </div>
  )
}
