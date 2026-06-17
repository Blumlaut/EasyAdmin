import { Icon } from '../../../components/icons'
import { SelectMenu, type SelectMenuItem } from '../../../components/SelectMenu'

interface ProfilerEmptyStateProps {
  onFrameChange: (frames: number) => void
  onStart: () => void
  frameOptions: { value: string; label: string; hint?: string }[]
}

export function ProfilerEmptyState({
  onFrameChange,
  onStart,
  frameOptions,
}: ProfilerEmptyStateProps) {
  const selectItems: SelectMenuItem[] = frameOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  const handleSelect = (item: SelectMenuItem) => {
    onFrameChange(parseInt(item.value, 10))
  }

  return (
    <div className="card profiler-card profiler-empty-state">
      <div className="profiler-empty-content">
        <div className="profiler-empty-icon-wrap">
          <Icon name="activity" size="lg" className="profiler-empty-icon" />
        </div>

        <h3 className="profiler-empty-title">Profile your server</h3>
        <p className="profiler-empty-description">
          Capture a snapshot of resource tick times to identify which scripts are using the most server CPU.
        </p>

        <div className="profiler-controls">
          <SelectMenu
            items={selectItems}
            onChange={handleSelect}
            ariaLabel="Number of frames to record"
          />

          <button
            className="btn btn-primary btn-lg profiler-start-btn"
            onClick={onStart}
            title="Triggers a server-side profiler recording. Results appear below when complete."
          >
            <Icon name="play" size="sm" />
            Start Profile
          </button>
        </div>
      </div>
    </div>
  )
}
