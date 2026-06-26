import { useTranslation } from '../../../lib/i18n'
import { Icon } from '../../../components/icons'

interface ProfilerErrorBannerProps {
  message: string
}

export function ProfilerErrorBanner({ message }: ProfilerErrorBannerProps) {
  const { t } = useTranslation()
  return (
    <div className="card profiler-card card-danger-border">
      <div className="profiler-error-content">
        <div className="profiler-error-icon-wrap">
          <Icon name="alert-triangle" size="md" className="profiler-error-icon" />
        </div>
        <div className="profiler-error-text">
          <h4 className="profiler-error-title">{t("Profiler Unavailable")}</h4>
          <p className="profiler-error-message">{message}</p>
          <div className="profiler-error-instructions">
            <p className="profiler-error-instruction-label">{t("Add this to your server.cfg:")}</p>
            <code className="profiler-error-code">set ea_profilerEndpoint "127.0.0.1:30120"</code>
            <p className="profiler-error-note">
              Replace <code>30120</code> with your actual server port.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
