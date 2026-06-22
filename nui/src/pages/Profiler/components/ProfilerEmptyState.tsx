import { Icon } from '../../../components/icons'
import { SelectMenu, type SelectMenuItem } from '../../../components/SelectMenu'
import { useTranslation } from '../../../lib/i18n'

interface ProfilerEmptyStateProps {
  onFrameChange: (frames: number) => void
  onStart: () => void
  frameOptions: { value: string; label: string; hint?: string }[]
  framesSelected: boolean
}

export function ProfilerEmptyState({
  onFrameChange,
  onStart,
  frameOptions,
  framesSelected,
}: ProfilerEmptyStateProps) {
  const { t } = useTranslation()
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

        <h3 className="profiler-empty-title">{t("Profile your server")}</h3>
        <p className="profiler-empty-description">
          {t("Capture a snapshot of resource tick times to identify which scripts are using the most server CPU.")}
        </p>

        <div className="profiler-controls">
          <SelectMenu
            items={selectItems}
            onChange={handleSelect}
            ariaLabel={t("Number of frames to record")}
          />

          <button
            className="btn btn-primary btn-lg profiler-start-btn"
            onClick={onStart}
            disabled={!framesSelected}
            title={
              framesSelected
                ? t("Triggers a server-side profiler recording. Results appear below when complete.")
                : t("Select a frame count to record first")
            }
          >
            <Icon name="play" size="sm" />
            {t("Start Profile")}
          </button>
        </div>
      </div>
    </div>
  )
}
