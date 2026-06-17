import type { ThreadTickData } from '../../../types'

interface ThreadDetailRowProps {
  thread: ThreadTickData
}

export function ThreadDetailRow({ thread }: ThreadDetailRowProps) {
  // Parse line range for display
  const lineDisplay = thread.lineRange.replace('..', '-')

  return (
    <div
      className="profiler-thread-row"
      title={`This code block ran for ${thread.durationUs.toFixed(1)}μs. File: ${thread.resource}/${thread.filePath}, lines ${thread.lineRange}`}
    >
      <span className="profiler-thread-icon">📄</span>
      <span className="profiler-thread-file" title={`${thread.resource}/${thread.filePath}`}>
        {thread.filePath}:{lineDisplay}
      </span>
      <span className="profiler-thread-duration">{thread.durationUs.toFixed(1)}μs</span>
    </div>
  )
}
