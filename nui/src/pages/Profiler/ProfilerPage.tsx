import { useCallback, useEffect, useState } from 'react'
import type { ParsedProfile, ProfilerProgress, ProfilerUIState } from '../../types'
import { on, callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { Icon } from '../../components/icons'
import { ProfilerEmptyState } from './components/ProfilerEmptyState'
import { ProfileSummary } from './components/ProfileSummary'
import { ResourceTickBar } from './components/ResourceTickBar'
import { ProfilerErrorBanner } from './components/ProfilerErrorBanner'



// Frame count options for the profiler
const FRAME_OPTIONS = [
  { value: '20', label: '20 frames (~1s)' },
  { value: '50', label: '50 frames (~3s)' },
  { value: '100', label: '100 frames (~5s)' },
  { value: '200', label: '200 frames (~10s)' },
]

export function ProfilerPage() {
  const [uiState, setUiState] = useState<ProfilerUIState>('empty')
  const [profile, setProfile] = useState<ParsedProfile | null>(null)
  const [progress, setProgress] = useState<ProfilerProgress>({
    phase: 'recording',
    message: '',
    percent: 0,
  })
  const [endpointError, setEndpointError] = useState<string | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<number | null>(null)

  // Listen for progress updates from Lua
  useEffect(() => {
    return on<ProfilerProgress>('profilerProgress', (data) => {
      setProgress(data)
      if (data.phase === 'complete') {
        setUiState('results')
      }
    })
  }, [])

  // Listen for profile results from Lua
  useEffect(() => {
    return on<{ profile: ParsedProfile; detection: unknown }>('profilerResult', (data) => {
      setProfile(data.profile)
      setUiState('results')
    })
  }, [])

  // Listen for errors from Lua
  useEffect(() => {
    return on<{ message: string }>('profilerError', (data) => {
      notify(data.message, 'error')
      setUiState('empty')
    })
  }, [])

  // Listen for endpoint discovery errors
  useEffect(() => {
    return on<{ message: string }>('profilerEndpointError', (data) => {
      setEndpointError(data.message)
      setUiState('endpoint-error')
    })
  }, [])

  // Start a new profile capture (blocked until frames are explicitly selected)
  const handleStartProfile = useCallback(() => {
    if (selectedFrames == null) return

    setUiState('recording')
    setProgress({ phase: 'recording', message: 'Starting...', percent: 0 })
    setProfile(null)
    setEndpointError(null)

    callLua('startProfiler', { frames: selectedFrames })
      .catch(() => {
        setUiState('empty')
        notify('Failed to start profiler', 'error')
      })
  }, [selectedFrames])

  // Handle frame count change
  const handleFrameChange = useCallback((frames: number) => {
    setSelectedFrames(frames)
  }, [])

  // Reset to empty state ("New Profile" button from results)
  const handleResetToEmpty = useCallback(() => {
    setUiState('empty')
    setProfile(null)
    setEndpointError(null)
  }, [])

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="page-container">
      {/* Endpoint error banner */}
      {uiState === 'endpoint-error' && endpointError && (
        <ProfilerErrorBanner message={endpointError} />
      )}

      {/* State 0: Empty (no profile captured) */}
      {uiState === 'empty' && (
        <ProfilerEmptyState
          onFrameChange={handleFrameChange}
          onStart={handleStartProfile}
          frameOptions={FRAME_OPTIONS}
          framesSelected={selectedFrames != null}
        />
      )}

      {/* State 1: Recording (progress) */}
      {uiState === 'recording' && (
        <div className="card profiler-card">
          <div className="profiler-progress-container">
            <div className="profiler-progress-header">
              <Icon name="activity" size="md" className="profiler-progress-icon" />
              <span className="profiler-progress-title">Profiling in progress...</span>
            </div>

            <div className="profiler-progress-info">
              <span className="profiler-progress-message">{progress.message}</span>
            </div>

            <div className="profiler-progress-bar-track">
              <div
                className="profiler-progress-bar-fill"
                // eslint-disable-next-line nui/no-inline-styles
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="profiler-progress-percent">{progress.percent}%</div>

            <p className="profiler-progress-hint text-xs text-muted mt-3">
              This typically takes 4-20 seconds depending on frame count. Profiling adds slight overhead during the capture window.
            </p>
          </div>
        </div>
      )}

      {/* State 2: Results */}
      {uiState === 'results' && profile && (
        <>
          {/* Summary cards */}
          <ProfileSummary
            profile={profile}
            onNewProfile={handleResetToEmpty}
          />

          {/* Resource tick times */}
          <div className="card profiler-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Resource Tick Times</h3>
                <p className="text-xs text-muted mt-1">
                  Time each resource spends executing per server frame. Higher = more CPU usage.
                </p>
              </div>
            </div>

            {profile.resources.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon empty-state-icon-blue">
                  <Icon name="activity" size="md" className="text-blue" />
                </div>
                <p className="text-sm text-muted font-medium">No resource tick data found</p>
                <p className="text-xs text-muted mt-1">
                  The server may have been idle during profiling.
                </p>
              </div>
            ) : (
              <div className="profiler-resource-list">
                {profile.resources.map((resource) => (
                  <ResourceTickBar
                    key={resource.name}
                    resource={resource}
                    maxAvgUs={profile.resources[0]?.avgUs ?? 1}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
